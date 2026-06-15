import { FileResult } from '../../utils/csv';
import styles from './UploadErrors.module.css';

interface UploadErrorsProps {
  results: FileResult[];
}

export default function UploadErrors({ results }: UploadErrorsProps) {
  const errors = results.filter(r => r.error);
  if (errors.length === 0) return null;

  return (
    <div className={styles.errorBox}>
      {errors.map(r => (
        <p key={r.file} className={styles.errorText}>{r.file}: {r.error}</p>
      ))}
    </div>
  );
}
