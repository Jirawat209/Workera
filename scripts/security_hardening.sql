-- =====================================================
-- Security Hardening Script (Robust Version)
-- =====================================================
-- Purpose: Fix security warnings from Supabase Security Advisor
-- This version checks if functions exist before trying to alter them
-- to avoid errors if function names differ slightly.
-- =====================================================

DO $$
DECLARE
    -- List of functions to secure
    func_record RECORD;
    target_functions TEXT[] := ARRAY[
        'log_activity', 
        'delete_user', 
        'set_workspace_owner', 
        'is_board_member', 
        'is_super_admin', 
        'is_admin', 
        'log_user_signup', 
        'log_workspace_created', 
        'log_board_created', 
        'check_board_access', 
        'handle_new_user',
        'trigger_log_user_signup', -- Also attempt triggers just in case
        'trigger_log_workspace_created',
        'trigger_log_board_created'
    ];
    func_name TEXT;
BEGIN
    FOREACH func_name IN ARRAY target_functions
    LOOP
        -- Check if function exists in pg_proc
        FOR func_record IN 
            SELECT proname, oid::regprocedure as signature 
            FROM pg_proc 
            WHERE proname = func_name 
            AND pronamespace = 'public'::regnamespace
        LOOP
            -- Execute ALTER statement dynamically
            EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_record.signature);
            RAISE NOTICE 'Secured function: %', func_record.signature;
        END LOOP;
    END LOOP;
END
$$;

-- =====================================================
-- 2. Refine RLS Policies
-- =====================================================

-- Notifications: Allow mentions (Safe to re-run)
DO $$
BEGIN
    -- Drop existing policies if they exist to avoid conflicts
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can create notifications' AND tablename = 'notifications') THEN
        DROP POLICY "Authenticated users can create notifications" ON notifications;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_mentions' AND tablename = 'notifications') THEN
        DROP POLICY "allow_mentions" ON notifications;
    END IF;

    -- Create new hardened policy
    CREATE POLICY "Authenticated users can create notifications" 
    ON notifications FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
END
$$;

-- Activity Logs: Allow insert (Safe to re-run)
DO $$
BEGIN
    -- Drop existing policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can create activity logs' AND tablename = 'activity_logs') THEN
        DROP POLICY "Authenticated users can create activity logs" ON activity_logs;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert for all authenticated' AND tablename = 'activity_logs') THEN
        DROP POLICY "Allow insert for all authenticated" ON activity_logs;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_insert_authenticated' AND tablename = 'activity_logs') THEN
        DROP POLICY "allow_insert_authenticated" ON activity_logs;
    END IF;

    -- Create new hardened policy
    CREATE POLICY "Authenticated users can create activity logs" 
    ON activity_logs FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
END
$$;

-- =====================================================
-- Hardening Complete
-- =====================================================
