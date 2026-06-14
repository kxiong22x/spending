import { useState } from 'react';
import { Link } from 'react-router-dom';
import { parseFilesForCards } from '../../utils/csv';
import { uploadMonth } from '../../hooks/useMonths';
import { CURRENT_YEAR, CURRENT_MONTH } from '../../constants/constants';
import { useCards } from '../../hooks/useCards';
import MonthPicker from '../MonthPicker/MonthPicker';
import CsvDropzone from '../CsvDropzone/CsvDropzone';
import UploadErrors from '../UploadErrors/UploadErrors';
import styles from './NewMonthForm.module.css';

interface FileResult {
  file: string;
  error?: string;
  inserted?: number;
  skipped?: number;
  parseErrors?: number;
}

interface UploadStatusResult {
  results: FileResult[];
  yearMonth: string;
}

type UploadStatus = null | 'loading' | UploadStatusResult;

interface NewMonthFormProps {
  onSuccess: (yearMonth: string) => void;
}

export default function NewMonthForm({ onSuccess }: NewMonthFormProps) {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear]   = useState(String(CURRENT_YEAR));
  // cardFiles maps cardId (number) -> File[]
  const [cardFiles, setCardFiles] = useState<Record<number, File[]>>({});
  const [status, setStatus] = useState<UploadStatus>(null);
  const [missingCards, setMissingCards] = useState<string[]>([]);
  const { cards, loading: cardsLoading } = useCards();

  function handleFilesAdded(cardId: number, incoming: FileList): void {
    const csvs = Array.from(incoming).filter(
      f => f.name.toLowerCase().endsWith('.csv') || f.type === 'text/csv'
    );
    setCardFiles(prev => {
      const existing = new Set((prev[cardId] ?? []).map(f => f.name));
      return { ...prev, [cardId]: [...(prev[cardId] ?? []), ...csvs.filter(f => !existing.has(f.name))] };
    });
  }

  function handleFileRemoved(cardId: number, name: string): void {
    setCardFiles(prev => ({ ...prev, [cardId]: (prev[cardId] ?? []).filter(f => f.name !== name) }));
  }

  async function handleCreate(force = false): Promise<void> {
    setStatus('loading');
    setMissingCards([]);

    const yearMonth = `${year}-${month}`;

    if (!force) {
      const missing = cards.filter(c => !cardFiles[c.id] || cardFiles[c.id].length === 0);
      if (missing.length > 0) {
        setMissingCards(missing.map(c => c.name));
        setStatus(null);
        return;
      }
    }

    const { fileResults, cardRows, totalParseErrors } = await parseFilesForCards(cards, cardFiles, yearMonth);

    if (fileResults.some(r => r.error)) {
      setStatus({ results: fileResults, yearMonth });
      return;
    }

    if (cardRows.length === 0) {
      setStatus({ results: [{ file: '—', error: `No transactions found for ${yearMonth} in the uploaded files.` }], yearMonth });
      return;
    }

    try {
      const data = await uploadMonth(yearMonth, cardRows);
      const allFileNames = cards.flatMap(c => (cardFiles[c.id] ?? []).map(f => f.name)).join(', ');
      setStatus({ results: [{ file: allFileNames, ...data, parseErrors: totalParseErrors }], yearMonth });
      onSuccess(yearMonth);
    } catch (err) {
      setStatus({ results: [{ file: '—', error: (err as Error).message || 'Upload failed. Is the server running?' }], yearMonth });
    }
  }

  const hasAnyFiles = cards.some(c => cardFiles[c.id]?.length > 0);
  const canCreate = hasAnyFiles && status !== 'loading';

  return (
    <div className={styles.container}>
      <MonthPicker
        month={month}
        year={year}
        onMonthChange={m => { setMonth(m); setMissingCards([]); }}
        onYearChange={y => { setYear(y); setMissingCards([]); }}
      />

      <p className={styles.hint}>Only transactions within the selected month will be imported. Transactions from other months will be ignored.</p>

      {cardsLoading ? (
        <p>Loading cards…</p>
      ) : cards.length === 0 ? (
        <p className={styles.noCards}>No cards registered. <Link to="/cards">Add a card</Link> before creating a month.</p>
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

      {missingCards.length > 0 && (
        <div className={styles.warning}>
          <p>No CSV uploaded for: <strong>{missingCards.join(', ')}</strong>. Create anyway?</p>
          <button onClick={() => handleCreate(true)} className={styles.createBtn}>
            Create anyway
          </button>
        </div>
      )}

      {status && status !== 'loading' && (
        <UploadErrors results={status.results} />
      )}

      {missingCards.length === 0 && (
        <button onClick={() => handleCreate(false)} disabled={!canCreate} className={styles.createBtn}>
          {status === 'loading' ? 'Creating…' : 'Create'}
        </button>
      )}
    </div>
  );
}
