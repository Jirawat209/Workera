import type { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';
import type { ColumnType } from '../../types';
import type { BoardState } from '../useBoardStore';

export interface ColumnSlice {
    // Column Actions
    addColumn: (title: string, type: ColumnType, index?: number) => Promise<void>;
    deleteColumn: (columnId: string) => Promise<void>;
    updateColumnTitle: (columnId: string, newTitle: string) => Promise<void>;
    updateColumnWidth: (columnId: string, width: number) => void;
    moveColumn: (fromIndex: number, toIndex: number) => void;
    // Options
    addColumnOption: (columnId: string, label: string, color: string) => void;
    updateColumnOption: (columnId: string, optionId: string, updates: Partial<{ label: string; color: string }>) => void;
    deleteColumnOption: (columnId: string, optionId: string) => void;
    setColumnAggregation: (columnId: string, type: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none') => void;
    // Board View Settings
    updateBoardItemColumnTitle: (newTitle: string) => void;
    updateBoardItemColumnWidth: (width: number) => void;
    // Sorting & Filtering
    setColumnSort: (columnId: string, direction: 'asc' | 'desc' | null) => void;
    setColumnFilter: (columnId: string, values: string[]) => void;
    clearColumnFilter: (columnId: string) => void;
    duplicateColumn: (columnId: string) => void;
}

export const createColumnSlice: StateCreator<
    BoardState,
    [],
    [],
    ColumnSlice
> = (set, get) => ({
    addColumn: async (title, type, index) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        const newColId = uuidv4();
        const board = get().boards.find(b => b.id === activeBoardId);
        const order = index !== undefined ? index : (board ? board.columns.length : 0);

        let options: any[] = [];
        if (type === 'status') {
            options = [
                { id: uuidv4(), label: 'Done', color: '#00c875' },
                { id: uuidv4(), label: 'Working on it', color: '#fdab3d' },
                { id: uuidv4(), label: 'Stuck', color: '#e2445c' },
            ];
        }

        const newCol = { id: newColId, title, type, order, width: 140, options };

        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ?
                { ...b, columns: [...b.columns, newCol].sort((a, b) => a.order - b.order) } : b
            )
        }));
        await supabase.from('columns').insert({
            id: newColId, board_id: activeBoardId, title, type, order, width: 140, options
        });

        get().logActivity('column_created', 'board', activeBoardId, {
            board_id: activeBoardId,
            column_title: title,
            column_type: type
        });
    },

    deleteColumn: async (columnId) => {
        const { activeBoardId } = get();
        const column = get().boards.find(b => b.id === activeBoardId)?.columns.find(c => c.id === columnId);

        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ?
                { ...b, columns: b.columns.filter(c => c.id !== columnId) } : b
            )
        }));
        await supabase.from('columns').delete().eq('id', columnId);

        if (activeBoardId) {
            get().logActivity('column_deleted', 'board', activeBoardId, {
                board_id: activeBoardId,
                column_title: column?.title || 'Unknown'
            });
        }
    },

    updateColumnTitle: async (columnId, newTitle) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        set(state => ({ boards: state.boards.map(b => b.id === activeBoardId ? { ...b, columns: b.columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c) } : b) }));
        await supabase.from('columns').update({ title: newTitle }).eq('id', columnId);
    },

    updateColumnWidth: (columnId, width) => {
        const { activeBoardId } = get();
        set(state => ({ boards: state.boards.map(b => b.id === activeBoardId ? { ...b, columns: b.columns.map(c => c.id === columnId ? { ...c, width } : c) } : b) }));
    },

    moveColumn: async (fromIndex, toIndex) => {
        const { activeBoardId, boards } = get();
        if (!activeBoardId) return;

        const board = boards.find(b => b.id === activeBoardId);
        if (!board) return;

        const newColumns = arrayMove(board.columns, fromIndex, toIndex);
        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ? { ...b, columns: newColumns } : b)
        }));

        const columnIds = newColumns.map(c => c.id);
        await supabase.rpc('reorder_columns', {
            _board_id: activeBoardId,
            _column_ids: columnIds
        });
    },

    duplicateColumn: () => { /* TODO */ },

    setColumnAggregation: (columnId, type) => {
        const { activeBoardId } = get();
        set(state => ({ boards: state.boards.map(b => b.id === activeBoardId ? { ...b, columns: b.columns.map(c => c.id === columnId ? { ...c, aggregation: type } : c) } : b) }));
    },

    addColumnOption: async (columnId, label, color) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        let finalOptions: any[] = [];

        set(state => ({
            boards: state.boards.map(b => {
                if (b.id !== activeBoardId) return b;
                return {
                    ...b,
                    columns: b.columns.map(c => {
                        if (c.id !== columnId) return c;
                        const safeOptions = Array.isArray(c.options) ? c.options : [];
                        finalOptions = [...safeOptions, { id: uuidv4(), label, color }];
                        return { ...c, options: finalOptions };
                    })
                };
            })
        }));

        if (finalOptions.length > 0) {
            await supabase.from('columns').update({ options: finalOptions }).eq('id', columnId);
        }
    },

    updateColumnOption: async (columnId, optionId, updates) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        let finalOptions: any[] = [];

        set(state => ({
            boards: state.boards.map(b => {
                if (b.id !== activeBoardId) return b;
                return {
                    ...b,
                    columns: b.columns.map(c => {
                        if (c.id !== columnId) return c;
                        const safeOptions = Array.isArray(c.options) ? c.options : [];
                        finalOptions = safeOptions.map(o => o.id === optionId ? { ...o, ...updates } : o);
                        return { ...c, options: finalOptions };
                    })
                };
            })
        }));

        if (finalOptions.length > 0) {
            await supabase.from('columns').update({ options: finalOptions }).eq('id', columnId);
        }
    },

    deleteColumnOption: async (columnId, optionId) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        let finalOptions: any[] = [];

        set(state => ({
            boards: state.boards.map(b => {
                if (b.id !== activeBoardId) return b;
                return {
                    ...b,
                    columns: b.columns.map(c => {
                        if (c.id !== columnId) return c;
                        const safeOptions = Array.isArray(c.options) ? c.options : [];
                        finalOptions = safeOptions.filter(o => o.id !== optionId);
                        return { ...c, options: finalOptions };
                    })
                };
            })
        }));
        await supabase.from('columns').update({ options: finalOptions }).eq('id', columnId);
    },

    updateBoardItemColumnTitle: (newTitle) => {
        const { activeBoardId } = get();
        set(state => ({ boards: state.boards.map(b => b.id === activeBoardId ? { ...b, itemColumnTitle: newTitle } : b) }));
    },
    updateBoardItemColumnWidth: (width) => {
        const { activeBoardId } = get();
        set(state => ({ boards: state.boards.map(b => b.id === activeBoardId ? { ...b, itemColumnWidth: width } : b) }));
    },

    setColumnSort: (columnId, direction) => set(state => ({ boards: state.boards.map(b => b.id === state.activeBoardId ? { ...b, sort: direction ? { columnId, direction } : null } : b) })),
    setColumnFilter: (columnId, values) => set(state => ({
        boards: state.boards.map(b => {
            if (b.id !== state.activeBoardId) return b;
            const filters = (b.filters || []).filter(f => f.columnId !== columnId);
            if (values.length) filters.push({ columnId, values });
            return { ...b, filters };
        })
    })),
    clearColumnFilter: (columnId) => set(state => ({ boards: state.boards.map(b => b.id === state.activeBoardId ? { ...b, filters: (b.filters || []).filter(f => f.columnId !== columnId) } : b) })),
});
