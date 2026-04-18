import json
import os

import requests


def _estimate_ai_signal(post_text: str, url: str) -> tuple[int, float, str]:
    text = f"{post_text} {url}".lower()
    score = 35
    confidence = 0.42
    reason_bits = []

    if any(keyword in text for keyword in ["watch free", "free live stream", "stream free"]):
        score += 20
        confidence += 0.11
        reason_bits.append("explicit free-stream language")

    if any(keyword in text for keyword in ["live", "kickoff", "tonight", "match"]):
        score += 15
        confidence += 0.09
        reason_bits.append("live-event urgency")

    if any(tld in text for tld in [".live", ".xyz", ".click", ".stream"]):
        score += 18
        confidence += 0.1
        reason_bits.append("suspicious domain pattern")

    score = max(0, min(100, score))
    confidence = round(max(0.2, min(0.78, confidence)), 2)
    reason = (
        "Fallback heuristic based on "
        + ", ".join(reason_bits[:3])
        if reason_bits
        else "Fallback heuristic based on moderate suspicious wording."
    )
    return score, confidence, reason


def _build_fallback_intelligence(incident: dict) -> dict:
    post_text = (incident.get("post_text") or "").lower()
    tags = incident.get("tags") or []
    engagement = incident.get("engagement_score", 0)
    rule_score = incident.get("rule_score", 0)
    domain = incident.get("domain", "unknown source")

    if "football" in post_text:
        sport = "football"
    elif "cricket" in post_text:
        sport = "cricket"
    elif "basketball" in post_text or "nba" in post_text:
        sport = "basketball"
    else:
        sport = "live sports"

    has_live = "live" in post_text or "Live Match" in tags
    has_domain_risk = any("domain" in str(tag).lower() for tag in tags) or ".live" in domain or ".xyz" in domain
    has_keyword_cluster = "Keyword Cluster" in tags or rule_score >= 45

    context_driver = "Live Event Demand Spike" if has_live else "Persistent Redistribution Signals"
    if has_domain_risk:
        context_driver = "Suspicious Distribution Infrastructure"

    rationale_parts = []
    if has_live:
        rationale_parts.append("Live-event demand is elevating repost urgency")
    if engagement >= 70:
        rationale_parts.append("engagement indicates strong audience reach")
    if has_domain_risk:
        rationale_parts.append(f"domain pattern ({domain}) is associated with risky distribution")
    if has_keyword_cluster:
        rationale_parts.append("keyword cluster aligns with unauthorized stream-seeking behavior")

    if not rationale_parts:
        rationale_parts.append("rule and engagement signals indicate sustained monitoring priority")

    recommendation = (
        f"Queue {sport} incident for analyst review and monitor mirror-link repost activity."
        if has_live or engagement >= 70
        else "Keep in monitoring queue and re-check for repeat posting or link persistence."
    )

    return {
        "ai_status": "Fallback Insight",
        "ai_rationale": ". ".join(rationale_parts[:2]) + ".",
        "recommendation_summary": recommendation,
        "context_driver": context_driver,
        "ai_confidence": 0.58 if has_live or has_domain_risk else 0.49,
        "why_now": "Live-event demand and suspicious stream-seeking language increase near-term redistribution risk.",
        "piracy_intent_confidence": 0.61 if has_live or has_domain_risk else 0.52,
        "event_context_summary": f"Monitoring context: {context_driver}.",
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


def classify_with_gemini(post_text: str, url: str) -> dict:
    if not os.getenv("K2_API_KEY") or not os.getenv("K2_BASE_URL"):
        fallback_score, fallback_confidence, fallback_reason = _estimate_ai_signal(post_text, url)
        return {
            "ai_used": False,
            "is_piracy": True,
            "gemini_score": fallback_score,
            "gemini_confidence": fallback_confidence,
            "gemini_reason": f"{fallback_reason} K2 API is not configured.",
            "ai_status": "Fallback Insight",
        }

    prompt = f"""
You are analyzing whether a public online post is likely related to unauthorized streaming piracy.

Post text: {post_text}
URL: {url}

Return ONLY valid JSON with this structure:
{{
  "is_piracy": true,
  "gemini_score": 0,
  "gemini_confidence": 0.0,
  "gemini_reason": "short explanation"
}}

Rules:
- gemini_score must be an integer from 0 to 100
- gemini_confidence must be a float from 0.0 to 1.0
- Keep gemini_reason short
- Output JSON only
"""

    try:
        data = _k2_chat_completion(prompt)
        data["ai_used"] = True
        data["ai_status"] = "K2 Think"
        return data

    except Exception as e:
        fallback_score, fallback_confidence, fallback_reason = _estimate_ai_signal(post_text, url)
        return {
            "ai_used": False,
            "is_piracy": True,
            "gemini_score": fallback_score,
            "gemini_confidence": fallback_confidence,
            "gemini_reason": f"{fallback_reason} K2 unavailable ({str(e)[:120]}).",
            "ai_status": "Fallback Insight",
        }


def analyze_incident_intelligence(incident: dict) -> dict:
    default_response = _build_fallback_intelligence(incident)

    if not os.getenv("K2_API_KEY") or not os.getenv("K2_BASE_URL"):
        return default_response

    prompt = f"""
You are a piracy intelligence assistant. Analyze this incident and return ONLY valid JSON.

Incident JSON:
{json.dumps(incident, ensure_ascii=False)}

Return this exact structure:
{{
  "ai_rationale": "short rationale",
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
