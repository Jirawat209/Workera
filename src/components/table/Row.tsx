import type { Item, Column } from '../../types';
import { Cell } from './Cell';
import { GripVertical } from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';
import { useBoardStore } from '../../store/useBoardStore';
import { Check } from 'lucide-react';

const CheckboxState = ({ itemId }: { itemId: string }) => {
    const isSelected = useBoardStore(state => state.selectedItemIds.includes(itemId));

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: isSelected ? 'hsl(var(--color-brand-primary))' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '2px' // Inner radius
        }}>
            {isSelected && <Check size={12} color="white" strokeWidth={3} />}
        </div>
    );
};

export const Row = ({
    item,
    columns,
    groupColor,
    itemColumnWidth = 240,
    dragHandleProps
}: {
    item: Item,
    columns: Column[],
    groupColor?: string,
    itemColumnWidth?: number,
    dragHandleProps?: any
}) => {
    const { can } = usePermission();

    return (
        <div className="table-row" style={{
            height: '100%',
            position: 'relative',
            display: 'flex',
            borderBottom: '1px solid hsl(var(--color-border-hover))',
            opacity: item.isHidden ? 0.5 : 1, // Visual indication for hidden items
            backgroundColor: item.isHidden ? 'hsl(var(--color-bg-subtle))' : 'transparent'
        }}>
            {/* Visual Left Border */}
            {groupColor && (
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    backgroundColor: groupColor,
                    zIndex: 65
                }} />
            )}

            {/* Frozen First Column: Item Name */}
            <div className="table-cell sticky-col" style={{
                width: `${itemColumnWidth}px`,
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: item.isHidden ? 'hsl(var(--color-bg-subtle))' : 'hsl(var(--color-bg-surface))', // Match row bg
                borderRight: '1px solid hsl(var(--color-border))',
                paddingLeft: groupColor ? '18px' : '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {/* Drag Handle (Visible on Hover via CSS) */}
                {can('edit_items') && (
                    <div
                        {...dragHandleProps}
                        className="drag-handle"
                        style={{
                            cursor: 'grab',
                            color: 'hsl(var(--color-text-tertiary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0, // Hidden by default, shown on hover via CSS
                            transition: 'opacity 0.2s',
                            width: '16px',
                            marginLeft: '-4px'
                        }}
                    >
                        <GripVertical size={14} />
                    </div>
                )}

                {/* Row Checkbox */}
                <div
                    className="row-checkbox"
                    onClick={(e) => {
                        e.stopPropagation();
                        import('../../store/useBoardStore').then(({ useBoardStore }) => {
                            const isSelected = useBoardStore.getState().selectedItemIds.includes(item.id);
                            useBoardStore.getState().toggleItemSelection(item.id, !isSelected);
                        });
                    }}
                    style={{
                        width: '16px',
                        height: '16px',
                        border: '1px solid hsl(var(--color-border))',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        // Dynamic styling based on selection would require reactivity, 
                        // better to use a hook in the component or pass it down.
                        // For now, let's use a subscribed component for the checkbox to avoid re-rendering the whole row?
                        // Or just subscribe Row to the specific selection state.
                    }}
                >
                    <CheckboxState itemId={item.id} />
                </div>

                <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                        defaultValue={item.title}
                        readOnly={!can('edit_items')}
                        onBlur={(e) => {
                            if (!can('edit_items')) return;
                            const val = e.target.value.trim();
                            if (val && val !== item.title) {
                                import('../../store/useBoardStore').then(({ useBoardStore }) => {
                                    useBoardStore.getState().updateItemTitle(item.id, val);
                                });
                            } else {
                                // Reset if empty
                                e.target.value = item.title;
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            border: 'none',
                            background: 'transparent',
                            width: '100%',
                            fontSize: '13px',
                            color: 'inherit',
                            outline: 'none',
                            cursor: can('edit_items') ? 'text' : 'default',
                            pointerEvents: can('edit_items') ? 'auto' : 'none' // Disable interaction cleanly
                        }}
                    />

                    {/* Open Button (Visible on Hover) */}
                    <div
                        className="open-btn"
                        onClick={() => {
                            import('../../store/useBoardStore').then(({ useBoardStore }) => {
                                useBoardStore.getState().setActiveItem(item.id);
                            });
                        }}
                        title="Open Task Page"
                        style={{
                            position: 'absolute',
                            right: '0',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'white',
                            border: '1px solid hsl(var(--color-border))',
                            borderRadius: '4px',
                            padding: '4px',
                            display: 'flex', // Hidden by default via CSS
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <span style={{ fontSize: '10px', color: 'hsl(var(--color-text-secondary))', fontWeight: 600 }}>Open</span>
                        {/* Or maximize icon */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                    </div>
                </div>

                {/* Comment Count Bubble (if any) */}
                {Array.isArray(item.updates) && item.updates.filter(u => typeof u === 'object' && u?.id).length > 0 && (
                    <div
                        onClick={() => {
                            import('../../store/useBoardStore').then(({ useBoardStore }) => {
                                useBoardStore.getState().setActiveItem(item.id);
                            });
                        }}
                        style={{
                            marginLeft: '4px',
                            backgroundColor: 'hsl(var(--color-brand-primary))',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            flexShrink: 0
                        }}>
                        {item.updates.filter(u => typeof u === 'object' && u?.id).length}
                    </div>
                )}
            </div>

            {columns.map((col) => (
                <div key={col.id} style={{
                    width: `${col.width || 150}px`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Cell item={item} column={col} />
                </div>
            ))}

            <div className="table-cell" style={{ width: '50px' }}></div>

            {/* Inline Style for Hover Effect (simpler than global CSS for now) */}
            <style>{`
                .table-row:hover .drag-handle {
                    opacity: 1 !important;
                }
                .table-row:hover .open-btn {
                    opacity: 1 !important;
                    display: flex !important;
                }
            `}</style>
        </div>
    );
};
