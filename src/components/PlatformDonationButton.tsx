import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './PlatformDonationButton.css';

interface PlatformDonationButtonProps {
    className?: string;
    onDonationSuccess?: () => void;
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_7a70161c3f2718d3ef9d6a8308fc1c677b4ca5be';

const PlatformDonationButton: React.FC<PlatformDonationButtonProps> = ({ className, onDonationSuccess }) => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState('50');
    const [email, setEmail] = useState('');
    const [reference, setReference] = useState('');

    // Generate a new reference when the modal opens
    const handleInitialClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (user) {
            setEmail(user.email || '');
        }
        setReference('PLATFORM_' + new Date().getTime().toString());
        setShowModal(true);
    };

    const config = {
        reference: reference, // Unique reference for this attempt
        email: email,
        amount: (parseFloat(amount) || 0) * 100, // Amount in cents (ZAR)
        publicKey: PAYSTACK_PUBLIC_KEY,
        currency: 'ZAR',
        metadata: {
            custom_fields: [
                {
                    display_name: "Donation Type",
                    variable_name: "donation_type",
                    value: "platform_support"
                }
            ]
        },
    };

    const initializePayment = usePaystackPayment(config);

    const onSuccess = async (responseData: any) => {
        console.log("Paystack: Payment successful", responseData);
        setShowModal(false);
        setLoading(true); // Show loading while saving to DB

        try {
            const { error: donationError } = await supabase
                .from('donations')
                .insert({
                    campaign_id: null, // Platform donation
                    amount: parseFloat(amount),
                    is_anonymous: !user,
                    payment_reference: responseData.reference || responseData.trxref || reference,
                    proof_of_payment_url: 'paystack_ref_' + (responseData.reference || reference),
                    status: 'received', // Auto-verified since it's Paystack
                    payment_status: 'completed',
                    guest_name: user ? `${user.student?.firstName} ${user.student?.lastName}`.trim() : 'Anonymous Donor',
                    guest_email: email || (user?.email)
                });

            if (donationError) throw donationError;

            success('Donation Successful', `Thank you for supporting UniFund! Ref: ${responseData.reference}`);
            if (onDonationSuccess) onDonationSuccess();
        } catch (err) {
            console.error("Error recording donation:", err);
            // Still show success since money was likely deducted
            success('Donation Processed', `Thank you! Your donation was successful. Ref: ${responseData.reference}`);
        } finally {
            setLoading(false);
            setAmount('50');
            if (!user) setEmail('');
        }
    };

    const onClose = () => {
        console.log("Paystack: Modal closed");
        // User cancelled payment
    };

    const handlePaystack = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Paystack: Button clicked", { amount, email });

        if (!amount || parseFloat(amount) <= 0) {
            toastError("Invalid Amount", "Please enter a valid amount.");
            return;
        }

        if (!email) {
            toastError("Email Required", "Please enter an email address for the receipt.");
            return;
        }

        // CAST TO ANY to bypass TS error "Expected 1 arguments, but got 2"
        // The library hook returns a function that DOES accept (onSuccess, onClose) at runtime.
        (initializePayment as any)(onSuccess, onClose);
    };

    return (
        <>
            <button
                type="button"
                onClick={handleInitialClick}
                disabled={loading}
                className={`platform-donate-btn ${className || ''}`}
            >
                <Heart size={20} fill="currentColor" />
                <span>{loading ? 'Processing...' : 'Donate to UniFund'}</span>
            </button>

            {showModal && createPortal(
                <div className="donation-modal-overlay" style={{ zIndex: 2147483647 }}>
                    <div className="donation-modal-content">
                        <div className="donation-modal-header">
                            <h3 className="donation-modal-title">Support UniFund</h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="donation-modal-close"
                            >
                                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <p className="donation-modal-description">
                            Your contribution helps us keep the platform running and free for students.
                        </p>

                        <form onSubmit={handlePaystack} noValidate>
                            <div className="donation-form-group">
                                <label className="donation-label">Amount (ZAR)</label>
                                <div className="donation-input-wrapper">
                                    <span className="donation-currency-symbol">R</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="donation-input"
                                        placeholder="50"
                                        min="10"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {!user && (
                                <div className="donation-form-group">
                                    <label className="donation-label">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="donation-input text-input"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="donation-submit-btn"
                                    style={{ backgroundColor: '#f3f4f6', color: '#374151', flex: '1' }}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="donation-submit-btn"
                                    disabled={loading}
                                    style={{ flex: '2' }}
                                >
                                    {loading ? 'Processing...' : 'Proceed to Pay'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default PlatformDonationButton;
