import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { FileLink } from '../../types';

interface FilesPickerProps {
    files: FileLink[];
    position: { top: number, left: number, width: number, bottom: number };
    onSave: (newFiles: FileLink[]) => void;
    onClose: () => void;
}

export const FilesPicker = ({ files = [], position, onSave, onClose }: FilesPickerProps) => {
    const [localFiles, setLocalFiles] = useState<FileLink[]>(files || []);
    const [inputValue, setInputValue] = useState('');
    const [inputName, setInputName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus input on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }

        // Click outside handler
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onSave(localFiles);
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [localFiles, onSave, onClose]);

    const handleAddFile = () => {
        if (!inputValue.trim()) return;

        let url = inputValue.trim();
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }

        // Validate Google Drive Link
        const isGoogleDrive = url.includes('drive.google.com') || url.includes('docs.google.com');

        if (!isGoogleDrive) {
            setError('Only Google Drive links are allowed.');
            return;
        }

        setError(null);

        // Simple extraction of name from URL if name is empty
        let name = inputName.trim();
        if (!name) {
            try {
                // Try to guess from URL
                const urlObj = new URL(url);
                if (url.includes('drive.google.com')) {
                    name = 'Google Drive File';
                } else if (url.includes('docs.google.com')) {
                    name = 'Google Doc';
                } else {
                    name = urlObj.hostname;
                }
            } catch (e) {
                name = 'Google Drive Link';
            }
        }

        const newFile: FileLink = {
            id: uuidv4(),
            name: name,
            url: url,
            type: 'google-drive'
        };

        setLocalFiles([...localFiles, newFile]);
        setInputValue('');
        setInputName('');
        // Keep focus
        inputRef.current?.focus();
    };

    const handleRemoveFile = (id: string) => {
        setLocalFiles(localFiles.filter(f => f.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddFile();
        }
    };

    // Calculate position (similar to other pickers)
    const style: React.CSSProperties = {
        position: 'fixed',
        top: position.bottom + 4,
        left: position.left,
        minWidth: '300px',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #e1e4e8',
        zIndex: 1000,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    };

    // Auto-adjust if off screen (vertical)
    if (style.top && (style.top as number) + 300 > window.innerHeight) {
        // Show above if not enough space below
        style.top = undefined;
        style.bottom = window.innerHeight - position.top + 4;
    }

    // Auto-adjust if off screen (horizontal)
    const pickerWidth = 320; // Approx width
    if ((style.left as number) + pickerWidth > window.innerWidth) {
        style.left = undefined;
        style.right = 8; // align to right edge with padding
        // OR align to the right of the cell: 
        // style.left = position.left + position.width - pickerWidth;

        // Let's try to flip it to the left of the click if possible, or just clamp to window
        const newLeft = window.innerWidth - pickerWidth - 16;
        style.left = Math.max(16, newLeft);
    }

    return createPortal(
        <div ref={pickerRef} style={style}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#333' }}>
                Attached Files (Google Drive)
            </div>

            {/* List of Files */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {localFiles.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', padding: '8px 0' }}>
                        No files attached yet.
                    </div>
                )}
                {localFiles.map(file => (
                    <div key={file.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        backgroundColor: '#f5f7fa',
                        borderRadius: '4px',
                        fontSize: '12px'
                    }}>
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#0073ea',
                                textDecoration: 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '240px'
                            }}
                        >
                            <FileText size={14} />
                            <span title={file.name}>{file.name}</span>
                        </a>
                        <button
                            onClick={() => handleRemoveFile(file.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                color: '#666',
                                display: 'flex'
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ height: '1px', backgroundColor: '#e1e4e8', margin: '4px 0' }} />

            {/* Add New File */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {error && (
                    <div style={{ color: '#e11d48', fontSize: '11px', fontWeight: 500, padding: '0 2px' }}>
                        {error}
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Paste Google Drive Link..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d0d4e4',
                        fontSize: '12px',
                        width: '100%'
                    }}
                />
                <input
                    type="text"
                    placeholder="File Name (Optional)"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d0d4e4',
                        fontSize: '12px',
                        width: '100%'
                    }}
                />
                <button
                    onClick={handleAddFile}
                    disabled={!inputValue.trim()}
                    style={{
                        backgroundColor: inputValue.trim() ? '#0073ea' : '#cce5ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: inputValue.trim() ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    <Plus size={14} /> Add Link
                </button>
            </div>
        </div>,
        document.body
    );
};
