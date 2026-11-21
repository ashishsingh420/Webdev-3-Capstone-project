const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Auction title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Auction description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [3000, 'Description cannot exceed 3000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Electronics',
          'Art & Antiques',
          'Fashion & Jewelry',
          'Collectibles',
          'Vehicles',
          'Home & Garden',
          'Other'
        ],
        message: '{VALUE} is not a supported category'
      }
    },
    startingPrice: {
      type: Number,
      required: [true, 'Starting price is required'],
      min: [1, 'Starting price must be at least 1']
    },
    currentBid: {
      type: Number,
      required: true,
      default: function () {
        return this.startingPrice;
      }
    },
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Auction must have a seller']
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date,
      required: [true, 'Auction end time is required'],
      validate: {
        validator: function (value) {
          const start = this.startTime || new Date();
          return value > start;
        },
        message: 'End time must be after the start time'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'ended', 'cancelled'],
        message: '{VALUE} is not a valid auction status'
      },
      default: 'active'
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    imageUrl: {
      type: String,
      default: ''
    },
    bidCount: {
      type: Number,
      default: 0,
      min: [0, 'Bid count cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Compound and single field indexes for high performance querying
auctionSchema.index({ category: 1, status: 1 });
auctionSchema.index({ endTime: 1, status: 1 });
auctionSchema.index({ seller: 1, createdAt: -1 });
auctionSchema.index({ currentBid: 1 });

const Auction = mongoose.model('Auction', auctionSchema);
module.exports = Auction;
