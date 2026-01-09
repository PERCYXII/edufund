import React from 'react';
import { Shield, Lock, Eye, FileCheck, Info } from 'lucide-react';
import './InfoPages.css';

const Privacy: React.FC = () => {
    return (
        <div className="info-page privacy-page">
            <div className="container privacy-container">
                <header className="privacy-header">
                    <div className="privacy-icon-container">
                        <Shield size={48} className="text-primary-600" />
                    </div>
                    <h1>Privacy Policy & Data Protection</h1>
                    <p className="last-updated">Last Updated: January 2026</p>
                    <p className="privacy-intro">
                        At UniFund, your privacy and the security of your personal information are our top priorities.
                        We are fully committed to compliance with the <strong>Protection of Personal Information Act (POPIA)</strong> of South Africa.
                    </p>
                </header>

                <div className="privacy-grid">
                    <section className="info-card">
                        <div className="section-header">
                            <Lock size={24} className="text-emerald-600" />
                            <h2>How We Protect Your Info</h2>
                        </div>
                        <p>
                            We implement industry-standard security measures to ensure your data remains confidential and secure.
                            All sensitive documents, such as ID copies and fee statements, are stored in encrypted environments
                            and are only accessible to authorized verification officers.
                        </p>
                        <ul className="privacy-list">
                            <li>End-to-end encryption for document uploads</li>
                            <li>Secure cloud storage with restricted access</li>
                            <li>Regular security audits and monitoring</li>
                        </ul>
                    </section>

                    <section className="info-card">
                        <div className="section-header">
                            <FileCheck size={24} className="text-blue-600" />
                            <h2>POPIA Compliance</h2>
                        </div>
                        <p>
                            In accordance with POPIA, we only collect information that is strictly necessary for:
                        </p>
                        <ul className="privacy-list">
                            <li>Verifying student enrollment and identity</li>
                            <li>Facilitating direct payments to university accounts</li>
                            <li>Preventing fraudulent activities on the platform</li>
                        </ul>
                        <p className="mt-4 text-sm italic">
                            You have the right to access, correct, or request the deletion of your personal information at any time.
                        </p>
                    </section>

                    <section className="info-card full-width">
                        <div className="section-header">
                            <Eye size={24} className="text-purple-600" />
                            <h2>What Information We Collect</h2>
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <h3>For Students</h3>
                                <p>Name, contact details, student number, university enrollment proof, and academic records for verification purposes.</p>
                            </div>
                            <div className="info-item">
                                <h3>For Donors</h3>
                                <p>Name, email (for receipts), and payment references. We do NOT store credit card details on our servers; all payments are handled by certified providers like Paystack.</p>
                            </div>
                        </div>
                    </section>

                    <section className="info-card full-width alert-info dark-style">
                        <div className="section-header">
                            <Info size={24} className="text-primary-600" />
                            <h2>Transparency Commitment</h2>
                        </div>
                        <p>
                            We do not sell your data to third parties. We only share necessary verification details with
                            relevant educational institutions when required to confirm your status.
                            Public campaign profiles only display information you choose to share in your story.
                        </p>
                    </section>
                </div>

                <div className="privacy-footer-note">
                    <p>Questions about our privacy practices? Contact our Data Protection Officer at <a href="mailto:privacy@unifund.co.za">privacy@unifund.co.za</a></p>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
