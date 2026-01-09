import React from 'react';
import { FileText, ShieldAlert, Scale, Globe } from 'lucide-react';
import './InfoPages.css';

const Terms: React.FC = () => {
    return (
        <div className="info-page">
            <header className="info-hero terms-hero">
                <div className="container">
                    <h1>Terms of Service</h1>
                    <p>Understanding the agreement between you and UniFund</p>
                </div>
            </header>

            <section className="section terms-content">
                <div className="container narrow">
                    <div className="info-card legal-card">
                        <div className="terms-section">
                            <div className="section-title-with-icon">
                                <FileText className="text-primary-600" />
                                <h2>1. Acceptance of Terms</h2>
                            </div>
                            <p>By accesssing and using the UniFund platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please refrain from using our services.</p>
                        </div>

                        <div className="terms-section">
                            <div className="section-title-with-icon">
                                <ShieldAlert className="text-emerald-600" />
                                <h2>2. User Verification</h2>
                            </div>
                            <p>All student users are required to provide accurate and verifiable information. UniFund reserves the right to suspend or terminate accounts that provide fraudulent or misleading documentation. Intentional misrepresentation of student status is grounds for legal action.</p>
                        </div>

                        <div className="terms-section">
                            <div className="section-title-with-icon">
                                <Globe className="text-blue-600" />
                                <h2>3. Donation Model</h2>
                            </div>
                            <p>UniFund is a transparent connector platform. <strong>We do not hold, manage, or process donor funds intended for students.</strong> When you donate to a student campaign, your payment is transferred directly and immediately to the university's bank account using the student number as a reference. UniFund does not guarantee that any campaign will reach its funding goal.</p>
                        </div>

                        <div className="terms-section">
                            <div className="section-title-with-icon">
                                <Scale className="text-purple-600" />
                                <h2>4. Fees and Charges</h2>
                            </div>
                            <p>Third-party payment processors (like Paystack) charge processing fees on each transaction. These fees are deducted from the donated amount. UniFund may receive separate voluntary platform donations from users who wish to support our operational costs.</p>
                        </div>

                        <div className="terms-section">
                            <h2>5. Limitation of Liability</h2>
                            <p>UniFund is not liable for any disputes between donors, students, or universities. We act solely as a verification and connection platform. Since student donations are paid directly to universities and not held by UniFund, <strong>we cannot offer refunds or retrieve funds once a transaction is completed.</strong> Any payment-related issues should be directed to the payment processor or the receiving university.</p>
                        </div>
                    </div>

                    <div className="privacy-link-prompt mt-8 text-center p-6 bg-gray-50 rounded-xl">
                        <p>Looking for our data protection policies? <a href="/privacy" className="text-primary-600 font-bold underline">Read our Privacy Policy and POPIA commitment.</a></p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Terms;
