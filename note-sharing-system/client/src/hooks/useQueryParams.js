import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps the browse filters in the URL query string
 * (?keyword=normalization&course=...&semester=3).
 *
 * Benefits:
 *  - the page can be shared/bookmarked with the same filters
 *  - going "back" restores the previous filter set
 */
export default function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => Object.fromEntries([...searchParams.entries()]), [searchParams]);

  const setParams = useCallback(
    (patch, { resetPage = true } = {}) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) next.delete(key);
        else next.set(key, String(value));
      });
      if (resetPage && !('page' in patch)) next.delete('page'); // new filter -> page 1
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const clearParams = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  return { params, setParams, clearParams };
}
