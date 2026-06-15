import { useNavigate } from 'react-router-dom';
import { formatMonth, formatDollar } from '../../utils/format';
import { MonthSummary } from '../../hooks/useMonths';
import styles from './MonthList.module.css';

interface MonthListProps {
  months: MonthSummary[];
  onDelete: (e: React.MouseEvent, m: string) => void;
}

export default function MonthList({ months, onDelete }: MonthListProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.monthList}>
      {months.map(({ month, total }) => {
        const label = formatMonth(month);
        return (
          <div key={month} className={styles.monthRow} onClick={() => navigate(`/month/${month}`)}>
            <span className={styles.monthLabel}>{label}</span>
            <span className={styles.monthTotal}>Total: {formatDollar(total)}</span>
            <button onClick={e => onDelete(e, month)} className={styles.deleteBtn} title="Delete month" aria-label={`Delete ${label}`}>
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
