from urllib.parse import urlparse


SUSPICIOUS_KEYWORDS = [
    "watch free",
    "free live stream",
    "live stream",
    "hd no ads",
    "watch online free",
    "stream free",
    "full match free",
]


def extract_domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc.lower()


def calculate_engagement_score(upvotes: int, comments: int) -> int:
    score = upvotes * 2 + comments * 3
    return min(score, 100)


def get_risk_level(score: int) -> str:
    if score >= 75:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


def score_post(post_text: str, url: str, upvotes: int, comments: int) -> dict:
    text = post_text.lower()
    reasons = []
    rule_score = 0

    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in text:
            rule_score += 15
            reasons.append(f"Matched suspicious keyword: '{keyword}'")

    domain = extract_domain(url)

    suspicious_tlds = [".live", ".xyz", ".click", ".stream"]
    for tld in suspicious_tlds:
        if domain.endswith(tld):
            rule_score += 20
            reasons.append(f"Suspicious domain ending: '{tld}'")
            break

    rule_score = min(rule_score, 100)
    engagement_score = calculate_engagement_score(upvotes, comments)
    base_risk_score = min(int(rule_score * 0.7 + engagement_score * 0.3), 100)
    risk_level = get_risk_level(base_risk_score)

    return {
        "domain": domain,
        "rule_score": rule_score,
        "engagement_score": engagement_score,
        "base_risk_score": base_risk_score,
        "risk_level": risk_level,
        "reasons": reasons,
    }
