import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './features/landing/pages/LandingPage';
import ExploreFields from './features/customer/pages/ExploreFields';
import FieldDetails from './features/customer/pages/FieldDetails';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
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
          <Route path="/explore" element={<div className="flex flex-col min-h-screen"><Navbar /><ExploreFields /><Footer /></div>} />
          <Route path="/field/:id" element={<div className="flex flex-col min-h-screen"><Navbar /><FieldDetails /><Footer /></div>} />
          <Route path="/login" element={<div className="flex flex-col min-h-screen"><Navbar /><Login /><Footer /></div>} />
          <Route path="/register" element={<div className="flex flex-col min-h-screen"><Navbar /><Register /><Footer /></div>} />
          
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
