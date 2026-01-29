import React, { useMemo } from 'react';
import { Plus, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import type { Column } from '../../types';
import { useBoardStore } from '../../store/useBoardStore';
import { usePermission } from '../../hooks/usePermission';
import { AddColumnMenu } from './AddColumnMenu';
import { ColumnMenu } from './ColumnMenu';
import { FilterMenu } from './FilterMenu';
import { ConfirmModal } from '../ui/ConfirmModal';

const ShowHiddenState = () => {
    const showHiddenItems = useBoardStore(state => state.showHiddenItems);
    return showHiddenItems ? <Eye size={14} color="hsl(var(--color-brand-primary))" /> : <EyeOff size={14} />;
};

export const Header = ({ columns, groupColor }: { columns: Column[], groupColor?: string }) => {
    const addColumn = useBoardStore(state => state.addColumn);
    const deleteColumn = useBoardStore(state => state.deleteColumn);
    const updateColumnTitle = useBoardStore(state => state.updateColumnTitle);
    const moveColumn = useBoardStore(state => state.moveColumn);
    const duplicateColumn = useBoardStore(state => state.duplicateColumn);
    const { can } = usePermission();

    // Sort/Filter Actions
    const setColumnSort = useBoardStore(state => state.setColumnSort);
    const setColumnFilter = useBoardStore(state => state.setColumnFilter);

    // Get Active Board Info
    const activeBoard = useBoardStore(state => state.boards.find(b => b.id === state.activeBoardId));
    const activeSort = activeBoard?.sort;
    const items = activeBoard?.items || [];
    const activeFilters = activeBoard?.filters || [];

    const [editingColId, setEditingColId] = React.useState<string | null>(null);
    const [editValue, setEditValue] = React.useState('');

    // Menu State
    const [activeMenuColId, setActiveMenuColId] = React.useState<string | null>(null);
    const [activeFilterColId, setActiveFilterColId] = React.useState<string | null>(null); // New Filter State
    const [menuPos, setMenuPos] = React.useState<{ top: number, left: number } | null>(null);

    // Confirm Delete State
    const [confirmDeleteColId, setConfirmDeleteColId] = React.useState<string | null>(null);

    // Drag and Drop State
    const [dragItemIndex, setDragItemIndex] = React.useState<number | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = React.useState<number | null>(null);
    const dragItem = React.useRef<number | null>(null);
    const dragOverItem = React.useRef<number | null>(null);
    const [_draggedColumnIndex, setDraggedColumnIndex] = React.useState<number | null>(null); // Added this state

    const handleDragStart = (_e: React.DragEvent, index: number) => {
        setResizingColId(null);
        setDraggedColumnIndex(index);
    };

    const handleDragEnter = (_e: React.DragEvent, index: number) => {
        dragOverItem.current = index;
        setDropTargetIndex(index);
    };

    const handleDragEnd = () => {
        const fromIndex = dragItem.current;
        const toIndex = dragOverItem.current;
        if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
            moveColumn(fromIndex, toIndex);
        }
        dragItem.current = null;
        dragOverItem.current = null;
        setDragItemIndex(null);
        setDropTargetIndex(null);
    };


    // State for Add Column Menu
    const [showAddMenu, setShowAddMenu] = React.useState(false);
    const addBtnRef = React.useRef<HTMLButtonElement>(null);

    const startEditing = (col: Column) => {
        setEditingColId(col.id);
        setEditValue(col.title);
    };

    const saveTitle = () => {
        if (editingColId && editValue.trim()) {
            updateColumnTitle(editingColId, editValue.trim());
        }
        setEditingColId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveTitle();
        if (e.key === 'Escape') setEditingColId(null);
    };

    const handleAddColumn = (type: any) => {
        const typeMap: Record<string, string> = {
            'text': 'Text',
            'status': 'Status',
            'date': 'Date',
            'number': 'Numbers',
            'people': 'Person', // Placeholder
            'checkbox': 'Check', // Placeholder
        };
        const newTitle = typeMap[type] || "New Column";
        // Default add to end
        addColumn(newTitle, type === 'people' ? 'text' : type);
        setShowAddMenu(false);
    };

    const updateBoardItemColumnTitle = useBoardStore(state => state.updateBoardItemColumnTitle);
    const updateBoardItemColumnWidth = useBoardStore(state => state.updateBoardItemColumnWidth);

    // Selectors for Item Column
    const itemColumnTitle = useBoardStore(state => {
        const board = state.boards.find(b => b.id === state.activeBoardId);
        return board?.itemColumnTitle || 'Item';
    });
    const itemColumnWidth = useBoardStore(state => {
        const board = state.boards.find(b => b.id === state.activeBoardId);
        return board?.itemColumnWidth || 240;
    });

    // State for renaming the layout "Item" column
    const [isEditingItemCol, setIsEditingItemCol] = React.useState(false);
    const [itemColValue, setItemColValue] = React.useState(itemColumnTitle);

    // Sync state when prop changes (in case of board switch)
    React.useEffect(() => {
        setItemColValue(itemColumnTitle);
    }, [itemColumnTitle]);

    const saveItemColTitle = () => {
        if (itemColValue.trim()) {
            updateBoardItemColumnTitle(itemColValue.trim());
        }
        setIsEditingItemCol(false);
    };

    const updateColumnWidth = useBoardStore(state => state.updateColumnWidth);

    // Resize Logic
    const [_resizingColId, setResizingColId] = React.useState<string | null>(null);
    const startXRef = React.useRef(0);
    const startWidthRef = React.useRef(0);

    const handleResizeStart = (e: React.MouseEvent, colId: string, currentWidth: number, isItemCol = false) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingColId(colId);
        startXRef.current = e.clientX;
        startWidthRef.current = currentWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const diff = moveEvent.clientX - startXRef.current;
            // Min width 100 for proper visibility
            const newWidth = Math.max(100, startWidthRef.current + diff);

            if (isItemCol) {
                updateBoardItemColumnWidth(newWidth);
            } else {
                updateColumnWidth(colId, newWidth);
            }
        };

        const handleMouseUp = () => {
            setResizingColId(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const openMenu = (e: React.MouseEvent, colId: string) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.left });
        setActiveMenuColId(colId);
    };

    // Find active column for menu
    const activeMenuColumn = activeMenuColId ? columns.find(c => c.id === activeMenuColId) : null;
    const activeFilterColumn = activeFilterColId ? columns.find(c => c.id === activeFilterColId) : null;

    // Compute Filter Options
    const filterOptions = useMemo(() => {
        if (!activeFilterColumn) return [];

        if (activeFilterColumn.type === 'status' || activeFilterColumn.type === 'dropdown') {
            return (activeFilterColumn.options || []).map(opt => ({
                ...opt,
                id: opt.label // Match stored value (Label) logic
            }));
        }

        if (activeFilterColumn.type === 'checkbox') {
            return [
                { id: 'true', label: 'Checked', color: '#00c875' },
                { id: 'false', label: 'Unchecked', color: '#e2445c' }
            ];
        }

        if (activeFilterColumn.type === 'date') {
            // Collect unique dates
            const dates = new Set<string>();
            items.forEach(i => {
                const val = i.values[activeFilterColumn.id];
                if (val) dates.add(val);
            });
            // Show "Empty" option if set?
            return Array.from(dates).sort().map(d => ({ id: d, label: d }));
        }

        // For Default Text/Number
        // Collect unique values
        const values = new Set<string>();
        items.forEach(i => {
            const val = i.values[activeFilterColumn.id];
            if (val) values.add(String(val));
        });
        return Array.from(values).sort().map(v => ({ id: v, label: v }));
    }, [activeFilterColumn, items]);

    const activeFilterValues = useMemo(() => {
        if (!activeFilterColumn) return [];
        const filter = activeFilters.find(f => f.columnId === activeFilterColumn.id);
        return filter?.values || [];
    }, [activeFilters, activeFilterColumn]);

    return (
        <div className="table-header-row" style={{
            position: 'relative',
            display: 'flex',
            backgroundColor: 'hsl(var(--color-table-header-bg))',
            borderBottom: '1px solid hsl(var(--color-border))',
            height: '36px',
            alignItems: 'center'
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
                    zIndex: 65,
                    borderRadius: '0'
                }} />
            )}

            {/* Frozen First Column Placeholder (Name) */}
            <div className="table-cell table-header-cell sticky-col" style={{
                width: `${itemColumnWidth}px`,
                position: 'sticky',
                left: 0,
                zIndex: 60,
                backgroundColor: 'hsl(var(--color-table-header-bg))',
                borderRight: '1px solid hsl(var(--color-border))',
                paddingLeft: groupColor ? '14px' : '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {isEditingItemCol ? (
                    <input
                        autoFocus
                        value={itemColValue}
                        onChange={(e) => setItemColValue(e.target.value)}
                        onBlur={saveItemColTitle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') saveItemColTitle();
                            if (e.key === 'Escape') {
                                setItemColValue(itemColumnTitle);
                                setIsEditingItemCol(false);
                            }
                        }}
                        className="cell-input"
                        style={{ fontWeight: 500, padding: 0 }}
                    />
                ) : (
                    <span
                        onDoubleClick={() => setIsEditingItemCol(true)}
                        title="Double click to rename"
                        style={{ cursor: 'text', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                        {itemColumnTitle}
                    </span>
                )}

                {/* Show Hidden Toggle (User Requested "Column Item" location) */}
                <button
                    onClick={() => {
                        import('../../store/useBoardStore').then(({ useBoardStore }) => {
                            useBoardStore.getState().toggleShowHiddenItems();
                        });
                    }}
                    title="Show/Hide Hidden Items"
                    className="icon-btn"
                    style={{
                        opacity: 0.5,
                        marginRight: '8px' // Space from resize handle
                    }}
                >
                    <ShowHiddenState />
                </button>

                {/* Resize Handle for Item Column */}
                {can('manage_columns') && (
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'item-col', itemColumnWidth, true)}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            cursor: 'col-resize',
                            zIndex: 10,
                        }}
                        className="resize-handle"
                    />
                )}
            </div>

            {columns.map((col, index) => (
                <div
                    key={col.id}
                    className="table-cell table-header-cell"
                    draggable={editingColId !== col.id && can('manage_columns')}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    style={{
                        width: `${col.width || 150}px`,
                        justifyContent: 'space-between',
                        position: 'relative',
                        cursor: (editingColId === col.id || !can('manage_columns')) ? 'default' : 'grab',
                        opacity: dragItemIndex === index ? 0.4 : 1,
                        backgroundColor: dragItemIndex === index ? 'hsl(var(--color-bg-subtle))' : 'transparent'
                    }}
                >
                    {/* Drop Indicator */}
                    {dropTargetIndex === index && dragItemIndex !== index && (
                        <div style={{
                            position: 'absolute',
                            left: -2,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            backgroundColor: 'hsl(var(--color-brand-primary))',
                            zIndex: 100,
                            borderRadius: '2px'
                        }} />
                    )}

                    {editingColId === col.id ? (
                        <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={handleKeyDown}
                            className="cell-input"
                            style={{ fontWeight: 500 }}
                        />
                    ) : (
                        <span
                            onDoubleClick={() => {
                                if (can('manage_columns')) startEditing(col);
                            }}
                            title={can('manage_columns') ? "Double click to rename" : "Read only"}
                            style={{ cursor: can('manage_columns') ? 'text' : 'default', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                            {col.title}
                        </span>
                    )}

                    {/* Sort Indicator (Always Visible if Sorted) */}
                    {activeSort?.columnId === col.id && (
                        <div style={{ marginRight: '4px', color: '#0073ea', fontSize: '10px' }}>
                            {activeSort.direction === 'asc' ? '▲' : '▼'}
                        </div>
                    )}

                    {/* Filter Indicator */}
                    {activeFilters.some(f => f.columnId === col.id) && (
                        <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: '#0073ea',
                            marginRight: 4
                        }} />
                    )}

                    {editingColId !== col.id && (
                        <>
                            <button
                                onClick={(e) => openMenu(e, col.id)}
                                className="icon-btn"
                                style={{ opacity: activeMenuColId === col.id ? 1 : 0.5 }}
                                title="Column Actions"
                            >
                                <MoreHorizontal size={16} />
                            </button>
                        </>
                    )}

                    {/* Resize Handle */}
                    {can('manage_columns') && (
                        <div
                            onMouseDown={(e) => handleResizeStart(e, col.id, col.width || 150)}
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: '4px',
                                cursor: 'col-resize',
                                zIndex: 10,
                            }}
                            className="resize-handle"
                        />
                    )}
                </div>
            ))}

            {/* Render Menu (Outside Loop to avoid z-index issues, through Portal anyway) */}
            {activeMenuColId && menuPos && activeMenuColumn && (
                <ColumnMenu
                    isOpen={true}
                    onClose={() => setActiveMenuColId(null)}
                    position={menuPos}
                    columnType={activeMenuColumn.type}
                    currentSort={activeSort?.columnId === activeMenuColId ? activeSort.direction : null}
                    onSort={(dir) => setColumnSort(activeMenuColId!, dir)}
                    onFilter={() => {
                        // Switch to Filter Menu
                        setActiveFilterColId(activeMenuColId);
                        setActiveMenuColId(null); // Close main menu
                        // Keep menuPos
                    }}
                    onDuplicate={() => duplicateColumn(activeMenuColId!)}
                    // Add to right means inserting at index of column + 1
                    onAddRight={() => {
                        const idx = columns.findIndex(c => c.id === activeMenuColId);
                        addColumn("New Column", "text", idx + 1);
                    }}
                    onRename={() => startEditing(activeMenuColumn)}
                    onDelete={() => setConfirmDeleteColId(activeMenuColId!)}
                />
            )}

            {/* Filter Menu */}
            {activeFilterColId && menuPos && activeFilterColumn && (
                <FilterMenu
                    isOpen={true}
                    onClose={() => setActiveFilterColId(null)}
                    position={menuPos}
                    options={filterOptions}
                    selectedValues={activeFilterValues}
                    onFilterChange={(values) => setColumnFilter(activeFilterColId, values)}
                    title={activeFilterColumn.title}
                />
            )}

            {/* Add Column Button */}
            {can('manage_columns') && (
                <div className="table-cell table-header-cell" style={{ width: '50px', justifyContent: 'center', padding: 0, position: 'relative' }}>
                    <button
                        ref={addBtnRef}
                        className="icon-btn"
                        onClick={() => setShowAddMenu(true)}
                        title="Add Column"
                        style={{ width: '100%', height: '100%', borderRadius: 0 }}
                    >
                        <Plus size={16} />
                    </button>

                    {showAddMenu && addBtnRef.current && (
                        <AddColumnMenu
                            onSelect={handleAddColumn}
                            onClose={() => setShowAddMenu(false)}
                            position={{
                                top: addBtnRef.current.getBoundingClientRect().top,
                                bottom: addBtnRef.current.getBoundingClientRect().bottom,
                                left: addBtnRef.current.getBoundingClientRect().left
                            }}
                        />
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmDeleteColId}
                title="Delete Column"
                message="Are you sure you want to delete this column? This action cannot be undone."
                onConfirm={() => {
                    if (confirmDeleteColId) deleteColumn(confirmDeleteColId);
                    setConfirmDeleteColId(null);
                }}
                onCancel={() => setConfirmDeleteColId(null)}
                confirmText="Delete Column"
                variant="danger"
            />
        </div>
    );
};


