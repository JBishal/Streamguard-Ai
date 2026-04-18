export const fallbackIncidents = [
  {
    platform: "Reddit",
    post_text: "Watch Champions League free live stream HD no ads",
    url: "http://streamxyz.live/match",
    upvotes: 245,
    comments: 31,
    domain: "streamxyz.live",
    rule_score: 65,
    engagement_score: 100,
    base_risk_score: 75,
    gemini_score: 82,
    gemini_confidence: 0.86,
    gemini_reason: "Post language and domain pattern match piracy-sharing behavior.",
    ai_used: false,
    combined_risk_score: 79,
    combined_confidence: 0.78,
    combined_risk_level: "High",
    reasons: [
      "Matched suspicious keyword: 'watch free'",
      "Matched suspicious keyword: 'free live stream'",
      "Suspicious domain ending: '.live'",
    ],
  },
  {
    platform: "Reddit",
    post_text: "Where can I watch the match online free?",
    url: "http://freematchnow.xyz/live",
    upvotes: 122,
    comments: 14,
    domain: "freematchnow.xyz",
    rule_score: 50,
    engagement_score: 100,
    base_risk_score: 65,
    gemini_score: 70,
    gemini_confidence: 0.72,
    gemini_reason: "Request pattern suggests active search for unauthorized streams.",
    ai_used: false,
    combined_risk_score: 67,
    combined_confidence: 0.71,
    combined_risk_level: "Medium",
    reasons: [
      "Matched suspicious keyword: 'watch online free'",
      "Suspicious domain ending: '.xyz'",
    ],
  },
];

export const fallbackSummary = {
  total_posts: fallbackIncidents.length,
  high_risk_posts: fallbackIncidents.filter(
    (item) => item.combined_risk_level === "High",
  ).length,
  average_combined_risk_score: Math.round(
    fallbackIncidents.reduce((sum, item) => sum + item.combined_risk_score, 0) /
      fallbackIncidents.length,
  ),
  top_suspicious_domain: "streamxyz.live",
  top_domain_count: 1,
};

export const fallbackInsights = {
  ai_used: false,
  summary:
    "Signals indicate sustained demand for live-event piracy links with recurring suspicious domains. Focus response on high-engagement posts where exposure can accelerate quickly.",
  top_domains: [
    ["streamxyz.live", 1],
    ["freematchnow.xyz", 1],
  ],
  high_risk_count: 1,
};
