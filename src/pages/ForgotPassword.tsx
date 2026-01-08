import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const { resetPasswordForEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await resetPasswordForEmail(email);
            if (result.success) {
                setIsSubmitted(true);
            } else {
                setError(result.error || 'Failed to send reset link. Please try again.');
            }
        } catch {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="login-card text-center">
                        <div className="login-header">
                            <div className="header-icon-container" style={{ color: 'var(--color-success-600)', background: 'var(--color-success-50)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-4)' }}>
                                <CheckCircle size={32} />
                            </div>
                            <h1 className="login-title">Check Your Email</h1>
                            <p className="login-subtitle">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                        </div>

                        <div className="login-form">
                            <button
                                className="btn btn-primary btn-lg login-btn"
                                onClick={() => navigate('/login')}
                            >
                                Return to Login
                            </button>
                            <p className="login-footer">
                                Didn't receive the email? <button onClick={handleSubmit} className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', fontWeight: 600, cursor: 'pointer' }}>Try again</button>
                            </p>
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
                        <h1 className="login-title">Reset Password</h1>
                        <p className="login-subtitle">Enter your email and we'll send you a link to reset your password</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-with-icon" style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="you@email.com"
                                    style={{ paddingLeft: '40px' }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg login-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                        </button>

                        <p className="login-footer">
                            <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <ArrowLeft size={16} /> Back to Login
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
