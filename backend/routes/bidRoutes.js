const express = require('express');
const router = express.Router();
const {
  submitBid,
  fetchAuctionBids,
  fetchMyBiddingActivity,
  fetchAuctionBidAnalytics
} = require('../controllers/bidController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// User's own bidding activity
router.get('/my/activity', authenticate, fetchMyBiddingActivity);

// Aggregation analytics for bids in an auction
router.get('/analytics/:auctionId', fetchAuctionBidAnalytics);

// Fetch all bids for an auction
router.get('/:auctionId', fetchAuctionBids);

// Place a new bid (Bidder or Admin)
router.post(
  '/:auctionId',
  authenticate,
  authorizeRoles('bidder', 'admin'),
  submitBid
);

module.exports = router;
