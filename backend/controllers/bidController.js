const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const { SystemError } = require('../middleware/errorMiddleware');

let socketInstance = null;
const configureBidSocket = (io) => {
  socketInstance = io;
};

// Place a new bid on an active auction
const submitBid = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;

    const bidValue = Number(amount);
    if (isNaN(bidValue) || bidValue <= 0) {
      throw new SystemError('Please submit a valid bid amount', 400);
    }

    const auction = await Auction.findById(auctionId).populate('seller', 'name email');
    if (!auction) {
      throw new SystemError('Auction not found', 404);
    }

    // Check if auction is active
    if (auction.status !== 'active') {
      throw new SystemError(`Cannot place bid. Auction status is ${auction.status}`, 400);
    }

    // Check if auction has expired
    if (new Date() >= new Date(auction.endTime)) {
      auction.status = 'ended';
      auction.winner = auction.highestBidder ? auction.highestBidder : null;
      await auction.save();
      throw new SystemError('Cannot place bid. This auction has already ended', 400);
    }

    // Rule: Seller cannot bid on their own auction
    if (auction.seller._id.toString() === req.user._id.toString()) {
      throw new SystemError('Sellers are prohibited from bidding on their own listings', 400);
    }

    // Validation: Bid must exceed current highest bid (or starting price if 0 bids)
    if (auction.bidCount === 0) {
      if (bidValue < auction.startingPrice) {
        throw new SystemError(`Initial bid must be at least the starting price of $${auction.startingPrice}`, 400);
      }
    } else {
      if (bidValue <= auction.currentBid) {
        throw new SystemError(`Bid must be strictly higher than current bid of $${auction.currentBid}`, 400);
      }
    }

    // Create Bid record
    const newBid = await Bid.create({
      auction: auction._id,
      bidder: req.user._id,
      amount: bidValue
    });

    // Update Auction state
    auction.currentBid = bidValue;
    auction.highestBidder = req.user._id;
    auction.bidCount += 1;
    await auction.save();

    const populatedBid = await newBid.populate('bidder', 'name email role');

    // Broadcast live bid update via Socket.IO
    if (socketInstance) {
      socketInstance.to(`auction_${auction._id}`).emit('bidUpdated', {
        auctionId: auction._id,
        currentBid: auction.currentBid,
        highestBidder: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email
        },
        bidCount: auction.bidCount,
        newBid: {
          id: populatedBid._id,
          amount: populatedBid.amount,
          createdAt: populatedBid.createdAt,
          bidder: {
            id: req.user._id,
            name: req.user.name
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      bid: populatedBid,
      auction: {
        id: auction._id,
        currentBid: auction.currentBid,
        bidCount: auction.bidCount,
        highestBidder: req.user.name
      }
    });
  } catch (err) {
    next(err);
  }
};

// Fetch full bid history for an auction
const fetchAuctionBids = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    const bids = await Bid.find({ auction: auctionId })
      .populate('bidder', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bids.length,
      bids
    });
  } catch (err) {
    next(err);
  }
};

// Fetch bidder's own bidding activity and won auctions
const fetchMyBiddingActivity = async (req, res, next) => {
  try {
    const myBids = await Bid.find({ bidder: req.user._id })
      .populate({
        path: 'auction',
        select: 'title category currentBid endTime status imageUrl winner',
        populate: { path: 'winner', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    const wonAuctions = await Auction.find({
      winner: req.user._id,
      status: 'ended'
    }).populate('seller', 'name email');

    res.status(200).json({
      success: true,
      bidsCount: myBids.length,
      wonCount: wonAuctions.length,
      myBids,
      wonAuctions
    });
  } catch (err) {
    next(err);
  }
};

// Aggregation Pipeline Query: Bid history analytics for a specific auction
const fetchAuctionBidAnalytics = async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new SystemError('Invalid auction identifier', 400);
    }

    const analytics = await Bid.aggregate([
      {
        $match: { auction: new mongoose.Types.ObjectId(auctionId) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'bidder',
          foreignField: '_id',
          as: 'bidderDetails'
        }
      },
      {
        $unwind: '$bidderDetails'
      },
      {
        $group: {
          _id: '$bidder',
          bidderName: { $first: '$bidderDetails.name' },
          totalBidsPlaced: { $sum: 1 },
          highestBidByBidder: { $max: '$amount' },
          firstBidTime: { $min: '$createdAt' },
          lastBidTime: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          bidderId: '$_id',
          _id: 0,
          bidderName: 1,
          totalBidsPlaced: 1,
          highestBidByBidder: 1,
          firstBidTime: 1,
          lastBidTime: 1
        }
      },
      {
        $sort: { highestBidByBidder: -1 }
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

module.exports = {
  configureBidSocket,
  submitBid,
  fetchAuctionBids,
  fetchMyBiddingActivity,
  fetchAuctionBidAnalytics
};
