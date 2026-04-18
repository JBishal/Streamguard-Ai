import json
from pathlib import Path

from fastapi import APIRouter

from app.services.gemini_service import classify_with_gemini
from app.services.rule_engine import score_post
from app.services.scoring_service import combine_scores

router = APIRouter()


@router.get("/analyze-mock")
def analyze_mock_posts():
    data_path = Path(__file__).resolve().parents[3] / "data" / "mock_posts.json"

    with open(data_path, "r", encoding="utf-8") as file:
        posts = json.load(file)

    results = []
    for post in posts:
        rule_analysis = score_post(
            post["post_text"],
            post["url"],
            post["upvotes"],
            post["comments"],
        )

        gemini_analysis = classify_with_gemini(
            post["post_text"],
            post["url"],
        )

        combined_analysis = combine_scores(rule_analysis, gemini_analysis)

        results.append({
            **post,
            **rule_analysis,
            **gemini_analysis,
            **combined_analysis,
        })

    return {"results": results}
