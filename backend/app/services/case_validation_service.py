from urllib.parse import urlparse


WATCH_INTENT_PHRASES = [
    "watch free",
    "join live",
    "live stream",
    "free stream",
    "watch match free",
    "watch game free",
    "stream link",
    "live now",
    "hd live",
    "no ads live",
    "full match live",
    "link to watch",
    "watch online free",
    "free live match",
]

SPORT_RELEVANCE_TERMS = [
    "football",
    "soccer",
    "champions league",
    "ucl",
    "el clasico",
    "london derby",
    "cricket",
    "ipl",
    "rcb",
    "csk",
    "basketball",
    "nba",
    "playoff",
    "finals",
]

SUSPICIOUS_TLDS = [".live", ".xyz", ".click", ".stream"]


def _extract_domain(url: str) -> str:
    return urlparse(url or "").netloc.lower()


def _has_external_link(url: str, domain: str) -> bool:
    if not url:
        return False
    return "http" in url.lower() and "reddit.com" not in domain and "redd.it" not in domain


def _match_keywords(text: str) -> list:
    lowered = (text or "").lower()
    return [keyword for keyword in WATCH_INTENT_PHRASES if keyword in lowered]


def _match_keyword_clusters(text: str, has_external_link_signal: bool) -> list:
    lowered = (text or "").lower()
    clusters = []
    if any(term in lowered for term in ["watch", "stream", "link", "free"]):
        clusters.append("watch_intent")
    if any(term in lowered for term in ["live", "live now", "tonight", "today", "kickoff"]):
        clusters.append("live_timing")
    if has_external_link_signal:
        clusters.append("link_distribution")
    return clusters


def _is_sport_relevant(text: str, sport: str) -> bool:
    sport_key = (sport or "").lower()
    if sport_key in {"football", "cricket", "basketball"}:
        return True
    lowered = (text or "").lower()
    return any(term in lowered for term in SPORT_RELEVANCE_TERMS)


def evaluate_actionable_case(
    *,
    post_text: str,
    url: str,
    sport: str,
    event_context: str,
    peak_time_signal: bool,
    engagement_score: int,
    repeated_domain_count: int,
) -> dict:
    text = post_text or ""
    domain = _extract_domain(url)
    matched_keywords = _match_keywords(text)
    has_watch_intent = len(matched_keywords) > 0
    suspicious_domain_match = any(domain.endswith(tld) for tld in SUSPICIOUS_TLDS)
    has_external_link_signal = _has_external_link(url, domain)
    has_link_or_domain_signal = has_external_link_signal or suspicious_domain_match
    sports_relevance = _is_sport_relevant(text, sport)
    event_context_value = (event_context or "").lower()
    event_relevance = bool(peak_time_signal) or (
        event_context_value
        and "standard monitoring" not in event_context_value
        and "baseline" not in event_context_value
    )

    matched_keyword_clusters = _match_keyword_clusters(text, has_external_link_signal)
    keyword_cluster_signal = len(matched_keyword_clusters) >= 2 or len(matched_keywords) >= 2
    engagement_signal = int(engagement_score or 0) >= 30
    repetition_signal = int(repeated_domain_count or 0) >= 2
    timing_signal = bool(peak_time_signal)

    supporting_signal_count = sum(
        [
            1 if keyword_cluster_signal else 0,
            1 if engagement_signal else 0,
            1 if repetition_signal else 0,
            1 if timing_signal else 0,
        ]
    )

    evidence_score = 0
    evidence_score += min(len(matched_keywords) * 12, 30)
    evidence_score += 20 if has_link_or_domain_signal else 0
    evidence_score += 14 if sports_relevance else 0
    evidence_score += 12 if event_relevance else 0
    evidence_score += min(supporting_signal_count * 6, 24)
    evidence_score = min(evidence_score, 100)

    valid_case = all(
        [
            has_watch_intent,
            has_link_or_domain_signal,
            sports_relevance and event_relevance,
            supporting_signal_count >= 1,
            evidence_score >= 45,
        ]
    )

    qualification_reasons = []
    if has_watch_intent:
        qualification_reasons.append("watch-intent language detected")
    if has_link_or_domain_signal:
        qualification_reasons.append("external-link or suspicious-domain signal detected")
    if sports_relevance and event_relevance:
        qualification_reasons.append("sports event relevance detected")
    if supporting_signal_count >= 1:
        qualification_reasons.append("supporting evidence threshold met")
    if not qualification_reasons:
        qualification_reasons.append("insufficient multi-signal evidence")

    return {
        "is_valid_case": valid_case,
        "evidence_score": evidence_score,
        "qualification_reasons": qualification_reasons,
        "matched_keywords": matched_keywords,
        "matched_keyword_clusters": matched_keyword_clusters,
        "keyword_cluster_signal": keyword_cluster_signal,
        "has_watch_intent": has_watch_intent,
        "has_external_link_signal": has_external_link_signal,
        "suspicious_domain_match": suspicious_domain_match,
        "sports_relevance": sports_relevance,
        "event_relevance": event_relevance,
        "supporting_signal_count": supporting_signal_count,
        "engagement_signal": engagement_signal,
        "repeat_incident_signal": repetition_signal,
    }
