import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin' && user.role !== 'super_admin') {
    // Redirect to authorized page based on role if trying to access unauthorized page
    if (user.role === 'staff_pendaftaran') return <Navigate to="/" replace />;
    if (user.role === 'dokter') return <Navigate to="/doctor" replace />;
    if (user.role === 'kasir') return <Navigate to="/billing" replace />;
    if (user.role === 'manajemen') return <Navigate to="/reports" replace />;
    
    return <Navigate to="/" replace />;
  }

  return children;
}
