export default function Navbar() {
  return (
    <nav className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-blue shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l9 4.9V17L12 22l-9-4.9V6.9z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">StreamGuard AI</h1>
        
        <div className="ml-8 flex items-center gap-2 px-3 py-1 bg-risk-low/10 border border-risk-low/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-risk-low animate-pulse"></div>
          <span className="text-[11px] font-bold text-risk-low uppercase tracking-widest">Monitoring Active</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:opacity-90 transition-opacity rounded-md text-sm font-semibold text-white shadow-sm hover:shadow-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Report
        </button>
      </div>
    </nav>
  );
}
