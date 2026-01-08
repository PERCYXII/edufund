import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Login.css';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const { updatePassword } = useAuth();
    const { success: toastSuccess } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const result = await updatePassword(password);
            if (result.success) {
                toastSuccess('Password Updated!', 'Your password has been reset successfully.');
                setIsComplete(true);
            } else {
                setError(result.error || 'Failed to update password. Your link might be expired.');
            }
        } catch {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isComplete) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="login-card text-center">
                        <div className="login-header">
                            <div className="header-icon-container" style={{ color: 'var(--color-success-600)', background: 'var(--color-success-50)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-4)' }}>
                                <CheckCircle size={32} />
                            </div>
                            <h1 className="login-title">Success!</h1>
                            <p className="login-subtitle">Your password has been updated successfully.</p>
                        </div>

                        <div className="login-form">
                            <button
                                className="btn btn-primary btn-lg login-btn"
                                onClick={() => navigate('/login')}
                            >
                                Log In Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo-container">
                            <img src="/images/logo.png" alt="UniFund Logo" className="login-logo-image" />
                        </div>
                        <h1 className="login-title">New Password</h1>
                        <p className="login-subtitle">Please enter your new password below</p>
                    </div>

                    <form className="login-form" onSubmit={handleReset}>
                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <div className="password-wrapper">
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)', zIndex: 1 }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="••••••••"
                                    style={{ paddingLeft: '40px' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <div className="password-wrapper">
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)', zIndex: 1 }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="••••••••"
                                    style={{ paddingLeft: '40px' }}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg login-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </button>

                        <p className="login-footer">
                            Remember your password? <Link to="/login">Return to Login</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
