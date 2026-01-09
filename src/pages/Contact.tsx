import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './InfoPages.css';

const Contact: React.FC = () => {
    const { success } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'general',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            success("Message Sent", "Thank you for reaching out! We'll get back to you soon.");
            setFormData({ name: '', email: '', subject: 'general', message: '' });
            setLoading(false);
        }, 1500);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="info-page">
            <header className="info-hero contact-hero">
                <div className="container">
                    <h1>Contact Us</h1>
                    <p>We're here to support your educational journey</p>
                </div>
            </header>

            <section className="section contact-section">
                <div className="container">
                    <div className="contact-grid">
                        <div className="contact-info-panel">
                            <h2>Get in Touch</h2>
                            <p>Have questions about student verification, donations, or how to start a campaign? Send us a message.</p>

                            <div className="contact-methods">
                                <div className="contact-method">
                                    <div className="icon-circle">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h4>Email Us</h4>
                                        <p>hello@unifund.co.za</p>
                                    </div>
                                </div>
                                <div className="contact-method">
                                    <div className="icon-circle">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <h4>Call Us</h4>
                                        <p>+27 11 123 4567</p>
                                    </div>
                                </div>
                                <div className="contact-method">
                                    <div className="icon-circle">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h4>Our Office</h4>
                                        <p>123 Education Square, Braamfontein<br />Johannesburg, 2001</p>
                                    </div>
                                </div>
                            </div>

                            <div className="whatsapp-notice">
                                <MessageCircle size={20} className="text-emerald-500" />
                                <span>Support is also available via WhatsApp: <strong>+27 82 000 0000</strong></span>
                            </div>
                        </div>

                        <div className="contact-form-panel">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        placeholder="Enter your name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <select
                                        name="subject"
                                        className="form-input"
                                        value={formData.subject}
                                        onChange={handleChange}
                                    >
                                        <option value="general">General Inquiry</option>
                                        <option value="student">Student Verification</option>
                                        <option value="donor">Donation/Payment Issue</option>
                                        <option value="partnership">Partnership Request</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        name="message"
                                        className="form-input"
                                        rows={5}
                                        placeholder="How can we help?"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                                    {loading ? 'Sending...' : (
                                        <>
                                            <Send size={18} className="mr-2" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
