import { useEffect } from 'react';

// Calls callback when a mousedown event occurs outside the given ref's element.
export function useClickOutside(ref, callback) {
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) callback();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, callback]);
}
