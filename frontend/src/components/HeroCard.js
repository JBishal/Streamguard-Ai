export default function HeroCard({ incidentCount = 0, clusterCount = 0, trend = "+0" }) {
  return (
    <div className="relative rounded-2xl mb-6 shadow-sm border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
      <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Intelligence Core</h2>
          <p className="text-gray-600 max-w-xl text-[15px] leading-relaxed">
            Real-time monitoring of high-risk IP dissemination and unauthorized broadcasts across global networks and social clusters.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-w-[140px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">High Risk</span>
              <span className="text-[11px] font-bold text-risk-high bg-risk-high/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                {trend} <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </span>
            </div>
            <span className="text-3xl font-bold text-gray-900 font-mono tracking-tight">{incidentCount}</span>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-w-[140px]">
             <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Active Clusters</div>
             <span className="text-3xl font-bold text-gray-900 font-mono tracking-tight">{clusterCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
