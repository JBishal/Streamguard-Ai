import Badge from './Badge';

export default function IncidentTable({ data = [], onRowClick }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
       <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest border-b border-gray-200">
              <th className="font-semibold py-3 px-5">Domain / Title</th>
              <th className="font-semibold py-3 px-5 w-24">Risk Score</th>
              <th className="font-semibold py-3 px-5 w-24">Level</th>
              <th className="font-semibold py-3 px-5 w-32">Cluster ID</th>
              <th className="font-semibold py-3 px-5">Explanation</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">
                  No incidents found. Run analysis.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-5">
                    <div className="font-medium text-gray-900 group-hover:text-brand-blue transition-colors truncate max-w-xs">{row.domain || row.title || "Unknown Domain"}</div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-mono font-bold text-gray-700">{(row.risk_score || row.combined_risk_score || 0).toFixed(2)}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <Badge level={row.risk_level || (row.combined_risk_score > 0.7 ? 'High' : row.combined_risk_score > 0.4 ? 'Medium' : 'Low')} />
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-mono text-xs text-brand-purple bg-brand-purple/10 px-2 py-1 rounded-md font-medium">
                      {row.cluster_id || `C-${Math.floor(Math.random() * 9000) + 1000}`}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-500 truncate max-w-sm" title={row.explanation || row.suspicion_triggers?.join(', ')}>
                    {row.explanation || (row.suspicion_triggers ? row.suspicion_triggers.join(', ') : "Behavior indicates unauthorized streaming.")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
