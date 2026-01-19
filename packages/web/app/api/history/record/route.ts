
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { item_type, item_id, item_title, last_position } = body

    if (!item_type || !item_id || !item_title) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { error } = await supabase
        .from('user_history')
        .upsert({
            user_id: session.user.id,
            item_type,
            item_id,
            item_title,
            last_position: last_position || 0,
            visited_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, item_type, item_id'
        })

    if (error) {
        console.error('Error recording history:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
