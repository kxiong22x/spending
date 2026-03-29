import styles from './UploadErrors.module.css';

export default function UploadErrors({ results }) {
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
