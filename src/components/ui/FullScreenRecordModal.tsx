'use client';

import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';

interface FullScreenRecordModalProps {
    pdfUrl: string;
    onClose: () => void;
}

async function convertImageToPdfBlobUrl(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;

        img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;
            const isLandscape = imgWidth > imgHeight;

            // Match PDF orientation to image orientation
            const pdf = new jsPDF({
                orientation: isLandscape ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // A4 dimensions change based on orientation
            const pageWidth = isLandscape ? 297 : 210;
            const pageHeight = isLandscape ? 210 : 297;

            const imgRatio = imgWidth / imgHeight;
            const pageRatio = pageWidth / pageHeight;

            let renderWidth: number, renderHeight: number;

            if (imgRatio > pageRatio) {
                renderWidth = pageWidth;
                renderHeight = pageWidth / imgRatio;
            } else {
                renderHeight = pageHeight;
                renderWidth = pageHeight * imgRatio;
            }

            const x = (pageWidth - renderWidth) / 2;
            const y = (pageHeight - renderHeight) / 2;

            pdf.addImage(img, 'JPEG', x, y, renderWidth, renderHeight);
            resolve(pdf.output('bloburl').toString());
        };

        img.onerror = reject;
    });
}

export const FullScreenRecordModal: React.FC<FullScreenRecordModalProps> = ({ pdfUrl, onClose }) => {
    const [finalUrl, setFinalUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = originalOverflow; };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        let cancelled = false;

        const prepare = async () => {
            setLoading(true);
            try {
                const res = await fetch(pdfUrl);
                const blob = await res.blob();

                if (blob.type.startsWith('image/')) {
                    const blobUrl = await convertImageToPdfBlobUrl(pdfUrl);
                    if (!cancelled) {
                        // #toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH
                        // hides ALL chrome in Chrome/Edge/Firefox PDF viewers
                        setFinalUrl(`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`);
                    }
                } else {
                    if (!cancelled) {
                        setFinalUrl(`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`);
                    }
                }
            } catch (err) {
                console.error('Failed to prepare document:', err);
                if (!cancelled) setFinalUrl(pdfUrl);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        prepare();
        return () => { cancelled = true; };
    }, [pdfUrl]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm px-6 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[600px] h-[90vh] mx-auto rounded-xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {loading ? (
                    <div className="w-full h-full bg-white flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <iframe
                        src={finalUrl ?? ''}
                        className="w-full h-full border-0 bg-white"
                        title="Medical Record Preview"
                    // These attributes help suppress toolbar in some browsers
                    // but hash params above do the real work
                    />
                )}
            </div>
        </div>
    );
};