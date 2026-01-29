import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
}

export const SidePanel = ({ isOpen, onClose, children, width = '800px' }: SidePanelProps) => {

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="side-panel-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100, // High z-index
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)', // Dim background
            backdropFilter: 'blur(2px)',
            transition: 'opacity 0.2s ease-in-out'
        }} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="side-panel-content" style={{
                width: width,
                height: '100%',
                backgroundColor: 'hsl(var(--color-bg-surface))',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                maxWidth: '90vw'
            }}>
                {children}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>,
        document.body
    );
};
