import { useNavigate } from 'react-router-dom';
import useMonths from '../../hooks/useMonths';
import MonthList from '../../components/MonthList/MonthList';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { months, deleteMonth } = useMonths();
  const navigate = useNavigate();

  function handleDeleteMonth(e: React.MouseEvent, m: string): void {
    e.stopPropagation();
    deleteMonth(m);
  }

  return (
    <main className={styles.main}>
      <div className={styles.actions}>
        <button onClick={() => navigate('/month/new')} className={styles.newBtn}>
          + New Month
        </button>
        <button onClick={() => navigate('/month/bulk')} className={styles.bulkBtn}>
          + Bulk Import
        </button>
      </div>

      <MonthList months={months} onDelete={handleDeleteMonth} />
    </main>
  );
}
