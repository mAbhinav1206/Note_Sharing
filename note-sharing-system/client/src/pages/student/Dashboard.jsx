import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyNotes } from '../../api/notes';
import { downloadNote } from '../../api/notes';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';

/** Student dashboard: personal stats + recent uploads + status breakdown. */
export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      getMyNotes({ limit: 50 }),
      getMyNotes({ status: 'pending', limit: 1 }),
      getMyNotes({ status: 'approved', limit: 1 }),
      getMyNotes({ status: 'rejected', limit: 1 }),
    ])
      .then(([all, pending, approved, rejected]) => {
        setData({
          recent: all.data.notes.slice(0, 5),
          total: all.data.pagination.total,
          pending: pending.data.pagination.total,
          approved: approved.data.pagination.total,
          rejected: rejected.data.pagination.total,
        });
      })
      .catch(() => toast.error('Could not load your dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Loader label="Loading your dashboard…" />;
  if (!data) return <EmptyState title="Could not load dashboard" />;

  const downloads = data.recent.reduce((sum, n) => sum + n.downloadCount, 0);
  const rejectedNotes = data.recent.filter((n) => n.status === 'rejected');

  const cards = [
    ['📤', 'My uploads', data.total, 'primary'],
    ['⏳', 'Pending approval', data.pending, 'warning'],
    ['✅', 'Approved', data.approved, 'success'],
    ['❌', 'Rejected', data.rejected, 'danger'],
    ['⬇️', 'Downloads (recent)', downloads, 'info'],
  ];

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 className="mb-0">Welcome, {user?.name} 👋</h4>
          <small className="text-muted">
            {user?.course} {user?.semester ? `· Semester ${user.semester}` : ''}
          </small>
        </div>
        <div className="d-flex gap-2">
          <Button as={Link} to="/upload" variant="primary" size="sm">Upload new note</Button>
          <Button as={Link} to="/my-notes" variant="outline-primary" size="sm">Manage my notes</Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        {cards.map(([icon, label, value, variant]) => (
          <Col xs={6} md key={label}>
            <Card className="text-center shadow-sm h-100 border-start border-4" style={{ borderColor: `var(--bs-${variant}) !important` }}>
              <Card.Body className="py-3">
                <div style={{ fontSize: 22 }}>{icon}</div>
                <div className="fs-4 fw-bold">{value}</div>
                <div className="text-muted small">{label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {rejectedNotes.length > 0 && (
        <div className="alert alert-warning small">
          <strong>Some of your notes were rejected:</strong>
          <ul className="mb-0 mt-1">
            {rejectedNotes.map((n) => (
              <li key={n._id}>
                {n.title} - {n.rejectionReason || 'No reason provided'}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card className="shadow-sm">
        <Card.Header className="fw-semibold">Recent uploads</Card.Header>
        {data.recent.length === 0 ? (
          <EmptyState
            title="You have not uploaded anything yet"
            message="Share your first set of notes with other students."
            actionLabel="Upload notes"
            onAction={() => window.location.assign('/upload')}
          />
        ) : (
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Downloads</th>
                <th>Uploaded</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.recent.map((note) => (
                <tr key={note._id}>
                  <td>
                    <Link to={`/notes/${note._id}`} className="text-decoration-none">
                      {note.title}
                    </Link>
                  </td>
                  <td>
                    {note.subject?.name} <Badge bg="light" text="dark">Sem {note.semester}</Badge>
                  </td>
                  <td><StatusBadge status={note.status} /></td>
                  <td>{note.downloadCount}</td>
                  <td className="small text-muted">{formatDate(note.createdAt)}</td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      disabled={note.status !== 'approved'}
                      onClick={async () => {
                        try {
                          await downloadNote(note._id, note.file.originalName);
                          toast.info('Download started');
                        } catch {
                          toast.error('Download failed');
                        }
                      }}
                    >
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
}
