import { useState } from 'react';
import { API } from '../../constants/constants';
import panelStyles from '../../styles/shared.module.css';
import styles from './NewCategoryPanel.module.css';

export default function NewCategoryPanel({ yearMonth, onAddCategory }) {
  const [catName, setCatName] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [catError, setCatError] = useState(null);
  const [catSaving, setCatSaving] = useState(false);

  async function handleAddCategory(e) {
    e.preventDefault();
    const name = catName.trim();
    if (!name) return;
    setCatSaving(true);
    setCatError(null);
    try {
      const res = await fetch(`${API}/categories`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, month: yearMonth, is_recurring: isRecurring }),
      });
      const data = await res.json();
      if (!res.ok) { setCatError(data.error || 'Failed to create category'); return; }
      setCatName('');
      onAddCategory(data.name, data.is_recurring === 1);
    } catch {
      setCatError('Failed to create category');
    } finally {
      setCatSaving(false);
    }
  }

  return (
    <div className={panelStyles.panel}>
      <span className={panelStyles.panelSectionTitle}>New category</span>
      <form onSubmit={handleAddCategory} className={styles.newCatForm}>
        <input
          value={catName}
          onChange={e => { setCatName(e.target.value); setCatError(null); }}
          placeholder="Category name"
          maxLength={50}
          disabled={catSaving}
          className={panelStyles.panelInput}
        />
        <button type="submit" disabled={!catName.trim() || catSaving} className={panelStyles.panelBtn}>
          Add
        </button>
      </form>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={e => setIsRecurring(e.target.checked)}
          disabled={catSaving}
        />
        Recurring
      </label>
      {catError && <p className={panelStyles.panelError}>{catError}</p>}
    </div>
  );
}
