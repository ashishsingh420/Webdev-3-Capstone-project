import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auctions/analytics/category-sales');
        if (res.success) {
          setAnalytics(res.analytics || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Executing MongoDB aggregation pipeline...</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...analytics.map((a) => a.totalSalesRevenue || 0), 1);
  const totalVolume = analytics.reduce((acc, curr) => acc + (curr.totalSalesRevenue || 0), 0);
  const totalListings = analytics.reduce((acc, curr) => acc + (curr.totalListings || 0), 0);

  return (
    <div className="analytics-page container">
      <div className="page-header-row">
        <div>
          <span className="badge badge-accent">Database Analytics</span>
          <h2>Category Sales & Volume Analytics</h2>
          <p className="text-muted">Real-time marketplace insights powered by MongoDB Aggregation Pipelines.</p>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">⚠️ {error}</div>
      )}

      {/* Aggregate KPI Summary Cards */}
      <div className="dashboard-metrics-grid">
        <div className="glass-card metric-card">
          <span className="metric-icon">📊</span>
          <div>
            <div className="metric-val">${totalVolume.toLocaleString()}</div>
            <div className="metric-lbl">Total Realized Revenue</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <span className="metric-icon">📑</span>
          <div>
            <div className="metric-val">{totalListings}</div>
            <div className="metric-lbl">Total Catalog Items</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <span className="metric-icon">🎯</span>
          <div>
            <div className="metric-val">{analytics.length}</div>
            <div className="metric-lbl">Active Categories</div>
          </div>
        </div>
      </div>

      {/* Custom Responsive Revenue Bar Visualization (Pure CSS/SVG - no external libs) */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <h3>Gross Sales Revenue by Category</h3>
          <span className="badge badge-pill">Aggregation Output</span>
        </div>

        <div className="custom-bar-chart">
          {analytics.map((item) => {
            const barPercent = Math.round((item.totalSalesRevenue / maxRevenue) * 100);
            return (
              <div key={item.category} className="chart-row">
                <div className="chart-category-label">
                  <strong>{item.category}</strong>
                  <span className="cat-sub">({item.totalListings} items)</span>
                </div>
                <div className="chart-bar-track">
                  <div
                    className="chart-bar-fill"
                    style={{ width: `${Math.max(barPercent, 6)}%` }}
                  >
                    <span className="bar-val-text">${item.totalSalesRevenue?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Aggregation Results Table */}
      <div className="glass-card table-card" style={{ marginTop: '2rem' }}>
        <div className="card-header-inner">
          <h3>Category Breakdown Data Matrix</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Listings</th>
                <th>Active Live</th>
                <th>Concluded</th>
                <th>Gross Realized Sales</th>
                <th>Avg Current Bid</th>
                <th>Peak Bid Recorded</th>
                <th>Bids Placed</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((row) => (
                <tr key={row.category}>
                  <td><strong>{row.category}</strong></td>
                  <td>{row.totalListings}</td>
                  <td><span className="badge badge-live">{row.activeListings}</span></td>
                  <td><span className="badge badge-ended">{row.endedListings}</span></td>
                  <td className="highlight-price">${row.totalSalesRevenue?.toLocaleString()}</td>
                  <td>${row.averageCurrentBid?.toLocaleString()}</td>
                  <td>${row.highestBidRecorded?.toLocaleString()}</td>
                  <td><span className="badge badge-pill">{row.totalBidsSum} bids</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architectural Query Deep-Dive Section */}
      <div className="glass-card tech-explainer-card" style={{ marginTop: '2rem' }}>
        <h3>⚙️ MongoDB Aggregation Pipeline Architecture</h3>
        <p className="text-muted">
          This dashboard executes a multi-stage aggregation pipeline across the <code>auctions</code> collection:
        </p>
        <pre className="code-block">
{`db.auctions.aggregate([
  {
    $group: {
      _id: "$category",
      totalListings: { $sum: 1 },
      activeListings: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
      endedListings: { $sum: { $cond: [{ $eq: ["$status", "ended"] }, 1, 0] } },
      totalSalesRevenue: {
        $sum: {
          $cond: [
            { $and: [{ $eq: ["$status", "ended"] }, { $ne: ["$highestBidder", null] }] },
            "$currentBid",
            0
          ]
        }
      },
      averageCurrentBid: { $avg: "$currentBid" },
      highestBidRecorded: { $max: "$currentBid" },
      totalBidsSum: { $sum: "$bidCount" }
    }
  },
  { $sort: { totalSalesRevenue: -1 } }
]);`}
        </pre>
      </div>
    </div>
  );
};
