import { useMemo } from 'react';
import useMonthData from './useMonthData';
import { useCards } from './useCards';
import { useCardSpending } from './useCardSpending';
import { useCategoryHighlight } from './useCategoryHighlight';
import { useMonthNavigation } from './useMonthNavigation';

// Coordinates all hooks for the MonthDetail page, including cross-highlight logic.
export function useMonthDetailState(yearMonth: string) {
  const monthData = useMonthData(yearMonth);
  const { cards } = useCards();
  const cardSpending = useCardSpending(monthData.transactions, cards);
  const categoryHighlight = useCategoryHighlight(monthData.transactions);
  const nav = useMonthNavigation(yearMonth);

  function handleCategoryHover(name: string | null): void {
    categoryHighlight.onCategoryHover(name);
    if (name !== null) cardSpending.clearCardLock();
  }

  function handleCategoryClick(name: string): void {
    categoryHighlight.onCategoryClick(name);
    cardSpending.clearCardLock();
  }

  function handleCardHover(name: string | null): void {
    cardSpending.onCardHover(name);
    if (name !== null) categoryHighlight.clearCategoryLock();
  }

  function handleCardClick(name: string): void {
    cardSpending.onCardClick(name);
    categoryHighlight.clearCategoryLock();
  }

  const highlightedTxIds = useMemo(() => {
    if (cardSpending.highlightedTxIds.size > 0) return cardSpending.highlightedTxIds;
    return categoryHighlight.categoryHighlightedTxIds;
  }, [cardSpending.highlightedTxIds, categoryHighlight.categoryHighlightedTxIds]);

  return {
    ...monthData,
    cards,
    cardColorMap: cardSpending.cardColorMap,
    cardsWithSpending: cardSpending.cardsWithSpending,
    lockedCard: cardSpending.lockedCard,
    lockedCategory: categoryHighlight.lockedCategory,
    highlightedTxIds,
    nav,
    handleCategoryHover,
    handleCategoryClick,
    handleCardHover,
    handleCardClick,
  };
}
