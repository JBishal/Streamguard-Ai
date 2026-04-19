import { fallbackIncidents, fallbackInsights, fallbackSummary } from "@/data/fallbackData";

const API_BASE_URL = "http://127.0.0.1:8000";

function normalizeIncidents(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function fetchJson(path) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
  if (!response.ok) {
    throw new Error(`Request failed for ${path} with status ${response.status}`);
  }
  return response.json();
}

async function fetchReportData() {
  const [summaryResult, insightsResult, incidentsResult] = await Promise.allSettled([
    fetchJson("/summary"),
    fetchJson("/insights"),
    fetchJson("/analyze-mock"),
  ]);

  const summary = summaryResult.status === "fulfilled" ? summaryResult.value : fallbackSummary;
  const insights = insightsResult.status === "fulfilled" ? insightsResult.value : fallbackInsights;
  const incidentsPayload = incidentsResult.status === "fulfilled" ? incidentsResult.value : fallbackIncidents;
  const incidents = normalizeIncidents(incidentsPayload);

  return {
    summary,
    insights,
    incidents: incidents.length > 0 ? incidents : fallbackIncidents,
  };
}

function formatGeneratedAt() {
  return new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addWrappedText(doc, text, x, y, width, lineHeight) {
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export async function generateAndDownloadReportPdf() {
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
  doc.text(`Generated: ${formatGeneratedAt()}`, marginX, y);
  y += 24;

  doc.setDrawColor(225, 225, 225);
  doc.line(marginX, y, marginX + contentWidth, y);
  y += 24;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Summary Metrics", marginX, y);
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
    const risk = Number(
      incident?.risk_score ??
        incident?.combined_risk_score ??
        incident?.base_risk_score ??
        0,
    ).toFixed(2);
    const domain = incident?.domain || incident?.url || "Unknown source";
    const explanation =
      incident?.recommendation_summary ||
      incident?.workflow_reason ||
      incident?.explanation ||
      "Potential piracy signal flagged for review.";
    const entry = `${idx + 1}. ${domain} | Risk ${risk} | ${explanation}`;

    ensureSpace(48);
    y = addWrappedText(doc, entry, marginX, y, contentWidth, lineHeight);
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
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}
