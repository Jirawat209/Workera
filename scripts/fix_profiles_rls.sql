-- Allow all authenticated users to read profiles
-- This is necessary so that board members can see the profile details (name, avatar) of the board owner and other members.

-- First, drop existing policy if it conflicts (or create a new one)
-- drop policy if exists "Public profiles are viewable by everyone" on profiles;
-- drop policy if exists "Users can see all profiles" on profiles;

-- Create policy allowing Select for all authenticated users
create policy "Authenticated users can see all profiles"
  on profiles for select
  using (auth.role() = 'authenticated');

-- Also ensure board_members is readable (usually it is, but just in case)
alter table board_members enable row level security;

create policy "Users can view members of boards they are in"
  on board_members for select
  using (
    -- User can see rows where they are the user
    auth.uid() = user_id
    OR
    -- OR user can see rows for a board they are a member of
    exists (
      select 1 from board_members bm
      where bm.board_id = board_members.board_id
      and bm.user_id = auth.uid()
    )
  );
