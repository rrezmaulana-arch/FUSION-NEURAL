/**
 * Project: FUSION NEURAL
 * Created by: Miftah Afreza Maulana (rrez_.maulana)
 * Role: Product Engineer (UI/UX & Full-Stack)
 * Copyright (c) 2026. All rights reserved.
 */
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import MicrochipCursor from './components/cursor/MicrochipCursor';

// Lazy loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));

// Simple loading screen for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-fn-emerald border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <MicrochipCursor />
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pemesanan" element={<OrderPage />} />
              <Route 
                path="/dashboard/*" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Suspense>
        </Router>
    </AuthProvider>
  );
}
