"use client";
import Badge from './Badge';

export default function Modal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;
  const numericRisk = Number(data.risk_score ?? data.combined_risk_score ?? 0);
  const normalizedRisk = numericRisk > 1 ? numericRisk / 100 : numericRisk;
  const riskLevel = data.risk_level || (normalizedRisk > 0.7 ? "High" : normalizedRisk > 0.4 ? "Medium" : "Low");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900 max-w-md truncate">{data.domain || data.title}</h2>
              <Badge level={riskLevel} />
            </div>
            <p className="font-mono text-[11px] text-gray-500">Cluster ID: {data.cluster_id || 'N/A'} • Score: {numericRisk.toFixed(2)}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="space-y-6">
            
            <div>
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Detailed Explanation</h3>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                {data.explanation || "System identified anomalous behavior consistent with unauthorized broadcasts. Multiple nodes in this cluster are exhibiting high transit volumes."}
              </p>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Suspicion Triggers</h3>
              <ul className="space-y-3">
                {(data.suspicion_triggers || ["High volume traffic", "Known bad subnet", "IP masquerading"]).map((trigger, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                    <svg className="w-5 h-5 text-risk-medium shrink-0 mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{trigger}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4">
               <div className="flex-1 bg-risk-low/5 border border-risk-low/20 rounded-xl p-4">
                 <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Confidence</span>
                 <div className="text-xl font-bold text-risk-low mt-1 font-mono">94.2%</div>
               </div>
               <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-4">
                 <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">First Seen</span>
                 <div className="text-xl font-bold text-gray-900 mt-1 font-mono">2 hrs ago</div>
               </div>
            </div>

            {data.email_draft ? (
              <div>
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Email Prepared</h3>
                <div className="text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
                  <p><span className="font-semibold">To:</span> {data.email_draft.to}</p>
                  <p><span className="font-semibold">Subject:</span> {data.email_draft.subject}</p>
                  <p className="font-semibold pt-1">Body:</p>
                  <pre className="whitespace-pre-wrap text-[11px] text-gray-600 font-mono">{data.email_draft.body}</pre>
                </div>
              </div>
            ) : null}

          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
           <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors">
             Close
           </button>
           <button className="px-5 py-2 rounded-lg text-sm font-semibold bg-risk-high hover:bg-red-600 text-white transition-colors shadow-sm">
             Block Domain
           </button>
        </div>
      </div>
    </div>
  );
}
