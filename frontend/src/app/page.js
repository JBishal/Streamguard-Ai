"use client";
import { useState, useEffect } from "react";
import HeroCard from "@/components/HeroCard";
import ControlPanel from "@/components/ControlPanel";
import MetricTile from "@/components/MetricTile";
import IncidentTable from "@/components/IncidentTable";
import RightSidebar from "@/components/RightSidebar";
import Modal from "@/components/Modal";

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

export default function Home() {
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [trendIndicator, setTrendIndicator] = useState("+12");

  // Initial fetch for summary
  useEffect(() => {
    fetch("http://127.0.0.1:8000/summary")
      .then(res => res.json())
      .then(data => {
        if (data && data.total_posts !== undefined) setSummary(data);
      })
      .catch(err => console.warn("Using mock summary, backend unavailable:", err));

    fetch("http://127.0.0.1:8000/analyze-mock")
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setIncidents(data);
      })
      .catch(err => console.warn("Using mock incidents, backend unavailable:", err));
  }, []);

  const handleAnalyze = async (sport, event) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/analyze-sport/${sport}`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setIncidents(data);
      // Update trend for dramatic effect
      setTrendIndicator(prev => `+${Math.floor(Math.random() * 20)}`);
      
      // Follow up by updating summary
      const sumRes = await fetch("http://127.0.0.1:8000/summary");
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
    } catch (error) {
      console.warn("Analysis failed, using mock data shuffle", error);
      // Shuffle mock incidents to simulate change
      setIncidents([...incidents].sort(() => Math.random() - 0.5));
      setTrendIndicator(prev => `+${Math.floor(Math.random() * 20)}`);
    }
  };

  return (
    <div className="flex min-h-full animate-in fade-in duration-500">
      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 pr-2">
        <HeroCard 
          incidentCount={summary.high_risk_posts} 
          clusterCount={Math.floor(summary.high_risk_posts / 12) || 4} 
          trend={trendIndicator}
        />
        
        <ControlPanel onAnalyze={handleAnalyze} />

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricTile label="Total Processed" value={summary.total_posts.toLocaleString()} />
          <MetricTile label="High Risk" value={summary.high_risk_posts.toLocaleString()} type="highRisk" />
          <MetricTile label="Avg Risk Score" value={summary.average_combined_risk_score.toFixed(2)} />
          <MetricTile label="Top Warning" value={summary.top_suspicious_domain} type="domain" />
        </div>

        {/* Incident Table */}
        <div className="flex-1 min-h-0 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Active Threats</h2>
            <button className="text-[11px] font-semibold text-brand-blue hover:text-[#1E40AF] transition-colors uppercase tracking-widest">
              View All
            </button>
          </div>
          <IncidentTable data={incidents} onRowClick={setSelectedIncident} />
        </div>
      </div>

      {/* Right Sidebar (Analytics) */}
      <RightSidebar averageRisk={summary.average_combined_risk_score} />

      {/* Modal Overlay */}
      <Modal 
        isOpen={!!selectedIncident} 
        data={selectedIncident} 
        onClose={() => setSelectedIncident(null)} 
      />
    </div>
  );
}
