export default function SourcesPage() {
  return (
    <div className="animate-in fade-in duration-500 min-h-full flex flex-col pr-4 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Data Sources</h1>
          <p className="text-gray-500 font-medium">Manage intelligence feeds and API integrations.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-[#1E40AF] transition-colors rounded-lg text-sm font-semibold text-white shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Source
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: "Twitter / X Firehose", status: "Active", type: "Social Media", latency: "120ms" },
          { name: "Telegram Groups Scraper", status: "Active", type: "Messaging", latency: "450ms" },
          { name: "Reddit Live Streams Mntr", status: "Active", type: "Forum", latency: "310ms" },
          { name: "Discord Server Relays", status: "Warning", type: "Messaging", latency: "1.2s" },
          { name: "Dark Web Fora", status: "Active", type: "Web", latency: "800ms" },
          { name: "TikTok Live API", status: "Paused", type: "Social Media", latency: "-" },
        ].map((source, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-brand-blue/30 transition-all duration-300 group hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-brand-blue/5 transition-colors">
                   <svg className="w-5 h-5 text-gray-500 group-hover:text-brand-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                   </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{source.name}</h3>
                  <span className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">{source.type}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
               <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${source.status === 'Active' ? 'bg-risk-low animate-pulse' : source.status === 'Warning' ? 'bg-risk-medium' : 'bg-gray-400'}`}></div>
                 <span className="text-sm text-gray-600 font-medium">{source.status}</span>
               </div>
               <div className="text-sm text-gray-500 font-mono text-xs">{source.latency}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
