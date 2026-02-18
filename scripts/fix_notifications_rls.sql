-- =====================================================
-- Notifications RLS Fix
-- =====================================================
-- Purpose: Enable Row Level Security (RLS) on the notifications table
-- to fix the "Policy Exists RLS Disabled" warning.
-- =====================================================

-- 1. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Verify Policy (Optional - ensure the policy exists)
-- This policy allows users to see their own notifications.
-- If it already exists, this might error or be ignored depending on conflict handling, 
-- but the critical part is likely just enabling RLS.
-- We can recreate it just in case if needed, but usually just enabling RLS is enough.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications"
          ON notifications FOR SELECT
          USING (auth.uid() = user_id);
    END IF;
END
$$;
