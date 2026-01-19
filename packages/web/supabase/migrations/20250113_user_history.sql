
-- Create user_history table if not exists
create table if not exists public.user_history (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    item_type text check (item_type in ('article', 'video')) not null,
    item_id uuid not null, -- references articles(id) or videos(id), but we can't easily enforce polymorphic FK
    item_title text not null, -- denormalized for easier display or we join
    last_position integer default 0, -- sequence/time for videos/articles (e.g. seconds or scroll %)
    visited_at timestamptz default now() not null
);

-- RLS
alter table public.user_history enable row level security;

create policy "Users can view own history"
    on public.user_history for select
    using (auth.uid() = user_id);

create policy "Users can insert own history"
    on public.user_history for insert
    with check (auth.uid() = user_id);

create policy "Users can update own history"
    on public.user_history for update
    using (auth.uid() = user_id);

-- Index for chronological queries
create index if not exists idx_user_history_user_visited on public.user_history(user_id, visited_at desc);
