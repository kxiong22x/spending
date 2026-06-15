import { useState } from 'react';
import { Link } from 'react-router-dom';
import { parseFilesForCards, FileResult } from '../../utils/csv';
import { uploadMonth } from '../../hooks/useMonths';
import { CURRENT_YEAR, CURRENT_MONTH } from '../../constants/constants';
import { useCards } from '../../hooks/useCards';
import { useCardFiles } from '../../hooks/useCardFiles';
import MonthPicker from '../MonthPicker/MonthPicker';
import CardFileDropzones from '../CardFileDropzones/CardFileDropzones';
import UploadErrors from '../UploadErrors/UploadErrors';
import styles from './NewMonthForm.module.css';
import AnimatedEllipsis from '../AnimatedEllipsis/AnimatedEllipsis';

interface UploadFileResult extends FileResult {
  inserted?: number;
  skipped?: number;
  parseErrors?: number;
}

interface UploadStatusResult {
  results: UploadFileResult[];
  yearMonth: string;
}

type UploadStatus = null | 'loading' | UploadStatusResult;

interface NewMonthFormProps {
  onSuccess: (yearMonth: string) => void;
}

export default function NewMonthForm({ onSuccess }: NewMonthFormProps) {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear]   = useState(String(CURRENT_YEAR));
  const [status, setStatus] = useState<UploadStatus>(null);
  const [missingCards, setMissingCards] = useState<string[]>([]);
  const { cards, loading: cardsLoading } = useCards();
  const { cardFiles, handleFilesAdded, handleFileRemoved } = useCardFiles();

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
      setStatus({ results: [{ file: allFileNames, ...data, parseErrors: totalParseErrors } as UploadFileResult], yearMonth });
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

      <CardFileDropzones
        cards={cards}
        loading={cardsLoading}
        cardFiles={cardFiles}
        onFilesAdded={handleFilesAdded}
        onFileRemoved={handleFileRemoved}
        noCardsMessage={<><Link to="/cards">Add a card</Link> before importing data.</>}
      />

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

      {missingCards.length === 0 && cards.length > 0 && (
        <button onClick={() => handleCreate(false)} disabled={!canCreate} className={styles.createBtn}>
          {status === 'loading' ? <>Creating<AnimatedEllipsis /></> : 'Create'}
        </button>
      )}
    </div>
  );
}
