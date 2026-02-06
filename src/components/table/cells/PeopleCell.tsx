
import React, { useRef, useState } from 'react';
import type { Item, Column } from '../../../types';
import { useBoardStore } from '../../../store/useBoardStore';
import { usePermission } from '../../../hooks/usePermission';
import { PersonPicker } from '../PersonPicker';

interface PeopleCellProps {
    item: Item;
    column: Column;
}

export const PeopleCell: React.FC<PeopleCellProps> = ({ item, column }) => {
    const value = item.values[column.id];
    const updateItemValue = useBoardStore(state => state.updateItemValue);
    const { activeBoardMembers } = useBoardStore();
    console.log('[PersonCell] Active Members:', activeBoardMembers);
    const { can } = usePermission();

    const [isEditing, setIsEditing] = useState(false);
    const [pickerPos, setPickerPos] = useState<{ top: number, bottom: number, left: number, width: number } | null>(null);
    const cellRef = useRef<HTMLDivElement>(null);

    const selectedIds = Array.isArray(value) ? value : (value ? [value] : []);

    const startEditing = () => {
        if (!can('edit_items')) return;
        setIsEditing(true);
        if (cellRef.current) {
            const rect = cellRef.current.getBoundingClientRect();
            setPickerPos({
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                width: rect.width
            });
        }
    };

    return (
        <>
            <div
                ref={cellRef}
                className="table-cell"
                onClick={() => !isEditing && startEditing()}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRight: '1px solid hsl(var(--color-cell-border))',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    justifyContent: selectedIds.length > 0 ? 'flex-start' : 'center'
                }}
            >
                {selectedIds.length > 0 ? (
                    selectedIds.map((userId: string, idx: number) => {
                        const member = activeBoardMembers.find(m => m.user_id === userId);
                        const profile = member?.profiles || {};
                        const initial = (profile.full_name || profile.email || '?')[0].toUpperCase();

                        return (
                            <div key={idx} style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: member?.profiles?.avatar_url ? 'transparent' : '#0073ea',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 600,
                                border: '1px solid white',
                                marginLeft: idx > 0 ? '-8px' : '0',
                                zIndex: 10 - idx,
                                overflow: 'hidden'
                            }} title={member?.profiles?.full_name || userId}>
                                {member?.profiles?.avatar_url ? (
                                    <img src={member.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    initial
                                )}
                            </div>
                        );
                    })
                ) : (
                    <span style={{ color: 'hsl(var(--color-text-tertiary))', fontSize: '18px', opacity: 0.5 }}>+</span>
                )}
            </div>

            {isEditing && pickerPos && (
                <PersonPicker
                    currentValue={selectedIds}
                    position={pickerPos}
                    onSelect={(userId) => {
                        const newValues = selectedIds.includes(userId)
                            ? selectedIds.filter((id: string) => id !== userId)
                            : [...selectedIds, userId];
                        updateItemValue(item.id, column.id, newValues);
                    }}
                    onClose={() => {
                        setIsEditing(false);
                        setPickerPos(null);
                    }}
                    boardId={item.boardId || useBoardStore.getState().activeBoardId || ''}
                    itemId={item.id}
                    columnId={column.id}
                />
            )}
        </>
    );
};
