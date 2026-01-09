import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePaystackPayment } from 'react-paystack';
import {
    ArrowLeft,
    CheckCircle,
    Heart,
    DollarSign,
    Building,
    Shield,
    Facebook,
    Twitter,
    Linkedin,
    Copy,
    User,
    Landmark,
    XCircle,
    FileText,
    ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { DONATION_AMOUNTS } from '../data/constants';
import type { CampaignWithStudent } from '../types';
import DocumentViewerModal from '../components/DocumentViewerModal';
import './CampaignDetail.css';
import '../components/Skeleton.css';

interface PaymentModalProps {
    amount: number;
    campaign: CampaignWithStudent;
    onClose: () => void;
    onSuccess: () => void;
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_7a70161c3f2718d3ef9d6a8308fc1c677b4ca5be';

const PaymentModal: React.FC<PaymentModalProps> = ({ amount, campaign, onClose, onSuccess }) => {
    const { error: toastError } = useToast();
    const [step, setStep] = useState(1);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Donor Info (Persisted across steps)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    // Removed donorId state as we use guest fields

    // Platform Tip State
    const [tipAmount, setTipAmount] = useState('');
    const [paystackRef] = useState(() => 'TIP_' + Math.floor((Math.random() * 1000000000) + 1));

    const config = {
        reference: paystackRef,
        email: email || 'guest@unifund.co.za',
        amount: (parseFloat(tipAmount) || 0) * 100, // In cents
        publicKey: PAYSTACK_PUBLIC_KEY,
        currency: 'ZAR',
        metadata: {
            custom_fields: [
                {
                    display_name: "Donation Type",
                    variable_name: "donation_type",
                    value: "platform_tip_post_campaign"
                },
                {
                    display_name: "Linked Campaign",
                    variable_name: "linked_campaign_id",
                    value: campaign.id
                }
            ]
        },
    };

    const initializePayment = usePaystackPayment(config);

    const handleStudentDonationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // 1. Upload proof
            const fileExt = proofFile?.name.split('.').pop();
            const fileName = `${campaign.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('documents')
                .upload(`proofs/${fileName}`, proofFile!);

            if (uploadError) throw uploadError;

            // 2. Create Donation Record (Guest)
            const { error: donationError } = await supabase
                .from('donations')
                .insert({
                    campaign_id: campaign.id,
                    amount: amount,
                    is_anonymous: isAnonymous,
                    proof_of_payment_url: uploadData.path,
                    status: 'pending',
                    guest_name: isAnonymous ? 'Anonymous' : `${firstName} ${lastName}`.trim(),
                    guest_email: isAnonymous ? null : email
                });

            if (donationError) throw donationError;

            // --- NOTIFICATIONS ---

            // 1. Notify Student
            await supabase.from('notifications').insert({
                user_id: campaign.student.id, // Target the student
                title: 'New Donation Received 💸',
                message: `You have received a new donation of R${amount} from ${isAnonymous ? 'an anonymous donor' : `${firstName} ${lastName}`}. It is currently pending verification.`,
                type: 'donation_received'
            });

            // 2. Notify Admins
            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin');

            if (admins && admins.length > 0) {
                const adminNotifications = admins.map(admin => ({
                    user_id: admin.id, // Target the admin
                    title: 'New Pending Donation 💰',
                    message: `A new donation of R${amount} for "${campaign.title}" needs verification.`,
                    type: 'verification_update'
                }));

                await supabase.from('notifications').insert(adminNotifications);
            }

            // Move to Tip Prompt
            setStep(3);

        } catch (err: any) {
            console.error("Payment error:", err);
            toastError("Submission Failed", err.message || "Failed to submit donation");
        } finally {
            setSubmitting(false);
        }
    };

    const onPaystackSuccess = async (response: any) => {
        try {
            setSubmitting(true);
            // Record the successful donation
            const { error: donationError } = await supabase
                .from('donations')
                .insert({
                    campaign_id: null, // Platform donation
                    amount: parseFloat(tipAmount),
                    is_anonymous: isAnonymous,
                    proof_of_payment_url: 'paystack_ref_' + (response.reference || paystackRef),
                    status: 'received', // Auto-verified
                    guest_name: isAnonymous ? 'Anonymous' : `${firstName} ${lastName}`.trim(),
                    guest_email: isAnonymous ? null : email
                });

            if (donationError) throw donationError;
            setStep(7); // Final Success
        } catch (err) {
            console.error("Error recording tip:", err);
            toastError("Error", "Donation processed but failed to record in system. Please contact support.");
            setStep(7); // Still show success as payment went through
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaystackSupport = () => {
        const amt = parseFloat(tipAmount);
        if (!amt || amt <= 0) return;

        // Cast to any to avoid TS arg count error if types mismatch
        (initializePayment as any)(onPaystackSuccess, () => setSubmitting(false));
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content payment-modal">
                <button className="modal-close" onClick={onClose}><XCircle size={24} /></button>

                {/* Step 1: Student Bank Details */}
                {step === 1 && (
                    <div className="modal-step">
                        <h3>Bank Transfer Details</h3>
                        <p className="modal-description">Please make an EFT of <strong>R{amount}</strong> to the university account below.</p>

                        <div className="bank-details-card">
                            {[
                                { label: 'Bank', value: campaign.university.bankName, key: 'bank' },
                                { label: 'Account Name', value: campaign.university.accountName, key: 'accName' },
                                { label: 'Account Number', value: campaign.university.accountNumber, key: 'accNum', mono: true },
                                { label: 'Branch Code', value: campaign.university.branchCode, key: 'branch', mono: true },
                                { label: 'Reference', value: campaign.student.studentNumber, key: 'ref', highlight: true }
                            ].map((item) => (
                                <div key={item.key} className={`bank-row ${item.highlight ? 'highlight' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{item.label}:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <strong className={item.mono ? 'mono' : ''}>{item.value}</strong>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(item.value);
                                                const btn = document.getElementById(`copy-btn-${item.key}`);
                                                if (btn) {
                                                    btn.innerHTML = 'Copied!';
                                                    btn.style.color = 'green';
                                                    btn.style.fontSize = '12px';
                                                    setTimeout(() => {
                                                        btn.innerHTML = '';
                                                        // Reset is handled by re-render usually, but simple DOM manipulation is fast here or use state if full re-render preferred.
                                                        // actually, using state is cleaner.
                                                    }, 2000);
                                                }
                                            }}
                                            className="copy-icon-btn"
                                            title="Copy"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <span id={`copy-btn-${item.key}`} style={{ position: 'absolute', right: '-40px', width: '40px' }}></span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-primary w-full" onClick={() => setStep(2)}>
                                I have made the payment
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Student Proof Upload */}
                {step === 2 && (
                    <div className="modal-step">
                        <h3>Confirm Donation</h3>
                        <form onSubmit={handleStudentDonationSubmit}>
                            <div className="form-group">
                                <label className="form-label">Upload Proof of Payment *</label>
                                <input
                                    type="file"
                                    className="form-input"
                                    accept=".pdf,.jpg,.png"
                                    onChange={e => setProofFile(e.target.files?.[0] || null)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    required={!isAnonymous}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    required={!isAnonymous}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required={!isAnonymous}
                                />
                            </div>

                            <div className="form-checkbox-row">
                                <input
                                    type="checkbox"
                                    id="anon"
                                    checked={isAnonymous}
                                    onChange={e => setIsAnonymous(e.target.checked)}
                                />
                                <label htmlFor="anon">Make my donation anonymous</label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting || !proofFile}>
                                    {submitting ? 'Submitting...' : 'Submit Verification'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Step 3: Tip Prompt */}
                {step === 3 && (
                    <div className="modal-step center-text">
                        <CheckCircle size={64} className="text-green-500 mb-4 mx-auto" />
                        <h3>Donation Submitted!</h3>
                        <p className="mb-6">Your proof has been received. While you are here, would you like to make a small contribution to keep UniFund running?</p>

                        <div className="modal-actions column-actions">
                            <button className="btn btn-primary w-full" onClick={() => setStep(4)}>
                                Yes, I'd like to support UniFund
                            </button>
                            <button className="btn btn-outline w-full" onClick={() => setStep(7)}>
                                No thanks, finish
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Tip Amount */}
                {step === 4 && (
                    <div className="modal-step">
                        <h3>Support UniFund</h3>
                        <p className="modal-description">How much would you like to contribute?</p>

                        <div className="form-group">
                            <div className="amount-input-wrapper">
                                <span className="currency-symbol">R</span>
                                <input
                                    type="number"
                                    placeholder="Enter amount (e.g. 50)"
                                    value={tipAmount}
                                    onChange={(e) => setTipAmount(e.target.value)}
                                    className="form-input amount-input"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setStep(3)}>Back</button>
                            <button
                                className="btn btn-primary"
                                disabled={!tipAmount || parseFloat(tipAmount) <= 0 || submitting}
                                onClick={handlePaystackSupport}
                            >
                                {submitting ? 'Processing...' : 'Pay with Paystack'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Steps 5 & 6 Removed - Paystack handles payment & "proof" */}



                {/* Step 7: Final Success */}
                {step === 7 && (
                    <div className="modal-step success-step">
                        <CheckCircle size={64} className="text-green-500 mb-4" />
                        <h3>All Done!</h3>
                        <p>Thank you for your generosity. All proofs have been submitted for verification.</p>
                        <button className="btn btn-primary" onClick={() => {
                            onSuccess();
                            onClose();
                        }}>Close</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CampaignDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { success, warning, error: toastError } = useToast();
    const [campaign, setCampaign] = useState<CampaignWithStudent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [donationAmount, setDonationAmount] = useState<string>('');
    const [customAmount, setCustomAmount] = useState<string>('');
    const [showShareTooltip, setShowShareTooltip] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState(0);

    // Document Viewer State
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerTitle, setViewerTitle] = useState('Document Preview');

    const handleAdminApprove = async () => {
        if (!campaign || !id) return;
        if (!confirm("Are you sure you want to approve this campaign and verify the student?")) return;

        try {
            // 1. Approve Campaign
            const { error: campError } = await supabase
                .from('campaigns')
                .update({ status: 'active' })
                .eq('id', id);

            if (campError) throw campError;

            // 2. Approve Student
            const { error: studError } = await supabase
                .from('students')
                .update({ verification_status: 'approved' })
                .eq('id', campaign.studentId);

            if (studError) console.error("Error verifying student:", studError);

            // 3. Auto-approve pending verification requests
            await supabase
                .from('verification_requests')
                .update({ status: 'approved', reviewed_at: new Date().toISOString() })
                .eq('student_id', campaign.studentId)
                .eq('status', 'pending');

            // 4. Notify
            await supabase.from('notifications').insert({
                user_id: campaign.studentId,
                title: 'Campaign Approved!',
                message: `Your campaign "${campaign.title}" has been approved and is now live! Your account has been verified.`,
                type: 'success'
            });

            success("Campaign approved and student verified!");
            // Refresh
            window.location.reload();
        } catch (err: any) {
            console.error("Error approving:", err);
            toastError("Failed to approve campaign.");
        }
    };

    const handleAdminReject = async () => {
        if (!campaign || !id) return;
        const reason = prompt("Reason for rejection:");
        if (!reason) return;

        try {
            // 1. Reject Campaign
            const { error: campError } = await supabase
                .from('campaigns')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (campError) throw campError;

            // 2. Reject Student
            const { error: studError } = await supabase
                .from('students')
                .update({ verification_status: 'rejected' })
                .eq('id', campaign.studentId);

            if (studError) console.error("Error rejecting student:", studError);

            // 3. Auto-reject pending verification requests
            await supabase
                .from('verification_requests')
                .update({
                    status: 'rejected',
                    rejection_reason: `Campaign rejected: ${reason}`,
                    reviewed_at: new Date().toISOString()
                })
                .eq('student_id', campaign.studentId)
                .eq('status', 'pending');

            await supabase.from('notifications').insert({
                user_id: campaign.studentId,
                title: 'Campaign Rejected',
                message: `Your campaign "${campaign.title}" was rejected. Reason: ${reason}.`,
                type: 'error'
            });

            success("Campaign rejected.");
            window.location.reload();
        } catch (err: any) {
            console.error("Error rejecting:", err);
            toastError("Failed to reject campaign.");
        }
    };

    const handleViewDocument = async (urlOrPath: string, docTitle: string = 'Document Preview') => {
        if (!urlOrPath) return;

        let bucket = 'documents';
        let path = urlOrPath;

        // Handle full URLs
        if (urlOrPath.startsWith('http')) {
            try {
                if (urlOrPath.includes('/invoices/')) {
                    bucket = 'invoices';
                    path = urlOrPath.split('/invoices/')[1];
                } else if (urlOrPath.includes('/documents/')) {
                    bucket = 'documents';
                    path = urlOrPath.split('/documents/')[1];
                }
            } catch (e) {
                console.error("Error parsing URL:", e);
            }
        }

        path = decodeURIComponent(path);

        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(path, 60 * 60);

            if (error) throw error;
            if (data?.signedUrl) {
                setViewerUrl(data.signedUrl);
                setViewerTitle(docTitle);
                setViewerOpen(true);
            }
        } catch (err: any) {
            console.error("Error viewing document:", err);
            toastError("Could not open document.");
        }
    };

    useEffect(() => {
        const fetchCampaign = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Fetch Campaign with student and university
                const { data: c, error } = await supabase
                    .from('campaigns')
                    .select(`
                        *,
                        student:students (
                            *,
                            university:universities (*)
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (c) {
                    const mapped: CampaignWithStudent = {
                        id: c.id,
                        studentId: c.student_id,
                        title: c.title,
                        story: c.story,
                        goal: c.goal_amount || 0,
                        raised: c.raised_amount || 0,
                        donors: c.donors || 0,
                        daysLeft: 30, // ideally calc
                        startDate: c.start_date,
                        endDate: c.end_date,
                        status: c.status,
                        type: c.type || (c.is_urgent ? 'quick_assist' : 'standard'),
                        category: c.category,
                        isUrgent: c.is_urgent,
                        fundingBreakdown: c.funding_breakdown || [],
                        images: c.images,
                        feeStatementUrl: c.fee_statement_url,
                        idUrl: c.id_url,
                        enrollmentUrl: c.enrollment_url,
                        invoiceUrl: c.invoice_url,
                        createdAt: c.created_at,
                        updatedAt: c.updated_at,
                        student: {
                            id: c.student.id,
                            email: c.student.email,
                            firstName: c.student.first_name,
                            lastName: c.student.last_name,
                            phone: c.student.phone,
                            universityId: c.student.university_id,
                            studentNumber: c.student.student_number,
                            course: c.student.course,
                            yearOfStudy: c.student.year_of_study,
                            expectedGraduation: c.student.expected_graduation,
                            verificationStatus: c.student.verification_status,
                            profileImage: c.student.profile_image_url,
                            createdAt: c.student.created_at,
                            updatedAt: c.student.updated_at
                        },
                        university: {
                            id: c.student.university.id,
                            name: c.student.university.name,
                            bankName: c.student.university.bank_name,
                            accountNumber: c.student.university.account_number,
                            branchCode: c.student.university.branch_code,
                            accountName: c.student.university.account_name
                        }
                    };

                    // Calc days left
                    const end = new Date(mapped.endDate);
                    const now = new Date();
                    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    mapped.daysLeft = diff > 0 ? diff : 0;

                    setCampaign(mapped);
                }
            } catch (err) {
                console.error("Error fetching campaign:", err);
                setError("Campaign not found or error loading details.");
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [id]);

    const percentFunded = useMemo(() => {
        if (!campaign) return 0;
        return Math.min((campaign.raised / campaign.goal) * 100, 100);
    }, [campaign]);

    const handlePresetAmount = (amount: number) => {
        setDonationAmount(amount.toString());
        setCustomAmount('');
    };

    const handleCustomAmount = (value: string) => {
        setCustomAmount(value);
        setDonationAmount(value);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
    };

    const handleDonateClick = () => {
        const amt = parseFloat(customAmount || donationAmount);
        if (!amt || amt <= 0) {
            warning("Invalid Amount", "Please enter a valid donation amount.");
            return;
        }
        setSelectedAmount(amt);
        setShowPaymentModal(true);
    };

    if (loading) {
        return (
            <div className="campaign-detail-page">
                <div className="container">
                    {/* Back button skeleton */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="skeleton skeleton-rounded" style={{ width: '150px', height: '40px' }} />
                    </div>

                    <div className="campaign-detail-grid">
                        {/* Left Column - Main Content Skeleton */}
                        <div className="campaign-main">
                            {/* Image Skeleton */}
                            <div className="skeleton skeleton-rounded" style={{ width: '100%', height: '400px', marginBottom: '1.5rem' }} />

                            {/* Tabs Skeleton */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="skeleton skeleton-rounded" style={{ width: '100px', height: '44px' }} />
                                <div className="skeleton skeleton-rounded" style={{ width: '100px', height: '44px' }} />
                                <div className="skeleton skeleton-rounded" style={{ width: '120px', height: '44px' }} />
                            </div>

                            {/* Content Skeleton */}
                            <div className="skeleton skeleton-text" style={{ width: '60%', height: '28px', marginBottom: '1rem' }} />
                            <div className="skeleton skeleton-text" style={{ width: '100%', height: '18px', marginBottom: '0.5rem' }} />
                            <div className="skeleton skeleton-text" style={{ width: '100%', height: '18px', marginBottom: '0.5rem' }} />
                            <div className="skeleton skeleton-text" style={{ width: '85%', height: '18px', marginBottom: '0.5rem' }} />
                            <div className="skeleton skeleton-text" style={{ width: '90%', height: '18px' }} />
                        </div>

                        {/* Right Column - Sidebar Skeleton */}
                        <div className="campaign-sidebar">
                            <div className="campaign-sidebar-card" style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem' }}>
                                {/* Progress Skeleton */}
                                <div className="skeleton skeleton-text" style={{ width: '50%', height: '32px', marginBottom: '1rem' }} />
                                <div className="skeleton skeleton-rounded" style={{ width: '100%', height: '12px', marginBottom: '1rem' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <div className="skeleton skeleton-text" style={{ width: '80px', height: '20px' }} />
                                    <div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }} />
                                </div>

                                {/* Amount Buttons Skeleton */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="skeleton skeleton-rounded" style={{ height: '44px' }} />
                                    ))}
                                </div>
                                <div className="skeleton skeleton-rounded" style={{ width: '100%', height: '44px', marginBottom: '1rem' }} />
                                <div className="skeleton skeleton-rounded" style={{ width: '100%', height: '52px' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    if (error || !campaign) {
        return (
            <div className="campaign-detail-page">
                <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
                    <h2>Campaign Not Found</h2>
                    <p>{error || "The campaign you are looking for does not exist or has been removed."}</p>
                    <Link to="/browse" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Browse Campaigns
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="campaign-detail-page">
            <div className="container">
                {/* Back Button */}
                <Link to="/browse" className="back-link">
                    <ArrowLeft size={20} />
                    Back to Campaigns
                </Link>

                <div className="campaign-detail-grid">
                    {/* Main Content */}
                    <div className="campaign-main">
                        {/* Campaign Images Gallery */}
                        {campaign.images && campaign.images.length > 0 ? (
                            <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                                <div className="aspect-w-16 aspect-h-9 relative">
                                    <img
                                        src={campaign.images[0]}
                                        alt={campaign.title}
                                        className="w-full h-full object-cover"
                                        style={{ maxHeight: '500px', width: '100%', objectFit: 'cover' }}
                                    />
                                    {campaign.images.length > 1 && (
                                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            +{campaign.images.length - 1} more
                                        </div>
                                    )}
                                </div>
                                {campaign.images.length > 1 && (
                                    <div className="flex gap-2 p-2 overflow-x-auto">
                                        {campaign.images.map((img: string, idx: number) => (
                                            <div key={idx} className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all">
                                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Fallback image if no images exist
                            <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-sm bg-gray-200 flex items-center justify-center p-12">
                                <div className="text-gray-400 flex flex-col items-center">
                                    <User size={64} className="mb-4" />
                                    <p>No campaign images available</p>
                                </div>
                            </div>
                        )}

                        {/* Admin Verification Panel */}
                        {user?.role === 'admin' && (
                            <div className="detail-card mb-8 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                                <div className="bg-[#234563] p-5 flex justify-between items-center text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                            <Shield size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold m-0 text-white">Verification Needed</h3>
                                            <p className="text-blue-100/80 text-sm m-0">Review documents below</p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize tracking-wide shadow-sm border border-white/20 ${campaign.status === 'active' ? 'bg-green-600 text-white' :
                                        campaign.status === 'pending' ? 'bg-yellow-500 text-white' :
                                            'bg-gray-600 text-gray-200'
                                        }`}>
                                        {campaign.status}
                                    </span>
                                </div>

                                <div className="p-6 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                        {campaign.feeStatementUrl && (
                                            <div onClick={() => handleViewDocument(campaign.feeStatementUrl!, 'Fee Statement')}
                                                className="group flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#234563] hover:bg-gray-50 transition-all cursor-pointer">
                                                <div className="p-3 bg-blue-50 text-[#234563] rounded-lg group-hover:bg-[#234563] group-hover:text-white transition-colors">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900 mb-1">Fee Statement</div>
                                                    <div className="text-sm text-gray-500 font-medium flex items-center gap-1 group-hover:text-[#234563] transition-colors">
                                                        View Document <ExternalLink size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {campaign.idUrl && (
                                            <div onClick={() => handleViewDocument(campaign.idUrl!, 'ID Document')}
                                                className="group flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#234563] hover:bg-gray-50 transition-all cursor-pointer">
                                                <div className="p-3 bg-blue-50 text-[#234563] rounded-lg group-hover:bg-[#234563] group-hover:text-white transition-colors">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900 mb-1">ID Document</div>
                                                    <div className="text-sm text-gray-500 font-medium flex items-center gap-1 group-hover:text-[#234563] transition-colors">
                                                        View Document <ExternalLink size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {campaign.enrollmentUrl && (
                                            <div onClick={() => handleViewDocument(campaign.enrollmentUrl!, 'Proof of Enrollment')}
                                                className="group flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#234563] hover:bg-gray-50 transition-all cursor-pointer">
                                                <div className="p-3 bg-blue-50 text-[#234563] rounded-lg group-hover:bg-[#234563] group-hover:text-white transition-colors">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900 mb-1">Proof of Enrollment</div>
                                                    <div className="text-sm text-gray-500 font-medium flex items-center gap-1 group-hover:text-[#234563] transition-colors">
                                                        View Document <ExternalLink size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {campaign.invoiceUrl && (
                                            <div onClick={() => handleViewDocument(campaign.invoiceUrl!, 'Invoice / Quote')}
                                                className="group flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#234563] hover:bg-gray-50 transition-all cursor-pointer">
                                                <div className="p-3 bg-blue-50 text-[#234563] rounded-lg group-hover:bg-[#234563] group-hover:text-white transition-colors">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900 mb-1">Invoice / Quote</div>
                                                    <div className="text-sm text-gray-500 font-medium flex items-center gap-1 group-hover:text-[#234563] transition-colors">
                                                        View Document <ExternalLink size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 border-t pt-6 bg-gray-50 -mx-6 -mb-6 p-6">
                                        <button
                                            onClick={handleAdminReject}
                                            disabled={campaign.status === 'rejected'}
                                            className="flex-1 btn bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                                        >
                                            <XCircle size={20} /> Reject
                                        </button>
                                        <button
                                            onClick={handleAdminApprove}
                                            disabled={campaign.status === 'active' && campaign.student.verificationStatus === 'approved'}
                                            className="flex-1 btn bg-[#234563] text-white hover:bg-[#1a3549] shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                                        >
                                            <CheckCircle size={20} /> Approve & Verify
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Header Card */}
                        <div className="detail-card">
                            <div className="detail-header">
                                <div className="header-content">
                                    <div className="student-avatar">
                                        {campaign.student.profileImage ? (
                                            <img
                                                src={campaign.student.profileImage}
                                                alt={campaign.student.firstName}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <User size={48} strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <div className="student-info">
                                        <div className="student-name-row">
                                            <h1 className="student-name">
                                                {campaign.student.firstName} {campaign.student.lastName}
                                            </h1>
                                            {campaign.student.verificationStatus === 'approved' && (
                                                <span className="verified-badge">
                                                    <CheckCircle size={16} />
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="student-course">{campaign.student.course}</p>
                                        <p className="student-university">
                                            {campaign.university.name} • {campaign.student.yearOfStudy}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-body">
                                {/* Progress */}
                                <div className="funding-progress">
                                    <div className="progress-header">
                                        <span className="raised-amount">R{campaign.raised.toLocaleString()}</span>
                                        <span className="goal-amount">raised of R{campaign.goal.toLocaleString()}</span>
                                    </div>
                                    <div className="progress-bar large">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${percentFunded}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="campaign-stats-grid">
                                    <div className="stat-box">
                                        <span className="stat-value">{campaign.donors}</span>
                                        <span className="stat-label">Donors</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-value">{Math.round(percentFunded)}%</span>
                                        <span className="stat-label">Funded</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-value">{campaign.daysLeft}</span>
                                        <span className="stat-label">Days Left</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Story */}
                        <div className="detail-card">
                            <h2 className="card-title">
                                <Heart size={24} className="title-icon pink" />
                                My Story
                            </h2>
                            <div className="story-content">
                                <p>{campaign.story}</p>
                            </div>
                        </div>

                        {/* Funding Breakdown */}
                        <div className="detail-card">
                            <h2 className="card-title">
                                <DollarSign size={24} className="title-icon green" />
                                Funding Breakdown
                            </h2>
                            <div className="breakdown-list">
                                {campaign.fundingBreakdown.map((item) => (
                                    <div key={item.id} className="breakdown-item">
                                        <span className="breakdown-name">{item.name}</span>
                                        <span className="breakdown-amount">R{item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="breakdown-total">
                                    <span>Total</span>
                                    <span>R{campaign.goal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* University Verification */}
                        <div className="detail-card">
                            <h2 className="card-title">
                                <Building size={24} className="title-icon blue" />
                                Payment Goes Directly To
                            </h2>
                            <div className="university-box">
                                <div className="university-header">
                                    <div className="university-icon">
                                        <Landmark size={32} strokeWidth={1.5} />
                                    </div>
                                    <div className="university-info">
                                        <h3 className="university-name">{campaign.university.name}</h3>
                                        <p className="university-label">Verified Institution</p>
                                    </div>
                                </div>
                                <div className="bank-details">
                                    <div className="bank-row">
                                        <span className="bank-label">Account Name:</span>
                                        <span className="bank-value">{campaign.university.accountName}</span>
                                    </div>
                                    <div className="bank-row">
                                        <span className="bank-label">Bank:</span>
                                        <span className="bank-value">{campaign.university.bankName}</span>
                                    </div>
                                    <div className="bank-row">
                                        <span className="bank-label">Reference:</span>
                                        <span className="bank-value highlight">Student #{campaign.student.studentNumber}</span>
                                    </div>
                                </div>
                                <div className="security-notice">
                                    <Shield size={20} />
                                    <span>Funds are transferred directly to the university, not to the student's personal account</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Donation */}
                    <div className="campaign-sidebar">
                        <div className="donation-card">
                            <h3 className="donation-title">Support {campaign.student.firstName}</h3>

                            <div className="preset-amounts">
                                {DONATION_AMOUNTS.map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => handlePresetAmount(amount)}
                                        className={`preset-btn ${donationAmount === amount.toString() && !customAmount ? 'active' : ''}`}
                                    >
                                        R{amount.toLocaleString()}
                                    </button>
                                ))}
                            </div>

                            <div className="custom-amount">
                                <label className="form-label">Custom Amount</label>
                                <div className="amount-input-wrapper">
                                    <span className="currency-symbol">R</span>
                                    <input
                                        type="number"
                                        placeholder="Enter amount"
                                        value={customAmount}
                                        onChange={(e) => handleCustomAmount(e.target.value)}
                                        className="form-input amount-input"
                                    />
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-lg donate-btn"
                                onClick={handleDonateClick}
                                disabled={(!donationAmount && !customAmount)}
                            >
                                Donate Now
                            </button>

                            <p className="donation-note">
                                Your donation will be sent directly to {campaign.university.name}
                            </p>

                            <div className="share-section">
                                <p className="share-label">Share this campaign</p>
                                <p className="share-help">Help spread the word on social media!</p>
                                <div className="share-buttons">
                                    <a
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="share-btn facebook"
                                        title="Share on Facebook"
                                    >
                                        <Facebook size={20} />
                                    </a>
                                    <a
                                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`🎓 Help ${campaign.student.firstName} complete their ${campaign.student.course} degree! Every rand counts. #UniFund #Education #SouthAfrica`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="share-btn twitter"
                                        title="Share on X (Twitter)"
                                    >
                                        <Twitter size={20} />
                                    </a>
                                    <a
                                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🎓 Please help ${campaign.student.firstName} reach their educational goals at ${campaign.university.name}!\n\nThey need R${(campaign.goal - campaign.raised).toLocaleString()} more to complete their ${campaign.student.course} degree.\n\nDonate here: ${window.location.href}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="share-btn whatsapp"
                                        title="Share on WhatsApp"
                                    >
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                    </a>
                                    <a
                                        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(`Help ${campaign.student.firstName} complete their education`)}&summary=${encodeURIComponent(`Support a verified South African student studying ${campaign.student.course} at ${campaign.university.name}. 100% of donations go directly to the university.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="share-btn linkedin"
                                        title="Share on LinkedIn"
                                    >
                                        <Linkedin size={20} />
                                    </a>
                                    <button
                                        type="button"
                                        onClick={copyToClipboard}
                                        className="share-btn copy"
                                        title="Copy link"
                                    >
                                        <Copy size={20} />
                                        {showShareTooltip && <span className="copy-tooltip">Copied!</span>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showPaymentModal && campaign && (
                <PaymentModal
                    amount={selectedAmount}
                    campaign={campaign}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={() => {
                        // Ideally refresh campaign data
                        setShowPaymentModal(false);
                        success("Thank You!", "Your donation has been successfully submitted.");
                    }}
                />
            )}


            <DocumentViewerModal
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                url={viewerUrl}
                title={viewerTitle}
            />
        </div>
    );
};

export default CampaignDetail;
