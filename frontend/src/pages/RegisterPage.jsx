import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'bidder'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await register(formData.name, formData.email, formData.password, formData.role);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container">
      <div className="glass-card auth-card">
        <div className="auth-header text-center">
          <span className="auth-icon">✨</span>
          <h2>Create Your BidZone Account</h2>
          <p className="text-muted">Join the premier platform for live real-time auctions.</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Alexander Wright"
              required
              minLength={2}
              maxLength={50}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@domain.com"
              required
              className="form-control"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                required
                minLength={6}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account Type / Primary Role *</label>
            <div className="role-selector-grid">
              <label className={`role-radio-label ${formData.role === 'bidder' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="bidder"
                  checked={formData.role === 'bidder'}
                  onChange={handleChange}
                />
                <div>
                  <strong>🏷️ Bidder</strong>
                  <p>Discover items, participate in real-time auctions, and win items.</p>
                </div>
              </label>

              <label className={`role-radio-label ${formData.role === 'seller' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="seller"
                  checked={formData.role === 'seller'}
                  onChange={handleChange}
                />
                <div>
                  <strong>📦 Seller</strong>
                  <p>Create auction listings, set reserve prices, and monitor sales.</p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="auth-footer text-center">
          <p className="text-muted">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
