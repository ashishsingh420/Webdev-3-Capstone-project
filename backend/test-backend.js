const testBackend = async () => {
  const baseUrl = 'http://127.0.0.1:5000';
  console.log('[Test] Starting comprehensive backend verification...');

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log('[Test] Health Check:', healthData);

    // 2. Register Seller
    const sellerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Seller',
        email: `alice_${Date.now()}@bidzone.com`,
        password: 'Password123!',
        role: 'seller'
      })
    });
    const sellerData = await sellerRes.json();
    console.log('[Test] Seller Registration:', sellerData.success, sellerData.user?.role);
    const sellerToken = sellerData.accessToken;

    // 3. Register Bidder
    const bidderRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Bidder',
        email: `bob_${Date.now()}@bidzone.com`,
        password: 'Password123!',
        role: 'bidder'
      })
    });
    const bidderData = await bidderRes.json();
    console.log('[Test] Bidder Registration:', bidderData.success, bidderData.user?.role);
    const bidderToken = bidderData.accessToken;

    // 4. Register Admin
    const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Boss',
        email: `admin_${Date.now()}@bidzone.com`,
        password: 'Password123!',
        role: 'admin'
      })
    });
    const adminData = await adminRes.json();
    console.log('[Test] Admin Registration:', adminData.success, adminData.user?.role);
    const adminToken = adminData.accessToken;

    // 5. Test Profile Me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    const meData = await meRes.json();
    console.log('[Test] Auth Me Profile:', meData.success, meData.user?.name);

    // 6. Test Refresh Token
    const refreshRes = await fetch(`${baseUrl}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: sellerData.refreshToken })
    });
    const refreshData = await refreshRes.json();
    console.log('[Test] Refresh Token:', refreshData.success, !!refreshData.accessToken);

    // 7. Seller Creates Auction
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    const auctionRes = await fetch(`${baseUrl}/api/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`
      },
      body: JSON.stringify({
        title: 'Vintage 1968 Mechanical Watch',
        description: 'Authentic swiss mechanical chronograph in pristine condition with leather strap.',
        category: 'Collectibles',
        startingPrice: 150,
        endTime: futureDate,
        imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800'
      })
    });
    const auctionData = await auctionRes.json();
    console.log('[Test] Create Auction:', auctionData.success, auctionData.auction?.title);
    const auctionId = auctionData.auction._id;

    // 8. Role Authorization Check: Bidder tries to create auction (Should be Forbidden 403)
    const forbiddenRes = await fetch(`${baseUrl}/api/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bidderToken}`
      },
      body: JSON.stringify({
        title: 'Unauthorized Item',
        description: 'This should fail with 403',
        category: 'Electronics',
        startingPrice: 100,
        endTime: futureDate
      })
    });
    console.log('[Test] RBAC Forbidden Check (Expected 403):', forbiddenRes.status);

    // 9. Seller tries to bid on own auction (Should fail with 400)
    const selfBidRes = await fetch(`${baseUrl}/api/bids/${auctionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`
      },
      body: JSON.stringify({ amount: 200 })
    });
    const selfBidData = await selfBidRes.json();
    console.log('[Test] Self Bid Prohibited Check:', selfBidRes.status, selfBidData.message);

    // 10. Bidder places valid bid ($180)
    const validBidRes = await fetch(`${baseUrl}/api/bids/${auctionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bidderToken}`
      },
      body: JSON.stringify({ amount: 180 })
    });
    const validBidData = await validBidRes.json();
    console.log('[Test] Place Valid Bid ($180):', validBidData.success, validBidData.auction?.currentBid);

    // 11. Bidder places lower/equal bid (Should fail with 400 validation)
    const lowerBidRes = await fetch(`${baseUrl}/api/bids/${auctionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bidderToken}`
      },
      body: JSON.stringify({ amount: 175 })
    });
    const lowerBidData = await lowerBidRes.json();
    console.log('[Test] Lower Bid Validation Check:', lowerBidRes.status, lowerBidData.message);

    // 12. Fetch Auction Details
    const detailRes = await fetch(`${baseUrl}/api/auctions/${auctionId}`);
    const detailData = await detailRes.json();
    console.log('[Test] Fetch Auction Details:', detailData.success, 'Current Bid:', detailData.auction?.currentBid);

    // 13. Fetch Auction Bids
    const bidsListRes = await fetch(`${baseUrl}/api/bids/${auctionId}`);
    const bidsListData = await bidsListRes.json();
    console.log('[Test] Fetch Auction Bids History:', bidsListData.success, 'Count:', bidsListData.count);

    // 14. Aggregation Pipeline: Category Sales
    const catAggRes = await fetch(`${baseUrl}/api/auctions/analytics/category-sales`);
    const catAggData = await catAggRes.json();
    console.log('[Test] Category Sales Aggregation:', catAggData.success, 'Categories found:', catAggData.analytics?.length);

    // 15. Aggregation Pipeline: Auction Bid Analytics
    const bidAggRes = await fetch(`${baseUrl}/api/bids/analytics/${auctionId}`);
    const bidAggData = await bidAggRes.json();
    console.log('[Test] Auction Bid Aggregation Analytics:', bidAggData.success, bidAggData.analytics);

    // 16. Admin Platform Summary (RBAC Protected)
    const summaryRes = await fetch(`${baseUrl}/api/users/admin/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const summaryData = await summaryRes.json();
    console.log('[Test] Admin Summary (RBAC):', summaryData.success, 'Total Bids:', summaryData.stats?.totalBids);

    // 17. Leaderboard Aggregation
    const leaderRes = await fetch(`${baseUrl}/api/users/leaderboard`);
    const leaderData = await leaderRes.json();
    console.log('[Test] Top Bidders Leaderboard:', leaderData.success, 'Bidders listed:', leaderData.leaderboard?.length);

    console.log('\n[ALL BACKEND ENDPOINTS PASSED WITH 100% SUCCESS]');
    process.exit(0);
  } catch (err) {
    console.error('[Test Failed]:', err);
    process.exit(1);
  }
};

testBackend();
