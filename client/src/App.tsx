import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './features/landing/pages/LandingPage';
import ExploreFields from './features/customer/pages/ExploreFields';
import FieldDetails from './features/customer/pages/FieldDetails';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import PasswordReset from './features/auth/pages/PasswordReset';
import PartnerPortal from './features/owner/pages/PartnerPortal';
import Dashboard from './features/owner/pages/Dashboard';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import PaymentResult from './features/customer/pages/PaymentResult';
import Profile from './features/customer/pages/Profile';
import BookingReview from './features/customer/pages/BookingReview';
import DashboardLayout from './layouts/DashboardLayout';
import Contact from './features/landing/pages/Contact';

const AIChatBox = lazy(() => import('./components/AIChatBox'));

// Owner Sub-pages
import MyPitches from './features/owner/pages/MyPitches';
import Bookings from './features/owner/pages/Bookings';
import Revenue from './features/owner/pages/Revenue';
import Reviews from './features/owner/pages/Reviews';
import StaffManagement from './features/owner/pages/StaffManagement';
import Services from './features/owner/pages/Services';
import PitchEditor from './features/owner/pages/PitchEditor';

// Admin Sub-pages
import Users from './features/admin/pages/Users';
import Approvals from './features/admin/pages/Approvals';
import PlatformRevenue from './features/admin/pages/PlatformRevenue';
import Reports from './features/admin/pages/Reports';
import ContentModeration from './features/admin/pages/ContentModeration';
import SystemManagement from './features/admin/pages/SystemManagement';
import CustomerSupport from './features/admin/pages/CustomerSupport';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-100 selection:bg-primary/30 selection:text-primary transition-colors duration-300">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<><Navbar /><LandingPage /></>} />
              <Route path="/explore" element={<div className="flex flex-col min-h-screen"><Navbar /><ExploreFields /><Footer /></div>} />
              <Route path="/san/:slug" element={<div className="flex flex-col min-h-screen"><Navbar /><FieldDetails /><Footer /></div>} />
              <Route path="/field/:id" element={<div className="flex flex-col min-h-screen"><Navbar /><FieldDetails /><Footer /></div>} />
              <Route path="/login" element={<div className="flex flex-col min-h-screen"><Navbar /><Login /><Footer /></div>} />
              <Route path="/register" element={<div className="flex flex-col min-h-screen"><Navbar /><Register /><Footer /></div>} />
              <Route path="/forgot-password" element={<div className="flex flex-col min-h-screen"><Navbar /><PasswordReset /><Footer /></div>} />
              <Route path="/partner" element={<div className="flex flex-col min-h-screen"><Navbar /><PartnerPortal /><Footer /></div>} />
              <Route path="/contact" element={<div className="flex flex-col min-h-screen"><Navbar /><Contact /><Footer /></div>} />
              <Route path="/payment-result" element={<div className="flex flex-col min-h-screen"><Navbar /><PaymentResult /><Footer /></div>} />
              <Route path="/booking-review/:id" element={<div className="flex flex-col min-h-screen"><Navbar /><BookingReview /><Footer /></div>} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <div className="flex flex-col min-h-screen"><Navbar /><Profile /><Footer /></div>
                </ProtectedRoute>
              } />

              {/* Owner Dashboard */}
              <Route path="/dashboard/owner" element={<ProtectedRoute requiredRole={[2, 4]}><DashboardLayout role="owner"><Dashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/owner/pitches" element={<ProtectedRoute requiredRole={2}><DashboardLayout role="owner"><MyPitches /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/owner/bookings" element={<ProtectedRoute requiredRole={[2, 4]}><DashboardLayout role="owner"><Bookings /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/owner/revenue" element={<ProtectedRoute requiredRole={2}><DashboardLayout role="owner"><Revenue /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/owner/reviews" element={<ProtectedRoute requiredRole={[2, 4]}><DashboardLayout role="owner"><Reviews /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/owner/staff" element={<ProtectedRoute requiredRole={2}><DashboardLayout role="owner"><StaffManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/owner/services" element={<ProtectedRoute requiredRole={2}><DashboardLayout role="owner"><Services /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/owner/pitches/create" element={<ProtectedRoute requiredRole={2}><DashboardLayout role="owner"><PitchEditor /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/owner/pitches/edit/:id" element={<ProtectedRoute requiredRole={2}><DashboardLayout role="owner"><PitchEditor /></DashboardLayout></ProtectedRoute>} />

              {/* Admin Dashboard */}
              <Route path="/dashboard/admin" element={<ProtectedRoute requiredRole={3}><DashboardLayout role="admin"><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/admin/users" element={<ProtectedRoute requiredRole={3}><DashboardLayout role="admin"><Users /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/admin/approvals" element={<ProtectedRoute requiredRole={3}><DashboardLayout role="admin"><Approvals /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/admin/moderation" element={<ProtectedRoute requiredRole={3}><DashboardLayout role="admin"><ContentModeration /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/admin/system" element={<ProtectedRoute requiredRole={3}><DashboardLayout role="admin"><SystemManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/admin/support" element={<ProtectedRoute requiredRole={3}><DashboardLayout role="admin"><CustomerSupport /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/admin/revenue" element={<ProtectedRoute requiredRole={3}><DashboardLayout role="admin"><PlatformRevenue /></DashboardLayout></ProtectedRoute>} />
              <Route path="/dashboard/admin/reports" element={<ProtectedRoute requiredRole={3}><DashboardLayout role="admin"><Reports /></DashboardLayout></ProtectedRoute>} />

              {/* Fallback /dashboard → redirect dựa vào role trong ProtectedRoute */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout role="owner">
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
            </Routes>
            <Suspense fallback={<div className="p-2">Đang tải trợ lý AI…</div>}>
              <AIChatBox />
            </Suspense>
            </div>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
