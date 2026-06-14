import { useState, useEffect, useRef, useMemo } from 'react';
import { API, PIE_COLORS, CATEGORY_ORDER } from '../constants/constants';

export default function useMonthData(yearMonth) {
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]); // [{ name, is_recurring }]
  const [loading, setLoading] = useState(true);
  const [colorMap, setColorMap] = useState({});
  const [dragOverCat, setDragOverCat] = useState(null);
  const dragTx = useRef(null); // { id, fromCategory }

  useEffect(() => {
    Promise.all([
      fetch(`${API}/transactions?month=${yearMonth}`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${API}/categories?month=${yearMonth}`, { credentials: 'include' }).then(r => r.json()),
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
  const categories = useMemo(() => {
    const txsByCategory = {};
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

  // Records the dragged transaction so dropOnCategory can identify it.
  function startDrag(tx) {
    dragTx.current = { id: tx.id, fromCategory: tx.category || 'Uncategorized' };
  }

  // Clears the drag ref and drop highlight when a drag is cancelled or ends without a drop.
  function cancelDrag() {
    dragTx.current = null;
    setDragOverCat(null);
  }

  // Moves a transaction to toCat optimistically, rolling back on server error.
  async function dropOnCategory(toCat) {
    const { id, fromCategory } = dragTx.current ?? {};
    dragTx.current = null;
    if (!id || fromCategory === toCat) return;

    const prev = transactions;
    setTransactions(txs => txs.map(t => t.id === id ? { ...t, category: toCat } : t));

    try {
      const res = await fetch(`${API}/transactions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: toCat }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTransactions(prev);
    }
  }

  function handleDragOver(e, catName) {
    e.preventDefault();
    setDragOverCat(catName);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCat(null);
  }

  function handleDrop(e, toCat) {
    e.preventDefault();
    setDragOverCat(null);
    dropOnCategory(toCat);
  }

  // Creates a category on the server and adds it to local state; throws on failure.
  async function addCategory(name, isRecurring) {
    const res = await fetch(`${API}/categories`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, month: yearMonth, is_recurring: isRecurring }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create category');
    setCustomCategories(prev =>
      prev.some(c => c.name === data.name) ? prev : [...prev, data]
    );
  }

  // Creates a transaction on the server and appends it to local state; throws on failure.
  async function addTransaction(txData) {
    const res = await fetch(`${API}/transactions`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add transaction');
    setTransactions(prev => [...prev, data]);
  }

  // Deletes a custom category and moves its transactions to "other" after user confirmation.
  async function deleteCategory(name) {
    if (!window.confirm(`Delete category "${name}"? All transactions in this category this month will be moved to "Other".`)) return;

    try {
      const res = await fetch(`${API}/categories/${encodeURIComponent(name)}?month=${yearMonth}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) return;
      setCustomCategories(prev => prev.filter(c => c.name !== name));
      setTransactions(prev => prev.map(t => t.category === name ? { ...t, category: 'Other' } : t));
    } catch {
      // silently ignore network errors
    }
  }

  // Deletes a transaction optimistically after user confirmation, rolling back on error.
  async function deleteTransaction(id) {
    if (!window.confirm('Delete this transaction?')) return;

    const prev = transactions;
    setTransactions(txs => txs.filter(t => t.id !== id));

    try {
      const res = await fetch(`${API}/transactions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
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
    dragOverCat,
    startDrag,
    cancelDrag,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    addCategory,
    addTransaction,
    deleteCategory,
    deleteTransaction,
  };
}
