import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useMonths, { uploadMonth } from '../../hooks/useMonths';
import { useCards } from '../../hooks/useCards';
import { useCardFiles } from '../../hooks/useCardFiles';
import useParsedMonths from '../../hooks/useParsedMonths';
import { formatMonth } from '../../utils/format';
import CardFileDropzones from '../CardFileDropzones/CardFileDropzones';
import UploadErrors from '../UploadErrors/UploadErrors';
import styles from './BulkImportForm.module.css';
import AnimatedEllipsis from '../AnimatedEllipsis/AnimatedEllipsis';

type MonthStatus = 'pending' | 'importing' | 'done' | 'skipped' | { error: string };

interface BulkImportFormProps {
  onSuccess: () => void;
}

export default function BulkImportForm({ onSuccess }: BulkImportFormProps) {
  const [importStatus, setImportStatus] = useState<Map<string, MonthStatus>>(new Map());
  const [importing, setImporting] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const { cards, loading: cardsLoading } = useCards();
  const { months } = useMonths();
  const { cardFiles, handleFilesAdded, handleFileRemoved } = useCardFiles();
  const parsed = useParsedMonths(cards, cardFiles);
  const existingMonths = useMemo(() => new Set(months.map(m => m.month)), [months]);

  async function handleImport(): Promise<void> {
    if (!parsed || importing) return;
    setImporting(true);
    setRateLimited(false);

    setImportStatus(new Map(sortedMonths.map(m => [m, 'pending'])));

    for (const yearMonth of sortedMonths) {
      if (existingMonths.has(yearMonth)) {
        setImportStatus(prev => new Map(prev).set(yearMonth, 'skipped'));
        continue;
      }
      setImportStatus(prev => new Map(prev).set(yearMonth, 'importing'));
      try {
        await uploadMonth(yearMonth, parsed.monthMap.get(yearMonth)!);
        setImportStatus(prev => new Map(prev).set(yearMonth, 'done'));
      } catch (err) {
        const msg = (err as Error).message || 'Upload failed.';
        if (msg.includes('already exists')) {
          setImportStatus(prev => new Map(prev).set(yearMonth, 'skipped'));
        } else if (msg.includes('Upload limit reached')) {
          setRateLimited(true);
          setImportStatus(prev => new Map(prev).set(yearMonth, { error: 'Rate limit reached.' }));
          break;
        } else {
          setImportStatus(prev => new Map(prev).set(yearMonth, { error: msg }));
        }
      }
    }

    setImporting(false);
  }

  const sortedMonths = parsed ? [...parsed.monthMap.keys()].sort() : [];
  const hasDetectedMonths = sortedMonths.length > 0;
  const importStarted = importStatus.size > 0;
  const importDone = importStarted && !importing;

  return (
    <div className={styles.container}>
      <p className={styles.hint}>
        All months found will be imported automatically - months that already exist will be skipped.
      </p>

      <CardFileDropzones
        cards={cards}
        loading={cardsLoading}
        cardFiles={cardFiles}
        onFilesAdded={handleFilesAdded}
        onFileRemoved={handleFileRemoved}
        disabled={importing}
        noCardsMessage={<><Link to="/cards">Add a card</Link> before importing data.</>}
      />

      {parsed?.fileResults && <UploadErrors results={parsed.fileResults} />}

      {parsed && hasDetectedMonths && (
        <div className={styles.monthPreview}>
          <p className={styles.previewLabel}>Detected months:</p>
          {sortedMonths.map(ym => {
            const status = importStatus.get(ym);
            const willSkip = !importStarted && existingMonths.has(ym);
            return (
              <div key={ym} className={styles.monthRow}>
                <span className={styles.monthName}>{formatMonth(ym)}</span>
                <span className={styles.fileCount}>
                  {parsed.monthFileCounts.get(ym)} {parsed.monthFileCounts.get(ym) === 1 ? 'file' : 'files'}
                </span>
                {!importStarted && willSkip && (
                  <span className={`${styles.badge} ${styles.badgeSkipped}`}>already exists</span>
                )}
                {status === 'pending' && <span className={styles.badge}>Pending</span>}
                {status === 'importing' && <span className={`${styles.badge} ${styles.badgeImporting}`}>Importing<AnimatedEllipsis /></span>}
                {status === 'done' && <span className={`${styles.badge} ${styles.badgeDone}`}>✓ Imported</span>}
                {status === 'skipped' && <span className={`${styles.badge} ${styles.badgeSkipped}`}>Skipped</span>}
                {status && typeof status === 'object' && (
                  <span className={`${styles.badge} ${styles.badgeError}`}>✗ {status.error}</span>
                )}
              </div>
            );
          })}
          {parsed.totalParseErrors > 0 && (
            <p className={styles.parseWarn}>{parsed.totalParseErrors} row(s) skipped due to invalid date or amount.</p>
          )}
        </div>
      )}

      {rateLimited && (
        <p className={styles.rateError}>Rate limit reached. Please wait before retrying.</p>
      )}

      {!importDone && cards.length > 0 && (
        <button
          onClick={handleImport}
          disabled={!hasDetectedMonths || importing}
          className={styles.importBtn}
        >
          {importing ? <>Importing<AnimatedEllipsis /></> : 'Import All'}
        </button>
      )}

      {importDone && (
        <button onClick={onSuccess} className={styles.importBtn}>
          Go to Dashboard
        </button>
      )}
    </div>
  );
}
