import { useState } from 'react';
import { MAX_NAME_LENGTH } from '../../constants/constants';
import { useFormState } from '../../hooks/useFormState';
import panelStyles from '../../styles/shared.module.css';
import styles from './NewCategoryPanel.module.css';
import AnimatedEllipsis from '../AnimatedEllipsis/AnimatedEllipsis';

interface NewCategoryPanelProps {
  onAddCategory: (name: string, isRecurring: boolean) => Promise<void>;
}

export default function NewCategoryPanel({ onAddCategory }: NewCategoryPanelProps) {
  const [catName, setCatName] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const { error, saving, run, clearError } = useFormState();

  async function handleAddCategory(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const name = catName.trim();
    if (!name) return;
    await run(async () => {
      await onAddCategory(name, isRecurring);
      setCatName('');
    });
  }

  return (
    <div className={panelStyles.panel}>
      <span className={panelStyles.panelSectionTitle}>New category</span>
      <form onSubmit={handleAddCategory} className={styles.newCatForm}>
        <div className={styles.inputRow}>
          <input
            value={catName}
            onChange={e => { setCatName(e.target.value); clearError(); }}
            placeholder="Category name"
            maxLength={MAX_NAME_LENGTH}
            disabled={saving}
            className={panelStyles.panelInput}
          />
          <button type="submit" disabled={!catName.trim() || saving} className={panelStyles.panelBtn}>
            {saving ? <>Adding<AnimatedEllipsis /></> : 'Add'}
          </button>
        </div>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={e => setIsRecurring(e.target.checked)}
            disabled={saving}
          />
          Recurring
        </label>
      </form>
      {error && <p className={panelStyles.panelError}>{error}</p>}
    </div>
  );
}
