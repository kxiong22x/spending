import { useState, useMemo } from 'react';
import { Transaction } from '@shared/types';

// Derives highlighted transaction IDs based on which category pie slice is hovered.
export function useCategoryHighlight(transactions: Transaction[]) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categoryHighlightedTxIds = useMemo(() => {
    if (!hoveredCategory) return new Set<number>();
    return new Set(transactions.filter(tx => tx.category === hoveredCategory).map(tx => tx.id));
  }, [hoveredCategory, transactions]);

  return { categoryHighlightedTxIds, onCategoryHover: setHoveredCategory };
}
