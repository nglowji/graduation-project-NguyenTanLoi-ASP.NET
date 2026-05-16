import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 1 | 2 | 3 | 4 | Array<1 | 2 | 3 | 4>; // 4=PitchStaff
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#00C896]" size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : null;

  if (allowedRoles && !allowedRoles.includes(user?.role as 1 | 2 | 3 | 4)) {
    // Redirect đến đúng dashboard của role họ
    if (user?.role === 3) return <Navigate to="/dashboard/admin" replace />;
    if (user?.role === 2) return <Navigate to="/dashboard/owner" replace />;
    if (user?.role === 4) return <Navigate to="/dashboard/owner/bookings" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
