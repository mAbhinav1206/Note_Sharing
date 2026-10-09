import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { rateNote, deleteRating } from '../api/notes';

/**
 * RatingStars - two modes:
 *   display : read-only average (note cards)
 *   interactive : click to rate (note detail page, logged-in students)
 */
export default function RatingStars({ value = 0, count, noteId, onChange, size = '1rem' }) {
  const { user } = useAuth();
  const toast = useToast();
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(value);

  // Keep the local copy in sync when the parent refetches the average.
  useEffect(() => setLocal(value), [value]);

  const interactive = Boolean(noteId && onChange);
  const shown = hover || local;

  const handleClick = async (stars) => {
    if (!user) {
      toast.warning('Please log in to rate this note');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await rateNote(noteId, { stars });
      setLocal(stars);
      toast.success(res.message);
      onChange(stars);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save rating');
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    if (busy || !local) return;
    setBusy(true);
    try {
      await deleteRating(noteId);
      setLocal(0);
      onChange(0);
      toast.info('Rating removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove rating');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="d-inline-flex align-items-center" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          onClick={interactive ? () => handleClick(star) : undefined}
          onKeyDown={interactive ? (e) => e.key === 'Enter' && handleClick(star) : undefined}
          onMouseEnter={interactive ? () => setHover(star) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            color: star <= shown ? '#ffc107' : '#dee2e6',
            fontSize: size,
            lineHeight: 1,
          }}
          aria-label={interactive ? `Rate ${star} stars` : undefined}
        >
          ★
        </span>
      ))}
      <small className="text-muted ms-1">
        {local ? local.toFixed(1) : 'Not rated'}
        {typeof count === 'number' && ` (${count})`}
      </small>
      {interactive && local > 0 && user && (
        <button type="button" className="btn btn-link btn-sm p-0 ms-1 text-muted" onClick={handleClear}>
          (clear)
        </button>
      )}
    </span>
  );
}
