import os


class OpenClawAdapter:
    """Adapter wrapper to keep OpenClaw integration swappable."""

    def __init__(self) -> None:
        self.api_key = os.getenv("OPENCLAW_API_KEY")
        self.base_url = os.getenv("OPENCLAW_BASE_URL")

    def process_incident(self, incident: dict, gemini_output: dict) -> dict:
        if not self.api_key or not self.base_url:
            return self._mock_process(incident, gemini_output)
        return self._mock_process(incident, gemini_output)

    def _mock_process(self, incident: dict, gemini_output: dict) -> dict:
        risk_score = incident.get("risk_score", incident.get("combined_risk_score", 0))
        confidence_score = incident.get("confidence_score", int(gemini_output.get("ai_confidence", 0.0) * 100))
        exposure_score = incident.get("exposure_score", 0)
        valid_case = bool(incident.get("is_valid_case", True))
        repeat_signal = bool(incident.get("repeat_incident_signal"))

        if not valid_case:
            return {
                "priority": "low",
                "recommended_action": "Do not escalate; keep sample for trend context only.",
                "status": "closed",
                "queue_decision": "IGNORE",
                "workflow_reason": "Incident does not meet multi-signal qualification threshold for actionable piracy.",
            }

        if risk_score >= 85 and confidence_score >= 75 and exposure_score >= 70:
            return {
                "priority": "urgent",
                "recommended_action": "Escalate to enforcement for urgent review and takedown preparation.",
                "status": "queued",
                "queue_decision": "ESCALATE",
                "workflow_reason": "High risk, strong confidence, and high exposure indicate immediate enforcement priority.",
            }

        if risk_score >= 70 and confidence_score >= 60:
            return {
                "priority": "high",
                "recommended_action": "Create notice draft and route to analyst validation.",
                "status": "drafted",
                "queue_decision": "DRAFT_NOTICE",
                "workflow_reason": "Actionable case with strong evidence warrants notice drafting before send.",
            }

        if risk_score >= 48 or repeat_signal:
            return {
                "priority": "medium",
                "recommended_action": "Queue for analyst review and monitor repeated domain activity.",
                "status": "pending review",
                "queue_decision": "REVIEW",
                "workflow_reason": "Moderate risk or recurrence pattern requires human validation.",
            }

        return {
            "priority": "low",
            "recommended_action": "Continue monitoring and wait for additional corroborating signals.",
            "status": "queued",
            "queue_decision": "MONITOR",
            "workflow_reason": "Signal strength is currently limited but merits watchlist monitoring.",
        }


def orchestrate_with_openclaw(incident: dict, gemini_output: dict) -> dict:
    adapter = OpenClawAdapter()
    return adapter.process_incident(incident, gemini_output)
