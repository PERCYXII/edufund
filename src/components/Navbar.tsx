import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Menu,
    X,
    Bell,
    ChevronDown,
    User,
    Settings,
    LogOut,
    LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import NotificationsDropdown from './NotificationsDropdown';
import './Navbar.css';

const Navbar: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { isLoggedIn, user, logout, notifications } = useAuth();
    const { info } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = () => {
        logout();
        info('Goodbye!', 'You have been successfully logged out.');
        navigate('/');
        setUserMenuOpen(false);
    };

    const handleScrollToSection = (sectionId: string) => {
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: sectionId } });
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        setMobileMenuOpen(false);
    };



    const renderAvatarContent = () => {
        const profileImage = user?.student?.profileImage;
        if (profileImage) {
            return <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />;
        }
        return <User size={userMenuOpen ? 24 : 18} />;
    };

    const getDashboardLink = () => {
        if (user?.role === 'admin') return '/admin';
        if (user?.role === 'student') return '/dashboard';
        return '/browse';
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-content">
                    {/* Logo */}
                    <Link to="/" className="navbar-logo">
                        <img src="/images/logo.png" alt="UniFund Logo" className="logo-image" />
                        <span className="logo-text">UniFund</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="navbar-links">
                        <Link to="/browse" className="nav-link">Browse Campaigns</Link>
                        <button onClick={() => handleScrollToSection('how-it-works')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                            How It Works
                        </button>

                        {!isLoggedIn ? (
                            <>
                                <Link to="/login" className="nav-link">Login</Link>
                                <Link to="/signup" className="btn btn-secondary">
                                    Register
                                </Link>
                                <Link to="/signup" className="btn btn-primary">
                                    Start Campaign
                                </Link>
                            </>
                        ) : (
                            <div className="user-section">
                                <div className="notification-wrapper">
                                    <button
                                        className={`notification-btn ${notificationsOpen ? 'active' : ''}`}
                                        onClick={() => {
                                            setNotificationsOpen(!notificationsOpen);
                                            setUserMenuOpen(false);
                                        }}
                                    >
                                        <Bell size={20} />
                                        {unreadCount > 0 && (
                                            <span className="notification-badge">{unreadCount}</span>
                                        )}
                                    </button>

                                    {notificationsOpen && (
                                        <NotificationsDropdown onClose={() => setNotificationsOpen(false)} />
                                    )}
                                </div>

                                <div className="user-menu-wrapper">
                                    <button
                                        className="user-menu-trigger"
                                        onClick={() => {
                                            setUserMenuOpen(!userMenuOpen);
                                            setNotificationsOpen(false);
                                        }}
                                    >
                                        <div className="user-avatar">{renderAvatarContent()}</div>
                                        <ChevronDown size={16} />
                                    </button>

                                    {userMenuOpen && (
                                        <div className="user-dropdown">
                                            <div className="user-dropdown-header">
                                                <div className="user-avatar-lg">{renderAvatarContent()}</div>
                                                <div className="user-info">
                                                    <span className="user-name">
                                                        {user?.student ? `${user.student.firstName} ${user.student.lastName}` : 'Admin User'}
                                                    </span>
                                                    <span className="user-role">{user?.role}</span>
                                                </div>
                                            </div>
                                            <div className="user-dropdown-divider" />
                                            <Link to={getDashboardLink()} className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                <LayoutDashboard size={18} />
                                                Dashboard
                                            </Link>
                                            <Link to="/profile" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                <User size={18} />
                                                Profile
                                            </Link>
                                            <Link to="/settings" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                <Settings size={18} />
                                                Settings
                                            </Link>
                                            <div className="user-dropdown-divider" />
                                            <button className="user-dropdown-item logout" onClick={handleLogout}>
                                                <LogOut size={18} />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="mobile-menu">
                        <Link to="/browse" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                            Browse Campaigns
                        </Link>
                        <button onClick={() => handleScrollToSection('how-it-works')} className="mobile-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit', fontSize: 'inherit' }}>
                            How It Works
                        </button>
                        {!isLoggedIn ? (
                            <>
                                <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    Login
                                </Link>
                                <Link to="/signup" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    Sign Up
                                </Link>
                                <Link
                                    to="/signup"
                                    className="btn btn-primary mobile-cta"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Start Campaign
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to={getDashboardLink()} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    Dashboard
                                </Link>
                                <button className="mobile-nav-link logout" onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
