import json
import os
import re
import smtplib
from collections import Counter
from datetime import datetime
from email.message import EmailMessage
from io import BytesIO
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.services.case_validation_service import evaluate_actionable_case
from app.services.gemini_service import analyze_incident_intelligence, classify_with_gemini
from app.services.insight_service import generate_insights
from app.services.memory_service import update_pattern_memory
from app.services.openclaw_service import orchestrate_with_openclaw
from app.services.peak_time_service import detect_peak_time_signal
from app.services.reddit_service import fetch_sport_posts
from app.services.rule_engine import extract_domain, score_post
from app.services.scoring_service import combine_scores

router = APIRouter()

SUPPORTED_SPORTS = {"football", "cricket", "basketball"}
# Sport-specific route support for live Reddit monitoring.


class SendReportRequest(BaseModel):
    email: str


def _is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", (email or "").strip()))


def _build_report_pdf_bytes(results: list, summary: dict, insights: dict) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    x_margin = 50
    y = height - 50

    def ensure_space(lines=2):
        nonlocal y
        if y < 70 + (lines * 15):
            pdf.showPage()
            y = height - 50

    def write_line(text: str, size=11, bold=False):
        nonlocal y
        ensure_space(1)
        pdf.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        pdf.drawString(x_margin, y, str(text))
        y -= 16

    def write_wrapped(text: str, max_chars=95, size=10):
        nonlocal y
        chunks = [text[i : i + max_chars] for i in range(0, len(text), max_chars)] or [""]
        for chunk in chunks:
            ensure_space(1)
            pdf.setFont("Helvetica", size)
            pdf.drawString(x_margin, y, chunk)
            y -= 14

    generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    write_line("StreamGuard AI Executive Report", size=18, bold=True)
    write_line(f"Generated: {generated_at}", size=10)
    y -= 4
    write_line("Summary", size=13, bold=True)
    write_line(f"- Total monitored posts: {summary.get('total_posts', 0)}")
    write_line(f"- High-risk incidents: {summary.get('high_risk_posts', 0)}")
    write_line(f"- Average combined risk score: {summary.get('average_combined_risk_score', 0)}")
    write_line(f"- Top suspicious domain: {summary.get('top_suspicious_domain') or 'N/A'}")
    y -= 4
    write_line("AI Insight", size=13, bold=True)
    write_wrapped(insights.get("summary", "No summary available."))
    y -= 4
    write_line("Top Incidents", size=13, bold=True)
    for idx, incident in enumerate(results[:10], start=1):
        domain = incident.get("domain") or incident.get("url") or "Unknown source"
        risk = incident.get("risk_score", incident.get("combined_risk_score", 0))
        reason = incident.get("recommendation_summary") or incident.get("workflow_reason") or "Flagged for review."
        write_wrapped(f"{idx}. {domain} | Risk {risk} | {reason}", max_chars=100, size=10)
        y -= 2

    pdf.save()
    buffer.seek(0)
    return buffer.read()


def _send_report_email(to_email: str, pdf_bytes: bytes, filename: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL") or smtp_user
    smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    if not smtp_host or not smtp_from:
        raise HTTPException(status_code=500, detail="SMTP is not configured on the backend.")

    message = EmailMessage()
    message["Subject"] = "Your StreamGuard AI Report"
    message["From"] = smtp_from
    message["To"] = to_email
    message.set_content(
        (
            "Hello,\n\n"
            "Your StreamGuard AI report is ready and attached as a PDF.\n\n"
            "Thanks,\n"
            "StreamGuard AI"
        )
    )
    message.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=filename,
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            if smtp_use_tls:
                server.starttls()
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(message)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to send email: {exc}") from exc


def _build_score_breakdown(
    rule_analysis: dict,
    gemini_analysis: dict,
    combined_analysis: dict,
    case_validation: dict,
    memory_signals: dict,
) -> dict:
    return {
        "rule_score": rule_analysis.get("rule_score", 0),
        "engagement_score": rule_analysis.get("engagement_score", 0),
        "base_risk_score": rule_analysis.get("base_risk_score", 0),
        "domain_watch_weight": rule_analysis.get("domain_watch_weight", 0),
        "gemini_score": gemini_analysis.get("gemini_score", 0),
        "combined_risk_score": combined_analysis.get("combined_risk_score", 0),
        "confidence_score": combined_analysis.get("confidence_score", 0),
        "evidence_score": case_validation.get("evidence_score", 0),
        "pattern_recurrence_score": memory_signals.get("pattern_recurrence_score", 0),
    }


def _build_tags(rule_analysis: dict, combined_analysis: dict, case_validation: dict, memory_signals: dict) -> list:
    tags = []
    risk_level = combined_analysis.get("combined_risk_level")
    if risk_level:
        tags.append(f"risk:{risk_level.lower()}")
    confidence_label = combined_analysis.get("confidence_label")
    if confidence_label:
        tags.append(f"confidence:{confidence_label}")

    if rule_analysis.get("reasons"):
        tags.append("rule:matched_signals")

    domain = rule_analysis.get("domain")
    if domain:
        tags.append(f"domain:{domain}")
    if case_validation.get("event_relevance"):
        tags.append("event:live_window_relevance")
    if case_validation.get("repeat_incident_signal") or memory_signals.get("watchlist_match"):
        tags.append("memory:repeat_pattern")

    return tags


def _detect_sport(post_text: str) -> str:
    lowered = (post_text or "").lower()
    if any(word in lowered for word in ["football", "soccer", "ucl", "champions league", "el clasico"]):
        return "football"
    if any(word in lowered for word in ["cricket", "ipl", "rcb", "csk"]):
        return "cricket"
    if any(word in lowered for word in ["basketball", "nba", "playoff", "finals"]):
        return "basketball"
    return "unknown"


def _analyze_posts(
    posts: list,
    requested_sport: Optional[str] = None,
    used_fallback: bool = False,
    mode: str = "live",
):
    domain_counts = Counter(
        extract_domain(post.get("url", ""))
        for post in posts
        if extract_domain(post.get("url", "")) and "reddit.com" not in extract_domain(post.get("url", ""))
    )
    results = []
    for post in posts:
        incident_sport = requested_sport or post.get("sport") or _detect_sport(post.get("post_text", ""))
        peak_analysis = detect_peak_time_signal(post.get("post_text", ""), incident_sport, mode=mode)
        rule_analysis = score_post(
            post["post_text"],
            post["url"],
            post["upvotes"],
            post["comments"],
        )
        rule_analysis.update(peak_analysis)
        domain = rule_analysis.get("domain")
        repeated_domain_count = domain_counts.get(domain, 0) if domain else 0
        if domain and repeated_domain_count >= 2:
            rule_analysis["domain_watch_weight"] = int(rule_analysis.get("domain_watch_weight", 0)) + 8
            reasons = rule_analysis.get("reasons", [])
            reasons.append(f"Repeated suspicious domain in current stream: '{domain}'")
            rule_analysis["reasons"] = reasons

        case_validation = evaluate_actionable_case(
            post_text=post.get("post_text", ""),
            url=post.get("url", ""),
            sport=incident_sport,
            event_context=peak_analysis.get("event_context", ""),
            peak_time_signal=bool(peak_analysis.get("peak_time_signal")),
            engagement_score=rule_analysis.get("engagement_score", 0),
            repeated_domain_count=repeated_domain_count,
        )
        memory_signals = update_pattern_memory(domain, case_validation.get("matched_keyword_clusters", []))
        repeated_domain_count = max(repeated_domain_count, memory_signals.get("repeated_domain_count", 0))
        case_validation = evaluate_actionable_case(
            post_text=post.get("post_text", ""),
            url=post.get("url", ""),
            sport=incident_sport,
            event_context=peak_analysis.get("event_context", ""),
            peak_time_signal=bool(peak_analysis.get("peak_time_signal")),
            engagement_score=rule_analysis.get("engagement_score", 0),
            repeated_domain_count=repeated_domain_count,
        )
        case_validation["watchlist_match"] = memory_signals.get("watchlist_match", False)
        case_validation["repeated_domain_count"] = repeated_domain_count
        case_validation["pattern_recurrence_score"] = memory_signals.get("pattern_recurrence_score", 0)
        if not case_validation.get("is_valid_case"):
            continue

        structured_incident = {
            "title": post.get("post_text", ""),
            "body_preview": post.get("post_text", "")[:220],
            "source": post.get("platform", "Reddit"),
            "url": post.get("url", ""),
            "domain": domain,
            "sport": incident_sport,
            "event_context": peak_analysis.get("event_context"),
            "live_window_status": peak_analysis.get("live_window_status"),
            "matched_keywords": case_validation.get("matched_keywords", []),
            "matched_keyword_clusters": case_validation.get("matched_keyword_clusters", []),
            "engagement_metrics": {
                "upvotes": post.get("upvotes", 0),
                "comments": post.get("comments", 0),
                "engagement_score": rule_analysis.get("engagement_score", 0),
            },
            "event_timing": {
                "peak_time_signal": peak_analysis.get("peak_time_signal"),
                "peak_time_reason": peak_analysis.get("peak_time_reason"),
            },
            "suspicious_domain_match": case_validation.get("suspicious_domain_match"),
            "repeated_domain_count": repeated_domain_count,
            "watchlist_match": memory_signals.get("watchlist_match", False),
            "pattern_recurrence_score": memory_signals.get("pattern_recurrence_score", 0),
            "rule_score_breakdown": {
                "rule_score": rule_analysis.get("rule_score", 0),
                "base_risk_score": rule_analysis.get("base_risk_score", 0),
                "domain_watch_weight": rule_analysis.get("domain_watch_weight", 0),
            },
            "evidence_score": case_validation.get("evidence_score", 0),
            "tags": [],
        }
        gemini_analysis = classify_with_gemini(structured_incident)
        combined_analysis = combine_scores(
            rule_analysis,
            gemini_analysis,
            case_validation=case_validation,
            memory_signals=memory_signals,
        )
        risk_score = combined_analysis.get("risk_score", combined_analysis.get("combined_risk_score", 0))

        incident_core = {
            **post,
            **rule_analysis,
            **gemini_analysis,
            **combined_analysis,
            **case_validation,
            **memory_signals,
            "risk_score": risk_score,
            "sport": incident_sport,
            "data_mode": mode,
            "mode_label": "Historical Validation" if mode == "historical_validation" else "Live",
            "monitoring_status": "Monitoring Active",
            "source": post.get("platform", "Reddit"),
            "score_breakdown": _build_score_breakdown(
                rule_analysis,
                gemini_analysis,
                combined_analysis,
                case_validation,
                memory_signals,
            ),
            "tags": _build_tags(rule_analysis, combined_analysis, case_validation, memory_signals),
            "data_source": "mock_fallback" if used_fallback else "reddit_live",
            "source_tier": "tier_1_fallback" if used_fallback else "tier_1_live",
            "source_coverage": "reddit_live_and_public_web_patterns_only",
        }

        gemini_intelligence = analyze_incident_intelligence(incident_core)
        openclaw_workflow = orchestrate_with_openclaw(incident_core, gemini_intelligence)

        results.append(
            {
                **incident_core,
                **gemini_intelligence,
                **openclaw_workflow,
            }
        )

    return results


def _build_debug_payload(
    *,
    sport: str,
    fetch_debug: dict,
    flagged_incidents_count: int,
) -> dict:
    return {
        "sport": sport,
        "source_status": fetch_debug.get("source_status", "unknown"),
        "reddit_fetch_success": bool(fetch_debug.get("reddit_fetch_success", False)),
        "reddit_error_message": fetch_debug.get("reddit_error_message", ""),
        "fetched_posts_count": int(fetch_debug.get("fetched_posts_count", 0) or 0),
        "candidate_incidents_count": int(fetch_debug.get("candidate_incidents_count", 0) or 0),
        "flagged_incidents_count": flagged_incidents_count,
        "fallback_used": bool(fetch_debug.get("fallback_used", False)),
    }


def load_and_analyze_posts():
    data_path = Path(__file__).resolve().parents[3] / "data" / "mock_posts.json"
    with open(data_path, "r", encoding="utf-8") as file:
        posts = json.load(file)
    return _analyze_posts(posts, used_fallback=True)


@router.get("/analyze-mock")
def analyze_mock_posts():
    return {"results": load_and_analyze_posts()}


@router.get("/analyze-sport/{sport}")
def analyze_sport_posts(sport: str, mode: str = Query(default="live")):
    sport_key = (sport or "").lower()
    mode_key = (mode or "live").lower()
    is_historical_mode = mode_key == "historical_validation"
    if sport_key not in SUPPORTED_SPORTS:
        reason = f"Unsupported sport '{sport_key}' for live Reddit fetch."
        return {
            "sport": sport_key,
            "used_fallback": True,
            "fallback_reason": reason,
            "source_status": "fallback_mock",
            "reddit_fetch_success": False,
            "reddit_error_message": reason,
            "fetched_posts_count": 0,
            "candidate_incidents_count": 0,
            "flagged_incidents_count": 0,
            "fallback_used": True,
            "monitoring_status": "Monitoring Active",
            "current_mode": "Historical Validation" if is_historical_mode else "Live",
            "current_mode_key": mode_key,
            "source": "Reddit",
            "results": [],
        }

    posts, used_fallback, fetch_debug = fetch_sport_posts(
        sport_key,
        mode=mode_key,
    )
    results = _analyze_posts(
        posts,
        requested_sport=sport_key,
        used_fallback=used_fallback,
        mode=mode_key,
    )
    debug_payload = _build_debug_payload(
        sport=sport_key,
        fetch_debug=fetch_debug,
        flagged_incidents_count=len(results),
    )
    fallback_reason = fetch_debug.get("reddit_error_message", "") if used_fallback else ""
    return {
        "sport": sport_key,
        "used_fallback": used_fallback,
        "fallback_reason": fallback_reason,
        "source_status": debug_payload["source_status"],
        "reddit_fetch_success": debug_payload["reddit_fetch_success"],
        "reddit_error_message": debug_payload["reddit_error_message"],
        "fetched_posts_count": debug_payload["fetched_posts_count"],
        "candidate_incidents_count": debug_payload["candidate_incidents_count"],
        "flagged_incidents_count": debug_payload["flagged_incidents_count"],
        "fallback_used": debug_payload["fallback_used"],
        "monitoring_status": "Monitoring Active",
        "current_mode": "Historical Validation" if is_historical_mode else "Live",
        "current_mode_key": mode_key,
        "source": "Reddit",
        "source_coverage": "reddit_live_and_public_web_patterns_only",
        "results": results,
    }


@router.get("/analyze-sport/{sport}/debug")
def analyze_sport_debug(sport: str, mode: str = Query(default="live")):
    sport_key = (sport or "").lower()
    mode_key = (mode or "live").lower()
    is_historical_mode = mode_key == "historical_validation"
    if sport_key not in SUPPORTED_SPORTS:
        reason = f"Unsupported sport '{sport_key}' for live Reddit fetch."
        return {
            "sport": sport_key,
            "source_status": "fallback_mock",
            "reddit_fetch_success": False,
            "reddit_error_message": reason,
            "fetched_posts_count": 0,
            "candidate_incidents_count": 0,
            "flagged_incidents_count": 0,
            "fallback_used": True,
            "monitoring_status": "Monitoring Active",
            "current_mode": "Historical Validation" if is_historical_mode else "Live",
            "current_mode_key": mode_key,
            "source": "Reddit",
        }

    posts, used_fallback, fetch_debug = fetch_sport_posts(sport_key, mode=mode_key)
    results = _analyze_posts(
        posts,
        requested_sport=sport_key,
        used_fallback=used_fallback,
        mode=mode_key,
    )
    payload = _build_debug_payload(
        sport=sport_key,
        fetch_debug=fetch_debug,
        flagged_incidents_count=len(results),
    )
    payload["monitoring_status"] = "Monitoring Active"
    payload["current_mode"] = "Historical Validation" if is_historical_mode else "Live"
    payload["current_mode_key"] = mode_key
    payload["source"] = "Reddit"
    return payload


@router.get("/summary")
def get_summary():
    results = load_and_analyze_posts()

    total_posts = len(results)
    high_risk_posts = sum(1 for item in results if item["combined_risk_level"] == "High")

    average_score = 0
    if total_posts > 0:
        average_score = round(
            sum(item["combined_risk_score"] for item in results) / total_posts,
            2,
        )

    domains = [item["domain"] for item in results]
    domain_counts = Counter(domains)
    top_domain = None
    top_domain_count = 0

    if domain_counts:
        top_domain, top_domain_count = domain_counts.most_common(1)[0]

    return {
        "total_posts": total_posts,
        "high_risk_posts": high_risk_posts,
        "average_combined_risk_score": average_score,
        "top_suspicious_domain": top_domain,
        "top_domain_count": top_domain_count,
    }


@router.get("/insights")
def get_insights():
    results = load_and_analyze_posts()
    insights = generate_insights(results)
    return insights


@router.post("/send-report")
def send_report_email(payload: SendReportRequest):
    recipient = (payload.email or "").strip()
    if not _is_valid_email(recipient):
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    results = load_and_analyze_posts()
    summary = get_summary()
    insights = generate_insights(results)
    report_bytes = _build_report_pdf_bytes(results, summary, insights)
    filename = f"streamguard-report-{datetime.utcnow().strftime('%Y-%m-%d')}.pdf"
    _send_report_email(recipient, report_bytes, filename)
    return {"status": "sent", "email": recipient}
