import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, ArrowRight, Phone, BookOpen, Calendar, GraduationCap, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { University } from '../types';
import './Register.css';
import './RegisterSplit.css';

const StudentRegister: React.FC = () => {
    const navigate = useNavigate();
    const { register, isLoggedIn, user, isLoading: authLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [universities, setUniversities] = useState<University[]>([]);
    const [loadingUniversities, setLoadingUniversities] = useState(true);

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && isLoggedIn && user) {
            if (user.role === 'student') {
                navigate('/dashboard');
            } else if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/browse');
            }
        }
    }, [authLoading, isLoggedIn, user, navigate]);

    // Fetch Universities
    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const { data, error } = await supabase
                    .from('universities')
                    .select('*')
                    .order('name');

                if (error) throw error;
                if (data) setUniversities(data);
            } catch (error) {
                console.error("Error fetching universities:", error);
            } finally {
                setLoadingUniversities(false);
            }
        };

        fetchUniversities();
    }, []);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        universityId: '',
        studentNumber: '',
        course: '',
        yearOfStudy: '',
        expectedGraduation: ''
    });

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrorMessage(null);
    };

    const validateForm = (): boolean => {
        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName || !formData.universityId || !formData.studentNumber) {
            setErrorMessage("Please fill in all required fields");
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match");
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
            // 1. Register User (Auth)
            const registrationPayload = {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName
            };

            const { success, error, data } = await register('student', registrationPayload);

            if (!success || !data?.user) {
                throw new Error(error || 'Registration failed');
            }

            const userId = data.user.id;

            // 2. Create Student Profile in Database
            const { error: studentError } = await supabase
                .from('students')
                .insert({
                    id: userId,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    university_id: formData.universityId,
                    student_number: formData.studentNumber,
                    course: formData.course,
                    year_of_study: formData.yearOfStudy,
                    expected_graduation: formData.expectedGraduation,
                    verification_status: 'unverified'
                });

            if (studentError) {
                console.error("Error creating student profile:", studentError);
                throw new Error("Account created but profile setup failed. Please contact support.");
            }

            // 3. Redirect to Dashboard
            navigate('/dashboard');

        } catch (error: any) {
            console.error("Registration error:", error);
            setErrorMessage(error.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return <div className="register-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    }

    return (
        <div className="register-page">
            <div className="register-container wide">
                <div className="register-split-card">

                    {/* Left Side - Info */}
                    <div className="register-side-panel">
                        <div>
                            <div className="register-side-header">
                                <User size={48} className="mb-4 text-white" />
                                <h2 className="register-side-title">Student Sign Up</h2>
                                <p className="register-side-subtitle">Join thousands of students funding their education.</p>
                            </div>

                            <div className="register-side-content">
                                <div className="side-feature">
                                    <div className="side-feature-icon">
                                        <BookOpen size={20} color="white" />
                                    </div>
                                    <div>
                                        <h4>Tell Your Story</h4>
                                        <p>Create a compelling campaign to share your journey.</p>
                                    </div>
                                </div>
                                <div className="side-feature">
                                    <div className="side-feature-icon">
                                        <Building size={20} color="white" />
                                    </div>
                                    <div>
                                        <h4>Get Verified</h4>
                                        <p>Link your university profile for trust and credibility.</p>
                                    </div>
                                </div>
                                <div className="side-feature">
                                    <div className="side-feature-icon">
                                        <GraduationCap size={20} color="white" />
                                    </div>
                                    <div>
                                        <h4>Receive Funding</h4>
                                        <p>Get donations directly for your tuition and needs.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="register-side-footer">
                            Already have an account? <Link to="/login">Login here</Link>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="register-form-panel">
                        {errorMessage && (
                            <div className="alert alert-warning mb-6">
                                <AlertCircle size={20} />
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            {/* Personal Info Section */}
                            <h3 className="form-section-title">
                                <User size={20} /> Personal Information
                            </h3>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">First Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.firstName}
                                        onChange={(e) => updateFormData('firstName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.lastName}
                                        onChange={(e) => updateFormData('lastName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group form-group-full">
                                    <label className="form-label">Phone Number</label>
                                    <div className="input-with-icon" style={{ position: 'relative' }}>
                                        <Phone size={18} className="input-icon" style={{ position: 'absolute', left: '12px', top: '14px', color: '#9ca3af' }} />
                                        <input
                                            type="tel"
                                            className="form-input"
                                            style={{ paddingLeft: '40px' }}
                                            placeholder="+27..."
                                            value={formData.phone}
                                            onChange={(e) => updateFormData('phone', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Academic Info Section */}
                            <h3 className="form-section-title mt-8">
                                <GraduationCap size={20} /> Academic Profile
                            </h3>
                            <div className="form-grid form-grid-2">
                                <div className="form-group form-group-full">
                                    <label className="form-label">University *</label>
                                    <select
                                        className="form-input"
                                        value={formData.universityId}
                                        onChange={(e) => updateFormData('universityId', e.target.value)}
                                        required
                                        disabled={loadingUniversities}
                                    >
                                        <option value="">Select your university...</option>
                                        {universities.map(uni => (
                                            <option key={uni.id} value={uni.id}>{uni.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Student Number *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.studentNumber}
                                        onChange={(e) => updateFormData('studentNumber', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Year of Study</label>
                                    <select
                                        className="form-input"
                                        value={formData.yearOfStudy}
                                        onChange={(e) => updateFormData('yearOfStudy', e.target.value)}
                                    >
                                        <option value="">Select Year...</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="Honours">Honours</option>
                                        <option value="Masters">Masters</option>
                                        <option value="PhD">PhD</option>
                                    </select>
                                </div>
                                <div className="form-group form-group-full">
                                    <label className="form-label">Course / Degree</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. BSc Computer Science"
                                        value={formData.course}
                                        onChange={(e) => updateFormData('course', e.target.value)}
                                    />
                                </div>
                                <div className="form-group form-group-full">
                                    <label className="form-label">Expected Graduation Date</label>
                                    <div className="input-with-icon" style={{ position: 'relative' }}>
                                        <Calendar size={18} className="input-icon" style={{ position: 'absolute', left: '12px', top: '14px', color: '#9ca3af' }} />
                                        <input
                                            type="date"
                                            className="form-input"
                                            style={{ paddingLeft: '40px' }}
                                            value={formData.expectedGraduation}
                                            onChange={(e) => updateFormData('expectedGraduation', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Account Security */}
                            <h3 className="form-section-title mt-8">
                                <Lock size={20} /> Account Security
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <div className="input-with-icon" style={{ position: 'relative' }}>
                                        <Mail size={18} className="input-icon" style={{ position: 'absolute', left: '12px', top: '14px', color: '#9ca3af' }} />
                                        <input
                                            type="email"
                                            className="form-input"
                                            style={{ paddingLeft: '40px' }}
                                            placeholder="student@university.ac.za"
                                            value={formData.email}
                                            onChange={(e) => updateFormData('email', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-grid form-grid-2" style={{ marginBottom: 0 }}>
                                    <div className="form-group">
                                        <label className="form-label">Password *</label>
                                        <div className="input-with-icon" style={{ position: 'relative' }}>
                                            <Lock size={18} className="input-icon" style={{ position: 'absolute', left: '12px', top: '14px', color: '#9ca3af' }} />
                                            <input
                                                type="password"
                                                className="form-input"
                                                style={{ paddingLeft: '40px' }}
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => updateFormData('password', e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Confirm Password *</label>
                                        <div className="input-with-icon" style={{ position: 'relative' }}>
                                            <Lock size={18} className="input-icon" style={{ position: 'absolute', left: '12px', top: '14px', color: '#9ca3af' }} />
                                            <input
                                                type="password"
                                                className="form-input"
                                                style={{ paddingLeft: '40px' }}
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full mt-8 py-3 text-lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>Processing...</>
                                ) : (
                                    <>Create Account <ArrowRight size={20} /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentRegister;
