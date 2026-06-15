import styles from './AnimatedEllipsis.module.css';

// Three sequentially pulsing dots to indicate loading progress
export default function AnimatedEllipsis() {
  return (
    <>
      <span className={styles.dot}>.</span>
      <span className={styles.dot}>.</span>
      <span className={styles.dot}>.</span>
    </>
  );
}
