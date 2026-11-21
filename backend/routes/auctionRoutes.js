const express = require('express');
const router = express.Router();
const {
  fetchAllAuctions,
  fetchAuctionById,
  createAuction,
  modifyAuction,
  removeAuction,
  fetchCategorySalesAnalytics,
  fetchSellerListings
} = require('../controllers/auctionController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Aggregation analytics route (must come before /:id)
router.get('/analytics/category-sales', fetchCategorySalesAnalytics);

// Seller listings
router.get(
  '/seller/my-listings',
  authenticate,
  authorizeRoles('seller', 'admin'),
  fetchSellerListings
);

// General auction CRUD routes
router.get('/', fetchAllAuctions);
router.get('/:id', fetchAuctionById);

router.post(
  '/',
  authenticate,
  authorizeRoles('seller', 'admin'),
  createAuction
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles('seller', 'admin'),
  modifyAuction
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('seller', 'admin'),
  removeAuction
);

module.exports = router;
