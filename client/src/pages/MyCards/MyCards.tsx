import { useNavigate } from 'react-router-dom';
import { useCards } from '../../hooks/useCards';
import RegisterCardForm from '../../components/RegisterCardForm/RegisterCardForm';
import CardList from '../../components/CardList/CardList';
import styles from './MyCards.module.css';

export default function MyCards() {
  const { cards, loading, registerCard, deleteCard } = useCards();
  const navigate = useNavigate();

  return (
    <main className={styles.container}>
      <h2>My Cards</h2>
      <p className={styles.rewardsText}>
        <span className={styles.rewardsLabel}>Considering a new card? </span>
        <a
          href="https://docs.google.com/spreadsheets/d/1Hk-Mzj5itLhrVHvzJ6AZ1Y_6R5UcS7jdyktlymLgm7Q/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.rewardsLink}
        >
          View credit card rewards and airline partners →
        </a>
      </p>
      <RegisterCardForm registerCard={registerCard} />
      <CardList cards={cards} loading={loading} deleteCard={deleteCard} />
      <button className={styles.dashboardBtn} onClick={() => navigate('/')}>
        → Go to Dashboard
      </button>
    </main>
  );
}
