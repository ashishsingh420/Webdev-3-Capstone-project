const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction',
      required: [true, 'Bid must belong to an auction']
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Bid must belong to a bidder']
    },
    amount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [1, 'Bid amount must be greater than 0']
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookup of auction bid histories and user bidding activity
bidSchema.index({ auction: 1, amount: -1 });
bidSchema.index({ bidder: 1, createdAt: -1 });
bidSchema.index({ auction: 1, createdAt: -1 });

const Bid = mongoose.model('Bid', bidSchema);
module.exports = Bid;
