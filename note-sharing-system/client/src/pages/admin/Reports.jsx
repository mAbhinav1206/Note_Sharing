import { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import { adminListReports, reviewReport } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

/**
 * Admin: report queue (single PATCH endpoint decides the outcome).
 *  - dismiss -> { status: 'dismissed' } : report closed, note stays.
 *  - resolve -> { status: 'resolved' }  : server also DELETES the note,
 *               its file, ratings, downloads and any other open reports.
 */
export default function AdminReports() {
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (status) params.status = status;
    adminListReports(params)
      .then((res) => setData(res.data))
      .catch(() => toast.error('Could not load reports'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const review = async (report, newStatus) => {
    setBusy(true);
    try {
      await reviewReport(report._id, {
        status: newStatus,
        adminComment:
          newStatus === 'resolved'
            ? 'Note removed after review'
            : 'Reviewed - note is fine to keep',
      });
      toast.success(
        newStatus === 'resolved'
          ? 'Note deleted and report resolved'
          : 'Report dismissed - note kept'
      );
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h4 className="mb-3">Reports</h4>

      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <Form.Select
            style={{ width: 170 }}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="">All</option>
          </Form.Select>
        </Card.Body>
      </Card>

      {loading ? (
        <Loader />
      ) : !data || data.reports.length === 0 ? (
        <EmptyState title="No reports" message="Nothing to review here." />
      ) : (
        <>
          <Card className="shadow-sm">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Note</th>
                  <th>Reason</th>
                  <th>Reported by</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.reports.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="fw-semibold">{r.note?.title || '(note already deleted)'}</div>
                      <div className="small text-muted">{r.description}</div>
                    </td>
                    <td><Badge bg="danger" className="text-uppercase">{r.reason}</Badge></td>
                    <td className="small">{r.reportedBy?.name}</td>
                    <td>
                      <Badge bg={r.status === 'open' ? 'warning' : 'secondary'} text={r.status === 'open' ? 'dark' : 'white'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="small text-muted">{formatDate(r.createdAt)}</td>
                    <td className="text-end text-nowrap">
                      {r.status === 'open' && r.note ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="me-1"
                            disabled={busy}
                            onClick={() => review(r, 'dismissed')}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={busy}
                            onClick={() => review(r, 'resolved')}
                          >
                            Resolve (delete note)
                          </Button>
                        </>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
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
    </div>
  );
}
