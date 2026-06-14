import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../hooks/useClickOutside';
import { User } from '@shared/types';
import styles from './Header.module.css';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function Header({ user, onLogout, onDeleteAccount }: HeaderProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setOpen(false));

  return (
    <header className={styles.header}>
      <h1 className={styles.title} onClick={() => navigate('/')}>Spending Tracker</h1>
      <div className={styles.userInfo} ref={dropdownRef}>
        {user.avatar_url && (
          <img src={user.avatar_url} alt="avatar" className={styles.avatar} />
        )}
        <span className={styles.userName} onClick={() => setOpen(o => !o)}>{user.name}</span>
        {open && (
          <div className={styles.dropdown}>
            <button onClick={() => { setOpen(false); navigate('/cards'); }} className={styles.dropdownItem}>
              My Cards
            </button>
            <button onClick={() => { setOpen(false); onLogout(); }} className={styles.dropdownItem}>
              Sign Out
            </button>
            <button onClick={() => { setOpen(false); onDeleteAccount(); }} className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}>
              Delete Account
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
