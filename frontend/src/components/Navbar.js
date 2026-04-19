"use client";

import { useState } from "react";
import { generateAndDownloadReportPdf } from "@/lib/reportPdf";

const SMTP_NOT_CONFIGURED_MESSAGE = "SMTP is not configured on the backend.";

export default function Navbar() {
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info");

  const getBackendCandidates = () => {
    const candidates = [];
    if (typeof window !== "undefined") {
      candidates.push(`${window.location.protocol}//${window.location.hostname}:8000`);
    }
    candidates.push("http://127.0.0.1:8000", "http://localhost:8000");
    return [...new Set(candidates)];
  };

  const sendWithFallback = async (payload) => {
    const endpoints = getBackendCandidates();
    let lastError = null;

    for (const baseUrl of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(`${baseUrl}/send-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.detail || "Failed to send report email.");
        }
        return data;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Could not reach backend report service.");
  };

  const handleGenerateReport = async () => {
    setStatusMessage("");
    setStatusType("info");
    setEmail("");
    setIsDialogOpen(true);
  };

  const handleSendReport = async () => {
    if (isSending) return;
    if (!email.trim()) {
      setStatusMessage("Please enter an email address.");
      setStatusType("error");
      return;
    }
    try {
      setIsSending(true);
      const data = await sendWithFallback({ email: email.trim() });
      setStatusMessage(`Report sent successfully to ${data.email}.`);
      setStatusType("success");
    } catch (error) {
      if (error?.message?.includes(SMTP_NOT_CONFIGURED_MESSAGE)) {
        try {
          await generateAndDownloadReportPdf();
          setStatusMessage("SMTP is not configured, so the report PDF was downloaded locally instead.");
          setStatusType("info");
          return;
        } catch (downloadError) {
          setStatusMessage(`Email is unavailable and local PDF download failed: ${downloadError.message}`);
          setStatusType("error");
          return;
        }
      }

      setStatusMessage(`Report email failed: ${error.message}`);
      setStatusType("error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <nav className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-blue shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l9 4.9V17L12 22l-9-4.9V6.9z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">StreamGuard AI</h1>
        
        <div className="ml-8 flex items-center gap-2 px-3 py-1 bg-risk-low/10 border border-risk-low/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-risk-low animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]"></div>
          <span className="text-[11px] font-bold text-risk-low uppercase tracking-widest">Monitoring Active</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerateReport}
          disabled={isSending}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-blue-600 transition-all duration-300 rounded-md text-sm font-semibold text-white shadow-sm hover:shadow-[0_0_12px_rgba(37,99,235,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isSending ? "Sending..." : "Generate Report"}
        </button>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-xl p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Email Report PDF</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter an email address and we will send the generated report PDF.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            {statusMessage && (
              <p
                className={`text-xs mt-3 ${
                  statusType === "success"
                    ? "text-green-700"
                    : statusType === "error"
                      ? "text-red-600"
                      : "text-gray-700"
                }`}
              >
                {statusMessage}
              </p>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isSending) return;
                  setIsDialogOpen(false);
                  setStatusMessage("");
                }}
                className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReport}
                disabled={isSending}
                className="px-3 py-2 rounded-md bg-brand-blue text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSending ? "Sending..." : "Send Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
