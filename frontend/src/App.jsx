import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

// Lazy load Auth routes
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyPage = lazy(() => import('./pages/auth/VerifyPage'));

// Lazy load roles
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminMemberManagementPage = lazy(() => import('./pages/admin/AdminMemberManagementPage'));
const AdminEquipmentManagementPage = lazy(() => import('./pages/admin/AdminEquipmentManagementPage'));
const GateKioskPage = lazy(() => import('./pages/kiosk/GateKioskPage'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));

// Lazy load Member routes
const MemberLayout = lazy(() => import('./components/MemberLayout'));
const MemberDashboardPage = lazy(() => import('./pages/member/MemberDashboardPage'));
const MemberCalendarPage = lazy(() => import('./pages/member/MemberCalendarPage'));
const MemberBillingPage = lazy(() => import('./pages/member/MemberBillingPage'));
const MemberProfilePage = lazy(() => import('./pages/member/MemberProfilePage'));
const WorkoutGeneratorPage = lazy(() => import('./pages/member/WorkoutGeneratorPage'));

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(247, 240, 20, 0.2)',
          },
          success: {
            iconTheme: {
              primary: '#00ff00',
              secondary: '#1a1a1a',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff3333',
              secondary: '#1a1a1a',
            },
          },
        }}
      />
      <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-orange-500 font-bold text-xl">Loading...</div>}>
        <Routes>
          {/* Public & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          
          {/* Protected Member Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/member" element={<MemberLayout />}>
            <Route path="dashboard" element={<MemberDashboardPage />} />
            <Route path="calendar" element={<MemberCalendarPage />} />
            <Route path="billing" element={<MemberBillingPage />} />
            <Route path="profile" element={<MemberProfilePage />} />
            <Route path="workout-generator" element={<WorkoutGeneratorPage />} />
          </Route>

          {/* New Sprint 5 Routes */}
          <Route path="/kiosk" element={<GateKioskPage />} />
          <Route path="/staff" element={<StaffDashboard />} />

          {/* Protected Admin Routes (Lazy Loaded) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
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
