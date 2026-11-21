import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export const MyListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const loadListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/auctions/seller/my-listings');
      if (res.success) {
        setListings(res.auctions || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch seller listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleDelete = async (auctionId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/auctions/${auctionId}`);
      if (res.success) {
        setActionMessage(`"${title}" was successfully deleted.`);
        setListings((prev) => prev.filter((item) => item._id !== auctionId));
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete auction');
    }
  };

  const activeCount = listings.filter((a) => a.status === 'active').length;
  const totalRevenue = listings
    .filter((a) => a.status === 'ended' && a.highestBidder)
    .reduce((sum, a) => sum + (a.currentBid || 0), 0);

  return (
    <div className="my-listings-page container">
      <div className="page-header-row">
        <div>
          <span className="badge badge-accent">Seller Dashboard</span>
          <h2>My Auction Listings</h2>
          <p className="text-muted">Manage your inventory, monitor bids, and review closed sales.</p>
        </div>
        <Link to="/create-auction" className="btn btn-primary">
          + Create New Listing
        </Link>
      </div>

      {actionMessage && (
        <div className="alert-box alert-success">
          ✅ {actionMessage}
        </div>
      )}

      {/* Seller Summary Metrics */}
      <div className="dashboard-metrics-grid">
        <div className="glass-card metric-card">
          <span className="metric-icon">📦</span>
          <div>
            <div className="metric-val">{listings.length}</div>
            <div className="metric-lbl">Total Items Listed</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <span className="metric-icon">🟢</span>
          <div>
            <div className="metric-val">{activeCount}</div>
            <div className="metric-lbl">Active Live Auctions</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <span className="metric-icon">💰</span>
          <div>
            <div className="metric-val">${totalRevenue.toLocaleString()}</div>
            <div className="metric-lbl">Realized Closed Sales</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Retrieving seller catalog...</p>
        </div>
      ) : error ? (
        <div className="glass-card error-box">
          <p>⚠️ {error}</p>
          <button className="btn btn-secondary btn-sm" onClick={loadListings}>Retry</button>
        </div>
      ) : listings.length === 0 ? (
        <div className="glass-card empty-state text-center">
          <span style={{ fontSize: '3rem' }}>🏷️</span>
          <h3>No Listings Yet</h3>
          <p>You haven't listed any auctions yet. Start by creating your first listing!</p>
          <Link to="/create-auction" className="btn btn-primary">
            + List Your First Auction
          </Link>
        </div>
      ) : (
        <div className="glass-card table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th>Category</th>
                  <th>Starting Price</th>
                  <th>Current Highest Bid</th>
                  <th>Bids</th>
                  <th>Status</th>
                  <th>Conclusion Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => {
                  const isClosed = item.status === 'ended' || new Date(item.endTime) <= new Date();
                  return (
                    <tr key={item._id}>
                      <td className="item-title-cell">
                        <div className="listing-item-flex">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="table-thumbnail"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <strong>
                              <Link to={`/auctions/${item._id}`}>{item.title}</Link>
                            </strong>
                            <div className="sub-text">ID: {item._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-category">{item.category}</span></td>
                      <td>${item.startingPrice?.toLocaleString()}</td>
                      <td className="highlight-price">${item.currentBid?.toLocaleString()}</td>
                      <td><span className="badge badge-pill">{item.bidCount} bids</span></td>
                      <td>
                        <span className={`status-pill ${isClosed ? 'status-ended' : 'status-active'}`}>
                          {isClosed ? 'Concluded' : 'Active'}
                        </span>
                      </td>
                      <td className="text-muted">
                        {new Date(item.endTime).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="actions-cell">
                        <div className="action-button-group">
                          <Link to={`/auctions/${item._id}`} className="btn-icon" title="View live room">
                            👁️
                          </Link>
                          <Link to={`/edit-auction/${item._id}`} className="btn-icon" title="Edit specifications">
                            ✏️
                          </Link>
                          <button
                            onClick={() => handleDelete(item._id, item.title)}
                            className="btn-icon btn-icon-danger"
                            title="Delete listing"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
