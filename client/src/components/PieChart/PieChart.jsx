import { useState } from 'react';
import { formatDollar } from '../../utils/format';
import styles from './PieChart.module.css';

const PAD = 4;
const VIEW_TOP = 105;    // top of the SVG viewBox
const MIN_LABEL_Y = VIEW_TOP + 13 + PAD; // minimum baseline: cap height + padding below viewBox top

// Estimates the bounding box of a label in SVG viewBox units given its current position.
function getLabelBox(s, dx, dy) {
  const x = s.lx + dx;
  const y = s.ly + dy;
  const amountStr = formatDollar(s.catTotal);
  const pctStr = `${(s.fraction * 100).toFixed(1)}%`;
  const w = Math.max(
    s.name.length * 13 * 0.55,
    amountStr.length * 12 * 0.55,
    pctStr.length * 11 * 0.55,
  );
  let left, right;
  if (s.anchor === 'start')       { left = x;       right = x + w; }
  else if (s.anchor === 'end')    { left = x - w;   right = x;     }
  else                            { left = x - w/2; right = x + w/2; }
  return { left: left - PAD, right: right + PAD, top: y - 13 - PAD, bottom: y + 36 + PAD };
}

// Iteratively nudges overlapping labels apart along the vector between their centers, returning a {dx, dy} offset per slice.
function resolveOverlaps(slices) {
  const offsets = slices.map(() => ({ dx: 0, dy: 0 }));

  for (let pass = 0; pass < 20; pass++) {
    let changed = false;
    for (let i = 0; i < slices.length; i++) {
      for (let j = i + 1; j < slices.length; j++) {
        const a = getLabelBox(slices[i], offsets[i].dx, offsets[i].dy);
        const b = getLabelBox(slices[j], offsets[j].dx, offsets[j].dy);
        const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (xOverlap <= 0 || yOverlap <= 0) continue;
        changed = true;

        const aCx = (a.left + a.right) / 2;
        const aCy = (a.top + a.bottom) / 2;
        const bCx = (b.left + b.right) / 2;
        const bCy = (b.top + b.bottom) / 2;
        const dvx = bCx - aCx;
        const dvy = bCy - aCy;
        const len = Math.sqrt(dvx * dvx + dvy * dvy);

        // Fall back to horizontal push if centers are coincident
        if (len < 0.001) {
          offsets[i].dx -= xOverlap / 2;
          offsets[j].dx += xOverlap / 2;
          continue;
        }

        const nx = dvx / len;
        const ny = dvy / len;
        const shift = Math.min(xOverlap, yOverlap) / 2;
        offsets[i].dx -= nx * shift;
        offsets[i].dy -= ny * shift;
        offsets[j].dx += nx * shift;
        offsets[j].dy += ny * shift;
      }
    }
    if (!changed) break;
  }

  // Clamp labels to stay within the viewBox so they never bleed into elements above the SVG.
  for (let i = 0; i < slices.length; i++) {
    const currentY = slices[i].ly + offsets[i].dy;
    if (currentY < MIN_LABEL_Y) offsets[i].dy = MIN_LABEL_Y - slices[i].ly;
  }

  return offsets;
}

export default function PieChart({ categories, colorMap, onSliceHover }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const total = categories.reduce((sum, c) => sum + c.total, 0);
  if (total === 0) return null;

  function handleMouseEnter(name) {
    setHoveredSlice(name);
    onSliceHover?.(name);
  }

  function handleMouseLeave() {
    setHoveredSlice(null);
    onSliceHover?.(null);
  }

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

  // SVG arc paths can't represent a full 360° arc (start === end point), so
  // render a single-slice chart as two concentric circles instead.
  if (slices.length === 1) {
    const s = slices[0];
    return (
      <div className={styles.chartWrap}>
        <svg width="100%" viewBox={`0 105 ${vb} 400`}>
          <circle
            cx={cx} cy={cy} r={r} fill={s.color}
            style={{ cursor: onSliceHover ? 'pointer' : 'default' }}
            onMouseEnter={() => handleMouseEnter(s.name)}
            onMouseLeave={handleMouseLeave}
          />
          <circle cx={cx} cy={cy} r={ir} fill="#fff" />
          <line x1={s.lineX1} y1={s.lineY1} x2={s.lineX2} y2={s.lineY2} stroke="#bbb" strokeWidth={1} />
          <text textAnchor={s.anchor} fontFamily="sans-serif">
            <tspan x={s.lx} y={s.ly} fontSize="13" fontWeight="600" fill="#333">{s.name}</tspan>
            <tspan x={s.lx} dy="17" fontSize="12" fill="#444">{formatDollar(s.catTotal)}</tspan>
            <tspan x={s.lx} dy="15" fontSize="11" fill="#777">100%</tspan>
          </text>
        </svg>
      </div>
    );
  }

  const offsets = resolveOverlaps(slices);

  return (
    <div className={styles.chartWrap}>
      <svg width="100%" viewBox={`0 105 ${vb} 400`}>
        {slices.map(s => (
          <path
            key={s.name}
            d={s.path}
            fill={s.color}
            stroke="#fff"
            strokeWidth={1.5}
            opacity={hoveredSlice && hoveredSlice !== s.name ? 0.35 : 1}
            style={{ cursor: onSliceHover ? 'pointer' : 'default', transition: 'opacity 0.15s' }}
            onMouseEnter={() => handleMouseEnter(s.name)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
        {slices.map((s, i) => {
          const { dx, dy } = offsets[i];
          return (
            <g key={`label-${s.name}`}>
              <line
                x1={s.lineX1} y1={s.lineY1}
                x2={s.lineX2 + dx} y2={s.lineY2 + dy}
                stroke="#bbb" strokeWidth={1}
              />
              <text textAnchor={s.anchor} fontFamily="sans-serif">
                <tspan x={s.lx + dx} y={s.ly + dy} fontSize="13" fontWeight="600" fill="#333">{s.name}</tspan>
                <tspan x={s.lx + dx} dy="17" fontSize="12" fill="#444">{formatDollar(s.catTotal)}</tspan>
                <tspan x={s.lx + dx} dy="15" fontSize="11" fill="#777">{(s.fraction * 100).toFixed(1)}%</tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
