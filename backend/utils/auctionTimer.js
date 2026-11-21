const Auction = require('../models/Auction');

let socketInstance = null;

const setSocketServer = (io) => {
  socketInstance = io;
};

const evaluateExpiredAuctions = async () => {
  try {
    const currentTime = new Date();
    const expiredList = await Auction.find({
      status: 'active',
      endTime: { $lte: currentTime }
    }).populate('highestBidder', 'name email');

    for (const item of expiredList) {
      item.status = 'ended';
      item.winner = item.highestBidder ? item.highestBidder._id : null;
      await item.save();

      console.log(`[Timer] Auction closed automatically: "${item.title}". Winner: ${item.highestBidder ? item.highestBidder.name : 'None'}`);

      if (socketInstance) {
        socketInstance.to(`auction_${item._id}`).emit('auctionEnded', {
          auctionId: item._id,
          title: item.title,
          finalPrice: item.currentBid,
          winner: item.highestBidder
            ? { id: item.highestBidder._id, name: item.highestBidder.name, email: item.highestBidder.email }
            : null,
          status: 'ended'
        });
      }
    }
  } catch (err) {
    console.error('[Timer] Error processing auction expirations:', err.message);
  }
};

const launchAuctionWatcher = (io, intervalMs = 3000) => {
  setSocketServer(io);
  // Initial check
  evaluateExpiredAuctions();
  // Continuous periodic check
  return setInterval(evaluateExpiredAuctions, intervalMs);
};

module.exports = {
  setSocketServer,
  evaluateExpiredAuctions,
  launchAuctionWatcher
};
