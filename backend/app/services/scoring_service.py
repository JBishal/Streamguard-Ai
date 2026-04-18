from app.services.rule_engine import get_risk_level


def combine_scores(rule_analysis: dict, gemini_analysis: dict) -> dict:
    base_risk_score = rule_analysis.get("base_risk_score", 0)
    peak_time_weight = int(rule_analysis.get("peak_time_weight", 0) or 0)
    domain_watch_weight = int(rule_analysis.get("domain_watch_weight", 0) or 0)
    weighted_base_score = min(base_risk_score + peak_time_weight + domain_watch_weight, 100)
    gemini_score = gemini_analysis.get("gemini_score", 0)
    gemini_confidence = gemini_analysis.get("gemini_confidence", 0.0)

    if gemini_analysis.get("ai_used"):
        combined_risk_score = int(weighted_base_score * 0.4 + gemini_score * 0.6)
        combined_confidence = round((0.5 + gemini_confidence * 0.5), 2)
    else:
        combined_risk_score = weighted_base_score
        combined_confidence = 0.5

    combined_risk_score = min(combined_risk_score, 100)
    combined_risk_level = get_risk_level(combined_risk_score)

    return {
        "combined_risk_score": combined_risk_score,
        "combined_confidence": combined_confidence,
        "combined_risk_level": combined_risk_level,
    }
