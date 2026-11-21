import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const CATEGORIES = [
  'Electronics',
  'Art & Antiques',
  'Fashion & Jewelry',
  'Collectibles',
  'Vehicles',
  'Home & Garden',
  'Other'
];

export const CreateAuctionPage = () => {
  const navigate = useNavigate();

  // Controlled Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    startingPrice: '',
    endTime: '',
    imageUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set default minimum datetime to 1 hour from now
  const minDateTime = new Date(Date.now() + 60 * 1000 * 5)
    .toISOString()
    .slice(0, 16);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const price = Number(formData.startingPrice);
    if (isNaN(price) || price < 1) {
      setError('Starting price must be a valid number of at least $1');
      return;
    }

    const end = new Date(formData.endTime);
    if (isNaN(end.getTime()) || end <= new Date()) {
      setError('Please select an end time in the future');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auctions', {
        ...formData,
        startingPrice: price
      });

      if (res.success && res.auction) {
        navigate(`/auctions/${res.auction._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to list auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page container">
      <div className="glass-card form-container">
        <div className="form-header">
          <span className="badge badge-accent">Seller Console</span>
          <h2>Create New Auction Listing</h2>
          <p className="text-muted">Fill out the specifications below to initiate a live bidding chamber.</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label className="form-label">Item Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. 1968 Vintage Chronograph Watch"
              required
              minLength={3}
              maxLength={100}
              className="form-control"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="form-control"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Starting Price ($ USD) *</label>
              <input
                type="number"
                name="startingPrice"
                value={formData.startingPrice}
                onChange={handleChange}
                placeholder="100"
                required
                min={1}
                step="any"
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Auction Conclusion Date & Time *</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              min={minDateTime}
              required
              className="form-control"
            />
            <small className="form-hint">The auction will automatically terminate and designate the highest bidder as the winner at this exact time.</small>
          </div>

          <div className="form-group">
            <label className="form-label">Item Image URL</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="form-control"
            />
          </div>

          {/* Real-time image preview */}
          {formData.imageUrl && (
            <div className="image-preview-box">
              <span className="preview-label">Live Image Preview:</span>
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="preview-img"
                onError={(e) => { e.target.style.display = 'none'; }}
                onLoad={(e) => { e.target.style.display = 'block'; }}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Item Description & Provenance *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Detail the condition, history, included accessories, and authenticity guarantee..."
              required
              minLength={10}
              maxLength={3000}
              className="form-control"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Publishing Listing...' : 'Publish Auction to Live Marketplace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
