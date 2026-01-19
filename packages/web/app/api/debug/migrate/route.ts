
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Missing config' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const sql = `
    create table if not exists public.user_history (
        id uuid default gen_random_uuid() primary key,
        user_id uuid references auth.users(id) on delete cascade not null,
        item_type text check (item_type in ('article', 'video')) not null,
        item_id uuid not null, 
        item_title text not null,
        last_position integer default 0,
        visited_at timestamptz default now() not null
    );

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
    
    -- Function to upsert history to keep only latest per item or just insert log?
    -- User wants chronological order of OPENED items. 
    -- If I open Article A today, it is at top. If I open it tomorrow, does it move to top? Yes.
    -- So we should probably 'upsert' based on (user_id, item_type, item_id) updating visited_at.
    -- Let's add that constraint or just handle it in logic. Upsert is better.
    
    alter table public.user_history drop constraint if exists user_history_unique_item;
    alter table public.user_history add constraint user_history_unique_item unique (user_id, item_type, item_id);
    `

    const { error } = await supabase.rpc('exec_sql', { sql }) 
    // Wait, supabase-js doesn't have exec_sql unless we created a function for it. 
    // We usually can't run raw SQL via JS client unless we have a specific RPC.
    // BUT, we can use the 'postgres' library if available or ... 
    // Actually, `supabase.rpc` call requires a function in DB.
    
    // Alternative: We can't easily run DDL via client without the CLI or direct connection.
    // If the project doesn't have an `exec_sql` function exposed, we are stuck.
    
    // Let's assume we MIGHT NOT proceed with this route approach if we can't run SQL.
    // However, for many setups, people might just run it in the SQL Editor of the dashboard.
    // I will try to see if I can just return the SQL for the user to run if I can't run it?
    // OR: I can assume the user has a setup. 
    
    // Let's try to see if there is any existing migration pattern in the repo?
    // No specific pattern seen.
    
    return NextResponse.json({ 
        message: 'Please run the following SQL in your Supabase Dashboard SQL Editor', 
        sql 
    })
}
