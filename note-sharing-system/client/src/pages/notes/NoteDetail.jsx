import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getNote, downloadNote, getRatings, reportNote, deleteNote } from '../../api/notes';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../api/client';
import { avatarUrl } from '../../api/user';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import RatingStars from '../../components/RatingStars';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDate, formatBytes, getFileType } from '../../utils/format';

/** Note detail: info, download, star rating + reviews, report, owner actions. */
export default function NoteDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [myRating, setMyRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: '', description: '' });
  const [reportBusy, setReportBusy] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getNote(id), getRatings(id)])
      .then(([noteRes, ratingRes]) => {
        setNote(noteRes.data);
        setRatings(ratingRes.data.ratings);
        setMyRating(ratingRes.data.myRating);
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else toast.error('Could not load the note');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleDownload = async () => {
    if (!user) {
      toast.warning('Please log in to download notes');
      navigate('/login', { state: { from: `/notes/${id}` } });
      return;
    }
    setDownloading(true);
    try {
      await downloadNote(id, note.note.file.originalName);
      setNote((prev) => ({ ...prev, note: { ...prev.note, downloadCount: prev.note.downloadCount + 1 } }));
      toast.success('Download started');
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setDownloading(false);
    }
  };

  const submitReport = async () => {
    if (!reportForm.reason.trim() || !reportForm.description.trim()) {
      toast.warning('Please fill in both fields');
      return;
    }
    setReportBusy(true);
    try {
      const res = await reportNote({ note: id, ...reportForm });
      toast.success(res.message);
      setShowReport(false);
      setReportForm({ reason: '', description: '' });
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setReportBusy(false);
    }
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await deleteNote(id);
      toast.success('Note deleted');
      navigate('/my-notes');
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setDeleteBusy(false);
    }
  };

  const onRatingChange = (stars) => {
    // Refresh average + reviews after rating.
    getNote(id).then((res) => setNote(res.data)).catch(() => {});
    getRatings(id).then((res) => {
      setRatings(res.data.ratings);
      setMyRating(res.data.myRating);
    }).catch(() => {});
    if (stars) load();
  };

  if (loading) return <Loader label="Loading note…" />;
  if (notFound || !note) {
    return (
      <Container className="py-5">
        <EmptyState title="Note not found" message="It may have been removed by an admin." actionLabel="Browse notes" onAction={() => navigate('/notes')} />
      </Container>
    );
  }

  const { note: n, isOwner, isAdmin } = note;
  const file = getFileType(n.file?.originalName || n.title);

  return (
    <Container className="py-4">
      <Row className="g-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div className="d-flex gap-3 align-items-center">
                  <span
                    className="rounded d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ width: 56, height: 56, backgroundColor: file.color }}
                  >
                    {file.label}
                  </span>
                  <div>
                    <h4 className="mb-1">{n.title}</h4>
                    <div className="text-muted">
                      {n.subject?.name} · Semester {n.semester} · {n.course?.name}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <StatusBadge status={n.status} />
                  <div className="small text-muted mt-1">{n.category?.name}</div>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-3 align-items-center border-top border-bottom py-3 my-3">
                <RatingStars value={n.avgRating} count={n.ratingCount} size="1.2rem" />
                <span className="text-muted small">⬇ {n.downloadCount} downloads</span>
                <span className="text-muted small">📄 {formatBytes(n.file?.size)}</span>
                <span className="text-muted small">📅 {formatDate(n.createdAt)}</span>
              </div>

              <div className="d-flex align-items-center gap-2 mb-3">
                {n.uploadedBy?.avatar ? (
                  <img src={avatarUrl(n.uploadedBy._id)} alt="" width={32} height={32} roundedCircle />
                ) : (
                  <span className="bg-secondary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                    {n.uploadedBy?.name?.[0]}
                  </span>
                )}
                <div>
                  <div className="small fw-semibold">{n.uploadedBy?.name}</div>
                  <div className="small text-muted">Uploader</div>
                </div>
              </div>

              {n.description && <p className="text-muted">{n.description}</p>}

              {n.status === 'rejected' && (isOwner || isAdmin) && (
                <div className="alert alert-danger small py-2">
                  <strong>Rejected:</strong> {n.rejectionReason}
                </div>
              )}
              {n.status === 'pending' && (isOwner || isAdmin) && (
                <div className="alert alert-warning small py-2">This note is waiting for admin approval.</div>
              )}

              <div className="d-flex gap-2 flex-wrap">
                <Button variant="primary" onClick={handleDownload} disabled={downloading || (n.status !== 'approved' && !isOwner && !isAdmin)}>
                  {downloading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-1" /> Preparing…
                    </>
                  ) : (
                    '⬇ Download'
                  )}
                </Button>

                {user && !isOwner && n.status === 'approved' && (
                  <Button variant="outline-danger" onClick={() => setShowReport(true)}>
                    🚩 Report
                  </Button>
                )}

                {isOwner && (
                  <>
                    <Button as={Link} to={`/notes/${n._id}/edit`} variant="outline-secondary">Edit</Button>
                    <Button variant="outline-danger" onClick={() => setShowDelete(true)}>Delete</Button>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* ---- Reviews ---- */}
          <Card className="shadow-sm mt-3">
            <Card.Header className="fw-semibold">Ratings & Reviews ({ratings.length})</Card.Header>
            <Card.Body>
              <div className="mb-3 pb-3 border-bottom">
                <div className="small text-muted mb-1">Your rating</div>
                <RatingStars
                  noteId={n._id}
                  value={myRating?.stars || 0}
                  onChange={onRatingChange}
                  size="1.5rem"
                />
                {!user && <div className="small text-muted mt-1">Log in to rate this note.</div>}
              </div>

              {ratings.length === 0 ? (
                <div className="text-muted small">No reviews yet - be the first!</div>
              ) : (
                ratings.map((r) => (
                  <div key={r._id} className="d-flex gap-2 mb-3">
                    {r.user?.avatar ? (
                      <img src={avatarUrl(r.user._id)} alt="" width={34} height={34} roundedCircle />
                    ) : (
                      <span className="bg-light border rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                        {r.user?.name?.[0]}
                      </span>
                    )}
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <span className="small fw-semibold">{r.user?.name}</span>
                        <span className="small text-muted">{formatDate(r.createdAt)}</span>
                      </div>
                      <RatingStars value={r.stars} size="0.9rem" />
                      {r.review && <div className="small">{r.review}</div>}
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* ---- Sidebar ---- */}
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="fw-semibold">About this note</Card.Header>
            <Card.Body className="small">
              <dl className="mb-0">
                <dt>File</dt>
                <dd>{n.file?.originalName}</dd>
                <dt>Type / size</dt>
                <dd>{file.label} · {formatBytes(n.file?.size)}</dd>
                <dt>Course</dt>
                <dd>{n.course?.name}</dd>
                <dt>Subject</dt>
                <dd>{n.subject?.name} (Sem {n.semester})</dd>
                <dt>Category</dt>
                <dd>{n.category?.name}</dd>
                <dt>Uploaded</dt>
                <dd>{formatDate(n.createdAt)}</dd>
                <dt>Status</dt>
                <dd><StatusBadge status={n.status} /></dd>
              </dl>
            </Card.Body>
          </Card>

          <Card className="shadow-sm mt-3">
            <Card.Body className="small text-muted">
              <strong className="text-dark d-block mb-1">Found this helpful?</strong>
              Rate it with stars above and help other students pick the best notes.
              <div className="mt-2">
                <Badge bg="light" text="dark">One review per student</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ---- Report modal ---- */}
      <Modal show={showReport} onHide={() => setShowReport(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">🚩 Report this note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Reason *</Form.Label>
            <Form.Select
              value={reportForm.reason}
              onChange={(e) => setReportForm((f) => ({ ...f, reason: e.target.value }))}
            >
              <option value="">Select a reason</option>
              <option>Spam or irrelevant</option>
              <option>Wrong content</option>
              <option>Copyright violation</option>
              <option>Inappropriate content</option>
              <option>Other</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reportForm.description}
              onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Explain the problem…"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button size="sm" variant="secondary" onClick={() => setShowReport(false)}>Cancel</Button>
          <Button size="sm" variant="danger" onClick={submitReport} disabled={reportBusy}>
            {reportBusy ? 'Submitting…' : 'Submit report'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmDialog
        show={showDelete}
        title="Delete this note?"
        message={<>Delete <strong>{n.title}</strong> permanently? This cannot be undone.</>}
        confirmLabel="Delete"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)}
      />
    </Container>
  );
}
