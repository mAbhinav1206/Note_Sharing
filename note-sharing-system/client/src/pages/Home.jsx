import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Landing page with a short pitch and quick links. */
export default function Home() {
  const { user } = useAuth();

  return (
    <Container className="py-5">
      <Row className="align-items-center text-center text-lg-start">
        <Col lg={7}>
          <h1 className="fw-bold">Student Note Sharing System</h1>
          <p className="lead text-muted">
            Upload your class notes, help your juniors, and discover the best
            notes shared by other students - searchable by course, semester,
            subject and category.
          </p>
          <div className="d-flex gap-2 justify-content-center justify-content-lg-start">
            <Button as={Link} to="/notes" variant="primary" size="lg">
              Browse Notes
            </Button>
            {!user && (
              <Button as={Link} to="/register" variant="outline-primary" size="lg">
                Create an account
              </Button>
            )}
            {user && (
              <Button as={Link} to="/upload" variant="outline-primary" size="lg">
                Upload notes
              </Button>
            )}
          </div>
        </Col>
        <Col lg={5} className="mt-4 mt-lg-0">
          <Row className="g-2">
            {[
              ['📤', 'Upload & Share', 'PDF, DOCX, PPT and images - up to 10 MB'],
              ['🔍', 'Smart Search', 'Filter by course, semester, subject, category'],
              ['⭐', 'Rate & Review', '1-5 stars and reviews on every note'],
              ['🛡️', 'Moderated', 'Admin approves every upload before it goes public'],
            ].map(([icon, title, text]) => (
              <Col xs={12} key={title}>
                <Card className="shadow-sm border-0">
                  <Card.Body className="d-flex gap-3 align-items-center py-3">
                    <div style={{ fontSize: 26 }}>{icon}</div>
                    <div>
                      <div className="fw-semibold">{title}</div>
                      <div className="text-muted small">{text}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Container>
  );
}
