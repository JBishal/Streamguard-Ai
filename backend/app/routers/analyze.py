import json
from pathlib import Path

from fastapi import APIRouter

from app.services.rule_engine import score_post

router = APIRouter()


@router.get("/analyze-mock")
def analyze_mock_posts():
    data_path = Path(__file__).resolve().parents[3] / "data" / "mock_posts.json"

    with open(data_path, "r", encoding="utf-8") as file:
        posts = json.load(file)

    results = []
    for post in posts:
        analysis = score_post(post["post_text"], post["url"])
        results.append({
            **post,
            **analysis,
        })

    return {"results": results}
