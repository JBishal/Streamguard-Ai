import json
import os

import google.generativeai as genai


def classify_with_gemini(post_text: str, url: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return {
            "ai_used": False,
            "is_piracy": True,
            "gemini_score": 70,
            "gemini_confidence": 0.75,
            "gemini_reason": "Mock Gemini response because GEMINI_API_KEY is not set.",
        }

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
You are analyzing whether a public online post is likely related to unauthorized streaming piracy.

Post text: {post_text}
URL: {url}

Return ONLY valid JSON with this structure:
{{
  "is_piracy": true,
  "gemini_score": 0,
  "gemini_confidence": 0.0,
  "gemini_reason": "short explanation"
}}

Rules:
- gemini_score must be an integer from 0 to 100
- gemini_confidence must be a float from 0.0 to 1.0
- Keep gemini_reason short
- Output JSON only
"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        text = text.replace("```json", "").replace("```", "").strip()

        data = json.loads(text)
        data["ai_used"] = True
        return data

    except Exception as e:
        return {
            "ai_used": False,
            "is_piracy": False,
            "gemini_score": 0,
            "gemini_confidence": 0.0,
            "gemini_reason": f"Gemini call failed: {str(e)}",
        }
