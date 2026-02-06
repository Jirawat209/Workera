-- =====================================================
-- Fix: Grant Permissions on activity_logs
-- =====================================================

-- 1. Grant table permissions to authenticated users
GRANT ALL ON TABLE activity_logs TO authenticated;
GRANT ALL ON TABLE activity_logs TO service_role;

-- 2. Ensure RLS is enabled
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing insert policy to replace it
DROP POLICY IF EXISTS "Authenticated users can create activity logs" ON activity_logs;

-- 4. Re-create Insert Policy (Strict: can only log as themselves)
CREATE POLICY "Authenticated users can create activity logs"
    ON activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = actor_id);

-- 5. Drop existing select policy to replace/ensure
DROP POLICY IF EXISTS "Users can view their own activities" ON activity_logs;

-- 6. Re-create Select Policy (Users can see logs where they are the actor OR if they have access to the target - complicated, sticking to actor/admin for now as per original setup)
CREATE POLICY "Users can view their own activities"
    ON activity_logs
    FOR SELECT
    TO authenticated
    USING (
      -- Admin
      (SELECT system_role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'it_admin')
      OR
      -- Own activity
      actor_id = auth.uid()
      OR
      -- Allow viewing logs for boards they are members of (Critical for Task Activity Log!)
      (
        target_type = 'item' AND EXISTS (
           SELECT 1 FROM board_members bm
           JOIN items i ON i.board_id = bm.board_id
           WHERE i.id = activity_logs.target_id
           AND bm.user_id = auth.uid()
        )
      )
      OR
       -- Allow viewing logs for boards they are members of (Board Scope)
      (
        target_type = 'board' AND EXISTS (
           SELECT 1 FROM board_members bm
           WHERE bm.board_id = activity_logs.target_id
           AND bm.user_id = auth.uid()
        )
      )
);
