import Badge from 'react-bootstrap/Badge';

const COLORS = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  active: 'success',
  blocked: 'secondary',
  open: 'danger',
  resolved: 'success',
  dismissed: 'secondary',
};

/** Small coloured pill for note/user/report statuses. */
export default function StatusBadge({ status }) {
  return <Badge bg={COLORS[status] || 'secondary'}>{status}</Badge>;
}
