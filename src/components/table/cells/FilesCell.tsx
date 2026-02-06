
import React, { useRef, useState } from 'react';
import type { Item, Column, FileLink } from '../../../types';
import { useBoardStore } from '../../../store/useBoardStore';
import { usePermission } from '../../../hooks/usePermission';
import { FileText, Plus } from 'lucide-react';
import { FilesPicker } from '../FilesPicker';

interface FilesCellProps {
    item: Item;
    column: Column;
}

export const FilesCell: React.FC<FilesCellProps> = ({ item, column }) => {
    const value = item.values[column.id];
    const updateItemValue = useBoardStore(state => state.updateItemValue);
    const { can } = usePermission();

    const [isEditing, setIsEditing] = useState(false);
    const [pickerPos, setPickerPos] = useState<{ top: number, bottom: number, left: number, width: number } | null>(null);
    const cellRef = useRef<HTMLDivElement>(null);

    const files: FileLink[] = Array.isArray(value) ? value : [];

    return (
        <>
            <div
                ref={cellRef}
                className="table-cell"
                onClick={() => {
                    if (!can('edit_items')) return;
                    if (cellRef.current) {
                        const rect = cellRef.current.getBoundingClientRect();
                        setPickerPos({
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            bottom: rect.bottom
                        });
                        setIsEditing(true);
                    }
                }}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRight: '1px solid hsl(var(--color-cell-border))',
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    overflow: 'hidden'
                }}
            >
                {files.length > 0 ? (
                    files.map((file, idx) => (
                        <div key={idx} style={{
                            backgroundColor: '#f0f0f4',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            maxWidth: '100px',
                        }} title={file.name}>
                            <FileText size={12} color="#666" />
                            <span style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '80px'
                            }}>
                                {file.name}
                            </span>
                        </div>
                    ))
                ) : (
                    <div style={{ color: 'hsl(var(--color-text-tertiary))', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <Plus size={16} />
                    </div>
                )}
            </div>

            {isEditing && pickerPos && (
                <FilesPicker
                    files={files}
                    position={pickerPos}
                    onSave={(newFiles) => {
                        updateItemValue(item.id, column.id, newFiles);
                    }}
                    onClose={() => {
                        setIsEditing(false);
                        setPickerPos(null);
                    }}
                />
            )}
        </>
    );
};
