import { useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getDashboard, exportCsv } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';

const STATUS_COLORS = { Approved: '#198754', Pending: '#ffc107', Rejected: '#dc3545' };

/** Admin dashboard: stat cards + 4 charts + recent uploads + CSV export. */
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(() => toast.error('Could not load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading statistics…" />;
  if (!data) return <div className="text-muted">No data.</div>;

  const { cards, charts, recentNotes } = data;

  const statCards = [
    ['👥', 'Students', cards.totalStudents, 'primary'],
    ['📝', 'Total notes', cards.totalNotes, 'success'],
    ['⬇️', 'Downloads', cards.totalDownloads, 'info'],
    ['⏳', 'Pending approvals', cards.pendingNotes, 'warning'],
    ['🚩', 'Open reports', cards.openReports, 'danger'],
    ['⭐', 'Avg rating', cards.avgRating, 'secondary'],
  ];

  const handleExport = async (type) => {
    try {
      await exportCsv(type);
      toast.success(`${type}.csv downloaded`);
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Dashboard</h4>
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-success" onClick={() => handleExport('notes')}>⬇ Notes CSV</Button>
          <Button size="sm" variant="outline-success" onClick={() => handleExport('users')}>⬇ Users CSV</Button>
          <Button size="sm" variant="outline-success" onClick={() => handleExport('downloads')}>⬇ Downloads CSV</Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        {statCards.map(([icon, label, value, variant]) => (
          <Col xs={6} md={4} lg={2} key={label}>
            <Card className="text-center shadow-sm h-100">
              <Card.Body className="py-3">
                <div style={{ fontSize: 20 }}>{icon}</div>
                <div className={`fs-5 fw-bold text-${variant}`}>{value}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={7}>
          <Card className="shadow-sm h-100">
            <Card.Header className="fw-semibold">Downloads (last 14 days)</Card.Header>
            <Card.Body style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.downloadsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" name="Downloads" stroke="#0d6efd" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Header className="fw-semibold">Notes by status</Card.Header>
            <Card.Body style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.notesByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} label>
                    {charts.notesByStatus.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="fw-semibold">Uploads per subject (top 8)</Card.Header>
            <Card.Body style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.uploadsPerSubject} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Notes" fill="#198754" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="fw-semibold">Most downloaded notes</Card.Header>
            <Card.Body style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topNotes} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 9 }} height={70} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="downloads" name="Downloads" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Header className="fw-semibold">Recent uploads</Card.Header>
        <Table responsive hover className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Uploader</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentNotes.map((n) => (
              <tr key={n._id}>
                <td>{n.title}</td>
                <td className="small">{n.subject?.name}</td>
                <td className="small">{n.uploadedBy?.name}</td>
                <td><StatusBadge status={n.status} /></td>
                <td className="small text-muted">{formatDate(n.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
