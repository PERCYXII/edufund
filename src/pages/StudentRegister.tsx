import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    ArrowLeft,
    Eye,
    EyeOff,
    Upload as UploadIcon,
    Check,
    CheckCircle,
    AlertCircle,
    Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { YEAR_OPTIONS, ACCEPTED_DOCUMENTS } from '../data/constants';
import { useAuth } from '../context/AuthContext';
import type { University } from '../types';
import './Register.css';

interface FieldOfStudy {
    id: string;
    category: string;
    name: string;
}

const StudentRegister: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [universities, setUniversities] = useState<University[]>([]);
    const [studyFields, setStudyFields] = useState<FieldOfStudy[]>([]);
    const [loadingUni, setLoadingUni] = useState(true);
    const [emailError, setEmailError] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',

        universityId: '',
        studentNumber: '',
        course: '',
        fieldOfStudy: '',
        yearOfStudy: '',
        expectedGraduation: '',

        verificationDocument: null as File | null,
        idDocument: null as File | null,
        enrollmentDocument: null as File | null,
        academicRecord: null as File | null,
        feeStatement: null as File | null,
    });

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch Universities
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

            // 2. Fetch Fields of Study
            const { data: fieldsData } = await supabase
                .from('fields_of_study')
                .select('*')
                .order('category')
                .order('name');

            if (fieldsData) {
                setStudyFields(fieldsData);
            }

            setLoadingUni(false);
        };
        fetchData();
    }, []);

    const updateFormData = (field: string, value: string | File | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'email' && typeof value === 'string') {
            validateEmail(value);
        }
    };

    const validateEmail = (email: string) => {
        if (!email) {
            setEmailError('');
            return;
        }

        if (!email.endsWith('.ac.za')) {
            setEmailError('Please use your university student email (must end in .ac.za)');
            return;
        }

        setEmailError('');

        // Auto-select university logic
        const emailDomain = email.split('@')[1];
        if (emailDomain) {
            // Find university with matching domain in website url
            // e.g. 'wits.ac.za' matches 'www.wits.ac.za'
            const matchedUni = universities.find(uni =>
                uni.website?.includes(emailDomain) ||
                (uni.website?.replace('www.', '') === emailDomain)
            );

            if (matchedUni) {
                setFormData(prev => ({ ...prev, universityId: matchedUni.id }));
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0] || null;
        updateFormData(field, file);
    };

    const validateStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 1:
                const isEmailValid = formData.email.endsWith('.ac.za');
                return !!(formData.title && formData.firstName && formData.lastName && formData.email && isEmailValid && formData.phone && formData.password);
            case 2:
                return !!(formData.universityId && formData.studentNumber && formData.fieldOfStudy && formData.course && formData.yearOfStudy);
            case 3:
                return !!(formData.idDocument && formData.enrollmentDocument && formData.academicRecord);
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => {
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // 1. Register User (create auth and student profile)
            const { success, error, data: authData } = await register('student', formData);

            if (!success || !authData?.user) {
                throw new Error(error || 'Registration failed');
            }

            const userId = authData.user.id;

            // 2. Upload Mandatory Documents
            const uploadFile = async (file: File | null, prefix: string) => {
                if (!file) return null;
                const fileExt = file.name.split('.').pop();
                const fileName = `${userId}/${prefix}_${Math.random()}.${fileExt}`;
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

            // 3. Create Verification Request using RPC
            const { error: verifyError } = await supabase.rpc('create_verification_request', {
                p_student_id: userId,
                p_id_url: idUrl,
                p_enrollment_url: enrollmentUrl,
                p_academic_record_url: academicUrl,
                p_fee_statement_url: feeUrl
            });

            if (verifyError) throw verifyError;

            setIsSubmitting(false);
            setStep(4);

        } catch (error: any) {
            console.error("Registration error:", error);
            alert("Registration failed: " + error.message);
            setIsSubmitting(false);
        }
    };

    const steps = ['Account', 'University', 'Verification', 'Complete'];

    const titles = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof', 'Mx'];

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
                                {idx < 3 && <div className={`step-connector ${step > idx + 1 ? 'completed' : ''}`} />}
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
                            <img src="/images/logo.png" alt="UniFund Logo" className="header-logo-image" />
                        </div>
                        <h1 className="register-title">Create Student Account</h1>
                        <p className="register-subtitle">
                            {step === 1 && 'Step 1: Enter your personal details'}
                            {step === 2 && 'Step 2: Select your university and course'}
                            {step === 3 && 'Step 3: Upload proof of enrollment'}
                            {step === 4 && 'Registration Complete!'}
                        </p>
                    </div>

                    <div className="register-body">
                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <div className="form-step">
                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.title}
                                        onChange={(e) => updateFormData('title', e.target.value)}
                                    >
                                        <option value="">Select Title</option>
                                        {titles.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">First Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="John"
                                            value={formData.firstName}
                                            onChange={(e) => updateFormData('firstName', e.target.value)}
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
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <div className="input-with-hint">
                                        <input
                                            type="email"
                                            className={`form-input ${emailError ? 'error' : ''}`}
                                            placeholder="john@students.university.ac.za"
                                            value={formData.email}
                                            onChange={(e) => updateFormData('email', e.target.value)}
                                        />
                                        {emailError && (
                                            <div className="field-error">
                                                <AlertCircle size={14} />
                                                <span>{emailError}</span>
                                            </div>
                                        )}
                                        {!emailError && (
                                            <div className="field-hint">
                                                <Info size={14} />
                                                <span>Must be a valid .ac.za student email</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="+27 12 345 6789"
                                        value={formData.phone}
                                        onChange={(e) => updateFormData('phone', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Password *</label>
                                    <div className="password-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-input"
                                            placeholder="Create a strong password"
                                            value={formData.password}
                                            onChange={(e) => updateFormData('password', e.target.value)}
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

                        {/* Step 2: University Details */}
                        {step === 2 && (
                            <div className="form-step">
                                <div className="form-group">
                                    <label className="form-label">Select Your University *</label>
                                    {loadingUni ? (
                                        <div className="text-gray-500">Loading universities...</div>
                                    ) : (
                                        <select
                                            className="form-input form-select"
                                            value={formData.universityId}
                                            onChange={(e) => updateFormData('universityId', e.target.value)}
                                        >
                                            <option value="">Choose your university...</option>
                                            {universities.map(uni => (
                                                <option key={uni.id} value={uni.id}>{uni.name}</option>
                                            ))}
                                        </select>
                                    )}
                                    <p className="form-hint">Selected automatically if your email matches a partner university</p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Student Number *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., 220145678"
                                        value={formData.studentNumber}
                                        onChange={(e) => updateFormData('studentNumber', e.target.value)}
                                    />
                                    <p className="form-hint">This will be used as the payment reference</p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Field of Study (Faculty) *</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.fieldOfStudy}
                                        onChange={(e) => updateFormData('fieldOfStudy', e.target.value)}
                                    >
                                        <option value="">Select Field...</option>
                                        {Object.entries(
                                            studyFields.reduce((acc, field) => {
                                                if (!acc[field.category]) acc[field.category] = [];
                                                acc[field.category].push(field);
                                                return acc;
                                            }, {} as Record<string, FieldOfStudy[]>)
                                        ).map(([category, fields]) => (
                                            <optgroup key={category} label={category}>
                                                {fields.map(field => (
                                                    <option key={field.id} value={field.name}>{field.name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Specific Course/Program *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Bachelor of Science in Computer Science"
                                        value={formData.course}
                                        onChange={(e) => updateFormData('course', e.target.value)}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Year of Study *</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.yearOfStudy}
                                            onChange={(e) => updateFormData('yearOfStudy', e.target.value)}
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
                                            <option value="">Select graduation year...</option>
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
                                        onClick={nextStep}
                                        disabled={!validateStep(2)}
                                    >
                                        Continue <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Document Upload */}
                        {step === 3 && (
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
                                        disabled={!validateStep(3) || isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit for Verification'} <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Complete */}
                        {step === 4 && (
                            <div className="form-step complete-step">
                                <div className="success-icon">
                                    <CheckCircle size={48} />
                                </div>
                                <h2 className="success-title">Registration Submitted!</h2>
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
                                    onClick={() => navigate('/student-dashboard')} // Assuming this is the route
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {step !== 4 && (
                    <p className="login-link">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default StudentRegister;
