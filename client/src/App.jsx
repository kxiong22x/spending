import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import MonthPage from './pages/MonthPage/MonthPage';
import Header from './components/Header/Header';
import { API } from './constants/constants';

export default function App() {
  // undefined = still checking auth, null = not logged in, object = logged in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => setUser(data))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) return null; // wait for auth check before rendering

  async function handleLogout() {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  }

  async function handleDeleteAccount() {
    if (!window.confirm('Permanently delete your account and all data? This cannot be undone.')) return;
    await fetch(`${API}/auth/account`, { method: 'DELETE', credentials: 'include' });
    setUser(null);
  }

  return (
    <>
      {user && <Header user={user} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />}
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/month/:yearMonth"
          element={user ? <MonthPage /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </>
  );
}
