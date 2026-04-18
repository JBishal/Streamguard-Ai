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
        ai_confidence = gemini_output.get("ai_confidence", 0.0)
        high_urgency = risk_score >= 75 and ai_confidence >= 0.65

        if high_urgency:
            result = {
                "priority": "P1",
                "recommended_action": "Escalate to enforcement queue and initiate takedown review.",
                "status": "Escalated",
                "queue_decision": "enforcement_queue",
                "workflow_reason": "High risk score and strong intelligence confidence trigger immediate escalation.",
            }
            result["escalation_note"] = (
                "High risk and strong AI confidence indicate immediate action is recommended."
            )
            return result

        if risk_score >= 40:
            return {
                "priority": "P2",
                "recommended_action": "Queue for analyst validation and monitor spread velocity.",
                "status": "Queued",
                "queue_decision": "analyst_review",
                "workflow_reason": "Moderate-to-high risk requires analyst validation before enforcement action.",
            }

        return {
            "priority": "P3",
            "recommended_action": "Log incident for trend tracking and periodic re-evaluation.",
            "status": "Monitoring",
            "queue_decision": "monitoring",
            "workflow_reason": "Lower-risk signal is retained for monitoring and trend correlation.",
        }


def orchestrate_with_openclaw(incident: dict, gemini_output: dict) -> dict:
    adapter = OpenClawAdapter()
    return adapter.process_incident(incident, gemini_output)
