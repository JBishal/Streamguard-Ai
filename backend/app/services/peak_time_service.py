from datetime import UTC, datetime


SPORT_EVENT_RULES = {
    "football": [
        ("Champions League", ["champions league", "ucl"], 15),
        ("El Clasico", ["el clasico", "real madrid", "barcelona"], 14),
        ("London Derby", ["london derby", "arsenal", "chelsea", "tottenham"], 12),
        ("Major Final", ["final", "semi-final", "knockout"], 10),
        ("Rivalry Match", ["derby", "rivalry"], 9),
    ],
    "cricket": [
        ("IPL Fixture", ["ipl"], 15),
        ("RCB vs CSK", ["rcb", "csk", "rcb vs csk"], 14),
        ("Playoff Window", ["playoff", "qualifier", "final"], 10),
        ("Rivalry Fixture", ["india vs pakistan", "ashes", "rivalry"], 9),
    ],
    "basketball": [
        ("NBA Playoffs", ["nba playoffs", "playoff"], 15),
        ("Finals Window", ["finals", "nba finals"], 14),
        ("Closeout Game", ["game 7", "closeout"], 11),
        ("Major Matchup", ["national tv", "primetime matchup", "rivalry"], 9),
    ],
}


def detect_peak_time_signal(post_text: str, sport: str) -> dict:
    text = (post_text or "").lower()
    sport_key = (sport or "").lower()
    live_window_keywords = ["live now", "today", "tonight", "last 24 hours", "last 7 days", "last month"]
    has_live_window_phrase = any(keyword in text for keyword in live_window_keywords)

    for event_context, keywords, weight in SPORT_EVENT_RULES.get(sport_key, []):
        if any(keyword in text for keyword in keywords):
            return {
                "peak_time_signal": True,
                "event_context": event_context,
                "live_window_status": "Event Peak Window",
                "peak_time_reason": f"High-interest live {sport_key} event keyword match.",
                "peak_time_weight": weight,
            }

    current_hour_utc = datetime.now(UTC).hour
    live_window = 16 <= current_hour_utc <= 23
    if ("live" in text and live_window) or has_live_window_phrase:
        return {
            "peak_time_signal": True,
            "event_context": "Live Demand Window",
            "live_window_status": "Active Monitoring Window",
            "peak_time_reason": "Live-stream language during typical high-demand viewing window.",
            "peak_time_weight": 8,
        }

    return {
        "peak_time_signal": False,
        "event_context": "Standard Monitoring Window",
        "live_window_status": "Baseline Window",
        "peak_time_reason": "No major event keyword match detected.",
        "peak_time_weight": 0,
    }
