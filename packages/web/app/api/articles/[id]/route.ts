import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { data: article, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Article not found' }, { status: 404 })
            }
            console.error('Error fetching article:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ article })
    } catch (error) {
        console.error('Error in article GET:', error)
        return NextResponse.json(
            { error: 'Failed to fetch article' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const body = await request.json()

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { title, content_ja, content_en } = body

        const { data: article, error } = await supabase
            .from('articles')
            .update({
                title,
                content_ja,
                content_en,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating article:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ article })
    } catch (error) {
        console.error('Error in article PUT:', error)
        return NextResponse.json(
            { error: 'Failed to update article' },
            { status: 500 }
        )
    }
}
