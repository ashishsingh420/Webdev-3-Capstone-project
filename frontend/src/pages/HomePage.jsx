import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { AuctionCard } from '../components/AuctionCard';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Electronics',
  'Art & Antiques',
  'Fashion & Jewelry',
  'Collectibles',
  'Vehicles',
  'Home & Garden',
  'Other'
];

export const HomePage = () => {
  const { isAuthenticated, isSeller, isAdmin } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controlled Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('endingSoonest');

  const loadAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await api.get(`/auctions?${params.toString()}`);
      if (response.success) {
        setAuctions(response.auctions || []);
      }
    } catch (err) {
      setError(err.message || 'Unable to load auctions');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, statusFilter, sortBy]);

  const loadLeaderboard = async () => {
    try {
      const response = await api.get('/users/leaderboard');
      if (response.success) {
        setLeaderboard(response.leaderboard || []);
      }
    } catch (err) {
      console.warn('Leaderboard fetch error:', err.message);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, [loadAuctions]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  return (
    <div className="home-page container">
      {/* Hero Showcase Section */}
      <section className="hero-banner glass-card">
        <div className="hero-content">
          <div className="hero-tag">⚡ Live Real-Time Bidding Engine</div>
          <h1 className="hero-title">
            Bid. Compete. <span className="text-gradient">Win Authenticated Valuables.</span>
          </h1>
          <p className="hero-desc">
            Place live bids on luxury watches, rare art, electronics, and vintage collectibles.
            Witness instant real-time countdowns and live Socket.io bid updates.
          </p>
          <div className="hero-actions">
            <a href="#marketplace-grid" className="btn btn-primary">
              Explore Active Auctions
            </a>
            {(isSeller || isAdmin) && (
              <Link to="/create-auction" className="btn btn-secondary">
                + Create Auction Listing
              </Link>
            )}
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-secondary">
                Join as Bidder / Seller
              </Link>
            )}
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <span className="stat-number">{auctions.filter(a => a.status === 'active').length}</span>
            <span className="stat-label">Active Auctions</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{auctions.reduce((acc, curr) => acc + (curr.bidCount || 0), 0)}</span>
            <span className="stat-label">Live Bids Placed</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">100%</span>
            <span className="stat-label">Server Validated</span>
          </div>
        </div>
      </section>

      {/* Controlled Search & Filter Bar */}
      <section className="filters-section glass-card" id="marketplace-grid">
        <div className="search-bar-row">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by item title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control search-input"
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>

          <div className="select-filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control select-control"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="ended">Concluded Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-control select-control"
            >
              <option value="endingSoonest">Ending Soonest</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="mostBids">Most Active (Bids)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="category-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Auction Listings Grid */}
      <section className="listings-section">
        {loading ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Loading live auctions...</p>
          </div>
        ) : error ? (
          <div className="glass-card error-box">
            <p>⚠️ {error}</p>
            <button className="btn btn-secondary btn-sm" onClick={loadAuctions}>Try Again</button>
          </div>
        ) : auctions.length === 0 ? (
          <div className="glass-card empty-state text-center">
            <span style={{ fontSize: '3rem' }}>🏷️</span>
            <h3>No Auctions Found</h3>
            <p>No listings matched your active search and category filters.</p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setStatusFilter('All');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="auction-grid">
            {auctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} />
            ))}
          </div>
        )}
      </section>

      {/* Top Bidders Leaderboard (MongoDB Aggregation Result) */}
      {leaderboard.length > 0 && (
        <section className="leaderboard-section glass-card">
          <div className="section-header">
            <div>
              <span className="badge badge-accent">Aggregation Pipeline</span>
              <h2>🏆 Top Bidders Leaderboard</h2>
            </div>
            <p className="text-muted">Ranked by total bidding participation and volume</p>
          </div>

          <div className="leaderboard-table-wrap">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Bidder Name</th>
                  <th>Total Bids Placed</th>
                  <th>Highest Single Bid</th>
                  <th>Total Bid Volume</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, index) => (
                  <tr key={item.userId}>
                    <td className="rank-cell">
                      {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                    </td>
                    <td className="bidder-cell">
                      <strong>{item.name}</strong>
                    </td>
                    <td><span className="badge badge-pill">{item.totalBidsCount} bids</span></td>
                    <td className="highlight-price">${item.highestSingleBid?.toLocaleString()}</td>
                    <td className="text-muted">${item.totalBidVolume?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
