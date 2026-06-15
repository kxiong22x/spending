import { useState } from 'react';
import { MAX_NAME_LENGTH } from '../../constants/constants';
import styles from './RegisterCardForm.module.css';

interface Props {
  registerCard: (name: string) => Promise<void>;
}

export default function RegisterCardForm({ registerCard }: Props) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await registerCard(name.trim());
      setName('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
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
          disabled={submitting}
        />
        <button type="submit" className={styles.registerBtn} disabled={submitting || !name.trim()}>
          Register
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}
