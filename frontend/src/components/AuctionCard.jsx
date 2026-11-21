import React from 'react';
import { Link } from 'react-router-dom';
import { CountdownTimer } from './CountdownTimer';

export const AuctionCard = ({ auction }) => {
  const isEnded = auction.status === 'ended' || new Date(auction.endTime) <= new Date();

  return (
    <div className={`auction-card glass-card ${isEnded ? 'card-ended' : ''}`}>
      <div className="card-media-wrap">
        <img
          src={auction.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'}
          alt={auction.title}
          className="card-img"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="card-top-badges">
          <span className="badge badge-category">{auction.category}</span>
          {isEnded ? (
            <span className="badge badge-ended">Ended</span>
          ) : (
            <span className="badge badge-live">
              <span className="live-dot"></span> Live
            </span>
          )}
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title" title={auction.title}>
          <Link to={`/auctions/${auction._id}`}>{auction.title}</Link>
        </h3>

        <p className="card-desc">
          {auction.description.length > 95
            ? `${auction.description.substring(0, 95)}...`
            : auction.description}
        </p>

        <div className="card-meta">
          <div className="price-block">
            <span className="meta-label">{auction.bidCount > 0 ? 'Current Bid' : 'Starting Price'}</span>
            <span className="price-amount">${auction.currentBid?.toLocaleString()}</span>
          </div>
          <div className="bid-count-block">
            <span className="meta-label">Total Bids</span>
            <span className="bid-count-pill">{auction.bidCount || 0} bids</span>
          </div>
        </div>

        <div className="card-timer-row">
          <div className="timer-label">Time Remaining:</div>
          {isEnded ? (
            <span className="timer-ended">Auction Closed</span>
          ) : (
            <CountdownTimer endTime={auction.endTime} isCompact={true} />
          )}
        </div>

        <div className="card-actions">
          <Link to={`/auctions/${auction._id}`} className={`btn btn-block ${isEnded ? 'btn-secondary' : 'btn-primary'}`}>
            {isEnded ? 'View Results' : 'Place Bid & Enter Room'}
          </Link>
        </div>
      </div>
    </div>
  );
};
