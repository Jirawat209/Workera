-- Add files column to items table
alter table items 
add column if not exists files jsonb default '[]'::jsonb;
