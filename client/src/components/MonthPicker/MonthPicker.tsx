import { MONTHS, YEARS } from '../../constants/constants';
import styles from './MonthPicker.module.css';

interface MonthPickerProps {
  month: string;
  year: string;
  onMonthChange: (m: string) => void;
  onYearChange: (y: string) => void;
}

export default function MonthPicker({ month, year, onMonthChange, onYearChange }: MonthPickerProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Select Month</h2>
      <div className={styles.dropdowns}>
        <select value={month} onChange={e => onMonthChange(e.target.value)} className={styles.select}>
          {MONTHS.map((name, i) => (
            <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>
          ))}
        </select>
        <select value={year} onChange={e => onYearChange(e.target.value)} className={styles.select}>
          {YEARS.map(y => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>
    </section>
  );
}
