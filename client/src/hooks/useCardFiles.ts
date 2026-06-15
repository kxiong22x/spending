import { useState } from 'react';

// Manages per-card CSV file state and provides handlers for adding and removing files.
export function useCardFiles() {
  const [cardFiles, setCardFiles] = useState<Record<number, File[]>>({});

  function handleFilesAdded(cardId: number, incoming: FileList): void {
    const csvs = Array.from(incoming).filter(
      f => f.name.toLowerCase().endsWith('.csv') || f.type === 'text/csv'
    );
    setCardFiles(prev => {
      const existing = new Set((prev[cardId] ?? []).map(f => f.name));
      return { ...prev, [cardId]: [...(prev[cardId] ?? []), ...csvs.filter(f => !existing.has(f.name))] };
    });
  }

  function handleFileRemoved(cardId: number, name: string): void {
    setCardFiles(prev => ({ ...prev, [cardId]: (prev[cardId] ?? []).filter(f => f.name !== name) }));
  }

  return { cardFiles, handleFilesAdded, handleFileRemoved };
}
