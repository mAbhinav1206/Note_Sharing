import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/**
 * AdminRoute - logged in AND role === 'admin'.
 * Students who open an admin URL are sent back home.
 */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
