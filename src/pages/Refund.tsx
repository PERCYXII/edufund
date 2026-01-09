import React from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, HelpCircle, Building } from 'lucide-react';
import './InfoPages.css';

const Refund: React.FC = () => {
    return (
        <div className="info-page">
            <header className="info-hero refund-hero">
                <div className="container">
                    <h1>Refund Policy</h1>
                    <p>Understanding how donations work on UniFund</p>
                </div>
            </header>

            <section className="section refund-content">
                <div className="container narrow">
                    <div className="info-card">
                        <div className="alert-info dark-style p-6 mb-8 rounded-r-lg">
                            <div className="flex gap-4">
                                <AlertTriangle className="text-amber-500 shrink-0" size={32} />
                                <div>
                                    <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-accent-yellow)' }}>Important: No Refunds Available</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.8)' }}>UniFund does not offer refunds on donations. When you donate through our platform, your funds are transferred <strong>directly and immediately</strong> to the university's bank account – not to UniFund.</p>
                                </div>
                            </div>
                        </div>

                        <div className="refund-sections">
                            <div className="refund-section mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <Building className="text-primary-400" size={24} />
                                    <h2 className="font-bold text-xl" style={{ color: 'var(--color-accent-yellow)' }}>Direct Payment Model</h2>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                                    UniFund is a transparent connection platform. We do not hold, manage, or process any donor funds. When you make a donation:
                                </p>
                                <ul style={{ color: 'rgba(255,255,255,0.7)', marginTop: '1rem', paddingLeft: '1.5rem' }}>
                                    <li style={{ marginBottom: '0.5rem' }}>• Your payment goes <strong>directly to the university's bank account</strong></li>
                                    <li style={{ marginBottom: '0.5rem' }}>• The student's number is used as a reference for correct allocation</li>
                                    <li style={{ marginBottom: '0.5rem' }}>• Funds are applied immediately to the student's tuition/fees</li>
                                    <li>• UniFund never touches or holds your money</li>
                                </ul>
                            </div>

                            <div className="refund-section mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <RotateCcw className="text-blue-400" size={24} />
                                    <h2 className="font-bold text-xl" style={{ color: 'var(--color-accent-yellow)' }}>Why We Cannot Offer Refunds</h2>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                                    Since donations are paid directly to universities and applied to student accounts immediately, UniFund has no ability to retrieve or refund these funds. Once a payment is made, it is under the control of the receiving institution, not UniFund.
                                </p>
                            </div>

                            <div className="refund-section mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle className="text-emerald-500" size={24} />
                                    <h2 className="font-bold text-xl" style={{ color: 'var(--color-accent-yellow)' }}>Payment Processing Issues</h2>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                                    If you experience a technical error during payment (such as a duplicate charge or failed transaction), please contact your bank or payment provider directly. For payment gateway issues, you may also reach out to Paystack support with your transaction reference.
                                </p>
                            </div>

                            <div className="refund-section">
                                <div className="flex items-center gap-3 mb-4">
                                    <HelpCircle className="text-primary-400" size={24} />
                                    <h2 className="font-bold text-xl" style={{ color: 'var(--color-accent-yellow)' }}>Need Help?</h2>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                                    If you have questions about a specific donation or need documentation for your records, please email <a href="mailto:support@unifund.co.za" style={{ color: 'var(--color-accent-yellow)', fontWeight: 'bold', textDecoration: 'underline' }}>support@unifund.co.za</a> with your transaction reference number and date.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Refund;
