import { useState } from 'react';
import { parseCSV } from '../../utils/csv';
import { API, CURRENT_YEAR } from '../../constants/constants';
import { useCards } from '../../hooks/useCards';
import MonthPicker from '../MonthPicker/MonthPicker';
import CsvDropzone from '../CsvDropzone/CsvDropzone';
import UploadErrors from '../UploadErrors/UploadErrors';
import styles from './NewMonthForm.module.css';

export default function NewMonthForm({ onSuccess }) {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear]   = useState(String(CURRENT_YEAR));
  // cardFiles maps cardId (number) -> File[]
  const [cardFiles, setCardFiles] = useState({});
  const [status, setStatus] = useState(null); // null | 'loading' | { results }
  const [missingCards, setMissingCards] = useState([]); // card names missing a CSV
  const { cards, loading: cardsLoading } = useCards();

  function handleFilesAdded(cardId, incoming) {
    const csvs = Array.from(incoming).filter(
      f => f.name.toLowerCase().endsWith('.csv') || f.type === 'text/csv'
    );
    setCardFiles(prev => {
      const existing = new Set((prev[cardId] ?? []).map(f => f.name));
      return { ...prev, [cardId]: [...(prev[cardId] ?? []), ...csvs.filter(f => !existing.has(f.name))] };
    });
  }

  function handleFileRemoved(cardId, name) {
    setCardFiles(prev => ({ ...prev, [cardId]: (prev[cardId] ?? []).filter(f => f.name !== name) }));
  }

  async function handleCreate(force = false) {
    setStatus('loading');
    setMissingCards([]);

    const yearMonth = `${year}-${month}`;

    // Check for cards with no files uploaded
    if (!force) {
      const missing = cards.filter(c => !cardFiles[c.id] || cardFiles[c.id].length === 0);
      if (missing.length > 0) {
        setMissingCards(missing.map(c => c.name));
        setStatus(null);
        return;
      }
    }

    const fileResults = [];
    const cardRows = [];
    let totalParseErrors = 0;

    // Parse files for each card
    for (const card of cards) {
      const files = cardFiles[card.id] ?? [];
      if (files.length === 0) continue;

      const cardRowsForCard = [];
      let cardHasError = false;

      for (const file of files) {
        let text;
        try {
          text = await file.text();
        } catch {
          fileResults.push({ file: file.name, error: 'Could not read file.' });
          cardHasError = true;
          break;
        }

        const { rows: parsed, parseErrors, error: parseError } = parseCSV(text);
        if (parseError) {
          fileResults.push({ file: file.name, error: parseError });
          cardHasError = true;
          break;
        }

        const rows = parsed.filter(r => r.date.startsWith(yearMonth));
        if (rows.length === 0) {
          fileResults.push({ file: file.name, error: `No transactions found for ${yearMonth} in ${file.name}.` });
          cardHasError = true;
          break;
        }

        cardRowsForCard.push(...rows);
        totalParseErrors += parseErrors;
      }

      if (cardHasError) continue;
      if (cardRowsForCard.length > 0) {
        cardRows.push({ cardId: card.id, rows: cardRowsForCard });
      }
    }

    if (fileResults.some(r => r.error)) {
      setStatus({ results: fileResults, yearMonth });
      return;
    }

    if (cardRows.length === 0) {
      setStatus({ results: [{ file: '—', error: `No transactions found for ${yearMonth} in the uploaded files.` }], yearMonth });
      return;
    }

    try {
      const res = await fetch(`${API}/transactions/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: yearMonth, cardRows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ results: [{ file: '—', error: data.error || 'Upload failed.' }], yearMonth });
        return;
      }
      const allFileNames = cards.flatMap(c => (cardFiles[c.id] ?? []).map(f => f.name)).join(', ');
      const results = [{ file: allFileNames, ...data, parseErrors: totalParseErrors }];
      setStatus({ results, yearMonth });
      onSuccess(yearMonth);
    } catch {
      setStatus({ results: [{ file: '—', error: 'Upload failed. Is the server running?' }], yearMonth });
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
        <p className={styles.noCards}>No cards registered. <a href="/spending/cards">Add a card</a> before creating a month.</p>
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
