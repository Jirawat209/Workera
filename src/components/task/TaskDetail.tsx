import { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useUserStore } from '../../store/useUserStore';
import { X, Send, MessageSquare, FileText, Activity, Trash2 } from 'lucide-react';

import { RichTextEditor } from '../ui/RichTextEditor';

export const TaskDetail = ({ itemId, onClose }: { itemId: string; onClose: () => void }) => {
    const board = useBoardStore(state => state.boards.find(b => b.id === state.activeBoardId));
    const activeItem = board?.items.find(i => i.id === itemId);
    const addUpdate = useBoardStore(state => state.addUpdate);
    const deleteUpdate = useBoardStore(state => state.deleteUpdate);
    const updateItemTitle = useBoardStore(state => state.updateItemTitle);

    // Global Draft State (Persistence)
    const draftText = useBoardStore(state => state.drafts[itemId] || '');
    const setDraft = useBoardStore(state => state.setDraft);

    const { currentUser } = useUserStore();

    const [activeTab, setActiveTab] = useState<'updates' | 'files' | 'activity'>('updates');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // FIX: Keep component mounted when reloading data to preserve typed text
    if (!activeItem) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '32px', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                <div style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <p style={{ marginTop: '16px', fontSize: '14px' }}>Loading item...</p>
            </div>
        );
    }

    const handleSendUpdate = () => {
        // Strip HTML tags to check if empty
        const textOnly = draftText.replace(/<[^>]*>/g, '').trim();
        if (!textOnly && !draftText.includes('<img')) return;

        addUpdate(itemId, draftText, { name: currentUser.name, id: currentUser.id });
        setDraft(itemId, ''); // Clear global draft
    };

    const handleDeleteClick = (updateId: string) => {
        setDeleteConfirmId(updateId);
    };

    const confirmDelete = (updateId: string) => {
        deleteUpdate(itemId, updateId);
        setDeleteConfirmId(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* ... Header and Tabs ... */}
            <div style={{
                padding: '24px 32px',
                borderBottom: '1px solid hsl(var(--color-border))',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                backgroundColor: 'hsl(var(--color-bg-surface))'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '24px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>

                            <input
                                value={activeItem.title}
                                onChange={(e) => updateItemTitle(itemId, e.target.value)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: 'inherit',
                                    fontWeight: 'inherit',
                                    width: '100%',
                                    outline: 'none',
                                    color: 'inherit'
                                }}
                            />
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'hsl(var(--color-text-secondary))' }}>
                        <span>Pulse: {activeItem.title}</span>
                        <span>•</span>
                        <span>Group: {(board?.groups.find(g => g.id === activeItem.groupId)?.title)}</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '4px',
                        color: 'hsl(var(--color-text-tertiary))'
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Tabs */}
            <div style={{
                padding: '0 32px',
                borderBottom: '1px solid hsl(var(--color-border))',
                display: 'flex',
                gap: '24px'
            }}>
                {[
                    { id: 'updates', label: 'Updates', icon: MessageSquare },
                    { id: 'files', label: 'Files', icon: FileText },
                    { id: 'activity', label: 'Activity Log', icon: Activity }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '16px 0',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: `2px solid ${activeTab === tab.id ? 'hsl(var(--color-brand-primary))' : 'transparent'}`,
                            color: activeTab === tab.id ? 'hsl(var(--color-brand-primary))' : 'hsl(var(--color-text-secondary))',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        {tab.id === 'updates' && Array.isArray(activeItem.updates) && activeItem.updates.filter(u => typeof u === 'object' && u?.id).length > 0 && (
                            <span style={{
                                background: 'hsl(var(--color-brand-primary))',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontSize: '11px'
                            }}>{activeItem.updates.filter(u => typeof u === 'object' && u?.id).length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '32px', backgroundColor: '#f5f7fa' }}>
                {activeTab === 'updates' && (
                    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                        {/* Input Area (New WYSIWYG) */}
                        <div style={{ marginBottom: '32px' }}>
                            <RichTextEditor
                                value={draftText}
                                onChange={(val) => setDraft(itemId, val)}
                            />
                            <div style={{
                                marginTop: '12px',
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}>
                                <button
                                    onClick={handleSendUpdate}
                                    style={{
                                        backgroundColor: 'hsl(var(--color-brand-primary))',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 24px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: 500
                                    }}
                                >
                                    Update <Send size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Updates List */}
                        {(!activeItem.updates || !Array.isArray(activeItem.updates) || activeItem.updates.filter(u => typeof u === 'object' && u?.id).length === 0) ? (
                            <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <img src="https://cdn.monday.com/images/pulse-page-empty-state.svg" alt="No updates" style={{ width: '200px', opacity: 0.6 }} />
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 500 }}>No updates yet for this item</h3>
                                <p style={{ margin: 0, fontSize: '14px' }}>Be the first one to update about progress, mention someone or upload files.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {activeItem.updates.filter(u => typeof u === 'object' && u?.id).map(update => (
                                    <div key={update.id} style={{
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid hsl(var(--color-border))',
                                        padding: '20px',
                                        position: 'relative',
                                        borderLeft: deleteConfirmId === update.id ? '4px solid hsl(var(--color-dangerous))' : '1px solid hsl(var(--color-border))'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#00c875',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '14px',
                                                    fontWeight: 600
                                                }}>
                                                    {update.author.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{update.author}</div>
                                                    <div style={{ fontSize: '12px', color: '#888' }}>
                                                        {new Date(update.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Delete Action (Own comment or Admin/Owner) */}
                                            {(update.author === currentUser.name || currentUser.role === 'owner' || currentUser.role === 'admin') && (
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={() => handleDeleteClick(update.id)}
                                                        style={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            color: '#666', // Ensure visibility
                                                            cursor: 'pointer',
                                                            padding: '4px'
                                                        }}
                                                        title="Delete update"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>

                                                    {/* Confirmation Popover */}
                                                    {deleteConfirmId === update.id && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '100%',
                                                            right: 0,
                                                            marginTop: '8px',
                                                            backgroundColor: 'white',
                                                            border: '1px solid hsl(var(--color-border))',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                            padding: '12px',
                                                            zIndex: 10,
                                                            width: '200px'
                                                        }}>
                                                            <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>
                                                                Delete this update?
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    onClick={() => setDeleteConfirmId(null)}
                                                                    style={{
                                                                        padding: '4px 12px',
                                                                        border: '1px solid #d0d4e4',
                                                                        background: 'white',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '13px',
                                                                        color: '#323338'
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => confirmDelete(update.id)}
                                                                    style={{
                                                                        padding: '4px 12px',
                                                                        border: 'none',
                                                                        background: '#e2445c',
                                                                        color: 'white',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '13px'
                                                                    }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Render HTML Content */}
                                        <div
                                            className="update-content"
                                            style={{ fontSize: '14px', lineHeight: '1.5' }}
                                            dangerouslySetInnerHTML={{ __html: update.content }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <style>{`
                            .update-content ul, .update-content ol { margin-left: 20px; }
                            .update-content a { color: hsl(var(--color-brand-primary)); text-decoration: underline; }
                        `}</style>
                    </div>
                )}
                {activeTab === 'files' && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#888' }}>
                        Files coming soon
                    </div>
                )}
                {activeTab === 'activity' && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#888' }}>
                        Activity Log coming soon
                    </div>
                )}
            </div>
        </div>
    );
};

