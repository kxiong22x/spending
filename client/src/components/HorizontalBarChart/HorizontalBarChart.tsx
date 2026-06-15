import { useMemo } from 'react';
import { formatDollar, formatPercent } from '../../utils/format';
import { useSliceHover } from '../../hooks/useSliceHover';
import styles from './HorizontalBarChart.module.css';

interface HorizontalBarChartProps {
  title?: string;
  categories: Array<{ name: string; total: number }>;
  colorMap: Record<string, string>;
  onSliceHover?: (name: string | null) => void;
  onSliceClick?: (name: string) => void;
  lockedSlice?: string | null;
}

export default function HorizontalBarChart({ title, categories, colorMap, onSliceHover, onSliceClick, lockedSlice }: HorizontalBarChartProps) {
  const { handleMouseEnter, handleMouseLeave, handleClick, sliceOpacity } = useSliceHover(onSliceHover, onSliceClick, lockedSlice);

  const total = categories.reduce((sum, c) => sum + c.total, 0);
  if (total === 0) return null;

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  return (
    <div className={styles.wrap}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <div className={styles.rows}>
        {sorted.map(cat => {
          const fraction = cat.total / total;
          return (
            <div
              key={cat.name}
              className={styles.row}
              style={{ opacity: sliceOpacity(cat.name), transition: 'opacity 0.15s', cursor: onSliceHover ? 'pointer' : 'default' }}
              onMouseEnter={() => handleMouseEnter(cat.name)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(cat.name)}
            >
              <div className={styles.rowTop}>
                <span className={styles.name}>{cat.name}</span>
                <span className={styles.meta}>
                  <span className={styles.amt}>{formatDollar(cat.total)}</span>
                  <span className={styles.pct}>{formatPercent(fraction)}</span>
                </span>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${fraction * 100}%`, background: colorMap[cat.name] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
