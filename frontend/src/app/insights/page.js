export default function InsightsPage() {
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto min-h-full flex flex-col">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">AI Insights</h1>
      
      <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200 shadow-sm transition-shadow hover:shadow-md duration-300">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Executive Summary
        </h2>
        <p className="text-gray-600 leading-relaxed text-[15px] font-medium">
          Over the past 72 hours, monitoring indicates a 34% increase in high-risk streaming links distributed via temporary Telegram clusters. The primary target event was the "Champions League Final". Automated mitigation blocked 89% of these attempts within 5 minutes of dissemination. The domain <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-sm text-gray-800 border border-gray-200">livestream-hd-pro.tv</span> has emerged as a persistent threat vector, rotating subdomains to evade IP bans.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1 shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50 -mb-px">
           <h3 className="text-[11px] font-bold uppercase text-gray-500 tracking-widest">Top Threat Vectors</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { domain: "livestream-hd-pro.tv", type: "Web Proxy", count: 1420 },
            { domain: "sports-free-now.com", type: "Hidden Iframe", count: 890 },
            { domain: "soccer-live-88.net", type: "P2P Stream", count: 650 },
            { domain: "t.me/free-ucl-links", type: "Social Cluster", count: 540 }
          ].map((item, i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
               <div>
                  <div className="font-bold text-gray-900 text-lg mb-1 group-hover:text-brand-blue transition-colors">{item.domain}</div>
                  <div className="text-sm text-gray-500 font-medium">{item.type}</div>
               </div>
               <div className="text-right">
                  <div className="font-mono font-bold text-gray-900 text-2xl tracking-tight">{item.count.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Incidents</div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
