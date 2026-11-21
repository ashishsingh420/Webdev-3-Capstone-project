import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { CountdownTimer } from '../components/CountdownTimer';

export const AuctionDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { socket, joinAuctionRoom, leaveAuctionRoom } = useSocket();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAnalytics, setBidAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controlled Bid Form State
  const [bidAmount, setBidAmount] = useState('');
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidFeedback, setBidFeedback] = useState({ type: '', message: '' });
  const [recentBidFlash, setRecentBidFlash] = useState(false);

  // Fetch auction details, bid history, and aggregation analytics
  const fetchAuctionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [auctionRes, bidsRes, analyticsRes] = await Promise.all([
        api.get(`/auctions/${id}`),
        api.get(`/bids/${id}`),
        api.get(`/bids/analytics/${id}`).catch(() => ({ analytics: [] }))
      ]);

      if (auctionRes.success) {
        setAuction(auctionRes.auction);
        // Pre-fill bid amount with recommended next bid
        const nextMin = (auctionRes.auction.currentBid || auctionRes.auction.startingPrice) + 10;
        setBidAmount(String(nextMin));
      }
      if (bidsRes.success) {
        setBids(bidsRes.bids || []);
      }
      if (analyticsRes.success) {
        setBidAnalytics(analyticsRes.analytics || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load auction data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAuctionData();
  }, [fetchAuctionData]);

  // Real-time WebSocket room subscription & live event listeners
  useEffect(() => {
    if (!socket || !id) return;

    joinAuctionRoom(id);

    const handleBidUpdated = (data) => {
      if (data.auctionId === id) {
        setAuction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentBid: data.currentBid,
            highestBidder: data.highestBidder,
            bidCount: data.bidCount
          };
        });

        if (data.newBid) {
          setBids((prev) => [data.newBid, ...prev]);
        }

        // Trigger visual flash indicator
        setRecentBidFlash(true);
        setTimeout(() => setRecentBidFlash(false), 2000);

        // Update default input to next increment
        setBidAmount(String(data.currentBid + 10));
      }
    };

    const handleAuctionEnded = (data) => {
      if (data.auctionId === id) {
        setAuction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'ended',
            winner: data.winner
          };
        });
      }
    };

    socket.on('bidUpdated', handleBidUpdated);
    socket.on('auctionEnded', handleAuctionEnded);

    return () => {
      socket.off('bidUpdated', handleBidUpdated);
      socket.off('auctionEnded', handleAuctionEnded);
      leaveAuctionRoom(id);
    };
  }, [socket, id, joinAuctionRoom, leaveAuctionRoom]);

  // Handle Controlled Bid Placement
  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setBidFeedback({ type: '', message: '' });

    const numAmount = Number(bidAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setBidFeedback({ type: 'error', message: 'Please enter a valid numeric amount' });
      return;
    }

    if (numAmount <= auction.currentBid && auction.bidCount > 0) {
      setBidFeedback({
        type: 'error',
        message: `Your bid must be greater than current highest bid of $${auction.currentBid.toLocaleString()}`
      });
      return;
    }

    try {
      setBidSubmitting(true);
      const res = await api.post(`/bids/${id}`, { amount: numAmount });
      if (res.success) {
        setBidFeedback({
          type: 'success',
          message: `Bid of $${numAmount.toLocaleString()} placed successfully! You are now leading.`
        });
        // Re-fetch analytics in background
        api.get(`/bids/analytics/${id}`).then((res) => {
          if (res.success) setBidAnalytics(res.analytics);
        });
      }
    } catch (err) {
      setBidFeedback({
        type: 'error',
        message: err.message || 'Failed to submit bid'
      });
    } finally {
      setBidSubmitting(false);
    }
  };

  const handleQuickIncrement = (increment) => {
    const current = auction ? auction.currentBid : 0;
    setBidAmount(String(current + increment));
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Connecting to live auction chamber...</p>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="container" style={{ margin: '4rem auto' }}>
        <div className="glass-card error-box text-center">
          <h2>Auction Unavailable</h2>
          <p>{error || 'Auction not found'}</p>
          <Link to="/" className="btn btn-secondary">Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  const isEnded = auction.status === 'ended' || new Date(auction.endTime) <= new Date();
  const isSeller = user && auction.seller && auction.seller._id === user.id;
  const isWinning = user && auction.highestBidder && (auction.highestBidder._id === user.id || auction.highestBidder.id === user.id);

  return (
    <div className="auction-detail-page container">
      {/* Navigation Breadcrumb */}
      <nav className="detail-breadcrumb">
        <Link to="/">Marketplace</Link> <span>/</span>
        <span className="current">{auction.category}</span> <span>/</span>
        <span className="current">{auction.title}</span>
      </nav>

      {/* Winner Announcement Banner if Concluded */}
      {isEnded && (
        <div className="winner-announcement-banner glass-card">
          <div className="trophy-icon">🏆</div>
          <div className="winner-info">
            <h2>Auction Concluded</h2>
            {auction.winner || auction.highestBidder ? (
              <p>
                Winner:{' '}
                <strong>
                  {auction.winner ? auction.winner.name : auction.highestBidder.name}
                </strong>{' '}
                with final winning bid of{' '}
                <span className="highlight-price">${auction.currentBid?.toLocaleString()}</span>
                {isWinning && <span className="badge badge-accent" style={{ marginLeft: '0.75rem' }}>🎉 That's you!</span>}
              </p>
            ) : (
              <p>Auction concluded with no bids placed.</p>
            )}
          </div>
        </div>
      )}

      {/* Main Two-Column Showcase */}
      <div className="detail-grid">
        {/* Left Column: Media & Specifications */}
        <div className="detail-left">
          <div className="glass-card image-viewer-card">
            <img
              src={auction.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80'}
              alt={auction.title}
              className="detail-hero-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            <div className="image-overlay-badges">
              <span className="badge badge-category">{auction.category}</span>
              {isEnded ? (
                <span className="badge badge-ended">Closed</span>
              ) : (
                <span className="badge badge-live">
                  <span className="live-dot"></span> Live Bidding
                </span>
              )}
            </div>
          </div>

          <div className="glass-card item-description-card">
            <h3>Item Specifications & Provenance</h3>
            <p className="item-description-text">{auction.description}</p>

            <div className="seller-box">
              <div className="seller-avatar">👤</div>
              <div>
                <span className="seller-label">Listed by Verified Seller</span>
                <h4 className="seller-name">{auction.seller?.name || 'Verified Merchant'}</h4>
                <span className="seller-email">{auction.seller?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Bidding Console */}
        <div className="detail-right">
          {/* Current Bid & Real-time Countdown Card */}
          <div className={`glass-card live-console-card ${recentBidFlash ? 'flash-update' : ''}`}>
            <div className="live-status-header">
              <span className="section-eyebrow">Real-Time Auction Chamber</span>
              {isEnded ? (
                <span className="status-pill status-ended">Ended</span>
              ) : (
                <span className="status-pill status-active">● Active</span>
              )}
            </div>

            <h1 className="item-headline">{auction.title}</h1>

            <div className="price-display-panel">
              <div>
                <span className="price-label">
                  {auction.bidCount > 0 ? 'Current Highest Bid' : 'Starting Price'}
                </span>
                <div className="price-value-row">
                  <span className="price-value">${auction.currentBid?.toLocaleString()}</span>
                  <span className="badge badge-pill">{auction.bidCount} Bids</span>
                </div>
              </div>

              {auction.highestBidder && (
                <div className="leading-bidder-indicator">
                  <span className="indicator-label">Leading Bidder:</span>
                  <span className="indicator-name">
                    {auction.highestBidder.name || 'Anonymous Bidder'}
                    {isWinning && ' (You)'}
                  </span>
                </div>
              )}
            </div>

            {/* Live Countdown Timer */}
            <div className="timer-panel">
              <span className="timer-title">Time Until Auction Close:</span>
              {isEnded ? (
                <div className="timer-expired-notice">Auction has officially closed.</div>
              ) : (
                <CountdownTimer
                  endTime={auction.endTime}
                  onEnd={() => {
                    setAuction((prev) => (prev ? { ...prev, status: 'ended' } : prev));
                  }}
                />
              )}
            </div>

            {/* Controlled Live Bidding Form */}
            {!isEnded && (
              <div className="bid-entry-panel">
                {bidFeedback.message && (
                  <div className={`alert-box alert-${bidFeedback.type}`}>
                    {bidFeedback.type === 'error' ? '⚠️ ' : '✅ '}
                    {bidFeedback.message}
                  </div>
                )}

                {!isAuthenticated ? (
                  <div className="auth-prompt-card text-center">
                    <p>You must be signed in with a Bidder account to submit live bids.</p>
                    <div className="auth-prompt-buttons">
                      <Link to="/login" className="btn btn-secondary btn-sm">Log In</Link>
                      <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
                    </div>
                  </div>
                ) : isSeller ? (
                  <div className="info-box text-center">
                    ℹ️ You are the seller of this auction. Sellers cannot bid on their own listings.
                  </div>
                ) : (
                  <form onSubmit={handlePlaceBid} className="bid-form">
                    <label className="form-label" htmlFor="bidAmountInput">
                      Enter Your Offer (USD):
                    </label>

                    <div className="bid-input-group">
                      <span className="input-currency">$</span>
                      <input
                        id="bidAmountInput"
                        type="number"
                        min={auction.currentBid + 1}
                        step="1"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min: $${auction.currentBid + 1}`}
                        required
                        className="form-control bid-input"
                      />
                      <button
                        type="submit"
                        disabled={bidSubmitting || Number(bidAmount) <= auction.currentBid}
                        className="btn btn-primary btn-submit-bid"
                      >
                        {bidSubmitting ? 'Verifying...' : 'Submit Live Bid'}
                      </button>
                    </div>

                    {/* Quick increment buttons */}
                    <div className="quick-increments">
                      <span className="quick-label">Quick Add:</span>
                      <button type="button" onClick={() => handleQuickIncrement(25)} className="btn-chip">+ $25</button>
                      <button type="button" onClick={() => handleQuickIncrement(50)} className="btn-chip">+ $50</button>
                      <button type="button" onClick={() => handleQuickIncrement(100)} className="btn-chip">+ $100</button>
                      <button type="button" onClick={() => handleQuickIncrement(250)} className="btn-chip">+ $250</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Live Bid History Feed */}
          <div className="glass-card live-feed-card">
            <div className="feed-header">
              <h3>Live Bid History</h3>
              <span className="badge badge-pill">{bids.length} records</span>
            </div>

            {bids.length === 0 ? (
              <p className="no-bids-message">No bids placed yet. Be the first to place a bid!</p>
            ) : (
              <div className="bids-list-scroll">
                {bids.map((bid, idx) => (
                  <div key={bid._id || idx} className={`bid-feed-item ${idx === 0 ? 'highest-bid' : ''}`}>
                    <div className="bid-rank">#{idx + 1}</div>
                    <div className="bid-info">
                      <div className="bidder-title">
                        {bid.bidder?.name || 'Bidder'}
                        {idx === 0 && <span className="badge badge-gold">Leading</span>}
                      </div>
                      <div className="bid-timestamp">
                        {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                    <div className="bid-amount-val">${bid.amount?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aggregation Pipeline Analytics: Bidder Behavior */}
          {bidAnalytics.length > 0 && (
            <div className="glass-card analytics-mini-card">
              <div className="feed-header">
                <span className="badge badge-accent">Aggregation Query</span>
                <h4>Bidder Analytics for this Item</h4>
              </div>
              <table className="custom-table table-mini">
                <thead>
                  <tr>
                    <th>Bidder</th>
                    <th>Total Bids</th>
                    <th>Max Bid</th>
                  </tr>
                </thead>
                <tbody>
                  {bidAnalytics.map((stat) => (
                    <tr key={stat.bidderId}>
                      <td>{stat.bidderName}</td>
                      <td>{stat.totalBidsPlaced}</td>
                      <td className="highlight-price">${stat.highestBidByBidder?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
