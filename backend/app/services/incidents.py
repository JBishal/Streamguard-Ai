from __future__ import annotations

import json
from pathlib import Path

from pydantic import BaseModel, Field


REPO_ROOT = Path(__file__).resolve().parents[3]
MOCK_POSTS_PATH = REPO_ROOT / "data" / "mock_posts.json"

KEYWORD_WEIGHTS = {
    "free": 25,
    "live stream": 25,
    "watch": 10,
    "stream": 10,
    "online": 8,
    "hd": 6,
    "no ads": 6,
}

SUSPICIOUS_TLDS = {
    ".live": 18,
    ".xyz": 18,
    ".click": 18,
    ".top": 12,
}


class SourcePost(BaseModel):
    platform: str
    post_text: str
    url: str
    upvotes: int = Field(ge=0)
    comments: int = Field(ge=0)


class Incident(BaseModel):
    platform: str
    post_text: str
    url: str
    upvotes: int
    comments: int
    matched_keywords: list[str]
    piracy_confidence: int = Field(ge=0, le=100)
    engagement_score: int = Field(ge=0, le=100)
    exposure_score: int = Field(ge=0, le=100)
    priority: str


def load_mock_posts() -> list[SourcePost]:
    raw_posts = json.loads(MOCK_POSTS_PATH.read_text())
    return [SourcePost.model_validate(post) for post in raw_posts]


def build_mock_incidents() -> list[Incident]:
    posts = load_mock_posts()
    return [score_post(post) for post in posts]


def score_post(post: SourcePost) -> Incident:
    text = post.post_text.lower()
    matched_keywords = [
        keyword for keyword in KEYWORD_WEIGHTS if keyword in text
    ]
    keyword_score = sum(KEYWORD_WEIGHTS[keyword] for keyword in matched_keywords)
    url_score = sum(weight for tld, weight in SUSPICIOUS_TLDS.items() if tld in post.url.lower())

    piracy_confidence = min(100, keyword_score + url_score)
    engagement_score = min(100, round(post.upvotes * 0.25 + post.comments * 1.5))
    exposure_score = min(
        100,
        round((piracy_confidence * 0.65) + (engagement_score * 0.35)),
    )

    if exposure_score >= 80:
        priority = "high"
    elif exposure_score >= 55:
        priority = "medium"
    else:
        priority = "low"

    return Incident(
        platform=post.platform,
        post_text=post.post_text,
        url=post.url,
        upvotes=post.upvotes,
        comments=post.comments,
        matched_keywords=matched_keywords,
        piracy_confidence=piracy_confidence,
        engagement_score=engagement_score,
        exposure_score=exposure_score,
        priority=priority,
    )
