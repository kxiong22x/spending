import { useState, useMemo } from 'react';
import { Transaction } from '@shared/types';

// Derives highlighted transaction IDs based on which category pie slice is hovered or locked.
export function useCategoryHighlight(transactions: Transaction[]) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [lockedCategory, setLockedCategory] = useState<string | null>(null);

  const effectiveCategory = hoveredCategory ?? lockedCategory;

  function onCategoryHover(name: string | null): void {
    setHoveredCategory(name);
    if (name !== null && name !== lockedCategory) setLockedCategory(null);
  }

  function onCategoryClick(name: string): void {
    setLockedCategory(prev => prev === name ? null : name);
  }

  function clearCategoryLock(): void {
    setLockedCategory(null);
  }

  const categoryHighlightedTxIds = useMemo(() => {
    if (!effectiveCategory) return new Set<number>();
    return new Set(transactions.filter(tx => tx.category === effectiveCategory).map(tx => tx.id));
  }, [effectiveCategory, transactions]);

  return { categoryHighlightedTxIds, onCategoryHover, onCategoryClick, lockedCategory, clearCategoryLock };
}
