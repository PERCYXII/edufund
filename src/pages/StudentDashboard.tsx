import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Home,
    PlusCircle,
    BarChart3,
    Settings,
    LogOut,
    Users,
    DollarSign,
    TrendingUp,
    Clock,
    Bell,
    Edit,
    Eye,
    Share2,
    CheckCircle,
    AlertCircle,
    GraduationCap,
    User as UserIcon,
    Upload,
    Link as LinkIcon,
    Facebook,
    Twitter,
    MessageSquare,
    Trash2,
    Plus,
    X,
    XCircle,
    FileText,
    ArrowLeft,
    Camera,
    Menu,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import NotificationsDropdown from '../components/NotificationsDropdown';
import LoadingScreen from '../components/LoadingScreen';
import { supabase } from '../lib/supabase';
import type { CampaignWithStudent, University, Campaign } from '../types';
import { CAMPAIGN_CATEGORIES } from '../data/constants';
import './Dashboard.css';
import './Modal.css';
import StudentVerificationForm from '../components/StudentVerificationForm';

// Local interface for dashboard display
interface DashboardDonation {
    id: string;
    name: string;
    amount: number;
    date: string;
    isAnonymous: boolean;
}

const StudentDashboard: React.FC = () => {
    const { user, isLoading: authLoading, logout, notifications, refreshUser } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [showNotifications, setShowNotifications] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Redirect to registration if profile is missing
    useEffect(() => {
        if (!authLoading && user && !user.student && user.role === 'student') {
            navigate('/register');
        }
    }, [user, authLoading, navigate]);

    // Data state
    const [campaign, setCampaign] = useState<CampaignWithStudent | null>(null);
    const [university, setUniversity] = useState<University | null>(null);
    const [recentDonations, setRecentDonations] = useState<DashboardDonation[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsPhone, setSettingsPhone] = useState('');
    const [settingsFirstName, setSettingsFirstName] = useState('');
    const [settingsLastName, setSettingsLastName] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [extensionDays, setExtensionDays] = useState(30);
    const [isExtending, setIsExtending] = useState(false);
    // State for donors modal
    const [showDonorsModal, setShowDonorsModal] = useState(false);
    const [allDonations, setAllDonations] = useState<DashboardDonation[]>([]);
    const [loadingDonations, setLoadingDonations] = useState(false);
    const [verificationCount, setVerificationCount] = useState<number | null>(null);

    // Verification state
    // Verification state - Refactored to component

    const percentFunded = campaign && campaign.goal > 0 ? Math.min(100, Math.round(((campaign.raised || 0) / campaign.goal) * 100)) : 0;

    const fetchVerificationStatus = async () => {
        if (!user) return;

        // Initialize settings form
        if (user.student) {
            setSettingsPhone(user.student.phone || '');
            setSettingsFirstName(user.student.firstName || '');
            setSettingsLastName(user.student.lastName || '');
        }

        const { count, error } = await supabase
            .from('verification_requests')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', user.id);

        if (!error) {
            setVerificationCount(count);
        }
    };

    const fetchDashboardData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch Campaign
            const { data: campaigns, error: campaignError } = await supabase
                .from('campaigns')
                .select('*')
                .eq('student_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (campaignError) throw campaignError;

            if (campaigns && campaigns.length > 0) {
                const rawCampaign = campaigns[0];

                // Fetch funding items
                const { data: fundingItems } = await supabase
                    .from('funding_items')
                    .select('*')
                    .eq('campaign_id', rawCampaign.id);

                // Calculate days left
                const endDate = new Date(rawCampaign.end_date);
                const now = new Date();
                const diffTime = endDate.getTime() - now.getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const mappedCampaign: Campaign = {
                    id: rawCampaign.id,
                    studentId: rawCampaign.student_id,
                    title: rawCampaign.title,
                    story: rawCampaign.story,
                    goal: Number(rawCampaign.goal_amount),
                    raised: Number(rawCampaign.raised_amount || 0),
                    donors: Number(rawCampaign.donors || 0),
                    daysLeft: daysLeft > 0 ? daysLeft : 0,
                    startDate: rawCampaign.start_date,
                    endDate: rawCampaign.end_date,
                    status: rawCampaign.status,
                    type: rawCampaign.type,
                    category: rawCampaign.category,
                    isUrgent: rawCampaign.is_urgent,
                    fundingBreakdown: (fundingItems || []).map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        amount: Number(item.amount),
                        description: item.description
                    })),
                    images: rawCampaign.images,
                    invoiceUrl: rawCampaign.invoice_url,
                    feeStatementUrl: rawCampaign.fee_statement_url,
                    idUrl: rawCampaign.id_url,
                    enrollmentUrl: rawCampaign.enrollment_url,
                    videoUrl: rawCampaign.video_url,
                    createdAt: rawCampaign.created_at,
                    updatedAt: rawCampaign.updated_at
                };

                setCampaign(mappedCampaign as unknown as CampaignWithStudent);

                // Fetch Recent Donations
                const { data: donations, error: donationError } = await supabase
                    .from('donations')
                    .select('*, donors(first_name, last_name)')
                    .eq('campaign_id', campaigns[0].id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (donationError) {
                    console.error('Error fetching donations:', donationError);
                } else if (donations) {
                    setRecentDonations(donations.map(d => ({
                        id: d.id,
                        name: d.is_anonymous ? 'Anonymous' : `${d.donors?.first_name || 'Unknown'} ${d.donors?.last_name || ''}`.trim(),
                        date: new Date(d.created_at).toLocaleDateString(),
                        amount: d.amount,
                        isAnonymous: d.is_anonymous
                    })));
                }
            }

            // Fetch University
            if (user.student?.universityId) {
                const { data: uni, error: uniError } = await supabase
                    .from('universities')
                    .select('*')
                    .eq('id', user.student.universityId)
                    .single();

                if (uniError) {
                    console.error('Error fetching university:', uniError);
                } else if (uni) {
                    const mappedUniversity: University = {
                        id: uni.id,
                        name: uni.name,
                        bankName: uni.bank_name,
                        accountNumber: uni.account_number,
                        branchCode: uni.branch_code,
                        accountName: uni.account_name,
                        updatedAt: uni.updated_at
                    };
                    setUniversity(mappedUniversity);
                }
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setImageUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}/profile_${Date.now()}.${fileExt}`;

            // Upload to campaign-images bucket (reusing existing bucket)
            const { error: uploadError } = await supabase.storage
                .from('campaign-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('campaign-images')
                .getPublicUrl(fileName);

            // Update student record
            const { error: updateError } = await supabase
                .from('students')
                .update({ profile_image_url: publicUrl })
                .eq('id', user?.id);

            if (updateError) throw updateError;

            toast.success('Profile image updated successfully!');
            await refreshUser(true); // Refresh user context to show new image
            await fetchVerificationStatus(); // Refresh status
            await fetchDashboardData(); // Refresh campaign data

        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error('Error updating profile image: ' + error.message);
        } finally {
            setImageUploading(false);
        }
    };

    const handleDeleteCampaign = async () => {
        if (!campaign) return;
        if (window.confirm("Are you sure you want to delete this campaign? This action cannot be undone. Your student profile will remain verified.")) {
            try {
                // 1. Delete Campaign
                const { error: deletionError } = await supabase
                    .from('campaigns')
                    .delete()
                    .eq('id', campaign.id);

                if (deletionError) throw deletionError;

                // 2. Clear local state and refresh user
                setCampaign(null);
                await refreshUser();

                toast.success("Campaign deleted successfully.");
                setActiveTab('overview');

            } catch (error: any) {
                console.error("Error deleting campaign:", error);
                toast.error("Failed to delete campaign: " + error.message);
            }
        }
    };

    const handleExtendCampaign = async () => {
        if (!campaign) return;
        setIsExtending(true);
        try {
            const currentEndDate = new Date(campaign.endDate);
            const newDate = new Date(currentEndDate);
            newDate.setDate(newDate.getDate() + extensionDays);

            const { error } = await supabase
                .from('campaigns')
                .update({ end_date: newDate.toISOString() })
                .eq('id', campaign.id);

            if (error) throw error;

            toast.success("Campaign extended successfully!");
            setShowExtendModal(false);
            await fetchDashboardData();
        } catch (err: any) {
            console.error("Error extending campaign:", err);
            toast.error("Failed to extend: " + err.message);
        } finally {
            setIsExtending(false);
        }
    };


    const handleShowDonors = async () => {
        if (!campaign) return;
        setShowDonorsModal(true);
        setLoadingDonations(true);
        try {
            const { data: donations, error } = await supabase
                .from('donations')
                .select(`
                    *,
                    donors (
                        first_name,
                        last_name
                    )
                `)
                .eq('campaign_id', campaign.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (donations) {
                setAllDonations(donations.map((d: any) => ({
                    id: d.id,
                    name: d.is_anonymous ? 'Anonymous' : `${d.donors?.first_name || 'Unknown'} ${d.donors?.last_name || ''}`.trim(),
                    amount: d.amount,
                    date: new Date(d.created_at).toLocaleDateString(),
                    isAnonymous: d.is_anonymous
                })));
            }
        } catch (err) {
            console.error("Error fetching all donations:", err);
        } finally {
            setLoadingDonations(false);
        }
    };



    useEffect(() => {
        fetchVerificationStatus();
    }, [user]);

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    if (authLoading || (loading && !campaign && !user?.student?.universityId)) {
        return <LoadingScreen />;
    }

    return (
        <div className="dashboard-page">
            {/* ... (existing sidebar and main content) */}

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/">
                        <img src="/images/logo.png" alt="UniFund" className="sidebar-brand-image" />
                    </Link>
                </div>

                <div className="px-6 mb-4">
                    <Link to="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors text-sm font-medium p-2 rounded-md hover:bg-primary-50">
                        <Home size={16} />
                        Back to Website
                    </Link>
                </div>

                <div className="sidebar-user-profile">
                    <div className="sidebar-avatar">
                        {user?.student?.profileImage ? (
                            <img
                                src={user.student.profileImage}
                                alt="Profile"
                                className="sidebar-avatar-img"
                            />
                        ) : (
                            <div className="sidebar-avatar-placeholder">
                                <UserIcon size={32} strokeWidth={1.5} />
                            </div>
                        )}
                    </div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user?.student?.firstName} {user?.student?.lastName}</span>
                        <span className="sidebar-user-role">Student</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <Home size={20} />
                        Overview
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'campaign' ? 'active' : ''}`}
                        onClick={() => setActiveTab('campaign')}
                    >
                        <BarChart3 size={20} />
                        My Campaign
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        <PlusCircle size={20} />
                        Create Campaign
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={20} />
                        Settings
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'verification' ? 'active' : ''}`}
                        onClick={() => setActiveTab('verification')}
                    >
                        <ShieldCheck size={20} />
                        Verification
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            title="Toggle Menu"
                        >
                            <Menu size={24} />
                        </button>
                        {activeTab !== 'overview' && (
                            <button
                                onClick={() => setActiveTab('overview')}
                                className="mobile-back-btn"
                                title="Back to Overview"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <div>
                            <h1 className="page-title">
                                {activeTab === 'overview' && 'Dashboard Overview'}
                                {activeTab === 'campaign' && 'My Campaign'}
                                {activeTab === 'create' && 'Create Campaign'}
                                {activeTab === 'settings' && 'Account Settings'}
                            </h1>
                            <p className="page-subtitle">Welcome back, {user?.student?.firstName || 'Student'}!</p>
                        </div>
                    </div>
                    <div className="header-right">
                        {activeTab !== 'create' && !campaign && (
                            <button
                                className="mobile-create-btn"
                                onClick={() => setActiveTab('create')}
                            >
                                <PlusCircle size={20} />
                                <span className="mobile-btn-text">Create</span>
                            </button>
                        )}
                        <div className="notification-wrapper" style={{ position: 'relative' }}>
                            <button
                                className="notification-btn"
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={20} />
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span className="notification-dot" />
                                )}
                            </button>

                            {showNotifications && (
                                <NotificationsDropdown onClose={() => setShowNotifications(false)} />
                            )}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="dashboard-content">
                    {/* Verification Tab */}
                    {activeTab === 'verification' && (
                        <div className="card">
                            <div className="card-header border-b border-gray-100 p-6">
                                <h3 className="text-xl font-bold text-gray-900">Profile Verification</h3>
                            </div>
                            <div className="card-body p-6">
                                {user?.student?.verificationStatus === 'approved' ? (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
                                            <CheckCircle size={40} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">You are Verified!</h3>
                                        <p className="text-gray-600 max-w-md mx-auto">
                                            Your student profile is fully verified. Verified profiles receive significantly more trust and donations from the community.
                                        </p>
                                    </div>
                                ) : user?.student?.verificationStatus === 'pending' ? (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 text-amber-600 mb-6">
                                            <Clock size={40} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h3>
                                        <p className="text-gray-600 max-w-md mx-auto">
                                            We are currently reviewing your documents. This process usually takes 24-48 hours. You will be notified via email once approved.
                                        </p>
                                    </div>
                                ) : (
                                    <StudentVerificationForm user={user} onSuccess={async () => {
                                        await refreshUser();
                                        await fetchVerificationStatus();
                                    }} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Verification Status rendering... */}
                            {user?.student?.verificationStatus === 'pending' && (
                                <div className="alert alert-info">
                                    <Clock size={24} />
                                    <div>
                                        <h4>Verification Pending</h4>
                                        <p>Your documents are being reviewed. You'll be able to create a campaign once verified.</p>
                                    </div>
                                </div>
                            )}

                            {user?.student?.verificationStatus === 'approved' && verificationCount === 0 && (
                                <div className="alert alert-warning mb-6 border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <AlertCircle className="text-yellow-600 shrink-0" size={24} />
                                        <div>
                                            <h4 className="font-bold text-yellow-800 text-lg mb-1">Action Required: Re-submit Documents</h4>
                                            <p className="text-yellow-700">
                                                It looks like your account was restored but your documents are missing.
                                                Please <strong>Create a Campaign</strong> to upload your verification documents (ID, Fee Statement, Enrollment) and restore your full account status.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {user?.student?.verificationStatus === 'approved' && (verificationCount !== 0) && (
                                <div className="alert alert-success">
                                    <CheckCircle size={24} />
                                    <div>
                                        <h4>Account Verified</h4>
                                        <p>Your student status has been verified. You can now create and manage your campaign.</p>
                                    </div>
                                </div>
                            )}



                            {!campaign ? (
                                <div className="card empty-campaign-card">
                                    {/* Empty state... */}
                                    <div className="empty-campaign-content">
                                        <div className="empty-campaign-icon">
                                            <FileText size={48} strokeWidth={1.5} />
                                        </div>
                                        <h3 className="empty-campaign-title">No Active Campaign</h3>
                                        <p className="empty-campaign-description">
                                            Create a fundraising campaign to start receiving support for your education.
                                            Your campaign will be reviewed by our team before going live.
                                        </p>
                                        <button
                                            className="btn btn-primary btn-lg"
                                            onClick={() => setActiveTab('create')}
                                        >
                                            <PlusCircle size={20} />
                                            Create New Campaign
                                        </button>
                                        <p className="empty-campaign-note">
                                            <Clock size={14} />
                                            Campaign approval typically takes 24-48 hours
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>


                                    {/* Status alerts... */}
                                    {campaign.status === 'pending' && (
                                        <div className="alert alert-warning" style={{ marginBottom: 'var(--spacing-6)' }}>
                                            <Clock size={24} />
                                            <div>
                                                <h4>Campaign Pending Approval</h4>
                                                <p>Your campaign is being reviewed by our team. It will go live once approved. This typically takes 24-48 hours.</p>
                                            </div>
                                        </div>
                                    )}

                                    {campaign.status === 'rejected' && (
                                        <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-6)' }}>
                                            <XCircle size={24} />
                                            <div>
                                                <h4>Campaign Not Approved</h4>
                                                <p>Unfortunately, your campaign was not approved. Please review the feedback and try creating a new campaign.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stats Cards */}
                                    <div className="stats-grid animate-fade-in">
                                        <div className="stat-card primary premium-card">
                                            <div className="stat-icon">
                                                <DollarSign size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-value">R{(campaign.raised || 0).toLocaleString()}</span>
                                                <span className="stat-label">Total Raised</span>
                                            </div>
                                        </div>

                                        <div
                                            className="stat-card success premium-card"
                                            onClick={handleShowDonors}
                                            style={{ cursor: 'pointer' }}
                                            title="View Donor List"
                                        >
                                            <div className="stat-icon">
                                                <Users size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-value">{campaign.donors || 0}</span>
                                                <span className="stat-label">Total Donors</span>
                                            </div>
                                        </div>

                                        <div
                                            className="stat-card warning premium-card"
                                            onClick={() => setActiveTab('campaign')}
                                            style={{ cursor: 'pointer' }}
                                            title="View Campaign Details"
                                        >
                                            <div className="stat-icon">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-value">{Math.round(percentFunded)}%</span>
                                                <span className="stat-label">Goal Progress</span>
                                            </div>
                                        </div>

                                        <div
                                            className="stat-card info premium-card"
                                            onClick={() => setShowExtendModal(true)}
                                            style={{ cursor: 'pointer' }}
                                            title="Click to extend campaign duration"
                                        >
                                            <div className="stat-icon">
                                                <Clock size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-value">{campaign.daysLeft || 0}</span>
                                                <span className="stat-label">Days Left</span>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Rest of Overview Content */}
                                    <div className="premium-card">
                                        <div className="card-header">
                                            <h2 className="card-title">Goal Progress</h2>
                                            <Link to={`/campaign/${campaign.id}`} className="card-link">
                                                <Eye size={18} /> View Campaign
                                            </Link>
                                        </div>
                                        <div className="card-body">
                                            <div className="progress-header">
                                                <div>
                                                    <span className="progress-raised">R{(campaign.raised || 0).toLocaleString()}</span>
                                                    <p className="text-sm text-gray-500 mt-1">Raised of R{(campaign.goal || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-primary-600">{percentFunded}%</span>
                                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Funded</p>
                                                </div>
                                            </div>

                                            <div className="premium-progress-container">
                                                <div
                                                    className="premium-progress-fill"
                                                    style={{ width: `${percentFunded}%` }}
                                                />
                                            </div>

                                            <div className="flex justify-between items-center mt-4">
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-bold text-gray-900">R{Math.max(0, (campaign.goal || 0) - (campaign.raised || 0)).toLocaleString()}</span> needed to complete
                                                </p>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${campaign.daysLeft > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {campaign.daysLeft} days left
                                                </span>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Share, Recent Donations sections... */}
                                    {/* Note: I am not repeating the whole file content here as I only need to target replace/insert. 
                                            I should be careful with the replacement chunk to not delete subsequent code.
                                            However, since the file is large, I'll return the modified chunks properly.
                                        */}

                                    <div className="premium-card">
                                        <div className="card-header">
                                            <h2 className="card-title">Share Your Success</h2>
                                        </div>
                                        <div className="card-body">
                                            <p className="mb-6 text-gray-600">
                                                Personal sharing is the #1 way to get funded. Use these buttons to quickly spread the word.
                                            </p>
                                            <div className="share-link-group mb-6" style={{ display: 'flex', gap: '10px' }}>
                                                <div className="flex-1 relative">
                                                    <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        className="form-input"
                                                        style={{ paddingLeft: '40px', fontSize: '13px' }}
                                                        value={`${window.location.origin}/campaign/${campaign.id}`}
                                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                                    />
                                                </div>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/campaign/${campaign.id}`;
                                                        navigator.clipboard.writeText(url);
                                                        toast.success("Link copied!");
                                                    }}
                                                >
                                                    <Share2 size={16} />
                                                    <span className="hidden sm:inline">Copy</span>
                                                </button>
                                            </div>

                                            <div className="share-floating-panel">
                                                <a
                                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/campaign/${campaign.id}`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="social-button-circle facebook"
                                                    title="Share on Facebook"
                                                >
                                                    <Facebook size={20} fill="white" />
                                                </a>
                                                <a
                                                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/campaign/${campaign.id}`)}&text=${encodeURIComponent(`Please help me reach my study goal on UniFund!`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="social-button-circle twitter"
                                                    title="Share on Twitter"
                                                >
                                                    <Twitter size={20} fill="white" />
                                                </a>
                                                <a
                                                    href={`https://wa.me/?text=${encodeURIComponent(`Hi! Please check out my funding campaign on UniFund: ${campaign.title} - ${window.location.origin}/campaign/${campaign.id}`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="social-button-circle whatsapp"
                                                    title="Share on WhatsApp"
                                                >
                                                    <MessageSquare size={20} fill="white" />
                                                </a>
                                                <a
                                                    href={`mailto:?subject=${encodeURIComponent(`Support my education on UniFund`)}&body=${encodeURIComponent(`Hi, I'm raising funds for my studies: ${window.location.origin}/campaign/${campaign.id}`)}`}
                                                    className="social-button-circle link"
                                                    title="Share via Email"
                                                >
                                                    <Bell size={20} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="card">
                                        <div className="card-header">
                                            <h2 className="card-title">Recent Donations</h2>
                                        </div>
                                        <div className="donations-list">
                                            {recentDonations.length > 0 ? recentDonations.map((donation) => (
                                                <div key={donation.id} className="donation-item">
                                                    <div className="donor-avatar">
                                                        {donation.isAnonymous ? '?' : donation.name[0]}
                                                    </div>
                                                    <div className="donor-info">
                                                        <span className="donor-name">{donation.name}</span>
                                                        <span className="donation-date">{donation.date}</span>
                                                    </div>
                                                    <span className="donation-amount">+R{donation.amount.toLocaleString()}</span>
                                                </div>
                                            )) : (
                                                <p className="text-gray-500 text-center py-4">No donations yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )
                    }

                    {/* ... (Danger Zone and other tabs are untouched) */}
                    {
                        activeTab === 'overview' && campaign && (
                            <div className="card mt-8 border-l-4 border-red-500 bg-white">
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Deleting your campaign is irreversible. All data, including funding breakdown and comments, will be lost.
                                        This action cannot be undone.
                                    </p>
                                    <button
                                        onClick={handleDeleteCampaign}
                                        className="btn bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors"
                                    >
                                        <Trash2 size={16} className="mr-2" />
                                        Delete Campaign
                                    </button>
                                </div>
                            </div>
                        )
                    }

                    {/* Campaign Tab */}
                    {
                        activeTab === 'campaign' && (
                            campaign && university ? (
                                <>
                                    <div className="card">
                                        <div className="card-header">
                                            <h2 className="card-title">Campaign Details</h2>
                                            <div className="card-actions">
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setActiveTab('edit')}
                                                >
                                                    <Edit size={16} /> Edit
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/campaign/${campaign.id}`;
                                                        navigator.clipboard.writeText(url);
                                                        alert("Campaign link copied to clipboard!");
                                                    }}
                                                >
                                                    <Share2 size={16} /> Share
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm text-red-600 hover:text-white hover:bg-red-600 border-red-200"
                                                    onClick={handleDeleteCampaign}
                                                >
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <div className="campaign-overview">
                                                <div className="campaign-avatar-large">
                                                    {campaign.images?.[0] || user?.student?.profileImage ? (
                                                        <img
                                                            src={campaign.images?.[0] || user?.student?.profileImage}
                                                            alt={campaign.title}
                                                            className="campaign-preview-img"
                                                        />
                                                    ) : (
                                                        <UserIcon size={48} strokeWidth={1.5} />
                                                    )}
                                                </div>
                                                <div className="campaign-details">
                                                    <h3 className="campaign-title-large">{campaign.title}</h3>
                                                    <p className="campaign-course-detail">{user?.student?.course}</p>
                                                    <p className="campaign-university-detail">{university.name}</p>
                                                    <div className="campaign-status">
                                                        <span className="status-badge active">Active</span>
                                                        {user?.student?.verificationStatus === 'approved' && (
                                                            <span className="status-badge verified">
                                                                <CheckCircle size={14} /> Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="campaign-story-section">
                                                <h4>Your Story</h4>
                                                <p>{campaign.story}</p>
                                            </div>

                                            <div className="funding-breakdown-section">
                                                <h4>Funding Breakdown</h4>
                                                <div className="breakdown-grid">
                                                    {campaign.fundingBreakdown.map((item) => (
                                                        <div key={item.id} className="breakdown-card">
                                                            <span className="breakdown-name">{item.name}</span>
                                                            <span className="breakdown-amount">R{item.amount.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>


                                        </div>
                                    </div>

                                    {/* Payment Info */}
                                    <div className="card">
                                        <div className="card-header">
                                            <h2 className="card-title">Payment Information</h2>
                                        </div>
                                        <div className="card-body">
                                            <div className="payment-info">
                                                <p className="payment-note">
                                                    All donations are paid directly to your university account using your student number as reference.
                                                </p>
                                                <div className="payment-details">
                                                    <div className="payment-row">
                                                        <span>University:</span>
                                                        <span>{university.name}</span>
                                                    </div>
                                                    <div className="payment-row">
                                                        <span>Bank:</span>
                                                        <span>{university.bankName}</span>
                                                    </div>
                                                    <div className="payment-row">
                                                        <span>Account:</span>
                                                        <span>{university.accountName}</span>
                                                    </div>
                                                    <div className="payment-row highlight">
                                                        <span>Reference:</span>
                                                        <span>{user?.student?.studentNumber || 'Loading...'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 card">
                                    <h3 className="text-lg font-semibold mb-2">No Campaign Found</h3>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setActiveTab('create')}
                                    >
                                        <PlusCircle size={18} className="mr-2" />
                                        Create Campaign
                                    </button>
                                </div>
                            )
                        )
                    }

                    {/* Create Campaign Tab */}
                    {
                        activeTab === 'create' && (
                            user?.student?.verificationStatus === 'approved' ? (
                                university ?
                                    <CampaignForm
                                        university={university}
                                        user={user}
                                        onSuccess={async () => {
                                            setActiveTab('campaign');
                                            await fetchDashboardData();
                                        }}
                                        onCancel={() => setActiveTab('overview')}
                                    /> : <div>Loading university info...</div>
                            ) : user?.student?.verificationStatus === 'pending' ? (
                                <div className="card text-center py-12">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-6">
                                        <Clock size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Pending</h3>
                                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                                        Your documents are currently being reviewed by our administrators. This process typically takes 24-48 hours.
                                        You will be notified once your account is verified.
                                    </p>
                                    <button className="btn btn-secondary" onClick={() => setActiveTab('overview')}>
                                        Back to Overview
                                    </button>
                                </div>
                            ) : (
                                <div className="card">
                                    <div className="card-header border-b border-gray-100 p-6">
                                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <ShieldCheck size={24} className="text-primary-600" />
                                            Verification Required
                                        </h3>
                                    </div>
                                    <div className="card-body p-6">
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                            <div className="flex gap-3">
                                                <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                                                <div>
                                                    <h4 className="font-bold text-yellow-800">You need to verify your account first</h4>
                                                    <p className="text-yellow-700 text-sm mt-1">
                                                        To ensure the safety of our platform and build trust with donors, we require all students to verified their identity and enrollment status before creating a campaign.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <StudentVerificationForm user={user} onSuccess={async () => {
                                            await refreshUser(true);
                                            await fetchVerificationStatus();
                                        }} />
                                    </div>
                                </div>
                            )
                        )
                    }

                    {/* Edit Campaign Tab */}
                    {
                        activeTab === 'edit' && campaign && university && (
                            <CampaignForm
                                university={university}
                                user={user}
                                initialData={campaign}
                                isEditing={true}
                                onSuccess={async () => {
                                    setActiveTab('campaign');
                                    await fetchDashboardData();
                                }}
                                onCancel={() => setActiveTab('campaign')}
                            />
                        )
                    }

                    {/* Settings Tab */}
                    {
                        activeTab === 'settings' && user && (
                            <div className="card">
                                <div className="card-header">
                                    <h2 className="card-title">Account Settings</h2>
                                </div>
                                <div className="card-body">
                                    <div className="settings-section">
                                        <h4>Profile Information</h4>
                                        <div className="settings-form">
                                            {/* Profile Image Upload */}
                                            <div className="form-group mb-6">
                                                <label className="form-label">Profile Picture</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                                        {user.student?.profileImage ? (
                                                            <img
                                                                src={user.student.profileImage}
                                                                alt="Profile"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                <UserIcon size={40} />
                                                            </div>
                                                        )}
                                                        {imageUploading && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                                                                Uploading...
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="btn btn-secondary cursor-pointer flex items-center gap-2">
                                                            <Camera size={16} />
                                                            Upload New Photo
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={handleProfileImageUpload}
                                                                disabled={imageUploading}
                                                            />
                                                        </label>
                                                        <p className="text-xs text-gray-500">
                                                            Recommended: Square JPG, PNG. Max 2MB.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">First Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={settingsFirstName}
                                                        onChange={(e) => setSettingsFirstName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Last Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={settingsLastName}
                                                        onChange={(e) => setSettingsLastName(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-input"
                                                    value={user.email || ''}
                                                    readOnly
                                                    disabled
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Phone</label>
                                                <input
                                                    type="tel"
                                                    className="form-input"
                                                    value={settingsPhone}
                                                    onChange={(e) => setSettingsPhone(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                className="btn btn-primary mt-4"
                                                disabled={savingSettings}
                                                onClick={async () => {
                                                    setSavingSettings(true);
                                                    try {
                                                        const { error } = await supabase
                                                            .from('students')
                                                            .update({
                                                                phone: settingsPhone,
                                                                first_name: settingsFirstName,
                                                                last_name: settingsLastName
                                                            })
                                                            .eq('id', user.id);
                                                        if (error) throw error;
                                                        toast.success("Settings saved!");
                                                        await refreshUser(true);
                                                    } catch (err: any) {
                                                        toast.error("Failed to save: " + err.message);
                                                    } finally {
                                                        setSavingSettings(false);
                                                    }
                                                }}
                                            >
                                                {savingSettings ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="settings-section">
                                        <h4>University Information</h4>
                                        <div className="settings-form">
                                            <div className="form-group">
                                                <label className="form-label">University</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={university?.name || ''}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Student Number</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={user.student?.studentNumber || ''}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Course</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={user.student?.course || ''}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
            </main>

            {/* Extend Modal */}
            {showExtendModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Extend Campaign</h3>
                            <button onClick={() => setShowExtendModal(false)} className="modal-close-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="mb-4 text-gray-600">
                                Extend your campaign duration to reach more donors.
                            </p>
                            <div className="form-group">
                                <label className="form-label" htmlFor="extension-days">Extend by</label>
                                <select
                                    id="extension-days"
                                    name="extensionDays"
                                    className="form-input"
                                    value={extensionDays}
                                    onChange={(e) => setExtensionDays(parseInt(e.target.value))}
                                >
                                    <option value={15}>15 Days</option>
                                    <option value={30}>30 Days</option>
                                    <option value={60}>60 Days</option>
                                    <option value={90}>90 Days</option>
                                </select>
                            </div>

                            <div className="info-box mt-4">
                                <Clock size={20} />
                                <div>
                                    <h4>New End Date</h4>
                                    <p>
                                        {(() => {
                                            const currentEndDate = new Date(campaign?.endDate || new Date());
                                            const now = new Date();
                                            const baseDate = currentEndDate < now ? now : currentEndDate;

                                            const d = new Date(baseDate);
                                            d.setDate(d.getDate() + extensionDays);
                                            return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                                        })()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowExtendModal(false)}
                                disabled={isExtending}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleExtendCampaign}
                                disabled={isExtending}
                            >
                                {isExtending ? 'Extending...' : 'Confirm Extension'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Donors Modal */}
            {showDonorsModal && (
                <div className="modal-overlay" onClick={() => setShowDonorsModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Donation History</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Total Raised: <span className="font-bold text-green-600">
                                        R{(loadingDonations
                                            ? (campaign?.raised || 0)
                                            : allDonations.reduce((sum, d) => sum + d.amount, 0)
                                        ).toLocaleString()}
                                    </span>
                                </p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setShowDonorsModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {loadingDonations ? (
                                <div className="py-8 text-center text-gray-500">Loading donations...</div>
                            ) : (
                                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                    {allDonations.length > 0 ? (
                                        allDonations.map((donation) => (
                                            <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                                                        {donation.isAnonymous ? '?' : donation.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{donation.name}</p>
                                                        <p className="text-xs text-gray-500">{donation.date}</p>
                                                    </div>
                                                </div>
                                                <div className="font-bold text-gray-900">
                                                    +R{donation.amount.toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No donations yet. Share your campaign to get started!
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface CampaignFormProps {
    university: University;
    user: any;
    onSuccess: () => void;
    onCancel?: () => void;
    initialData?: Campaign | null;
    isEditing?: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
    university,
    user,
    onSuccess,
    onCancel,
    initialData,
    isEditing = false
}) => {
    const toast = useToast();
    const [step, setStep] = useState(0); // Always start at 0 to allow type selection check
    const [campaignType, setCampaignType] = useState<'standard' | 'quick'>(
        initialData?.type || (initialData?.isUrgent ? 'quick' : 'standard')
    );
    const [submitting, setSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.images?.[0] || null);

    // Revoke blob URL when it changes or component unmounts to prevent memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        story: initialData?.story || '',
        category: initialData?.category || 'tuition',
        goal: initialData?.goal?.toString() || '',
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        invoice: null as File | null,
        feeStatement: null as File | null,
        idDocument: null as File | null,
        enrollmentDocument: null as File | null,
        fundingBreakdown: initialData?.fundingBreakdown || [
            { id: '1', name: 'Tuition Fees', amount: 0 },
            { id: '2', name: 'Accommodation', amount: 0 },
            { id: '3', name: 'Textbooks & Materials', amount: 0 },
            { id: '4', name: 'Other Expenses', amount: 0 },
        ],
    });

    const hasDonations = (initialData?.raised || 0) > 0;

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateBreakdownAmount = (id: string, amount: number) => {
        setFormData(prev => ({
            ...prev,
            fundingBreakdown: prev.fundingBreakdown.map((item: any) =>
                item.id === id ? { ...item, amount } : item
            )
        }));
    };

    const updateBreakdownName = (id: string, name: string) => {
        setFormData(prev => ({
            ...prev,
            fundingBreakdown: prev.fundingBreakdown.map((item: any) =>
                item.id === id ? { ...item, name } : item
            )
        }));
    };

    const addBreakdownItem = () => {
        setFormData(prev => ({
            ...prev,
            fundingBreakdown: [
                ...prev.fundingBreakdown,
                { id: Date.now().toString(), name: '', amount: 0 }
            ]
        }));
    };

    const removeBreakdownItem = (id: string) => {
        setFormData(prev => ({
            ...prev,
            fundingBreakdown: prev.fundingBreakdown.filter((item: any) => item.id !== id)
        }));
    };

    const totalBreakdown = formData.fundingBreakdown.reduce((sum: number, item: any) => sum + item.amount, 0);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size exceeds 5MB limit.");
                e.target.value = '';
                return;
            }
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // 1. Upload Documents
            let feeStatementUrl = initialData?.feeStatementUrl || null;
            let idUrl = initialData?.idUrl || null;
            let enrollmentUrl = initialData?.enrollmentUrl || null;

            if (formData.feeStatement) {
                const fileExt = formData.feeStatement.name.split('.').pop();
                const fileName = `campaigns/${user.id}/fee_statement_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, formData.feeStatement);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
                feeStatementUrl = publicUrl;
            }

            if (formData.idDocument) {
                const fileExt = formData.idDocument.name.split('.').pop();
                const fileName = `campaigns/${user.id}/id_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, formData.idDocument);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
                idUrl = publicUrl;
            }

            if (formData.enrollmentDocument) {
                const fileExt = formData.enrollmentDocument.name.split('.').pop();
                const fileName = `campaigns/${user.id}/enrollment_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, formData.enrollmentDocument);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
                enrollmentUrl = publicUrl;
            }

            let invoiceUrl = initialData?.invoiceUrl || null;
            if (formData.invoice) {
                const fileExt = formData.invoice.name.split('.').pop();
                const fileName = `invoices/${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, formData.invoice);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
                invoiceUrl = publicUrl;
            }
            let images = initialData?.images || [];
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: imgError, data: imgData } = await supabase.storage
                    .from('campaign-images')
                    .upload(fileName, imageFile);

                if (imgError) throw imgError;

                // Get public URL for display
                const { data: { publicUrl } } = supabase.storage
                    .from('campaign-images')
                    .getPublicUrl(imgData.path);

                images = [publicUrl]; // For now single image
            } else if (images.length === 0 && user?.student?.profileImage) {
                // If no image uploaded and no existing images, use profile image
                images = [user.student.profileImage];
            }

            // Filter out any potential null/undefined values
            images = images.filter(Boolean);

            // 3. Upsert Campaign
            const campaignPayload = {
                student_id: user.id,
                title: formData.title,
                story: formData.story,
                goal_amount: parseFloat(formData.goal),
                category: formData.category,
                is_urgent: campaignType === 'quick',
                type: campaignType,
                end_date: formData.endDate,
                invoice_url: invoiceUrl,
                fee_statement_url: feeStatementUrl,
                id_url: idUrl,
                enrollment_url: enrollmentUrl,
                images: images,
                // New campaigns start as 'pending' and require admin approval
                status: isEditing ? (initialData?.status || 'pending') : 'pending',
                updated_at: new Date().toISOString()
            };


            let campaignId = initialData?.id;

            if (isEditing && campaignId) {
                const { error: updateError } = await supabase
                    .from('campaigns')
                    .update(campaignPayload)
                    .eq('id', campaignId);

                if (updateError) throw updateError;

                // Delete old funding items and re-insert (simplest for now)
                await supabase.from('funding_items').delete().eq('campaign_id', campaignId);
            } else {
                const { data: newCampaign, error: insertError } = await supabase
                    .from('campaigns')
                    .insert({ ...campaignPayload, start_date: new Date().toISOString() })
                    .select()
                    .single();

                if (insertError) throw insertError;
                campaignId = newCampaign.id;
            }

            // 4. Insert Funding Items
            const items = formData.fundingBreakdown
                .filter(item => item.amount > 0)
                .map(item => ({
                    campaign_id: campaignId,
                    name: item.name,
                    amount: item.amount
                }));

            if (items.length > 0) {
                const { error: itemsError } = await supabase
                    .from('funding_items')
                    .insert(items);
                if (itemsError) throw itemsError;
            }

            // --- NOTIFICATIONS ---
            if (!isEditing) {
                // 1. Notify Student
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    title: 'Campaign Submitted 🚀',
                    message: `Your campaign "${formData.title}" has been submitted for review.`,
                    type: 'campaign_update'
                });

                // 2. Notify Admins
                const { data: admins } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'admin');

                if (admins && admins.length > 0) {
                    const adminNotifications = admins.map(admin => ({
                        user_id: admin.id,
                        title: 'New Campaign Pending 📢',
                        message: `A new campaign "${formData.title}" by ${user.student?.firstName || 'Student'} is waiting for approval.`,
                        type: 'campaign_update'
                    }));
                    await supabase.from('notifications').insert(adminNotifications);
                }
            }

            if (isEditing) {
                toast.success("Campaign updated successfully!");
            } else {
                toast.success("Campaign submitted successfully! Your campaign is now pending review by our team.");
            }
            onSuccess();


        } catch (error: any) {
            console.error("Error processing campaign:", error);
            toast.error("Operation failed: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>



            <div className="campaign-steps">
                {step > 0 && (
                    <>
                        <div className={`campaign-step ${step >= 1 ? 'active' : ''}`}>
                            <span className="campaign-step-num">1</span>
                            <span className="campaign-step-label">Basic Info</span>
                        </div>
                        <div className="campaign-step-line" />
                        <div className={`campaign-step ${step >= 2 ? 'active' : ''}`}>
                            <span className="campaign-step-num">2</span>
                            <span className="campaign-step-label">Your Story</span>
                        </div>
                        <div className="campaign-step-line" />
                        <div className={`campaign-step ${step >= 3 ? 'active' : ''}`}>
                            <span className="campaign-step-num">3</span>
                            <span className="campaign-step-label">Funding</span>
                        </div>
                    </>
                )}
            </div>

            <div className="card">
                <div className="card-body">
                    {/* Step 0: Campaign Type Selection */}
                    {step === 0 && (
                        <div className="campaign-form-step">
                            <h3>Select Campaign Type</h3>
                            <p className="form-description">
                                Choose the type of campaign that best fits your needs.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div
                                    className={`card p-6 cursor-pointer border-2 transition-all ${campaignType === 'standard' ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:border-gray-200'}`}
                                    onClick={() => setCampaignType('standard')}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-full ${campaignType === 'standard' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}>
                                            <GraduationCap size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold">Standard Campaign</h4>
                                            <p className="text-sm text-gray-500">For tuition, accommodation, and general studies</p>
                                        </div>
                                    </div>
                                    <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
                                        <li>Comprehensive fundraising</li>
                                        <li>Detailed story and breakdown</li>
                                        <li>Longer duration (up to 6 months)</li>
                                    </ul>
                                </div>

                                <div
                                    className={`card p-6 cursor-pointer border-2 transition-all ${campaignType === 'quick' ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:border-gray-200'}`}
                                    onClick={() => setCampaignType('quick')}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-full ${campaignType === 'quick' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}>
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold">Quick Assist</h4>
                                            <p className="text-sm text-gray-500">Urgent help for smaller expenses</p>
                                        </div>
                                    </div>
                                    <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
                                        <li>Food, Stationary, App Fees</li>
                                        <li>Simplified creation process</li>
                                        <li>Urgent priority status</li>
                                        <li>Direct payment to university</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="form-actions mt-8">
                                {onCancel && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-lg"
                                        onClick={onCancel}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-primary btn-lg w-full md:w-auto"
                                    onClick={() => {
                                        if (campaignType === 'quick') {
                                            // Reset breakdown for quick to single item
                                            setFormData(prev => ({
                                                ...prev,
                                                category: 'food',
                                                fundingBreakdown: [{ id: '1', name: 'Assistance', amount: 0 }]
                                            }));
                                        }
                                        setStep(1);
                                    }}
                                >
                                    Confirm Type & Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="campaign-form-step">
                            <h3>{campaignType === 'quick' ? 'Quick Assist Details' : 'Campaign Basic Information'}</h3>
                            <p className="form-description">
                                {campaignType === 'quick'
                                    ? 'Provide details for your urgent request.'
                                    : 'Tell us about your campaign. This will be the first thing potential donors see.'}
                            </p>

                            <div className="form-group">
                                <label className="form-label" htmlFor="campaign-category">Category *</label>
                                <select
                                    id="campaign-category"
                                    name="category"
                                    className="form-input form-select"
                                    value={formData.category}
                                    onChange={(e) => {
                                        const newCategory = e.target.value as any;
                                        setFormData(prev => ({
                                            ...prev,
                                            category: newCategory,
                                            // Reset breakdown to single item based on new category for both types
                                            fundingBreakdown: [{
                                                id: Date.now().toString(),
                                                name: CAMPAIGN_CATEGORIES.find(c => c.value === newCategory)?.label || 'Other',
                                                amount: 0
                                            }]
                                        }));
                                    }}
                                >
                                    {CAMPAIGN_CATEGORIES
                                        .filter(c => campaignType === 'quick'
                                            ? ['food', 'application_fee', 'registration_fee', 'stationary'].includes(c.value)
                                            : !['food', 'application_fee', 'registration_fee', 'stationary'].includes(c.value)
                                        )
                                        .map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="campaign-title">Campaign Title *</label>
                                <input
                                    type="text"
                                    id="campaign-title"
                                    name="title"
                                    className="form-input"
                                    placeholder={campaignType === 'quick' ? "e.g., Urgent Food Assistance Needed" : "e.g., Help me complete my Computer Science degree"}
                                    value={formData.title}
                                    onChange={(e) => updateFormData('title', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="campaign-goal">Funding Goal (ZAR) *</label>
                                <div className="amount-input-wrapper">
                                    <span className="currency-prefix">R</span>
                                    <input
                                        type="number"
                                        id="campaign-goal"
                                        name="goal"
                                        className={`form-input amount-input ${hasDonations ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        placeholder={campaignType === 'quick' ? "500" : "45000"}
                                        value={formData.goal}
                                        disabled={hasDonations}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            updateFormData('goal', val);
                                            // Auto-update breakdown for quick assist
                                            if (campaignType === 'quick') {
                                                updateBreakdownAmount('1', parseInt(val) || 0);
                                            }
                                        }}
                                    />
                                </div>
                                {hasDonations && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        Funding goal cannot be changed once donations have been received.
                                    </p>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Campaign Image *</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="image-upload"
                                        onChange={handleImageChange}
                                    />
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        {previewUrl ? (
                                            <div className="relative group">
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="max-h-48 mx-auto rounded-lg shadow-sm"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                    <Upload size={32} className="text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload size={32} className="text-gray-400" />
                                                <span className="text-primary-600 font-medium">Click to upload campaign image</span>
                                                <span className="text-xs text-gray-500">JPG, PNG or WEBP (Max 5MB)</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {formData.category === 'stationary' && (
                                <div className="form-group">
                                    <label className="form-label">Upload Invoice (Required for Stationary, Must be certified) *</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.png"
                                            className="hidden"
                                            id="invoice-upload"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 5 * 1024 * 1024) {
                                                        toast.error("File exceeds 5MB limit.");
                                                        e.target.value = '';
                                                        return;
                                                    }
                                                    setFormData(prev => ({ ...prev, invoice: file }));
                                                }
                                            }}
                                        />
                                        <label htmlFor="invoice-upload" className="cursor-pointer">
                                            <div className="flex flex-col items-center gap-2">
                                                <Share2 className="rotate-90" size={24} />
                                                <span className="text-primary-600 font-medium">Click to upload invoice</span>
                                                <span className="text-xs text-gray-500">PDF, JPG or PNG (Max 5MB)</span>
                                            </div>
                                        </label>
                                        {formData.invoice && (
                                            <div className="mt-2 text-sm text-green-600 flex items-center justify-center gap-2">
                                                <CheckCircle size={14} />
                                                {formData.invoice.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="campaign-documents-section p-6 bg-gray-50 rounded-xl border border-gray-100 mb-8">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="text-primary-600" size={20} />
                                    Required Documents
                                </h4>
                                <p className="text-sm text-gray-600 mb-6">These documents are mandatory to verify your campaign and ensure transparency for donors.</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Fee Statement */}
                                    <div className="doc-upload-card">
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Fee Statement *</label>
                                        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${formData.feeStatement ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400'}`}>
                                            <input
                                                type="file"
                                                className="hidden"
                                                id="fee-statement-upload"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            toast.error("File exceeds 5MB limit.");
                                                            e.target.value = '';
                                                            return;
                                                        }
                                                        setFormData(prev => ({ ...prev, feeStatement: file }));
                                                    }
                                                }}
                                            />
                                            <label htmlFor="fee-statement-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                                {formData.feeStatement ? <CheckCircle size={24} className="text-green-500" /> : <Upload size={24} className="text-gray-400" />}
                                                <span className={`text-xs font-medium ${formData.feeStatement ? 'text-green-700' : 'text-primary-600'}`}>
                                                    {formData.feeStatement ? formData.feeStatement.name : 'Upload Fee Statement'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* ID Document */}
                                    <div className="doc-upload-card">
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">ID Document *</label>
                                        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${formData.idDocument ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400'}`}>
                                            <input
                                                type="file"
                                                className="hidden"
                                                id="id-upload"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            toast.error("File exceeds 5MB limit.");
                                                            e.target.value = '';
                                                            return;
                                                        }
                                                        setFormData(prev => ({ ...prev, idDocument: file }));
                                                    }
                                                }}
                                            />
                                            <label htmlFor="id-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                                {formData.idDocument ? <CheckCircle size={24} className="text-green-500" /> : <Upload size={24} className="text-gray-400" />}
                                                <span className={`text-xs font-medium ${formData.idDocument ? 'text-green-700' : 'text-primary-600'}`}>
                                                    {formData.idDocument ? formData.idDocument.name : 'Upload ID'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Proof of Enrollment */}
                                    <div className="doc-upload-card">
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Proof of Enrollment *</label>
                                        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${formData.enrollmentDocument ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400'}`}>
                                            <input
                                                type="file"
                                                className="hidden"
                                                id="enrollment-upload"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            toast.error("File exceeds 5MB limit.");
                                                            e.target.value = '';
                                                            return;
                                                        }
                                                        setFormData(prev => ({ ...prev, enrollmentDocument: file }));
                                                    }
                                                }}
                                            />
                                            <label htmlFor="enrollment-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                                {formData.enrollmentDocument ? <CheckCircle size={24} className="text-green-500" /> : <Upload size={24} className="text-gray-400" />}
                                                <span className={`text-xs font-medium ${formData.enrollmentDocument ? 'text-green-700' : 'text-primary-600'}`}>
                                                    {formData.enrollmentDocument ? formData.enrollmentDocument.name : 'Upload Enrollment'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div className="form-group">
                                <label className="form-label" htmlFor="campaign-end-date">Campaign End Date *</label>
                                <input
                                    type="date"
                                    id="campaign-end-date"
                                    name="endDate"
                                    className="form-input"
                                    value={formData.endDate}
                                    onChange={(e) => updateFormData('endDate', e.target.value)}
                                />
                            </div>

                            <div className="info-box">
                                <AlertCircle size={20} />
                                <div>
                                    <h4>Payment Information</h4>
                                    <p>
                                        All donations are paid directly to {university.name} using your student number as reference.
                                        Platform does not accumulate or hold funds.
                                    </p>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-lg"
                                    onClick={() => setStep(0)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-lg"
                                    onClick={() => setStep(2)}
                                    disabled={
                                        !formData.title ||
                                        !formData.goal ||
                                        !formData.endDate ||
                                        !imageFile ||
                                        !formData.feeStatement ||
                                        !formData.idDocument ||
                                        !formData.enrollmentDocument ||
                                        (formData.category === 'stationary' && !formData.invoice)
                                    }
                                >
                                    Continue to Your Story
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Story */}
                    {step === 2 && (
                        <div className="campaign-form-step">
                            <h3>Share Your Story</h3>
                            <p className="form-description">
                                This is your chance to connect with donors. Be authentic and share why you need support.
                            </p>

                            <div className="form-group">
                                <label className="form-label" htmlFor="campaign-story">Your Story *</label>
                                <textarea
                                    id="campaign-story"
                                    name="story"
                                    className="form-input form-textarea"
                                    rows={8}
                                    placeholder="Tell donors about yourself, your background, your goals, and why you need their support..."
                                    value={formData.story}
                                    onChange={(e) => updateFormData('story', e.target.value)}
                                />
                                <p className="form-hint">{formData.story.length}/1000 characters (minimum 200 recommended)</p>
                            </div>

                            <div className="story-tips">
                                <h4>Tips for a compelling story:</h4>
                                <ul>
                                    <li>Share your background and what brought you to this point</li>
                                    <li>Explain your educational goals and why they matter to you</li>
                                    <li>Describe how the funding will specifically help you</li>
                                    <li>Share what you hope to achieve after graduation</li>
                                    <li>Be authentic – donors connect with real stories</li>
                                </ul>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-lg"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-lg"
                                    onClick={() => setStep(3)}
                                    disabled={formData.story.length < 50}
                                >
                                    Continue to Funding
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Funding Breakdown */}
                    {step === 3 && (
                        <div className="campaign-form-step">
                            <h3>Funding Breakdown</h3>
                            <p className="form-description">
                                {campaignType === 'quick'
                                    ? 'Start your campaign immediately.'
                                    : 'Explain specifically how the funds will be used. This helps build trust with donors.'}
                            </p>

                            {campaignType === 'standard' && (
                                <div className="breakdown-inputs">
                                    {formData.fundingBreakdown.map((item) => (
                                        <div key={item.id} className="breakdown-input-row" style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                            <div className="breakdown-name-wrapper" style={{ flex: 2 }}>
                                                <input
                                                    type="text"
                                                    id={`breakdown-name-${item.id}`}
                                                    name={`breakdown-name-${item.id}`}
                                                    aria-label="Item Name"
                                                    className="form-input"
                                                    value={item.name}
                                                    onChange={(e) => updateBreakdownName(item.id, e.target.value)}
                                                    placeholder="Item Name"
                                                />
                                            </div>
                                            <div className="amount-input-wrapper" style={{ flex: 1 }}>
                                                <span className="currency-prefix">R</span>
                                                <input
                                                    type="number"
                                                    id={`breakdown-amount-${item.id}`}
                                                    name={`breakdown-amount-${item.id}`}
                                                    aria-label="Item Amount"
                                                    className={`form-input amount-input ${hasDonations ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                    value={item.amount || ''}
                                                    placeholder="0"
                                                    disabled={hasDonations}
                                                    onChange={(e) => updateBreakdownAmount(item.id, parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            {!hasDonations && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline btn-sm text-red-500"
                                                    onClick={() => removeBreakdownItem(item.id)}
                                                    title="Remove Item"
                                                    style={{ padding: '8px' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {!hasDonations && (
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm w-full mt-2 mb-4 dashed-border"
                                            onClick={addBreakdownItem}
                                            style={{ borderStyle: 'dashed' }}
                                        >
                                            <Plus size={16} /> Add Funding Item
                                        </button>
                                    )}

                                    <div className="total-breakdown">
                                        <span>Total:</span>
                                        <span className={totalBreakdown !== parseInt(formData.goal) ? 'text-red-500' : 'text-green-600'}>
                                            R{totalBreakdown.toLocaleString()}
                                        </span>
                                    </div>
                                    {totalBreakdown !== parseInt(formData.goal) && (
                                        <p className="text-red-500 text-sm mt-2">
                                            Total breakdown must equal Funding Goal (R{parseInt(formData.goal).toLocaleString()})
                                        </p>
                                    )}
                                </div>
                            )}

                            {campaignType === 'quick' && (
                                <div className="summary-card">
                                    <h4>Request Summary</h4>
                                    <div className="summary-row">
                                        <span>Category:</span>
                                        <span className="capitalize">{formData.category}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Total Amount:</span>
                                        <span className="font-bold">R{formData.goal}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-4">
                                        By confirming, you agree that this request is urgent and accurate.
                                    </p>
                                </div>
                            )}

                            <div className="form-actions mt-8">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-lg"
                                    onClick={() => setStep(2)}
                                    disabled={submitting}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-lg"
                                    disabled={campaignType === 'standard' && totalBreakdown !== parseInt(formData.goal) || submitting}
                                    onClick={handleSubmit}
                                >
                                    {submitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Launch Campaign')}
                                </button>
                            </div>


                        </div>
                    )}
                </div>

            </div>
        </>
    );
};

export default StudentDashboard;
