import { useState } from 'react';

// Manages form error and saving state, running an async action with automatic error capture.
export function useFormState() {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function run(action: () => Promise<void>): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  function clearError(): void {
    setError(null);
  }

  return { error, saving, run, clearError };
}
