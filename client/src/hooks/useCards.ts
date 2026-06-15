import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Card } from '@shared/types';

// Fetches, registers, and deletes the user's credit cards.
export function useCards(): {
  cards: Card[];
  loading: boolean;
  registerCard: (name: string) => Promise<Card>;
  deleteCard: (id: number) => Promise<void>;
} {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Card[]>('/cards')
      .then(setCards)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Returns the new card object on success, or throws an Error with a message.
  async function registerCard(name: string): Promise<Card> {
    const data = await apiFetch<Card>('/cards', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    setCards(prev => [...prev, data]);
    return data;
  }

  // Removes the card with the given id, or throws an Error with a message.
  async function deleteCard(id: number): Promise<void> {
    await apiFetch(`/cards/${id}`, { method: 'DELETE' });
    setCards(prev => prev.filter(c => c.id !== id));
  }

  return { cards, loading, registerCard, deleteCard };
}
