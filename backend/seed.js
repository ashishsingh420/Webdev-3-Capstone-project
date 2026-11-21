require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Auction = require('./models/Auction');
const Bid = require('./models/Bid');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seeder] Connected to database');

    // Clean existing data
    await Promise.all([
      User.deleteMany({}),
      Auction.deleteMany({}),
      Bid.deleteMany({})
    ]);

    console.log('[Seeder] Cleared previous records');

    // 1. Create Users
    const admin = await User.create({
      name: 'Eleanor Vance (Admin)',
      email: 'admin@bidzone.com',
      password: 'Password123!',
      role: 'admin'
    });

    const seller = await User.create({
      name: 'Marcus Sterling (Seller)',
      email: 'seller@bidzone.com',
      password: 'Password123!',
      role: 'seller'
    });

    const bidder1 = await User.create({
      name: 'Sophia Chen (Bidder)',
      email: 'bidder@bidzone.com',
      password: 'Password123!',
      role: 'bidder'
    });

    const bidder2 = await User.create({
      name: 'David Miller (Bidder)',
      email: 'david@bidzone.com',
      password: 'Password123!',
      role: 'bidder'
    });

    console.log('[Seeder] Created Users (Admin, Seller, 2 Bidders)');

    const now = Date.now();

    // 2. Create Auctions
    const auctionsData = [
      {
        title: 'Rolex Submariner Date 41mm Oystersteel',
        description: 'Authentic 2023 Rolex Submariner Date with black Cerachrom ceramic bezel and black dial. Complete with original green box, guarantee card, manual booklets, and serialized hangtag. Never polished.',
        category: 'Fashion & Jewelry',
        startingPrice: 8500,
        currentBid: 9200,
        seller: seller._id,
        highestBidder: bidder1._id,
        bidCount: 3,
        startTime: new Date(now - 3600 * 1000 * 5),
        endTime: new Date(now + 3600 * 1000 * 24), // 24 hours from now
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80'
      },
      {
        title: 'Original Oil on Canvas: Nocturne in Azure',
        description: 'Museum-grade framed original oil on canvas artwork by acclaimed contemporary expressionist artist. Signed lower right with Certificate of Authenticity. Measures 36x48 inches.',
        category: 'Art & Antiques',
        startingPrice: 1200,
        currentBid: 1450,
        seller: seller._id,
        highestBidder: bidder2._id,
        bidCount: 2,
        startTime: new Date(now - 3600 * 1000 * 10),
        endTime: new Date(now + 3600 * 1000 * 48), // 48 hours
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80'
      },
      {
        title: 'Sony Alpha 7R V Full-Frame Mirrorless Camera',
        description: 'Flagship 61MP full-frame mirrorless camera with AI-driven subject recognition autofocus and 8K 24p video recording. Shutter count under 1,500. Includes two Sony batteries and dual charger.',
        category: 'Electronics',
        startingPrice: 2400,
        currentBid: 2650,
        seller: seller._id,
        highestBidder: bidder1._id,
        bidCount: 4,
        startTime: new Date(now - 3600 * 1000 * 12),
        endTime: new Date(now + 3600 * 1000 * 18), // 18 hours
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80'
      },
      {
        title: '1974 First Edition Sealed Comic Book - CGC 9.6',
        description: 'Key bronze-age collectible certified and graded 9.6 Near Mint+ by CGC with pristine white pages. Sealed in tamper-evident archival acrylic case.',
        category: 'Collectibles',
        startingPrice: 750,
        currentBid: 750,
        seller: seller._id,
        highestBidder: null,
        bidCount: 0,
        startTime: new Date(now - 3600 * 1000 * 2),
        endTime: new Date(now + 3600 * 1000 * 72), // 72 hours
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=1000&q=80'
      },
      {
        title: 'Restored 1967 Vespa Sprint 150 Scooter',
        description: 'Completely frame-off restored classic Italian scooter in Celeste Blue. Engine rebuilt with original Piaggio parts. Runs smooth, street registered and road ready.',
        category: 'Vehicles',
        startingPrice: 4200,
        currentBid: 4900,
        seller: seller._id,
        highestBidder: bidder2._id,
        bidCount: 5,
        startTime: new Date(now - 3600 * 1000 * 72),
        endTime: new Date(now + 3600 * 1000 * 6), // 6 hours
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80'
      },
      {
        title: 'Apple MacBook Pro 16" M3 Max (64GB RAM / 1TB)',
        description: 'Space Black M3 Max MacBook Pro in flawless condition. AppleCare+ valid until late 2027. Battery health at 99%. Includes 140W USB-C power brick and braided MagSafe 3 cable.',
        category: 'Electronics',
        startingPrice: 2800,
        currentBid: 3100,
        seller: seller._id,
        highestBidder: bidder1._id,
        bidCount: 3,
        startTime: new Date(now - 3600 * 1000 * 96),
        endTime: new Date(now - 3600 * 1000 * 4), // Ended 4 hours ago
        status: 'ended',
        winner: bidder1._id,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80'
      }
    ];

    const createdAuctions = await Auction.insertMany(auctionsData);
    console.log(`[Seeder] Created ${createdAuctions.length} auctions`);

    // 3. Create Sample Bids for the active & ended auctions
    const sampleBids = [
      // Bids on Rolex
      { auction: createdAuctions[0]._id, bidder: bidder2._id, amount: 8700, createdAt: new Date(now - 3600 * 1000 * 4) },
      { auction: createdAuctions[0]._id, bidder: bidder1._id, amount: 9000, createdAt: new Date(now - 3600 * 1000 * 3) },
      { auction: createdAuctions[0]._id, bidder: bidder1._id, amount: 9200, createdAt: new Date(now - 3600 * 1000 * 1) },

      // Bids on Oil Painting
      { auction: createdAuctions[1]._id, bidder: bidder1._id, amount: 1300, createdAt: new Date(now - 3600 * 1000 * 8) },
      { auction: createdAuctions[1]._id, bidder: bidder2._id, amount: 1450, createdAt: new Date(now - 3600 * 1000 * 6) },

      // Bids on Sony Camera
      { auction: createdAuctions[2]._id, bidder: bidder2._id, amount: 2500, createdAt: new Date(now - 3600 * 1000 * 9) },
      { auction: createdAuctions[2]._id, bidder: bidder1._id, amount: 2650, createdAt: new Date(now - 3600 * 1000 * 5) },

      // Bids on Vespa
      { auction: createdAuctions[4]._id, bidder: bidder1._id, amount: 4400, createdAt: new Date(now - 3600 * 1000 * 20) },
      { auction: createdAuctions[4]._id, bidder: bidder2._id, amount: 4900, createdAt: new Date(now - 3600 * 1000 * 10) },

      // Bids on MacBook (Ended)
      { auction: createdAuctions[5]._id, bidder: bidder2._id, amount: 2950, createdAt: new Date(now - 3600 * 1000 * 50) },
      { auction: createdAuctions[5]._id, bidder: bidder1._id, amount: 3100, createdAt: new Date(now - 3600 * 1000 * 20) }
    ];

    await Bid.insertMany(sampleBids);
    console.log(`[Seeder] Seeded ${sampleBids.length} bids across auctions`);

    console.log('\n[SEED COMPLETED SUCCESSFULLY]');
    console.log('Test Accounts:');
    console.log(' - Admin:  admin@bidzone.com  / Password123!');
    console.log(' - Seller: seller@bidzone.com / Password123!');
    console.log(' - Bidder: bidder@bidzone.com / Password123!');
    console.log(' - Bidder2: david@bidzone.com  / Password123!');

    process.exit(0);
  } catch (err) {
    console.error('[Seeder Error]:', err);
    process.exit(1);
  }
};

seedData();
