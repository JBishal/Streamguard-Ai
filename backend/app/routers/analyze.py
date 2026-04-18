import json
from collections import Counter
from pathlib import Path
from typing import Optional

from fastapi import APIRouter

from app.services.gemini_service import analyze_incident_intelligence, classify_with_gemini
from app.services.insight_service import generate_insights
from app.services.openclaw_service import orchestrate_with_openclaw
from app.services.peak_time_service import detect_peak_time_signal
from app.services.reddit_service import fetch_sport_posts
from app.services.rule_engine import extract_domain, score_post
from app.services.scoring_service import combine_scores

router = APIRouter()

SUPPORTED_SPORTS = {"football", "cricket", "basketball"}
# Sport-specific route support for live Reddit monitoring.


def _build_score_breakdown(rule_analysis: dict, gemini_analysis: dict, combined_analysis: dict) -> dict:
    return {
        "rule_score": rule_analysis.get("rule_score", 0),
        "engagement_score": rule_analysis.get("engagement_score", 0),
        "base_risk_score": rule_analysis.get("base_risk_score", 0),
        "domain_watch_weight": rule_analysis.get("domain_watch_weight", 0),
        "gemini_score": gemini_analysis.get("gemini_score", 0),
        "combined_risk_score": combined_analysis.get("combined_risk_score", 0),
    }


def _build_tags(rule_analysis: dict, combined_analysis: dict) -> list:
    tags = []
    risk_level = combined_analysis.get("combined_risk_level")
    if risk_level:
        tags.append(f"risk:{risk_level.lower()}")

    if rule_analysis.get("reasons"):
        tags.append("rule:matched_signals")

    domain = rule_analysis.get("domain")
    if domain:
        tags.append(f"domain:{domain}")

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


def _analyze_posts(posts: list, requested_sport: Optional[str] = None, used_fallback: bool = False):
    domain_counts = Counter(
        extract_domain(post.get("url", ""))
        for post in posts
        if extract_domain(post.get("url", "")) and "reddit.com" not in extract_domain(post.get("url", ""))
    )
    results = []
    for post in posts:
        incident_sport = requested_sport or post.get("sport") or _detect_sport(post.get("post_text", ""))
        peak_analysis = detect_peak_time_signal(post.get("post_text", ""), incident_sport)
        rule_analysis = score_post(
            post["post_text"],
            post["url"],
            post["upvotes"],
            post["comments"],
        )
        rule_analysis.update(peak_analysis)
        domain = rule_analysis.get("domain")
        if domain and domain_counts.get(domain, 0) >= 2:
            rule_analysis["domain_watch_weight"] = int(rule_analysis.get("domain_watch_weight", 0)) + 8
            reasons = rule_analysis.get("reasons", [])
            reasons.append(f"Repeated suspicious domain in current stream: '{domain}'")
            rule_analysis["reasons"] = reasons

        gemini_analysis = classify_with_gemini(
            post["post_text"],
            post["url"],
        )

        combined_analysis = combine_scores(rule_analysis, gemini_analysis)
        risk_score = combined_analysis.get("combined_risk_score", 0)

        incident_core = {
            **post,
            **rule_analysis,
            **gemini_analysis,
            **combined_analysis,
            "risk_score": risk_score,
            "sport": incident_sport,
            "score_breakdown": _build_score_breakdown(
                rule_analysis,
                gemini_analysis,
                combined_analysis,
            ),
            "tags": _build_tags(rule_analysis, combined_analysis),
            "data_source": "mock_fallback" if used_fallback else "reddit_live",
        }

        gemini_intelligence = analyze_incident_intelligence(incident_core)
        openclaw_workflow = orchestrate_with_openclaw(incident_core, gemini_intelligence)

        results.append({
            **incident_core,
            **gemini_intelligence,
            **openclaw_workflow,
        })

    return results


def load_and_analyze_posts():
    data_path = Path(__file__).resolve().parents[3] / "data" / "mock_posts.json"
    with open(data_path, "r", encoding="utf-8") as file:
        posts = json.load(file)
    return _analyze_posts(posts, used_fallback=True)


@router.get("/analyze-mock")
def analyze_mock_posts():
    return {"results": load_and_analyze_posts()}


@router.get("/analyze-sport/{sport}")
def analyze_sport_posts(sport: str):
    sport_key = (sport or "").lower()
    if sport_key not in SUPPORTED_SPORTS:
        return {"sport": sport_key, "used_fallback": True, "results": []}

    posts, used_fallback = fetch_sport_posts(sport_key)
    results = _analyze_posts(posts, requested_sport=sport_key, used_fallback=used_fallback)
    return {
        "sport": sport_key,
        "used_fallback": used_fallback,
        "results": results,
    }


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
