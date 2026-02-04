import { LayoutDashboard, Plus, Trash2, Search, LayoutGrid, MoreHorizontal, Edit2, Copy, GripVertical, ChevronRight, Users } from 'lucide-react';
import { useBoardStore } from '../../store/useBoardStore';
import { useUserStore } from '../../store/useUserStore';

import { usePermission } from '../../hooks/usePermission';
// import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import '../../styles/sidebar_tree.css';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ShareWorkspaceModal } from '../workspace/ShareWorkspaceModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BoardIcon = ({ size = 16, className = "", style = {} }: { size?: number, className?: string, style?: React.CSSProperties }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <rect x="3" y="3" width="18" height="18" rx="1.5" />
        <path d="M3 11h18" />
        <path d="M9 3v8" />
        <path d="M15 11v10" />
    </svg>
);

const WorkspaceIcon = ({ title, isActive }: { title: string, isActive: boolean }) => {
    const initial = title.trim().charAt(0).toUpperCase() || '?';
    return (
        <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: isActive ? '#0073ea' : '#e6e9ef',
            color: isActive ? 'white' : '#676879',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            flexShrink: 0,
            transition: 'all 0.2s',
            position: 'relative',
            zIndex: 2
        }}>
            {initial}
        </div>
    );
};

// Sortable Item Component
const SortableBoardItem = ({
    board,
    activeBoardId,
    setActiveBoard,
    editingBoardId,
    setEditingBoardId,
    editTitle,
    setEditTitle,
    handleRename,
    handleContextMenu,
    can,
    isLastChild
}: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: board.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as 'relative',
        zIndex: isDragging ? 999 : 'auto'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx('tree-node-leaf', { 'last-child': isLastChild })}
        >
            <div
                className={clsx('tree-sidebar-item', { active: activeBoardId === board.id })}
                onClick={() => setActiveBoard(board.id)}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (can('create_board')) {
                        setEditingBoardId(board.id);
                        setEditTitle(board.title);
                    }
                }}
            >
                <div
                    {...attributes}
                    {...listeners}
                    style={{ marginRight: '4px', cursor: 'grab', color: '#ccc', display: 'flex', alignItems: 'center', outline: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical size={12} />
                </div>

                <BoardIcon size={16} className="item-icon" />
                {
                    editingBoardId === board.id ? (
                        <input
                            autoFocus
                            type="text"
                            className="sidebar-item-input"
                            style={{ margin: 0, padding: '2px 4px' }}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleRename(board.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(board.id);
                                if (e.key === 'Escape') setEditingBoardId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="item-label">{board.title}</span>
                    )
                }

                <div className="sidebar-item-action" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal
                        size={14}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            handleContextMenu(e, board.id, rect);
                        }}
                    />
                </div>
            </div >
        </div >
    );
};

export const Sidebar = () => {
    const {
        boards, activeBoardId, addBoard, setActiveBoard, deleteBoard, updateBoardTitle, moveBoard, duplicateBoardToWorkspace, moveBoardToWorkspace,
        workspaces, activeWorkspaceId, setActiveWorkspace, addWorkspace, deleteWorkspace, updateWorkspace, sharedBoardIds, sharedWorkspaceIds, navigateTo
    } = useBoardStore();

    const [creatingBoardInWorkspaceId, setCreatingBoardInWorkspaceId] = useState<string | null>(null);
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [newWorkspaceTitle, setNewWorkspaceTitle] = useState('');

    // Deletion State
    const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);

    // Renaming State
    const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    // Workspace Renaming
    const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
    const [editWorkspaceTitle, setEditWorkspaceTitle] = useState('');

    // Context Menus
    const [activeBoardMenu, setActiveBoardMenu] = useState<string | null>(null);
    const [activeWorkspaceMenu, setActiveWorkspaceMenu] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [activeSubmenu, setActiveSubmenu] = useState<'move' | 'duplicate' | null>(null);

    // Tab state: 'my-workspaces' | 'shared'
    const [activeTab, setActiveTab] = useState<'my-workspaces' | 'shared'>('my-workspaces');

    // Share workspace modal
    const [shareWorkspaceId, setShareWorkspaceId] = useState<string | null>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const searchActive = searchQuery.trim().length > 0;

    // Tree expansion state
    const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set([workspaces[0]?.id].filter(Boolean)));

    const toggleWorkspace = (wsId: string) => {
        const next = new Set(expandedWorkspaces);
        if (next.has(wsId)) next.delete(wsId);
        else next.add(wsId);
        setExpandedWorkspaces(next);
    };

    // Auto-expand on search
    useEffect(() => {
        if (searchActive) {
            const matches = filteredWorkspaces.map(ws => ws.id);
            setExpandedWorkspaces(prev => {
                const next = new Set(prev);
                matches.forEach(id => next.add(id));
                return next;
            });
        }
    }, [searchQuery, searchActive]);


    // Permission Debug
    const { currentUser } = useUserStore();
    const { can } = usePermission();
    // const { user } = useAuth(); // useAuth provides Supabase user, not our App user with system_role

    // Use currentUser from store which has system_role
    const user = currentUser;

    // Filter workspaces based on active tab and search query
    const filteredWorkspaces = (activeTab === 'my-workspaces'
        ? workspaces.filter(w => w.owner_id === user?.id)
        : workspaces.filter(w => {
            if (w.owner_id === user?.id) return false;
            const isWorkspaceShared = sharedWorkspaceIds.includes(w.id);
            const containsSharedBoard = boards.some(b => b.workspaceId === w.id && sharedBoardIds.includes(b.id));
            return isWorkspaceShared || containsSharedBoard;
        })
    ).filter(w => {
        if (!searchQuery.trim()) return true;
        const wsMatch = w.title.toLowerCase().includes(searchQuery.toLowerCase());
        const boardMatch = boards.some(b => b.workspaceId === w.id && b.title.toLowerCase().includes(searchQuery.toLowerCase()));
        return wsMatch || boardMatch;
    });

    const allAccessibleWorkspaces = workspaces.filter((w, index, self) => {
        const isAccessible = w.owner_id === user?.id ||
            sharedWorkspaceIds.includes(w.id) ||
            boards.some(b => b.workspaceId === w.id && sharedBoardIds.includes(b.id));

        return isAccessible && self.findIndex(i => i.id === w.id) === index;
    });

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveBoardMenu(null);
            setActiveWorkspaceMenu(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);



    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newWorkspaceTitle.trim() && !isSubmitting) {
            setIsSubmitting(true);
            try {
                await addWorkspace(newWorkspaceTitle);
                setNewWorkspaceTitle('');
                setIsCreatingWorkspace(false);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleRename = (boardId: string) => {
        if (editTitle.trim()) {
            updateBoardTitle(boardId, editTitle);
        }
        setEditingBoardId(null);
    };

    const handleRenameWorkspace = (wsId: string) => {
        if (editWorkspaceTitle.trim()) {
            updateWorkspace(wsId, editWorkspaceTitle);
        }
        setEditingWorkspaceId(null);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Prevent accidental drags
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over) {
            moveBoard(active.id as string, over.id as string);
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header" style={{ padding: '0 16px', marginBottom: '12px', width: '100%', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div
                    onClick={() => navigateTo('home')}
                    style={{
                        marginBottom: '16px',
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #0073ea 0%, #00c875 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                        <LayoutGrid size={20} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#323338', letterSpacing: '-0.5px' }}>Workera</span>
                </div>



                {/* Admin Link (Only for System Admins) */}
                {(user?.system_role === 'super_admin' || user?.system_role === 'it_admin') && (
                    <div style={{ padding: '0 4px', marginBottom: '8px' }}>
                        <button
                            onClick={() => navigateTo('admin')}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #6366f1',
                                borderRadius: '4px',
                                backgroundColor: '#e0e7ff',
                                color: '#4338ca',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 2px rgba(99, 102, 241, 0.1)'
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            <span>Admin Console</span>
                        </button>
                    </div>
                )}

                {/* Tab Switcher - Simple Buttons */}
                <div style={{
                    display: 'flex',
                    padding: '0 4px',
                    marginBottom: '16px',
                    width: '100%',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <button
                        onClick={() => setActiveTab('my-workspaces')}
                        style={{
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            color: activeTab === 'my-workspaces' ? '#0073ea' : '#676879',
                            fontSize: '13px',
                            fontWeight: activeTab === 'my-workspaces' ? 600 : 400,
                            cursor: 'pointer',
                            borderBottom: activeTab === 'my-workspaces' ? '2px solid #0073ea' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        My Workspaces
                    </button>
                    <button
                        onClick={() => setActiveTab('shared')}
                        style={{
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            color: activeTab === 'shared' ? '#0073ea' : '#676879',
                            fontSize: '13px',
                            fontWeight: activeTab === 'shared' ? 600 : 400,
                            cursor: 'pointer',
                            borderBottom: activeTab === 'shared' ? '2px solid #0073ea' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Users size={14} />
                        <span>Shared</span>
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', position: 'relative', width: '100%', marginBottom: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#676879' }} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 8px 8px 30px',
                                borderRadius: '6px',
                                border: '1px solid #e6e9ef',
                                backgroundColor: '#f5f6f8',
                                fontSize: '13px',
                                outline: 'none',
                                color: '#323338'
                            }}
                        />
                    </div>
                </div>

                {/* Add Workspace Button Row */}
                <div style={{ marginBottom: '12px' }}>
                    <button
                        onClick={() => setIsCreatingWorkspace(true)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            color: '#676879',
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f6f8'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Plus size={16} />
                        <span>Add New Workspace</span>
                    </button>
                </div>


                {/* Workspace Creation Modal */}
                {isCreatingWorkspace && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2000
                    }} onClick={() => setIsCreatingWorkspace(false)}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '8px',
                            width: '320px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Create Workspace</h3>
                            <form onSubmit={handleCreateWorkspace}>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Workspace Name (e.g. Marketing)"
                                    value={newWorkspaceTitle}
                                    onChange={(e) => setNewWorkspaceTitle(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginBottom: '16px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc'
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingWorkspace(false)}
                                        style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        style={{
                                            padding: '6px 12px',
                                            background: isSubmitting ? '#ccc' : '#0073ea',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <div className="sidebar-content" style={{ padding: '0' }}>
                <div className="tree-container">
                    {filteredWorkspaces.map(ws => {
                        const isExpanded = expandedWorkspaces.has(ws.id);
                        const isActive = activeWorkspaceId === ws.id;

                        // Refined board filtering: 
                        // If I own the workspace, show all boards.
                        // If I don't own it, show all boards if workspace is shared OR only show shared boards.
                        const wsBoards = boards.filter(b => {
                            if (b.workspaceId !== ws.id) return false;

                            // Permission check
                            const isAccessible = ws.owner_id === user?.id || sharedWorkspaceIds.includes(ws.id) || sharedBoardIds.includes(b.id);
                            if (!isAccessible) return false;

                            // Search check
                            if (searchQuery.trim()) {
                                const workspaceMatches = ws.title.toLowerCase().includes(searchQuery.toLowerCase());
                                if (workspaceMatches) return true; // Show all boards if workspace matches

                                return b.title.toLowerCase().includes(searchQuery.toLowerCase());
                            }
                            return true;
                        });

                        return (
                            <div key={ws.id} className="tree-node">
                                {/* Workspace Header */}
                                <div
                                    className={clsx('tree-node-parent', { expanded: isExpanded, active: isActive })}
                                    style={{
                                        backgroundColor: isActive ? '#f0f3ff' : 'transparent',
                                        color: isActive ? '#0073ea' : '#323338',
                                    }}
                                    onClick={() => {
                                        toggleWorkspace(ws.id);
                                        setActiveWorkspace(ws.id);
                                    }}
                                >
                                    <WorkspaceIcon title={ws.title} isActive={isExpanded} />
                                    {editingWorkspaceId === ws.id ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            className="sidebar-item-input"
                                            style={{ margin: 0, padding: '2px 4px', flex: 1 }}
                                            value={editWorkspaceTitle}
                                            onChange={(e) => setEditWorkspaceTitle(e.target.value)}
                                            onBlur={() => handleRenameWorkspace(ws.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameWorkspace(ws.id);
                                                if (e.key === 'Escape') setEditingWorkspaceId(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {ws.title}
                                        </span>
                                    )}

                                    {/* Workspace Actions */}
                                    <div className="sidebar-item-action" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal
                                            size={14}
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setMenuPosition({ top: rect.bottom, left: rect.left });
                                                setActiveWorkspaceMenu(activeWorkspaceMenu === ws.id ? null : ws.id);
                                                setActiveBoardMenu(null);
                                            }}
                                        />
                                    </div>

                                    <ChevronRight
                                        size={16}
                                        className="chevron"
                                    />
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="tree-node-children">
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={wsBoards.map(b => b.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {wsBoards.map((board, index) => (
                                                    <SortableBoardItem
                                                        key={board.id}
                                                        board={board}
                                                        activeBoardId={activeBoardId}
                                                        setActiveBoard={setActiveBoard}
                                                        editingBoardId={editingBoardId}
                                                        setEditingBoardId={setEditingBoardId}
                                                        editTitle={editTitle}
                                                        setEditTitle={setEditTitle}
                                                        handleRename={handleRename}
                                                        handleContextMenu={(e: any, id: string, rect: DOMRect) => {
                                                            e.stopPropagation();
                                                            setMenuPosition({ top: rect.bottom, left: rect.left });
                                                            setActiveBoardMenu(activeBoardMenu === id ? null : id);
                                                            setActiveWorkspaceMenu(null);
                                                        }}
                                                        can={can}
                                                        isLastChild={index === wsBoards.length - 1}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </DndContext>

                                        {/* Add Board Button Inside Tree */}
                                        {!searchActive && (
                                            <div className="tree-node-leaf last-child">
                                                {creatingBoardInWorkspaceId === ws.id ? (
                                                    <div className="tree-sidebar-item" style={{ paddingLeft: '4px', cursor: 'default' }}>
                                                        <BoardIcon size={16} style={{ color: '#0073ea' }} />
                                                        <form
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                if (newBoardTitle.trim()) {
                                                                    addBoard(newBoardTitle);
                                                                    setNewBoardTitle('');
                                                                    setCreatingBoardInWorkspaceId(null);
                                                                }
                                                            }}
                                                            style={{ flex: 1, display: 'flex' }}
                                                        >
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                placeholder="New Board"
                                                                className="sidebar-item-input"
                                                                style={{ margin: 0, padding: '2px 4px', width: '100%' }}
                                                                value={newBoardTitle}
                                                                onChange={(e) => setNewBoardTitle(e.target.value)}
                                                                onBlur={() => {
                                                                    if (newBoardTitle.trim()) {
                                                                        addBoard(newBoardTitle);
                                                                        setNewBoardTitle('');
                                                                    }
                                                                    setCreatingBoardInWorkspaceId(null);
                                                                }}
                                                            />
                                                        </form>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="tree-sidebar-item"
                                                        style={{ color: '#0073ea', opacity: 0.8 }}
                                                        onClick={() => {
                                                            setActiveWorkspace(ws.id);
                                                            setCreatingBoardInWorkspaceId(ws.id);
                                                        }}
                                                    >
                                                        <Plus size={14} />
                                                        <span>Add board</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredWorkspaces.length === 0 && (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#676879', fontSize: '13px' }}>
                            No workspaces found
                        </div>
                    )}
                </div>



                {/* Draw Board Context Menu Outside of SortableItem to avoid transform issues */}
                {activeBoardMenu && (
                    <div className="context-menu" style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        borderRadius: '4px',
                        padding: '4px',
                        zIndex: 9999,
                        width: '200px'
                    }} onClick={(e) => e.stopPropagation()}
                        onMouseLeave={() => setActiveSubmenu(null)}
                    >
                        <div className="menu-item" onClick={() => {
                            const b = boards.find(b => b.id === activeBoardMenu);
                            if (b) {
                                setEditingBoardId(b.id);
                                setEditTitle(b.title);
                            }
                            setActiveBoardMenu(null);
                        }} onMouseEnter={() => setActiveSubmenu(null)}>
                            <Edit2 size={14} /> Rename
                        </div>

                        {/* Move To Submenu Trigger */}
                        <div
                            className="menu-item"
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}
                            onMouseEnter={() => setActiveSubmenu('move')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LayoutDashboard size={14} /> Move to
                            </div>
                            <ChevronRight size={14} />

                            {/* Submenu List */}
                            {activeSubmenu === 'move' && (
                                <div style={{
                                    position: 'absolute',
                                    left: '100%',
                                    top: 0,
                                    width: '180px',
                                    backgroundColor: 'white',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    borderRadius: '4px',
                                    padding: '4px',
                                    marginLeft: '4px',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {allAccessibleWorkspaces.map(ws => (
                                        <div
                                            key={ws.id}
                                            className="menu-item"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveBoardToWorkspace(activeBoardMenu, ws.id);
                                                setActiveBoardMenu(null);
                                                setActiveSubmenu(null);
                                            }}
                                        >
                                            {ws.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Duplicate To Submenu Trigger */}
                        <div
                            className="menu-item"
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}
                            onMouseEnter={() => setActiveSubmenu('duplicate')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Copy size={14} /> Duplicate to
                            </div>
                            <ChevronRight size={14} />

                            {/* Submenu List */}
                            {activeSubmenu === 'duplicate' && (
                                <div style={{
                                    position: 'absolute',
                                    left: '100%',
                                    top: 0,
                                    width: '180px',
                                    backgroundColor: 'white',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    borderRadius: '4px',
                                    padding: '4px',
                                    marginLeft: '4px',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {allAccessibleWorkspaces.map(ws => (
                                        <div
                                            key={ws.id}
                                            className="menu-item"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                duplicateBoardToWorkspace(activeBoardMenu, ws.id);
                                                setActiveBoardMenu(null);
                                                setActiveSubmenu(null);
                                            }}
                                        >
                                            {ws.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>



                        <div className="menu-item delete" onClick={() => {
                            setBoardToDelete(activeBoardMenu);
                            setActiveBoardMenu(null);
                        }} onMouseEnter={() => setActiveSubmenu(null)}>
                            <Trash2 size={14} /> Delete
                        </div>
                    </div>
                )}

                {/* Draw Workspace Context Menu */}
                {activeWorkspaceMenu && (
                    <div className="context-menu" style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        borderRadius: '4px',
                        padding: '4px',
                        zIndex: 9999,
                        width: '180px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div className="menu-item" onClick={() => {
                            setShareWorkspaceId(activeWorkspaceMenu);
                            setActiveWorkspaceMenu(null);
                        }}>
                            <Users size={14} /> Share
                        </div>
                        <div className="menu-item" onClick={() => {
                            const ws = workspaces.find(w => w.id === activeWorkspaceMenu);
                            if (ws) {
                                setEditingWorkspaceId(ws.id);
                                setEditWorkspaceTitle(ws.title);
                            }
                            setActiveWorkspaceMenu(null);
                        }}>
                            <Edit2 size={14} /> Rename
                        </div>
                        <div className="menu-item delete" onClick={() => {
                            setWorkspaceToDelete(activeWorkspaceMenu);
                            setActiveWorkspaceMenu(null);
                        }}>
                            <Trash2 size={14} /> Delete
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Modal for Board Deletion */}
            <ConfirmModal
                isOpen={!!boardToDelete}
                title="Delete Board"
                message="Are you sure you want to delete this board? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                onConfirm={() => {
                    if (boardToDelete) deleteBoard(boardToDelete);
                    setBoardToDelete(null);
                }}
                onCancel={() => setBoardToDelete(null)}
            />

            {/* Confirm Modal for Workspace Deletion */}
            <ConfirmModal
                isOpen={!!workspaceToDelete}
                title="Delete Workspace"
                message="Are you sure you want to delete this workspace? All boards inside it will be deleted! This action cannot be undone."
                confirmText="Delete Workspace"
                variant="danger"
                onConfirm={() => {
                    if (workspaceToDelete) deleteWorkspace(workspaceToDelete);
                    setWorkspaceToDelete(null);
                }}
                onCancel={() => setWorkspaceToDelete(null)}
            />

            {/* Debug Role Switcher - HIDDEN as per user request (Owner/Admin is default) */}
            {/* <div style={{
                marginTop: 'auto',
                padding: '16px',
                borderTop: '1px solid hsl(var(--color-border))',
                fontSize: '12px',
                color: 'hsl(var(--color-text-secondary))'
            }}>
                <div style={{ marginBottom: '8px', fontWeight: 500 }}>DEBUG: Current Role</div>
                <select
                    value={currentUser.role}
                    onChange={(e) => setRole(e.target.value as any)}
                    style={{
                        width: '100%',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid hsl(var(--color-border))'
                    }}
                >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                </select>
            </div> */}

            <style>{`
                .workspace-item-row:hover .action-icon {
                    opacity: 1;
                }
                .action-icon {
                    opacity: 0;
                    margin-left: auto;
                    color: #676879;
                    border-radius: 4px;
                    padding: 2px;
                }
                .action-icon:hover {
                    background-color: rgba(0,0,0,0.05);
                    color: #323338;
                }
                .context-menu {
                    display: flex;
                    flex-direction: column;
                    text-align: left;
                }
                .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    color: #323338;
                    border-radius: 4px;
                }
                .menu-item:hover {
                    background-color: #f5f6f8;
                }
                .menu-item.delete {
                    color: #e2445c;
                }
                .menu-item.delete:hover {
                    background-color: #fff0f0;
                }
            `}</style>

            {/* Share Workspace Modal */}
            {shareWorkspaceId && (
                <ShareWorkspaceModal
                    workspaceId={shareWorkspaceId}
                    onClose={() => setShareWorkspaceId(null)}
                />
            )}
        </aside>
    );
};
