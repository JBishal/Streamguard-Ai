import Badge from './Badge';

export default function IncidentTable({ data = [], onRowClick }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm relative">
      {/* Top right metadata */}
      <div className="absolute top-2 right-4 text-[10px] font-mono text-gray-400">
        SYS.TBL.01
      </div>
      
       <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest border-y border-gray-200">
              <th className="font-semibold py-3 px-5">Target ID</th>
              <th className="font-semibold py-3 px-5 w-24">Risk Score</th>
              <th className="font-semibold py-3 px-5 w-24">Status</th>
              <th className="font-semibold py-3 px-5 w-32">Cluster Node</th>
              <th className="font-semibold py-3 px-5">System Log</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500 font-mono text-xs">
                  [!] NO INCIDENTS DETECTED IN CURRENT SWEEP
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const numericRisk = Number(row.risk_score ?? row.combined_risk_score ?? 0);
                const normalizedRisk = numericRisk > 1 ? numericRisk / 100 : numericRisk;
                const riskLvl = row.risk_level || (normalizedRisk > 0.7 ? 'High' : normalizedRisk > 0.4 ? 'Medium' : 'Low');
                
                let rowBg = 'bg-white hover:bg-gray-50';
                let borderLeft = 'border-l-gray-200';
                
                if (riskLvl === 'High') {
                  rowBg = 'bg-red-50/50 hover:bg-red-50';
                  borderLeft = 'border-l-risk-high';
                } else if (riskLvl === 'Medium') {
                  rowBg = 'bg-amber-50/50 hover:bg-amber-50';
                  borderLeft = 'border-l-risk-medium';
                } else {
                  rowBg = 'bg-emerald-50/50 hover:bg-emerald-50';
                  borderLeft = 'border-l-risk-low';
                }

                return (
                  <tr 
                    key={idx} 
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`border-b border-gray-100 transition-colors cursor-pointer group ${rowBg}`}
                  >
                    <td className={`py-3.5 px-5 border-l-4 ${borderLeft}`}>
                      <div className="font-mono text-[13px] font-bold text-gray-900 group-hover:text-brand-blue transition-colors truncate max-w-xs">
                        {row.domain || row.title || "Unknown_Target_0x"}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-gray-700">{numericRisk.toFixed(2)}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge level={riskLvl} />
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-[11px] text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded shadow-sm">
                        {row.cluster_id || `C-${1000 + idx}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-gray-600 truncate max-w-sm font-mono text-[11px]" title={row.explanation || row.suspicion_triggers?.join(', ')}>
                      {row.explanation || (row.suspicion_triggers ? row.suspicion_triggers.join(' | ') : "SYS_ERR_UNAUTHORIZED_BROADCAST")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
