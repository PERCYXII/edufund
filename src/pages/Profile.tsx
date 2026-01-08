import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Mail,
    Calendar,
    CheckCircle,
    AlertCircle,
    GraduationCap,
    Building,
    Heart,
    Edit3,
    ArrowLeft,
    Loader2,
    MapPin,
    Phone,
    Share2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { University } from '../types';
import './Dashboard.css';

const Profile: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [university, setUniversity] = useState<University | null>(null);
    const [stats, setStats] = useState({
        donationsCount: 0,
        campaignsCount: 0,
        totalDonated: 0
    });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        const fetchExtraData = async () => {
            if (!user) return;

            if (user.role === 'student' && user.student?.universityId) {
                const { data } = await supabase
                    .from('universities')
                    .select('*')
                    .eq('id', user.student.universityId)
                    .single();
                if (data) setUniversity(data as any);

                const { count } = await supabase
                    .from('campaigns')
                    .select('*', { count: 'exact', head: true })
                    .eq('student_id', user.id);
                setStats(prev => ({ ...prev, campaignsCount: count || 0 }));
            }

            if (user.role === 'donor') {
                const { count } = await supabase
                    .from('donations')
                    .select('*', { count: 'exact', head: true })
                    .eq('donor_id', user.id)
                    .eq('payment_status', 'completed');

                const { data: donations } = await supabase
                    .from('donations')
                    .select('amount')
                    .eq('donor_id', user.id)
                    .eq('payment_status', 'completed');

                const total = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
                setStats(prev => ({ ...prev, donationsCount: count || 0, totalDonated: total }));
            }
        };

        fetchExtraData();
    }, [user, authLoading, navigate]);

    if (authLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-primary-500" size={48} />
        </div>
    );

    if (!user) return null;

    const profile = user.student || user.donor;
    const profileImage = profile?.profileImage;
    const displayName = profile ? `${profile.firstName} ${profile.lastName}` : 'Administrator';
    const joinedDate = new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="dashboard-page profile-page bg-gray-50 min-h-screen">
            <main className="dashboard-main" style={{ marginLeft: 0, padding: '0' }}>
                {/* Cover Header */}
                <div className="h-48 md:h-64 bg-gradient-to-r from-primary-600 to-indigo-700 relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-all flex items-center gap-2 pr-4"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-all flex items-center gap-2 pr-4"
                    >
                        <Edit3 size={18} /> Edit Profile
                    </button>
                </div>

                <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Profile Info Card */}
                            <div className="card shadow-xl overflow-hidden animate-fade-in-up">
                                <div className="card-body text-center pt-12 pb-8">
                                    <div className="user-avatar-lg mx-auto mb-4 border-4 border-white shadow-lg" style={{ width: '128px', height: '128px', fontSize: '3.5rem', borderRadius: '50%', overflow: 'hidden' }}>
                                        {profileImage ? (
                                            <img src={profileImage} alt={displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            displayName[0]
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                                    <p className="text-primary-600 font-semibold uppercase tracking-wider text-xs mb-4">{user.role}</p>

                                    <div className="flex flex-col gap-3 text-sm text-gray-500 max-w-[240px] mx-auto">
                                        <div className="flex items-center gap-2 justify-center">
                                            <Mail size={14} /> {user.email}
                                        </div>
                                        {profile?.phone && (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Phone size={14} /> {profile.phone}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 justify-center">
                                            <Calendar size={14} /> Joined {joinedDate}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-top grid grid-cols-2 gap-4">
                                        {user.role === 'student' ? (
                                            <>
                                                <div>
                                                    <p className="text-xl font-bold text-gray-900">{stats.campaignsCount}</p>
                                                    <p className="text-xs text-gray-500 uppercase">Campaigns</p>
                                                </div>
                                                <div>
                                                    <p className={`text-xl font-bold ${user.student?.verificationStatus === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>
                                                        {user.student?.verificationStatus === 'approved' ? 'Verified' : 'Pending'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 uppercase">Status</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="text-xl font-bold text-gray-900">{stats.donationsCount}</p>
                                                    <p className="text-xs text-gray-500 uppercase">Donations</p>
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold text-primary-600">R{stats.totalDonated.toLocaleString()}</p>
                                                    <p className="text-xs text-gray-500 uppercase">Total Gifted</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Badge/Achievement Card */}
                            {user.role === 'donor' && stats.donationsCount > 0 && (
                                <div className="card bg-indigo-900 text-white shadow-lg animate-fade-in-up delay-100">
                                    <div className="card-body">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                                <Heart className="text-rose-400" fill="currentColor" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold">Student Champion</h3>
                                                <p className="text-sm text-indigo-200">Influencing futures through kindness.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Verification Status Card for Students */}
                            {user.role === 'student' && (
                                <div className={`card shadow-sm animate-fade-in-up delay-100 ${user.student?.verificationStatus === 'approved' ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                                    <div className="card-body">
                                        <div className="flex items-center gap-3">
                                            {user.student?.verificationStatus === 'approved' ? (
                                                <CheckCircle className="text-green-600" />
                                            ) : (
                                                <AlertCircle className="text-amber-600" />
                                            )}
                                            <div>
                                                <h3 className={`font-bold ${user.student?.verificationStatus === 'approved' ? 'text-green-900' : 'text-amber-900'}`}>
                                                    {user.student?.verificationStatus === 'approved' ? 'Identity Verified' : 'Verification Pending'}
                                                </h3>
                                                <p className={`text-sm ${user.student?.verificationStatus === 'approved' ? 'text-green-800' : 'text-amber-800'}`}>
                                                    {user.student?.verificationStatus === 'approved'
                                                        ? 'Your account is fully verified for fundraising.'
                                                        : 'We are currently reviewing your documents.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8 animate-fade-in-up delay-200">

                            {/* Detailed Info */}
                            <div className="card shadow-sm">
                                <div className="card-header border-bottom flex items-center justify-between">
                                    <h2 className="card-title">Professional & Academic Information</h2>
                                    <Share2 size={18} className="text-gray-400 cursor-pointer hover:text-primary-600" />
                                </div>
                                <div className="card-body">
                                    {user.role === 'student' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                    <Building size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">University</p>
                                                    <p className="font-semibold text-gray-800">{university?.name || 'Loading...'}</p>
                                                    <p className="text-sm text-gray-500">Number: {user.student?.studentNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                                                    <GraduationCap size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Course of Study</p>
                                                    <p className="font-semibold text-gray-800">{user.student?.course}</p>
                                                    <p className="text-sm text-gray-500">Year {user.student?.yearOfStudy} • Graduating {user.student?.expectedGraduation ? new Date(user.student.expectedGraduation).getFullYear() : 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                                                    <MapPin size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Campus Location</p>
                                                    <p className="font-semibold text-gray-800">{university?.physicalAddress?.split(',')[0] || 'Unknown'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                                                    <CheckCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Role</p>
                                                    <p className="font-semibold text-gray-800">Verified Student</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <p className="text-gray-600">You are registered as a Donor. Your primary goal on UniFund is to support student growth and accessibility in higher education.</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-sm font-bold text-gray-400 uppercase mb-1">Impact Level</p>
                                                    <p className="text-lg font-bold text-gray-800">
                                                        {stats.totalDonated > 5000 ? 'Platinum Partner' : stats.totalDonated > 1000 ? 'Silver Supporter' : 'Bronze Contributor'}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-sm font-bold text-gray-400 uppercase mb-1">Preference</p>
                                                    <p className="text-lg font-bold text-gray-800">
                                                        {(user.donor as any)?.isAnonymous ? 'Anonymous Giver' : 'Public Profile'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Activities / Recent Placeholder */}
                            <div className="card shadow-sm">
                                <div className="card-header border-bottom">
                                    <h2 className="card-title">Recent Activity</h2>
                                </div>
                                <div className="card-body">
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                            <Calendar size={24} />
                                        </div>
                                        <p className="text-gray-500">No recent activity to show in your public profile.</p>
                                        <button
                                            className="btn btn-link text-primary-600"
                                            onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}
                                        >
                                            Go to dashboard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                
                .profile-page .card {
                    border-radius: 1.25rem;
                    border: 1px solid rgba(0,0,0,0.05);
                }
                
                .profile-page .btn-link:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
};

export default Profile;
