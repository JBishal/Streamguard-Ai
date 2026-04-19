import { fallbackIncidents, fallbackInsights, fallbackSummary } from "@/data/fallbackData";

const API_BASE_URL = "http://127.0.0.1:8000";

const normalizeIncidents = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.incidents)) return payload.incidents;
  return [];
};

async function fetchJsonWithTimeout(path, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Request failed for ${path} with status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchReportData() {
  const fetchedAtIso = new Date().toISOString();
  const [summaryResult, insightsResult, incidentsResult] = await Promise.allSettled([
    fetchJsonWithTimeout("/summary"),
    fetchJsonWithTimeout("/insights"),
    fetchJsonWithTimeout("/analyze-mock"),
  ]);

  const summary = summaryResult.status === "fulfilled" ? summaryResult.value : fallbackSummary;
  const insights = insightsResult.status === "fulfilled" ? insightsResult.value : fallbackInsights;
  const incidentsPayload = incidentsResult.status === "fulfilled" ? incidentsResult.value : fallbackIncidents;
  const incidents = normalizeIncidents(incidentsPayload);

  return {
    summary,
    insights,
    incidents: incidents.length > 0 ? incidents : fallbackIncidents,
    fetchedAtIso,
  };
}

function formatGeneratedAt(sourceIsoString) {
  const value = sourceIsoString ? new Date(sourceIsoString) : new Date();
  return value.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addWrappedText(doc, text, x, y, width, lineHeight) {
  const lines = doc.splitTextToSize(text || "", width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function buildIncidentLine(incident = {}, idx = 0) {
  const risk = Number(
    incident?.risk_score ??
      incident?.combined_risk_score ??
      incident?.base_risk_score ??
      0,
  ).toFixed(2);
  const domain = incident?.domain || incident?.url || incident?.target_url || "Unknown source";
  const explanation =
    incident?.recommendation_summary ||
    incident?.workflow_reason ||
    incident?.explanation ||
    "Potential piracy signal flagged for review.";
  return `${idx + 1}. ${domain} | Risk ${risk} | ${explanation}`;
}

export async function generateReportPdf() {
  const { jsPDF } = await import("jspdf");
  const data = await fetchReportData();

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 44;
  const contentWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  const lineHeight = 16;
  let y = 56;

  const ensureSpace = (requiredHeight = 28) => {
    if (y + requiredHeight > pageHeight - 48) {
      doc.addPage();
      y = 56;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("StreamGuard AI Executive Report", marginX, y);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(85, 85, 85);
  doc.text(`Generated: ${formatGeneratedAt(data.fetchedAtIso)}`, marginX, y);
  y += 24;

  doc.setDrawColor(225, 225, 225);
  doc.line(marginX, y, marginX + contentWidth, y);
  y += 24;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Summary", marginX, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const avgScore = Number(data.summary?.average_combined_risk_score ?? 0).toFixed(2);
  const summaryLines = [
    `Total monitored posts: ${data.summary?.total_posts ?? 0}`,
    `High-risk incidents: ${data.summary?.high_risk_posts ?? 0}`,
    `Average combined risk score: ${avgScore}`,
    `Top suspicious domain: ${data.summary?.top_suspicious_domain || "N/A"}`,
  ];
  summaryLines.forEach((line) => {
    ensureSpace();
    doc.text(`- ${line}`, marginX, y);
    y += lineHeight;
  });

  y += 14;
  ensureSpace(44);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("AI Insight", marginX, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const insightText = data.insights?.summary || "No insight summary available.";
  y = addWrappedText(doc, insightText, marginX, y, contentWidth, lineHeight);

  y += 18;
  ensureSpace(42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Top Incidents", marginX, y);
  y += 18;

  const topIncidents = data.incidents.slice(0, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  topIncidents.forEach((incident, idx) => {
    ensureSpace(48);
    y = addWrappedText(doc, buildIncidentLine(incident, idx), marginX, y, contentWidth, lineHeight);
    y += 8;
  });

  y += 8;
  ensureSpace(22);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(110, 110, 110);
  doc.text(
    "Source: StreamGuard backend intelligence feeds (Reddit + public web patterns).",
    marginX,
    y,
  );

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `streamguard-report-${dateStamp}.pdf`;
  const blob = doc.output("blob");
  return { blob, filename, data };
}

export function downloadPdfBlob(blob, filename) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

export async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
