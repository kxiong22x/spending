import { useState, useEffect } from 'react';
import { API } from '../constants/constants';

// Fetches, registers, and deletes the user's credit cards.
export function useCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/cards`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCards(data))
      .finally(() => setLoading(false));
  }, []);

  // Returns the new card object on success, or throws an Error with a message.
  async function registerCard(name) {
    const res = await fetch(`${API}/cards`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register card');
    setCards(prev => [...prev, data]);
    return data;
  }

  // Removes the card with the given id, or throws an Error with a message.
  async function deleteCard(id) {
    const res = await fetch(`${API}/cards/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete card');
    }
    setCards(prev => prev.filter(c => c.id !== id));
  }

  return { cards, loading, registerCard, deleteCard };
}
