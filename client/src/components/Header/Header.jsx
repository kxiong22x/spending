import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../hooks/useClickOutside';
import styles from './Header.module.css';

export default function Header({ user, onLogout, onDeleteAccount }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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
            <button onClick={() => { setOpen(false); onLogout(); }} className={styles.dropdownItem}>
              Sign out
            </button>
            <button onClick={() => { setOpen(false); onDeleteAccount(); }} className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}>
              Delete account
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
