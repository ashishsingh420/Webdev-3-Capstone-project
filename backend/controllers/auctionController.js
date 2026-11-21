const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { SystemError } = require('../middleware/errorMiddleware');

// Get all auctions with filters, search, and sorting
const fetchAllAuctions = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      minPrice,
      maxPrice,
      sortBy,
      page = 1,
      limit = 20
    } = req.query;

    const queryFilter = {};

    if (search) {
      queryFilter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      queryFilter.category = category;
    }

    if (status && status !== 'All') {
      queryFilter.status = status;
    }

    if (minPrice || maxPrice) {
      queryFilter.currentBid = {};
      if (minPrice) queryFilter.currentBid.$gte = Number(minPrice);
      if (maxPrice) queryFilter.currentBid.$lte = Number(maxPrice);
    }

    let sortConfig = { createdAt: -1 };
    if (sortBy === 'endingSoonest') {
      sortConfig = { endTime: 1 };
    } else if (sortBy === 'priceLow') {
      sortConfig = { currentBid: 1 };
    } else if (sortBy === 'priceHigh') {
      sortConfig = { currentBid: -1 };
    } else if (sortBy === 'mostBids') {
      sortConfig = { bidCount: -1 };
    }

    const skipCount = (Number(page) - 1) * Number(limit);

    const [auctions, totalCount] = await Promise.all([
      Auction.find(queryFilter)
        .populate('seller', 'name email role')
        .populate('highestBidder', 'name email')
        .populate('winner', 'name email')
        .sort(sortConfig)
        .skip(skipCount)
        .limit(Number(limit)),
      Auction.countDocuments(queryFilter)
    ]);

    res.status(200).json({
      success: true,
      count: auctions.length,
      total: totalCount,
      page: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)) || 1,
      auctions
    });
  } catch (err) {
    next(err);
  }
};

// Get single auction details
const fetchAuctionById = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'name email role')
      .populate('highestBidder', 'name email')
      .populate('winner', 'name email');

    if (!auction) {
      throw new SystemError('Auction item not found', 404);
    }

    // Auto-update status if time has already passed
    if (auction.status === 'active' && new Date(auction.endTime) <= new Date()) {
      auction.status = 'ended';
      auction.winner = auction.highestBidder ? auction.highestBidder._id : null;
      await auction.save();
    }

    res.status(200).json({
      success: true,
      auction
    });
  } catch (err) {
    next(err);
  }
};

// Create a new auction item (Seller or Admin)
const createAuction = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      startingPrice,
      endTime,
      imageUrl
    } = req.body;

    if (!title || !description || !category || !startingPrice || !endTime) {
      throw new SystemError('Title, description, category, starting price, and end time are required', 400);
    }

    const parsedPrice = Number(startingPrice);
    if (isNaN(parsedPrice) || parsedPrice < 1) {
      throw new SystemError('Starting price must be a valid number of at least 1', 400);
    }

    const parsedEndTime = new Date(endTime);
    if (isNaN(parsedEndTime.getTime()) || parsedEndTime <= new Date()) {
      throw new SystemError('End time must be a valid future date and time', 400);
    }

    const auction = await Auction.create({
      title,
      description,
      category,
      startingPrice: parsedPrice,
      currentBid: parsedPrice,
      endTime: parsedEndTime,
      seller: req.user._id,
      imageUrl: imageUrl || ''
    });

    const populated = await auction.populate('seller', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Auction item listed successfully',
      auction: populated
    });
  } catch (err) {
    next(err);
  }
};

// Update auction item (Owner or Admin)
const modifyAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      throw new SystemError('Auction item not found', 404);
    }

    const isOwner = auction.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new SystemError('You do not have permission to modify this auction', 403);
    }

    if (auction.bidCount > 0 && !isAdmin) {
      // Disallow changing price once bids exist
      if (req.body.startingPrice && req.body.startingPrice !== auction.startingPrice) {
        throw new SystemError('Cannot alter starting price after bids have been placed', 400);
      }
    }

    const allowedFields = ['title', 'description', 'category', 'imageUrl'];
    if (auction.bidCount === 0 || isAdmin) {
      allowedFields.push('startingPrice', 'endTime', 'status');
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'startingPrice') {
          auction.startingPrice = Number(req.body[field]);
          if (auction.bidCount === 0) {
            auction.currentBid = Number(req.body[field]);
          }
        } else if (field === 'endTime') {
          auction.endTime = new Date(req.body[field]);
        } else {
          auction[field] = req.body[field];
        }
      }
    });

    await auction.save();
    const updated = await auction.populate('seller', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Auction details updated',
      auction: updated
    });
  } catch (err) {
    next(err);
  }
};

// Delete auction item (Owner or Admin)
const removeAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      throw new SystemError('Auction item not found', 404);
    }

    const isOwner = auction.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new SystemError('You are not authorized to delete this auction', 403);
    }

    await Bid.deleteMany({ auction: auction._id });
    await Auction.findByIdAndDelete(auction._id);

    res.status(200).json({
      success: true,
      message: 'Auction item and associated bids removed'
    });
  } catch (err) {
    next(err);
  }
};

// Aggregation Pipeline Query: Category-wise sales and auction distribution
const fetchCategorySalesAnalytics = async (req, res, next) => {
  try {
    const analytics = await Auction.aggregate([
      {
        $group: {
          _id: '$category',
          totalListings: { $sum: 1 },
          activeListings: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          endedListings: {
            $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
          },
          totalSalesRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'ended'] },
                    { $ne: ['$highestBidder', null] }
                  ]
                },
                '$currentBid',
                0
              ]
            }
          },
          averageCurrentBid: { $avg: '$currentBid' },
          highestBidRecorded: { $max: '$currentBid' },
          totalBidsSum: { $sum: '$bidCount' }
        }
      },
      {
        $project: {
          category: '$_id',
          _id: 0,
          totalListings: 1,
          activeListings: 1,
          endedListings: 1,
          totalSalesRevenue: { $round: ['$totalSalesRevenue', 2] },
          averageCurrentBid: { $round: ['$averageCurrentBid', 2] },
          highestBidRecorded: 1,
          totalBidsSum: 1
        }
      },
      {
        $sort: { totalSalesRevenue: -1, totalListings: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics
    });
  } catch (err) {
    next(err);
  }
};

// Seller's own listings
const fetchSellerListings = async (req, res, next) => {
  try {
    const listings = await Auction.find({ seller: req.user._id })
      .populate('highestBidder', 'name email')
      .populate('winner', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: listings.length,
      auctions: listings
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  fetchAllAuctions,
  fetchAuctionById,
  createAuction,
  modifyAuction,
  removeAuction,
  fetchCategorySalesAnalytics,
  fetchSellerListings
};
