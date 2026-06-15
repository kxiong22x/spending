import { useState } from 'react';
import AnimatedEllipsis from '../AnimatedEllipsis/AnimatedEllipsis';
import styles from './CardList.module.css';

interface Card {
  id: number;
  name: string;
}

interface Props {
  cards: Card[];
  loading: boolean;
  deleteCard: (id: number) => Promise<void>;
}

export default function CardList({ cards, loading, deleteCard }: Props) {
  const [error, setError] = useState('');

  async function handleDelete(id: number): Promise<void> {
    setError('');
    try {
      await deleteCard(id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading) return <p>Loading<AnimatedEllipsis /></p>;

  return (
    <>
      {error && <p className={styles.error}>{error}</p>}
      <ul className={styles.cardList}>
        {cards.map(card => (
          <li key={card.id} className={styles.cardItem}>
            <span>{card.name}</span>
            <button className={styles.deleteBtn} onClick={() => handleDelete(card.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
