import { useState } from 'react';
import { MAX_NAME_LENGTH } from '../../constants/constants';
import panelStyles from '../../styles/shared.module.css';
import styles from './NewCategoryPanel.module.css';

export default function NewCategoryPanel({ onAddCategory }) {
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
      await onAddCategory(name, isRecurring);
      setCatName('');
    } catch (err) {
      setCatError(err.message || 'Failed to create category');
    } finally {
      setCatSaving(false);
    }
  }

  return (
    <div className={panelStyles.panel}>
      <span className={panelStyles.panelSectionTitle}>New category</span>
      <form onSubmit={handleAddCategory} className={styles.newCatForm}>
        <div className={styles.inputRow}>
          <input
            value={catName}
            onChange={e => { setCatName(e.target.value); setCatError(null); }}
            placeholder="Category name"
            maxLength={MAX_NAME_LENGTH}
            disabled={catSaving}
            className={panelStyles.panelInput}
          />
          <button type="submit" disabled={!catName.trim() || catSaving} className={panelStyles.panelBtn}>
            {catSaving ? 'Adding…' : 'Add'}
          </button>
        </div>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={e => setIsRecurring(e.target.checked)}
            disabled={catSaving}
          />
          Recurring
        </label>
      </form>
      {catError && <p className={panelStyles.panelError}>{catError}</p>}
    </div>
  );
}
