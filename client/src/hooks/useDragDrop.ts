import { useState, useRef } from 'react';
import { Transaction } from '@shared/types';
import { apiFetch } from '../utils/api';

// Manages drag-and-drop state and event handlers for recategorizing transactions between columns.
export function useDragDrop(
  transactions: Transaction[],
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>,
) {
  const [dragOverCat, setDragOverCat] = useState<string | null>(null);
  const dragTx = useRef<{ id: number; fromCategory: string } | null>(null);

  function startDrag(tx: Transaction): void {
    dragTx.current = { id: tx.id, fromCategory: tx.category || 'Uncategorized' };
  }

  function cancelDrag(): void {
    dragTx.current = null;
    setDragOverCat(null);
  }

  async function dropOnCategory(toCat: string): Promise<void> {
    const { id, fromCategory } = dragTx.current ?? {};
    dragTx.current = null;
    if (!id || fromCategory === toCat) return;

    const prev = transactions;
    setTransactions(txs => txs.map(t => t.id === id ? { ...t, category: toCat } : t));

    try {
      await apiFetch(`/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ category: toCat }),
      });
    } catch {
      setTransactions(prev);
    }
  }

  function handleDragOver(e: React.DragEvent, catName: string): void {
    e.preventDefault();
    setDragOverCat(catName);
  }

  function handleDragLeave(e: React.DragEvent): void {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCat(null);
  }

  function handleDrop(e: React.DragEvent, toCat: string): void {
    e.preventDefault();
    setDragOverCat(null);
    dropOnCategory(toCat);
  }

  return { dragOverCat, startDrag, cancelDrag, handleDragOver, handleDragLeave, handleDrop };
}
