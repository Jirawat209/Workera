import { supabase } from '../lib/supabase';
import type { Board, Column, Group, Item, Workspace } from '../types';

export const api = {
    // Workspaces
    async getWorkspaces() {
        const { data, error } = await supabase
            .from('workspaces')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as Workspace[];
    },

    async createWorkspace(title: string, ownerId: string) {
        const { data, error } = await supabase
            .from('workspaces')
            .insert([{ title, owner_id: ownerId }])
            .select()
            .single();

        if (error) throw error;
        return data as Workspace;
    },

    // Boards
    async getBoards(workspaceId: string) {
        const { data, error } = await supabase
            .from('boards')
            .select(`
                *,
                columns (*),
                groups (*),
                items (*)
            `)
            .eq('workspace_id', workspaceId)
            .order('order', { ascending: true });

        if (error) throw error;

        // Sort children manually since nested order by is tricky in one query depending on syntax
        // Or we rely on client sorting. Data comes back as array.
        // Let's do client side mapping/sorting in the store for now, or here.
        return data?.map(board => ({
            ...board,
            columns: board.columns.sort((a: any, b: any) => a.order - b.order),
            groups: board.groups.sort((a: any, b: any) => a.order - b.order),
            items: board.items.sort((a: any, b: any) => a.order - b.order)
        })) as Board[];
    },

    async createBoard(board: Partial<Board>) {
        const { data, error } = await supabase
            .from('boards')
            .insert([{
                id: board.id,
                workspace_id: board.workspaceId,
                title: board.title,
                order: (board as any).order
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Columns
    async createColumn(column: Column, boardId: string) {
        const { error } = await supabase
            .from('columns')
            .insert([{
                id: column.id,
                board_id: boardId,
                title: column.title,
                type: column.type,
                order: column.order,
                width: column.width,
                options: column.options,
                aggregation: column.aggregation
            }]);

        if (error) throw error;
    },

    async updateColumn(columnId: string, updates: Partial<Column>) {
        const { error } = await supabase
            .from('columns')
            .update(updates)
            .eq('id', columnId);

        if (error) throw error;
    },

    // Groups
    async createGroup(group: Group, boardId: string) {
        const { error } = await supabase
            .from('groups')
            .insert([{
                id: group.id,
                board_id: boardId,
                title: group.title,
                color: group.color,
                order: 0 // logic for order to be handled
            }]);

        if (error) throw error;
    },

    // Items
    async createItem(item: Item, boardId: string) {
        const { error } = await supabase
            .from('items')
            .insert([{
                id: item.id,
                board_id: boardId,
                group_id: item.groupId,
                title: item.title,
                values: item.values,
                order: 0
            }]);

        if (error) throw error;
    },

    async updateItem(itemId: string, updates: Partial<Item>) {
        // Map Item keys to DB keys if necessary, or just rely on 'values', 'title', 'group_id'
        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.values) dbUpdates.values = updates.values;
        if (updates.groupId) dbUpdates.group_id = updates.groupId;
        if (updates.isHidden !== undefined) dbUpdates.is_hidden = updates.isHidden;

        const { error } = await supabase
            .from('items')
            .update(dbUpdates)
            .eq('id', itemId);

        if (error) throw error;
    },

    // Batch
    async deleteItem(itemId: string) {
        const { error } = await supabase.from('items').delete().eq('id', itemId);
        if (error) throw error;
    }
};
