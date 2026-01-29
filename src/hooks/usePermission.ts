import { useUserStore } from '../store/useUserStore';

type PermissionAction =
    | 'view_board'
    | 'create_board'
    | 'delete_board'
    | 'manage_columns'
    | 'group_ungroup'
    | 'edit_items'
    | 'delete_items'
    | 'invite_members'
    | 'create_sub_workspace'
    | 'manage_feedback';

export const usePermission = () => {
    const { currentUser } = useUserStore();
    const role = currentUser.role;

    const can = (action: PermissionAction): boolean => {
        if (role === 'owner') return true;

        switch (action) {
            case 'view_board':
                return true; // All roles

            case 'manage_feedback': // Viewers can give feedback
                return true;

            case 'create_board': // Member can create board? Request says "Member ... can create Sub Workspace". Implies boards too?
                // Request says "Member... can create Sub Workspace". It doesn't explicitly say they can create Boards, but usually yes.
                // "Editor changed from Hidden to Read-only all, but can Add or Delete Item including add or delete Column... Member can create Sub Workspace too"
                // It says "Editor changed to Read-only all" -> usually usually refers to Board Settings/Structure (Rename Board, Delete Board).
                // Let's assume Member CANNOT create/delete BOARD at top level, but potentially inside SubWorkspace?
                // For now, let's keep 'create_board' as Admin/Owner only to start safe, or Member if we treat them as "Workspace Members".
                // "Member of that Workspace... can create Sub Workspace too".
                // Let's allow Member to create SubWorkspace.
                return role === 'admin' || role === 'member';

            case 'delete_board':
            case 'invite_members':
                return role === 'admin';

            case 'create_sub_workspace':
                return role === 'admin' || role === 'member';

            case 'manage_columns':
            case 'group_ungroup': // Assuming Member can group/ungroup if they can manage columns?
                // "Add or delete Column" specified. Grouping logic usually follows.
                return role === 'admin' || role === 'member';

            case 'edit_items':
            case 'delete_items':
                return role === 'admin' || role === 'member';

            default:
                return false;
        }
    };

    return { can, role };
};
