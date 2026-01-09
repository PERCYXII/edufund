import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Bell,
    CheckCircle,
    TrendingUp,
    UserCheck,
    CreditCard,
    ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Re-use dashboard styles for consistency

const Notifications: React.FC = () => {
    const { notifications, markNotificationAsRead, user, isLoading } = useAuth();
    const navigate = useNavigate();

    // Mark all viewed as read when page opens? Maybe not all, but purely viewing list traditionally doesn't.
    // However, users often want a "Mark all as read" button.

    const handleBack = () => {
        if (user?.role === 'admin') navigate('/admin');
        else if (user?.role === 'student') navigate('/dashboard');
        else navigate('/browse');
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'donation_received':
                return <TrendingUp size={20} className="text-emerald-500" />;
            case 'payment_made':
                return <CreditCard size={20} className="text-blue-500" />;
            case 'verification_update':
                return <UserCheck size={20} className="text-amber-500" />;
            case 'campaign_update':
            case 'success':
                return <CheckCircle size={20} className="text-emerald-500" />;
            case 'info':
                return <Bell size={20} className="text-blue-500" />;
            case 'warning':
                return <Bell size={20} className="text-amber-500" />;
            default:
                return <Bell size={20} className="text-gray-500" />;
        }
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.read) {
            markNotificationAsRead(notification.id);
        }

        // Check for direct URL in data
        if (notification.data?.url) {
            navigate(notification.data.url);
            return;
        }

        // Logic based on types (matching Dropdown logic)
        switch (notification.type) {
            case 'verification_update':
                if (user?.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
                break;
            case 'donation_received':
                if (notification.data?.campaignId) {
                    navigate(`/dashboard`);
                } else {
                    navigate('/dashboard');
                }
                break;
            case 'payment_made':
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
                if (user?.role === 'admin') navigate('/admin');
                else if (user?.role === 'student') navigate('/dashboard');
                else navigate('/browse');
                break;
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading notifications...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-gray-500">
                        Showing notifications from the last 3 days
                    </p>
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={() => notifications.forEach(n => !n.read && markNotificationAsRead(n.id))}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                            <p className="text-gray-500 mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow ${!notification.read ? 'bg-blue-50/50 border-blue-100' : ''}`}
                            >
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notification.read ? 'bg-white' : 'bg-gray-50'}`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.createdAt || (notification as any).created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {notification.message}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="flex-shrink-0 self-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
