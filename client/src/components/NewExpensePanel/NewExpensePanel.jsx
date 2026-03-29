import { useState, useEffect } from 'react';
import { API } from '../../constants/constants';
import panelStyles from '../../styles/shared.module.css';
import styles from './NewExpensePanel.module.css';

export default function NewExpensePanel({ allCategoryNames, onAddTransaction, defaultDate }) {
  const [date, setDate] = useState(defaultDate);
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(allCategoryNames[0] ?? '');
  const [amount, setAmount] = useState('');
  const [txError, setTxError] = useState(null);
  const [txSaving, setTxSaving] = useState(false);

  // If the selected category was removed (shouldn't normally happen), fall back to first
  useEffect(() => {
    if (allCategoryNames.length > 0 && !allCategoryNames.includes(category)) {
      setCategory(allCategoryNames[0]);
    }
  }, [allCategoryNames, category]);

  async function handleAddTransaction(e) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!date || !desc.trim() || !category || isNaN(parsedAmount)) return;
    setTxSaving(true);
    setTxError(null);
    try {
      const res = await fetch(`${API}/transactions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, description: desc.trim(), category, amount: parsedAmount }),
      });
      const data = await res.json();
      if (!res.ok) { setTxError(data.error || 'Failed to add transaction'); return; }
      setDesc('');
      setAmount('');
      onAddTransaction(data);
    } catch {
      setTxError('Failed to add transaction');
    } finally {
      setTxSaving(false);
    }
  }

  return (
    <div className={panelStyles.panel}>
      <span className={panelStyles.panelSectionTitle}>New expense</span>
      <form onSubmit={handleAddTransaction} className={styles.txForm}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className={panelStyles.panelInput}
        />
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description"
          required
          className={panelStyles.panelInput}
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
          className={panelStyles.panelInput}
        >
          {allCategoryNames.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount"
          required
          className={panelStyles.panelInput}
        />
        <button
          type="submit"
          disabled={!date || !desc.trim() || !category || !amount || txSaving}
          className={panelStyles.panelBtn}
        >
          {txSaving ? 'Adding…' : 'Add'}
        </button>
      </form>
      {txError && <p className={panelStyles.panelError}>{txError}</p>}
    </div>
  );
}
