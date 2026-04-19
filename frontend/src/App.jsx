import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./api/client";
import {
  fallbackIncidents,
  fallbackInsights,
  fallbackSummary,
  seededSportIncidents,
} from "./data/fallbackData";

const severityStyles = {
  High: "bg-indigo-950 text-indigo-100",
  Medium: "bg-indigo-700 text-indigo-100",
  Low: "bg-indigo-500 text-indigo-50",
};

const severityTrack = {
  High: "bg-indigo-950",
  Medium: "bg-indigo-700",
  Low: "bg-indigo-500",
};

const piePalette = ["#1e1b4b", "#312e81", "#4338ca", "#6366f1", "#a5b4fc"];
const SEEDED_VALIDATION_MODE = true;

const signalDictionary = [
  {
    label: "Subscription Fragmentation",
    keywords: ["multiple services", "which app", "where can i watch", "watch online"],
    reason:
      "Signal suggests users are struggling with fragmented platform rights and are seeking unofficial access paths.",
  },
  {
    label: "Regional Restrictions",
    keywords: ["region", "blackout", "vpn", "not available", "restriction"],
    reason:
      "Conversation indicates access constraints tied to region or blackout policy, which can increase piracy demand.",
  },
  {
    label: "Live Event Demand Spike",
    keywords: ["live", "match", "kickoff", "tonight", "stream now"],
    reason:
      "Timing and language match live-event urgency, where piracy spread often accelerates under peak demand.",
  },
  {
    label: "Price / Accessibility Pressure",
    keywords: ["free", "too expensive", "no subscription", "can't afford"],
    reason:
      "The wording points to affordability and accessibility barriers that can drive users to unauthorized streams.",
  },
];

const sportCoverage = [
  {
    sport: "Football",
    regions: "Europe, MENA, South America",
    demand: "Kickoff windows and knockout stages",
    pattern: "Mirror-link chains and rapid repost cycles",
    note: "Highest repost velocity appears in the first 30 minutes of marquee fixtures.",
  },
  {
    sport: "Cricket",
    regions: "South Asia, UK, Gulf states",
    demand: "Tournament playoffs and rivalry matches",
    pattern: "Short-link redirects and group-based relay sharing",
    note: "Unauthorized links cluster around live overs and final-session momentum swings.",
  },
  {
    sport: "Basketball",
    regions: "North America, Philippines, LATAM",
    demand: "Playoffs and late-game close finishes",
    pattern: "Clip-to-stream funneling through discussion threads",
    note: "High-engagement spikes map to close-score moments and overtime periods.",
  },
];

const appNavItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "sports", label: "Sports" },
  { id: "sources", label: "Sources" },
  { id: "queue", label: "Queue" },
  { id: "about", label: "About" },
];

const formatTimestamp = (timestamp) =>
  new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getLevelFromScore = (score) => {
  if (score >= 75) return "High";
  if (score >= 40) return "Medium";
  return "Low";
};

const getIncidentTags = (incident) => {
  const tags = [];

  if ((incident.post_text || "").toLowerCase().includes("live")) {
    tags.push("Live Match");
  }
  if ((incident.engagement_score || 0) >= 70 || (incident.upvotes || 0) > 100) {
    tags.push("High Engagement");
  }
  if ((incident.reasons || []).some((reason) => reason.toLowerCase().includes("domain"))) {
    tags.push("Suspicious Domain");
  }
  if ((incident.gemini_confidence || 0) >= 0.75) {
    tags.push("High AI Confidence");
  }
  if ((incident.rule_score || 0) >= 50) {
    tags.push("Keyword Cluster");
  }

  return tags.slice(0, 4);
};

const getSportLabel = (incident) => {
  const text = (incident.post_text || "").toLowerCase();
  if (text.includes("football") || text.includes("champions league")) return "Football";
  if (text.includes("cricket")) return "Cricket";
  if (text.includes("basketball") || text.includes("nba")) return "Basketball";
  return "Cross-sport";
};

const getQueueReason = (incident) => {
  const reasons = [];
  const tags = incident.tags || [];
  const domain = incident.domain || "unknown domain";

  if (tags.includes("Live Match")) reasons.push("live-event urgency");
  if (tags.includes("High Engagement")) reasons.push("high engagement");
  if (tags.includes("Suspicious Domain")) reasons.push("suspicious domain");
  if (tags.includes("Keyword Cluster")) reasons.push("repeated keyword cluster");
  if (reasons.length === 0 && incident.combined_risk_score >= 75) {
    reasons.push("elevated risk concentration");
  }

  if (reasons.length === 0) {
    return `Reason: Monitoring continued due to suspicious signal persistence (${domain}).`;
  }
  return `Reason: ${reasons.slice(0, 2).join(" + ")}.`;
};

const buildRecommendationFromIncident = (incident) => {
  const sport = getSportLabel(incident).toLowerCase();
  const tags = incident.tags || [];
  const domain = incident.domain || "unknown domain";

  if (tags.includes("Live Match") && tags.includes("High Engagement")) {
    return `High engagement during a live ${sport} window suggests active redistribution. Queue notice drafting and monitor mirror-link reposts from ${domain}.`;
  }
  if (tags.includes("Suspicious Domain") && tags.includes("Keyword Cluster")) {
    return `Suspicious domain and repeated stream-seeking keywords indicate coordinated link circulation. Route to analyst review before enforcement escalation.`;
  }
  if (incident.combined_risk_score >= 75) {
    return "Prioritize analyst verification and prepare enforcement package if repost velocity remains elevated.";
  }
  return "Keep in review queue, track repost persistence, and reassess if engagement accelerates.";
};

const buildRationaleFromTags = (incident) => {
  const tags = incident.tags || [];
  const rationaleBits = [];

  if (tags.includes("Live Match")) rationaleBits.push("Live-event timing increases immediate piracy demand");
  if (tags.includes("High Engagement")) rationaleBits.push("engagement indicates broad potential reach");
  if (tags.includes("Suspicious Domain")) rationaleBits.push("distribution domain pattern is high-risk");
  if (tags.includes("Keyword Cluster")) rationaleBits.push("keyword pattern aligns with unauthorized stream-seeking");

  if (rationaleBits.length === 0) {
    return "Rule and engagement evidence indicate suspicious distribution behavior requiring continued monitoring.";
  }
  return `${rationaleBits.slice(0, 2).join(". ")}.`;
};

const toSportKey = (sportLabel = "") => sportLabel.toLowerCase().trim();

const detectIncidentSport = (incident) => {
  const text = (incident.post_text || "").toLowerCase();
  if (incident.sport) return toSportKey(incident.sport);
  if (
    text.includes("football") ||
    text.includes("soccer") ||
    text.includes("champions league") ||
    text.includes("ucl")
  ) {
    return "football";
  }
  if (text.includes("cricket") || text.includes("ipl") || text.includes("rcb") || text.includes("csk")) {
    return "cricket";
  }
  if (
    text.includes("basketball") ||
    text.includes("nba") ||
    text.includes("playoff") ||
    text.includes("finals")
  ) {
    return "basketball";
  }
  return "unknown";
};

const filterIncidentsBySport = (incidentList, sportKey) =>
  incidentList.filter((incident) => detectIncidentSport(incident) === sportKey);

const buildContextSignals = (incident) => {
  const text = `${incident.post_text || ""} ${incident.url || ""}`.toLowerCase();
  const matchedSignals = signalDictionary
    .filter((signal) => signal.keywords.some((keyword) => text.includes(keyword)))
    .map(({ label, reason }) => ({ label, reason }));

  if (matchedSignals.length > 0) return matchedSignals;

  if ((incident.combined_risk_score || 0) >= 75) {
    return [
      {
        label: "Sustained High-Risk Exposure",
        reason:
          "High-risk scoring indicates this incident should be investigated quickly for link persistence and repost velocity.",
      },
    ];
  }

  return [];
};

const normalizeIncident = (incident, index) => {
  const score = incident.combined_risk_score ?? incident.base_risk_score ?? 0;
  const level = incident.combined_risk_level || getLevelFromScore(score);
  const timestamp =
    incident.created_utc != null
      ? new Date(Number(incident.created_utc) * 1000).toISOString()
      : incident.timestamp || new Date(Date.now() - index * 1000 * 60 * 42).toISOString();
  const source = incident.platform || "Other";
  const contextSignals = buildContextSignals(incident);
  const fallbackTags = getIncidentTags(incident);
  const mergedTags = Array.from(new Set([...(incident.tags || []), ...fallbackTags])).slice(0, 5);

  return {
    ...incident,
    id: `${source}-${index}-${incident.domain || "unknown"}`,
    source,
    title: (incident.post_text || "Untitled signal").slice(0, 95),
    timestamp,
    combined_risk_score: score,
    combined_risk_level: level,
    combined_confidence: incident.combined_confidence ?? 0.5,
    rule_score: incident.rule_score ?? 0,
    engagement_score: incident.engagement_score ?? 0,
    gemini_score: incident.gemini_score ?? 0,
    gemini_confidence: incident.gemini_confidence ?? 0,
    ai_status: incident.ai_status || (incident.ai_used ? "K2 Think" : "Fallback Insight"),
    ai_rationale: incident.ai_rationale || buildRationaleFromTags({ ...incident, tags: mergedTags }),
    recommendation_summary:
      incident.recommendation_summary || buildRecommendationFromIncident({ ...incident, tags: mergedTags }),
    context_driver:
      incident.context_driver || (contextSignals[0]?.label ?? "Suspicious Streaming Signal Pattern"),
    ai_confidence:
      incident.ai_confidence ??
      Math.min(Math.max(incident.gemini_confidence ?? incident.combined_confidence ?? 0.45, 0.35), 0.85),
    why_now:
      incident.why_now ||
      "Signal timing suggests elevated redistribution attention during current sports demand window.",
    piracy_intent_confidence:
      incident.piracy_intent_confidence ??
      Math.min(Math.max(incident.ai_confidence ?? incident.gemini_confidence ?? 0.5, 0.35), 0.9),
    event_context_summary:
      incident.event_context_summary || `Monitoring context: ${incident.event_context || "Standard Monitoring Window"}.`,
    recommended_next_step:
      incident.recommended_next_step || "Queue for analyst review and monitor repost persistence.",
    priority:
      incident.priority ||
      (score >= 75 ? "high" : score >= 40 ? "medium" : "low"),
    recommended_action:
      incident.recommended_action ||
      (score >= 75
        ? "Escalate to enforcement queue and prepare case packet."
        : "Queue for analyst review and monitor repost propagation."),
    status: incident.status || (score >= 75 ? "Escalated" : score >= 40 ? "Queued" : "Monitoring"),
    queue_decision:
      incident.queue_decision || (score >= 75 ? "enforcement_queue" : score >= 40 ? "analyst_review" : "monitoring"),
    workflow_reason:
      incident.workflow_reason || "Workflow routing based on risk score, confidence, and queue capacity.",
    sport: incident.sport || detectIncidentSport(incident),
    data_label: incident.data_label || "Seeded Validation Incident",
    monitoring_status: incident.monitoring_status || "Monitoring Active",
    source_status: incident.source_status || "Live Reddit unavailable",
    reasons: incident.reasons ?? [],
    tags: mergedTags,
    contextSignals,
  };
};

const shouldShowDraftPreview = (incident) => {
  const priority = String(incident?.priority || "").toLowerCase();
  return priority === "high" || priority === "medium" || (incident?.combined_risk_score || 0) >= 55;
};

const buildDraftEmailPreview = (incident) => {
  const recipients = ["rights@broadcast-monitor.example", "enforcement@media-ops.example", "legal-review@example.org"];
  const indexSeed = (incident?.id || "").length % recipients.length;
  const recipient = recipients[indexSeed];
  const sport = (incident?.sport || "sports").toUpperCase();
  const queue = incident?.queue_decision || "REVIEW";
  const subject = `[Draft] ${sport} stream enforcement review - ${incident?.domain || "unknown-domain"}`;
  const body = [
    `Hello Team,`,
    ``,
    `This is a draft-only validation notice for internal review.`,
    `Detected incident context: ${incident?.event_context || "Standard Monitoring Window"}.`,
    `Suspicious domain/link: ${incident?.domain || "unknown"} (${incident?.url || "no-url"}).`,
    `Primary concern: ${incident?.workflow_reason || "Potential unauthorized redistribution behavior."}`,
    `Requested action: review and assess takedown/escalation path (${queue}).`,
    ``,
    `Status: Draft Only / Not Sent`,
  ].join("\n");
  return { recipient, subject, body, status: "Draft Only / Not Sent" };
};

function App() {
  const [view, setView] = useState("home");
  const [expandedSport, setExpandedSport] = useState("Football");
  const [selectedSport, setSelectedSport] = useState("football");
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [sportIncidents, setSportIncidents] = useState([]);
  const [insights, setInsights] = useState(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [selectedSportIncidentId, setSelectedSportIncidentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sportLoading, setSportLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [sportUsingFallback, setSportUsingFallback] = useState(false);
  const [sportMode, setSportMode] = useState("live");
  const [sportModeLabel, setSportModeLabel] = useState("Live");
  const [sportSource, setSportSource] = useState("Reddit");
  const [sportSourceStatus, setSportSourceStatus] = useState("unknown");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const nextSummary = SEEDED_VALIDATION_MODE ? fallbackSummary : null;
      const nextIncidents = SEEDED_VALIDATION_MODE ? fallbackIncidents : [];
      const nextInsights = SEEDED_VALIDATION_MODE ? fallbackInsights : null;

      const normalizedIncidents = nextIncidents.map(normalizeIncident);

      setSummary(nextSummary);
      setIncidents(normalizedIncidents);
      setSelectedIncidentId((currentId) => currentId ?? normalizedIncidents[0]?.id ?? null);
      setInsights(nextInsights);
      setUsingFallback(SEEDED_VALIDATION_MODE);
      setLastUpdatedAt(new Date());
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchSportIncidents = async () => {
      if (view !== "sport" || !selectedSport) return;
      setSportLoading(true);

      try {
        const rawSportIncidents = SEEDED_VALIDATION_MODE
          ? seededSportIncidents[selectedSport] || []
          : (await api.get(`/analyze-sport/${selectedSport}`, {
              params: { mode: sportMode },
            })).data?.results || [];
        const normalizedSportIncidents = rawSportIncidents.map(normalizeIncident);
        setSportIncidents(normalizedSportIncidents);
        setSelectedSportIncidentId(normalizedSportIncidents[0]?.id || null);
        setSportUsingFallback(SEEDED_VALIDATION_MODE);
        setSportModeLabel(SEEDED_VALIDATION_MODE ? "Seeded Validation Data" : (sportMode === "historical_validation" ? "Historical Validation" : "Live"));
        setSportSource("Reddit");
        setSportSourceStatus(SEEDED_VALIDATION_MODE ? "Live Reddit unavailable" : "unknown");
      } catch {
        const localPool = incidents.length > 0 ? incidents : fallbackIncidents.map(normalizeIncident);
        const fallbackSportIncidents = filterIncidentsBySport(
          localPool,
          selectedSport,
        );
        setSportIncidents(fallbackSportIncidents);
        setSelectedSportIncidentId(fallbackSportIncidents[0]?.id || null);
        setSportUsingFallback(true);
        setSportModeLabel("Seeded Validation Data");
        setSportSource("Reddit");
        setSportSourceStatus("Live Reddit unavailable");
      } finally {
        setLastUpdatedAt(new Date());
        setSportLoading(false);
      }
    };

    fetchSportIncidents();
  }, [incidents, selectedSport, sportMode, view]);

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(ticker);
  }, []);

  const activeIncidents = view === "sport" ? sportIncidents : incidents;

  const selectedIncident = useMemo(() => {
    if (view === "sport") {
      return sportIncidents.find((incident) => incident.id === selectedSportIncidentId) || sportIncidents[0];
    }
    return incidents.find((incident) => incident.id === selectedIncidentId) || incidents[0];
  }, [incidents, selectedIncidentId, sportIncidents, selectedSportIncidentId, view]);

  const subredditBreakdown = useMemo(() => {
    const counts = {};
    activeIncidents.forEach((incident) => {
      const key = incident.subreddit || "reddit-general";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [activeIncidents]);

  const trendData = useMemo(() => {
    const base = activeIncidents.length > 0 ? activeIncidents[0].combined_risk_score * 0.35 : 22;
    return Array.from({ length: 7 }, (_, i) => ({
      day: `D-${6 - i}`,
      volume: Math.round(base + i * 4 + (i % 2 === 0 ? 2 : 0)),
    }));
  }, [activeIncidents]);

  const priorityQueue = useMemo(
    () =>
      [...activeIncidents]
        .sort((a, b) => b.combined_risk_score - a.combined_risk_score)
        .slice(0, 4)
        .map((incident, index) => ({
          incident,
          assignedBy: index === 0 ? "AI + Workflow" : "AI + Analyst",
          status: incident.status || (index === 0 ? "Pending Notice" : "Under Review"),
          reason: getQueueReason(incident),
        })),
    [activeIncidents],
  );

  const recommendationCard = useMemo(() => {
    if (!selectedIncident) return null;

    const confidence = Math.max(
      Math.round((selectedIncident.ai_confidence ?? selectedIncident.combined_confidence ?? 0.5) * 100),
      45,
    );

    return {
      summary: selectedIncident.recommendation_summary || buildRecommendationFromIncident(selectedIncident),
      drivers: selectedIncident.contextSignals,
      rationale: selectedIncident.ai_rationale || buildRationaleFromTags(selectedIncident),
      aiStatus: selectedIncident.ai_status || "Fallback Insight",
      whyNow:
        selectedIncident.why_now ||
        "Signal acceleration aligns with current viewing demand and suspicious stream-seeking behavior.",
      piracyIntentConfidence: Math.round(
        (selectedIncident.piracy_intent_confidence ?? selectedIncident.ai_confidence ?? 0.5) * 100,
      ),
      eventContextSummary:
        selectedIncident.event_context_summary ||
        `Event context indicates ${selectedIncident.event_context || "active monitoring conditions"}.`,
      nextStep:
        selectedIncident.recommended_next_step ||
        "Validate evidence package and route to workflow queue.",
      confidence,
    };
  }, [selectedIncident]);

  const secondsSinceUpdate = Math.max(0, Math.floor((now - lastUpdatedAt.getTime()) / 1000));
  const updateLabel =
    secondsSinceUpdate < 60
      ? `${secondsSinceUpdate}s ago`
      : `${Math.floor(secondsSinceUpdate / 60)}m ago`;
  const trendDirection =
    trendData.length > 1 && trendData[trendData.length - 1].volume > trendData[0].volume
      ? "upward"
      : "stable";
  const isSportView = view === "sport";
  const isSportsView = view === "sports";
  const isDashboardView = view === "dashboard";
  const isSourcesView = view === "sources";
  const isQueueView = view === "queue";
  const isAboutView = view === "about";
  const selectedSportLabel = selectedSport ? selectedSport[0].toUpperCase() + selectedSport.slice(1) : "Sport";
  const activeFallback = isSportView ? sportUsingFallback : usingFallback;
  const activeNavKey = isSportView ? "sports" : view;

  const handleNavClick = (id) => {
    if (id === "dashboard") {
      setView("dashboard");
      return;
    }
    if (id === "sports") {
      setView("sports");
      return;
    }
    if (id === "sources") {
      setView("sources");
      return;
    }
    if (id === "queue") {
      setView("queue");
      return;
    }
    if (id === "about") {
      setView("about");
      return;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
        <h1 className="text-2xl font-semibold tracking-tight">StreamGuard AI</h1>
        <p className="mt-3 text-sm text-slate-300">Loading intelligence workspace...</p>
      </div>
    );
  }

  if (view === "home") {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-14 text-slate-100 md:px-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="flex flex-wrap gap-2">
              {appNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-slate-950/30 md:p-12">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">StreamGuard AI</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              Sports Piracy Intelligence Console
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
              We detect and analyze high-risk digital sports piracy signals in near real time.
              StreamGuard AI helps enforcement teams prioritize suspicious distribution activity and
              coordinate response.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Designed for enforcement and compliance teams. Monitoring active across football,
              cricket, and basketball.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Detection", "Prioritization", "Enforcement Intelligence"].map((word) => (
                <span
                  key={word}
                  className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-xs font-medium text-indigo-100"
                >
                  {word}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setView("dashboard")}
              className="mt-10 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Enter Intelligence Dashboard
            </button>
          </div>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/20 md:p-8">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                Coverage by Sport
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Snapshot of current monitoring focus and emerging distribution signals.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {sportCoverage.map((item) => {
                const isExpanded = expandedSport === item.sport;

                return (
                  <button
                    key={item.sport}
                    type="button"
                    onClick={() => {
                      setExpandedSport(item.sport);
                      setSelectedSport(toSportKey(item.sport));
                      setView("sport");
                    }}
                    className={`rounded-2xl border p-4 text-left transition duration-200 ${
                      isExpanded
                        ? "border-indigo-500/60 bg-indigo-500/10"
                        : "border-slate-800 bg-slate-950/40 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-100">{item.sport}</p>
                    <p className="mt-2 text-xs text-slate-400">Top regions: {item.regions}</p>
                    <p className="mt-1 text-xs text-slate-400">Demand spikes: {item.demand}</p>
                    <p className="mt-1 text-xs text-slate-400">Patterns: {item.pattern}</p>
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isExpanded ? "mt-3 max-h-28 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs leading-relaxed text-slate-300">
                        {item.note}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (isSportView && sportLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
        <h1 className="text-2xl font-semibold tracking-tight">StreamGuard AI</h1>
        <p className="mt-3 text-sm text-slate-300">Loading {selectedSportLabel} monitoring workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-4 text-slate-100 md:px-6">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/85 p-3 shadow-lg shadow-slate-950/30">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">StreamGuard AI</p>
              <h1 className="mt-0.5 text-lg font-semibold tracking-tight md:text-xl">
                {isSportView
                  ? `${selectedSportLabel} Intelligence View`
                  : isSportsView
                    ? "Sports Monitoring"
                    : isSourcesView
                      ? "Source Monitoring"
                  : isQueueView
                    ? "Enforcement Queue"
                    : isAboutView
                      ? "About StreamGuard AI"
                      : "Piracy Intelligence Dashboard"}
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                {isSportView
                  ? `Monitoring remains active while seeded validation incidents are shown for ${selectedSportLabel.toLowerCase()}.`
                  : isSportsView
                    ? "Select a sport stream, inspect incidents, and route cases into workflow."
                    : isSourcesView
                      ? "Operational visibility into active monitored Reddit sources and trend signals."
                  : isQueueView
                    ? "Prioritized incident execution queue generated by workflow orchestration."
                    : isAboutView
                      ? "Product scope and workflow summary."
                      : "Unified queue for detection, risk assessment, and enforcement workflow."}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap justify-end gap-1.5">
                {appNavItems.map((item) => {
                  const isActive = activeNavKey === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                        isActive
                          ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-100"
                          : "border-slate-700 bg-slate-950/40 text-slate-200 hover:border-slate-500"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setView("home")}
                className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:border-slate-500"
              >
                Back to Homepage
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
              Monitoring Active
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
              Last updated {updateLabel}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
              {isSportView
                ? `Current focus: ${selectedSportLabel}`
                : "Current focus: Football (cross-sport monitoring enabled)"}
            </span>
            {isSportView ? (
              <>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
                  Current mode: {SEEDED_VALIDATION_MODE ? "Seeded Validation Data" : sportModeLabel}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
                  Source: {sportSource}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
                  Source status: {SEEDED_VALIDATION_MODE ? "Live Reddit unavailable" : sportSourceStatus}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
                  Workflow Ready
                </span>
              </>
            ) : null}
            {isSportView ? (
              <span className="rounded-full border border-indigo-600/40 bg-indigo-500/10 px-2.5 py-1 text-indigo-200">
                Peak-Time Signal {activeIncidents.some((incident) => incident.peak_time_signal) ? "Active" : "Monitoring"}
              </span>
            ) : null}
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
              Workflow: detect -&gt; flag -&gt; explain -&gt; action
            </span>
          </div>
          {activeFallback && (
            <p className="mt-3 rounded-lg border border-indigo-700/40 bg-indigo-700/10 px-3 py-2 text-xs text-indigo-100">
              {isSportView
                ? "Live Reddit fetch is unavailable. Displaying seeded validation incidents (historical/prototype mode)."
                : "Displaying seeded validation incidents while live source fetch remains unavailable."}
            </p>
          )}
        </header>

        {isAboutView ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <h2 className="text-base font-semibold text-slate-100">About</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
              <p>StreamGuard AI monitors live public sports-streaming signals and flags likely piracy incidents for enforcement teams.</p>
              <p>It prioritizes high-risk cases using suspicious intent phrasing, watch-link/domain signals, and event-window relevance.</p>
              <p>K2 Think provides intelligence context to explain why a case matters now and what to do next.</p>
              <p>OpenClaw routes each case through workflow decisions such as queue assignment, status, and action recommendation.</p>
              <p>The core flow is scrape and monitor, detect, flag, explain, then recommend or send action.</p>
            </div>
          </section>
        ) : null}

        {isSportsView ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <h2 className="text-base font-semibold text-slate-100">Sports Streams</h2>
            <p className="mt-1 text-xs text-slate-400">
              Jump to a focused sport operations stream.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {sportCoverage.map((item) => (
                <button
                  key={item.sport}
                  type="button"
                  onClick={() => {
                    setSelectedSport(toSportKey(item.sport));
                    setView("sport");
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-left transition hover:border-slate-700"
                >
                  <p className="text-sm font-semibold text-slate-100">{item.sport}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.demand}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {isSourcesView ? (
          <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Reddit Activity Breakdown</h3>
              <p className="mt-1 text-xs text-slate-400">
                Distribution of monitored Reddit incident volume by subreddit bucket.
              </p>
              <div className="mt-3 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={subredditBreakdown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} stroke="none">
                      {subredditBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={piePalette[index % piePalette.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "0.75rem",
                        color: "#e2e8f0",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Activity Trend Signal</h3>
              <p className="mt-1 text-xs text-slate-400">
                Signal volume is trending {trendDirection} across monitored Reddit streams.
              </p>
              <div className="mt-3 h-56 rounded-xl bg-slate-950/50 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "0.75rem",
                        color: "#e2e8f0",
                      }}
                    />
                    <Bar dataKey="volume" radius={[6, 6, 0, 0]} fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        ) : null}

        {isQueueView ? (
          <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <PriorityQueueCard items={priorityQueue} />
            <div className="space-y-3">
              <IncidentDetailCard incident={priorityQueue[0]?.incident || selectedIncident} recommendation={recommendationCard} />
            </div>
          </section>
        ) : null}

        {(isDashboardView || isSportView) ? (
          <section className="grid h-[calc(100vh-170px)] min-h-[560px] grid-cols-1 gap-3 xl:grid-cols-[1fr_1.25fr_0.9fr]">
            <IncidentFeedPanel
              incidents={activeIncidents}
              selectedIncident={selectedIncident}
              onSelectIncident={(incidentId) =>
                isSportView ? setSelectedSportIncidentId(incidentId) : setSelectedIncidentId(incidentId)
              }
              title={isSportView ? `${selectedSportLabel} Feed` : "Live Incident Feed"}
            />
            <IncidentEvidencePanel incident={selectedIncident} recommendation={recommendationCard} />
            <DecisionRail incident={selectedIncident} recommendation={recommendationCard} />
          </section>
        ) : null}
      </div>
    </div>
  );
}

function IncidentFeedPanel({ incidents, selectedIncident, onSelectIncident, title }) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/85 p-3">
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        <p className="text-[11px] text-slate-400">Detection and flagging stream from monitored sources.</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {incidents.length === 0 ? (
          <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
            No incidents available. Monitoring remains active.
          </p>
        ) : (
          incidents.map((incident) => (
            <button
              key={incident.id}
              type="button"
              onClick={() => onSelectIncident(incident.id)}
              className={`w-full rounded-lg border p-2.5 text-left transition ${
                selectedIncident?.id === incident.id
                  ? "border-indigo-500/70 bg-indigo-500/10"
                  : "border-slate-800 bg-slate-950/30 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-xs font-medium text-slate-100">{incident.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityStyles[incident.combined_risk_level]}`}>
                  {incident.combined_risk_level}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-2 text-[10px] text-slate-400">
                <span>{formatTimestamp(incident.timestamp)}</span>
                <span>Risk {incident.combined_risk_score}</span>
                <span>Eng {incident.engagement_score}</span>
                <span>{incident.data_label || "Seeded Validation Incident"}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function IncidentEvidencePanel({ incident, recommendation }) {
  if (!incident) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4">
        <p className="text-sm text-slate-300">No incident selected.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/85 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-100">Selected Incident</h3>
        <p className="mt-1 text-[11px] text-slate-400">Evidence and contextual signal summary.</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <p className="text-sm leading-relaxed text-slate-200">{incident.post_text}</p>
        <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-400 sm:grid-cols-2">
          <p>Source: <span className="text-slate-200">{incident.source}</span></p>
          <p>Domain: <span className="text-slate-200">{incident.domain}</span></p>
          <p className="sm:col-span-2 break-all">Link: <span className="text-slate-200">{incident.url}</span></p>
          <p>Timestamp: <span className="text-slate-200">{formatTimestamp(incident.timestamp)}</span></p>
          <p>Event: <span className="text-slate-200">{incident.event_context || "Standard Monitoring Window"}</span></p>
          <p>Window: <span className="text-slate-200">{incident.live_window_status || "Baseline Window"}</span></p>
        </div>
        <div className="grid grid-cols-1 gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
            Peak-Time Signal: <span className="font-semibold text-slate-100">{incident.peak_time_signal ? "Active" : "Monitoring"}</span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
            Live Demand Window: <span className="font-semibold text-slate-100">{incident.peak_time_reason}</span>
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Why Flagged</p>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-300">
            {incident.reasons.length > 0 ? (
              incident.reasons.slice(0, 4).map((reason) => <li key={reason}>- {reason}</li>)
            ) : (
              <li>- Rule and engagement signals indicate suspicious behavior.</li>
            )}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Recommendation Summary</p>
          <p className="mt-1 text-xs text-slate-300">{recommendation?.summary}</p>
        </div>
      </div>
    </div>
  );
}

function DecisionRail({ incident, recommendation }) {
  if (!incident) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4">
        <p className="text-sm text-slate-300">No incident selected.</p>
      </div>
    );
  }

  const progressWidth = `${Math.min(Math.max(incident.combined_risk_score, 0), 100)}%`;
  const emailDraft = buildDraftEmailPreview(incident);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/85 p-3">
      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Risk Score</h3>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-3xl font-semibold text-slate-50">{incident.combined_risk_score}</p>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${severityStyles[incident.combined_risk_level]}`}>
            {incident.combined_risk_level}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-800">
          <div className={`h-full rounded-full ${severityTrack[incident.combined_risk_level]}`} style={{ width: progressWidth }} />
        </div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">K2 Think Intelligence</h3>
        <p className="mt-1 text-xs text-slate-200">{recommendation?.rationale}</p>
        <p className="mt-1 text-[11px] text-slate-400">
          {incident.ai_status} • Confidence {recommendation?.confidence}% • Intent {recommendation?.piracyIntentConfidence}%
        </p>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">OpenClaw Workflow</h3>
        <p className="mt-1 text-xs text-slate-300">Priority: <span className="font-semibold text-slate-100">{incident.priority}</span></p>
        <p className="text-xs text-slate-300">Status: <span className="font-semibold text-slate-100">{incident.status}</span></p>
        <p className="text-xs text-slate-300">Queue: <span className="font-semibold text-slate-100">{incident.queue_decision}</span></p>
        <p className="mt-1 text-[11px] text-slate-400">{incident.workflow_reason}</p>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Action Panel</h3>
        <p className="mt-1 text-xs text-slate-300">{incident.recommended_action}</p>
        <p className="mt-1 text-[11px] text-slate-400">Next step: {recommendation?.nextStep}</p>
        <div className="mt-2">
          <ActionPanel compact />
        </div>
      </div>
      {shouldShowDraftPreview(incident) ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">Draft Email Preview</h3>
          <p className="mt-1 text-[11px] text-slate-400">{emailDraft.status}</p>
          <p className="mt-2 text-xs text-slate-300">
            Recipient: <span className="font-semibold text-slate-100">{emailDraft.recipient}</span>
          </p>
          <p className="mt-1 text-xs text-slate-300">
            Subject: <span className="font-semibold text-slate-100">{emailDraft.subject}</span>
          </p>
          <pre className="mt-2 whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-900 p-2 text-[11px] text-slate-300">
            {emailDraft.body}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function IncidentDetailCard({ incident, recommendation }) {
  if (!incident) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6">
        <p className="text-sm text-slate-300">No incident selected.</p>
      </div>
    );
  }

  const progressWidth = `${Math.min(Math.max(incident.combined_risk_score, 0), 100)}%`;
  const timeline = [
    { label: "Detected", done: true },
    { label: "Analyzed", done: true },
    { label: "Prioritized", done: incident.combined_risk_score >= 50 },
    { label: "Pending Action", done: incident.combined_risk_score >= 70 },
    { label: "Reviewed / Sent", done: false },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <h3 className="text-sm font-semibold text-slate-100">Incident Detail</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">{incident.post_text}</p>
          <div className="mt-4 space-y-1.5 text-xs text-slate-400">
            <p>
              Source: <span className="text-slate-200">{incident.source}</span>
            </p>
            <p className="break-all">
              Link: <span className="text-slate-200">{incident.url}</span>
            </p>
            <p>
              Domain: <span className="text-slate-200">{incident.domain}</span>
            </p>
            <p>
              Timestamp: <span className="text-slate-200">{formatTimestamp(incident.timestamp)}</span>
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {incident.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-300 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              Peak-Time Signal:{" "}
              <span className="font-semibold text-slate-100">
                {incident.peak_time_signal ? "Active" : "Monitoring"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              Event Context:{" "}
              <span className="font-semibold text-slate-100">
                {incident.event_context || "Standard Monitoring Window"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 sm:col-span-2">
              Live Demand Window:{" "}
              <span className="font-semibold text-slate-100">
                {incident.peak_time_reason || "No event-linked peak demand signal detected."}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Why Flagged
            </h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {incident.reasons.length > 0 ? (
                incident.reasons.map((reason) => <li key={reason}>- {reason}</li>)
              ) : (
                <li>- Rule and engagement signals indicate suspicious behavior.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Risk Scoring</h3>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-4xl font-semibold tracking-tight text-slate-50">
                {incident.combined_risk_score}
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  severityStyles[incident.combined_risk_level]
                }`}
              >
                {incident.combined_risk_level}
              </span>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${severityTrack[incident.combined_risk_level]}`}
                style={{ width: progressWidth }}
              />
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <BreakdownRow label="Rule Signal" value={incident.rule_score} />
              <BreakdownRow label="Engagement Signal" value={incident.engagement_score} />
              <BreakdownRow label="Peak-Time Weight" value={incident.peak_time_weight || 0} />
              <BreakdownRow label="AI Score" value={incident.gemini_score} />
              <BreakdownRow
                label="AI Confidence"
                value={Math.round((incident.gemini_confidence || 0) * 100)}
                suffix="%"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-300">AI Insight</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-100">Intelligence Rationale</h3>
            <p className="mt-2 text-sm text-slate-200">{recommendation?.rationale}</p>
            <p className="mt-2 text-xs text-slate-400">
              {incident.ai_status || recommendation?.aiStatus} • Confidence{" "}
              <span className="font-semibold text-slate-200">{recommendation?.confidence}%</span>
            </p>
            <div className="mt-3 space-y-2">
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Why Now</p>
                <p className="mt-1 text-xs text-slate-300">{recommendation?.whyNow}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Event Context Summary
                </p>
                <p className="mt-1 text-xs text-slate-300">{recommendation?.eventContextSummary}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300">
                Piracy intent confidence:{" "}
                <span className="font-semibold text-slate-100">{recommendation?.piracyIntentConfidence}%</span>
              </div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Context Driver</p>
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300">
                {incident.context_driver || "No primary context driver available."}
              </div>
              {(recommendation?.drivers || []).length > 0 ? (
                recommendation.drivers.map((driver) => (
                  <div key={driver.label} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                    <p className="text-xs font-medium text-indigo-200">{driver.label}</p>
                    <p className="mt-1 text-xs text-slate-300">{driver.reason}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300">
                  No strong contextual driver identified for this case yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-300">Workflow Decision</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-100">Recommendation & Actioning</h3>
            <p className="mt-2 text-sm text-slate-200">{recommendation?.summary}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                Priority: <span className="font-semibold text-slate-100">{incident.priority}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                Status: <span className="font-semibold text-slate-100">{incident.status}</span>
              </div>
              <div className="col-span-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                Queue: <span className="font-semibold text-slate-100">{incident.queue_decision}</span>
              </div>
              <div className="col-span-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                Action: <span className="font-semibold text-slate-100">{incident.recommended_action}</span>
              </div>
              <div className="col-span-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                Workflow reason: <span className="font-semibold text-slate-100">{incident.workflow_reason}</span>
              </div>
              <div className="col-span-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                Next step: <span className="font-semibold text-slate-100">{recommendation?.nextStep}</span>
              </div>
              {incident.escalation_note ? (
                <div className="col-span-2 rounded-lg border border-indigo-700/40 bg-indigo-900/20 px-3 py-2 text-indigo-100">
                  Escalation note: {incident.escalation_note}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Status Timeline</h3>
            <div className="mt-3 space-y-2">
              {timeline.map((step) => (
                <div key={step.label} className="flex items-center gap-2 text-xs">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      step.done ? "bg-indigo-500" : "bg-slate-700"
                    }`}
                  />
                  <span className={step.done ? "text-slate-200" : "text-slate-500"}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, suffix = "" }) {
  return (
    <div className="flex items-center justify-between text-slate-300">
      <span>{label}</span>
      <span className="font-semibold text-slate-100">
        {value}
        {suffix}
      </span>
    </div>
  );
}

function PriorityQueueCard({ items }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Priority Queue</h3>
      <p className="mt-1 text-xs text-slate-400">
        Highest-impact incidents ranked for enforcement workflow.
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.incident.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <p className="text-xs font-medium text-slate-100">{item.incident.title}</p>
            <p className="mt-1 text-[11px] text-slate-300">{item.reason}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
              <span>Priority: {item.incident.combined_risk_level}</span>
              <span>Assigned by: {item.assignedBy}</span>
              <span>Status: {item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionPanel({ compact = false }) {
  const actions = [
    { label: "Draft Notice", state: "Ready" },
    { label: "Escalate Case", state: "Review Required" },
    { label: "Mark Reviewed", state: "Queued" },
    { label: "Hold for Review", state: "Queued" },
    { label: "Send Notice", state: "Pending Integration" },
  ];

  const content = (
    <div className="mt-3 grid grid-cols-1 gap-2">
      {actions.map((action) => (
        <div
          key={action.label}
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
        >
          <span className="text-xs text-slate-100">{action.label}</span>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
            {action.state}
          </span>
        </div>
      ))}
    </div>
  );

  if (compact) return content;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Action Panel</h3>
      <p className="mt-1 text-xs text-slate-400">
        Operational controls and downstream workflow placeholders.
      </p>
      {content}
    </div>
  );
}

export default App;
