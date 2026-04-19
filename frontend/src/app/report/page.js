"use client";

import { useState } from "react";

import { generateAndDownloadReportPdf } from "@/lib/reportPdf";

export default function ReportPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      await generateAndDownloadReportPdf();
    } catch (error) {
      console.error("Failed to export report PDF:", error);
      alert("Could not export PDF right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto min-h-full pr-4 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Executive Briefing</h1>
          <p className="text-gray-500 font-medium">Generated automatically for StreamGuard Leadership</p>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-sm font-semibold text-gray-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isExporting ? "Exporting..." : "Export PDF"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm transition-shadow hover:shadow-md duration-300">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Situation Overview</h2>
            <div className="prose prose-blue text-gray-600 max-w-none font-medium">
              <p>
                During the recent high-profile broadcasting events, our AI monitoring suite detected a 
                <strong className="text-gray-900"> significant influx of unauthorized dissemination</strong> across web and social platforms.
              </p>
              <p>
                The primary vector remains decentralized social clusters (notably Telegram and Discord), 
                where links to illicit IPTV streams are shared moments before major sporting events begin. 
                Our predictive models correctly identified 94% of these high-risk clusters prior to the event start.
              </p>
              <p>
                Immediate action is recommended to rotate DRM keys more aggressively during the first 15 minutes 
                of broadcast.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 transition-transform hover:-translate-y-0.5 duration-300 shadow-sm">
              <h3 className="text-[11px] font-bold text-risk-high uppercase tracking-widest mb-2">Critical Incidents</h3>
              <div className="text-4xl font-bold text-gray-900 font-mono tracking-tight">142</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 transition-transform hover:-translate-y-0.5 duration-300 shadow-sm">
              <h3 className="text-[11px] font-bold text-brand-blue uppercase tracking-widest mb-2">Mitigation Rate</h3>
              <div className="text-4xl font-bold text-gray-900 font-mono tracking-tight">89.4%</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          {/* HeyGen / Video Avatar Placeholder */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm h-full flex flex-col hover:shadow-md transition-shadow duration-300">
            <div className="p-4 border-b border-gray-100 bg-gray-50 -mb-px">
               <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">AI Analyst Briefing</h3>
            </div>
            <div className="flex-1 bg-gray-100 relative group cursor-pointer overflow-hidden flex items-center justify-center min-h-[300px]">
              {/* Fake Video Player Placeholder */}
              <div className="relative z-20 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform mb-4 border border-gray-200">
                  <svg className="w-8 h-8 text-brand-blue ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-700 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-200 shadow-sm">Play AI Summary</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
