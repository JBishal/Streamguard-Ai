"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="min-h-16 border-b border-gray-200 bg-white flex items-center justify-between flex-wrap gap-y-2 px-3 sm:px-4 md:px-6 py-2 sticky top-0 z-50 shadow-sm relative">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-[0_6px_14px_rgba(37,99,235,0.28)]">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l7 4v5c0 4.2-2.4 7.3-7 9-4.6-1.7-7-4.8-7-9V7l7-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 12.5l2.2 2.2L15.5 10" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M4 9.5h2M18 9.5h2M12 1.8v1.6" />
          </svg>
        </div>
        <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-gray-900 whitespace-nowrap leading-tight">
          <span className="font-extrabold">StreamGuard</span>
          <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[0.62em] sm:text-[0.65em] font-bold uppercase tracking-[0.14em] text-brand-blue bg-blue-50 border border-blue-100 align-middle">
            AI
          </span>
        </h1>
        
        <div className="ml-2 sm:ml-6 md:ml-8 hidden md:flex items-center gap-2 px-3 py-1 bg-risk-low/10 border border-risk-low/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-risk-low animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]"></div>
          <span className="text-[11px] font-bold text-risk-low uppercase tracking-widest">Monitoring Active</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <button
          onClick={() => router.push("/report?autogenerate=1")}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-blue hover:bg-blue-600 transition-all duration-300 rounded-md text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow-[0_0_12px_rgba(37,99,235,0.4)] whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Report
        </button>
      </div>
    </nav>
  );
}
