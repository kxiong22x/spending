import { useState } from 'react';
import { parseCSV } from '../../utils/csv';
import { API, CURRENT_YEAR } from '../../constants/constants';
import MonthPicker from '../MonthPicker/MonthPicker';
import CsvDropzone from '../CsvDropzone/CsvDropzone';
import UploadErrors from '../UploadErrors/UploadErrors';
import styles from './NewMonthForm.module.css';

export default function NewMonthForm({ onSuccess }) {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear]   = useState(String(CURRENT_YEAR));
  const [files, setFiles] = useState([]); // array of File objects
  const [status, setStatus] = useState(null); // null | 'loading' | { results }

  function handleFilesAdded(incoming) {
    const csvs = Array.from(incoming).filter(
      f => f.name.toLowerCase().endsWith('.csv') || f.type === 'text/csv'
    );
    // Deduplicate by filename
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...csvs.filter(f => !existing.has(f.name))];
    });
  }

  function handleFileRemoved(name) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  async function handleCreate() {
    if (files.length === 0) return;
    setStatus('loading');

    const yearMonth = `${year}-${month}`;
    const fileResults = [];
    const allRows = [];
    let totalParseErrors = 0;

    // Parse all files client-side first, collecting per-file errors
    for (const file of files) {
      let text;
      try {
        text = await file.text();
      } catch {
        fileResults.push({ file: file.name, error: 'Could not read file.' });
        continue;
      }

      const { rows: parsed, parseErrors, error: parseError } = parseCSV(text);
      if (parseError) { fileResults.push({ file: file.name, error: parseError }); continue; }
      const rows = parsed.filter(r => r.date.startsWith(yearMonth));
      if (rows.length === 0) { fileResults.push({ file: file.name, error: `No transactions found for ${yearMonth} in the uploaded files.` }); continue; }

      allRows.push(...rows);
      totalParseErrors += parseErrors;
    }

    if (fileResults.some(r => r.error)) {
      setStatus({ results: fileResults, yearMonth });
      return;
    }

    if (allRows.length === 0) {
      setStatus({ results: [{ file: '—', error: `No transactions found for ${yearMonth} in the uploaded files.` }], yearMonth });
      return;
    }

    // Send all rows in a single request
    try {
      const res = await fetch(`${API}/transactions/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: yearMonth, rows: allRows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ results: [{ file: '—', error: data.error || 'Upload failed.' }], yearMonth });
        return;
      }
      const results = [{ file: files.map(f => f.name).join(', '), ...data, parseErrors: totalParseErrors }];
      setStatus({ results, yearMonth });
      onSuccess(yearMonth);
    } catch {
      setStatus({ results: [{ file: '—', error: 'Upload failed. Is the server running?' }], yearMonth });
    }
  }

  const canCreate = files.length > 0 && status !== 'loading';

  return (
    <div className={styles.container}>
      <MonthPicker
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />

      <CsvDropzone
        files={files}
        onFilesAdded={handleFilesAdded}
        onFileRemoved={handleFileRemoved}
      />

      {status && status !== 'loading' && (
        <UploadErrors results={status.results} />
      )}

      <button onClick={handleCreate} disabled={!canCreate} className={styles.createBtn}>
        {status === 'loading' ? 'Creating…' : 'Create'}
      </button>
    </div>
  );
}
