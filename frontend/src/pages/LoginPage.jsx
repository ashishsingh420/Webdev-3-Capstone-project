import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // One-click demo credentials filler
  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="auth-page container">
      <div className="glass-card auth-card">
        <div className="auth-header text-center">
          <span className="auth-icon">🔐</span>
          <h2>Welcome Back to BidZone</h2>
          <p className="text-muted">Enter your credentials to manage auctions and place live bids.</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@bidzone.com"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Account'}
          </button>
        </form>

        {/* Demo Quick-Login Helper for Evaluators */}
        <div className="demo-credentials-box">
          <span className="demo-title">⚡ Quick Demo Logins (Click to autofill):</span>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="btn-demo"
              onClick={() => handleQuickFill('bidder@bidzone.com', 'Password123!')}
            >
              👤 Bidder (Sophia)
            </button>
            <button
              type="button"
              className="btn-demo"
              onClick={() => handleQuickFill('seller@bidzone.com', 'Password123!')}
            >
              🏷️ Seller (Marcus)
            </button>
            <button
              type="button"
              className="btn-demo"
              onClick={() => handleQuickFill('admin@bidzone.com', 'Password123!')}
            >
              🛡️ Admin (Eleanor)
            </button>
          </div>
        </div>

        <div className="auth-footer text-center">
          <p className="text-muted">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
