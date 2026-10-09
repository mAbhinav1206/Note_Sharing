import Spinner from 'react-bootstrap/Spinner';

/** Loading spinner used while API calls are in flight. */
export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
      <Spinner animation="border" variant="primary" />
      <div className="mt-2 small">{label}</div>
    </div>
  );
}
