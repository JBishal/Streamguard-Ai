import os
from collections import Counter

import google.generativeai as genai


def generate_insights(results: list) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")

    total_posts = len(results)
    high_risk = [r for r in results if r["combined_risk_level"] == "High"]
    domains = [r["domain"] for r in results]
    domain_counts = Counter(domains)

    top_domains = domain_counts.most_common(3)

    if not api_key:
        return {
            "ai_used": False,
            "summary": "Mock insights: High-risk piracy activity detected. Certain domains appear repeatedly.",
            "top_domains": top_domains,
            "high_risk_count": len(high_risk),
        }

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
You are analyzing piracy exposure data.

Total posts: {total_posts}
High risk posts: {len(high_risk)}
Top domains: {top_domains}

Write a short insight summary (3-4 lines max) explaining:
- key trend
- risk level
- what media companies should watch

Keep it professional and concise.
"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        return {
            "ai_used": True,
            "summary": text,
            "top_domains": top_domains,
            "high_risk_count": len(high_risk),
        }

    except Exception as e:
        return {
            "ai_used": False,
            "summary": f"Insight generation failed: {str(e)}",
            "top_domains": top_domains,
            "high_risk_count": len(high_risk),
        }
