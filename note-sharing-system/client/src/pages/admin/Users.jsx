import { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Badge from 'react-bootstrap/Badge';
import { adminListUsers, setUserStatus, deleteUser } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDate } from '../../utils/format';

/** Admin: search / block / unblock / delete student accounts. */
export default function AdminUsers() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (keyword) params.keyword = keyword;
    if (role) params.role = role;
    if (status) params.status = status;
    adminListUsers(params)
      .then((res) => setData(res.data))
      .catch(() => toast.error('Could not load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 350); // debounce typing
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, role, status, page]);

  const toggleStatus = async (u) => {
    try {
      await setUserStatus(u._id, u.status === 'blocked' ? 'active' : 'blocked');
      toast.success(u.status === 'blocked' ? 'User unblocked' : 'User blocked');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteUser(toDelete._id);
      toast.success('User deleted with all related data');
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
      <h4 className="mb-3">Users</h4>

      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <div className="d-flex gap-2 flex-wrap">
            <InputGroup style={{ maxWidth: 280 }}>
              <Form.Control
                placeholder="Search name or email…"
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              />
            </InputGroup>
            <Form.Select style={{ width: 140 }} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
              <option value="">All roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </Form.Select>
            <Form.Select style={{ width: 140 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </Form.Select>
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <Loader />
      ) : !data || data.users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <>
          <Card className="shadow-sm">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u._id}>
                    <td className="fw-semibold">{u.name}</td>
                    <td className="small">{u.email}</td>
                    <td>
                      <Badge bg={u.role === 'admin' ? 'warning' : 'info'} text={u.role === 'admin' ? 'dark' : 'white'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="small">{u.course || '-'}{u.semester ? ` Sem ${u.semester}` : ''}</td>
                    <td>
                      <Badge bg={u.status === 'blocked' ? 'secondary' : 'success'}>{u.status}</Badge>
                    </td>
                    <td className="small text-muted">{formatDate(u.createdAt)}</td>
                    <td className="text-end text-nowrap">
                      {u._id !== me?._id && (
                        <>
                          <Button
                            size="sm"
                            variant={u.status === 'blocked' ? 'outline-success' : 'outline-warning'}
                            className="me-1"
                            onClick={() => toggleStatus(u)}
                          >
                            {u.status === 'blocked' ? 'Unblock' : 'Block'}
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => setToDelete(u)}>
                            Delete
                          </Button>
                        </>
                      )}
                      {u._id === me?._id && <span className="text-muted small">that's you</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        show={Boolean(toDelete)}
        title="Delete user?"
        message={
          <>
            Delete <strong>{toDelete?.name}</strong> permanently? Their uploaded notes,
            ratings, downloads and reports will also be removed.
          </>
        }
        confirmLabel="Delete user"
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
