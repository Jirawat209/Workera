-- =====================================================
-- Fix Activity Log RLS V2: Guaranteed Access
-- =====================================================

-- 1. Grant explicit permissions (Idempotent)
GRANT ALL ON TABLE activity_logs TO authenticated;
GRANT ALL ON TABLE activity_logs TO service_role;
-- Sequence grant removed (UUID primary key)

-- 2. Drop PREVIOUS policies to clear conflicts
DROP POLICY IF EXISTS "Authenticated users can create activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can view their own activities" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs; -- Drop potential duplicates

-- 3. Create SIMPLE Insert Policy (Permissive)
-- Allow ANY authenticated user to insert. We will secure data integrity via Trigger.
CREATE POLICY "allow_insert_authenticated"
    ON activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 4. Create Select Policy (Visibility)
CREATE POLICY "allow_select_own_and_related"
    ON activity_logs
    FOR SELECT
    TO authenticated
    USING (
      -- 1. Users can see logs where they are the ACTOR
      actor_id = auth.uid()
      OR
      -- 2. Users can see logs for Boards they are members of (covers Board & Item logs)
      EXISTS (
        SELECT 1 FROM board_members bm
        WHERE bm.user_id = auth.uid()
        AND (
            -- Direct Board Match
            (activity_logs.target_type = 'board' AND bm.board_id = activity_logs.target_id)
            OR
            -- Item Match (via Item -> Board)
            (activity_logs.target_type = 'item' AND EXISTS (
                SELECT 1 FROM items i 
                WHERE i.id = activity_logs.target_id 
                AND i.board_id = bm.board_id
            ))
            OR
             -- Fallback: Check metadata for board_id (faster if indexed/available)
            (activity_logs.metadata->>'board_id' = bm.board_id::text)
        )
      )
      OR
      -- 3. Admins see everything
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.system_role IN ('super_admin', 'it_admin')
      )
    );

-- 5. Force Actor ID Trigger (Security)
-- Even though policy allows any insert, this trigger ensures actor_id ALWAYS matches the actual user.
CREATE OR REPLACE FUNCTION set_activity_log_actor()
RETURNS TRIGGER AS $$
BEGIN
   NEW.actor_id := auth.uid();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS force_actor_id ON activity_logs;
CREATE TRIGGER force_actor_id
    BEFORE INSERT ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_activity_log_actor();
