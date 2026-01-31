
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBoardStore } from '../../store/useBoardStore';
import { usePermission } from '../../hooks/usePermission';
import { Share2 } from 'lucide-react';
import { ShareBoardModal } from '../workspace/ShareBoardModal';

interface BoardHeaderProps {
    boardId: string;
}

export const BoardHeader = ({ boardId }: BoardHeaderProps) => {
    const { can } = usePermission();

    const board = useBoardStore(state => state.boards.find(b => b.id === boardId));
    const updateBoardTitle = useBoardStore(state => state.updateBoardTitle);
    // Share modal state
    const [showShareModal, setShowShareModal] = useState(false);

    // Local state for renaming
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (board) setTitle(board.title);
    }, [board?.title]);

    // Close dropdown when clicking outside


    if (!board) return null;

    const handleRename = () => {
        if (title.trim()) {
            updateBoardTitle(boardId, title);
        } else {
            // Revert if empty
            setTitle(board.title);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRename();
        if (e.key === 'Escape') {
            setTitle(board.title);
            setIsEditing(false);
        }
    };





    return (
        <header style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            backgroundColor: 'hsl(var(--color-bg-surface))',
            borderBottom: '1px solid hsl(var(--color-border))'
        }}>
            <div>
                {isEditing ? (
                    <input
                        autoFocus
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={handleKeyDown}
                        style={{
                            fontSize: '20px',
                            fontWeight: 600,
                            letterSpacing: '-0.02em',
                            border: '1px solid hsl(var(--color-brand-primary))',
                            borderRadius: '4px',
                            padding: '0 4px',
                            margin: '-1px -5px', // Adjust for border/padding to align text
                            outline: 'none',
                            background: 'white',
                            color: 'hsl(var(--color-text-primary))',
                            width: `${Math.max(title.length * 12, 100)}px`,
                            maxWidth: '400px'
                        }}
                    />
                ) : (
                    <h1
                        onClick={() => {
                            if (can('create_board')) setIsEditing(true); // Using create_board as proxy for "Manage Board" owner/admin
                        }}
                        style={{
                            fontSize: '20px',
                            fontWeight: 600,
                            letterSpacing: '-0.02em',
                            cursor: can('create_board') ? 'pointer' : 'default',
                            border: '1px solid transparent', // To match input height/layout prevent jump
                            padding: '0 4px',
                            margin: '-1px -5px'
                        }}
                        title={can('create_board') ? "Click to rename" : "Read only"}
                    >
                        {board.title}
                    </h1>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <p style={{ fontSize: '13px', color: 'hsl(var(--color-text-tertiary))' }}>Main Table</p>
                    <span style={{ fontSize: '10px', color: 'hsl(var(--color-border))' }}>●</span>
                    <p style={{ fontSize: '13px', color: 'hsl(var(--color-text-tertiary))' }}>{board.items.length} items</p>
                </div>
            </div>

            {/* Right Side: Share + Notifications + Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Share Button (Keep Only) */}
                {can('create_board') && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowShareModal(true)}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid hsl(var(--color-border))',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'hsl(var(--color-text-primary))',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--color-bg-hover))'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Share board"
                    >
                        <Share2 size={16} />
                        <span>Share</span>
                    </motion.button>
                )}
            </div>

            {/* Share Board Modal */}
            {showShareModal && (
                <ShareBoardModal
                    boardId={boardId}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </header>
    );
};
