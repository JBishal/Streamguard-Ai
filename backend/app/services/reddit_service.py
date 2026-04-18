import json
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


def fetch_sport_posts(sport: str, limit: int = 18) -> tuple[list, bool]:
    sport_key = (sport or "").lower()
    config = SPORT_CONFIG.get(sport_key)
    if not config:
        return _fallback_posts_for_sport(sport_key), True

    query = " OR ".join(config["queries"])
    subreddit_filter = "+".join(config["subreddits"])
    url = f"https://www.reddit.com/r/{subreddit_filter}/search.json"
    params = {"q": query, "restrict_sr": 1, "sort": "new", "limit": limit}
    headers = {"User-Agent": "StreamGuardAI/0.1 (hackathon-demo)"}

    try:
        response = requests.get(url, params=params, headers=headers, timeout=6)
        if response.status_code != 200:
            return _fallback_posts_for_sport(sport_key), True
        payload = response.json()
        children = payload.get("data", {}).get("children", [])
        if not children:
            return _fallback_posts_for_sport(sport_key), True

        posts = []
        for child in children:
            normalized = _normalize_reddit_post(child.get("data", {}), sport_key)
            if normalized["post_text"] and _is_likely_live_piracy_signal(normalized):
                posts.append(normalized)
        if not posts:
            return _fallback_posts_for_sport(sport_key), True
        return posts, False
    except Exception:
        return _fallback_posts_for_sport(sport_key), True
