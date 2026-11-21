import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { AuctionDetailPage } from './pages/AuctionDetailPage';
import { CreateAuctionPage } from './pages/CreateAuctionPage';
import { EditAuctionPage } from './pages/EditAuctionPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { MyBidsPage } from './pages/MyBidsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

import './App.css';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Marketplace Route */}
                <Route path="/" element={<HomePage />} />
                <Route path="/auctions/:id" element={<AuctionDetailPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Seller & Admin Protected Routes */}
                <Route
                  path="/create-auction"
                  element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <CreateAuctionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-auction/:id"
                  element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <EditAuctionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-listings"
                  element={
                    <ProtectedRoute allowedRoles={['seller', 'admin']}>
                      <MyListingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Bidder & General User Protected Routes */}
                <Route
                  path="/my-bids"
                  element={
                    <ProtectedRoute>
                      <MyBidsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Only Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Unmatched 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
