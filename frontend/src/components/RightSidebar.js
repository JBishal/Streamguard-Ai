"use client";

export default function RightSidebar({ averageRisk = 0.5 }) {
  const feedItems = [
    { title: "High-risk domain detected", time: "Just now", type: "critical" },
    { title: "Cluster 'Telegram-812' updated", time: "2 min ago", type: "info" },
    { title: "New suspicious pattern detected", time: "5 min ago", type: "warning" },
  ];

  return (
    <aside className="w-80 ml-6 flex flex-col gap-6">
      {/* Risk Overview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-[11px] font-semibold uppercase text-gray-500 tracking-widest mb-4">Risk Overview</h3>
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="text-4xl font-bold text-gray-900 font-mono">{(averageRisk * 100).toFixed(1)}%</span>
            <span className="text-sm text-gray-500 ml-2 font-medium">Avg Score</span>
          </div>
          <div className={`px-2 py-1 rounded text-[11px] font-bold ${averageRisk > 0.7 ? 'bg-risk-high/10 text-risk-high' : averageRisk > 0.4 ? 'bg-risk-medium/10 text-risk-medium' : 'bg-risk-low/10 text-risk-low'}`}>
            {averageRisk > 0.7 ? 'HIGH' : averageRisk > 0.4 ? 'MEDIUM' : 'LOW'}
          </div>
        </div>
        {/* Simple Sparkline placeholder */}
        <div className="w-full h-12 flex items-end gap-1">
          {[40, 50, 45, 60, 55, 75, 80, 70, 85, 90].map((val, i) => (
            <div 
              key={i} 
              className="flex-1 rounded-t-md opacity-80"
              style={{ height: `${val}%`, backgroundColor: val > 75 ? 'var(--color-risk-high)' : val > 50 ? 'var(--color-risk-medium)' : 'var(--color-brand-cyan)' }}
            ></div>
          ))}
        </div>
      </div>

      {/* Top Suspicious Domains */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-[11px] font-semibold uppercase text-gray-500 tracking-widest mb-4">Top Suspicious Domains</h3>
        <div className="space-y-4">
          {[
            { domain: "streaming-live-hd.net", count: 142 },
            { domain: "sports-free-now.com", count: 89 },
            { domain: "telegram.me/free-leaks", count: 56 },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600 font-mono text-[11px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{item.domain}</span>
                <span className="font-bold text-gray-900 text-xs">{item.count}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200/50">
                <div 
                  className="bg-brand-blue h-full rounded-full opacity-80" 
                  style={{ width: `${Math.min(item.count, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Intelligence Feed */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[11px] font-semibold uppercase text-gray-500 tracking-widest">Live Intelligence</h3>
          <div className="w-2 h-2 rounded-full bg-risk-low animate-ping"></div>
        </div>
        <div className="space-y-4 flex-1 overflow-y-auto">
          {feedItems.map((item, i) => (
            <div key={i} className="flex gap-3 hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
              <div className="mt-1">
                <div className={`w-2 h-2 rounded-full ring-4 ${item.type === 'critical' ? 'bg-risk-high ring-risk-high/20' : item.type === 'warning' ? 'bg-risk-medium ring-risk-medium/20' : 'bg-brand-blue ring-brand-blue/20'}`}></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
