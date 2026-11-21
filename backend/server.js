require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const bidRoutes = require('./routes/bidRoutes');
const userRoutes = require('./routes/userRoutes');
const { handleNotFoundRoute, handleGlobalError } = require('./middleware/errorMiddleware');
const { configureBidSocket } = require('./controllers/bidController');
const { launchAuctionWatcher } = require('./utils/auctionTimer');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with permitted CORS origins
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  }
});

// Configure Socket reference inside controllers and start auction watcher
configureBidSocket(io);
launchAuctionWatcher(io, 3000);

// Connect to Database
connectDB();

// Built-in Express CORS Middleware without external libraries
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io Connection Events
io.on('connection', (socket) => {
  socket.on('joinAuction', (auctionId) => {
    if (auctionId) {
      socket.join(`auction_${auctionId}`);
    }
  });

  socket.on('leaveAuction', (auctionId) => {
    if (auctionId) {
      socket.leave(`auction_${auctionId}`);
    }
  });

  socket.on('disconnect', () => {
    // Clean disconnection
  });
});

// System health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'BidZone Auction Engine'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/users', userRoutes);

// Centralized error handling
app.use(handleNotFoundRoute);
app.use(handleGlobalError);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[BidZone Engine] Server running in ${process.env.NODE_ENV || 'development'} on port ${PORT}`);
});

module.exports = { app, server };
