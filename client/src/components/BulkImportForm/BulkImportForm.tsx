import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useMonths, { uploadMonth } from '../../hooks/useMonths';
import { useCards } from '../../hooks/useCards';
import useParsedMonths from '../../hooks/useParsedMonths';
import { formatMonth } from '../../utils/format';
import CsvDropzone from '../CsvDropzone/CsvDropzone';
import UploadErrors from '../UploadErrors/UploadErrors';
import styles from './BulkImportForm.module.css';
import AnimatedEllipsis from '../AnimatedEllipsis/AnimatedEllipsis';

type MonthStatus = 'pending' | 'importing' | 'done' | 'skipped' | { error: string };

interface BulkImportFormProps {
  onSuccess: () => void;
}

export default function BulkImportForm({ onSuccess }: BulkImportFormProps) {
  const [cardFiles, setCardFiles] = useState<Record<number, File[]>>({});
  const [importStatus, setImportStatus] = useState<Map<string, MonthStatus>>(new Map());
  const [importing, setImporting] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const { cards, loading: cardsLoading } = useCards();
  const { months } = useMonths();
  const parsed = useParsedMonths(cards, cardFiles);
  const existingMonths = useMemo(() => new Set(months.map(m => m.month)), [months]);

  function handleFilesAdded(cardId: number, incoming: FileList): void {
    if (importing) return;
    const csvs = Array.from(incoming).filter(
      f => f.name.toLowerCase().endsWith('.csv') || f.type === 'text/csv'
    );
    setCardFiles(prev => {
      const existing = new Set((prev[cardId] ?? []).map(f => f.name));
      return { ...prev, [cardId]: [...(prev[cardId] ?? []), ...csvs.filter(f => !existing.has(f.name))] };
    });
  }

  function handleFileRemoved(cardId: number, name: string): void {
    if (importing) return;
    setCardFiles(prev => ({ ...prev, [cardId]: (prev[cardId] ?? []).filter(f => f.name !== name) }));
  }

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

      {cardsLoading ? (
        <p>Loading cards<AnimatedEllipsis /></p>
      ) : cards.length === 0 ? (
        <p className={styles.noCards}>No cards registered. <Link to="/cards">Add a card</Link> before importing.</p>
      ) : (
        <div className={styles.cardRows}>
          {cards.map(card => (
            <div key={card.id} className={styles.cardRow}>
              <span className={styles.cardName}>{card.name}</span>
              <div className={styles.dropzoneWrapper}>
                <CsvDropzone
                  files={cardFiles[card.id] ?? []}
                  onFilesAdded={files => handleFilesAdded(card.id, files)}
                  onFileRemoved={name => handleFileRemoved(card.id, name)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

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
                {status === 'pending' && <span className={styles.badge}>pending</span>}
                {status === 'importing' && <span className={`${styles.badge} ${styles.badgeImporting}`}>importing<AnimatedEllipsis /></span>}
                {status === 'done' && <span className={`${styles.badge} ${styles.badgeDone}`}>✓ imported</span>}
                {status === 'skipped' && <span className={`${styles.badge} ${styles.badgeSkipped}`}>skipped</span>}
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

      {!importDone && (
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
