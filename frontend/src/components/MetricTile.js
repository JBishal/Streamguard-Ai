export default function MetricTile({ label, value, type = 'default' }) {
  let valueColor = 'text-gray-900';
  if (type === 'highRisk') valueColor = 'text-risk-high';
  if (type === 'domain') valueColor = 'text-brand-blue';

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-5 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">{label}</span>
      <span className={`text-2xl font-bold ${valueColor} truncate font-mono`} title={value}>
        {value}
      </span>
    </div>
  );
}
