"use client";

export default function RightSidebar({ averageRisk = 0.5 }) {
  const terminalLogs = [
    { time: "14:02:01", ip: "192.168.1.104", event: "Node connected - Auth OK", risk: "low" },
    { time: "14:02:45", ip: "10.0.0.52", event: "Unusual data transfer spike", risk: "medium" },
    { time: "14:03:12", ip: "172.16.254.1", event: "Multiple failed sync attempts", risk: "medium" },
    { time: "14:04:33", ip: "198.51.100.22", event: "CRITICAL: Signature match [TGL-8x]", risk: "high" },
    { time: "14:05:00", ip: "192.168.1.105", event: "Node disconnected", risk: "low" },
  ];

  return (
    <aside className="w-80 ml-6 flex flex-col gap-6">
      {/* Risk Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
        <div className="absolute top-2 right-4 text-[10px] font-mono text-gray-400">SYS.OVR.00</div>
        <h3 className="text-[11px] font-semibold uppercase text-gray-500 tracking-widest mb-4">Risk Overview</h3>
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="text-4xl font-bold text-gray-900 font-mono">{(averageRisk * 100).toFixed(1)}%</span>
            <span className="text-sm text-gray-500 ml-2 font-medium">Avg Score</span>
          </div>
          <div className={`px-2 py-1 rounded text-[11px] font-bold border-l-2 ${averageRisk > 0.7 ? 'bg-red-50 text-risk-high border-risk-high' : averageRisk > 0.4 ? 'bg-amber-50 text-risk-medium border-risk-medium' : 'bg-emerald-50 text-risk-low border-risk-low'}`}>
            {averageRisk > 0.7 ? 'HIGH' : averageRisk > 0.4 ? 'MEDIUM' : 'LOW'}
          </div>
        </div>
        
        {/* Segmented Signal Bars (instead of solid block sparklines) */}
        <div className="w-full h-12 flex items-end gap-[2px]">
          {[40, 50, 45, 60, 55, 75, 80, 70, 85, 90].map((val, i) => (
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
          {[
            { domain: "streaming-live-hd.net", count: 142 },
            { domain: "sports-free-now.com", count: 89 },
            { domain: "telegram.me/free-leaks", count: 56 },
          ].map((item, i) => (
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

      {/* System Terminal (Live Intelligence) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-2 right-4 text-[10px] font-mono text-gray-400">SYS.LGL.99</div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold uppercase text-gray-500 tracking-widest">System Output Logs</h3>
          <div className="w-2 h-2 rounded-full bg-risk-low animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        </div>
        
        {/* Terminal Window */}
        <div className="bg-slate-900 rounded-lg p-3 flex-1 flex flex-col overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-blue opacity-50 animate-scan pointer-events-none z-10 hidden md:block"></div>
          
          <div className="space-y-1.5 flex-1 overflow-y-auto font-mono text-[10px]">
            {terminalLogs.map((log, i) => (
              <div key={i} className="flex flex-col border-b border-white/5 pb-1.5 gap-0.5">
                <div className="flex justify-between items-center text-slate-500">
                  <span>[{log.time}]</span>
                  <span className={`${log.risk === 'high' ? 'text-risk-high' : log.risk === 'medium' ? 'text-risk-medium' : 'text-brand-blue'} opacity-80`}>
                    IP:{log.ip}
                  </span>
                </div>
                <div className={`${log.risk === 'high' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {`> ${log.event}`}
                </div>
              </div>
            ))}
            <div className="text-slate-500 animate-pulse mt-2">{'> _'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
