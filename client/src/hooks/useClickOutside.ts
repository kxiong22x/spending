import { useEffect, RefObject } from 'react';

// Calls callback when a mousedown event occurs outside the given ref's element.
export function useClickOutside(ref: RefObject<HTMLElement | null>, callback: () => void): void {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, callback]);
}
