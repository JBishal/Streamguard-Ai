import { useEffect, useState } from "react";
import api from "./api/client";

function App() {
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryResponse, incidentsResponse, insightsResponse] = await Promise.all([
          api.get("/summary"),
          api.get("/analyze-mock"),
          api.get("/insights"),
        ]);

        setSummary(summaryResponse.data);
        setIncidents(incidentsResponse.data.results);
        setInsights(insightsResponse.data);
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <h1 className="text-3xl font-bold text-slate-900">StreamGuard AI</h1>
        <p className="mt-4 text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <h1 className="text-3xl font-bold text-slate-900">StreamGuard AI</h1>
        <p className="mt-4 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">StreamGuard AI</h1>
      <p className="mt-2 text-slate-600">
        AI-powered piracy exposure intelligence dashboard
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-sm font-medium text-slate-500">Total Posts</h2>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {summary.total_posts}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-sm font-medium text-slate-500">High Risk Posts</h2>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {summary.high_risk_posts}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-sm font-medium text-slate-500">Average Risk Score</h2>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {summary.average_combined_risk_score}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-sm font-medium text-slate-500">Top Suspicious Domain</h2>
          <p className="mt-2 text-lg font-bold text-slate-900 break-all">
            {summary.top_suspicious_domain || "N/A"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Count: {summary.top_domain_count}
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-white p-6 shadow">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Flagged Incidents</h2>
          <p className="text-sm text-slate-500">
            Ranked suspicious posts and links detected by the hybrid scoring pipeline
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Post</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Rule</th>
                <th className="px-4 py-3 font-medium">Gemini</th>
                <th className="px-4 py-3 font-medium">Combined</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Level</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="max-w-md px-4 py-4 text-sm text-slate-800">
                    <div className="font-medium">{item.post_text}</div>
                    <div className="mt-1 text-xs text-slate-500 break-all">
                      {item.url}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700 break-all">
                    {item.domain}
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                    {item.rule_score}
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                    {item.gemini_score}
                  </td>

                  <td className="px-4 py-4 text-sm font-bold text-slate-900">
                    {item.combined_risk_score}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700">
                    {item.combined_confidence}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.combined_risk_level === "High"
                          ? "bg-red-100 text-red-700"
                          : item.combined_risk_level === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.combined_risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-white p-6 shadow">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">AI Insights</h2>
          <p className="text-sm text-slate-500">
            AI-generated analysis of piracy exposure patterns
          </p>
        </div>

        {insights && (
          <>
            <div className="mb-6 rounded-xl bg-slate-50 p-4">
              <p className="leading-relaxed text-slate-800">
                {insights.summary}
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-600">
                Top Suspicious Domains
              </h3>
              <ul className="space-y-2">
                {insights.top_domains.map((item, index) => (
                  <li
                    key={index}
                    className="flex justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">
                      {item[0]}
                    </span>
                    <span className="text-slate-500">
                      {item[1]} occurrences
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 text-sm text-slate-500">
              High-risk incidents:{" "}
              <span className="font-semibold text-slate-800">
                {insights.high_risk_count}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
