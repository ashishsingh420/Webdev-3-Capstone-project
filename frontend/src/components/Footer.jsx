import React from 'react';

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="brand-logo">
            <span className="brand-gavel">⚡</span>
            <span className="brand-text">Bid<span className="brand-accent">Zone</span></span>
          </div>
          <p className="footer-tagline">
            Next-generation real-time online auction platform powered by WebSockets, MongoDB Aggregation pipelines, and JWT authentication.
          </p>
        </div>

        <div className="footer-tech-stack">
          <h4>Core Technology Stack</h4>
          <div className="tech-badges">
            <span className="tech-tag">MongoDB & Mongoose</span>
            <span className="tech-tag">Express.js (MVC)</span>
            <span className="tech-tag">React 18 & Context API</span>
            <span className="tech-tag">Socket.IO Real-time</span>
            <span className="tech-tag">JWT Access & Refresh</span>
            <span className="tech-tag">Bcrypt Hashing</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} BidZone Auction Platform. Built for Capstone Project.</p>
          <p className="footer-author">Senior MERN Architecture</p>
        </div>
      </div>
    </footer>
  );
};
