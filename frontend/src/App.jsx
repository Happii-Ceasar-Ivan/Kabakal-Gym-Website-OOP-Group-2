import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyPage from './pages/auth/VerifyPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

// Lazy load admin routes for Vite code-splitting
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminMemberManagementPage = lazy(() => import('./pages/admin/AdminMemberManagementPage'));
const AdminEquipmentManagementPage = lazy(() => import('./pages/admin/AdminEquipmentManagementPage'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-orange-500 font-bold text-xl">Loading...</div>}>
        <Routes>
          {/* Public & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          
          {/* Protected Member Route */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Protected Admin Routes (Lazy Loaded) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="members" element={<AdminMemberManagementPage />} />
            <Route path="equipment" element={<AdminEquipmentManagementPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Analytics />
    </Router>
  );
}

export default App;
