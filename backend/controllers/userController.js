const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { SystemError } = require('../middleware/errorMiddleware');

// Admin: Get all users
const fetchAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Update user role
const modifyUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['seller', 'bidder', 'admin'].includes(role)) {
      throw new SystemError('Invalid role specified', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new SystemError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Platform summary metrics (Aggregation)
const fetchPlatformSummary = async (req, res, next) => {
  try {
    const [userStats, auctionStats, totalBids, revenueStats] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Auction.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Bid.countDocuments(),
      Auction.aggregate([
        { $match: { status: 'ended', highestBidder: { $ne: null } } },
        {
          $group: {
            _id: null,
            totalGrossSales: { $sum: '$currentBid' },
            avgSellingPrice: { $avg: '$currentBid' },
            completedCount: { $sum: 1 }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      stats: {
        usersByRole: userStats,
        auctionsByStatus: auctionStats,
        totalBids,
        salesMetrics: revenueStats[0] || {
          totalGrossSales: 0,
          avgSellingPrice: 0,
          completedCount: 0
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Leaderboard: Top bidders aggregation
const fetchTopBiddersLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await Bid.aggregate([
      {
        $group: {
          _id: '$bidder',
          totalBidsCount: { $sum: 1 },
          highestSingleBid: { $max: '$amount' },
          totalBidVolume: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          _id: 0,
          name: '$user.name',
          email: '$user.email',
          totalBidsCount: 1,
          highestSingleBid: 1,
          totalBidVolume: 1
        }
      },
      { $sort: { totalBidsCount: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      leaderboard
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  fetchAllUsers,
  modifyUserRole,
  fetchPlatformSummary,
  fetchTopBiddersLeaderboard
};
