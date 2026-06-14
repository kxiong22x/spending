import { useNavigate } from 'react-router-dom';
import { formatMonth } from '../../utils/format';
import styles from './MonthList.module.css';

interface MonthListProps {
  months: string[];
  onDelete: (e: React.MouseEvent, m: string) => void;
}

export default function MonthList({ months, onDelete }: MonthListProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.monthList}>
      {months.map(m => {
        const label = formatMonth(m);
        return (
          <div key={m} className={styles.monthRow} onClick={() => navigate(`/month/${m}`)}>
            <span className={styles.monthLabel}>{label}</span>
            <button onClick={e => onDelete(e, m)} className={styles.deleteBtn} title="Delete month" aria-label={`Delete ${label}`}>
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
