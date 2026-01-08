import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Bell,
    CheckCircle,
    TrendingUp,
    UserCheck,
    Clock,
    X,
    CreditCard
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './Navbar.css';

interface NotificationsDropdownProps {
    onClose: () => void;
}

// Helper to safely format date
const formatTimeAgo = (dateValue: string | Date | undefined | null): string => {
    if (!dateValue) return 'Just now';
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'Just now';
        return formatDistanceToNow(date, { addSuffix: true });
    } catch {
        return 'Just now';
    }
};

import { useNavigate } from 'react-router-dom';

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ onClose }) => {
    const { notifications, markNotificationAsRead, user } = useAuth();
    const navigate = useNavigate();

    const getIcon = (type: string) => {
        switch (type) {
            case 'donation_received':
                return <TrendingUp size={16} className="nt-icon success" />;
            case 'payment_made':
                return <CreditCard size={16} className="nt-icon info" />;
            case 'verification_update':
                return <UserCheck size={16} className="nt-icon warning" />;
            case 'campaign_update':
            case 'success':
                return <CheckCircle size={16} className="nt-icon success" />;
            case 'info':
                return <Bell size={16} className="nt-icon info" />;
            case 'warning':
                return <Bell size={16} className="nt-icon warning" />;
            default:
                return <Bell size={16} className="nt-icon" />;
        }
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.read) {
            markNotificationAsRead(notification.id);
        }
        onClose();

        // Check for direct URL in data
        if (notification.data?.url) {
            navigate(notification.data.url);
            return;
        }

        // Logic based on types
        switch (notification.type) {
            case 'verification_update':
                // Usually for students seeing if they are verified
                if (user?.role === 'admin') navigate('/admin'); // Admins go to dashboard
                else navigate('/dashboard');
                break;

            case 'donation_received':
                // Student received money
                if (notification.data?.campaignId) {
                    navigate(`/dashboard`); // Or specific campaign view in dashboard
                } else {
                    navigate('/dashboard');
                }
                break;

            case 'payment_made':
                // Donor made payment
                navigate('/profile');
                break;

            case 'campaign_update':
                if (notification.data?.campaignId) {
                    navigate(`/campaign/${notification.data.campaignId}`);
                } else {
                    navigate('/browse');
                }
                break;

            default:
                // Default fallback
                if (user?.role === 'admin') navigate('/admin');
                else if (user?.role === 'student') navigate('/dashboard');
                else navigate('/browse');
                break;
        }
    };

    return (
        <div className="notifications-dropdown">
            <div className="nt-header">
                <h3>Notifications</h3>
                <button className="nt-close" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            <div className="nt-content">
                {notifications.length === 0 ? (
                    <div className="nt-empty">
                        <Bell size={48} />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`nt-item ${!notification.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="nt-icon-wrapper">
                                {getIcon(notification.type)}
                            </div>
                            <div className="nt-text">
                                <span className="nt-title">{notification.title}</span>
                                <p className="nt-message">{notification.message}</p>
                                <div className="nt-meta">
                                    <Clock size={12} />
                                    <span>{formatTimeAgo(notification.createdAt || (notification as any).created_at)}</span>
                                </div>
                            </div>
                            {!notification.read && <div className="nt-unread-dot" />}
                        </div>
                    ))
                )}
            </div>

            <div className="nt-footer">
                <button className="nt-view-all" onClick={() => {
                    onClose();
                    if (user?.role === 'admin') navigate('/admin');
                    else if (user?.role === 'student') navigate('/dashboard');
                    else navigate('/profile');
                }}>View all notifications</button>
            </div>
        </div>
    );
};

export default NotificationsDropdown;

