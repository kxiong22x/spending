import { useState } from 'react';
import { MAX_NAME_LENGTH } from '../../constants/constants';
import { useFormState } from '../../hooks/useFormState';
import styles from './RegisterCardForm.module.css';

interface Props {
  registerCard: (name: string) => Promise<void>;
}

export default function RegisterCardForm({ registerCard }: Props) {
  const [name, setName] = useState('');
  const { error, saving, run } = useFormState();

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    await run(async () => {
      await registerCard(name.trim());
      setName('');
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. AMEX 5543"
          maxLength={MAX_NAME_LENGTH}
          disabled={saving}
        />
        <button type="submit" className={styles.registerBtn} disabled={saving || !name.trim()}>
          Register
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}
