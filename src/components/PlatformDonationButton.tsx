import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './PlatformDonationButton.css';

interface PlatformDonationButtonProps {
    className?: string;
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_7a70161c3f2718d3ef9d6a8308fc1c677b4ca5be';

const PlatformDonationButton: React.FC<PlatformDonationButtonProps> = ({ className }) => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState('50');
    const [email, setEmail] = useState('');

    const handleInitialClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (user) {
            setEmail(user.email || '');
        }
        setShowModal(true);
    };

    const handlePaystack = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Paystack: Button clicked", { amount, email });

        if (!amount || parseFloat(amount) <= 0) {
            console.error("Paystack: Invalid amount");
            toastError("Invalid Amount", "Please enter a valid amount.");
            return;
        }

        if (!email) {
            console.error("Paystack: No email");
            toastError("Email Required", "Please enter an email address for the receipt.");
            return;
        }

        setShowModal(false);
        setLoading(true);

        const amountInCents = parseFloat(amount) * 100;
        console.log("Paystack: Loading script for amount (cents):", amountInCents);

        // Dynamically load Paystack script
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = () => {
            console.log("Paystack: Script loaded successfully");
            try {
                const handler = (window as any).PaystackPop.setup({
                    key: PAYSTACK_PUBLIC_KEY,
                    email: email,
                    amount: amountInCents,
                    currency: 'ZAR',
                    ref: 'PLATFORM_' + Math.floor((Math.random() * 1000000000) + 1),
                    metadata: {
                        custom_fields: [
                            {
                                display_name: "Donation Type",
                                variable_name: "donation_type",
                                value: "platform_support"
                            }
                        ]
                    },
                    callback: async function (response: any) {
                        console.log("Paystack: Payment successful", response);
                        try {
                            const { error: donationError } = await supabase
                                .from('donations')
                                .insert({
                                    campaign_id: null, // Platform donation
                                    amount: parseFloat(amount),
                                    is_anonymous: !user,
                                    payment_reference: response.reference,
                                    proof_of_payment_url: 'paystack_ref_' + response.reference,
                                    status: 'received', // Auto-verified since it's Paystack
                                    guest_name: user ? `${user.student?.firstName} ${user.student?.lastName}`.trim() : 'Anonymous Donor',
                                    guest_email: email || (user?.email)
                                });

                            if (donationError) throw donationError;

                            success('Donation Successful', `Thank you for supporting UniFund! Ref: ${response.reference}`);
                        } catch (err) {
                            console.error("Error recording donation:", err);
                            // Still show success since money was taken, but log error
                            success('Donation Processed', `Thank you! Your donation was successful (Ref: ${response.reference}), but there was an issue recording it in our logs.`);
                        } finally {
                            setLoading(false);
                            setAmount('50'); // Reset default
                            if (!user) setEmail('');
                        }
                    },
                    onClose: function () {
                        console.log("Paystack: Modal closed");
                        setLoading(false);
                    }
                });
                console.log("Paystack: Opening iframe");
                handler.openIframe();
            } catch (err) {
                console.error("Paystack: Error initializing", err);
                toastError("Error", "Could not initialize payment processor");
                setLoading(false);
            }
        };
        script.onerror = (e) => {
            console.error("Paystack: Script failed to load", e);
            toastError("Error", "Failed to load payment processor");
            setLoading(false);
        };
        document.body.appendChild(script);
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
                            <h3 className="donation-modal-title">Support Platform</h3>
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

                        <form onSubmit={handlePaystack}>
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

                            <button
                                type="submit"
                                className="donation-submit-btn"
                            >
                                Proceed to Pay
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default PlatformDonationButton;
