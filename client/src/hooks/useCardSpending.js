import { useState, useMemo } from 'react';
import { CARD_PIE_COLORS } from '../constants/constants';

// Derives per-card spending totals, color assignments, and highlight state from transactions and cards.
export function useCardSpending(transactions, cards) {
  const [hoveredCard, setHoveredCard] = useState(null);

  const cardColorMap = useMemo(() => Object.fromEntries(
    cards.map((card, i) => [card.name, CARD_PIE_COLORS[i % CARD_PIE_COLORS.length]])
  ), [cards]);

  const cardsWithSpending = useMemo(() => {
    const cardById = Object.fromEntries(cards.map(c => [c.id, c.name]));
    const totals = {};
    for (const tx of transactions) {
      if (tx.card_id == null) continue;
      const name = cardById[tx.card_id];
      if (!name) continue;
      totals[name] = (totals[name] ?? 0) + tx.amount;
    }
    return Object.entries(totals).map(([name, total]) => ({ name, total }));
  }, [cards, transactions]);

  const highlightedTxIds = useMemo(() => {
    if (!hoveredCard) return new Set();
    const card = cards.find(c => c.name === hoveredCard);
    if (!card) return new Set();
    return new Set(transactions.filter(tx => tx.card_id === card.id).map(tx => tx.id));
  }, [hoveredCard, cards, transactions]);

  return { cardColorMap, cardsWithSpending, highlightedTxIds, onCardHover: setHoveredCard };
}
