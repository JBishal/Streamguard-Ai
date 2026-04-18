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


def score_post(post_text: str, url: str) -> dict:
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

    return {
        "domain": domain,
        "rule_score": rule_score,
        "reasons": reasons,
    }
