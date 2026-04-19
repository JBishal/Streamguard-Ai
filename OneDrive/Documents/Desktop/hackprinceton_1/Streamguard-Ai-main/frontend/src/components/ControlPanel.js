"use client";
import { useState } from 'react';

export default function ControlPanel({ onAnalyze }) {
  const [sport, setSport] = useState('football');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    await onAnalyze(sport);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm flex flex-col md:flex-row items-end gap-5 transform transition-all duration-300 hover:shadow-md relative overflow-hidden group">
      <div className="absolute top-2 right-4 text-[9px] font-mono text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity">
        SYS.CTRL.04
      </div>
      
      <div className="flex-1 w-full relative">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-1">Classification Class</label>
        <div className="relative">
          <select 
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-4 pr-10 py-2.5 text-[13px] font-medium text-slate-900 appearance-none focus:outline-none focus:bg-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all shadow-inner"
          >
            <option value="football">Football</option>
            <option value="cricket">Cricket</option>
            <option value="basketball">Basketball</option>
            <option value="esports">Esports</option>
            <option value="motorsport">Motorsport</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <button 
        onClick={handleAnalyze}
        disabled={isLoading}
        className="w-full md:w-auto h-[42px] px-6 bg-brand-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-md text-[13px] font-semibold text-white shadow-sm flex items-center justify-center gap-2 shrink-0 hover:shadow-[0_0_12px_rgba(37,99,235,0.4)]"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : (
           <>
            <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Load Sport Data
           </>
        )}
      </button>
    </div>
  );
}
