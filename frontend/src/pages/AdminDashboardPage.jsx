import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, usersRes] = await Promise.all([
        api.get('/users/admin/summary'),
        api.get('/users')
      ]);

      if (summaryRes.success) setStats(summaryRes.stats);
      if (usersRes.success) setUsers(usersRes.users || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin controls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.patch(`/users/${userId}/role`, { role: newRole });
      if (res.success) {
        setFeedback(`Role for user updated to ${newRole}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading administrative telemetry...</p>
      </div>
    );
  }

  const totalUsers = stats?.usersByRole?.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const activeAuctions = stats?.auctionsByStatus?.find((s) => s._id === 'active')?.count || 0;
  const grossSales = stats?.salesMetrics?.totalGrossSales || 0;

  return (
    <div className="admin-page container">
      <div className="page-header-row">
        <div>
          <span className="badge badge-accent">Admin RBAC Protected</span>
          <h2>Platform Management & Telemetry</h2>
          <p className="text-muted">Oversee platform users, system revenue, and system-wide auction health.</p>
        </div>
      </div>

      {feedback && (
        <div className="alert-box alert-success">✅ {feedback}</div>
      )}
      {error && (
        <div className="alert-box alert-error">⚠️ {error}</div>
      )}

      {/* Admin KPI Matrix */}
      <div className="dashboard-metrics-grid">
        <div className="glass-card metric-card">
          <span className="metric-icon">👥</span>
          <div>
            <div className="metric-val">{totalUsers}</div>
            <div className="metric-lbl">Registered Platform Users</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <span className="metric-icon">🟢</span>
          <div>
            <div className="metric-val">{activeAuctions}</div>
            <div className="metric-lbl">Active Live Auctions</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <span className="metric-icon">🔨</span>
          <div>
            <div className="metric-val">{stats?.totalBids || 0}</div>
            <div className="metric-lbl">Total Bids Processed</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <span className="metric-icon">💎</span>
          <div>
            <div className="metric-val">${grossSales.toLocaleString()}</div>
            <div className="metric-lbl">Total Gross Auction Sales</div>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-card table-card" style={{ marginTop: '2rem' }}>
        <div className="card-header-inner">
          <h3>Registered Users Management</h3>
          <span className="badge badge-pill">{users.length} accounts</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Current Role</th>
                <th>Registered On</th>
                <th>Role Reassignment</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td className="text-muted">{u.email}</td>
                  <td>
                    <span className={`role-tag role-${u.role}`}>{u.role}</span>
                  </td>
                  <td className="text-muted">
                    {new Date(u.createdAt).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="form-control select-control-sm"
                    >
                      <option value="bidder">Bidder</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
