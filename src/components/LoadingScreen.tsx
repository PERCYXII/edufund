import React from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
    title?: string;
    message?: string;
    showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
    title = 'Loading',
    message = 'Please wait...',
    showLogo = true
}) => {
    return (
        <div className="loading-screen-overlay">
            <div className="loading-screen-content">
                <div className="loading-screen-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                </div>
                {showLogo && (
                    <img src="/images/logo.png" alt="UniFund" className="loading-screen-logo" />
                )}
                <h2 className="loading-screen-title">{title}</h2>
                <p className="loading-screen-text">{message}</p>
                <div className="loading-screen-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
