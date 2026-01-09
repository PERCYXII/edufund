import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    ArrowLeft,
    Upload as UploadIcon,
    Check,
    CheckCircle,
    AlertCircle,
    Info,
    User,
    LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { YEAR_OPTIONS, ACCEPTED_DOCUMENTS } from '../data/constants';
import { useAuth } from '../context/AuthContext';
import type { University } from '../types';
import './Register.css';

const CompleteProfile: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading: authLoading, logout } = useAuth();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [universities, setUniversities] = useState<University[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Form data matching students table
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        universityId: '',
        studentNumber: '',
        course: '',
        yearOfStudy: '',
        expectedGraduation: '',
        idDocument: null as File | null,
        enrollmentDocument: null as File | null,
        academicRecord: null as File | null,
        feeStatement: null as File | null,
    });

    // Redirect if not logged in or not a student
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        } else if (!authLoading && user?.role !== 'student') {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    // Load universities
    useEffect(() => {
        const fetchData = async () => {
            const { data: uniData } = await supabase
                .from('universities')
                .select('*')
                .order('name');

            if (uniData) {
                const mapped = uniData.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    bankName: u.bank_name,
                    accountNumber: u.account_number,
                    branchCode: u.branch_code,
                    accountName: u.account_name,
                    website: u.website
                }));
                setUniversities(mapped);
            }

            // Load existing student data if any
            if (user?.id) {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (studentData) {
                    setFormData(prev => ({
                        ...prev,
                        firstName: studentData.first_name || '',
                        lastName: studentData.last_name || '',
                        phone: studentData.phone || '',
                        universityId: studentData.university_id || '',
                        studentNumber: studentData.student_number || '',
                        course: studentData.course || '',
                        yearOfStudy: studentData.year_of_study || '',
                        expectedGraduation: studentData.expected_graduation
                            ? studentData.expected_graduation.substring(0, 7)
                            : '',
                    }));
                }
            }

            setLoadingData(false);
        };
        fetchData();
    }, [user?.id]);

    const updateFormData = (field: string, value: string | File | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0] || null;
        updateFormData(field, file);
    };

    const validateStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 1:
                return !!(
                    formData.firstName &&
                    formData.lastName &&
                    formData.universityId &&
                    formData.studentNumber &&
                    formData.course &&
                    formData.yearOfStudy
                );
            case 2:
                return !!(formData.idDocument && formData.enrollmentDocument && formData.academicRecord);
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            // Format expected_graduation to full date
            const expectedGradDate = formData.expectedGraduation
                ? `${formData.expectedGraduation}-01`
                : null;

            // 0. ENSURE PROFILE EXISTS (Fix for missing profile trigger)
            // Sometimes the handle_new_user trigger fails. We must ensure the profile exists
            // before we can create a student record (FK constraint).
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    role: 'student'
                }, { onConflict: 'id' });

            if (profileError) {
                console.error("Failed to ensure profile existence:", profileError);
                // We continue, hoping it might exist or error will be caught below
            }

            // 1. Update Student Profile (Use UPSERT to create if missing)
            const { error: studentError } = await supabase
                .from('students')
                .upsert({
                    id: user.id, // Explicitly include ID for upsert
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone || null,
                    university_id: formData.universityId,
                    student_number: formData.studentNumber,
                    course: formData.course,
                    year_of_study: formData.yearOfStudy,
                    expected_graduation: expectedGradDate,
                    verification_status: 'pending'
                });

            if (studentError) throw studentError;

            // 2. Upload Documents
            const uploadFile = async (file: File | null, prefix: string) => {
                if (!file) return null;
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${prefix}_${Math.random()}.${fileExt}`;
                const { error: uploadError, data } = await supabase.storage
                    .from('documents')
                    .upload(fileName, file);
                if (uploadError) throw uploadError;
                return data.path;
            };

            const [idUrl, enrollmentUrl, academicUrl, feeUrl] = await Promise.all([
                uploadFile(formData.idDocument, 'id'),
                uploadFile(formData.enrollmentDocument, 'enrollment'),
                uploadFile(formData.academicRecord, 'academic'),
                uploadFile(formData.feeStatement, 'fee_statement')
            ]);

            // 3. Create Verification Request
            const { error: verifyError } = await supabase.rpc('create_verification_request', {
                p_student_id: user.id,
                p_id_url: idUrl,
                p_enrollment_url: enrollmentUrl,
                p_academic_record_url: academicUrl,
                p_fee_statement_url: feeUrl
            });

            if (verifyError) throw verifyError;

            // --- NOTIFICATIONS ---
            // 1. Notify Student
            await supabase.from('notifications').insert({
                user_id: user.id,
                title: 'Verification Submitted 🆔',
                message: 'Your profile documents have been submitted for verification. We will review them shortly.',
                type: 'verification_update'
            });

            // 2. Notify Admins
            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin');

            if (admins && admins.length > 0) {
                const adminNotifications = admins.map(admin => ({
                    user_id: admin.id,
                    title: 'New Verification Request 📝',
                    message: `Student ${formData.firstName} ${formData.lastName} has submitted verification documents.`,
                    type: 'verification_update'
                }));
                await supabase.from('notifications').insert(adminNotifications);
            }

            setStep(3);

        } catch (error: any) {
            console.error("Profile update error:", error);
            alert("Failed to update profile: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = ['Student Info', 'Verification', 'Complete'];

    if (authLoading || loadingData) {
        return (
            <div className="register-page">
                <div className="register-container" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="register-page">
            <div className="register-container">
                {/* Progress Steps */}
                <div className="progress-steps">
                    <div className="steps-line">
                        {steps.map((_, idx) => (
                            <React.Fragment key={idx}>
                                <div className={`step-circle ${step > idx + 1 ? 'completed' : step === idx + 1 ? 'active' : ''}`}>
                                    {step > idx + 1 ? <Check size={16} /> : idx + 1}
                                </div>
                                {idx < 2 && <div className={`step-connector ${step > idx + 1 ? 'completed' : ''}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="steps-labels">
                        {steps.map((stepName, idx) => (
                            <span key={idx} className={`step-label ${step === idx + 1 ? 'active' : ''}`}>
                                {stepName}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="register-card">
                    {/* Header */}
                    <div className="register-header">
                        <div className="header-icon-container">
                            <User size={32} />
                        </div>
                        <h1 className="register-title">Complete Your Profile</h1>
                        <p className="register-subtitle">
                            {step === 1 && 'Enter your personal and university details'}
                            {step === 2 && 'Upload proof of enrollment for verification'}
                            {step === 3 && 'Profile submitted for verification!'}
                        </p>
                        {user && (
                            <div className="user-email-display" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                <span>Logged in as: {user.email}</span>
                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/login');
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.background = '#fef2f2')}
                                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <LogOut size={14} />
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="register-body">
                        {/* Step 1: Student Info */}
                        {step === 1 && (
                            <div className="form-step">
                                {/* Personal Info */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">First Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="John"
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
                                            placeholder="Doe"
                                            value={formData.lastName}
                                            onChange={(e) => updateFormData('lastName', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="+27 12 345 6789"
                                        value={formData.phone}
                                        onChange={(e) => updateFormData('phone', e.target.value)}
                                    />
                                </div>

                                {/* University Info */}
                                <div className="form-group">
                                    <label className="form-label">University *</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.universityId}
                                        onChange={(e) => updateFormData('universityId', e.target.value)}
                                        required
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
                                        placeholder="e.g., 220145678"
                                        value={formData.studentNumber}
                                        onChange={(e) => updateFormData('studentNumber', e.target.value)}
                                        required
                                    />
                                    <p className="form-hint">This will be used as the payment reference</p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Course/Program *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Bachelor of Science in Computer Science"
                                        value={formData.course}
                                        onChange={(e) => updateFormData('course', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Year of Study *</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.yearOfStudy}
                                            onChange={(e) => updateFormData('yearOfStudy', e.target.value)}
                                            required
                                        >
                                            <option value="">Select year...</option>
                                            {YEAR_OPTIONS.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Expected Graduation</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.expectedGraduation}
                                            onChange={(e) => updateFormData('expectedGraduation', e.target.value)}
                                        >
                                            <option value="">Select graduation...</option>
                                            <option value="2024-06">2024 (Mid-Year)</option>
                                            <option value="2024-12">2024 (End-Year)</option>
                                            <option value="2025-06">2025 (Mid-Year)</option>
                                            <option value="2025-12">2025 (End-Year)</option>
                                            <option value="2026-06">2026 (Mid-Year)</option>
                                            <option value="2026-12">2026 (End-Year)</option>
                                            <option value="2027-06">2027 (Mid-Year)</option>
                                            <option value="2027-12">2027 (End-Year)</option>
                                            <option value="2028-06">2028 (Mid-Year)</option>
                                            <option value="2028-12">2028 (End-Year)</option>
                                            <option value="2029-06">2029 (Mid-Year)</option>
                                            <option value="2029-12">2029 (End-Year)</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-primary btn-lg form-button"
                                    onClick={nextStep}
                                    disabled={!validateStep(1)}
                                >
                                    Continue <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Document Upload */}
                        {step === 2 && (
                            <div className="form-step">
                                <div className="alert alert-warning">
                                    <AlertCircle size={24} />
                                    <div>
                                        <h4>Verification Required</h4>
                                        <p>Upload a document that proves you're enrolled at your university. This helps us ensure funds go to real students.</p>
                                    </div>
                                </div>

                                <div className="alert alert-info mb-4">
                                    <Info size={20} />
                                    <p>All uploaded documents <strong>must be certified</strong> (not older than 3 months).</p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Certified ID Document / Passport *</label>
                                    <label className="upload-zone">
                                        <input
                                            type="file"
                                            className="upload-input"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange(e, 'idDocument')}
                                        />
                                        <UploadIcon size={32} className="upload-icon" />
                                        {formData.idDocument ? (
                                            <p className="upload-filename">{formData.idDocument.name}</p>
                                        ) : (
                                            <p className="upload-text">Upload Certified ID</p>
                                        )}
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Certified Proof of Enrollment *</label>
                                    <label className="upload-zone">
                                        <input
                                            type="file"
                                            className="upload-input"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange(e, 'enrollmentDocument')}
                                        />
                                        <UploadIcon size={32} className="upload-icon" />
                                        {formData.enrollmentDocument ? (
                                            <p className="upload-filename">{formData.enrollmentDocument.name}</p>
                                        ) : (
                                            <p className="upload-text">Upload Proof of Enrollment</p>
                                        )}
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Certified Academic Record / Transcript *</label>
                                    <label className="upload-zone">
                                        <input
                                            type="file"
                                            className="upload-input"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange(e, 'academicRecord')}
                                        />
                                        <UploadIcon size={32} className="upload-icon" />
                                        {formData.academicRecord ? (
                                            <p className="upload-filename">{formData.academicRecord.name}</p>
                                        ) : (
                                            <p className="upload-text">Upload Academic Record</p>
                                        )}
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Recent Fee Statement (Optional)</label>
                                    <label className="upload-zone">
                                        <input
                                            type="file"
                                            className="upload-input"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileChange(e, 'feeStatement')}
                                        />
                                        <UploadIcon size={32} className="upload-icon" />
                                        {formData.feeStatement ? (
                                            <p className="upload-filename">{formData.feeStatement.name}</p>
                                        ) : (
                                            <p className="upload-text">Upload Fee Statement</p>
                                        )}
                                    </label>
                                </div>

                                <div className="accepted-docs">
                                    <h4>Accepted Documents:</h4>
                                    <div className="docs-grid">
                                        {ACCEPTED_DOCUMENTS.map((doc, idx) => (
                                            <div key={idx} className="doc-item">
                                                <CheckCircle size={16} className="doc-check" />
                                                {doc}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-buttons">
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-lg"
                                        onClick={prevStep}
                                    >
                                        <ArrowLeft size={20} /> Back
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-lg"
                                        onClick={handleSubmit}
                                        disabled={!validateStep(2) || isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit for Verification'} <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Complete */}
                        {step === 3 && (
                            <div className="form-step complete-step">
                                <div className="success-icon">
                                    <CheckCircle size={48} />
                                </div>
                                <h2 className="success-title">Profile Submitted!</h2>
                                <p className="success-text">
                                    Your documents have been submitted for verification. We'll review them within 24-48 hours and notify you by email once approved.
                                </p>

                                <div className="next-steps">
                                    <h4>What happens next?</h4>
                                    <ol className="next-steps-list">
                                        <li>
                                            <span className="step-num">1</span>
                                            Our team reviews your enrollment documents
                                        </li>
                                        <li>
                                            <span className="step-num">2</span>
                                            You'll receive an email once verified
                                        </li>
                                        <li>
                                            <span className="step-num">3</span>
                                            Create your campaign and start receiving donations
                                        </li>
                                    </ol>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-primary btn-lg form-button"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
