import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Type, Users, Calendar, CheckSquare, Hash, Link2, ArrowDownCircle, PieChart } from 'lucide-react';

interface AddColumnMenuProps {
    onSelect: (type: 'text' | 'status' | 'date' | 'number' | 'dropdown' | 'checkbox' | 'link' | 'people') => void;
    onClose: () => void;
    position: { top: number; bottom: number; left: number };
}

export const AddColumnMenu = ({ onSelect, onClose, position }: AddColumnMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const items = [
        { id: 'status', label: 'Status', icon: PieChart, color: '#00c875' },
        { id: 'text', label: 'Text', icon: Type, color: '#ffcb00' },
        { id: 'people', label: 'People', icon: Users, color: '#579bfc' },
        { id: 'dropdown', label: 'Dropdown', icon: ArrowDownCircle, color: '#00c875' },
        { id: 'date', label: 'Date', icon: Calendar, color: '#a25ddc' },
        { id: 'number', label: 'Numbers', icon: Hash, color: '#ffcb00' },
        { id: 'checkbox', label: 'Checkbox', color: '#579bfc', icon: CheckSquare },
        { id: 'link', label: 'Link', icon: Link2, color: '#579bfc' },
    ];

    return createPortal(
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: position.bottom + 8,
                left: Math.min(Math.max(20, position.left - 150), window.innerWidth - 340), // 320px width + 20px padding
                width: '320px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid hsl(var(--color-border))'
            }}
        >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--color-border))' }}>
                <input
                    type="text"
                    placeholder="Search or describe your column"
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid hsl(var(--color-border))',
                        outline: 'none',
                        fontSize: '14px'
                    }}
                    autoFocus
                />
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', color: '#676879', fontWeight: 500 }}>Essentials</div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                }}>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item.id as any)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                transition: 'background 0.1s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f5f6f8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <div style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: item.color,
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <item.icon size={14} />
                            </div>
                            <span style={{ fontSize: '14px', color: '#323338' }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};
