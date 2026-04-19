import json
import os

import requests


def _estimate_ai_signal(incident: dict) -> tuple[int, float, str, str]:
    matched_keywords = incident.get("matched_keywords") or []
    event_relevance = bool(incident.get("event_relevance") or incident.get("peak_time_signal"))
    suspicious_domain = bool(incident.get("suspicious_domain_match") or incident.get("domain_watch_weight", 0) > 0)
    repeat_signal = bool(incident.get("repeat_incident_signal") or incident.get("watchlist_match"))
    evidence_score = int(incident.get("evidence_score", 0) or 0)

    score = 25 + min(len(matched_keywords) * 10, 28)
    confidence = 0.34
    reason_bits = []

    if event_relevance:
        score += 18
        confidence += 0.12
        reason_bits.append("event-window relevance")
    if suspicious_domain:
        score += 20
        confidence += 0.12
        reason_bits.append("suspicious outbound domain")
    if repeat_signal:
        score += 12
        confidence += 0.08
        reason_bits.append("repeat-pattern recurrence")

    score += min(int(evidence_score * 0.2), 20)
    score = max(0, min(100, score))
    confidence = round(max(0.2, min(0.92, confidence)), 2)

    if score >= 78 and confidence >= 0.7:
        assessment = "high_likelihood"
    elif score >= 52:
        assessment = "moderate_likelihood"
    else:
        assessment = "low_likelihood"

    reason = (
        "Fallback intelligence based on "
        + ", ".join(reason_bits[:3])
        if reason_bits
        else "Fallback intelligence based on limited corroborating evidence."
    )
    return score, confidence, reason, assessment


def _build_fallback_intelligence(incident: dict) -> dict:
    tags = incident.get("tags") or []
    engagement = int(incident.get("engagement_score", 0) or 0)
    confidence_score = int(incident.get("confidence_score", 0) or 0)
    evidence_score = int(incident.get("evidence_score", 0) or 0)
    domain = incident.get("domain", "unknown source")
    sport = incident.get("sport", "live sports")
    event_context = incident.get("event_context", "Live Demand Window")
    has_live = bool(incident.get("peak_time_signal") or incident.get("event_relevance"))
    has_domain_risk = bool(
        incident.get("suspicious_domain_match")
        or any("domain" in str(tag).lower() for tag in tags)
        or ".live" in domain
        or ".xyz" in domain
    )
    has_keyword_cluster = bool(incident.get("keyword_cluster_signal"))
    repeat_signal = bool(incident.get("repeat_incident_signal"))

    context_driver = "Live Event Demand Spike" if has_live else "Persistent Redistribution Signals"
    if has_domain_risk:
        context_driver = "Suspicious Distribution Infrastructure"

    rationale_parts = []
    if has_live:
        rationale_parts.append("Live-event demand is elevating redistribution urgency")
    if engagement >= 70:
        rationale_parts.append("engagement indicates strong audience reach")
    if has_domain_risk:
        rationale_parts.append(f"domain pattern ({domain}) is associated with risky distribution")
    if has_keyword_cluster:
        rationale_parts.append("keyword cluster aligns with unauthorized stream-seeking behavior")
    if repeat_signal:
        rationale_parts.append("repeated domain and pattern recurrence increase enforcement confidence")

    if not rationale_parts:
        rationale_parts.append("rule and engagement signals indicate sustained monitoring priority")

    recommendation = (
        f"Queue {sport} incident for analyst review and notice drafting readiness."
        if has_live or engagement >= 70 or repeat_signal
        else "Keep in monitoring queue and re-check for repeat posting or link persistence."
    )

    if confidence_score >= 75 and evidence_score >= 65:
        piracy_intent_assessment = "high_likelihood"
    elif confidence_score >= 45:
        piracy_intent_assessment = "moderate_likelihood"
    else:
        piracy_intent_assessment = "low_likelihood"

    return {
        "ai_status": "Fallback Insight",
        "ai_rationale": ". ".join(rationale_parts[:2]) + ".",
        "recommendation_summary": recommendation,
        "context_driver": context_driver,
        "ai_confidence": 0.71 if confidence_score >= 75 else (0.58 if has_live or has_domain_risk else 0.42),
        "why_now": "Live-event timing and active watch-intent signals increase near-term redistribution risk.",
        "piracy_intent_confidence": 0.72 if piracy_intent_assessment == "high_likelihood" else (
            0.56 if piracy_intent_assessment == "moderate_likelihood" else 0.38
        ),
        "piracy_intent_assessment": piracy_intent_assessment,
        "event_context_summary": f"Monitoring context: {event_context}.",
        "recommended_next_step": "Validate source persistence, then queue for workflow review.",
    }


def _k2_chat_completion(prompt: str) -> dict:
    api_key = os.getenv("K2_API_KEY")
    base_url = (os.getenv("K2_BASE_URL") or "").strip().rstrip("/")
    model = os.getenv("K2_MODEL", "K2-Think")

    if not api_key or not base_url:
        raise RuntimeError("K2 configuration missing (K2_API_KEY or K2_BASE_URL).")

    if base_url.endswith("/chat/completions"):
        endpoint = base_url
    elif base_url.endswith("/v1"):
        endpoint = f"{base_url}/chat/completions"
    else:
        endpoint = f"{base_url}/v1/chat/completions"

    response = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": "Return only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.1,
        },
        timeout=12,
    )
    response.raise_for_status()
    payload = response.json()
    content = payload["choices"][0]["message"]["content"]
    cleaned = str(content).strip().replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)


def classify_with_gemini(post_text_or_incident, url: str = "") -> dict:
    if isinstance(post_text_or_incident, dict):
        incident = post_text_or_incident
    else:
        incident = {"post_text": post_text_or_incident, "url": url}
    post_text = incident.get("post_text", "")
    post_url = incident.get("url", url)

    if not os.getenv("K2_API_KEY") or not os.getenv("K2_BASE_URL"):
        fallback_score, fallback_confidence, fallback_reason, fallback_assessment = _estimate_ai_signal(incident)
        return {
            "ai_used": False,
            "is_piracy": fallback_score >= 50,
            "gemini_score": fallback_score,
            "gemini_confidence": fallback_confidence,
            "gemini_reason": f"{fallback_reason} K2 API is not configured.",
            "ai_status": "Fallback Insight",
            "piracy_intent_assessment": fallback_assessment,
        }

    prompt = f"""
You are analyzing whether this structured incident likely reflects unauthorized live sports redistribution.

Structured incident JSON:
{json.dumps(incident, ensure_ascii=False)}

Return ONLY valid JSON with this structure:
{{
  "is_piracy": true,
  "gemini_score": 0,
  "gemini_confidence": 0.0,
  "gemini_reason": "short explanation",
  "piracy_intent_assessment": "high_likelihood"
}}

Rules:
- gemini_score must be an integer from 0 to 100
- gemini_confidence must be a float from 0.0 to 1.0
- piracy_intent_assessment must be one of:
  high_likelihood, moderate_likelihood, low_likelihood
- Keep gemini_reason short
- Output JSON only
"""

    try:
        data = _k2_chat_completion(prompt)
        data["piracy_intent_assessment"] = data.get("piracy_intent_assessment", "moderate_likelihood")
        data["ai_used"] = True
        data["ai_status"] = "K2 Think"
        return data

    except Exception as e:
        fallback_score, fallback_confidence, fallback_reason, fallback_assessment = _estimate_ai_signal(incident)
        return {
            "ai_used": False,
            "is_piracy": fallback_score >= 50,
            "gemini_score": fallback_score,
            "gemini_confidence": fallback_confidence,
            "gemini_reason": f"{fallback_reason} K2 unavailable ({str(e)[:120]}).",
            "ai_status": "Fallback Insight",
            "piracy_intent_assessment": fallback_assessment,
        }


def analyze_incident_intelligence(incident: dict) -> dict:
    default_response = _build_fallback_intelligence(incident)

    if not os.getenv("K2_API_KEY") or not os.getenv("K2_BASE_URL"):
        return default_response

    prompt = f"""
You are a piracy enforcement intelligence assistant.
Analyze this structured incident and return ONLY valid JSON.

Incident JSON:
{json.dumps(incident, ensure_ascii=False)}

Return this exact structure:
{{
  "ai_rationale": "short rationale",
  "piracy_intent_assessment": "high_likelihood",
  "why_now": "short timing explanation",
  "piracy_intent_confidence": 0.0,
  "event_context_summary": "short event summary",
  "recommended_next_step": "short actionable next step",
  "recommendation_summary": "short recommendation",
  "context_driver": "main risk driver",
  "ai_confidence": 0.0
}}

Rules:
- ai_confidence must be a float between 0.0 and 1.0
- piracy_intent_confidence must be a float between 0.0 and 1.0
- piracy_intent_assessment must be one of:
  high_likelihood, moderate_likelihood, low_likelihood
- Keep text concise and professional
- Output JSON only
"""

    try:
        data = _k2_chat_completion(prompt)

        ai_confidence = data.get("ai_confidence", default_response["ai_confidence"])
        ai_confidence = float(ai_confidence)
        ai_confidence = max(0.0, min(1.0, ai_confidence))
        piracy_intent_confidence = data.get(
            "piracy_intent_confidence",
            default_response["piracy_intent_confidence"],
        )
        piracy_intent_confidence = float(piracy_intent_confidence)
        piracy_intent_confidence = max(0.0, min(1.0, piracy_intent_confidence))

        return {
            "ai_status": "K2 Think",
            "ai_rationale": str(data.get("ai_rationale", default_response["ai_rationale"])),
            "piracy_intent_assessment": str(
                data.get("piracy_intent_assessment", default_response["piracy_intent_assessment"])
            ),
            "why_now": str(data.get("why_now", default_response["why_now"])),
            "piracy_intent_confidence": round(piracy_intent_confidence, 2),
            "event_context_summary": str(
                data.get("event_context_summary", default_response["event_context_summary"])
            ),
            "recommended_next_step": str(
                data.get("recommended_next_step", default_response["recommended_next_step"])
            ),
            "recommendation_summary": str(
                data.get("recommendation_summary", default_response["recommendation_summary"])
            ),
            "context_driver": str(data.get("context_driver", default_response["context_driver"])),
            "ai_confidence": round(ai_confidence, 2),
        }
    except Exception:
        return default_response
