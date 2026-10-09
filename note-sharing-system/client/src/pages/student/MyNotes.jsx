import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { Link } from 'react-router-dom';
import { getMyNotes, deleteNote } from '../../api/notes';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

/**
 * "My Notes" - the student's uploads grouped by approval status.
 * Edit / delete only work on their own notes (enforced by the server too).
 */
export default function MyNotes() {
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (tab !== 'all') params.status = tab;
    getMyNotes(params)
      .then((r) => setData(r.data))
      .catch(() => toast.error('Could not load your notes'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab, page]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteNote(toDelete._id);
      toast.success('Note deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">My Notes</h4>
        <Button as={Link} to="/upload" variant="primary" size="sm">+ Upload new</Button>
      </div>

      <Tabs activeKey={tab} onSelect={(k) => { setTab(k); setPage(1); }} className="mb-3">
        <Tab eventKey="all" title="All" />
        <Tab eventKey="pending" title="Pending" />
        <Tab eventKey="approved" title="Approved" />
        <Tab eventKey="rejected" title="Rejected" />
      </Tabs>

      {loading ? (
        <Loader />
      ) : !data || data.notes.length === 0 ? (
        <EmptyState
          title="No notes here"
          message={tab === 'rejected' ? 'Great - none of your notes were rejected.' : 'Upload your first note to get started.'}
          actionLabel="Upload notes"
          onAction={() => window.location.assign('/upload')}
        />
      ) : (
        <>
          <Card className="shadow-sm">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Downloads</th>
                  <th>Rating</th>
                  <th>Uploaded</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.notes.map((note) => (
                  <tr key={note._id}>
                    <td>
                      <Link to={`/notes/${note._id}`} className="text-decoration-none fw-semibold">
                        {note.title}
                      </Link>
                      {note.status === 'rejected' && note.rejectionReason && (
                        <div className="small text-danger">Reason: {note.rejectionReason}</div>
                      )}
                      {note.status === 'pending' && (
                        <div className="small text-muted">Waiting for admin approval</div>
                      )}
                    </td>
                    <td className="small">
                      {note.subject?.name}
                      <div className="text-muted">Sem {note.semester} · {note.category?.name}</div>
                    </td>
                    <td><StatusBadge status={note.status} /></td>
                    <td>{note.downloadCount}</td>
                    <td>
                      {note.avgRating > 0 ? (
                        <span>⭐ {note.avgRating} <Badge bg="light" text="dark">({note.ratingCount})</Badge></span>
                      ) : (
                        <span className="text-muted small">No ratings</span>
                      )}
                    </td>
                    <td className="small text-muted">{formatDate(note.createdAt)}</td>
                    <td className="text-end text-nowrap">
                      <Button
                        as={Link}
                        to={`/notes/${note._id}/edit`}
                        size="sm"
                        variant="outline-secondary"
                        className="me-1"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => setToDelete(note)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            onChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        show={Boolean(toDelete)}
        title="Delete note?"
        message={
          <>
            Permanently delete <strong>{toDelete?.title}</strong> and its file?
            All ratings, downloads and reports for it will also be removed.
          </>
        }
        confirmLabel="Delete"
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Container>
  );
}
