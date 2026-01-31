import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { CloudStatus } from './CloudStatus';
import { useBoardStore } from '../../store/useBoardStore';
import { NotificationItem } from '../notifications/NotificationItem';

export const TopBar = () => {
    const { user, signOut } = useAuth();
    const unreadCount = useBoardStore(state => state.notifications?.filter(n => !n.is_read).length || 0);
    const loadNotifications = useBoardStore(state => state.loadNotifications);
    const navigateTo = useBoardStore(state => state.navigateTo);

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationMenuRef = useRef<HTMLDivElement>(null);

    const notifications = useBoardStore(state => state.notifications || []);
    const recentNotifications = notifications.slice(0, 5);

    useEffect(() => {
        if (user?.id) {
            loadNotifications();
        }
    }, [user?.id, loadNotifications]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
            if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node) && !(event.target as Element).closest('.notification-bell-btn')) {
                setShowNotifications(false);
            }
        };

        if (showProfileMenu || showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileMenu, showNotifications]);

    const handleSignOut = async () => {
        await signOut();
        setShowProfileMenu(false);
    };

    // Get user avatar or initials
    const userAvatar = user?.user_metadata?.avatar_url;
    const userInitials = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase();

    return (
        <div style={{
            height: '56px',
            width: '100%',
            backgroundColor: 'hsl(var(--color-bg-surface))',
            borderBottom: '1px solid hsl(var(--color-border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 24px',
            gap: '16px',
            flexShrink: 0,
            zIndex: 50 // Ensure above table sticky headers if any conflict
        }}>
            {/* Cloud Status Indicator */}
            <CloudStatus />

            <div style={{ width: '1px', height: '20px', backgroundColor: 'hsl(var(--color-border))', margin: '0 8px' }} />

            {/* Notification Bell */}
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }} ref={notificationMenuRef}>
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="notification-bell-btn relative flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-[hsl(var(--color-bg-hover))] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    style={{
                        backgroundColor: showNotifications ? 'hsl(var(--color-bg-hover))' : 'transparent',
                        color: 'hsl(var(--color-text-primary))',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    title={unreadCount > 0 ? `${unreadCount} unread notifications` : "No new notifications"}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#ff3b30',
                            border: '2px solid hsl(var(--color-bg-surface))'
                        }} />
                    )}
                </button>

                {/* Notification Popover */}
                {showNotifications && (
                    <div style={{
                        position: 'absolute',
                        top: '44px',
                        right: '-80px', // Shift slightly right to align better with edge or center
                        width: '360px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        border: '1px solid #e5e7eb',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>Notifications</span>
                            {unreadCount > 0 && <span style={{ fontSize: '12px', color: '#6b7280' }}>{unreadCount} unread</span>}
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {recentNotifications.length > 0 ? (
                                recentNotifications.map(notification => (
                                    <div key={notification.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                        <NotificationItem notification={notification} onClose={() => setShowNotifications(false)} />
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                    No notifications
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '8px', borderTop: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                            <button
                                onClick={() => {
                                    setShowNotifications(false);
                                    navigateTo('notifications');
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#2563eb',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    borderRadius: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                See all notifications
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={profileMenuRef}>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '1px solid hsl(var(--color-border))',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        backgroundColor: userAvatar ? 'transparent' : '#0073ea',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                    }}
                    title={user?.email || 'Profile'}
                >
                    {userAvatar ? (
                        <img
                            src={userAvatar}
                            alt="Profile"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        userInitials
                    )}
                </motion.button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                    <div style={{
                        position: 'absolute',
                        top: '44px',
                        right: 0,
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '240px',
                        zIndex: 1000,
                        border: '1px solid hsl(var(--color-border))',
                        overflow: 'hidden'
                    }}>
                        {/* User Info */}
                        <div style={{
                            padding: '16px',
                            borderBottom: '1px solid hsl(var(--color-border))'
                        }}>
                            <div style={{
                                fontWeight: 600,
                                fontSize: '14px',
                                marginBottom: '4px',
                                color: 'hsl(var(--color-text-primary))'
                            }}>
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: 'hsl(var(--color-text-tertiary))'
                            }}>
                                {user?.email}
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleSignOut}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '14px',
                                color: 'hsl(var(--color-text-primary))',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--color-bg-hover))'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <LogOut size={16} />
                            <span>Log out</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
