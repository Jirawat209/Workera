import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Board, Item, Workspace, ItemValue, ColumnType } from '../types';

interface BoardState {
    boards: Board[];
    activeBoardId: string | null;
    selectedItemIds: string[];
    showHiddenItems: boolean;
    activeWorkspaceId: string;
    workspaces: Workspace[];

    // Async State
    isLoading: boolean;
    error: string | null;
    loadUserData: () => Promise<void>;

    // Actions
    addBoard: (title: string, subWorkspaceId?: string) => Promise<void>;
    deleteBoard: (id: string) => Promise<void>;
    setActiveBoard: (id: string) => void;
    updateBoardTitle: (boardId: string, newTitle: string) => Promise<void>;
    duplicateBoard: (boardId: string) => Promise<void>;
    moveBoard: (activeId: string, overId: string) => void;
    duplicateBoardToWorkspace: (boardId: string, workspaceId: string) => void;
    moveBoardToWorkspace: (boardId: string, workspaceId: string) => void;

    // Workspace Actions
    addWorkspace: (title: string) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;
    setActiveWorkspace: (id: string) => void;
    duplicateWorkspace: (id: string) => void;
    renameWorkspace: (id: string, newTitle: string) => Promise<void>;

    // Group Actions
    addGroup: (title: string) => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
    updateGroupTitle: (groupId: string, newTitle: string) => Promise<void>;
    updateGroupColor: (groupId: string, color: string) => Promise<void>;
    toggleGroup: (boardId: string, groupId: string) => void;

    // Column Actions
    addColumn: (title: string, type: ColumnType, index?: number) => Promise<void>;
    deleteColumn: (columnId: string) => Promise<void>;
    updateColumnTitle: (columnId: string, newTitle: string) => Promise<void>;
    updateColumnWidth: (columnId: string, width: number) => void;
    moveColumn: (fromIndex: number, toIndex: number) => void;
    duplicateColumn: (columnId: string) => void;
    setColumnAggregation: (columnId: string, type: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none') => void;
    // Column Options
    addColumnOption: (columnId: string, label: string, color: string) => void;
    updateColumnOption: (columnId: string, optionId: string, updates: Partial<{ label: string; color: string }>) => void;
    deleteColumnOption: (columnId: string, optionId: string) => void;

    // Board View Settings
    updateBoardItemColumnTitle: (newTitle: string) => void;
    updateBoardItemColumnWidth: (width: number) => void;

    // Item Actions
    addItem: (title: string, groupId: string) => Promise<void>;
    updateItemValue: (itemId: string, columnId: string, value: any) => Promise<void>;
    updateItemTitle: (itemId: string, newTitle: string) => Promise<void>;
    deleteItem: (itemId: string) => Promise<void>;
    moveItem: (activeId: string, overId: string) => void;

    // Selection & Batch Actions
    toggleItemSelection: (itemId: string, selected: boolean) => void;
    selectGroupItems: (groupId: string) => void;
    clearSelection: () => void;
    deleteSelectedItems: () => void;
    duplicateSelectedItems: () => void;
    moveSelectedItemsToGroup: (targetGroupId: string) => void;
    hideSelectedItems: () => void;
    unhideSelectedItems: () => void;

    // UI State
    toggleShowHiddenItems: () => void;
    setGroupByColumn: (columnId: string | null) => void;
    setActiveItem: (itemId: string | null) => void;
    activeItemId: string | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Task Updates
    addUpdate: (itemId: string, content: string, author: { name: string; id: string }) => void;
    deleteUpdate: (itemId: string, updateId: string) => void;

    // Sorting & Filtering
    setColumnSort: (columnId: string, direction: 'asc' | 'desc' | null) => void;
    setColumnFilter: (columnId: string, values: string[]) => void;
    clearColumnFilter: (columnId: string) => void;

    // Realtime Subscription
    subscribeToRealtime: () => void;
    unsubscribeFromRealtime: () => void;
}



export const useBoardStore = create<BoardState>((set, get) => ({
    boards: [],
    workspaces: [],
    activeBoardId: null,
    activeWorkspaceId: '',
    selectedItemIds: [],
    showHiddenItems: false,
    activeItemId: null,
    searchQuery: '',
    isLoading: true,
    error: null,

    loadUserData: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ isLoading: false });
                return;
            }

            const [
                { data: workspaces },
                { data: boards },
                { data: groups },
                { data: columns },
                { data: items }
            ] = await Promise.all([
                supabase.from('workspaces').select('*').order('order'),
                supabase.from('boards').select('*').order('order'),
                supabase.from('groups').select('*').order('order'),
                supabase.from('columns').select('*').order('order'),
                supabase.from('items').select('*').order('order')
            ]);

            if (!workspaces || !boards) throw new Error('Failed to load core data');

            // Handle case where user has no workspace (first login)
            if (workspaces.length === 0) {
                // 0. ENSURE PROFILE EXISTS (Fix for users created before SQL trigger)
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata?.avatar_url
                }, { onConflict: 'id' });

                if (profileError) {
                    console.error("Failed to create profile:", profileError);
                }

                const workspaceId = uuidv4();
                const boardId = uuidv4();

                // 1. Create Workspace
                const newWorkspace = { id: workspaceId, title: 'My Workspace', owner_id: user.id, order: 0 };
                await supabase.from('workspaces').insert(newWorkspace);

                // 2. Create Board
                const newBoard = { id: boardId, workspace_id: workspaceId, title: 'Welcome to Workera', order: 0 };
                await supabase.from('boards').insert(newBoard);

                // 3. Create Default Groups
                const group1Id = uuidv4();
                const group2Id = uuidv4();
                const groupsMsg = [
                    { id: group1Id, board_id: boardId, title: 'Getting Started', color: '#579bfc', order: 0 },
                    { id: group2Id, board_id: boardId, title: 'Ideas', color: '#784bd1', order: 1 }
                ];
                await supabase.from('groups').insert(groupsMsg);

                // 4. Create ALL Column Types
                const colStatusId = uuidv4();
                const columnsMsg = [
                    {
                        id: uuidv4(), board_id: boardId, title: 'Task', type: 'text', order: 0, width: 280,
                        options: []
                    },
                    {
                        id: colStatusId, board_id: boardId, title: 'Status', type: 'status', order: 1, width: 140,
                        options: [
                            { id: uuidv4(), label: 'Done', color: '#00c875' },
                            { id: uuidv4(), label: 'Working on it', color: '#fdab3d' },
                            { id: uuidv4(), label: 'Stuck', color: '#e2445c' },
                            { id: uuidv4(), label: 'To Do', color: '#c4c4c4' },
                        ]
                    },
                    { id: uuidv4(), board_id: boardId, title: 'Due Date', type: 'date', order: 2, width: 140, options: [] },
                    { id: uuidv4(), board_id: boardId, title: 'Owner', type: 'people', order: 3, width: 140, options: [] },
                    { id: uuidv4(), board_id: boardId, title: 'Priority', type: 'dropdown', order: 4, width: 140, options: [] },
                    { id: uuidv4(), board_id: boardId, title: 'Budget', type: 'number', order: 5, width: 140, options: [] },
                    { id: uuidv4(), board_id: boardId, title: 'Files', type: 'link', order: 6, width: 140, options: [] },
                    { id: uuidv4(), board_id: boardId, title: 'Checked', type: 'checkbox', order: 7, width: 100, options: [] },
                ];
                await supabase.from('columns').insert(columnsMsg);

                // 5. Create Sample Items
                const item1Id = uuidv4();
                const item2Id = uuidv4();
                const itemsMsg = [
                    {
                        id: item1Id, board_id: boardId, group_id: group1Id, title: 'Explore Workera', order: 0,
                        values: { [colStatusId]: 'Working on it' }
                    },
                    {
                        id: item2Id, board_id: boardId, group_id: group1Id, title: 'Invite Team', order: 1,
                        values: { [colStatusId]: 'To Do' }
                    }
                ];
                await supabase.from('items').insert(itemsMsg);

                // Update Local State immediately
                set({
                    workspaces: [{ id: workspaceId, title: 'My Workspace', order: 0 }],
                    boards: [{
                        id: boardId,
                        workspaceId: workspaceId,
                        title: 'Welcome to Workera',
                        columns: columnsMsg.map(c => ({ ...c, type: c.type as ColumnType, options: c.options })),
                        groups: groupsMsg.map(g => ({
                            id: g.id, title: g.title, color: g.color,
                            items: itemsMsg.filter(i => i.group_id === g.id).map(i => ({
                                id: i.id, title: i.title, groupId: g.id, values: i.values, updates: []
                            }))
                        })),
                        items: itemsMsg.map(i => ({
                            id: i.id, title: i.title, groupId: i.group_id, values: i.values, updates: []
                        })),
                        itemColumnTitle: 'Item',
                        itemColumnWidth: 280
                    }],
                    isLoading: false,
                    activeWorkspaceId: workspaceId,
                    activeBoardId: boardId
                });
                return;
            }

            const fullBoards: Board[] = boards.map(b => {
                const bGroups = (groups || []).filter(g => g.board_id === b.id);
                const bColumns = (columns || []).filter(c => c.board_id === b.id);
                const bItems = (items || []).filter(i => i.board_id === b.id);

                return {
                    id: b.id,
                    workspaceId: b.workspace_id,
                    title: b.title,
                    columns: bColumns.map(c => ({
                        id: c.id,
                        title: c.title,
                        type: c.type as ColumnType,
                        width: c.width,
                        order: c.order,
                        options: c.options || [],
                        aggregation: c.aggregation
                    })),
                    // Just map groups, items are flat on board but we can also nest them if UI expects it
                    groups: bGroups.map(g => ({
                        id: g.id,
                        title: g.title,
                        color: g.color,
                        items: bItems.filter(i => i.group_id === g.id).map(i => ({
                            id: i.id,
                            title: i.title,
                            groupId: g.id,
                            values: i.values || {},
                            isHidden: i.is_hidden,
                            updates: i.updates || []
                        }))
                    })),
                    items: bItems.map(i => ({
                        id: i.id,
                        title: i.title,
                        groupId: i.group_id,
                        values: i.values || {},
                        isHidden: i.is_hidden,
                        updates: i.updates || []
                    })),
                    itemColumnTitle: 'Item',
                    itemColumnWidth: 280
                };
            });

            set({
                workspaces: workspaces.map(w => ({ id: w.id, title: w.title, order: w.order })),
                boards: fullBoards,
                isLoading: false,
                activeWorkspaceId: workspaces[0]?.id || '',
                activeBoardId: fullBoards[0]?.id || null
            });

        } catch (e) {
            console.error(e);
            set({ error: (e as Error).message, isLoading: false });
        }
    },

    setActiveBoard: (id) => set({ activeBoardId: id }),
    setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
    setActiveItem: (id) => set({ activeItemId: id }),
    setSearchQuery: (q) => set({ searchQuery: q }),

    // --- Workspace Actions ---
    addWorkspace: async (title) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const newId = uuidv4();
        const { workspaces } = get();
        const order = workspaces.length;
        set({ workspaces: [...workspaces, { id: newId, title, order }], activeWorkspaceId: newId });
        await supabase.from('workspaces').insert({ id: newId, title, owner_id: user.id, order });
    },
    deleteWorkspace: async (id) => {
        set(state => ({ workspaces: state.workspaces.filter(w => w.id !== id) }));
        await supabase.from('workspaces').delete().eq('id', id);
    },
    renameWorkspace: async (id, newTitle) => {
        set(state => ({ workspaces: state.workspaces.map(w => w.id === id ? { ...w, title: newTitle } : w) }));
        await supabase.from('workspaces').update({ title: newTitle }).eq('id', id);
    },
    duplicateWorkspace: (_id) => { /* TODO: Implement deep copy in DB */ },

    // --- Board Actions ---
    addBoard: async (title, _subWorkspaceId) => {
        const { activeWorkspaceId, boards } = get();
        if (!activeWorkspaceId) return;

        const boardId = uuidv4();
        const defaultGroups = [
            { id: uuidv4(), title: 'Group 1', color: '#579bfc', order: 0 },
            { id: uuidv4(), title: 'Group 2', color: '#784bd1', order: 1 }
        ];
        const defaultColumns = [
            { id: uuidv4(), title: 'Status', type: 'status', order: 0, width: 140, options: [{ id: uuidv4(), label: 'Done', color: '#00c875' }, { id: uuidv4(), label: 'Working', color: '#fdab3d' }, { id: uuidv4(), label: 'Stuck', color: '#e2445c' }] },
            { id: uuidv4(), title: 'Date', type: 'date', order: 1, width: 140 },
            { id: uuidv4(), title: 'Person', type: 'people', order: 2, width: 140 },
        ];

        const newBoard: Board = {
            id: boardId,
            workspaceId: activeWorkspaceId,
            title,
            columns: defaultColumns.map(c => ({ ...c, type: c.type as ColumnType, options: c.options })),
            groups: defaultGroups.map(g => ({ ...g, items: [] })),
            items: []
        };

        set({ boards: [...boards, newBoard], activeBoardId: boardId });

        await supabase.from('boards').insert({ id: boardId, workspace_id: activeWorkspaceId, title, order: boards.length });
        await supabase.from('groups').insert(defaultGroups.map(g => ({ id: g.id, board_id: boardId, title: g.title, color: g.color, order: g.order })));
        await supabase.from('columns').insert(defaultColumns.map(c => ({ id: c.id, board_id: boardId, title: c.title, type: c.type, order: c.order, width: c.width, options: c.options ? JSON.stringify(c.options) : '{}' })));
    },
    deleteBoard: async (id) => {
        set(state => ({ boards: state.boards.filter(b => b.id !== id), activeBoardId: state.activeBoardId === id ? null : state.activeBoardId }));
        await supabase.from('boards').delete().eq('id', id);
    },
    updateBoardTitle: async (boardId, newTitle) => {
        set(state => ({ boards: state.boards.map(b => b.id === boardId ? { ...b, title: newTitle } : b) }));
        await supabase.from('boards').update({ title: newTitle }).eq('id', boardId);
    },
    duplicateBoard: async (_boardId) => { /* TODO */ },
    moveBoard: (_activeId, _overId) => { /* TODO Local Reorder */ },
    duplicateBoardToWorkspace: () => { },
    moveBoardToWorkspace: () => { },

    // --- Group Actions ---
    addGroup: async (title) => {
        const { activeBoardId, boards } = get();
        if (!activeBoardId) return;
        const newId = uuidv4();
        const board = boards.find(b => b.id === activeBoardId);
        const order = board?.groups.length || 0;
        const newGroup = { id: newId, title, color: '#579bfc', items: [] };

        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ? { ...b, groups: [...b.groups, newGroup] } : b)
        }));
        await supabase.from('groups').insert({ id: newId, board_id: activeBoardId, title, order });
    },
    deleteGroup: async (groupId) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ? { ...b, groups: b.groups.filter(g => g.id !== groupId) } : b)
        }));
        await supabase.from('groups').delete().eq('id', groupId);
    },
    updateGroupTitle: async (groupId, newTitle) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ? { ...b, groups: b.groups.map(g => g.id === groupId ? { ...g, title: newTitle } : g) } : b)
        }));
        await supabase.from('groups').update({ title: newTitle }).eq('id', groupId);
    },
    updateGroupColor: async (groupId, color) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ? { ...b, groups: b.groups.map(g => g.id === groupId ? { ...g, color } : g) } : b)
        }));
        await supabase.from('groups').update({ color }).eq('id', groupId);
    },
    toggleGroup: (boardId, groupId) => {
        set(state => ({
            boards: state.boards.map(b => {
                if (b.id !== boardId) return b;
                const collapsed = b.collapsedGroups || [];
                return {
                    ...b,
                    collapsedGroups: collapsed.includes(groupId) ? collapsed.filter(id => id !== groupId) : [...collapsed, groupId]
                };
            })
        }));
    },

    // --- Column Actions ---
    addColumn: async (title, type) => {
        const { activeBoardId, boards } = get();
        if (!activeBoardId) return;
        const newId = uuidv4();
        const board = boards.find(b => b.id === activeBoardId);
        const order = board?.columns.length || 0;
        const newCol = { id: newId, title, type, width: 150, order, options: [] };

        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ? { ...b, columns: [...b.columns, newCol] } : b)
        }));
        await supabase.from('columns').insert({ id: newId, board_id: activeBoardId, title, type, order });
    },
    deleteColumn: async (columnId) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        set(state => ({ boards: state.boards.map(b => b.id === activeBoardId ? { ...b, columns: b.columns.filter(c => c.id !== columnId) } : b) }));
        await supabase.from('columns').delete().eq('id', columnId);
    },
    updateColumnTitle: async (columnId, newTitle) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        set(state => ({ boards: state.boards.map(b => b.id === activeBoardId ? { ...b, columns: b.columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c) } : b) }));
        await supabase.from('columns').update({ title: newTitle }).eq('id', columnId);
    },
    updateColumnWidth: (columnId, width) => {
        // Optimistic only for now
        const { activeBoardId } = get();
        set(state => ({ boards: state.boards.map(b => b.id === activeBoardId ? { ...b, columns: b.columns.map(c => c.id === columnId ? { ...c, width } : c) } : b) }));
    },
    moveColumn: (_fromIndex, _toIndex) => { /* TODO */ },
    duplicateColumn: (_columnId) => { /* TODO */ },
    setColumnAggregation: (columnId, type) => {
        const { activeBoardId } = get();
        set(state => ({ boards: state.boards.map(b => b.id === activeBoardId ? { ...b, columns: b.columns.map(c => c.id === columnId ? { ...c, aggregation: type } : c) } : b) }));
        // Should sync
    },
    addColumnOption: (_columnId, _label, _color) => { /* TODO */ },
    updateColumnOption: (_columnId, _optionId, _updates) => { /* TODO */ },
    deleteColumnOption: (_columnId, _optionId) => { /* TODO */ },

    // --- Item Actions ---
    addItem: async (title, groupId) => {
        const { activeBoardId, boards } = get();
        if (!activeBoardId) return;
        const newItemId = uuidv4();
        const currentBoard = boards.find(b => b.id === activeBoardId);
        if (!currentBoard) return;

        const values: ItemValue = {}; // Populate default values if needed
        const newItem: Item = { id: newItemId, title, groupId, values, updates: [] };

        set(state => ({
            boards: state.boards.map(b => {
                if (b.id !== activeBoardId) return b;
                return {
                    ...b,
                    items: [...b.items, newItem],
                    groups: b.groups.map(g => g.id === groupId ? { ...g, items: [...g.items, newItem] } : g)
                };
            })
        }));
        await supabase.from('items').insert({ id: newItemId, board_id: activeBoardId, group_id: groupId, title, values, order: currentBoard.items.length });
    },
    updateItemValue: async (itemId, columnId, value) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        set(state => ({
            boards: state.boards.map(b => {
                if (b.id !== activeBoardId) return b;
                const update = (i: Item) => i.id === itemId ? { ...i, values: { ...i.values, [columnId]: value } } : i;
                return { ...b, items: b.items.map(update), groups: b.groups.map(g => ({ ...g, items: g.items.map(update) })) };
            })
        }));
        // Fetch fresh state to get full values
        const item = get().boards.find(b => b.id === activeBoardId)?.items.find(i => i.id === itemId);
        if (item) await supabase.from('items').update({ values: item.values }).eq('id', itemId);
    },
    updateItemTitle: async (itemId, newTitle) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ? {
                ...b,
                items: b.items.map(i => i.id === itemId ? { ...i, title: newTitle } : i),
                groups: b.groups.map(g => ({ ...g, items: g.items.map(i => i.id === itemId ? { ...i, title: newTitle } : i) }))
            } : b)
        }));
        await supabase.from('items').update({ title: newTitle }).eq('id', itemId);
    },
    deleteItem: async (itemId) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ? {
                ...b,
                items: b.items.filter(i => i.id !== itemId),
                groups: b.groups.map(g => ({ ...g, items: g.items.filter(i => i.id !== itemId) }))
            } : b)
        }));
        await supabase.from('items').delete().eq('id', itemId);
    },
    moveItem: (_activeId, _overId) => { /* TODO Implement drag and drop logic and sync */ },

    // --- Selection & Batch ---
    toggleItemSelection: (itemId, selected) => {
        set(state => {
            const current = new Set(state.selectedItemIds);
            if (selected) current.add(itemId); else current.delete(itemId);
            return { selectedItemIds: Array.from(current) };
        });
    },
    selectGroupItems: (groupId) => {
        const { activeBoardId, boards } = get();
        const board = boards.find(b => b.id === activeBoardId);
        if (!board) return;
        const items = board.items.filter(i => i.groupId === groupId);
        set(state => {
            const current = new Set(state.selectedItemIds);
            items.forEach(i => current.add(i.id));
            return { selectedItemIds: Array.from(current) };
        });
    },
    clearSelection: () => set({ selectedItemIds: [] }),
    deleteSelectedItems: async () => {
        const { activeBoardId, selectedItemIds } = get();
        if (!activeBoardId) return;
        // Local
        set(state => ({
            boards: state.boards.map(b => b.id === activeBoardId ? {
                ...b,
                items: b.items.filter(i => !selectedItemIds.includes(i.id)),
                groups: b.groups.map(g => ({ ...g, items: g.items.filter(i => !selectedItemIds.includes(i.id)) }))
            } : b),
            selectedItemIds: []
        }));
        // DB
        await supabase.from('items').delete().in('id', selectedItemIds);
    },
    duplicateSelectedItems: () => { },
    moveSelectedItemsToGroup: () => { },
    hideSelectedItems: () => { },
    unhideSelectedItems: () => { },

    // --- View Options ---
    toggleShowHiddenItems: () => set(state => ({ showHiddenItems: !state.showHiddenItems })),
    setGroupByColumn: (columnId) => set(state => ({ boards: state.boards.map(b => b.id === state.activeBoardId ? { ...b, groupByColumnId: columnId } : b) })),
    updateBoardItemColumnTitle: (_t) => { },
    updateBoardItemColumnWidth: (_w) => { },

    // --- Sort & Filter ---
    setColumnSort: (columnId, direction) => set(state => ({ boards: state.boards.map(b => b.id === state.activeBoardId ? { ...b, sort: direction ? { columnId, direction } : null } : b) })),
    setColumnFilter: (columnId: string, values: string[]) => set(state => ({
        boards: state.boards.map(b => {
            if (b.id !== state.activeBoardId) return b;
            const filters = (b.filters || []).filter(f => f.columnId !== columnId);
            if (values.length) filters.push({ columnId, values });
            return { ...b, filters };
        })
    })),
    clearColumnFilter: (columnId: string) => set(state => ({ boards: state.boards.map(b => b.id === state.activeBoardId ? { ...b, filters: (b.filters || []).filter(f => f.columnId !== columnId) } : b) })),

    // --- Task Updates ---
    addUpdate: (_itemId, _content, _author) => { /* TODO Sync to DB updates column */ },
    deleteUpdate: (_itemId, _updateId) => { },

    subscribeToRealtime: () => {
        const { activeWorkspaceId } = get();
        if (!activeWorkspaceId) return;

        supabase.removeAllChannels();

        supabase.channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                set((state) => {
                    const currentBoards = [...state.boards];
                    const record = (newRecord || oldRecord) as any;

                    if (eventType === 'DELETE') {
                        const deletedId = oldRecord.id;
                        currentBoards.forEach(b => {
                            b.items = b.items.filter(i => i.id !== deletedId);
                            b.groups.forEach(g => {
                                g.items = g.items.filter(i => i.id !== deletedId);
                            });
                        });
                        return { boards: currentBoards };
                    }

                    if (!record.board_id) return {};
                    const boardIndex = currentBoards.findIndex(b => b.id === record.board_id);
                    if (boardIndex === -1) return {};
                    const board = currentBoards[boardIndex];

                    if (eventType === 'INSERT') {
                        if (board.items.some(i => i.id === record.id)) return {}; // Optimistic check

                        let parsedValues = record.values;
                        if (typeof parsedValues === 'string') {
                            try { parsedValues = JSON.parse(parsedValues); } catch { }
                        }

                        const newItem: Item = {
                            id: record.id,
                            title: record.title,
                            groupId: record.group_id,
                            values: parsedValues || {},
                            updates: [],
                            isHidden: record.is_hidden || false
                        };

                        board.items.push(newItem);
                        const groupIndex = board.groups.findIndex(g => g.id === record.group_id);
                        if (groupIndex !== -1) board.groups[groupIndex].items.push(newItem);

                        return { boards: currentBoards };
                    }

                    if (eventType === 'UPDATE') {
                        const itemIndex = board.items.findIndex(i => i.id === record.id);
                        if (itemIndex !== -1) {
                            let parsedValues = record.values;
                            if (typeof parsedValues === 'string') {
                                try { parsedValues = JSON.parse(parsedValues); } catch { }
                            }

                            const updates: Partial<Item> = {
                                title: record.title,
                                groupId: record.group_id,
                                values: parsedValues,
                                isHidden: record.is_hidden
                            };

                            board.items[itemIndex] = { ...board.items[itemIndex], ...updates };

                            // Update groups
                            board.groups.forEach(g => {
                                const gIdx = g.items.findIndex(i => i.id === record.id);
                                if (gIdx !== -1) {
                                    if (record.group_id && record.group_id !== g.id) {
                                        g.items.splice(gIdx, 1); // Remove from old group
                                    } else {
                                        g.items[gIdx] = { ...g.items[gIdx], ...updates };
                                    }
                                }
                                if (record.group_id === g.id && gIdx === -1) {
                                    g.items.push(board.items[itemIndex]); // Add to new group
                                }
                            });
                        }
                        return { boards: currentBoards };
                    }
                    return {};
                });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'columns' }, (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                set((state) => {
                    const currentBoards = [...state.boards];
                    const record = (newRecord || oldRecord) as any;

                    if (eventType === 'DELETE') {
                        currentBoards.forEach(b => {
                            b.columns = b.columns.filter(c => c.id !== oldRecord.id);
                        });
                        return { boards: currentBoards };
                    }

                    const boardIndex = currentBoards.findIndex(b => b.id === record.board_id);
                    if (boardIndex === -1) return {};

                    if (eventType === 'INSERT') {
                        if (currentBoards[boardIndex].columns.some(c => c.id === record.id)) return {};

                        let options = record.options;
                        if (typeof options === 'string') try { options = JSON.parse(options); } catch { }

                        const newCol = {
                            ...record,
                            type: record.type as ColumnType,
                            options: options || []
                        };
                        currentBoards[boardIndex].columns.push(newCol);
                        return { boards: currentBoards };
                    }

                    if (eventType === 'UPDATE') {
                        const idx = currentBoards[boardIndex].columns.findIndex(c => c.id === record.id);
                        if (idx !== -1) {
                            let options = record.options;
                            if (typeof options === 'string') try { options = JSON.parse(options); } catch { }

                            currentBoards[boardIndex].columns[idx] = {
                                ...currentBoards[boardIndex].columns[idx],
                                ...record,
                                type: record.type as ColumnType,
                                options: options || currentBoards[boardIndex].columns[idx].options
                            };
                        }
                        return { boards: currentBoards };
                    }
                    return {};
                });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                set((state) => {
                    const currentBoards = [...state.boards];
                    const record = (newRecord || oldRecord) as any;

                    if (eventType === 'DELETE') {
                        currentBoards.forEach(b => {
                            b.groups = b.groups.filter(g => g.id !== oldRecord.id);
                        });
                        return { boards: currentBoards };
                    }

                    const boardIndex = currentBoards.findIndex(b => b.id === record.board_id);
                    if (boardIndex === -1) return {};

                    if (eventType === 'INSERT') {
                        if (currentBoards[boardIndex].groups.some(g => g.id === record.id)) return {};
                        currentBoards[boardIndex].groups.push({ ...record, items: [] });
                        return { boards: currentBoards };
                    }

                    if (eventType === 'UPDATE') {
                        const idx = currentBoards[boardIndex].groups.findIndex(g => g.id === record.id);
                        if (idx !== -1) {
                            currentBoards[boardIndex].groups[idx] = { ...currentBoards[boardIndex].groups[idx], ...record };
                        }
                        return { boards: currentBoards };
                    }
                    return {};
                });
            })
            .subscribe();
    },

    unsubscribeFromRealtime: () => {
        supabase.removeAllChannels();
    }
}));


