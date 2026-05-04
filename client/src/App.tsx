import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './features/landing/pages/LandingPage';
import ExploreFields from './features/customer/pages/ExploreFields';
import Login from './features/auth/pages/Login';
import OwnerDashboard from './features/owner/pages/OwnerDashboard';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface-light text-slate-900 selection:bg-primary/30 selection:text-primary">
        <Routes>
          {/* Public Routes with Main Navbar */}
          <Route path="/" element={<><Navbar /><LandingPage /></>} />
          <Route path="/explore" element={<ExploreFields />} />
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard Routes with Dashboard Layout */}
          <Route 
            path="/dashboard/*" 
            element={
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<OwnerDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  {/* Add more dashboard sub-routes here */}
                </Routes>
              </DashboardLayout>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
