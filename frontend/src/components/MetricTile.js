export default function MetricTile({ label, value, type = 'default' }) {
  let valueColor = 'text-gray-900';
  if (type === 'highRisk') valueColor = 'text-risk-high drop-shadow-sm';
  if (type === 'domain') valueColor = 'text-brand-blue';
  const metricTag = ((String(label).length * 7) % 90) + 10;
  const valueFont = type === 'domain' ? 'font-sans text-lg md:text-xl' : 'font-mono text-2xl';

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-5 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group">
      <div className="absolute top-2 right-3 text-[9px] font-mono text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity">
        SYS.MTR.{metricTag}
      </div>
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 mt-1">{label}</span>
      <span className={`${valueFont} font-bold ${valueColor} ${type === 'domain' ? 'break-all' : 'truncate'} leading-tight`} title={value}>
        {value}
      </span>
    </div>
  );
}
