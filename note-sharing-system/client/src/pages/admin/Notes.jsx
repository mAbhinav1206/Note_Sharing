import { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Badge from 'react-bootstrap/Badge';
import { adminListNotes, approveNote, rejectNote, adminDeleteNote } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';

/** Admin: moderation queue - approve / reject(reason) / delete notes. */
export default function AdminNotes() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (status) params.status = status;
    if (keyword) params.keyword = keyword;
    adminListNotes(params)
      .then((res) => setData(res.data))
      .catch(() => toast.error('Could not load notes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, keyword, page]);

  const handleApprove = async (note) => {
    try {
      await approveNote(note._id);
      toast.success('Note approved and now public');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('A rejection reason is required');
      return;
    }
    setBusy(true);
    try {
      await rejectNote(rejectTarget._id, { reason: rejectReason });
      toast.success('Note rejected');
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await adminDeleteNote(toDelete._id);
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
    <div>
      <h4 className="mb-3">Note Moderation</h4>

      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <div className="d-flex gap-2 flex-wrap">
            <Form.Select style={{ width: 160 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Form.Select>
            <Form.Control
              style={{ maxWidth: 260 }}
              placeholder="Search title…"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            />
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <Loader />
      ) : !data || data.notes.length === 0 ? (
        <EmptyState title="No notes" message="Nothing matches this filter." />
      ) : (
        <>
          <Card className="shadow-sm">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Uploader</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.notes.map((n) => (
                  <tr key={n._id}>
                    <td>
                      <div className="fw-semibold">{n.title}</div>
                      <div className="small text-muted">{n.file?.originalName}</div>
                    </td>
                    <td className="small">{n.subject?.name} · Sem {n.semester}</td>
                    <td className="small">{n.uploadedBy?.name}</td>
                    <td><StatusBadge status={n.status} /></td>
                    <td className="small text-muted">{formatDate(n.createdAt)}</td>
                    <td className="text-end text-nowrap">
                      {n.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline-success" className="me-1" onClick={() => handleApprove(n)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline-danger" className="me-1" onClick={() => setRejectTarget(n)}>
                            Reject
                          </Button>
                        </>
                      )}
                      {n.status === 'rejected' && (
                        <Badge bg="light" text="dark" className="me-1">
                          {n.rejectionReason || 'no reason'}
                        </Badge>
                      )}
                      <Button size="sm" variant="outline-secondary" onClick={() => setToDelete(n)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} />
        </>
      )}

      {/* Reject modal - reason is mandatory and shown to the student */}
      <Modal show={Boolean(rejectTarget)} onHide={() => setRejectTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">Reject “{rejectTarget?.title}”</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>Reason *</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Content is incomplete, scan is unreadable…"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button size="sm" variant="secondary" onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button size="sm" variant="danger" onClick={handleReject} disabled={busy}>
            {busy ? 'Rejecting…' : 'Reject note'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmDialog
        show={Boolean(toDelete)}
        title="Delete note?"
        message={<>Permanently delete <strong>{toDelete?.title}</strong> and its file?</>}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
