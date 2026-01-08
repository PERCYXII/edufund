import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Browse from './pages/Browse';
import CampaignDetail from './pages/CampaignDetail';
import StudentRegister from './pages/StudentRegister';
import CompleteProfile from './pages/CompleteProfile';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Import page-specific CSS
import './pages/Landing.css';
import './pages/Browse.css';
import './pages/CampaignDetail.css';
import './pages/Register.css';
import './pages/Login.css';
import './pages/Dashboard.css';
import './pages/AdminDashboard.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Admin routes - no navbar */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Dashboard routes - no navbar (has its own sidebar) */}
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />

            {/* Public routes with navbar */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/campaign/:id" element={<CampaignDetail />} />
                    <Route path="/signup" element={<StudentRegister />} />
                    <Route path="/register" element={<StudentRegister />} />
                    <Route path="/register/student" element={<StudentRegister />} />
                    <Route path="/complete-profile" element={<CompleteProfile />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/how-it-works" element={<Landing />} />
                  </Routes>
                  <Footer />
                </>
              }
            />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
