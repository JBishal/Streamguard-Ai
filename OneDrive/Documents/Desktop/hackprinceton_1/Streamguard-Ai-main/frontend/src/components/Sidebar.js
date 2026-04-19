"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const defaultByRoute = {
    "/": "Champions League Final",
    "/sources": "India vs Australia 2nd ODI",
    "/insights": "Valorant Masters Madrid",
    "/report": "Monaco Grand Prix Live",
  };
  const [activeEvent, setActiveEvent] = useState(defaultByRoute[pathname] || "Champions League Final");

  useEffect(() => {
    const saved = localStorage.getItem("streamguard.active_event");
    setActiveEvent(saved || defaultByRoute[pathname] || "Champions League Final");
  }, [pathname]);
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Sources', path: '/sources', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { name: 'Insights', path: '/insights', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Reports', path: '/report', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-5">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Navigation</h2>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${pathname === item.path ? 'bg-brand-blue/10 text-brand-blue font-semibold shadow-[1px_1px_0_rgba(37,99,235,0.1)]' : 'text-slate-600 hover:text-brand-blue hover:bg-slate-50 font-medium'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
              </svg>
              <span className="text-[13px]">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-5 border-t border-slate-200 bg-slate-50/50">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">System Context</h2>
        <div className="space-y-5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Active Event</span>
            <span className="text-[13px] font-semibold text-slate-900 truncate">{activeEvent}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Monitoring Mode</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse shadow-[0_0_6px_rgba(37,99,235,0.5)]"></div>
              <span className="text-[13px] font-semibold text-brand-blue">Live Analysis</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Data Source</span>
            <span className="text-[13px] font-medium text-slate-700 font-mono">PUB_SIG_NET_01</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
