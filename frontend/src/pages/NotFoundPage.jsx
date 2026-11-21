import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="container" style={{ margin: '6rem auto', textAlign: 'center' }}>
      <div className="glass-card" style={{ padding: '4rem 2rem', maxWidth: '540px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧭</div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>404</h1>
        <h2>Chamber Not Found</h2>
        <p className="text-muted" style={{ margin: '1rem 0 2rem' }}>
          The auction listing or platform page you requested does not exist or has been relocated.
        </p>
        <Link to="/" className="btn btn-primary">Return to Marketplace</Link>
      </div>
    </div>
  );
};
