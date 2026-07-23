import { lazy, Suspense, useEffect, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import AppToast from './components/AppToast';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardLayout from './layouts/DashboardLayout';

const AIChatBox = lazy(() => import('./components/AIChatBox'));
const LandingPage = lazy(() => import('./features/landing/pages/LandingPage'));
const Contact = lazy(() => import('./features/landing/pages/Contact'));
const ExploreFields = lazy(() => import('./features/customer/pages/ExploreFields'));
const FieldDetails = lazy(() => import('./features/customer/pages/FieldDetails'));
const PaymentResult = lazy(() => import('./features/customer/pages/PaymentResult'));
const Profile = lazy(() => import('./features/customer/pages/Profile'));
const BookingReview = lazy(() => import('./features/customer/pages/BookingReview'));
const Login = lazy(() => import('./features/auth/pages/Login'));
const Register = lazy(() => import('./features/auth/pages/Register'));
const PasswordReset = lazy(() => import('./features/auth/pages/PasswordReset'));
const PartnerPortal = lazy(() => import('./features/owner/pages/PartnerPortal'));
const Dashboard = lazy(() => import('./features/owner/pages/Dashboard'));
const MyPitches = lazy(() => import('./features/owner/pages/MyPitches'));
const Bookings = lazy(() => import('./features/owner/pages/Bookings'));
const Revenue = lazy(() => import('./features/owner/pages/Revenue'));
const Reviews = lazy(() => import('./features/owner/pages/Reviews'));
const StaffManagement = lazy(() => import('./features/owner/pages/StaffManagement'));
const Services = lazy(() => import('./features/owner/pages/Services'));
const PitchEditor = lazy(() => import('./features/owner/pages/PitchEditor'));
const AdminDashboard = lazy(() => import('./features/admin/pages/AdminDashboard'));
const Users = lazy(() => import('./features/admin/pages/Users'));
const Approvals = lazy(() => import('./features/admin/pages/Approvals'));
const PlatformRevenue = lazy(() => import('./features/admin/pages/PlatformRevenue'));
const ContentModeration = lazy(() => import('./features/admin/pages/ContentModeration'));
const SystemManagement = lazy(() => import('./features/admin/pages/SystemManagement'));
const CustomerSupport = lazy(() => import('./features/admin/pages/CustomerSupport'));

const PageLoader = () => (
  <div className="grid min-h-[45vh] place-items-center px-6 py-20 text-sm font-bold text-slate-500">
    Đang tải...
  </div>
);

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
};

function App() {
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    const scheduleIdle = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(callback, 1600));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const id = scheduleIdle(() => setShowAIChat(true), { timeout: 2500 });

    return () => cancelIdle(id);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppToast />
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-100 selection:bg-primary/30 selection:text-primary transition-colors duration-300">
            <Suspense fallback={<PageLoader />}>
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
              <Route path="/dashboard/owner" element={<ProtectedRoute requiredRole={[2, 4]}><DashboardLayout role="owner" /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="bookings" element={<ProtectedRoute requiredRole={[2, 4]}><Bookings /></ProtectedRoute>} />
                <Route path="reviews" element={<ProtectedRoute requiredRole={[2, 4]}><Reviews /></ProtectedRoute>} />
                <Route path="pitches" element={<ProtectedRoute requiredRole={2}><MyPitches /></ProtectedRoute>} />
                <Route path="revenue" element={<ProtectedRoute requiredRole={2}><Revenue /></ProtectedRoute>} />
                <Route path="staff" element={<ProtectedRoute requiredRole={2}><StaffManagement /></ProtectedRoute>} />
                <Route path="services" element={<ProtectedRoute requiredRole={2}><Services /></ProtectedRoute>} />
                <Route path="pitches/create" element={<ProtectedRoute requiredRole={2}><PitchEditor /></ProtectedRoute>} />
                <Route path="pitches/edit/:id" element={<ProtectedRoute requiredRole={2}><PitchEditor /></ProtectedRoute>} />
              </Route>

              {/* Admin Dashboard */}
              <Route path="/dashboard/admin" element={<ProtectedRoute requiredRole={3}><DashboardLayout role="admin" /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="moderation" element={<ContentModeration />} />
                <Route path="system" element={<SystemManagement />} />
                <Route path="support" element={<CustomerSupport />} />
                <Route path="revenue" element={<PlatformRevenue />} />
              </Route>

              {/* Fallback /dashboard → redirect dựa vào role trong ProtectedRoute */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout role="owner">
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
            </Routes>
            </Suspense>
            {showAIChat && (
              <Suspense fallback={null}>
                <AIChatBox />
              </Suspense>
            )}
            </div>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
