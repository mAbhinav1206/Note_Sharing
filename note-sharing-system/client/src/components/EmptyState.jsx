import Button from 'react-bootstrap/Button';

/** Friendly empty state (no results / nothing uploaded yet). */
export default function EmptyState({ title = 'Nothing here yet', message, actionLabel, onAction }) {
  return (
    <div className="text-center py-5 text-muted">
      <div style={{ fontSize: 42 }}>📭</div>
      <h6 className="mt-2">{title}</h6>
      {message && <p className="small mb-3">{message}</p>}
      {actionLabel && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
