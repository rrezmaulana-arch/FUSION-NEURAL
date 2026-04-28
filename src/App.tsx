import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrderPage from './pages/OrderPage';
import { SystemEngineProvider } from './context/SystemEngineContext';
import MicrochipCursor from './components/cursor/MicrochipCursor';

export default function App() {
  return (
    <AuthProvider>
      <SystemEngineProvider>
        <MicrochipCursor />
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pemesanan" element={<OrderPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </SystemEngineProvider>
    </AuthProvider>
  );
}
