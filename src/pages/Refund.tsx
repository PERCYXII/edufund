import React from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import './InfoPages.css';

const Refund: React.FC = () => {
    return (
        <div className="info-page">
            <header className="info-hero refund-hero">
                <div className="container">
                    <h1>Refund Policy</h1>
                    <p>Transparency regarding your donations and contributions</p>
                </div>
            </header>

            <section className="section refund-content">
                <div className="container narrow">
                    <div className="info-card">
                        <div className="alert-info dark-style p-6 mb-8 rounded-r-lg">
                            <div className="flex gap-4">
                                <RotateCcw className="text-blue-600 shrink-0" size={32} />
                                <div>
                                    <h3 className="font-bold text-blue-900 text-lg mb-2">Our Core Refund Policy</h3>
                                    <p className="text-blue-800">Because donations are frequently paid directly to universities across South Africa, UniFund generally operates on a <strong>non-refundable donation policy</strong> once funds have been processed.</p>
                                </div>
                            </div>
                        </div>

                        <div className="refund-sections">
                            <div className="refund-section mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle className="text-amber-500" size={24} />
                                    <h2 className="font-bold text-xl">1. Exceptions for Errors</h2>
                                </div>
                                <p className="text-gray-600 leading-relaxed">If a donor makes a technical error (e.g., duplicated transaction due to a connection issue), UniFund will work with the payment processor to refund the duplicate amount, provided it is reported within <strong>48 hours</strong> and the funds have not yet been disbursed to the university.</p>
                            </div>

                            <div className="refund-section mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle className="text-emerald-500" size={24} />
                                    <h2 className="font-bold text-xl">2. Fraudulent Activity</h2>
                                </div>
                                <p className="text-gray-600 leading-relaxed">If a campaign is found to be fraudulent after donations have been made but before payout, UniFund will attempt to stop the payout and refund the donors. If funds have already been paid to the university, we will cooperate with standard banking recovery procedures.</p>
                            </div>

                            <div className="refund-section">
                                <div className="flex items-center gap-3 mb-4">
                                    <HelpCircle className="text-primary-500" size={24} />
                                    <h2 className="font-bold text-xl">3. How to Request a Refund</h2>
                                </div>
                                <p className="text-gray-600 leading-relaxed">To report an issue with a transaction, please email <a href="mailto:finance@unifund.co.za" className="text-primary-600 font-bold underline">finance@unifund.co.za</a> with your transaction reference number, date, and reason for the request.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Refund;
