from collections import Counter
from datetime import datetime, timezone


_DOMAIN_COUNTER = Counter()
_CLUSTER_COUNTER = Counter()
_LAST_SEEN = {}


def update_pattern_memory(domain: str, keyword_clusters: list) -> dict:
    safe_domain = (domain or "").strip().lower()
    clusters = [str(cluster).strip().lower() for cluster in (keyword_clusters or []) if cluster]

    repeated_domain_count = 0
    if safe_domain:
        _DOMAIN_COUNTER[safe_domain] += 1
        repeated_domain_count = _DOMAIN_COUNTER[safe_domain]
        _LAST_SEEN[safe_domain] = datetime.now(timezone.utc).isoformat()

    max_cluster_frequency = 0
    for cluster in clusters:
        _CLUSTER_COUNTER[cluster] += 1
        max_cluster_frequency = max(max_cluster_frequency, _CLUSTER_COUNTER[cluster])

    pattern_recurrence_score = min(
        100,
        (repeated_domain_count * 14) + (max_cluster_frequency * 8),
    )
    watchlist_match = repeated_domain_count >= 2 or max_cluster_frequency >= 2

    return {
        "repeated_domain_count": repeated_domain_count,
        "watchlist_match": watchlist_match,
        "pattern_recurrence_score": pattern_recurrence_score,
        "max_cluster_frequency": max_cluster_frequency,
        "last_seen_at": _LAST_SEEN.get(safe_domain),
    }
