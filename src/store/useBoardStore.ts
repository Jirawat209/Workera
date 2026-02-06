import { create } from 'zustand';
import { createBoardSlice, type BoardSlice } from './slices/boardSlice';
import { createWorkspaceSlice, type WorkspaceSlice } from './slices/workspaceSlice';
import { createItemSlice, type ItemSlice } from './slices/itemSlice';
import { createGroupSlice, type GroupSlice } from './slices/groupSlice';
import { createColumnSlice, type ColumnSlice } from './slices/columnSlice';
import { createMemberSlice, type MemberSlice } from './slices/memberSlice';

// Combine all slice interfaces into the main state interface
// Note: We need to ensure BoardState is exported or compatible with downstream usage.
// Since we are replacing the file, we must redefine BoardState here fully or export it so imports don't break.
// However, the Slices import BoardState from THIS file (circular dependency risk if types aren't handled carefully).
// To fix circular type dependency: 
// 1. We defined type 'BoardState' in slices relative to '../useBoardStore'.
// 2. Here we define it as the intersection.

export type BoardState = BoardSlice & WorkspaceSlice & ItemSlice & GroupSlice & ColumnSlice & MemberSlice & {
    // Shared / Core State that might not be in a specific slice (or shared across them)
    // currently mostly covered by slices
};

export const useBoardStore = create<BoardState>()((...a) => ({
    ...createBoardSlice(...a),
    ...createWorkspaceSlice(...a),
    ...createItemSlice(...a),
    ...createGroupSlice(...a),
    ...createColumnSlice(...a),
    ...createMemberSlice(...a),
}));
