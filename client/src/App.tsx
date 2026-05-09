import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './features/landing/pages/LandingPage';
import ExploreFields from './features/customer/pages/ExploreFields';
import FieldDetails from './features/customer/pages/FieldDetails';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import PartnerPortal from './features/owner/pages/PartnerPortal';
import OwnerDashboard from './features/owner/pages/OwnerDashboard';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import PaymentResult from './features/customer/pages/PaymentResult';
import Profile from './features/customer/pages/Profile';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-surface-light text-slate-900 selection:bg-primary/30 selection:text-primary">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<><Navbar /><LandingPage /></>} />
            <Route path="/explore" element={<div className="flex flex-col min-h-screen"><Navbar /><ExploreFields /><Footer /></div>} />
            <Route path="/field/:id" element={<div className="flex flex-col min-h-screen"><Navbar /><FieldDetails /><Footer /></div>} />
            <Route path="/login" element={<div className="flex flex-col min-h-screen"><Navbar /><Login /><Footer /></div>} />
            <Route path="/register" element={<div className="flex flex-col min-h-screen"><Navbar /><Register /><Footer /></div>} />
            <Route path="/partner" element={<div className="flex flex-col min-h-screen"><Navbar /><PartnerPortal /><Footer /></div>} />
            <Route path="/payment-result" element={<div className="flex flex-col min-h-screen"><Navbar /><PaymentResult /><Footer /></div>} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="flex flex-col min-h-screen"><Navbar /><Profile /><Footer /></div>
              </ProtectedRoute>
            } />

            {/* Owner Dashboard — yêu cầu đăng nhập với role PitchOwner (2) */}
            <Route path="/dashboard/owner" element={
              <ProtectedRoute requiredRole={2}>
                <DashboardLayout role="owner">
                  <OwnerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/owner/*" element={
              <ProtectedRoute requiredRole={2}>
                <DashboardLayout role="owner">
                  <OwnerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Admin Dashboard — yêu cầu đăng nhập với role Admin (3) */}
            <Route path="/dashboard/admin" element={
              <ProtectedRoute requiredRole={3}>
                <DashboardLayout role="admin">
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/admin/*" element={
              <ProtectedRoute requiredRole={3}>
                <DashboardLayout role="admin">
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Fallback /dashboard → redirect dựa vào role trong ProtectedRoute */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout role="owner">
                  <OwnerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
