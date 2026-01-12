import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Browse from './pages/Browse';
import CampaignDetail from './pages/CampaignDetail';
import StudentRegister from './pages/StudentRegister'; // This is the split-layout profile form
import SignUp from './pages/SignUp'; // This is the new sign-up page
import CompleteProfile from './pages/CompleteProfile';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Notifications from './pages/Notifications';
import Privacy from './pages/Privacy';
import HelpCenter from './pages/HelpCenter';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Refund from './pages/Refund';

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

                    {/* Auth Flows */}
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/register" element={<StudentRegister />} />
                    <Route path="/register/student" element={<StudentRegister />} />
                    <Route path="/login" element={<Login />} />

                    <Route path="/complete-profile" element={<CompleteProfile />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/help" element={<HelpCenter />} />
                    <Route path="/faq" element={<HelpCenter />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/refund" element={<Refund />} />
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
