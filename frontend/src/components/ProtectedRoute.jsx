import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="unauthorized-page container">
        <div className="glass-card text-center" style={{ padding: '3rem', maxWidth: '540px', margin: '4rem auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h2>Access Restricted</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>
            Your account role (<strong>{user.role}</strong>) does not have authorization to view this section.
          </p>
          <a href="/" className="btn btn-primary">Return to Marketplace</a>
        </div>
      </div>
    );
  }

  return children;
};
