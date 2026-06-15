import { useState, useEffect } from 'react';
import { useFormState } from '../../hooks/useFormState';
import panelStyles from '../../styles/shared.module.css';
import styles from './NewExpensePanel.module.css';
import AnimatedEllipsis from '../AnimatedEllipsis/AnimatedEllipsis';
import { Card } from '@shared/types';

interface NewTransactionData {
  date: string;
  description: string;
  category: string;
  amount: number;
  card_id: number | null;
}

interface NewExpensePanelProps {
  allCategoryNames: string[];
  cards?: Card[];
  onAddTransaction: (data: NewTransactionData) => Promise<void>;
  defaultDate: string;
}

export default function NewExpensePanel({ allCategoryNames, cards = [], onAddTransaction, defaultDate }: NewExpensePanelProps) {
  const [date, setDate] = useState(defaultDate);
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(allCategoryNames[0] ?? '');
  const [cardId, setCardId] = useState<number | null>(cards[0]?.id ?? null);
  const [amount, setAmount] = useState('');
  const { error, saving, run } = useFormState();

  // If the selected category was removed (shouldn't normally happen), fall back to first
  useEffect(() => {
    if (allCategoryNames.length > 0 && !allCategoryNames.includes(category)) {
      setCategory(allCategoryNames[0]);
    }
  }, [allCategoryNames, category]);

  async function handleAddTransaction(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!date || !desc.trim() || !category || isNaN(parsedAmount)) return;
    await run(async () => {
      await onAddTransaction({ date, description: desc.trim(), category, amount: parsedAmount, card_id: cardId });
      setDesc('');
      setAmount('');
    });
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
        {cards.length > 0 && (
          <select
            value={cardId ?? ''}
            onChange={e => setCardId(Number(e.target.value))}
            className={panelStyles.panelInput}
          >
            {cards.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
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
          disabled={!date || !desc.trim() || !category || !amount || saving}
          className={panelStyles.panelBtn}
        >
          {saving ? <>Adding<AnimatedEllipsis /></> : 'Add'}
        </button>
      </form>
      {error && <p className={panelStyles.panelError}>{error}</p>}
    </div>
  );
}
