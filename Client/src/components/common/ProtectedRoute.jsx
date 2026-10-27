import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Verifying security credentials..." />;
  }

  if (!isAuthenticated) {
    // Preserve intended target URL for seamless post-login redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || (user?.userType === 'admin' ? 'admin' : 'guest');
    const hasRole = allowedRoles.includes(userRole);

    if (!hasRole) {
      return (
        <div className="container py-5 text-center">
          <div className="card shadow-sm border-0 p-5 mx-auto" style={{ maxWidth: '500px' }}>
            <h3 className="text-danger fw-bold mb-2">Access Restricted</h3>
            <p className="text-muted">
              Your account does not possess the administrative privileges required to view this portal.
            </p>
            <div>
              <a href="/" className="btn btn-hp-gold">
                Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
