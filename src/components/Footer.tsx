import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Facebook, Twitter, Linkedin, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PlatformDonationButton from './PlatformDonationButton';
import './Footer.css';

const Footer: React.FC = () => {
    const { isLoggedIn, user } = useAuth();
    const [showCopyTooltip, setShowCopyTooltip] = useState(false);

    const shareUrl = window.location.href; // Get current page URL
    const shareText = "Check out UniFund - verify and fund reliable South African students directly!";

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setShowCopyTooltip(true);
        setTimeout(() => setShowCopyTooltip(false), 2000);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src="/images/logo.png" alt="UniFund Logo" className="footer-logo-image" />
                            <span className="footer-logo-text" style={{ display: 'none' }}>UniFund</span>
                        </div>
                        <p className="footer-tagline">
                            Empowering students through transparent, direct educational funding.
                        </p>
                        <div className="footer-trust-logos">
                            <img src="/images/dept-education-logo.jpg" alt="Department of Education South Africa" className="trust-logo dept-logo" />
                            <img src="/images/logos/proudly-south-african-logo.png" alt="Proudly South African" className="trust-logo" />
                            <img src="/images/logos/ubuntu-logo.jpg" alt="Ubuntu" className="trust-logo" />
                        </div>

                        {/* Social Sharing */}
                        <div className="footer-social-section">
                            <p className="footer-social-title">Share this page</p>
                            <div className="footer-social-icons">
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-icon-btn facebook"
                                    title="Share on Facebook"
                                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                                >
                                    <Facebook size={18} />
                                </a>
                                <a
                                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-icon-btn twitter"
                                    title="Share on X"
                                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                                >
                                    <Twitter size={18} />
                                </a>
                                <a
                                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-icon-btn whatsapp"
                                    title="Share on WhatsApp"
                                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                                >
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </a>
                                <a
                                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent("UniFund - Support Student Education")}&summary=${encodeURIComponent(shareText)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-icon-btn linkedin"
                                    title="Share on LinkedIn"
                                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                                >
                                    <Linkedin size={18} />
                                </a>
                                <button
                                    onClick={handleCopyLink}
                                    className="social-icon-btn copy"
                                    title="Copy Link"
                                    style={{ position: 'relative' }}
                                >
                                    <Copy size={18} />
                                    {showCopyTooltip && <span className="copy-tooltip">Copied!</span>}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Platform</h4>
                        <ul className="footer-links">
                            <li><Link to="/browse" onClick={scrollToTop}>Browse Campaigns</Link></li>
                            <li>
                                <Link to={isLoggedIn ? (user?.role === 'admin' ? "/admin" : "/dashboard") : "/register/student"} onClick={scrollToTop}>
                                    {isLoggedIn ? "Go to Dashboard" : "Start a Campaign"}
                                </Link>
                            </li>
                            <li><Link to="/how-it-works" onClick={scrollToTop}>How It Works</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Support</h4>
                        <ul className="footer-links">
                            <li><Link to="/help" onClick={scrollToTop}>Help Center</Link></li>
                            <li><Link to="/contact" onClick={scrollToTop}>Contact Us</Link></li>
                            <li><Link to="/faq" onClick={scrollToTop}>FAQs</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Legal</h4>
                        <ul className="footer-links">
                            <li><Link to="/privacy" onClick={scrollToTop}>Privacy Policy</Link></li>
                            <li><Link to="/terms" onClick={scrollToTop}>Terms of Service</Link></li>
                            <li><Link to="/refund" onClick={scrollToTop}>Refund Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p>&copy; {new Date().getFullYear()} UniFund. All rights reserved. Made with <Heart size={16} className="footer-heart" fill="currentColor" /> for South African students.</p>
                        <div className="flex flex-col items-center gap-2">
                            <PlatformDonationButton />
                            <span className="text-xs text-gray-500 italic">Help us keep the platform running</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
