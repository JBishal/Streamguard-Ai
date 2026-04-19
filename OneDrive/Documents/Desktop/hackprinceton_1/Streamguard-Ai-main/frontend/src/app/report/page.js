"use client";

import { useEffect, useRef, useState } from "react";
import { blobToBase64, downloadPdfBlob, generateReportPdf } from "@/lib/reportPdf";

export default function ReportPage() {
  const autoTriggeredRef = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isReportReady, setIsReportReady] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [reportPayload, setReportPayload] = useState(null);

  useEffect(() => {
    if (isReportReady) {
      setEmailOpen(true);
    }
  }, [isReportReady]);

  const handleExportPdf = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      setEmailStatus("");
      setIsReportReady(false);
      const payload = await generateReportPdf();
      setReportPayload(payload);
      setIsReportReady(true);
      downloadPdfBlob(payload.blob, payload.filename);
    } catch (error) {
      console.error("Failed to export report PDF:", error);
      setIsReportReady(false);
      alert("Could not export PDF right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const shouldAutoGenerate = new URLSearchParams(window.location.search).get("autogenerate") === "1";
    if (!shouldAutoGenerate || autoTriggeredRef.current || isExporting || isReportReady) {
      return;
    }
    autoTriggeredRef.current = true;
    handleExportPdf();
  }, [isExporting, isReportReady]);

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (!reportPayload?.blob || !reportPayload?.filename || isSending) return;

    try {
      setIsSending(true);
      setEmailStatus("");
      const fileBase64 = await blobToBase64(reportPayload.blob);
      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo.trim(),
          filename: reportPayload.filename,
          fileBase64,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to send report email.");
      }
      setEmailStatus("Report emailed successfully.");
      setTimeout(() => setEmailOpen(false), 800);
    } catch (error) {
      console.error("Failed to email report:", error);
      setEmailStatus(error?.message || "Failed to send report email.");
    } finally {
      setIsSending(false);
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
          {isExporting ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {isReportReady ? (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">Report ready: {reportPayload?.filename || "streamguard-report.pdf"}</p>
            <p className="text-xs text-gray-500">You can now email the generated PDF report.</p>
          </div>
          <button
            onClick={() => setEmailOpen(true)}
            className="px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            Email Report
          </button>
        </div>
      ) : null}

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

      {emailOpen && isReportReady ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Email Report</h3>
            <p className="text-sm text-gray-500 mb-4">Send the generated PDF as an attachment.</p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                value={emailTo}
                onChange={(event) => setEmailTo(event.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              {emailStatus ? (
                <p className={`text-sm ${emailStatus.includes("success") ? "text-green-600" : "text-red-600"}`}>
                  {emailStatus}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEmailOpen(false)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !reportPayload}
                  className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
