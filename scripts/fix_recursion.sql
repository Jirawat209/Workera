-- Fix Infinite Recursion in RLS Policy
-- The previous policy on `board_members` caused infinite recursion because it queried `board_members` within its own check.
-- Solution: Use a SECURITY DEFINER function to bypass RLS for the membership check.

-- 1. Create a helper function to check membership securely
create or replace function is_board_member(_board_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from board_members
    where board_id = _board_id
    and user_id = auth.uid()
  );
$$;

-- 2. Drop the problematic policy
drop policy if exists "Users can view members of boards they are in" on board_members;

-- 3. Re-create the policy using the secure function
create policy "Users can view members of boards they are in"
  on board_members for select
  using (
    auth.uid() = user_id -- Always allow viewing self
    OR
    is_board_member(board_id) -- Configure to allow viewing other members if you are in the board
  );
