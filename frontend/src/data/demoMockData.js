const DEMO_RIGHTS_EMAIL =
  process.env.NEXT_PUBLIC_DEMO_RIGHTS_EMAIL || "rights@demo-broadcast.com";

const SPORT_DEFINITIONS = {
  cricket: {
    league: "Cricket Premier League",
    eventPool: ["India vs Australia 2nd ODI", "IPL Final", "Ashes Test Day 3"],
    tokens: ["free stream", "live link", "watch now", "mirror", "hd feed"],
    regions: ["South Asia", "UK", "Middle East", "Australia"],
    targetDomains: ["cricketstreamnow.tv", "wickets-livefeed.net", "coverdrive-watch.co", "inningsrelay.tv"],
  },
  football: {
    league: "Champions Cup",
    eventPool: ["Champions League Final", "El Clasico", "Premier League Derby"],
    tokens: ["watch live", "free match", "stream now", "no blackout", "mirror link"],
    regions: ["Europe", "MENA", "South America", "West Africa"],
    targetDomains: ["football-livehub.net", "goalcastmirror.tv", "derbystreamline.co", "ucl-feedhub.com"],
  },
  basketball: {
    league: "Pro Basketball Finals",
    eventPool: ["Lakers vs Celtics", "NBA Playoffs Round 1", "Finals Game 6"],
    tokens: ["nba stream", "watch free", "live game link", "hd stream", "backup link"],
    regions: ["North America", "Philippines", "LATAM", "Europe"],
    targetDomains: ["courtside-access.co", "hoopstreamcentral.net", "basketrelaylive.tv", "finalsfastbreak.com"],
  },
  esports: {
    league: "Global Esports Series",
    eventPool: ["Valorant Masters Madrid", "CS2 Major", "League of Legends Worlds"],
    tokens: ["live tournament", "stream key", "watch free", "mirror lobby", "vod leak"],
    regions: ["North America", "Europe", "SEA", "South Korea"],
    targetDomains: ["esportsrelay.gg", "fragstreamhub.gg", "playoffspectator.net", "gg-watchline.com"],
  },
  motorsport: {
    league: "World Racing Championship",
    eventPool: ["Monaco Grand Prix", "Silverstone Qualifying", "MotoGP Sprint"],
    tokens: ["live race stream", "onboard feed", "pitlane stream", "no geo lock", "mirror replay"],
    regions: ["Europe", "North America", "Middle East", "APAC"],
    targetDomains: ["motorsportracefeed.com", "pitlane-livecast.net", "gpstreamtrack.tv", "racegridrelay.co"],
  },
};

const PLATFORMS = ["Reddit", "X/Twitter", "Telegram", "Facebook", "Instagram", "Discord", "Forum", "Unknown"];
const SOURCE_NAMES = [
  "PublicWatchBoard",
  "SignalTrackHub",
  "OpenSportsFeed",
  "TrendLeakMonitor",
  "StreamPulseNode",
  "SocialSignalGrid",
];
const IMPORTANCE_LEVELS = ["High", "Medium", "Low"];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function scoreRiskSignal({
  suspicious_keywords_count,
  stream_link_detected,
  estimated_viewers,
  repeat_offender_score,
  match_importance,
}) {
  // Transparent demo scoring formula for mock/fallback behavior.
  const keywordWeight = suspicious_keywords_count * 6;
  const streamWeight = stream_link_detected ? 26 : 0;
  const viewerWeight = Math.min(22, Math.round(estimated_viewers / 700));
  const repeatWeight = Math.round(clamp(repeat_offender_score, 0, 1) * 22);
  const importanceWeight = match_importance === "High" ? 16 : match_importance === "Medium" ? 9 : 4;

  const risk_score = clamp(keywordWeight + streamWeight + viewerWeight + repeatWeight + importanceWeight, 0, 100);
  const risk_level = risk_score >= 75 ? "High" : risk_score >= 45 ? "Medium" : "Low";
  const risk_color = risk_level === "High" ? "red" : risk_level === "Medium" ? "yellow" : "green";

  return { risk_score, risk_level, risk_color };
}

function buildExplanation(item) {
  const linkText = item.stream_link_detected ? "Direct stream link detected" : "No direct stream link detected";
  return `${linkText}; ${item.suspicious_keywords_count} suspicious keyword matches; estimated reach ${item.estimated_viewers.toLocaleString()} viewers; repeat offender score ${item.repeat_offender_score.toFixed(2)}; match importance ${item.match_importance}.`;
}

export function buildEmailDraft(item) {
  return {
    to: DEMO_RIGHTS_EMAIL,
    subject: `High-Risk Piracy Alert Detected - ${item.sport.toUpperCase()} - ${item.platform}`,
    body: [
      "Dear Rights Protection Team,",
      "",
      "A high-risk piracy signal has been detected in the demo monitoring workflow.",
      "",
      `Sport: ${item.sport}`,
      `Platform: ${item.platform}`,
      `Flagged content: ${item.title}`,
      `Risk score: ${item.risk_score}`,
      `Why flagged: ${item.explanation}`,
      `Timestamp: ${item.timestamp}`,
      "Suggested next action: Review evidence, validate ownership impact, and prepare a takedown notice if confirmed.",
      "",
      "Status: Email Prepared (demo mode, not sent automatically).",
    ].join("\n"),
  };
}

function buildSportMockRecords(sportKey, count = 20) {
  const config = SPORT_DEFINITIONS[sportKey];
  const sportOrder = Object.keys(SPORT_DEFINITIONS);
  const sportIndex = sportOrder.indexOf(sportKey);
  // Use a deterministic daily anchor so SSR and hydration render identical timestamps.
  const now = Date.parse(`${new Date().toISOString().slice(0, 10)}T20:00:00.000Z`);

  return Array.from({ length: count }, (_, idx) => {
    const platform = PLATFORMS[idx % PLATFORMS.length];
    const tokenA = config.tokens[idx % config.tokens.length];
    const tokenB = config.tokens[(idx + 2) % config.tokens.length];
    const match_importance = IMPORTANCE_LEVELS[idx % IMPORTANCE_LEVELS.length];
    const stream_link_detected = idx % 4 !== 3;
    const suspicious_keywords_count = stream_link_detected ? 4 + (idx % 5) : 1 + (idx % 3);
    const estimated_viewers = 900 + idx * 410 + sportIndex * 280 + (stream_link_detected ? 1900 : 0);
    const repeat_offender_score = clamp(0.2 + ((idx * 0.07) % 0.75), 0, 0.95);
    const minutesBack = (idx * 59 + sportIndex * 13) % (24 * 60 - 6);
    const secondsBack = (idx * 23 + sportIndex * 11) % 59;
    const timestamp = new Date(now - minutesBack * 60 * 1000 - secondsBack * 1000).toISOString();
    const source_name = SOURCE_NAMES[idx % SOURCE_NAMES.length];
    const geo_region = config.regions[idx % config.regions.length];
    const active_event = config.eventPool[idx % config.eventPool.length];
    const targetDomain = config.targetDomains[idx % config.targetDomains.length];
    const target_url = `https://${targetDomain}/live/${active_event.toLowerCase().replace(/[^a-z0-9]+/g, "-")}?src=${platform.toLowerCase().replace(/[^a-z0-9]+/g, "")}&ref=${200 + idx}`;
    const title = `${active_event}: ${tokenA} ${tokenB} thread`;
    const post_text = `${config.league} watchers asking for "${tokenA}" and "${tokenB}" in public discussion channels.`;
    const status = idx % 6 === 0 ? "Escalated" : idx % 2 === 0 ? "Under Review" : "Monitoring";

    const scored = scoreRiskSignal({
      suspicious_keywords_count,
      stream_link_detected,
      estimated_viewers,
      repeat_offender_score,
      match_importance,
    });

    const item = {
      id: `${sportKey}-${idx + 1}`,
      sport: sportKey,
      platform,
      target_url,
      title,
      post_text,
      source_name,
      detected_at: timestamp,
      timestamp,
      estimated_viewers,
      suspicious_keywords_count,
      stream_link_detected,
      repeat_offender_score,
      geo_region,
      match_importance,
      risk_score: scored.risk_score,
      risk_level: scored.risk_level,
      risk_color: scored.risk_color,
      status,
      explanation: "",
      active_event,
      cluster_id: `${sportKey.slice(0, 1).toUpperCase()}-${1000 + idx}`,
      domain: targetDomain,
      url: target_url,
      combined_risk_score: scored.risk_score,
      combined_risk_level: scored.risk_level,
    };

    item.explanation = buildExplanation(item);
    item.email_status = scored.risk_level === "High" ? "Email Prepared" : "Not Prepared";
    item.email_draft = scored.risk_level === "High" ? buildEmailDraft(item) : null;
    return item;
  });
}

export const DEMO_SPORTS = ["cricket", "football", "basketball", "esports", "motorsport"];

export const DEMO_MOCK_BY_SPORT = DEMO_SPORTS.reduce((acc, sportKey) => {
  acc[sportKey] = buildSportMockRecords(sportKey, 20);
  return acc;
}, {});

const uniqueScoreSet = new Set();
DEMO_SPORTS.forEach((sportKey) => {
  DEMO_MOCK_BY_SPORT[sportKey] = DEMO_MOCK_BY_SPORT[sportKey].map((item) => {
    let nextScore = item.risk_score;
    while (uniqueScoreSet.has(nextScore)) {
      nextScore = nextScore >= 100 ? 0 : nextScore + 1;
    }
    uniqueScoreSet.add(nextScore);
    const risk_level = nextScore >= 75 ? "High" : nextScore >= 40 ? "Medium" : "Low";
    const risk_color = risk_level === "High" ? "red" : risk_level === "Medium" ? "yellow" : "green";
    const updated = { ...item, risk_score: nextScore, risk_level, risk_color, combined_risk_score: nextScore, combined_risk_level: risk_level };
    updated.explanation = buildExplanation(updated);
    updated.email_status = risk_level === "High" ? "Email Prepared" : "Not Prepared";
    updated.email_draft = risk_level === "High" ? buildEmailDraft(updated) : null;
    return updated;
  });
});

export const DEMO_MOCK_ALL = DEMO_SPORTS.flatMap((sportKey) => DEMO_MOCK_BY_SPORT[sportKey]);

export function getDemoIncidentsForSport(sportKey) {
  return DEMO_MOCK_BY_SPORT[sportKey] || [];
}

export function buildSummaryFromIncidents(incidents) {
  const active = incidents?.length ? incidents : DEMO_MOCK_ALL;
  const total_posts = active.length;
  const high_risk_posts = active.filter((item) => item.risk_level === "High").length;
  const average_combined_risk_score =
    total_posts > 0 ? active.reduce((sum, item) => sum + item.risk_score, 0) / (total_posts * 100) : 0;

  const domainCounts = active.reduce((acc, item) => {
    const key = item.domain || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const top_suspicious_domain =
    Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

  return { total_posts, high_risk_posts, average_combined_risk_score, top_suspicious_domain };
}
