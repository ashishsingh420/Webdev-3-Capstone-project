# BidZone – Online Auction Platform

**Student Name:** Ashish Singh
**Course:** Web Development 3 (MERN Stack Capstone)  
**Project:** #29 BidZone – Online Auction Platform

[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%7C%20Socket.IO-6366f1.svg)](#technology-stack)
[![Architecture](https://img.shields.io/badge/Architecture-MVC%20Backend%20%2B%20Vite%20React-10b981.svg)](#backend-architecture)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#license)

**BidZone** is a production-grade real-time online auction platform engineered with the MERN stack and Socket.IO. Sellers list authenticated items for auction with starting reserve prices and fixed conclusion times, while prospective buyers place live bids against an active countdown timer. Bids and auction conclusions are processed and broadcast instantaneously to all connected participants.

---

## Table of Contents

1. [Deployed Links](#1-deployed-links)
2. [Key Features](#2-key-features)
3. [Technology Stack](#3-technology-stack)
4. [Backend Architecture (MVC)](#4-backend-architecture-mvc)
5. [Database Architecture & Indexes](#5-database-architecture--indexes)
6. [Authentication & Authorization (RBAC)](#6-authentication--authorization-rbac)
7. [Real-Time Bidding Engine (Socket.IO)](#7-real-time-bidding-engine-socketio)
8. [Aggregation Pipeline Analytics](#8-aggregation-pipeline-analytics)
9. [Environment Variables](#9-environment-variables)
10. [Installation & Quick Start](#10-installation--quick-start)
11. [Postman API Collection](#11-postman-api-collection)
12. [API Reference Documentation](#12-api-reference-documentation)
13. [Engineering Assumptions](#13-engineering-assumptions)
14. [Viva & Technical Demo Guide](#14-viva--technical-demo-guide)

---

## 1. Deployed Links

> The platform is prepared for deployment on modern cloud hosting (e.g., Render, Railway, Vercel, or AWS).

- **Frontend Live Application**: `https://bidzone-auctions.vercel.app` _(Placeholder - configure with production domain)_
- **Backend API Service**: `https://bidzone-api.onrender.com` _(Placeholder - configure with production domain)_
- **Database**: MongoDB Atlas Cluster _(Cloud Replica Set)_
- **Demo Walkthrough Video**: `https://youtube.com/watch?v=bidzone-demo-placeholder` _(Placeholder)_

---

## 2. Key Features

- **Multi-Role RBAC**: Distinct user experiences and permission boundaries for **Seller**, **Bidder**, and **Admin**.
- **Auction Item Lifecycle (CRUD)**: Sellers create, customize, edit, and delete listings with starting prices, categories, and future conclusion timestamps.
- **Strict Bid Validation**: Server enforces that every incoming bid strictly surpasses the current highest bid, rejects bids on expired/cancelled listings, and bars sellers from bidding on their own listings.
- **Real-Time Bid Broadcasts**: Socket.IO pushes live bid updates, leading bidder names, and new bid amounts immediately to all active observers without page reloads.
- **Server-Driven Winner Designation**: Background watcher detects auction expiration down to the exact second, updates the winner on the database, and emits a celebratory event to the auction chamber.
- **MongoDB Aggregation Pipelines**:
  1. _Category Sales Analytics_: Computes total listings, active vs. closed listings, gross realized revenue, average bids, and peak prices grouped by item category.
  2. _Top Bidders Leaderboard_: Ranks top bidders by total participation count and spending volume.
  3. _Auction-Specific Bid Analytics_: Evaluates bidder participation frequency and highest offers within an individual listing.
- **Dual-Token Authentication**: Secure authentication pairing short-lived JWT Access Tokens (15m) with rotating long-lived JWT Refresh Tokens (7d).
- **Glassmorphism Pure CSS Interface**: Custom UI built without third-party component frameworks, complying strictly with standard Web APIs.

---

## 3. Technology Stack

### Backend (Strict Compliance)

- **Runtime**: Node.js (v18+)
- **Web Framework**: Express.js (`express`)
- **Database ODM**: Mongoose (`mongoose`)
- **Real-Time WebSockets**: Socket.IO Server (`socket.io`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`)
- **Password Security**: Bcrypt (`bcrypt`)
- **Configuration**: Dotenv (`dotenv`)
  _(Zero unauthorized libraries used)._

### Frontend (Strict Compliance)

- **Library**: React 18 (`react`, `react-dom`)
- **Routing**: React Router DOM v6 (`react-router-dom`)
- **Network Layer**: Native Web Fetch API
- **State Management**: React Context API (`AuthContext`, `SocketContext`)
- **Real-Time Client**: Socket.IO Client (`socket.io-client`)
- **Build Tool**: Vite
- **Styling**: Pure Modern CSS (CSS Grid, Flexbox, CSS Variables, Glassmorphism).

---

## 4. Backend Architecture (MVC)

The backend follows the clean **Model-View-Controller** design pattern:

```
backend/
├── config/
│   └── db.js                 # MongoDB connection lifecycle management
├── models/
│   ├── User.js               # User schema with pre-save bcrypt hash & compare methods
│   ├── Auction.js            # Auction schema with indexes & category validations
│   └── Bid.js                # Bid schema with relational foreign keys
├── controllers/
│   ├── authController.js     # Register, login, refresh token, me, logout
│   ├── auctionController.js  # Auction CRUD, filtering, category aggregation
│   ├── bidController.js      # Live bid placement, history, auction bidder aggregation
│   └── userController.js     # Admin metrics, leaderboard aggregation, role update
├── routes/
│   ├── authRoutes.js         # /api/auth endpoints
│   ├── auctionRoutes.js      # /api/auctions endpoints
│   ├── bidRoutes.js          # /api/bids endpoints
│   └── userRoutes.js         # /api/users endpoints
├── middleware/
│   ├── authMiddleware.js     # JWT verification & RBAC role authorization
│   └── errorMiddleware.js    # Centralized error handler & route 404 handler
├── utils/
│   ├── jwtUtils.js           # Access/refresh token generation & verification
│   └── auctionTimer.js       # Background server watcher for automated auction closing
├── seed.js                   # Database seeder with pre-populated demo items & users
├── test-backend.js           # Automated backend integration testing suite
├── test-e2e.js               # End-to-end Socket.io real-time bidding verification
├── .env.example              # Template for environment variables (never committed)
└── server.js                 # Express app + HTTP server + Socket.IO initialization
```

---

## 5. Database Architecture & Indexes

Detailed database schema documentation and visual entity relationships are documented in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

### Collections & Indexes

1. **User Collection**:
   - `email`: Indexed with unique constraint `{ email: 1 }`.
   - `role`: Enum `['seller', 'bidder', 'admin']`.
   - `refreshToken`: Stored securely with `select: false`.

2. **Auction Collection**:
   - Relationships:
     - `seller`: Reference to `User` (1-to-many).
     - `highestBidder`: Dynamic reference to `User`.
     - `winner`: Assigned `User` reference upon auction completion.
   - Indexes:
     - `{ category: 1, status: 1 }`: High performance filtering for marketplace queries.
     - `{ endTime: 1, status: 1 }`: Accelerated lookups for the server expiration watcher.
     - `{ seller: 1, createdAt: -1 }`: Quick retrieval for seller inventory dashboards.
     - `{ currentBid: 1 }`: Range queries and price sorting.

3. **Bid Collection**:
   - Relationships:
     - `auction`: Reference to `Auction`.
     - `bidder`: Reference to `User`.
   - Indexes:
     - `{ auction: 1, amount: -1 }`: Instant ranking of highest bids per item.
     - `{ bidder: 1, createdAt: -1 }`: Fast retrieval of user bidding history.

---

## 6. Authentication & Authorization (RBAC)

1. **Password Security**: Passwords hashed using `bcrypt` with 10 salt rounds via Mongoose pre-save middleware.
2. **Dual-Token System**:
   - **Access Token**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`. Sent in `Authorization: Bearer <token>` header.
   - **Refresh Token**: Long-lived (7 days), signed with `JWT_REFRESH_SECRET`. Stored in DB and client storage.
   - **Seamless Silent Refresh**: Frontend `api.js` automatically catches 401 Unauthorized responses and calls `/api/auth/refresh-token` to retrieve a fresh access token without interrupting the user.
3. **Role-Based Access Control (RBAC)**:
   - Evaluated by `authorizeRoles(...roles)` middleware:
     - `seller`: Permitted to list auctions (`POST /api/auctions`) and modify own items.
     - `bidder`: Permitted to place bids (`POST /api/bids/:auctionId`).
     - `admin`: Full administrative oversight, platform telemetry, user role reassignments, and auction moderation.

---

## 7. Real-Time Bidding Engine (Socket.IO)

```
[Bidder Client]                           [BidZone Node Server]                         [All Observers]
       │                                           │                                           │
       │─── socket.emit('joinAuction', id) ───────>│ (Client joined room: `auction_${id}`)     │
       │                                           │                                           │
       │─── POST /api/bids/:id (HTTP Bid) ────────>│ 1. Validate: amount > currentBid          │
       │                                           │ 2. Save Bid in MongoDB                    │
       │                                           │ 3. Update Auction currentBid & bidder     │
       │                                           │                                           │
       │<── HTTP 201 Created Response ─────────────│                                           │
       │                                           │                                           │
       │                                           │─── io.to('auction_' + id).emit ──────────>│
       │                                           │    ('bidUpdated', { currentBid, bidder }) │
       │                                           │                                           │
       │<── Live UI Updates Instantly ─────────────┴───────────────────────────────────────────│
```

- **Room Partitioning**: Clients subscribe only to the auction rooms they are viewing (`auction_${auctionId}`), preventing unnecessary network traffic.
- **Server Timer Synchronization**: A continuous background timer (`auctionTimer.js`) scans for active auctions whose `endTime <= Date.now()`. When found, it automatically transitions status to `ended`, locks in the winner, and emits `auctionEnded` to all room occupants.

---

## 8. Aggregation Pipeline Analytics

The platform implements three advanced MongoDB Aggregation pipelines:

1. **Category Sales Analytics** (`GET /api/auctions/analytics/category-sales`):
   Aggregates auction metrics grouped by category. Uses `$group`, `$cond`, `$sum`, `$avg`, `$max`, `$project`, and `$sort` to output total listings, active vs. closed listings, gross sales revenue, and average bids.

2. **Top Bidders Leaderboard** (`GET /api/users/leaderboard`):
   Identifies the platform's top participants by joining `bids` with `users` via `$lookup`, computing total bids submitted, maximum bid, and total bid volume with `$group` and `$sort`.

3. **Auction Bidder Analytics** (`GET /api/bids/analytics/:auctionId`):
   Profiles all bidders in a specific auction, computing participation frequency, first bid time, and highest personal offer.

---

## 9. Environment Variables

Create a `.env` file inside the `backend/` directory using the provided `backend/.env.example` template:

```ini
# Server Port
PORT=5000
NODE_ENV=development

# MongoDB Connection String
MONGO_URI=mongodb://127.0.0.1:27017/bidzone

# JWT Authentication Secrets
JWT_ACCESS_SECRET=bidzone_super_secret_access_jwt_key_2026_capstone
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=bidzone_super_secret_refresh_jwt_key_2026_capstone
JWT_REFRESH_EXPIRES_IN=7d

# Permitted Client Origin for CORS and WebSockets
CLIENT_URL=http://localhost:5173
```

> **Security Note**: `.env` is explicitly ignored in `.gitignore` and is never committed to Git.

---

## 10. Installation & Quick Start

### Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB Server running locally on port 27017 (or MongoDB Atlas URI)

### Step 1: Clone Repository

```bash
git clone https://github.com/username/bidzone-auction-platform.git
cd bidzone-auction-platform
```

### Step 2: Configure Environment

```bash
cp backend/.env.example backend/.env
```

### Step 3: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 4: Seed Database with Realistic Demo Data

From the `backend` directory, run:

```bash
node seed.js
```

_This populates the database with verified admin, seller, and bidder accounts, active luxury auctions with countdown timers, ended items, and live bid histories._

**Pre-seeded Demo Accounts:**
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@bidzone.com` | `Password123!` |
| **Seller** | `seller@bidzone.com` | `Password123!` |
| **Bidder** | `bidder@bidzone.com` | `Password123!` |
| **Bidder 2** | `david@bidzone.com` | `Password123!` |

### Step 5: Start Servers

**Terminal 1 (Backend Server):**

```bash
cd backend
npm start
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**

```bash
cd frontend
npm run dev
# Application starts on http://localhost:5173
```

### Step 6: Automated Verification Suites

Run the automated backend test suite:

```bash
cd backend
node test-backend.js
```

Run the real-time Socket.IO end-to-end verification:

```bash
cd backend
node test-e2e.js
```

---

## 11. Postman API Collection

A complete Postman Collection is included in the project root:

- File: [BidZone.postman_collection.json](BidZone.postman_collection.json)

### How to Import & Run in Postman:

1. Open Postman.
2. Click **Import** (top left).
3. Select `BidZone.postman_collection.json`.
4. The collection includes pre-configured collection variables (`baseUrl`, `accessToken`, `refreshToken`, `auctionId`) and automated test scripts that automatically capture and inject JWT tokens after login.

---

## 12. API Reference Documentation

### Authentication (`/api/auth`)

| Method | Endpoint                  | Access        | Description                                             |
| ------ | ------------------------- | ------------- | ------------------------------------------------------- |
| `POST` | `/api/auth/register`      | Public        | Register new user (`name`, `email`, `password`, `role`) |
| `POST` | `/api/auth/login`         | Public        | Authenticate user & return access + refresh tokens      |
| `POST` | `/api/auth/refresh-token` | Public        | Exchange refresh token for new access token             |
| `POST` | `/api/auth/logout`        | Authenticated | Revoke refresh token                                    |
| `GET`  | `/api/auth/me`            | Authenticated | Retrieve logged-in user profile                         |

### Auctions (`/api/auctions`)

| Method   | Endpoint                                 | Access         | Description                                             |
| -------- | ---------------------------------------- | -------------- | ------------------------------------------------------- |
| `GET`    | `/api/auctions`                          | Public         | Get all auctions with search, category & price filters  |
| `GET`    | `/api/auctions/:id`                      | Public         | Get single auction details with populated seller & bids |
| `GET`    | `/api/auctions/analytics/category-sales` | Public         | Aggregation: Category-wise sales & volume analytics     |
| `GET`    | `/api/auctions/seller/my-listings`       | Seller / Admin | Retrieve auctions listed by current seller              |
| `POST`   | `/api/auctions`                          | Seller / Admin | Create new auction item listing                         |
| `PUT`    | `/api/auctions/:id`                      | Seller / Admin | Update listing (price locked once bids exist)           |
| `DELETE` | `/api/auctions/:id`                      | Seller / Admin | Remove listing and associated bids                      |

### Bids (`/api/bids`)

| Method | Endpoint                         | Access         | Description                                          |
| ------ | -------------------------------- | -------------- | ---------------------------------------------------- |
| `POST` | `/api/bids/:auctionId`           | Bidder / Admin | Submit live bid (triggers Socket.IO broadcast)       |
| `GET`  | `/api/bids/:auctionId`           | Public         | Retrieve full bid history for an auction             |
| `GET`  | `/api/bids/my/activity`          | Authenticated  | Retrieve user's bidding history and won acquisitions |
| `GET`  | `/api/bids/analytics/:auctionId` | Public         | Aggregation: Bidder behavior analytics for auction   |

### Users & Admin (`/api/users`)

| Method  | Endpoint                   | Access     | Description                                      |
| ------- | -------------------------- | ---------- | ------------------------------------------------ |
| `GET`   | `/api/users/leaderboard`   | Public     | Aggregation: Top bidders leaderboard             |
| `GET`   | `/api/users/admin/summary` | Admin Only | Aggregation: Platform overview & sales KPIs      |
| `GET`   | `/api/users`               | Admin Only | Retrieve all registered users                    |
| `PATCH` | `/api/users/:id/role`      | Admin Only | Reassign user role (`seller`, `bidder`, `admin`) |

---

## 13. Engineering Assumptions

1. **Role Separation**: A user registered as a `seller` can list items but is prohibited by validation rules from bidding on their own listings to maintain marketplace integrity.
2. **Price Progression**: When an auction receives its first bid, the bid must be at least the starting price. Subsequent bids must strictly exceed the current highest bid.
3. **Auction Conclusion**: An auction concludes automatically when the wall-clock reaches `endTime`. The server background watcher checks every 3 seconds and guarantees consistent winner designation even if no client has the page open.
4. **Token Security**: Access tokens expire in 15 minutes; refresh tokens expire in 7 days and can be revoked on logout or role reassignment.
5. **No External CSS Frameworks**: Built using 100% vanilla CSS variables and CSS grid/flexbox to guarantee strict compliance with the project specifications.

---

## 14. Viva & Technical Demo Guide

### Key Technical Talking Points

1. **Explain the MVC Architecture**:
   - _Models_ define Mongoose schemas, field validators, pre-save hooks (bcrypt hashing), and indexes.
   - _Controllers_ encapsulate business logic (bid validation, calculations, DB queries).
   - _Routes_ map HTTP methods and apply security middleware (`authenticate`, `authorizeRoles`).
   - _Middleware_ provides centralized error handling and JWT verification.

2. **How Real-Time Bidding Works**:
   - Clients connect via WebSocket and join a room designated by the auction ID (`socket.join('auction_' + id)`).
   - When a bid is placed via HTTP POST, the controller updates the database atomically and broadcasts a `bidUpdated` event to that room via `socketInstance.to('auction_' + id).emit(...)`.
   - All connected browsers immediately receive the new bid and re-render without reloading.

3. **How Refresh Tokens Work**:
   - Access tokens have a 15-minute lifespan. When the frontend receives a 401 response, `api.js` intercepts it, calls `/api/auth/refresh-token`, saves the new token, and replays the original request silently.

4. **Explain the Aggregation Pipeline**:
   - Walk through the `$group` stage in `fetchCategorySalesAnalytics` where auctions are grouped by `$category`, conditional `$sum` operators compute revenue for ended auctions with winners, and `$project` shapes the final analytics object.

---

## License

ISC © BidZone Engineering Team
