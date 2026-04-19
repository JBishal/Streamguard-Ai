"use client";
import { useState, useEffect, useMemo } from "react";
import HeroCard from "@/components/HeroCard";
import ControlPanel from "@/components/ControlPanel";
import MetricTile from "@/components/MetricTile";
import IncidentTable from "@/components/IncidentTable";
import RightSidebar from "@/components/RightSidebar";
import Modal from "@/components/Modal";
import { buildSummaryFromIncidents, getDemoIncidentsForSport, DEMO_MOCK_ALL } from "@/data/demoMockData";

// Fallback Mock Data
const MOCK_SUMMARY = {
  total_posts: 4521,
  high_risk_posts: 142,
  average_combined_risk_score: 0.68,
  top_suspicious_domain: "livestream-hd-pro.tv"
};

const MOCK_INCIDENTS = [
  { domain: "livestream-hd-pro.tv", risk_score: 0.94, risk_level: "High", cluster_id: "C-8891", explanation: "High volume of redirected traffic during match time. Hidden iframe detected." },
  { domain: "sports-free-now.com", risk_score: 0.88, risk_level: "High", cluster_id: "C-1204", explanation: "Repeated sharing on unauthorized Telegram groups." },
  { domain: "telegram.me/leaks-cl", risk_score: 0.76, risk_level: "High", cluster_id: "C-1204", explanation: "Direct streaming links posted every 5 minutes." },
  { domain: "reddit.com/r/soccerstreams", risk_score: 0.55, risk_level: "Medium", cluster_id: "C-4412", explanation: "Discussion of unofficial streaming sources. Links removed by automod." },
  { domain: "twitter.com/user9991", risk_score: 0.42, risk_level: "Medium", cluster_id: "C-0911", explanation: "Low follower count account spamming suspected links." },
];

const SPORT_KEYS = ["cricket", "football", "basketball", "esports", "motorsport"];
const DEFAULT_EVENT_BY_SPORT = {
  football: "Champions League Final",
  cricket: "India vs Australia 2nd ODI",
  basketball: "Lakers vs Celtics",
  esports: "Valorant Masters Madrid",
  motorsport: "Monaco Grand Prix Live",
};
const DEMO_SUMMARY = buildSummaryFromIncidents(DEMO_MOCK_ALL);
const DEMO_INCIDENTS = getDemoIncidentsForSport("football");
const normalizeRisk = (item) => {
  const value = Number(item?.risk_score ?? item?.combined_risk_score ?? 0);
  return value > 1 ? value : value * 100;
};
const toTimeMs = (item) => {
  const raw = item?.detected_at || item?.timestamp;
  const value = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
};
const dedupeIncidents = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.sport || ""}|${item.target_url || item.url || item.domain || ""}|${item.title || item.post_text || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const normalizeForUi = (item = {}, sport = "football") => {
  const riskRaw = Number(item.risk_score ?? item.combined_risk_score ?? 0);
  const riskValue = riskRaw > 1 ? riskRaw : riskRaw * 100;
  const riskLevel = item.risk_level || item.combined_risk_level || (riskValue >= 75 ? "High" : riskValue >= 40 ? "Medium" : "Low");
  const riskColor = item.risk_color || (riskLevel === "High" ? "red" : riskLevel === "Medium" ? "yellow" : "green");
  const detected = item.detected_at || item.timestamp || new Date().toISOString();
  return {
    ...item,
    id: item.id || `${sport}-${Math.random().toString(36).slice(2, 10)}`,
    sport: item.sport || sport,
    target_url: item.target_url || item.url || item.domain || "",
    source_name: item.source_name || item.platform || "Public Signal",
    title: item.title || item.post_text || "Potential unauthorized stream signal",
    post_text: item.post_text || item.title || "Potential unauthorized stream signal",
    detected_at: detected,
    timestamp: detected,
    risk_score: Number(riskValue.toFixed(1)),
    risk_level: riskLevel,
    risk_color: riskColor,
    combined_risk_score: Number(riskValue.toFixed(1)),
    combined_risk_level: riskLevel,
    explanation: item.explanation || "Flagged due to suspicious signal composition and risk indicators.",
  };
};
const fetchMergedSportIncidents = async (sport) => {
  const [backendResult, externalResult] = await Promise.allSettled([
    fetch(`http://127.0.0.1:8000/analyze-sport/${sport}`),
    fetch(`/api/k2-incidents?sport=${encodeURIComponent(sport)}`),
  ]);

  const backendItems = backendResult.status === "fulfilled" && backendResult.value.ok
    ? await backendResult.value.json()
    : [];
  const externalPayload = externalResult.status === "fulfilled" && externalResult.value.ok
    ? await externalResult.value.json()
    : { incidents: [] };

  const normalizedBackend = (Array.isArray(backendItems) ? backendItems : []).map((item) => normalizeForUi(item, sport));
  const normalizedExternal = (Array.isArray(externalPayload?.incidents) ? externalPayload.incidents : []).map((item) => normalizeForUi(item, sport));
  const fallbackSportData = getDemoIncidentsForSport(sport).map((item) => normalizeForUi(item, sport));

  return dedupeIncidents([...normalizedBackend, ...normalizedExternal, ...fallbackSportData]);
};

export default function Home() {
  const [summary, setSummary] = useState(DEMO_SUMMARY || MOCK_SUMMARY);
  const [incidents, setIncidents] = useState(DEMO_INCIDENTS.length ? DEMO_INCIDENTS : MOCK_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [trendIndicator, setTrendIndicator] = useState("+12");

  const dynamicSummary = useMemo(() => {
    const activeData = Array.isArray(incidents) ? incidents : [];
    if (activeData.length === 0) return DEMO_SUMMARY || summary || MOCK_SUMMARY;

    const total_posts = activeData.length;
    const high_risk_posts = activeData.filter((item) => (item.risk_level || item.combined_risk_level) === "High").length;
    const averageRiskRaw = activeData.reduce((sum, item) => sum + normalizeRisk(item), 0) / total_posts;
    const average_combined_risk_score = Number(averageRiskRaw.toFixed(1));

    const topWarning = [...activeData].sort((a, b) => {
      const scoreDelta = normalizeRisk(b) - normalizeRisk(a);
      if (scoreDelta !== 0) return scoreDelta;
      return toTimeMs(b) - toTimeMs(a);
    })[0];

    return {
      total_posts,
      high_risk_posts,
      average_combined_risk_score,
      top_suspicious_domain: topWarning?.target_url || topWarning?.source_name || topWarning?.domain || "N/A",
    };
  }, [incidents, summary]);

  // Initial fetch for summary
  useEffect(() => {
    fetch("http://127.0.0.1:8000/summary")
      .then(res => res.json())
      .then(data => {
        if (data && data.total_posts !== undefined) {
          setSummary(data);
          return;
        }
        // Fallback to stable mock summary when API returns empty payload.
        setSummary(DEMO_SUMMARY || MOCK_SUMMARY);
      })
      .catch(err => {
        console.warn("Using mock summary, backend unavailable:", err);
        setSummary(DEMO_SUMMARY || MOCK_SUMMARY);
      });

    fetchMergedSportIncidents("football")
      .then((merged) => {
        if (merged.length > 0) {
          setIncidents(merged);
          return;
        }
        setIncidents((DEMO_INCIDENTS.length ? DEMO_INCIDENTS : MOCK_INCIDENTS).map((item) => normalizeForUi(item, "football")));
      })
      .catch((err) => {
        console.warn("Using mock incidents, APIs unavailable:", err);
        setIncidents((DEMO_INCIDENTS.length ? DEMO_INCIDENTS : MOCK_INCIDENTS).map((item) => normalizeForUi(item, "football")));
      });
  }, []);

  const handleAnalyze = async (sport) => {
    const normalizedEvent = DEFAULT_EVENT_BY_SPORT[sport] || "Active Event";
    try {
      localStorage.setItem("streamguard.active_event", normalizedEvent);
    } catch {}
    try {
      const mergedRaw = await fetchMergedSportIncidents(sport);
      const mergedData = mergedRaw.map((item) => ({
        ...item,
        active_event: normalizedEvent,
      }));
      const fallbackSportData = getDemoIncidentsForSport(sport).map((item) => normalizeForUi(item, sport));
      setIncidents(mergedData.length ? mergedData : fallbackSportData);
      // Update trend for dramatic effect
      setTrendIndicator(prev => `+${Math.floor(Math.random() * 20)}`);
      
      // Follow up by updating summary
      const sumRes = await fetch("http://127.0.0.1:8000/summary");
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        if (sumData && sumData.total_posts !== undefined) {
          setSummary(sumData);
        } else {
          const sourceData = mergedData.length > 0 ? mergedData : (getDemoIncidentsForSport(sport) || DEMO_MOCK_ALL);
          setSummary(buildSummaryFromIncidents(sourceData));
        }
      } else {
        const sourceData = mergedData.length > 0 ? mergedData : (getDemoIncidentsForSport(sport) || DEMO_MOCK_ALL);
        setSummary(buildSummaryFromIncidents(sourceData));
      }
    } catch (error) {
      console.warn("Analysis failed, using sport mock fallback", error);
      // Fallback: sport-aware mock data for demo reliability.
      const fallbackSportData = getDemoIncidentsForSport(sport);
      const nextIncidents = (fallbackSportData.length ? fallbackSportData : DEMO_MOCK_ALL).map((item) => normalizeForUi(item, sport)).map((item) => ({
        ...item,
        active_event: normalizedEvent,
      }));
      setIncidents(nextIncidents);
      setSummary(buildSummaryFromIncidents(nextIncidents));
      setTrendIndicator(prev => `+${Math.floor(Math.random() * 20)}`);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row min-h-full min-w-0 animate-in fade-in duration-500">
      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 pr-0 md:pr-4">
        <HeroCard 
          incidentCount={dynamicSummary.high_risk_posts} 
          clusterCount={Math.floor(dynamicSummary.high_risk_posts / 12) || 4} 
          trend={trendIndicator}
        />
        
        <ControlPanel onAnalyze={handleAnalyze} />

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <MetricTile label="Total Processed" value={dynamicSummary.total_posts.toLocaleString()} />
          <MetricTile label="High Risk" value={dynamicSummary.high_risk_posts.toLocaleString()} type="highRisk" />
          <MetricTile label="Avg Risk Score" value={dynamicSummary.average_combined_risk_score.toFixed(1)} />
          <MetricTile label="Top Warning" value={dynamicSummary.top_suspicious_domain} type="domain" />
        </div>

        {/* Incident Table */}
        <div className="flex-1 min-h-0 mb-8">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand-blue rounded-full shadow-[0_0_6px_rgba(37,99,235,0.6)]"></div>
              Active Threats
            </h2>
            <button className="text-[10px] font-bold text-slate-500 hover:text-brand-blue transition-colors uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 shadow-sm hover:shadow-md whitespace-nowrap">
              Expand Log
            </button>
          </div>
          <IncidentTable data={incidents} onRowClick={setSelectedIncident} />
        </div>
      </div>

      {/* Right Sidebar (Analytics) */}
      <RightSidebar averageRisk={dynamicSummary.average_combined_risk_score} incidents={incidents} />

      {/* Modal Overlay */}
      <Modal 
        isOpen={!!selectedIncident} 
        data={selectedIncident} 
        onClose={() => setSelectedIncident(null)} 
      />
    </div>
  );
}
