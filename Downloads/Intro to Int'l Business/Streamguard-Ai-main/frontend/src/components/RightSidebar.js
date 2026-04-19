"use client";
import { useMemo } from "react";

const normalizeRisk = (item) => {
  const value = Number(item?.risk_score ?? item?.combined_risk_score ?? 0);
  return value > 1 ? value : value * 100;
};

export default function RightSidebar({ averageRisk = 0, incidents = [] }) {
  const topTargets = useMemo(() => {
    const weights = {};
    incidents.forEach((item) => {
      const key = item.target_url || item.domain || item.source_name || "unknown-target";
      const score = normalizeRisk(item);
      weights[key] = (weights[key] || 0) + (score >= 75 ? 3 : score >= 40 ? 2 : 1);
    });
    return Object.entries(weights)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [incidents]);

  const insights = useMemo(() => {
    if (!incidents.length) return ["No active insights available for this sport yet."];

    const total = incidents.length;
    const high = incidents.filter((item) => (item.risk_level || item.combined_risk_level) === "High").length;
    const streamLinks = incidents.filter((item) => item.stream_link_detected).length;
    const platformCount = incidents.reduce((acc, item) => {
      const key = item.platform || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const regionCount = incidents.reduce((acc, item) => {
      const key = item.geo_region || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const sourceCount = incidents.reduce((acc, item) => {
      const key = item.target_url || item.source_name || item.domain || "unknown-target";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topPlatform = Object.entries(platformCount).sort((a, b) => b[1] - a[1])[0];
    const topRegion = Object.entries(regionCount).sort((a, b) => b[1] - a[1])[0];
    const topSource = Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0];
    const avgRisk = incidents.reduce((sum, item) => sum + normalizeRisk(item), 0) / total;

    return [
      `${high} of ${total} incidents are high risk (${((high / total) * 100).toFixed(0)}%), indicating focused escalation demand.`,
      `${topPlatform?.[0] || "Unknown"} is currently the most active flagged platform for this sport.`,
      `${topSource?.[0] || "Unknown target"} appears most repeatedly in the current incident stream.`,
      `Average risk is ${avgRisk.toFixed(1)} with direct stream-link detection in ${((streamLinks / total) * 100).toFixed(0)}% of records.`,
      `Activity is most concentrated in ${topRegion?.[0] || "Unknown region"} for this selected classification.`,
    ];
  }, [incidents]);

  const avgRiskValue = Number(averageRisk || 0);
  const avgRiskLevel = avgRiskValue >= 75 ? "HIGH" : avgRiskValue >= 40 ? "MEDIUM" : "LOW";

  return (
    <aside className="w-80 ml-6 flex flex-col gap-6">
      {/* Risk Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
        <div className="absolute top-2 right-4 text-[10px] font-mono text-gray-400">SYS.OVR.00</div>
        <h3 className="text-[11px] font-semibold uppercase text-gray-500 tracking-widest mb-4">Risk Overview</h3>
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="text-4xl font-bold text-gray-900 font-mono">{avgRiskValue.toFixed(1)}%</span>
            <span className="text-sm text-gray-500 ml-2 font-medium">Avg Score</span>
          </div>
          <div className={`px-2 py-1 rounded text-[11px] font-bold border-l-2 ${avgRiskValue >= 75 ? 'bg-red-50 text-risk-high border-risk-high' : avgRiskValue >= 40 ? 'bg-amber-50 text-risk-medium border-risk-medium' : 'bg-emerald-50 text-risk-low border-risk-low'}`}>
            {avgRiskLevel}
          </div>
        </div>
        
        {/* Segmented Signal Bars (instead of solid block sparklines) */}
        <div className="w-full h-12 flex items-end gap-[2px]">
          {(incidents.length > 0 ? incidents.slice(0, 10).map((item) => Math.round(normalizeRisk(item))) : [40, 48, 52, 57, 61, 68, 72, 76, 80, 84]).map((val, i) => (
            <div 
              key={i} 
              className="flex-1 flex flex-col justify-end gap-[2px]"
              style={{ height: '100%' }}
            >
              {[...Array(5)].map((_, j) => {
                const threshold = (j + 1) * 20;
                let isActive = val >= threshold;
                let bgLevel = val > 75 ? 'bg-risk-high' : val > 50 ? 'bg-risk-medium' : 'bg-brand-blue';
                return (
                  <div 
                    key={j} 
                    className={`h-full w-full rounded-[1px] ${isActive ? bgLevel : 'bg-gray-100'}`}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Top Suspicious Domains */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
        <div className="absolute top-2 right-4 text-[10px] font-mono text-gray-400">SYS.DOM.02</div>
        <h3 className="text-[11px] font-semibold uppercase text-gray-500 tracking-widest mb-4">Top Targets</h3>
        <div className="space-y-4">
          {topTargets.map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-700 font-mono text-[11px] font-semibold">{item.domain}</span>
                <span className="font-bold text-gray-900 font-mono text-xs">{item.count}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-sm h-1.5 overflow-hidden">
                <div 
                  className="bg-brand-blue h-full rounded-sm opacity-90 shadow-[0_0_8px_rgba(37,99,235,0.4)]" 
                  style={{ width: `${Math.min(item.count, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-2 right-4 text-[10px] font-mono text-gray-400">SYS.LGL.99</div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold uppercase text-gray-500 tracking-widest">Insights</h3>
          <div className="w-2 h-2 rounded-full bg-risk-low animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 flex-1 flex flex-col overflow-hidden relative border border-gray-100">
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {insights.map((line, i) => (
              <div key={i} className="text-[12px] text-gray-700 leading-relaxed border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
