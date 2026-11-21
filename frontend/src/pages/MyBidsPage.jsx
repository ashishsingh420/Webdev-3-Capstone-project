import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MyBidsPage = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/bids/my/activity');
        if (res.success) {
          setBids(res.myBids || []);
          setWonAuctions(res.wonAuctions || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch bidding history');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading your personal bid portfolio...</p>
      </div>
    );
  }

  return (
    <div className="my-bids-page container">
      <div className="page-header-row">
        <div>
          <span className="badge badge-accent">Bidder Portfolio</span>
          <h2>My Bids & Won Auctions</h2>
          <p className="text-muted">Track your live bids, leading positions, and completed acquisitions.</p>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">⚠️ {error}</div>
      )}

      {/* Won Auctions Showcase */}
      {wonAuctions.length > 0 && (
        <section className="won-auctions-section">
          <div className="section-title-wrap">
            <span className="trophy-emoji">🏆</span>
            <h3>Acquisitions Won ({wonAuctions.length})</h3>
          </div>

          <div className="won-cards-grid">
            {wonAuctions.map((item) => (
              <div key={item._id} className="glass-card won-auction-card">
                <div className="won-card-badge">WINNER</div>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="won-card-img"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="won-card-body">
                  <h4><Link to={`/auctions/${item._id}`}>{item.title}</Link></h4>
                  <div className="won-card-price">
                    Winning Bid: <span className="highlight-price">${item.currentBid?.toLocaleString()}</span>
                  </div>
                  <div className="won-card-seller text-muted">
                    Sold by: {item.seller?.name || 'Verified Merchant'}
                  </div>
                  <Link to={`/auctions/${item._id}`} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                    View Item Record
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full Bidding Log Table */}
      <section className="bids-history-section">
        <div className="section-title-wrap">
          <span className="gavel-emoji">🔨</span>
          <h3>All Placed Bids ({bids.length})</h3>
        </div>

        {bids.length === 0 ? (
          <div className="glass-card empty-state text-center">
            <span style={{ fontSize: '3rem' }}>🏷️</span>
            <h3>No Bids Placed Yet</h3>
            <p>You haven't participated in any auctions yet. Explore active auctions in the marketplace!</p>
            <Link to="/" className="btn btn-primary">Browse Marketplace</Link>
          </div>
        ) : (
          <div className="glass-card table-card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Target Auction</th>
                    <th>Category</th>
                    <th>My Bid Amount</th>
                    <th>Current Highest Bid</th>
                    <th>My Position</th>
                    <th>Auction Status</th>
                    <th>Bid Timestamp</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b) => {
                    const auction = b.auction;
                    if (!auction) return null;

                    const isHighest = auction.currentBid === b.amount;
                    const isClosed = auction.status === 'ended';

                    return (
                      <tr key={b._id}>
                        <td>
                          <strong>
                            <Link to={`/auctions/${auction._id}`}>{auction.title}</Link>
                          </strong>
                        </td>
                        <td><span className="badge badge-category">{auction.category}</span></td>
                        <td className="highlight-price">${b.amount?.toLocaleString()}</td>
                        <td>${auction.currentBid?.toLocaleString()}</td>
                        <td>
                          {isHighest ? (
                            <span className="badge badge-gold">Leading</span>
                          ) : (
                            <span className="badge badge-pill">Outbid</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${isClosed ? 'status-ended' : 'status-active'}`}>
                            {isClosed ? 'Closed' : 'Active'}
                          </span>
                        </td>
                        <td className="text-muted">
                          {new Date(b.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <Link to={`/auctions/${auction._id}`} className="btn btn-secondary btn-sm">
                            {isClosed ? 'Results' : isHighest ? 'View Room' : 'Increase Bid'}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
