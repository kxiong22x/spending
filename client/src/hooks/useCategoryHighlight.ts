import { useMemo } from 'react';
import { Transaction } from '@shared/types';
import { useHoverLock } from './useHoverLock';

// Derives highlighted transaction IDs based on which category pie slice is hovered or locked.
export function useCategoryHighlight(transactions: Transaction[]) {
  const { effective: effectiveCategory, locked: lockedCategory, onHover: onCategoryHover, onClick: onCategoryClick, clearLock: clearCategoryLock } = useHoverLock();

  const categoryHighlightedTxIds = useMemo(() => {
    if (!effectiveCategory) return new Set<number>();
    return new Set(transactions.filter(tx => tx.category === effectiveCategory).map(tx => tx.id));
  }, [effectiveCategory, transactions]);

  return { categoryHighlightedTxIds, onCategoryHover, onCategoryClick, lockedCategory, clearCategoryLock };
}
