import { useEffect, useState } from "react";
import api from "./api/client";

function App() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get("/summary");
        setSummary(response.data);
      } catch (err) {
        setError("Failed to load summary data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <h1 className="text-3xl font-bold text-slate-900">StreamGuard AI</h1>
        <p className="mt-4 text-slate-600">Loading summary...</p>
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
    </div>
  );
}

export default App;
