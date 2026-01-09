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
                                <h2>3. Donation Allocation</h2>
                            </div>
                            <p>UniFund operates as a facilitator. Donations made to student campaigns are paid directly to the university's managed student account. UniFund does not guarantee that any campaign will reach its funding goal.</p>
                        </div>

                        <div className="terms-section">
                            <div className="section-title-with-icon">
                                <Scale className="text-purple-600" />
                                <h2>4. Fees and Charges</h2>
                            </div>
                            <p>While UniFund strives to keep fees at a minimum, third-party payment processors (like Paystack) charge a processing fee on each transaction. These fees are deducted from the donated amount before transfer to the university.</p>
                        </div>

                        <div className="terms-section">
                            <h2>5. Limitation of Liability</h2>
                            <p>UniFund is not liable for any disputes between donors and students. We act solely as a verification and payment facilitation platform.</p>
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
