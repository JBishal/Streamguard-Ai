export default function HeroCard({ incidentCount = 0, clusterCount = 0, trend = "+0" }) {
  return (
    <div className="relative rounded-xl mb-6 shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Top right metadata */}
      <div className="absolute top-2 right-4 text-[10px] font-mono text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity">
        SYS.ID: SG-AL-01 | {new Date().toISOString().split('T')[0]}
      </div>

      <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-brand-blue rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Intelligence Core</h2>
          </div>
          <p className="text-gray-600 max-w-xl text-[14px] leading-relaxed font-medium">
            StreamGuard AI monitors open digital signals across social platforms, suspicious domains, and sharing networks to identify possible unauthorized sports distribution.
            It prioritizes incidents with transparent risk scoring based on signal strength, audience reach, repeat behavior, and event importance.
            Rights teams can focus first on urgent threats while the platform prepares rapid, demo-safe response actions for high-risk cases.
            Built for live sports operations, it turns scattered online signals into a clear operational view.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 min-w-[140px] relative overflow-hidden group-hover:border-brand-blue/20 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-risk-high opacity-80"></div>
            <div className="flex items-center justify-between mb-1.5 pl-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">High Risk</span>
              <span className="text-[10px] font-bold text-risk-high bg-risk-high/10 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                {trend} <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </span>
            </div>
            <span className="text-3xl font-bold text-gray-900 font-mono tracking-tight pl-2">{incidentCount}</span>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 min-w-[140px] relative overflow-hidden group-hover:border-brand-blue/20 transition-colors">
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-blue opacity-50"></div>
             <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-2">Active Clusters</div>
             <span className="text-3xl font-bold text-gray-900 font-mono tracking-tight pl-2">{clusterCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
