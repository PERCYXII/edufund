import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Settings as SettingsIcon,
    Bell,
    Lock,
    User as UserIcon,
    Shield,
    Smartphone,
    Camera,
    CheckCircle,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    Mail,
    Download,
    FileText,
    ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Dashboard.css';

const Settings: React.FC = () => {
    const { user, isLoading: authLoading, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'privacy'>('profile');

    // File upload ref
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });

    // Password states
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        if (user) {
            const profile = user.student || user.donor;
            if (profile) {
                setFormData({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phone: (profile as any).phone || ''
                });
            }
        }
    }, [user, authLoading, navigate]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const tableName = user.role === 'student' ? 'students' : 'donors';
            const { error } = await supabase
                .from(tableName)
                .update({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone || null
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshUser();
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
        } catch (error: any) {
            setMessage({ text: error.message || 'Failed to update profile', type: 'error' });
        } finally {
            setIsSaving(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ text: 'Passwords do not match', type: 'error' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            setPasswordData({ newPassword: '', confirmPassword: '' });
            setMessage({ text: 'Password updated successfully!', type: 'success' });
        } catch (error: any) {
            setMessage({ text: error.message || 'Failed to update password', type: 'error' });
        } finally {
            setIsUpdatingPassword(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ text: 'Image size too large. Max 5MB allowed.', type: 'error' });
            return;
        }

        setIsUploadingImage(true);
        setMessage(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update database
            const tableName = user.role === 'student' ? 'students' : 'donors';
            const { error: dbError } = await supabase
                .from(tableName)
                .update({ profile_image_url: publicUrl })
                .eq('id', user.id);

            if (dbError) throw dbError;

            await refreshUser();
            setMessage({ text: 'Profile picture updated!', type: 'success' });
        } catch (error: any) {
            setMessage({ text: error.message || 'Failed to upload image', type: 'error' });
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmResult = window.confirm("Are you sure you want to delete your account? This action is permanent and cannot be undone.");
        if (confirmResult) {
            // In a real app, you'd call a function to delete all user data and then sign out
            alert("This functionality is currently restricted. Please contact support to request account deletion.");
        }
    };

    if (authLoading) return (
        <div className="loading-container">
            <Loader2 className="animate-spin text-primary-500" size={48} />
            <p>Loading your settings...</p>
        </div>
    );

    if (!user) return null;

    const profile = user.student || user.donor;
    const profileImage = profile?.profileImage;

    return (
        <div className="dashboard-page settings-page">
            <main className="dashboard-main" style={{ marginLeft: 0, padding: '2rem 1rem' }}>
                <div className="settings-container max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="settings-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <SettingsIcon className="text-primary-600" /> Account Settings
                            </h1>
                            <p className="text-gray-500">Manage your profile information and security preferences</p>
                        </div>
                        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                            Back to Dashboard
                        </button>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className={`alert-container animate-slide-down mb-6`}>
                            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} flex items-start gap-3`}>
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <div className="flex-1">
                                    <p className="font-semibold">{message.type === 'success' ? 'Success' : 'Error'}</p>
                                    <p>{message.text}</p>
                                </div>
                                <button onClick={() => setMessage(null)} className="text-sm opacity-50 hover:opacity-100">×</button>
                            </div>
                        </div>
                    )}

                    <div className="settings-layout grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1">
                            <div className="card settings-nav shadow-sm sticky top-8">
                                <div className="p-4 border-bottom text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Primary Settings
                                </div>
                                <nav className="flex flex-col">
                                    <button
                                        className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('profile')}
                                    >
                                        <UserIcon size={18} /> Personal Info
                                    </button>
                                    <button
                                        className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('security')}
                                    >
                                        <Lock size={18} /> Password & Security
                                    </button>
                                    <button
                                        className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('notifications')}
                                    >
                                        <Bell size={18} /> Notifications
                                    </button>
                                </nav>
                                <div className="p-4 border-top mt-4 border-bottom text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Extra
                                </div>
                                <nav className="flex flex-col">
                                    <button
                                        className={`settings-nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('privacy')}
                                    >
                                        <Shield size={18} /> Privacy & Data
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-3 space-y-8">

                            {/* Personal Info Tab */}
                            {activeTab === 'profile' && (
                                <div className="animate-fade-in space-y-8">
                                    {/* Profile Avatar Section */}
                                    <div className="card overflow-hidden">
                                        <div className="card-header bg-gray-50 border-bottom">
                                            <h2 className="card-title">Profile Picture</h2>
                                        </div>
                                        <div className="card-body py-8">
                                            <div className="flex flex-col md:flex-row items-center gap-8">
                                                <div className="relative group">
                                                    <div className="user-avatar-lg" style={{ width: '120px', height: '120px', fontSize: '3rem', borderRadius: '50%', overflow: 'hidden' }}>
                                                        {profileImage ? (
                                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                        ) : (
                                                            profile?.firstName?.[0] || 'U'
                                                        )}
                                                    </div>
                                                    <button
                                                        className="absolute bottom-1 right-1 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all group-hover:scale-110"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isUploadingImage}
                                                    >
                                                        {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                                    </button>
                                                </div>
                                                <div className="flex-1 text-center md:text-left">
                                                    <h3 className="text-lg font-bold">Update Profile Photo</h3>
                                                    <p className="text-gray-500 mb-4 max-w-sm">Recommended: Square JPEG or PNG, at least 400x400 pixels. Max size 5MB.</p>
                                                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={isUploadingImage}
                                                        >
                                                            {isUploadingImage ? 'Uploading...' : 'Upload New Photo'}
                                                        </button>
                                                        <button
                                                            className="btn btn-outline btn-sm text-error-600 border-error-200 hover:bg-error-50"
                                                            onClick={async () => {
                                                                const tableName = user.role === 'student' ? 'students' : 'donors';
                                                                await supabase.from(tableName).update({ profile_image_url: null }).eq('id', user.id);
                                                                await refreshUser();
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        style={{ display: 'none' }}
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* General Form */}
                                    <div className="card">
                                        <div className="card-header border-bottom">
                                            <h2 className="card-title">General Information</h2>
                                        </div>
                                        <div className="card-body">
                                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="form-group">
                                                        <label className="form-label text-sm font-bold uppercase tracking-wide text-gray-500">First Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={formData.firstName}
                                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label text-sm font-bold uppercase tracking-wide text-gray-500">Last Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={formData.lastName}
                                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label text-sm font-bold uppercase tracking-wide text-gray-500">Email Address (Read-Only)</label>
                                                    <div className="flex">
                                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                                            <Mail size={16} />
                                                        </span>
                                                        <input
                                                            type="email"
                                                            className="form-input rounded-l-none bg-gray-50 cursor-not-allowed"
                                                            value={user.email}
                                                            disabled
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1 italic">For security reasons, email addresses cannot be changed directly.</p>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label text-sm font-bold uppercase tracking-wide text-gray-500">Phone Number</label>
                                                    <div className="flex">
                                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                                            <Smartphone size={16} />
                                                        </span>
                                                        <input
                                                            type="tel"
                                                            className="form-input rounded-l-none"
                                                            placeholder="+27 12 345 6789"
                                                            value={formData.phone}
                                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-top flex justify-end">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary flex items-center gap-2"
                                                        disabled={isSaving}
                                                    >
                                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
                                                        {isSaving ? 'Saving Changes...' : 'Update Profile'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="animate-fade-in space-y-8">
                                    <div className="card">
                                        <div className="card-header border-bottom">
                                            <h2 className="card-title">Change Password</h2>
                                        </div>
                                        <div className="card-body">
                                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                                <div className="form-group">
                                                    <label className="form-label text-sm font-bold uppercase tracking-wide text-gray-500">New Password</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            className="form-input pr-10"
                                                            placeholder="••••••••"
                                                            value={passwordData.newPassword}
                                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label text-sm font-bold uppercase tracking-wide text-gray-500">Confirm New Password</label>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        className="form-input"
                                                        placeholder="••••••••"
                                                        value={passwordData.confirmPassword}
                                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                        required
                                                    />
                                                </div>

                                                <div className="pt-4 flex justify-end">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                        disabled={isUpdatingPassword}
                                                    >
                                                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="card border-error-100 bg-error-50/20">
                                        <div className="card-header border-bottom border-error-100 flex items-center gap-2">
                                            <AlertCircle size={20} className="text-error-600" />
                                            <h2 className="card-title text-error-700">Danger Zone</h2>
                                        </div>
                                        <div className="card-body">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">Delete Account</h3>
                                                    <p className="text-gray-600">Once you delete your account, there is no going back. Please be certain.</p>
                                                </div>
                                                <button
                                                    className="btn btn-error text-white hover:bg-error-700 bg-error-600 border-none"
                                                    onClick={handleDeleteAccount}
                                                >
                                                    Delete My Account
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div className="animate-fade-in card">
                                    <div className="card-header border-bottom">
                                        <h2 className="card-title">Notification Preferences</h2>
                                    </div>
                                    <div className="card-body space-y-6">
                                        <div className="space-y-4">
                                            <label className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 cursor-pointer">
                                                <div>
                                                    <p className="font-bold">Email Notifications</p>
                                                    <p className="text-sm text-gray-500">Receive updates about your campaign and donations via email.</p>
                                                </div>
                                                <input type="checkbox" defaultChecked className="toggle-switch" />
                                            </label>

                                            <label className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 cursor-pointer">
                                                <div>
                                                    <p className="font-bold">Security Alerts</p>
                                                    <p className="text-sm text-gray-500">Get notified about new logins and security changes.</p>
                                                </div>
                                                <input type="checkbox" defaultChecked disabled className="toggle-switch" />
                                            </label>

                                            <label className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 cursor-pointer">
                                                <div>
                                                    <p className="font-bold">Social Updates</p>
                                                    <p className="text-sm text-gray-500">Receive tips on how to improve your campaign reach.</p>
                                                </div>
                                                <input type="checkbox" className="toggle-switch" />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Privacy & Data Tab */}
                            {activeTab === 'privacy' && (
                                <div className="animate-fade-in space-y-8">
                                    {/* Data Management */}
                                    <div className="card">
                                        <div className="card-header border-bottom">
                                            <h2 className="card-title">Data Management</h2>
                                        </div>
                                        <div className="card-body space-y-6">
                                            <div className="p-6 bg-gray-50 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 text-primary-600 border">
                                                        <Download size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">Download Your Information</h3>
                                                        <p className="text-sm text-gray-500">Get a copy of the data you've shared with UniFund. This includes profile info, campaigns, and donation history.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
                                                    onClick={() => alert("Your data request has been submitted. You will receive an export via email within 48 hours.")}
                                                >
                                                    Request Export
                                                </button>
                                            </div>

                                            <div className="space-y-4 pt-4">
                                                <h3 className="font-bold text-gray-900">Privacy Preferences</h3>
                                                <div className="space-y-3">
                                                    <label className="flex items-start gap-4 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                                                        <input type="checkbox" defaultChecked className="mt-1" />
                                                        <div>
                                                            <p className="font-bold">Public Profile Visibility</p>
                                                            <p className="text-sm text-gray-500">Allow others to find your profile via search and view your public activity.</p>
                                                        </div>
                                                    </label>

                                                    <label className="flex items-start gap-4 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                                                        <input type="checkbox" defaultChecked className="mt-1" />
                                                        <div>
                                                            <p className="font-bold">Third-party Analytics</p>
                                                            <p className="text-sm text-gray-500">Allow UniFund to use anonymized data to improve platform performance and security.</p>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* POPIA Compliance Card */}
                                    <div className="card border-primary-100 bg-primary-50/10">
                                        <div className="card-header border-bottom flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Shield size={20} className="text-primary-600" />
                                                <h2 className="card-title text-primary-900">POPIA Compliance</h2>
                                            </div>
                                            <span className="badge badge-success">Active Protection</span>
                                        </div>
                                        <div className="card-body space-y-4">
                                            <p className="text-gray-700">
                                                UniFund is committed to protecting your personal information in accordance with the <strong>Protection of Personal Information Act (POPIA)</strong> of South Africa.
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div className="p-4 bg-white rounded-xl shadow-sm border border-primary-50">
                                                    <h4 className="font-bold text-sm text-primary-800 uppercase mb-2">Lawful Processing</h4>
                                                    <p className="text-xs text-gray-600">We only collect data necessary for fundraising and student verification purposes as stated in our Privacy Policy.</p>
                                                </div>
                                                <div className="p-4 bg-white rounded-xl shadow-sm border border-primary-50">
                                                    <h4 className="font-bold text-sm text-primary-800 uppercase mb-2">Secure Storage</h4>
                                                    <p className="text-xs text-gray-600">Your sensitive documents and personal identifiers are encrypted and stored in secure data centers.</p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-top flex flex-wrap gap-4">
                                                <button className="text-sm text-primary-600 font-bold flex items-center gap-1 hover:underline">
                                                    <FileText size={14} /> Full Privacy Policy
                                                </button>
                                                <button className="text-sm text-primary-600 font-bold flex items-center gap-1 hover:underline">
                                                    <ExternalLink size={14} /> Data Subject Access Request
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .settings-page {
                    background: #f8fafc;
                    min-height: 100vh;
                }
                .settings-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 14px 20px;
                    text-align: left;
                    background: none;
                    border: none;
                    border-left: 3px solid transparent;
                    color: #64748b;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .settings-nav-item:hover {
                    background: #f1f5f9;
                    color: var(--color-primary-600);
                }
                .settings-nav-item.active {
                    background: #eff6ff;
                    color: #2563eb;
                    border-left-color: #2563eb;
                    font-weight: 600;
                }
                .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1.25rem; border-radius: 12px; }
                .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 1.25rem; border-radius: 12px; }
                
                .toggle-switch {
                    position: relative;
                    width: 44px;
                    height: 24px;
                    -webkit-appearance: none;
                    background: #cbd5e1;
                    outline: none;
                    border-radius: 20px;
                    transition: .4s;
                    cursor: pointer;
                }
                .toggle-switch:checked {
                    background: #2563eb;
                }
                .toggle-switch:before {
                    content: '';
                    position: absolute;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    top: 3px;
                    left: 3px;
                    background: #fff;
                    transition: .4s;
                }
                .toggle-switch:checked:before {
                    left: 23px;
                }
                .toggle-switch:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                @keyframes slide-down {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-slide-down { animation: slide-down 0.3s ease-out; }
                .animate-fade-in { animation: fade-in 0.4s ease-out; }
                
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 400px;
                    gap: 16px;
                }
            `}</style>
        </div>
    );
};

export default Settings;
