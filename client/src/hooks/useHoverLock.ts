import { useState } from 'react';

// Manages hover + click-to-lock state for interactive chart items, returning the effective active item.
export function useHoverLock() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [locked, setLocked] = useState<string | null>(null);

  const effective = hovered ?? locked;

  function onHover(name: string | null): void {
    setHovered(name);
    if (name !== null && name !== locked) setLocked(null);
  }

  function onClick(name: string): void {
    setLocked(prev => prev === name ? null : name);
  }

  function clearLock(): void {
    setLocked(null);
  }

  return { effective, locked, onHover, onClick, clearLock };
}
