const { io } = require('../frontend/node_modules/socket.io-client');

const testEndToEnd = async () => {
  const baseUrl = 'http://127.0.0.1:5000';
  console.log('[E2E Test] Starting live Socket.io and auction flow test...');

  try {
    // 1. Login as Bidder
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bidder@bidzone.com', password: 'Password123!' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error('Bidder login failed: ' + loginData.message);
    const token = loginData.accessToken;
    console.log('[E2E Test] Bidder authenticated successfully:', loginData.user.name);

    // 2. Fetch all active auctions
    const auctionsRes = await fetch(`${baseUrl}/api/auctions?status=active`);
    const auctionsData = await auctionsRes.json();
    const activeAuction = auctionsData.auctions[0];
    if (!activeAuction) throw new Error('No active auction found for E2E testing');
    console.log(`[E2E Test] Selected Auction: "${activeAuction.title}" (Current Bid: $${activeAuction.currentBid})`);

    // 3. Connect real-time WebSocket client
    const socket = io(baseUrl, { transports: ['websocket', 'polling'] });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('[E2E Test] Socket connected to server with ID:', socket.id);
        resolve();
      });
    });

    // 4. Join Auction Room
    socket.emit('joinAuction', activeAuction._id);
    console.log(`[E2E Test] Joined WebSocket room for auction ${activeAuction._id}`);

    // 5. Setup Promise to capture live 'bidUpdated' broadcast
    const newBidAmount = activeAuction.currentBid + 100;
    const bidBroadcastPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for socket bidUpdated event')), 6000);
      socket.on('bidUpdated', (data) => {
        clearTimeout(timeout);
        console.log('[E2E Test] RECEIVED LIVE SOCKET BROADCAST:');
        console.log(' - Auction ID:', data.auctionId);
        console.log(' - New Current Bid:', data.currentBid);
        console.log(' - Leading Bidder:', data.highestBidder?.name);
        console.log(' - Total Bid Count:', data.bidCount);
        resolve(data);
      });
    });

    // 6. Submit HTTP Bid
    console.log(`[E2E Test] Submitting new bid of $${newBidAmount}...`);
    const bidRes = await fetch(`${baseUrl}/api/bids/${activeAuction._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount: newBidAmount })
    });
    const bidData = await bidRes.json();
    if (!bidData.success) throw new Error('Failed to submit bid: ' + bidData.message);
    console.log('[E2E Test] HTTP Bid API response:', bidData.success, 'New Bid:', bidData.bid?.amount);

    // 7. Await live WebSocket confirmation
    const receivedBroadcast = await bidBroadcastPromise;
    if (receivedBroadcast.currentBid !== newBidAmount) {
      throw new Error(`Broadcast bid mismatch: expected ${newBidAmount}, got ${receivedBroadcast.currentBid}`);
    }

    console.log('[E2E Test] Socket.IO real-time broadcast verified with 100% accuracy!');
    socket.disconnect();
    console.log('\n[ALL E2E REAL-TIME TESTS PASSED SUCCESSFULLY]');
    process.exit(0);
  } catch (err) {
    console.error('[E2E Test Error]:', err);
    process.exit(1);
  }
};

testEndToEnd();
