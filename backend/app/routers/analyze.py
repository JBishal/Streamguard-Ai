import json
from collections import Counter
from pathlib import Path

from fastapi import APIRouter

from app.services.gemini_service import classify_with_gemini
from app.services.rule_engine import score_post
from app.services.scoring_service import combine_scores

router = APIRouter()


def load_and_analyze_posts():
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

    return results


@router.get("/analyze-mock")
def analyze_mock_posts():
    return {"results": load_and_analyze_posts()}


@router.get("/summary")
def get_summary():
    results = load_and_analyze_posts()

    total_posts = len(results)
    high_risk_posts = sum(1 for item in results if item["combined_risk_level"] == "High")

    average_score = 0
    if total_posts > 0:
        average_score = round(
            sum(item["combined_risk_score"] for item in results) / total_posts,
            2,
        )

    domains = [item["domain"] for item in results]
    domain_counts = Counter(domains)
    top_domain = None
    top_domain_count = 0

    if domain_counts:
        top_domain, top_domain_count = domain_counts.most_common(1)[0]

    return {
        "total_posts": total_posts,
        "high_risk_posts": high_risk_posts,
        "average_combined_risk_score": average_score,
        "top_suspicious_domain": top_domain,
        "top_domain_count": top_domain_count,
    }
