import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Save, Lock, Globe, Shield, Bell } from 'lucide-react';

const AdminSettings: React.FC = () => {
    const { updatePassword } = useAuth();
    const { success, error: toastError } = useToast();

    // Password State
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [loadingPass, setLoadingPass] = useState(false);

    // General State
    const [general, setGeneral] = useState({
        siteName: 'EduFund',
        supportEmail: 'support@edufund.co.za',
        maintenanceMode: false
    });

    // Notification State
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        newVerifyAlerts: true,
        donationAlerts: false
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toastError('Passwords do not match');
            return;
        }
        if (passwords.new.length < 6) {
            toastError('Password must be at least 6 characters');
            return;
        }

        setLoadingPass(true);
        const { success: ok, error } = await updatePassword(passwords.new);
        setLoadingPass(false);

        if (ok) {
            success('Password updated successfully');
            setPasswords({ current: '', new: '', confirm: '' });
        } else {
            toastError(error || 'Failed to update password');
        }
    };

    return (
        <div className="admin-content animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="admin-page-title">Admin Settings</h2>
                    <p className="admin-page-subtitle">Manage platform configuration and security</p>
                </div>
            </div>

            {/* General Settings Card */}
            <div className="admin-section">
                <div className="admin-section-title flex items-center gap-3">
                    <Globe size={20} className="text-primary-600" />
                    Platform Configuration
                </div>
                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="form-group mb-0">
                            <label className="form-label">Platform Name</label>
                            <input
                                type="text"
                                value={general.siteName}
                                onChange={e => setGeneral({ ...general, siteName: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">Support Email</label>
                            <input
                                type="email"
                                value={general.supportEmail}
                                onChange={e => setGeneral({ ...general, supportEmail: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                name="maintenance"
                                id="maintenance"
                                checked={general.maintenanceMode}
                                onChange={e => setGeneral({ ...general, maintenanceMode: e.target.checked })}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                style={{
                                    right: general.maintenanceMode ? '0' : 'auto',
                                    left: general.maintenanceMode ? 'auto' : '0',
                                    borderColor: general.maintenanceMode ? 'var(--color-primary-600)' : '#ccc'
                                }}
                            />
                            <label
                                htmlFor="maintenance"
                                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${general.maintenanceMode ? 'bg-primary-600' : 'bg-gray-300'}`}
                                style={{ backgroundColor: general.maintenanceMode ? 'var(--color-primary-600)' : '#e5e7eb' }}
                            ></label>
                        </div>
                        <div>
                            <label htmlFor="maintenance" className="font-semibold text-gray-800 cursor-pointer block">
                                Maintenance Mode
                            </label>
                            <span className="text-sm text-gray-500">
                                Restricts access to the student/donor portal. Admins can still log in.
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => success('Platform settings saved successfully')}
                        className="btn btn-primary"
                    >
                        <Save size={18} />
                        Save Configuration
                    </button>
                </div>
            </div>

            {/* Notifications Card */}
            <div className="admin-section">
                <div className="admin-section-title flex items-center gap-3">
                    <Bell size={20} className="text-accent-yellow" style={{ color: 'var(--color-warning-500)' }} />
                    Notification Preferences
                </div>
                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div className="space-y-4">
                        {[
                            { id: 'newVerifyAlerts', label: 'Email Alerts for New Verifications', desc: 'Receive an email when a new student applies.' },
                            { id: 'donationAlerts', label: 'Large Donation Alerts (>R5000)', desc: 'Get notified for significant contributions.' }
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-800">{item.label}</p>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                                <button
                                    onClick={() => setNotifications({ ...notifications, [item.id]: !notifications[item.id as keyof typeof notifications] })}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${notifications[item.id as keyof typeof notifications] ? 'bg-primary-600' : 'bg-gray-200'}`}
                                    style={{ backgroundColor: notifications[item.id as keyof typeof notifications] ? 'var(--color-primary-600)' : '#e5e7eb' }}
                                >
                                    <div
                                        className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${notifications[item.id as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Security Card */}
            <div className="admin-section">
                <div className="admin-section-title flex items-center gap-3">
                    <Shield size={20} className="text-green-500" />
                    Security & Access
                </div>
                <div style={{ padding: 'var(--spacing-6)' }}>
                    <form onSubmit={handlePasswordChange} className="max-w-md">
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                placeholder="Min 6 characters"
                                value={passwords.new}
                                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                className="form-input"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input
                                type="password"
                                placeholder="Re-enter new password"
                                value={passwords.confirm}
                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loadingPass}
                                className="btn btn-primary"
                            >
                                <Lock size={18} />
                                {loadingPass ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
