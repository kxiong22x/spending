import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import MonthPage from './pages/MonthPage/MonthPage';
import MyCards from './pages/MyCards/MyCards';
import Header from './components/Header/Header';
import { API } from './constants/constants';

function ProtectedRoute({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

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
          element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/month/:yearMonth"
          element={<ProtectedRoute user={user}><MonthPage /></ProtectedRoute>}
        />
        <Route
          path="/cards"
          element={<ProtectedRoute user={user}><MyCards /></ProtectedRoute>}
        />
      </Routes>
    </>
  );
}
