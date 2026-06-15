import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { formatMonth } from '../utils/format';
import { CardRows } from '@shared/types';

// Uploads parsed card rows for a month to the server; throws on failure.
export async function uploadMonth(yearMonth: string, cardRows: CardRows[]): Promise<{ inserted: number; skipped: number }> {
  return apiFetch('/transactions/upload', {
    method: 'POST',
    body: JSON.stringify({ month: yearMonth, cardRows }),
  });
}

export interface MonthSummary {
  month: string;
  total: number;
}

export default function useMonths(): {
  months: MonthSummary[];
  deleteMonth: (yearMonth: string) => Promise<void>;
} {
  const [months, setMonths] = useState<MonthSummary[]>([]);

  useEffect(() => {
    apiFetch<MonthSummary[]>('/months')
      .then(setMonths)
      .catch(() => setMonths([]));
  }, []);

  async function deleteMonth(yearMonth: string): Promise<void> {
    if (!window.confirm(`Delete ${formatMonth(yearMonth)}? All transactions for this month will be permanently deleted.`)) return;

    const prev = months;
    setMonths(months.filter(x => x.month !== yearMonth));

    try {
      await apiFetch(`/months/${yearMonth}`, { method: 'DELETE' });
    } catch {
      setMonths(prev);
    }
  }

  return { months, deleteMonth };
}
