import { NextResponse } from "next/server";
import { DEMO_SPORTS } from "@/data/demoMockData";

const K2_BASE_URL = process.env.K2_BASE_URL;
const K2_API_KEY = process.env.K2_API_KEY;
const K2_MODEL = process.env.K2_MODEL;
const PIA_BASE_URL = process.env.PIA_BASE_URL;
const PIA_API_KEY = process.env.PIA_API_KEY;
const PIA_MODEL = process.env.PIA_MODEL;
const OPENAI_COMPAT_BASE_URL = process.env.OPENAI_COMPAT_BASE_URL;
const OPENAI_COMPAT_API_KEY = process.env.OPENAI_COMPAT_API_KEY;
const OPENAI_COMPAT_MODEL = process.env.OPENAI_COMPAT_MODEL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const DEMO_PIA_ENABLE_GENERATED_DATA = process.env.DEMO_PIA_ENABLE_GENERATED_DATA === "true";

const SPORT_REGIONS = {
  football: "Europe",
  cricket: "South Asia",
  basketball: "North America",
  esports: "Global",
  motorsport: "Europe",
};

const scoreFromRecord = (record) => {
  const keywords = Number(record.suspicious_keywords_count ?? 3);
  const hasLink = Boolean(record.stream_link_detected ?? (record.url || record.target_url));
  const viewers = Number(record.estimated_viewers ?? ((record.upvotes || 0) * 7 + (record.comments || 0) * 12 + 400));
  const repeat = Number(record.repeat_offender_score ?? 0.45);
  const importance = String(record.match_importance || "Medium");
  const importanceWeight = importance === "High" ? 16 : importance === "Medium" ? 9 : 4;
  const score = Math.max(0, Math.min(100, keywords * 6 + (hasLink ? 24 : 0) + Math.min(22, Math.round(viewers / 900)) + Math.round(repeat * 20) + importanceWeight));
  const risk_level = score >= 75 ? "High" : score >= 40 ? "Medium" : "Low";
  const risk_color = risk_level === "High" ? "red" : risk_level === "Medium" ? "yellow" : "green";
  return { score, risk_level, risk_color, viewers };
};

const normalizeRecord = (raw, idx, sport = "football") => {
  const platform = raw.platform || "Unknown";
  const target_url = raw.target_url || raw.url || "";
  const detected_at = raw.detected_at || raw.timestamp || new Date(Date.now() - idx * 3600 * 1000).toISOString();
  const scored = scoreFromRecord(raw);
  return {
    id: raw.id || `api-${sport}-${idx + 1}`,
    sport,
    platform,
    target_url,
    source_name: raw.source_name || `${platform} Signal`,
    title: raw.title || raw.post_text || "Potential unauthorized stream signal",
    post_text: raw.post_text || raw.title || "Potential unauthorized stream signal",
    detected_at,
    timestamp: detected_at,
    estimated_viewers: scored.viewers,
    suspicious_keywords_count: Number(raw.suspicious_keywords_count ?? 3),
    stream_link_detected: Boolean(raw.stream_link_detected ?? target_url),
    repeat_offender_score: Number(raw.repeat_offender_score ?? 0.45),
    geo_region: raw.geo_region || SPORT_REGIONS[sport] || "Global",
    match_importance: raw.match_importance || "Medium",
    risk_score: scored.score,
    risk_level: scored.risk_level,
    risk_color: scored.risk_color,
    status: raw.status || "Under Review",
    explanation:
      raw.explanation ||
      `Signal from ${platform} flagged with risk ${scored.score} due to keyword density, audience reach, and repeated behavior.`,
  };
};

const extractJsonFromText = (text = "") => {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const firstBracket = candidate.indexOf("[");
  const lastBracket = candidate.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return candidate.slice(firstBracket, lastBracket + 1);
  }
  return candidate;
};

const buildIncidentPrompt = (sport) =>
  `Generate 12 realistic ${sport} piracy-signal incident records as a JSON array. ` +
  `Each object should include: platform, post_text, target_url, source_name, detected_at, estimated_viewers, ` +
  `suspicious_keywords_count, stream_link_detected, repeat_offender_score, geo_region, match_importance, explanation. ` +
  `Return JSON array only.`;

const fetchFromCompatApi = async ({ baseUrl, apiKey, model, sport }) => {
  const response = await fetch(`${baseUrl}/v1/incidents?sport=${encodeURIComponent(sport)}&model=${encodeURIComponent(model)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.ok) {
    const payload = await response.json();
    const records = Array.isArray(payload) ? payload : Array.isArray(payload?.incidents) ? payload.incidents : [];
    return { records, source: "api" };
  }

  const chatRes = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: "Return only JSON array. Generate realistic sports piracy signals." },
        { role: "user", content: buildIncidentPrompt(sport) },
      ],
    }),
    cache: "no-store",
  });

  if (!chatRes.ok) return { records: [], source: `api-failed:${chatRes.status}` };
  const chatPayload = await chatRes.json();
  const content = chatPayload?.choices?.[0]?.message?.content || "";
  const jsonText = extractJsonFromText(content);
  const parsed = JSON.parse(jsonText);
  return { records: Array.isArray(parsed) ? parsed : [], source: "api-chat" };
};

const fetchFromGemini = async ({ sport }) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildIncidentPrompt(sport) }] }],
        generationConfig: { temperature: 0.4 },
      }),
      cache: "no-store",
    },
  );
  if (!response.ok) return { records: [], source: `gemini-failed:${response.status}` };

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("\n") || "";
  const jsonText = extractJsonFromText(text);
  const parsed = JSON.parse(jsonText);
  return { records: Array.isArray(parsed) ? parsed : [], source: "gemini" };
};

const createGeneratedIncidents = (sport) => {
  const platformPool = ["Reddit", "Telegram", "X/Twitter", "Discord", "Forum"];
  const eventMap = {
    football: "Champions League Final",
    cricket: "India vs Australia 2nd ODI",
    basketball: "Lakers vs Celtics",
    esports: "Valorant Masters Madrid",
    motorsport: "Monaco Grand Prix Live",
  };
  const domainMap = {
    football: "football-livehub.net",
    cricket: "cricketstreamnow.tv",
    basketball: "courtside-access.co",
    esports: "esportsrelay.gg",
    motorsport: "motorsportracefeed.com",
  };
  const now = Date.now();
  return Array.from({ length: 12 }, (_, idx) =>
    normalizeRecord(
      {
        platform: platformPool[idx % platformPool.length],
        post_text: `${eventMap[sport]} stream request cluster ${idx + 1}`,
        target_url: `https://${domainMap[sport]}/watch/${sport}-${idx + 101}`,
        source_name: `${sport.toUpperCase()} PIA feed`,
        detected_at: new Date(now - idx * 47 * 60 * 1000).toISOString(),
        suspicious_keywords_count: 3 + (idx % 6),
        stream_link_detected: idx % 4 !== 0,
        repeat_offender_score: Math.min(0.95, 0.32 + idx * 0.04),
        estimated_viewers: 900 + idx * 280,
        match_importance: idx % 3 === 0 ? "High" : idx % 3 === 1 ? "Medium" : "Low",
      },
      idx,
      sport,
    ),
  );
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") || "football";

  if (!DEMO_SPORTS.includes(sport)) {
    return NextResponse.json({ incidents: [], source: "no-config" });
  }

  // Prefer PIA config, then K2, then optional OpenAI-compatible config.
  const baseUrl = PIA_BASE_URL || K2_BASE_URL || OPENAI_COMPAT_BASE_URL;
  const apiKey = PIA_API_KEY || K2_API_KEY || OPENAI_COMPAT_API_KEY;
  const model = PIA_MODEL || K2_MODEL || OPENAI_COMPAT_MODEL;
  const hasCompatConfig = Boolean(baseUrl && apiKey && model);
  const hasGeminiConfig = Boolean(GEMINI_API_KEY && GEMINI_MODEL);

  if (!hasCompatConfig && !hasGeminiConfig) {
    if (DEMO_PIA_ENABLE_GENERATED_DATA) {
      return NextResponse.json({ incidents: createGeneratedIncidents(sport), source: "generated-fallback" });
    }
    return NextResponse.json({ incidents: [], source: "no-config" });
  }

  try {
    let records = [];
    let source = "api-unavailable";

    if (hasCompatConfig) {
      const compat = await fetchFromCompatApi({ baseUrl, apiKey, model, sport });
      records = compat.records;
      source = compat.source;
    }

    if (records.length === 0 && hasGeminiConfig) {
      const gemini = await fetchFromGemini({ sport });
      records = gemini.records;
      source = gemini.source;
    }

    if (records.length > 0) {
      const incidents = records.map((item, idx) => normalizeRecord(item, idx, sport));
      return NextResponse.json({ incidents, source });
    }

    if (DEMO_PIA_ENABLE_GENERATED_DATA) {
      return NextResponse.json({ incidents: createGeneratedIncidents(sport), source: "generated-fallback" });
    }
    return NextResponse.json({ incidents: [], source });
  } catch (error) {
    if (DEMO_PIA_ENABLE_GENERATED_DATA) {
      return NextResponse.json({ incidents: createGeneratedIncidents(sport), source: "generated-fallback" });
    }
    return NextResponse.json({
      incidents: [],
      source: "api-error",
      details: String(error?.message || "unknown"),
    });
  }
}
