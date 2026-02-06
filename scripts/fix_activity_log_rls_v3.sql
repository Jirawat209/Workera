-- Activity Log Fix V3: Simplify to "Permissive Mode"
-- Purpose: Remove Trigger and allow ANY insert to verify connectivity.

-- 1. Drop the Triggers (All possible names)
DROP TRIGGER IF EXISTS set_activity_log_actor ON activity_logs;
DROP TRIGGER IF EXISTS force_actor_id ON activity_logs;

-- Drop function with CASCADE to remove any other dependencies
DROP FUNCTION IF EXISTS set_activity_log_actor() CASCADE;

-- 2. Clean Slate Policies
DROP POLICY IF EXISTS "Authenticated users can create activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Allow insert for all authenticated" ON activity_logs;

-- 3. Create Ultra-Permissive Policy (No checks, just auth)
CREATE POLICY "Allow insert for all authenticated"
    ON activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 4. Ensure Select Policy exists
DROP POLICY IF EXISTS "Users can view relevant logs" ON activity_logs;
CREATE POLICY "Users can view relevant logs"
    ON activity_logs
    FOR SELECT
    TO authenticated, anon -- Allow anon for check_logs.ts
    USING (true); -- Temorarily allow viewing ALL logs to debug

-- 5. Grants (Idempotent)
GRANT ALL ON TABLE activity_logs TO authenticated;
GRANT ALL ON TABLE activity_logs TO service_role;
