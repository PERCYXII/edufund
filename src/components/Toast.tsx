import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, title, message, duration = 3000, onClose }) => {
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsRemoving(true);
        setTimeout(() => onClose(id), 300); // Wait for animation
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={20} className="text-green-500" />;
            case 'error': return <AlertCircle size={20} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={20} className="text-yellow-500" />;
            case 'info': return <Info size={20} className="text-blue-500" />;
            default: return <Info size={20} />;
        }
    };

    return (
        <div className={`toast toast-${type} ${isRemoving ? 'removing' : ''}`} role="alert">
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-content">
                <div className="toast-title">{title}</div>
                {message && <div className="toast-message">{message}</div>}
            </div>
            <button className="toast-close" onClick={handleClose} aria-label="Close">
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
