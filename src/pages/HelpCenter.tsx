import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Mail, MessageSquare, Phone } from 'lucide-react';
import './InfoPages.css';

const FAQ_DATA = [
    {
        question: "How does UniFund verify students?",
        answer: "Every student must upload a certified copy of their ID and an official enrollment letter/fee statement from their university. Our admin team manually verifies these documents with the respective institutions before any campaign goes live."
    },
    {
        question: "Where does my donation go?",
        answer: "100% of your donation (minus payment processing fees) is paid directly to the university's managed student account. We use the student number as a reference to ensure the funds are allocated correctly to that specific student's tuition or residence fees."
    },
    {
        question: "Can I get a tax certificate for my donation?",
        answer: "Yes, UniFund is a registered non-profit organization. You can request a Section 18A tax certificate for your donations at the end of the financial year. Please ensure you provide your full details during the donation process."
    },
    {
        question: "What happens if a campaign doesn't reach its goal?",
        answer: "Unlike many other platforms, UniFund is not 'all-or-nothing'. Any amount raised is still paid over to the university to reduce the student's debt, even if the full goal isn't reached."
    },
    {
        question: "How can I start my own campaign?",
        answer: "If you are a registered student at a South African university or TVET college, you can sign up as a student, complete your profile with the required documents, and submit your campaign for review."
    }
];

const HelpCenter: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const filteredFaqs = FAQ_DATA.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="info-page">
            <header className="info-hero help-hero">
                <div className="container">
                    <h1>How can we help you?</h1>
                    <div className="search-bar">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <section className="section faq-section">
                <div className="container narrow">
                    <div className="section-header">
                        <h2>Frequently Asked Questions</h2>
                        <p>Find quick answers to common questions about our platform</p>
                    </div>

                    <div className="faq-list">
                        {filteredFaqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`faq-item ${openIndex === index ? 'open' : ''}`}
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            >
                                <div className="faq-question">
                                    <h3>{faq.question}</h3>
                                    {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                                {openIndex === index && (
                                    <div className="faq-answer">
                                        <p>{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section info-page-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Still need help?</h2>
                        <p>Our support team is always ready to assist you</p>
                    </div>

                    <div className="support-grid">
                        <div className="info-card">
                            <Mail size={32} className="text-primary-400" />
                            <h3>Email Support</h3>
                            <p>Send us an email and we'll get back to you within 24 hours.</p>
                            <a href="mailto:support@unifund.co.za" className="info-card-link">support@unifund.co.za</a>
                        </div>
                        <div className="info-card">
                            <MessageSquare size={32} className="text-success-500" />
                            <h3>Live Chat</h3>
                            <p>Available Monday to Friday, 8am - 5pm SAST.</p>
                            <button className="btn btn-outline btn-sm mt-4">Start Chat</button>
                        </div>
                        <div className="info-card">
                            <Phone size={32} className="text-blue-400" />
                            <h3>Call Us</h3>
                            <p>Direct assistance for urgent verification matters.</p>
                            <a href="tel:+27111234567" className="info-card-link">+27 11 123 4567</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HelpCenter;
