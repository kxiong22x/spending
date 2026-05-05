import styles from './PieChart.module.css';

export default function PieChart({ categories, colorMap }) {
  const total = categories.reduce((sum, c) => sum + c.total, 0);
  if (total === 0) return null;

  const vb = 600;
  const cx = vb / 2;
  const cy = vb / 2;
  const r = 110;
  const ir = Math.round(r * 0.55);
  const labelR = r + 48;

  const sorted = [...categories].sort((a, b) => b.total - a.total);

  let cumAngle = -Math.PI / 2;
  const slices = sorted.map(cat => {
    const fraction = cat.total / total;
    const angle = fraction * 2 * Math.PI;
    const start = cumAngle;
    cumAngle += angle;
    const end = cumAngle;
    const mid = start + angle / 2;

    const ox1 = cx + r * Math.cos(start);
    const oy1 = cy + r * Math.sin(start);
    const ox2 = cx + r * Math.cos(end);
    const oy2 = cy + r * Math.sin(end);
    const ix1 = cx + ir * Math.cos(start);
    const iy1 = cy + ir * Math.sin(start);
    const ix2 = cx + ir * Math.cos(end);
    const iy2 = cy + ir * Math.sin(end);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${ox1} ${oy1} A ${r} ${r} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;

    const lx = cx + labelR * Math.cos(mid);
    const ly = cy + labelR * Math.sin(mid);
    const cosM = Math.cos(mid);
    const sinM = Math.sin(mid);
    const anchor = cosM > 0.15 ? 'start' : cosM < -0.15 ? 'end' : 'middle';

    const lineX1 = cx + (r + 5) * cosM;
    const lineY1 = cy + (r + 5) * sinM;
    const lineX2 = cx + (labelR - 12) * cosM;
    const lineY2 = cy + (labelR - 12) * sinM;

    // For labels near the top (anchor="middle", sinM<0), the line approaches from
    // below and the text also extends downward — anchor text bottom to the line
    // endpoint so there's no gap between line and label.
    const textTopY = anchor === 'middle' && sinM < 0 ? lineY2 - 32 : ly;

    return {
      path, color: colorMap[cat.name], name: cat.name, fraction,
      catTotal: cat.total, lx, ly: textTopY, anchor,
      lineX1, lineY1, lineX2, lineY2,
    };
  });

  return (
    <div className={styles.chartWrap}>
      <svg width="100%" viewBox={`0 105 ${vb} 400`}>
        {slices.map(s => (
          <path key={s.name} d={s.path} fill={s.color} stroke="#fff" strokeWidth={1.5} />
        ))}
        {slices.map(s => (
          <g key={`label-${s.name}`}>
            <line x1={s.lineX1} y1={s.lineY1} x2={s.lineX2} y2={s.lineY2} stroke="#bbb" strokeWidth={1} />
            <text textAnchor={s.anchor} fontFamily="sans-serif">
              <tspan x={s.lx} y={s.ly} fontSize="13" fontWeight="600" fill="#333">{s.name}</tspan>
              <tspan x={s.lx} dy="17" fontSize="12" fill="#444">${s.catTotal.toFixed(2)}</tspan>
              <tspan x={s.lx} dy="15" fontSize="11" fill="#777">{(s.fraction * 100).toFixed(1)}%</tspan>
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
