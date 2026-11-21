import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export const EditAuctionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startingPrice: '',
    endTime: '',
    imageUrl: '',
    bidCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/auctions/${id}`);
        if (res.success && res.auction) {
          const item = res.auction;
          setFormData({
            title: item.title,
            description: item.description,
            category: item.category,
            startingPrice: item.startingPrice,
            endTime: item.endTime ? new Date(item.endTime).toISOString().slice(0, 16) : '',
            imageUrl: item.imageUrl || '',
            bidCount: item.bidCount || 0
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch auction details');
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      const updatePayload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        imageUrl: formData.imageUrl
      };

      if (formData.bidCount === 0) {
        updatePayload.startingPrice = Number(formData.startingPrice);
        updatePayload.endTime = new Date(formData.endTime);
      }

      const res = await api.put(`/auctions/${id}`, updatePayload);
      if (res.success) {
        navigate(`/auctions/${id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to update auction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading auction data for editing...</p>
      </div>
    );
  }

  return (
    <div className="form-page container">
      <div className="glass-card form-container">
        <div className="form-header">
          <span className="badge badge-accent">Manage Listing</span>
          <h2>Edit Auction Listing</h2>
          <p className="text-muted">Modify item specifications and imagery.</p>
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
              <label className="form-label">
                Starting Price ($ USD)
                {formData.bidCount > 0 && ' (Locked - bids active)'}
              </label>
              <input
                type="number"
                name="startingPrice"
                value={formData.startingPrice}
                onChange={handleChange}
                disabled={formData.bidCount > 0}
                required
                min={1}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Auction End Date & Time
              {formData.bidCount > 0 && ' (Locked - bids active)'}
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              disabled={formData.bidCount > 0}
              required
              className="form-control"
            />
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

          <div className="form-group">
            <label className="form-label">Item Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
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
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving Changes...' : 'Save & Update Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
