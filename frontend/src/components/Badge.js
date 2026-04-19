export default function Badge({ level }) {
  let colorClass = 'bg-risk-low/10 text-risk-low border-risk-low/20';
  let levelText = 'Low';

  if (level === 'High' || level > 0.7) {
    colorClass = 'bg-risk-high/10 text-risk-high border-risk-high/20';
    levelText = 'High';
  } else if (level === 'Medium' || (level > 0.4 && level <= 0.7)) {
    colorClass = 'bg-risk-medium/10 text-risk-medium border-risk-medium/20';
    levelText = 'Medium';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${colorClass}`}>
      {levelText}
    </span>
  );
}
