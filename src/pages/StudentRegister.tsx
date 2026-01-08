import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const StudentRegister: React.FC = () => {
    const navigate = useNavigate();
    const { register, isLoggedIn, user, isLoading } = useAuth(); // Create checks for existing session
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Redirect if already logged in
    React.useEffect(() => {
        if (!isLoading && isLoggedIn && user) {
            if (user.role === 'student') {
                navigate('/dashboard');
            } else if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/browse');
            }
        }
    }, [isLoading, isLoggedIn, user, navigate]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });

    if (isLoading) {
        return <div className="register-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    }

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrorMessage(null);
    };

    const validateForm = (): boolean => {
        if (!formData.email || !formData.password || !formData.confirmPassword) {
            setErrorMessage("All fields are required");
            return false;
        }
        if (formData.password !== formData.confirmPassword) {

            setErrorMessage("Passwords do not match");
            // Highlight the error
            return false;
        }
        if (formData.password.length < 6) {
            setErrorMessage("Password must be at least 6 characters");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            // 1. Register User (Auth only)
            // We pass 'student' as role. 
            // We pass a simplified object. The AuthContext will be updated to handle this 
            // or simply pass it through to supabase.auth.signUp.

            const registrationPayload = {
                email: formData.email,
                password: formData.password,
                // We add dummy fields for now if the context strictly requires them
                // until we update the context typings.
                firstName: 'New',
                lastName: 'Student',
                phone: '',
                universityId: '',
                studentNumber: '',
                course: '',
                yearOfStudy: '',
                expectedGraduation: '',
                // File fields will be missing, which is fine as they are optional in type usually or we cast
            };

            // Cast to any to bypass strict type check until context is updated
            const { success, error } = await register('student', registrationPayload as any);

            if (!success) {
                throw new Error(error || 'Registration failed');
            }

            // 2. Redirect to Complete Profile
            navigate('/complete-profile');

        } catch (error: any) {
            console.error("Registration error:", error);
            setErrorMessage(error.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-card">
                    {/* Header */}
                    <div className="register-header">
                        <div className="header-icon-container">
                            <User size={32} />
                        </div>
                        <h1 className="register-title">Student Sign Up</h1>
                        <p className="register-subtitle">
                            Create your account to start your funding journey.
                        </p>
                    </div>

                    <div className="register-body">
                        {errorMessage && (
                            <div className="alert alert-danger mb-4" style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '1rem', borderRadius: '0.375rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <AlertCircle size={20} />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="input-with-icon">
                                    <Mail size={20} className="input-icon" />
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="student@university.ac.za"
                                        value={formData.email}
                                        onChange={(e) => updateFormData('email', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="input-with-icon">
                                    <Lock size={20} className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => updateFormData('password', e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div className="input-with-icon">
                                    <Lock size={20} className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg form-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating Account...' : 'Sign Up'} <ArrowRight size={20} />
                            </button>
                        </form>

                        <div className="login-link">
                            Already have an account? <Link to="/login">Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentRegister;
