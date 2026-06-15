import { useState, useMemo } from 'react';
import { CARD_PIE_COLORS } from '../constants/constants';
import { Transaction, Card } from '@shared/types';

// Derives per-card spending totals, color assignments, and highlight state from transactions and cards.
export function useCardSpending(transactions: Transaction[], cards: Card[]) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [lockedCard, setLockedCard] = useState<string | null>(null);

  const effectiveCard = hoveredCard ?? lockedCard;

  const cardColorMap = useMemo(() => Object.fromEntries(
    cards.map((card, i) => [card.name, CARD_PIE_COLORS[i % CARD_PIE_COLORS.length]])
  ), [cards]);

  const cardsWithSpending = useMemo(() => {
    const cardById = Object.fromEntries(cards.map(c => [c.id, c.name]));
    const totals: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.card_id == null) continue;
      const name = cardById[tx.card_id];
      if (!name) continue;
      totals[name] = (totals[name] ?? 0) + tx.amount;
    }
    return Object.entries(totals).map(([name, total]) => ({ name, total }));
  }, [cards, transactions]);

  const highlightedTxIds = useMemo(() => {
    if (!effectiveCard) return new Set<number>();
    const card = cards.find(c => c.name === effectiveCard);
    if (!card) return new Set<number>();
    return new Set(transactions.filter(tx => tx.card_id === card.id).map(tx => tx.id));
  }, [effectiveCard, cards, transactions]);

  function onCardHover(name: string | null): void {
    setHoveredCard(name);
    if (name !== null && name !== lockedCard) setLockedCard(null);
  }

  function onCardClick(name: string): void {
    setLockedCard(prev => prev === name ? null : name);
  }

  function clearCardLock(): void {
    setLockedCard(null);
  }

  return { cardColorMap, cardsWithSpending, highlightedTxIds, onCardHover, onCardClick, lockedCard, clearCardLock };
}
