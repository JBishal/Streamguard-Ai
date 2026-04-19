export default function MetricTile({ label, value, type = 'default' }) {
  let valueColor = 'text-gray-900';
  if (type === 'highRisk') valueColor = 'text-risk-high drop-shadow-sm';
  if (type === 'domain') valueColor = 'text-brand-blue';

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-5 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group">
      <div className="absolute top-2 right-3 text-[9px] font-mono text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity">
        SYS.MTR.{Math.floor(Math.random() * 90) + 10}
      </div>
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 mt-1">{label}</span>
      <span className={`text-2xl font-bold ${valueColor} truncate font-mono`} title={value}>
        {value}
      </span>
    </div>
  );
}
