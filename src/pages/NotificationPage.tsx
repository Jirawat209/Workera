import { useState } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { CheckCheck, BellRing } from 'lucide-react';

export const NotificationPage = () => {
    const notifications = useBoardStore(state => state.notifications || []);
    const unreadCount = useBoardStore(state => state.notifications?.filter(n => !n.is_read).length || 0);
    const markAllNotificationsAsRead = useBoardStore(state => state.markAllNotificationsAsRead);

    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'mentions'>('all');

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'unread') return !n.is_read;
        if (activeTab === 'mentions') return n.type === 'mention' || n.type === 'assignment';
        return true;
    });

    return (
        <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'hsl(var(--color-text-primary))', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    Notifications
                    {unreadCount > 0 && (
                        <span style={{
                            backgroundColor: 'hsl(var(--color-status-red-bg))', color: 'white', fontSize: '14px', fontWeight: 'bold',
                            padding: '2px 10px', borderRadius: '9999px'
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </h1>
                <button
                    onClick={() => markAllNotificationsAsRead()}
                    style={{
                        padding: '8px 16px', border: '1px solid hsl(var(--color-border))', backgroundColor: 'hsl(var(--color-bg-surface))', cursor: 'pointer',
                        borderRadius: '6px', color: 'hsl(var(--color-text-secondary))', display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '14px', fontWeight: 500, transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--color-bg-surface-hover))'; e.currentTarget.style.borderColor = 'hsl(var(--color-border-hover))'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--color-bg-surface))'; e.currentTarget.style.borderColor = 'hsl(var(--color-border))'; }}
                >
                    <CheckCheck size={16} /> Mark all as read
                </button>

            </div>

            <div style={{ backgroundColor: 'hsl(var(--color-bg-surface))', borderRadius: '12px', border: '1px solid hsl(var(--color-border))', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', padding: '12px 16px', gap: '8px', borderBottom: '1px solid hsl(var(--color-border))', backgroundColor: 'hsl(var(--color-bg-subtle))' }}>
                    {(['all', 'unread', 'mentions'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500,
                                border: activeTab === tab ? '1px solid hsl(var(--color-border))' : '1px solid transparent',
                                backgroundColor: activeTab === tab ? 'hsl(var(--color-bg-surface))' : 'transparent',
                                color: activeTab === tab ? 'hsl(var(--color-brand-primary))' : 'hsl(var(--color-text-secondary))',
                                boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { if (activeTab !== tab) { e.currentTarget.style.backgroundColor = 'hsl(var(--color-bg-surface-hover))'; e.currentTarget.style.color = 'hsl(var(--color-text-primary))'; } }}
                            onMouseLeave={(e) => { if (activeTab !== tab) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'hsl(var(--color-text-secondary))'; } }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'hsl(var(--color-bg-surface))' }}>
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                            />
                        ))
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center', color: 'hsl(var(--color-text-tertiary))' }}>
                            <div style={{ width: '80px', height: '80px', backgroundColor: 'hsl(var(--color-bg-subtle))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <BellRing size={40} style={{ opacity: 0.2 }} />
                            </div>
                            <p style={{ fontSize: '16px', fontWeight: 600, color: 'hsl(var(--color-text-primary))', margin: 0 }}>All caught up!</p>
                            <p style={{ fontSize: '14px', marginTop: '8px', maxWidth: '300px' }}>
                                {activeTab === 'all'
                                    ? "You have no notifications yet. When you get one, it will show up here."
                                    : activeTab === 'unread'
                                        ? "You've read all your notifications."
                                        : "You haven't been mentioned in any tasks yet."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
