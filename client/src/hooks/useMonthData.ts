import { useState, useEffect, useMemo } from 'react';
import { PIE_COLORS, CATEGORY_ORDER } from '../constants/constants';
import { Transaction, CustomCategory, CategoryWithTransactions } from '@shared/types';
import { apiFetch } from '../utils/api';
import { useDragDrop } from './useDragDrop';

interface NewTransactionData {
  date: string;
  description: string;
  category: string;
  amount: number;
  card_id: number | null;
}

export default function useMonthData(yearMonth: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      apiFetch<Transaction[]>(`/transactions?month=${yearMonth}`),
      apiFetch<CustomCategory[]>(`/categories?month=${yearMonth}`),
    ])
      .then(([txs, cats]) => {
        setTransactions(txs);
        setCustomCategories(cats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [yearMonth]);

  // Full ordered category list: built-ins first, then user-created
  const allCategoryNames = useMemo(() => [
    ...CATEGORY_ORDER,
    ...customCategories.filter(c => !CATEGORY_ORDER.includes(c.name)).map(c => c.name),
  ], [customCategories]);

  // Assign stable colors to new categories as they appear, without mutating during render
  useEffect(() => {
    setColorMap(prev => {
      const next = { ...prev };
      let changed = false;
      let colorCount = Object.keys(next).length;
      allCategoryNames.forEach((name) => {
        if (!(name in next)) {
          next[name] = PIE_COLORS[colorCount % PIE_COLORS.length];
          colorCount++;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [allCategoryNames]);

  // Build category objects with their transactions and totals
  const categories = useMemo((): CategoryWithTransactions[] => {
    const txsByCategory: Record<string, Transaction[]> = {};
    for (const tx of transactions) {
      const cat = tx.category || 'Uncategorized';
      if (!txsByCategory[cat]) txsByCategory[cat] = [];
      txsByCategory[cat].push(tx);
    }
    return allCategoryNames.map(name => ({
      name,
      txs: txsByCategory[name] ?? [],
      total: (txsByCategory[name] ?? []).reduce((sum, t) => sum + t.amount, 0),
    }));
  }, [allCategoryNames, transactions]);

  const categoriesWithTxs = useMemo(
    () => categories.filter(c => c.txs.length > 0),
    [categories]
  );

  const totalSpending = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const dragDrop = useDragDrop(transactions, setTransactions);

  // Creates a category on the server and adds it to local state; throws on failure.
  async function addCategory(name: string, isRecurring: boolean): Promise<void> {
    const data = await apiFetch<CustomCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, month: yearMonth, is_recurring: isRecurring }),
    });
    setCustomCategories(prev =>
      prev.some(c => c.name === data.name) ? prev : [...prev, data]
    );
  }

  // Creates a transaction on the server and appends it to local state; throws on failure.
  async function addTransaction(txData: NewTransactionData): Promise<void> {
    const data = await apiFetch<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(txData),
    });
    setTransactions(prev => [...prev, data]);
  }

  // Deletes a custom category and moves its transactions to "Other" after user confirmation.
  async function deleteCategory(name: string): Promise<void> {
    if (!window.confirm(`Delete category "${name}"? All transactions in this category this month will be moved to "Other".`)) return;

    try {
      await apiFetch(`/categories/${encodeURIComponent(name)}?month=${yearMonth}`, { method: 'DELETE' });
      setCustomCategories(prev => prev.filter(c => c.name !== name));
      setTransactions(prev => prev.map(t => t.category === name ? { ...t, category: 'Other' } : t));
    } catch {
      // silently ignore network errors
    }
  }

  // Deletes a transaction optimistically after user confirmation, rolling back on error.
  async function deleteTransaction(id: number): Promise<void> {
    if (!window.confirm('Delete this transaction?')) return;

    const prev = transactions;
    setTransactions(txs => txs.filter(t => t.id !== id));

    try {
      await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
    } catch {
      setTransactions(prev);
    }
  }

  return {
    loading,
    transactions,
    categories,
    allCategoryNames,
    customCategories,
    colorMap,
    categoriesWithTxs,
    totalSpending,
    ...dragDrop,
    addCategory,
    addTransaction,
    deleteCategory,
    deleteTransaction,
  };
}
