import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, ExternalLink, RotateCw } from 'lucide-react';

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string | null;
    title?: string;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, url, title = 'Document Viewer' }) => {
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setZoom(1);
            setRotation(0);
            setError(false);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, url]);

    if (!isOpen || !url) return null;

    const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');
    const isImage = !isPdf; // Simplified check, could be more robust

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative w-full h-full max-w-6xl max-h-[95vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden m-4 animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white border-b border-gray-800">
                    <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-lg truncate max-w-md">{title}</h3>
                        <div className="flex items-center gap-2 text-sm bg-gray-800 px-3 py-1 rounded-full text-gray-300">
                            {isPdf ? 'PDF Document' : 'Image File'}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isImage && (
                            <div className="flex items-center gap-1 mr-4 bg-gray-800 rounded-lg p-1">
                                <button onClick={handleZoomOut} className="p-2 hover:bg-gray-700 rounded-md transition-colors" title="Zoom Out">
                                    <ZoomOut size={18} />
                                </button>
                                <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                                <button onClick={handleZoomIn} className="p-2 hover:bg-gray-700 rounded-md transition-colors" title="Zoom In">
                                    <ZoomIn size={18} />
                                </button>
                                <div className="w-[1px] h-6 bg-gray-700 mx-1"></div>
                                <button onClick={handleRotate} className="p-2 hover:bg-gray-700 rounded-md transition-colors" title="Rotate">
                                    <RotateCw size={18} />
                                </button>
                            </div>
                        )}

                        <a
                            href={url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                            title="Download / Open Original"
                        >
                            <Download size={20} />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors text-gray-400"
                            title="Close"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-100 relative overflow-hidden flex items-center justify-center p-4">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
                            <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium">Loading document...</p>
                        </div>
                    )}

                    {error ? (
                        <div className="text-center p-8 max-w-md">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ExternalLink size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Couldn't preview file</h4>
                            <p className="text-gray-600 mb-6">This file type cannot be previewed directly or may be restricted.</p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                            >
                                Open in New Tab
                            </a>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center overflow-auto" onClick={(e) => e.stopPropagation()}>
                            {isPdf ? (
                                <iframe
                                    src={`${url}#toolbar=0`}
                                    className="w-full h-full rounded-lg shadow-sm bg-white"
                                    onLoad={() => setLoading(false)}
                                    onError={() => {
                                        setLoading(false);
                                        setError(true);
                                    }}
                                />
                            ) : (
                                <img
                                    src={url}
                                    alt="Document"
                                    className="max-w-none transition-transform duration-200 ease-out shadow-lg"
                                    style={{
                                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                        maxHeight: zoom === 1 ? '100%' : 'none',
                                        maxWidth: zoom === 1 ? '100%' : 'none',
                                    }}
                                    onLoad={() => setLoading(false)}
                                    onError={() => {
                                        setLoading(false);
                                        setError(true);
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentViewerModal;
