
import { useEffect, useRef, useState } from 'react';
import {
    Bold, Italic, Underline, Strikethrough,
    List, ListOrdered, Link,
    Minus
} from 'lucide-react';

interface RichTextEditorProps {
    value: string; // HTML string
    onChange: (html: string) => void;
}

export const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Sync external value to editor ONLY if different and not focused (to prevent cursor jumping)
    useEffect(() => {
        if (editorRef.current && !isFocused && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
        // Handle empty initial case
        if (editorRef.current && !value && !isFocused) {
            editorRef.current.innerHTML = '';
        }
    }, [value, isFocused]);

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleChange();
    };

    const handleChange = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const tools = [
        { id: 'bold', icon: Bold, label: 'Bold', action: () => exec('bold') },
        { id: 'italic', icon: Italic, label: 'Italic', action: () => exec('italic') },
        { id: 'underline', icon: Underline, label: 'Underline', action: () => exec('underline') },
        { id: 'strike', icon: Strikethrough, label: 'Strikethrough', action: () => exec('strikeThrough') },
        { type: 'separator' },
        { id: 'ul', icon: List, label: 'Bullet List', action: () => exec('insertUnorderedList') },
        { id: 'ol', icon: ListOrdered, label: 'Ordered List', action: () => exec('insertOrderedList') },
        { type: 'separator' },
        {
            id: 'link', icon: Link, label: 'Link', action: () => {
                const url = prompt('Enter URL:');
                if (url) exec('createLink', url);
            }
        },
        { id: 'hr', icon: Minus, label: 'Horizontal Rule', action: () => exec('insertHorizontalRule') }
    ];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid hsl(var(--color-border))',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'white',
            boxShadow: isFocused ? '0 0 0 2px hsl(var(--color-brand-light))' : 'none',
            transition: 'box-shadow 0.2s'
        }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                borderBottom: '1px solid hsl(var(--color-border))',
                backgroundColor: '#f9f9f9',
                flexWrap: 'wrap'
            }}>
                {tools.map((tool, index) => {
                    if (tool.type === 'separator') {
                        return (
                            <div key={index} style={{
                                width: '1px',
                                height: '20px',
                                backgroundColor: 'hsl(var(--color-border))',
                                margin: '0 8px'
                            }} />
                        );
                    }

                    const Icon = tool.icon as any;
                    return (
                        <button
                            key={tool.id}
                            onClick={(e) => {
                                e.preventDefault(); // Prevent losing focus
                                tool.action?.();
                            }}
                            title={tool.label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                border: 'none',
                                background: 'transparent',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: 'hsl(var(--color-text-secondary))',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Icon size={16} strokeWidth={2.5} />
                        </button>
                    );
                })}
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    minHeight: '120px',
                    padding: '16px',
                    fontSize: '14px',
                    outline: 'none',
                    lineHeight: '1.5'
                }}
                className="rich-text-content"
            />

            {/* Placeholder shim */}
            {!value && (
                <div style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    padding: '16px 16px 57px 16px', // match editor padding + toolbar height approx
                    color: '#aaa',
                    fontSize: '14px',
                    display: value ? 'none' : 'block' // Simple toggle
                }}>
                    {/* Actually positioning is tricky without relative parent, let's skip visual placeholder for MVP or fix CSS */}
                </div>
            )}

            <style>{`
                .rich-text-content ul, .rich-text-content ol {
                    margin-left: 20px;
                }
                .rich-text-content a {
                    color: hsl(var(--color-brand-primary));
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
};
