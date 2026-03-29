import styles from './PieChart.module.css';

export default function PieChart({ categories, colorMap }) {
  const total = categories.reduce((sum, c) => sum + c.total, 0);
  if (total === 0) return null;

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  const sorted = [...categories].sort((a, b) => b.total - a.total);

  let cumAngle = -Math.PI / 2;
  const slices = sorted.map(cat => {
    const fraction = cat.total / total;
    const angle = fraction * 2 * Math.PI;
    const start = cumAngle;
    cumAngle += angle;
    const end = cumAngle;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { path, color: colorMap[cat.name], name: cat.name, fraction };
  });

  return (
    <div className={styles.chartWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map(s => (
          <path key={s.name} d={s.path} fill={s.color} stroke="#fff" strokeWidth={1.5} />
        ))}
      </svg>
      <div className={styles.legend}>
        {slices.map(s => (
          <div key={s.name} className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ backgroundColor: s.color }} />
            <span className={styles.legendLabel}>{s.name}</span>
            <span className={styles.legendPct}>{(s.fraction * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
