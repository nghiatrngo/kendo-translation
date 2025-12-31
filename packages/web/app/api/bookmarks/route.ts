import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let query = supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', user.id)

        // Support filtering for status check
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('content_type')
        const id = searchParams.get('content_id')

        if (type && id) {
            query = query.eq('content_type', type).eq('content_id', id)
        }

        const { data: bookmarks, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error('Error querying bookmarks table:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If checking specific bookmark, just return it (no need to enrich)
        if (type && id) {
            return NextResponse.json({ bookmarks: bookmarks || [] })
        }

        // Enrich bookmarks with titles
        try {
            const enrichedBookmarks = await Promise.all(
                (bookmarks || []).map(async (bookmark) => {
                    let title = 'Unknown'
                    try {
                        if (bookmark.content_type === 'article') {
                            const { data } = await supabase
                                .from('articles')
                                .select('title')
                                .eq('id', bookmark.content_id)
                                .single()

                            title = data?.title || 'Article'
                        } else if (bookmark.content_type === 'video') {
                            const { data } = await supabase
                                .from('videos')
                                .select('title')
                                .eq('id', bookmark.content_id)
                                .single()

                            title = data?.title || 'Video'
                        }
                    } catch (error) {
                        // Ignore enrichment errors
                    }
                    return { ...bookmark, title }
                })
            )

            return NextResponse.json({ bookmarks: enrichedBookmarks })
        } catch (error) {
            return NextResponse.json({ bookmarks: bookmarks || [] })
        }
    } catch (error) {
        console.error('Error fetching bookmarks:', error)
        return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { content_type, content_id } = await request.json()

        if (!content_type || !content_id) {
            return NextResponse.json({ error: 'content_type and content_id required' }, { status: 400 })
        }

        const { data: bookmark, error } = await supabase
            .from('bookmarks')
            .insert([{
                user_id: user.id,
                content_type,
                content_id
            }])
            .select()
            .single()

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'Already bookmarked' }, { status: 409 })
            }
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ bookmark }, { status: 201 })
    } catch (error) {
        console.error('Error creating bookmark:', error)
        return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { content_type, content_id } = await request.json()

        const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('content_type', content_type)
            .eq('content_id', content_id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting bookmark:', error)
        return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 })
    }
}
