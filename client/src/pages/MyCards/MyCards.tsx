import { useState } from 'react';
import { useCards } from '../../hooks/useCards';
import { MAX_NAME_LENGTH } from '../../constants/constants';
import styles from './MyCards.module.css';

export default function MyCards() {
  const { cards, loading, registerCard, deleteCard } = useCards();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await registerCard(name.trim());
      setName('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number): Promise<void> {
    setError('');
    try {
      await deleteCard(id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className={styles.container}>
      <h2>My Cards</h2>
      <p className={styles.rewardsText}>
        <a
          href="https://docs.google.com/spreadsheets/d/1Hk-Mzj5itLhrVHvzJ6AZ1Y_6R5UcS7jdyktlymLgm7Q/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.rewardsLink}
        >
          Link
        </a>
        {' to credit card rewards and airline partners'}
      </p>
      <form onSubmit={handleRegister} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. AMEX 5543"
          maxLength={MAX_NAME_LENGTH}
          disabled={submitting}
        />
        <button type="submit" className={styles.registerBtn} disabled={submitting || !name.trim()}>
          Register
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className={styles.cardList}>
          {cards.map(card => (
            <li key={card.id} className={styles.cardItem}>
              <span>{card.name}</span>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(card.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
