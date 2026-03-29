import styles from './CategoryColumn.module.css';

export default function CategoryColumn({ cat, color, isDragOver, isCustom, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onDeleteCategory, onDeleteTransaction }) {
  return (
    <div
      className={`${styles.categoryCol} ${isDragOver ? styles.categoryColOver : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={styles.catHeader}>
        <span className={styles.catSwatch} style={{ backgroundColor: color }} />
        <span className={styles.catName}>{cat.name}</span>
        {cat.total > 0 && <span className={styles.catTotal}>${cat.total.toFixed(2)}</span>}
        {isCustom && (
          <button
            onClick={onDeleteCategory}
            className={styles.catDeleteBtn}
            title="Delete category"
            aria-label={`Delete ${cat.name} category`}
          >✕</button>
        )}
      </div>
      {cat.txs.map(tx => (
        <div
          key={tx.id}
          draggable
          onDragStart={() => onDragStart(tx)}
          onDragEnd={onDragEnd}
          className={styles.txRow}
        >
          <div className={styles.txTopRow}>
            <span className={styles.txDate}>{tx.date}</span>
            <span className={styles.txAmt}>${tx.amount.toFixed(2)}</span>
            {tx.source === 'manual' && (
              <button
                onClick={() => onDeleteTransaction(tx.id)}
                className={styles.txDeleteBtn}
                title="Delete transaction"
                aria-label="Delete transaction"
              >✕</button>
            )}
          </div>
          <span className={styles.txDesc}>{tx.description || '—'}</span>
        </div>
      ))}
    </div>
  );
}
