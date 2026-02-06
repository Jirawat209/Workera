import { useEffect, useRef, useState } from 'react';
import {
    Bold, Italic, Underline, Strikethrough,
    List, ListOrdered, Link,
    Minus
} from 'lucide-react';
import { useBoardStore } from '../../store/useBoardStore';

interface RichTextEditorProps {
    value: string; // HTML string
    onChange: (html: string) => void;
}

export const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Mention State
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionPosition, setMentionPosition] = useState<{ top: number, left: number } | null>(null);
    const [mentionRange, setMentionRange] = useState<Range | null>(null);
    const { activeBoardMembers } = useBoardStore();

    // Hyperlink State
    const [isLinkUIOpen, setIsLinkUIOpen] = useState(false);
    const [linkData, setLinkData] = useState({ text: '', url: '' });
    const [savedSelection, setSavedSelection] = useState<Range | null>(null);

    // Helper to get display name (prefer email username)
    const getDisplayName = (member: any) => {
        if (member.profiles?.email) {
            return member.profiles.email.split('@')[0];
        }
        return member.profiles?.full_name || 'Unknown';
    };

    const filteredMembers = mentionQuery !== null
        ? activeBoardMembers.filter(m => {
            const name = getDisplayName(m);
            const match = name.toLowerCase().includes(mentionQuery.toLowerCase());
            return match;
        })
        : [];

    useEffect(() => {
        if (mentionQuery !== null) {
            console.log('[RichTextEditor] Mention Active:', mentionQuery);
            console.log('[RichTextEditor] All Members:', activeBoardMembers.map(m => ({
                user_id: m.user_id,
                display: getDisplayName(m),
                email: m.profiles?.email,
                full_name: m.profiles?.full_name
            })));
            console.log('[RichTextEditor] Filtered:', filteredMembers.map(m => getDisplayName(m)));
        }
    }, [mentionQuery, activeBoardMembers, filteredMembers.length]);

    const isInternalUpdate = useRef(false);

    // Sync external value to editor ONLY if different and not focused
    useEffect(() => {
        // Skip sync if Link UI is open
        if (isLinkUIOpen) return;

        // Skip sync if we just performed an internal update (to avoid race with stale props)
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        if (editorRef.current && !isFocused && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
        // Handle empty initial case
        if (editorRef.current && !value && !isFocused) {
            editorRef.current.innerHTML = '';
        }
    }, [value, isFocused, isLinkUIOpen]);

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleChange();
    };

    const handleChange = () => {
        if (editorRef.current) {
            // Mark as internal update so useEffect doesn't revert it immediately
            // But wait... usually handleChange is called AFTER DOM change.
            // The issue is when we execute a command that changes DOM, then close UI (triggering effect),
            // then parent updates prop later.
            // Actually, for insertLink:
            // 1. exec writes DOM.
            // 2. call handleChange -> calls onChange(newHTML).
            // 3. Parent schedules update.
            // 4. closeLinkUI -> triggers effect [value=old].
            // We want to block that specific effect run.

            // For standard typing (onInput), isFocused is true, so effect is skipped anyway.
            // The problem is insertLink closes UI and might not be "focused" in React state yet.

            onChange(editorRef.current.innerHTML);
            checkMention();
        }
    };

    const checkMention = () => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const text = range.startContainer.textContent || '';
        const cursorOffset = range.startOffset;

        // Find last @ before cursor
        const lastAt = text.lastIndexOf('@', cursorOffset - 1);

        if (lastAt !== -1) {
            // Check if there are spaces between @ and cursor (allow spaces in names, but maybe limit to a reasonable amount to avoid false positives on "email @ domain")
            // For simplicity: text between @ and cursor
            const query = text.substring(lastAt + 1, cursorOffset);

            // Simple validation: Ensure @ is preceded by space or is start of line
            const charBefore = lastAt > 0 ? text[lastAt - 1] : ' ';
            if (charBefore === ' ' || charBefore === '\n' || charBefore === '\u00A0') { // 00A0 is nbsp
                setMentionQuery(query);
                setMentionRange(range.cloneRange()); // Save the range!

                // Get coordinates
                const rect = range.getBoundingClientRect();
                setMentionPosition({
                    top: rect.bottom, // Relative to viewport, we might need adjustments if parent is scrolled
                    left: rect.left
                });
                return;
            }
        }

        setMentionQuery(null);
        setMentionPosition(null);
        setMentionRange(null);
    };

    const insertMention = (name: string, userId: string) => {
        if (!mentionRange) return; // Use the saved range

        const range = mentionRange;
        const node = range.startContainer;
        const text = node.textContent || '';
        const cursorOffset = range.startOffset;

        // We need to find the @ relative to the SAVED range
        // Since we cloned the range when the cursor was AT the end of the query,
        // range.startOffset should be the end of "@query"

        const lastAt = text.lastIndexOf('@', cursorOffset - 1);

        if (lastAt !== -1) {
            // Remove the @query
            range.setStart(node, lastAt);
            range.setEnd(node, cursorOffset);
            range.deleteContents();

            // Insert the name chip
            const span = document.createElement('span');
            span.textContent = `@${name}`;
            span.setAttribute('data-id', userId); // CRITICAL: Add data-id for parsing
            span.style.color = '#1d4ed8'; // darker blue
            span.style.backgroundColor = '#dbeafe'; // light blue bg
            span.style.padding = '2px 6px';
            span.style.borderRadius = '12px';
            span.style.fontWeight = '500';
            span.style.display = 'inline-block';
            span.contentEditable = 'false';

            range.insertNode(span);

            // Add space after
            const space = document.createTextNode('\u00A0');
            range.setStartAfter(span);
            range.insertNode(space);

            // Move cursor to end
            range.setStartAfter(space);
            range.collapse(true);

            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }

            setMentionQuery(null);
            setMentionPosition(null);
            setMentionRange(null);
            handleChange();
        }
    };

    // --- Hyperlink Handlers ---

    const openLinkUI = () => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) {
            // If no selection, just open empty
            setLinkData({ text: '', url: '' });
            setIsLinkUIOpen(true);
            return;
        }

        const range = selection.getRangeAt(0);
        setSavedSelection(range.cloneRange()); // Save range

        const selectedText = range.toString();
        // If it looks like a URL, pre-fill URL, otherwise Text
        const isUrl = /^(http|https):\/\//.test(selectedText);
        setLinkData({
            text: isUrl ? '' : selectedText,
            url: isUrl ? selectedText : ''
        });

        setIsLinkUIOpen(true);
    };

    const insertLink = () => {
        const selection = window.getSelection();
        if (savedSelection && selection) {
            selection.removeAllRanges();
            selection.addRange(savedSelection);
        }

        const { text, url } = linkData;
        if (!url) {
            closeLinkUI();
            return;
        }

        const finalUrl = url.startsWith('http') ? url : `https://${url}`;
        const displayText = text || url;

        // Flag internal update to skip next sync
        isInternalUpdate.current = true;

        const html = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer" style="color: #0073ea; text-decoration: underline;">${displayText}</a>`;

        exec('insertHTML', html);

        closeLinkUI();
    };

    const closeLinkUI = () => {
        setIsLinkUIOpen(false);
        setSavedSelection(null);
        setLinkData({ text: '', url: '' });
        // Return focus to editor
        editorRef.current?.focus();
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
            id: 'link', icon: Link, label: 'Link', action: () => openLinkUI()
        },
        { id: 'hr', icon: Minus, label: 'Horizontal Rule', action: () => exec('insertHorizontalRule') }
    ];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid hsl(var(--color-border))',
            borderRadius: '8px',
            overflow: 'visible', // Changed to visible for popup
            backgroundColor: 'white',
            boxShadow: isFocused ? '0 0 0 2px hsl(var(--color-brand-light))' : 'none',
            transition: 'box-shadow 0.2s',
            position: 'relative'
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
                onKeyUp={(e) => {
                    // Navigate mention list TODO
                    if (e.key === 'Escape') {
                        setMentionQuery(null);
                        closeLinkUI();
                    }
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setIsFocused(false);
                    // Delay to allow click
                    setTimeout(() => setMentionQuery(null), 200);
                }}
                style={{
                    minHeight: '120px',
                    padding: '16px',
                    fontSize: '14px',
                    outline: 'none',
                    lineHeight: '1.5'
                }}
                className="rich-text-content"
            />

            {/* Mention Suggestions Popup */}
            {
                mentionQuery !== null && filteredMembers.length > 0 && (
                    <div style={{
                        position: 'fixed', // Use fixed to handle viewport relative from getBoundingClientRect
                        top: mentionPosition?.top,
                        left: mentionPosition?.left,
                        backgroundColor: 'white',
                        border: '1px solid hsl(var(--color-border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 9999,
                        minWidth: '200px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        {filteredMembers.map((member, i) => (
                            <div
                                key={member.user_id || i}
                                onClick={() => insertMention(getDisplayName(member), member.user_id)}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',

                                    gap: '8px',
                                    borderBottom: i < filteredMembers.length - 1 ? '1px solid #f0f0f0' : 'none',
                                    backgroundColor: 'white' // default
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f7fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    backgroundColor: '#e0e7ff', overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', color: '#3730a3', fontWeight: 'bold'
                                }}>
                                    {member.profiles?.avatar_url ? (
                                        <img src={member.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        (member.profiles?.full_name?.[0] || member.profiles?.email?.[0] || '?').toUpperCase()
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '13px', color: '#333', fontWeight: 500 }}>
                                        {getDisplayName(member)}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                        {member.profiles?.email || ''}
                                        {member.role === 'owner' && <span style={{ marginLeft: '4px', color: '#f59e0b', fontWeight: 'bold' }}>(Owner)</span>}
                                        {member.role === 'workspace_owner' && <span style={{ marginLeft: '4px', color: '#854d0e', fontWeight: 'bold', fontSize: '10px' }}>(Workspace Owner)</span>}
                                    </span>
                                </div>
                            </div>
                        ))}

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
                )
            }

            {/* Hyperlink Popover */}
            {
                isLinkUIOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '40px', // Below toolbar
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'white',
                        border: '1px solid hsl(var(--color-border))',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        zIndex: 10000,
                        padding: '16px',
                        width: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#323338', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Add Link</span>
                            <button onClick={closeLinkUI} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', color: '#676879', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Text to display</label>
                            <input
                                type="text"
                                value={linkData.text}
                                onChange={(e) => setLinkData({ ...linkData, text: e.target.value })}
                                placeholder="Text to display"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #c3c6d4',
                                    fontSize: '14px',
                                    outline: 'none',
                                    color: '#333'
                                }}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', color: '#676879', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Link address</label>
                            <input
                                type="text"
                                value={linkData.url}
                                onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                                placeholder="www.example.com"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #c3c6d4',
                                    fontSize: '14px',
                                    outline: 'none',
                                    color: '#333'
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && insertLink()}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                            <button
                                onClick={closeLinkUI}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #e1e3ea',
                                    background: 'white',
                                    color: '#323338',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={insertLink}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    backgroundColor: '#0073ea',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Save Link
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
