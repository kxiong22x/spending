import { useState, useEffect } from 'react';
import { API } from '../constants/constants';
import { formatMonth } from '../utils/format';

export default function useMonths() {
  const [months, setMonths] = useState([]);

  useEffect(() => {
    fetch(`${API}/months`, { credentials: 'include' })
      .then(res => res.json())
      .then(setMonths)
      .catch(() => setMonths([]));
  }, []);

  async function deleteMonth(m) {
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
