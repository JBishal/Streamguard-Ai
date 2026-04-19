from typing import Optional

from app.services.rule_engine import get_risk_level


def _confidence_label(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 45:
        return "medium"
    return "low"


def _impact_tier(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 45:
        return "medium"
    return "low"


def combine_scores(
    rule_analysis: dict,
    gemini_analysis: dict,
    case_validation: Optional[dict] = None,
    memory_signals: Optional[dict] = None,
) -> dict:
    case_validation = case_validation or {}
    memory_signals = memory_signals or {}
    base_risk_score = rule_analysis.get("base_risk_score", 0)
    peak_time_weight = int(rule_analysis.get("peak_time_weight", 0) or 0)
    domain_watch_weight = int(rule_analysis.get("domain_watch_weight", 0) or 0)
    pattern_recurrence_score = int(memory_signals.get("pattern_recurrence_score", 0) or 0)
    recurrence_weight = min(int(pattern_recurrence_score * 0.25), 20)
    weighted_base_score = min(
        base_risk_score + peak_time_weight + domain_watch_weight + recurrence_weight,
        100,
    )
    gemini_score = gemini_analysis.get("gemini_score", 0)
    gemini_confidence = gemini_analysis.get("gemini_confidence", 0.0)
    evidence_score = int(case_validation.get("evidence_score", 0) or 0)
    supporting_signal_count = int(case_validation.get("supporting_signal_count", 0) or 0)
    is_valid_case = bool(case_validation.get("is_valid_case"))

    if gemini_analysis.get("ai_used") and is_valid_case:
        risk_score = int(weighted_base_score * 0.45 + gemini_score * 0.55)
    else:
        risk_score = weighted_base_score

    risk_score = min(risk_score, 100)
    if not is_valid_case:
        risk_score = min(risk_score, 38)

    confidence_score = 0
    confidence_score += int(evidence_score * 0.45)
    confidence_score += min(supporting_signal_count * 8, 24)
    confidence_score += min(int(gemini_confidence * 100) // 3, 20)
    confidence_score += min(int(pattern_recurrence_score * 0.15), 15)
    if not is_valid_case:
        confidence_score = min(confidence_score, 42)
    confidence_score = max(0, min(confidence_score, 100))
    confidence_label = _confidence_label(confidence_score)

    exposure_score = min(
        100,
        int(
            (rule_analysis.get("engagement_score", 0) * 0.45)
            + (peak_time_weight * 1.8)
            + (domain_watch_weight * 1.3)
            + (pattern_recurrence_score * 0.25)
        ),
    )
    impact_tier = _impact_tier(exposure_score)
    if impact_tier == "high":
        impact_reason = "High-demand event timing and distribution signals indicate significant exposure."
    elif impact_tier == "medium":
        impact_reason = "Moderate audience reach with suspicious distribution cues suggests business impact."
    else:
        impact_reason = "Limited current spread; retain for monitoring and recurrence tracking."

    combined_risk_level = get_risk_level(risk_score)
    combined_confidence = round(confidence_score / 100, 2)

    return {
        "combined_risk_score": risk_score,
        "combined_confidence": combined_confidence,
        "combined_risk_level": combined_risk_level,
        "risk_score": risk_score,
        "confidence_score": confidence_score,
        "confidence_label": confidence_label,
        "exposure_score": exposure_score,
        "impact_tier": impact_tier,
        "impact_reason": impact_reason,
    }
