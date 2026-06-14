import { useState, useEffect } from 'react';
import { API } from '../constants/constants';
import { formatMonth } from '../utils/format';
import { CardRows } from '@shared/types';

// Uploads parsed card rows for a month to the server; throws on failure.
export async function uploadMonth(yearMonth: string, cardRows: CardRows[]): Promise<{ inserted: number; skipped: number }> {
  const res = await fetch(`${API}/transactions/upload`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: yearMonth, cardRows }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed.');
  return data as { inserted: number; skipped: number };
}

export default function useMonths(): {
  months: string[];
  deleteMonth: (m: string) => Promise<void>;
} {
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API}/months`, { credentials: 'include' })
      .then(res => res.json())
      .then((data: string[]) => setMonths(data))
      .catch(() => setMonths([]));
  }, []);

  async function deleteMonth(m: string): Promise<void> {
    if (!window.confirm(`Delete ${formatMonth(m)}? All transactions for this month will be permanently deleted.`)) return;

    const prev = months;
    setMonths(months.filter(x => x !== m));

    try {
      const res = await fetch(`${API}/months/${m}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error();
    } catch {
      setMonths(prev);
    }
  }

  return { months, deleteMonth };
}
