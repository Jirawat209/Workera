-- Add last_viewed_at to board_members if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'board_members' and column_name = 'last_viewed_at') then
    alter table board_members add column last_viewed_at timestamp with time zone default now();
  end if;
end $$;
