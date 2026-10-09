import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { avatarUrl } from '../api/user';

/**
 * Role-aware navigation bar.
 *  - everyone:      Browse, Top Notes
 *  - logged in:     Dashboard, Upload, My Notes, Profile
 *  - admin only:    Admin Panel
 *
 * The links are rendered ONCE inside <Navbar.Collapse>. react-bootstrap
 * turns that into the hamburger menu on small screens and a normal row on
 * large screens automatically - so we never duplicate the links.
 */
export default function AppNavbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const links = (
    <>
      <Nav.Link as={NavLink} to="/notes">Browse Notes</Nav.Link>
      <Nav.Link as={NavLink} to="/top-notes">Top Notes</Nav.Link>
      {user && (
        <>
          <Nav.Link as={NavLink} to="/dashboard">Dashboard</Nav.Link>
          <Nav.Link as={NavLink} to="/upload">Upload</Nav.Link>
          <Nav.Link as={NavLink} to="/my-notes">My Notes</Nav.Link>
        </>
      )}
      {user?.role === 'admin' && (
        <Nav.Link as={NavLink} to="/admin">Admin Panel</Nav.Link>
      )}
    </>
  );

  const account = user ? (
    <>
      <Nav.Link as={Link} to="/profile" className="d-flex align-items-center gap-2">
        {user.avatar ? (
          <img src={avatarUrl(user._id)} alt="" width={28} height={28} className="rounded-circle" />
        ) : (
          <span
            className="bg-secondary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
            style={{ width: 28, height: 28, fontSize: 13 }}
          >
            {user.name?.[0]?.toUpperCase()}
          </span>
        )}
        <span>{user.name.split(' ')[0]}</span>
        {user.role === 'admin' && <Badge bg="warning" text="dark">Admin</Badge>}
      </Nav.Link>
      <Button variant="outline-light" size="sm" className="ms-lg-2" onClick={handleLogout}>
        Logout
      </Button>
    </>
  ) : (
    <>
      <Nav.Link as={Link} to="/login">Login</Nav.Link>
      <Nav.Link as={Link} to="/register">
        <Button variant="primary" size="sm">Register</Button>
      </Nav.Link>
    </>
  );

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          📚 NoteShare
        </Navbar.Brand>

        {/* Toggle + Collapse are wired together by react-bootstrap automatically. */}
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto" navbar>
            {links}
          </Nav>
          <Nav className="align-items-lg-center" navbar>
            {account}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
