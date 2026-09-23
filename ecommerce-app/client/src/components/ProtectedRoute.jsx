/**
 * Route guard.
 *
 * This is a usability measure, not a security control: the browser can be made
 * to render any component. Every protected resource is enforced again on the
 * server, which is where the real decision is taken.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, initialising } = useAuth();
  const location = useLocation();

  // Wait for the stored session to be verified; redirecting first would sign
  // out anybody who refreshed the page on a protected route.
  if (initialising) return <Loader label="Checking your session…" />;

  if (!isAuthenticated) {
    // `state.from` lets the login page send the visitor back where they were.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
