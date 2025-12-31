import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const video_id = searchParams.get('video_id')

    if (!video_id) {
        return NextResponse.json({ error: 'Missing video_id' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ notes: [] })
    }

    const { data, error } = await supabase
        .from('video_notes')
        .select('*')
        .eq('video_id', video_id)
        .eq('user_id', session.user.id)
        .order('start_time', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notes: data || [] })
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
        .from('video_notes')
        .insert({ ...body, user_id: session.user.id })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ note: data })
}

export async function DELETE(request: Request) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Support both query param and body
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')

    if (!id) {
        try {
            const body = await request.json()
            id = body.id
        } catch {
            // No body
        }
    }

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase
        .from('video_notes')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
