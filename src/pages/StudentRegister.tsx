import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AlertCircle, ArrowRight, Phone, BookOpen, Calendar, GraduationCap, Building, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import type { University } from '../types';
import './Register.css';
import './RegisterSplit.css';

const StudentRegister: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading: authLoading, refreshUser } = useAuth();
    const { success, error: errorToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [universities, setUniversities] = useState<University[]>([]);
    const [loadingUniversities, setLoadingUniversities] = useState(true);
    const [submittingMessage, setSubmittingMessage] = useState<string>('Processing...');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        universityId: '',
        studentNumber: '',
        course: '',
        yearOfStudy: '',
        expectedGraduation: '',
        profileImage: null as File | null,
        idDocument: null as File | null,
        enrollmentDocument: null as File | null,
        feeStatement: null as File | null
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
            }
        }
    }, [user, authLoading, navigate]);

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

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrorMessage(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (file) {
            // Increased limit to 20MB for high-res mobile photos
            if (file.size > 20 * 1024 * 1024) {
                const msg = "File size exceeds 20MB limit. Please compress or choose a smaller file.";
                setErrorMessage(msg);
                // Also show a toast so mobile users see it immediately
                errorToast("File too large (Max 20MB)"); 
                e.target.value = '';
                return;
            }
            updateFormData(field, file);
        }
    };

    const validateForm = (): boolean => {
        if (!formData.firstName || !formData.lastName || !formData.universityId || !formData.studentNumber) {
            setErrorMessage("Please fill in all required fields");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }
        if (!formData.profileImage) {
            setErrorMessage("Please upload a profile image");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }
        if (!formData.idDocument || !formData.enrollmentDocument) {
            setErrorMessage("Please upload ID and Proof of Enrollment");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Dismiss keyboard on mobile
        (document.activeElement as HTMLElement)?.blur();

        if (!validateForm()) return;
        if (!user) return;

        setIsSubmitting(true);
        setSubmittingMessage('Saving your profile...');
        setErrorMessage(null);

        try {
            const userId = user.id;

            await supabase
                .from('profiles')
                .upsert({ id: userId, email: user.email, role: 'student' }, { onConflict: 'id' });

            let profileImageUrl = null;
            if (formData.profileImage) {
                const fileExt = formData.profileImage.name.split('.').pop();
                const fileName = `${userId}/profile_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('campaign-images')
                    .upload(fileName, formData.profileImage);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('campaign-images')
                    .getPublicUrl(fileName);
                profileImageUrl = urlData.publicUrl;
            }

            setSubmittingMessage('Saving academic details...');

            console.log("Upserting student profile for:", userId);
            const { error: studentError } = await supabase
                .from('students')
                .upsert({
                    id: userId,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                    university_id: formData.universityId,
                    student_number: formData.studentNumber,
                    course: formData.course,
                    year_of_study: formData.yearOfStudy,
                    expected_graduation: formData.expectedGraduation || null,
                    verification_status: 'pending',
                    profile_image_url: profileImageUrl
                });

            if (studentError) {
                console.error("Student upsert error:", studentError);
                throw studentError;
            }

            setSubmittingMessage('Uploading verification documents...');
            // Sequential uploads for reliable mobile handling

            const uploadDoc = async (file: File, type: string) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `verification/${userId}/${type}_${Date.now()}.${fileExt}`;

                const { error: uploadError, data } = await supabase.storage
                    .from('documents')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(data.path);

                console.log(`Inserting verification request for ${type}...`);
                const { error: insertError } = await supabase.from('verification_requests').insert({
                    student_id: userId,
                    document_type: type,
                    document_url: urlData.publicUrl,
                    status: 'pending'
                });

                if (insertError) {
                    console.error(`Verification insert error (${type}):`, insertError);
                    throw insertError;
                }
            };

            if (formData.idDocument) await uploadDoc(formData.idDocument, 'id_document');
            if (formData.enrollmentDocument) await uploadDoc(formData.enrollmentDocument, 'proof_of_enrollment');
            if (formData.feeStatement) {
                setSubmittingMessage('Uploading fee statement...');
                await uploadDoc(formData.feeStatement, 'fee_statement');
            }

            setSubmittingMessage('Finalizing profile...');
            console.log("Registration steps completed. Refreshing user context...");
            await refreshUser(true);

            success('Profile Completed!', 'Your details have been saved correctly.');
            navigate('/dashboard');

        } catch (error: any) {
            console.error("Registration error:", error.message || error);
            setErrorMessage(error.message || "Registration failed. Please try again.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    <div className="register-side-panel">
                        <div>
                            <div className="register-side-header">
                                <User size={48} className="mb-4 text-white" />
                                <h2 className="register-side-title">Complete Profile</h2>
                                <p className="register-side-subtitle">Just a few more details to get you started.</p>
                            </div>

                            <div className="register-side-content">
                                <div className="side-feature">
                                    <div className="side-feature-icon">
                                        <BookOpen size={20} color="white" />
                                    </div>
                                    <div>
                                        <h4>Tell Your Story</h4>
                                        <p>Your academic background helps donors connect with you.</p>
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
                            </div>
                        </div>
                    </div>

                    <div className="register-form-panel">
                        {errorMessage && (
                            <div className="alert alert-warning mb-6">
                                <AlertCircle size={20} />
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            <h3 className="form-section-title">
                                <User size={20} /> Personal Information
                            </h3>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="split-form-label">First Name *</label>
                                    <input
                                        type="text"
                                        className="split-form-input"
                                        value={formData.firstName}
                                        onChange={(e) => updateFormData('firstName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="split-form-label">Last Name *</label>
                                    <input
                                        type="text"
                                        className="split-form-input"
                                        value={formData.lastName}
                                        onChange={(e) => updateFormData('lastName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group form-group-full">
                                    <label className="split-form-label">Phone Number</label>
                                    <div className="input-with-icon" style={{ position: 'relative' }}>
                                        <Phone size={18} className="input-icon" style={{ position: 'absolute', left: '12px', top: '14px', color: '#9ca3af', zIndex: 10 }} />
                                        <input
                                            type="tel"
                                            className="split-form-input"
                                            style={{ paddingLeft: '40px' }}
                                            placeholder="+27..."
                                            value={formData.phone}
                                            onChange={(e) => updateFormData('phone', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <h3 className="form-section-title mt-8">
                                <AlertCircle size={20} /> Verification Documents
                            </h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="split-form-label">Profile Image *</label>
                                    <input
                                        type="file"
                                        className="split-form-input"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'profileImage')}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Upload a clear photo of yourself (Max 20MB).</p>
                                </div>
                                <div className="form-group">
                                    <label className="split-form-label">Certified ID Document / Passport *</label>
                                    <input
                                        type="file"
                                        className="split-form-input"
                                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                        onChange={(e) => handleFileChange(e, 'idDocument')}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">PDF, JPG or PNG (Max 20MB).</p>
                                </div>
                                <div className="form-group">
                                    <label className="split-form-label">Proof of Enrollment *</label>
                                    <input
                                        type="file"
                                        className="split-form-input"
                                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                        onChange={(e) => handleFileChange(e, 'enrollmentDocument')}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Official letter from your university (Max 20MB).</p>
                                </div>
                                <div className="form-group">
                                    <label className="split-form-label">Fee Statement (Optional)</label>
                                    <input
                                        type="file"
                                        className="split-form-input"
                                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                        onChange={(e) => handleFileChange(e, 'feeStatement')}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Latest financial statement (Max 20MB).</p>
                                </div>
                            </div>

                            <h3 className="form-section-title mt-8">
                                <GraduationCap size={20} /> Academic Profile
                            </h3>
                            <div className="form-grid form-grid-2">
                                <div className="form-group form-group-full">
                                    <label className="split-form-label">University *</label>
                                    <select
                                        className="split-form-input"
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
                                    <label className="split-form-label">Student Number *</label>
                                    <input
                                        type="text"
                                        className="split-form-input"
                                        value={formData.studentNumber}
                                        onChange={(e) => updateFormData('studentNumber', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="split-form-label">Year of Study</label>
                                    <select
                                        className="split-form-input"
                                        value={formData.yearOfStudy}
                                        onChange={(e) => updateFormData('yearOfStudy', e.target.value)}
                                    >
                                        <option value="">Select Year...</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                        <option value="5th Year">5th Year</option>
                                        <option value="6th Year">6th Year</option>
                                        <option value="7th Year">7th Year</option>
                                        <option value="Honours">Honours</option>
                                        <option value="Masters">Masters</option>
                                        <option value="PhD">PhD</option>
                                    </select>
                                </div>
                                <div className="form-group form-group-full">
                                    <label className="split-form-label">Course / Degree</label>
                                    <input
                                        type="text"
                                        className="split-form-input"
                                        placeholder="e.g. BSc Computer Science"
                                        value={formData.course}
                                        onChange={(e) => updateFormData('course', e.target.value)}
                                    />
                                </div>
                                <div className="form-group form-group-full">
                                    <label className="split-form-label">Expected Graduation Date</label>
                                    <div className="input-with-icon" style={{ position: 'relative' }}>
                                        <Calendar size={18} className="input-icon" style={{ position: 'absolute', left: '12px', top: '14px', color: '#9ca3af', zIndex: 10 }} />
                                        <input
                                            type="date"
                                            className="split-form-input"
                                            style={{ paddingLeft: '40px' }}
                                            value={formData.expectedGraduation}
                                            onChange={(e) => updateFormData('expectedGraduation', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full btn btn-primary mt-8 py-3 text-lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin" size={20} /> {submittingMessage}</>
                                ) : (
                                    <>Complete Profile <ArrowRight size={20} /></>
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
