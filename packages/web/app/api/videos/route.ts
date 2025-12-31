import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()

    const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching videos:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(videos || [])
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { youtube_id, title } = await request.json()

    if (!youtube_id || !title) {
        return NextResponse.json({ error: 'Missing requirements' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('videos')
        .insert({ youtube_id, title })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
