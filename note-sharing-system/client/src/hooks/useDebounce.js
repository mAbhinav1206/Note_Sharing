import { useEffect, useState } from 'react';

/**
 * Debounces a value - used by the search box so the API is not called
 * on every single keystroke (waits 400ms after the last one).
 */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
