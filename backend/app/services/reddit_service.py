import json
import logging
from pathlib import Path
from urllib.parse import urlparse

import requests


SPORT_CONFIG = {
    "football": {
        "subreddits": ["soccer", "championsleague", "premierleague", "realmadrid", "barcelona"],
        "queries": [
            "live stream",
            "free stream",
            "watch match",
            "watch free",
            "join live",
            "live match link",
            "stream link",
            "hd stream",
            "no ads live",
            "ucl",
            "el clasico",
            "london derby",
            "rivalry match",
            "final",
        ],
    },
    "cricket": {
        "subreddits": ["cricket", "ipl"],
        "queries": [
            "live stream",
            "watch match",
            "watch free",
            "join live",
            "free stream",
            "live match link",
            "stream link",
            "hd stream",
            "no ads live",
            "ipl",
            "rcb vs csk",
            "playoff",
            "final",
            "rivalry fixture",
        ],
    },
    "basketball": {
        "subreddits": ["nba", "basketball", "collegebasketball"],
        "queries": [
            "live stream",
            "watch game",
            "watch game free",
            "join live",
            "free stream",
            "live game thread",
            "stream link",
            "hd stream",
            "no ads live",
            "playoff",
            "finals",
            "closeout game",
            "national matchup",
        ],
    },
}

LIVE_PIRACY_INTENT_TERMS = [
    "watch free",
    "join live",
    "live stream",
    "free stream",
    "watch match free",
    "watch game free",
    "stream link",
    "hd live",
    "no ads live",
    "live now",
    "full match live",
]

logger = logging.getLogger(__name__)


def _load_mock_posts() -> list:
    data_path = Path(__file__).resolve().parents[3] / "data" / "mock_posts.json"
    with open(data_path, "r", encoding="utf-8") as file:
        return json.load(file)


def _detect_sport_from_text(text: str) -> str:
    lowered = (text or "").lower()
    if any(word in lowered for word in ["football", "soccer", "ucl", "champions league", "el clasico"]):
        return "football"
    if any(word in lowered for word in ["cricket", "ipl", "rcb", "csk"]):
        return "cricket"
    if any(word in lowered for word in ["basketball", "nba", "playoff", "finals"]):
        return "basketball"
    return "unknown"


def _normalize_reddit_post(post: dict, sport: str) -> dict:
    subreddit = post.get("subreddit", "")
    permalink = post.get("permalink", "")
    created_utc = post.get("created_utc")
    post_id = post.get("id", "")
    raw_url = post.get("url_overridden_by_dest") or post.get("url", "")
    if raw_url and "reddit.com" not in raw_url and "redd.it" not in raw_url:
        incident_url = raw_url
    else:
        incident_url = f"https://reddit.com{permalink}" if permalink else raw_url
    return {
        "platform": "Reddit",
        "post_text": post.get("title") or "",
        "url": incident_url,
        "upvotes": int(post.get("ups", 0) or 0),
        "comments": int(post.get("num_comments", 0) or 0),
        "subreddit": subreddit,
        "sport": sport,
        "permalink": f"https://reddit.com{permalink}" if permalink else "",
        "post_id": post_id,
        "created_utc": created_utc,
    }


def _is_likely_live_piracy_signal(post: dict) -> bool:
    post_text = (post.get("post_text") or "").lower()
    url = (post.get("url") or "").lower()
    domain = urlparse(url).netloc.lower()

    has_intent_phrase = any(term in post_text for term in LIVE_PIRACY_INTENT_TERMS)
    has_link_signal = "http" in url and "reddit.com" not in domain and "redd.it" not in domain
    has_domain_risk = any(domain.endswith(tld) for tld in [".live", ".xyz", ".click", ".stream"])
    return has_intent_phrase and (has_link_signal or has_domain_risk)


def _fallback_posts_for_sport(sport: str) -> list:
    mock_posts = _load_mock_posts()
    filtered = [p for p in mock_posts if _detect_sport_from_text(p.get("post_text", "")) == sport]
    if filtered:
        for post in filtered:
            post["sport"] = sport
        return filtered
    return []


def _build_fetch_debug(
    *,
    source_status: str,
    reddit_fetch_success: bool,
    reddit_error_message: str,
    fetched_posts_count: int,
    candidate_incidents_count: int,
    fallback_used: bool,
) -> dict:
    return {
        "source_status": source_status,
        "reddit_fetch_success": reddit_fetch_success,
        "reddit_error_message": reddit_error_message,
        "fetched_posts_count": fetched_posts_count,
        "candidate_incidents_count": candidate_incidents_count,
        "fallback_used": fallback_used,
    }


def _fetch_reddit_comment_snippets(subreddit: str, post_id: str, limit: int = 2) -> list:
    if not subreddit or not post_id:
        return []
    comments_url = f"https://www.reddit.com/r/{subreddit}/comments/{post_id}.json"
    headers = {"User-Agent": "StreamGuardAI/0.1 (hackathon-demo)"}
    params = {"limit": max(1, min(limit, 5)), "sort": "top"}
    try:
        response = requests.get(comments_url, params=params, headers=headers, timeout=6)
        if response.status_code != 200:
            return []
        payload = response.json()
        if not isinstance(payload, list) or len(payload) < 2:
            return []
        children = payload[1].get("data", {}).get("children", [])
        snippets = []
        for child in children:
            data = child.get("data", {})
            body = (data.get("body") or "").strip()
            if body:
                snippets.append(body[:180])
            if len(snippets) >= limit:
                break
        return snippets
    except Exception:
        return []


def fetch_sport_posts(
    sport: str,
    limit: int = 18,
    mode: str = "live",
) -> tuple[list, bool, dict]:
    sport_key = (sport or "").lower()
    mode_key = (mode or "live").lower()
    is_historical_mode = mode_key == "historical_validation"
    config = SPORT_CONFIG.get(sport_key)
    if not config:
        fallback_posts = _fallback_posts_for_sport(sport_key)
        reason = f"Unsupported sport '{sport_key}' for live Reddit fetch."
        logger.warning("Reddit live fetch fallback: %s", reason)
        return fallback_posts, True, _build_fetch_debug(
            source_status="fallback_mock",
            reddit_fetch_success=False,
            reddit_error_message=reason,
            fetched_posts_count=0,
            candidate_incidents_count=len(fallback_posts),
            fallback_used=True,
        )

    query = " OR ".join(config["queries"])
    subreddit_filter = "+".join(config["subreddits"])
    url = f"https://www.reddit.com/r/{subreddit_filter}/search.json"
    params = {"q": query, "restrict_sr": 1, "sort": "new", "limit": limit}
    if is_historical_mode:
        params["sort"] = "top"
        params["t"] = "year"
    headers = {"User-Agent": "StreamGuardAI/0.1 (hackathon-demo)"}

    try:
        response = requests.get(url, params=params, headers=headers, timeout=6)
        if response.status_code != 200:
            fallback_posts = _fallback_posts_for_sport(sport_key)
            reason = f"Reddit API returned HTTP {response.status_code}."
            logger.warning("Reddit live fetch fallback: %s", reason)
            return fallback_posts, True, _build_fetch_debug(
                source_status="fallback_mock",
                reddit_fetch_success=False,
                reddit_error_message=reason,
                fetched_posts_count=0,
                candidate_incidents_count=len(fallback_posts),
                fallback_used=True,
            )
        payload = response.json()
        children = payload.get("data", {}).get("children", [])
        if not children:
            fallback_posts = _fallback_posts_for_sport(sport_key)
            reason = "Reddit response contained zero posts for query."
            logger.warning("Reddit live fetch fallback: %s", reason)
            return fallback_posts, True, _build_fetch_debug(
                source_status="fallback_mock",
                reddit_fetch_success=False,
                reddit_error_message=reason,
                fetched_posts_count=0,
                candidate_incidents_count=len(fallback_posts),
                fallback_used=True,
            )

        posts = []
        for child in children:
            normalized = _normalize_reddit_post(child.get("data", {}), sport_key)
            if normalized["post_text"] and _is_likely_live_piracy_signal(normalized):
                posts.append(normalized)
        if is_historical_mode:
            for post in posts[:3]:
                post["comment_snippets"] = _fetch_reddit_comment_snippets(
                    post.get("subreddit", ""),
                    post.get("post_id", ""),
                    limit=2,
                )
                post["historical_mode"] = True
                post["data_mode"] = "historical_validation"
                post["data_label"] = "historical_replay"
        if not posts:
            fallback_posts = _fallback_posts_for_sport(sport_key)
            reason = "No candidate incidents passed live piracy intent filters."
            logger.warning("Reddit live fetch fallback: %s", reason)
            return fallback_posts, True, _build_fetch_debug(
                source_status="fallback_mock",
                reddit_fetch_success=False,
                reddit_error_message=reason,
                fetched_posts_count=len(children),
                candidate_incidents_count=len(fallback_posts),
                fallback_used=True,
            )
        return posts, False, _build_fetch_debug(
            source_status="historical_reddit" if is_historical_mode else "live_reddit",
            reddit_fetch_success=True,
            reddit_error_message="",
            fetched_posts_count=len(children),
            candidate_incidents_count=len(posts),
            fallback_used=False,
        )
    except Exception as exc:
        fallback_posts = _fallback_posts_for_sport(sport_key)
        reason = f"Reddit request exception: {str(exc)[:200]}"
        logger.warning("Reddit live fetch fallback: %s", reason)
        return fallback_posts, True, _build_fetch_debug(
            source_status="fallback_mock",
            reddit_fetch_success=False,
            reddit_error_message=reason,
            fetched_posts_count=0,
            candidate_incidents_count=len(fallback_posts),
            fallback_used=True,
        )
