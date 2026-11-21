import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const Navbar = () => {
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="site-header">
      <div className="header-inner container">
        <Link to="/" className="brand-logo">
          <span className="brand-gavel">⚡</span>
          <span className="brand-text">Bid<span className="brand-accent">Zone</span></span>
        </Link>

        {/* Real-time server connection indicator */}
        <div className="socket-pill" title={isConnected ? 'Real-time WebSocket active' : 'Connecting to live events...'}>
          <span className={`socket-dot ${isConnected ? 'online' : 'offline'}`}></span>
          <span className="socket-text">{isConnected ? 'LIVE FEED' : 'CONNECTING'}</span>
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>

        <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMobileMenuOpen(false)}>
            Marketplace
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMobileMenuOpen(false)}>
            Category Insights
          </NavLink>

          {isAuthenticated ? (
            <>
              {(isSeller || isAdmin) && (
                <>
                  <NavLink to="/create-auction" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMobileMenuOpen(false)}>
                    + List Auction
                  </NavLink>
                  <NavLink to="/my-listings" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMobileMenuOpen(false)}>
                    My Listings
                  </NavLink>
                </>
              )}

              <NavLink to="/my-bids" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')} onClick={() => setMobileMenuOpen(false)}>
                My Bids & Won
              </NavLink>

              {isAdmin && (
                <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-item admin-link active' : 'nav-item admin-link')} onClick={() => setMobileMenuOpen(false)}>
                  Admin Center
                </NavLink>
              )}

              <div className="user-profile-badge">
                <span className="user-name">{user.name.split(' ')[0]}</span>
                <span className={`role-tag role-${user.role}`}>{user.role}</span>
                <button onClick={handleLogout} className="btn-logout" title="Sign Out">
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary btn-sm" onClick={() => setMobileMenuOpen(false)}>
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMobileMenuOpen(false)}>
                Create Account
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
