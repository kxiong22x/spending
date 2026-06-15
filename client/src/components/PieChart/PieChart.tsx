import { formatDollar, formatPercent } from '../../utils/format';
import { computeSlices } from '../../utils/pieChart';
import { useSliceHover } from '../../hooks/useSliceHover';
import styles from './PieChart.module.css';

const CX = 300;
const CY = 300;
const OUTER_R = 110;
const INNER_R = Math.round(OUTER_R * 0.55);
const VIEW_BOX = `${CX - OUTER_R} ${CY - OUTER_R} ${2 * OUTER_R} ${2 * OUTER_R}`;

interface PieChartProps {
  title?: string;
  categories: Array<{ name: string; total: number }>;
  colorMap: Record<string, string>;
  onSliceHover?: (name: string | null) => void;
  onSliceClick?: (name: string) => void;
  lockedSlice?: string | null;
}

export default function PieChart({ title, categories, colorMap, onSliceHover, onSliceClick, lockedSlice }: PieChartProps) {
  const { handleMouseEnter, handleMouseLeave, handleClick, sliceOpacity } = useSliceHover(onSliceHover, onSliceClick, lockedSlice);
  const total = categories.reduce((sum, c) => sum + c.total, 0);
  if (total === 0) return null;

  const slices = computeSlices(categories, total, CX, CY, OUTER_R, INNER_R).map(s => ({
    ...s,
    color: colorMap[s.name],
  }));

  const cursorStyle: React.CSSProperties = { cursor: onSliceHover ? 'pointer' : 'default' };

  const pie = (
    // SVG arc paths can't represent a full 360° arc, so render a single-slice chart as two concentric circles.
    slices.length === 1 ? (
      <svg width="100%" viewBox={VIEW_BOX}>
        <circle
          cx={CX} cy={CY} r={OUTER_R} fill={slices[0].color}
          style={cursorStyle}
          onMouseEnter={() => handleMouseEnter(slices[0].name)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(slices[0].name)}
        />
        <circle cx={CX} cy={CY} r={INNER_R} fill="#fff" />
      </svg>
    ) : (
      <svg width="100%" viewBox={VIEW_BOX}>
        {slices.map(s => (
          <path
            key={s.name}
            d={s.path}
            fill={s.color}
            stroke="#fff"
            strokeWidth={1.5}
            opacity={sliceOpacity(s.name)}
            style={{ ...cursorStyle, transition: 'opacity 0.15s' }}
            onMouseEnter={() => handleMouseEnter(s.name)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(s.name)}
          />
        ))}
      </svg>
    )
  );

  const legend = (
    <div className={styles.legend}>
      {slices.map(s => (
        <div
          key={s.name}
          className={styles.legendRow}
          style={{ opacity: sliceOpacity(s.name), transition: 'opacity 0.15s' }}
          onMouseEnter={() => handleMouseEnter(s.name)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(s.name)}
        >
          <span className={styles.swatch} style={{ background: s.color }} />
          <span className={styles.legendName}>{s.name}</span>
          <span className={styles.legendAmount}>{formatDollar(s.catTotal)}</span>
          <span className={styles.legendPct}>{formatPercent(s.fraction)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.chartWrap}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <div className={styles.pieAndLegend}>
        <div className={styles.pieWrap}>{pie}</div>
        {legend}
      </div>
    </div>
  );
}
