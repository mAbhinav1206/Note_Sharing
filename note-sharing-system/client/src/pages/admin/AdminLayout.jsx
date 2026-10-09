import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Card from 'react-bootstrap/Card';
import { NavLink, Outlet } from 'react-router-dom';

/**
 * Admin area layout - fixed sidebar + content area.
 * Nested routes (/admin/users, /admin/notes, ...) render inside <Outlet/>.
 */
export default function AdminLayout() {
  const items = [
    ['/admin', '📊 Dashboard', true],
    ['/admin/notes', '📝 Note moderation', false],
    ['/admin/reports', '🚩 Reports', false],
    ['/admin/users', '👥 Users', false],
    ['/admin/courses', '🎓 Courses', false],
    ['/admin/subjects', '📚 Subjects', false],
    ['/admin/categories', '🏷️ Categories', false],
  ];

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={3} lg={2} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-dark text-white fw-semibold">Admin Panel</Card.Header>
            <Nav variant="pills" className="flex-column p-2">
              {items.map(([to, label, end]) => (
                <Nav.Link
                  key={to}
                  as={NavLink}
                  to={to}
                  end={end}
                  className="rounded"
                >
                  {label}
                </Nav.Link>
              ))}
            </Nav>
          </Card>
        </Col>
        <Col md={9} lg={10}>
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
}
