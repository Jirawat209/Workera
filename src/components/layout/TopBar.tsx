import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { motion } from 'framer-motion';
import { CloudStatus } from './CloudStatus';

export const TopBar = () => {
    const { user, signOut } = useAuth();
    // const { activeWorkspaceId } = useBoardStore(); 
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };

        if (showProfileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileMenu]);

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
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <NotificationBell />
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
