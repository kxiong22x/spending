import { useNavigate } from 'react-router-dom';
import { formatMonth } from '../../utils/format';
import styles from './MonthList.module.css';

export default function MonthList({ months, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className={styles.monthList}>
      {months.map(m => (
        <div key={m} className={styles.monthRow} onClick={() => navigate(`/month/${m}`)}>
          <span className={styles.monthLabel}>{formatMonth(m)}</span>
          <button onClick={e => onDelete(e, m)} className={styles.deleteBtn} title="Delete month" aria-label={`Delete ${formatMonth(m)}`}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
