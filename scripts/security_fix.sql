-- =====================================================
-- Security Fix v3: Management Permissions
-- =====================================================
-- Purpose: Allow users to create, update, and delete 
-- their own workspaces, boards, groups, and items.
-- =====================================================

-- 1. Workspace Management
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view accessible workspaces" ON workspaces;
CREATE POLICY "Users can view accessible workspaces" ON workspaces
FOR SELECT USING (
  owner_id = auth.uid() OR
  id IN (SELECT m.workspace_id FROM workspace_members m WHERE m.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
CREATE POLICY "Users can create workspaces" ON workspaces
FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their workspaces" ON workspaces;
CREATE POLICY "Users can update their workspaces" ON workspaces
FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their workspaces" ON workspaces;
CREATE POLICY "Users can delete their workspaces" ON workspaces
FOR DELETE USING (owner_id = auth.uid());


-- 2. Board Management
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view accessible boards" ON boards;
CREATE POLICY "Users can view accessible boards" ON boards
FOR SELECT USING (
  workspace_id IN (SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()) OR
  workspace_id IN (SELECT m.workspace_id FROM workspace_members m WHERE m.user_id = auth.uid()) OR
  id IN (SELECT bm.board_id FROM board_members bm WHERE bm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create boards" ON boards;
CREATE POLICY "Users can create boards" ON boards
FOR INSERT WITH CHECK (
  workspace_id IN (SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()) OR
  workspace_id IN (SELECT m.workspace_id FROM workspace_members m WHERE m.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their boards" ON boards;
CREATE POLICY "Users can update their boards" ON boards
FOR UPDATE USING (
  workspace_id IN (SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()) OR
  id IN (SELECT bm.board_id FROM board_members bm WHERE bm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their boards" ON boards;
CREATE POLICY "Users can delete their boards" ON boards
FOR DELETE USING (
  workspace_id IN (SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()) OR
  id IN (SELECT bm.board_id FROM board_members bm WHERE bm.user_id = auth.uid())
);


-- 3. Groups Management
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage groups" ON groups;
CREATE POLICY "Users can manage groups" ON groups
FOR ALL USING (
  board_id IN (SELECT b.id FROM boards b WHERE 
    b.workspace_id IN (SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()) OR
    b.id IN (SELECT bm.board_id FROM board_members bm WHERE bm.user_id = auth.uid())
  )
);


-- 4. Columns Management
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage columns" ON columns;
CREATE POLICY "Users can manage columns" ON columns
FOR ALL USING (
  board_id IN (SELECT b.id FROM boards b WHERE 
    b.workspace_id IN (SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()) OR
    b.id IN (SELECT bm.board_id FROM board_members bm WHERE bm.user_id = auth.uid())
  )
);


-- 5. Items Management
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage items" ON items;
CREATE POLICY "Users can manage items" ON items
FOR ALL USING (
  board_id IN (SELECT b.id FROM boards b WHERE 
    b.workspace_id IN (SELECT w.id FROM workspaces w WHERE w.owner_id = auth.uid()) OR
    b.id IN (SELECT bm.board_id FROM board_members bm WHERE bm.user_id = auth.uid())
  )
);
