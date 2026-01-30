import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useBoardStore } from '../../store/useBoardStore';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string | null;
    data: any;
    is_read: boolean;
    status?: string; // 'pending' | 'accepted' | 'declined'
    created_at: string;
}

export const NotificationBell = () => {
    const { user } = useAuth();
    const { loadUserData, setActiveBoard, setActiveWorkspace } = useBoardStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user?.id) {
            loadNotifications();
        }
    }, [user?.id]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const loadNotifications = async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error loading notifications:', error);
            return;
        }

        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    };

    const markAsRead = async (notificationId: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        await loadNotifications();
    };

    const handleAcceptInvite = async (notification: Notification) => {
        setProcessingId(notification.id);

        try {
            if (notification.type === 'workspace_invite') {
                const { workspace_id, role } = notification.data;

                // Check if user is already a member
                const { data: existing } = await supabase
                    .from('workspace_members')
                    .select('id')
                    .eq('workspace_id', workspace_id)
                    .eq('user_id', user?.id)
                    .single();

                if (!existing) {
                    // Add user to workspace_members
                    const { error } = await supabase
                        .from('workspace_members')
                        .insert({
                            workspace_id,
                            user_id: user?.id,
                            role
                        });

                    if (error) {
                        console.error('Error accepting workspace invite:', error);
                        alert('Failed to accept invite');
                        setProcessingId(null);
                        return;
                    }
                }
            } else if (notification.type === 'board_invite') {
                const { board_id, role } = notification.data;

                // Check if user is already a member
                const { data: existing } = await supabase
                    .from('board_members')
                    .select('id')
                    .eq('board_id', board_id)
                    .eq('user_id', user?.id)
                    .single();

                if (!existing) {
                    // Add user to board_members
                    const { error } = await supabase
                        .from('board_members')
                        .insert({
                            board_id,
                            user_id: user?.id,
                            role
                        });

                    if (error) {
                        console.error('Error accepting board invite:', error);
                        alert('Failed to accept invite');
                        setProcessingId(null);
                        return;
                    }
                }
            }

            // Optimistically update UI
            setNotifications(prev => prev.map(n =>
                n.id === notification.id
                    ? { ...n, status: 'accepted', is_read: true }
                    : n
            ));

            // Update notification status to 'accepted'
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ is_read: true, status: 'accepted' })
                .eq('id', notification.id);

            if (updateError) {
                console.error('Error updating notification status:', updateError);
                // Revert optimistic update if failed
                await loadNotifications();
                return;
            }

            // Reload other data silently but KEEP notification state
            await loadUserData(true);
        } catch (error) {
            console.error('Error in handleAcceptInvite:', error);
            // Revert optimistic update if failed
            await loadNotifications();
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeclineInvite = async (notification: Notification) => {
        setProcessingId(notification.id);

        // Optimistically update UI
        setNotifications(prev => prev.map(n =>
            n.id === notification.id
                ? { ...n, status: 'declined', is_read: true }
                : n
        ));

        try {
            // Update notification status to 'declined' instead of deleting
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, status: 'declined' })
                .eq('id', notification.id);

            if (error) {
                console.error('Error updating notification status:', error);
                // Revert optimistic update if failed
                await loadNotifications();
            }
        } catch (error) {
            console.error('Error in handleDeclineInvite:', error);
            // Revert optimistic update if failed
            await loadNotifications();
        } finally {
            setProcessingId(null);
        }
    };

    const dismissNotification = async (notificationId: string) => {
        setProcessingId(notificationId);

        // Optimistically remove from UI immediately
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            console.log('Dismissing notification:', notificationId);
            const { error, status, statusText } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) {
                console.error('Error dismissing notification:', {
                    error,
                    status,
                    statusText,
                    message: error.message,
                    code: error.code,
                    details: error.details
                });
                // Reload to restore if failed
                await loadNotifications();
                alert(`Failed to dismiss notification: ${error.message}`);
                return;
            }

            console.log('Notification dismissed successfully');
        } finally {
            setProcessingId(null);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: showDropdown ? 'hsl(var(--color-bg-hover))' : 'transparent',
                    color: 'hsl(var(--color-text-primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                    if (!showDropdown) e.currentTarget.style.backgroundColor = 'hsl(var(--color-bg-hover))';
                }}
                onMouseLeave={(e) => {
                    if (!showDropdown) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#ff3b30',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid hsl(var(--color-bg-surface))'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    minWidth: '360px',
                    maxWidth: '400px',
                    zIndex: 1000,
                    border: '1px solid hsl(var(--color-border))',
                    overflow: 'hidden',
                    maxHeight: '500px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid hsl(var(--color-border))',
                        fontWeight: 600,
                        fontSize: '16px'
                    }}>
                        Notifications
                    </div>

                    {/* Notifications List */}
                    <div style={{
                        overflowY: 'auto',
                        maxHeight: '400px'
                    }}>
                        {notifications.length === 0 ? (
                            <div style={{
                                padding: '32px',
                                textAlign: 'center',
                                color: 'hsl(var(--color-text-tertiary))',
                                fontSize: '14px'
                            }}>
                                No notifications
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    style={{
                                        padding: '16px',
                                        borderBottom: '1px solid hsl(var(--color-border))',
                                        backgroundColor: notification.is_read ? 'transparent' : '#f0f7ff',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        if (!notification.is_read) markAsRead(notification.id);
                                        // Navigation logic
                                        if (notification.data?.board_id) {
                                            setActiveBoard(notification.data.board_id);
                                            setShowDropdown(false);
                                        } else if (notification.data?.workspace_id) {
                                            setActiveWorkspace(notification.data.workspace_id);
                                            setShowDropdown(false);
                                        }
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{
                                            fontWeight: notification.is_read ? 400 : 600,
                                            fontSize: '14px',
                                            flex: 1
                                        }}>
                                            {notification.title}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <div style={{
                                                fontSize: '12px',
                                                color: 'hsl(var(--color-text-tertiary))',
                                                flexShrink: 0
                                            }}>
                                                {formatTime(notification.created_at)}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    dismissNotification(notification.id);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '4px',
                                                    color: 'hsl(var(--color-text-tertiary))',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--color-bg-hover))'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                title="Dismiss"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {notification.message && (
                                        <div style={{
                                            fontSize: '13px',
                                            color: 'hsl(var(--color-text-secondary))',
                                            marginBottom: '12px'
                                        }}>
                                            {notification.message}
                                        </div>
                                    )}

                                    {/* Status Message for Accepted/Declined */}
                                    {notification.status && notification.status !== 'pending' && (
                                        <div style={{
                                            padding: '12px',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            backgroundColor: notification.status === 'accepted' ? '#d1fae5' : '#fee2e2',
                                            color: notification.status === 'accepted' ? '#065f46' : '#991b1b',
                                            marginTop: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{ fontSize: '16px' }}>
                                                {notification.status === 'accepted' ? '✓' : '✕'}
                                            </span>
                                            <span>
                                                {notification.status === 'accepted'
                                                    ? `You've accepted this invitation`
                                                    : `You've declined this invitation`}
                                            </span>
                                        </div>
                                    )}

                                    {/* Workspace/Board Invite Actions - Show only if pending */}
                                    {(notification.type === 'workspace_invite' || notification.type === 'board_invite') &&
                                        (!notification.status || notification.status === 'pending') && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginTop: '12px'
                                            }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAcceptInvite(notification);
                                                    }}
                                                    disabled={processingId === notification.id}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px 16px',
                                                        backgroundColor: processingId === notification.id ? '#6ba3f5' : '#0073ea',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        cursor: processingId === notification.id ? 'not-allowed' : 'pointer',
                                                        opacity: processingId === notification.id ? 0.7 : 1,
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (processingId !== notification.id) {
                                                            e.currentTarget.style.backgroundColor = '#005bb5';
                                                            e.currentTarget.style.transform = 'scale(1.02)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (processingId !== notification.id) {
                                                            e.currentTarget.style.backgroundColor = '#0073ea';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }
                                                    }}
                                                >
                                                    {processingId === notification.id ? (
                                                        <>
                                                            <div style={{
                                                                width: '14px',
                                                                height: '14px',
                                                                border: '2px solid white',
                                                                borderTopColor: 'transparent',
                                                                borderRadius: '50%',
                                                                animation: 'spin 0.6s linear infinite'
                                                            }} />
                                                            Accepting...
                                                        </>
                                                    ) : 'Accept'}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeclineInvite(notification);
                                                    }}
                                                    disabled={processingId === notification.id}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px 16px',
                                                        backgroundColor: 'transparent',
                                                        color: processingId === notification.id ? 'hsl(var(--color-text-tertiary))' : 'hsl(var(--color-text-secondary))',
                                                        border: '1px solid hsl(var(--color-border))',
                                                        borderRadius: '4px',
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        cursor: processingId === notification.id ? 'not-allowed' : 'pointer',
                                                        opacity: processingId === notification.id ? 0.5 : 1,
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (processingId !== notification.id) {
                                                            e.currentTarget.style.backgroundColor = 'hsl(var(--color-bg-hover))';
                                                            e.currentTarget.style.transform = 'scale(1.02)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (processingId !== notification.id) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }
                                                    }}
                                                >
                                                    {processingId === notification.id ? (
                                                        <>
                                                            <div style={{
                                                                width: '14px',
                                                                height: '14px',
                                                                border: '2px solid hsl(var(--color-text-tertiary))',
                                                                borderTopColor: 'transparent',
                                                                borderRadius: '50%',
                                                                animation: 'spin 0.6s linear infinite'
                                                            }} />
                                                            Declining...
                                                        </>
                                                    ) : 'Decline'}
                                                </button>
                                            </div>
                                        )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
