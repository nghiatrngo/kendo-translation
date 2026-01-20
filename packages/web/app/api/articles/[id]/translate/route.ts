import { createClient } from '../../../../../lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
    params: Promise<{ id: string }>
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

        const { content_en, translation_status, quality_score } = body

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        }

        if (content_en !== undefined) updateData.content_en = content_en
        if (translation_status !== undefined) updateData.translation_status = translation_status
        if (quality_score !== undefined) updateData.quality_score = quality_score

        const { data: article, error } = await supabase
            .from('articles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error saving translation:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            article,
            message: 'Translation saved successfully'
        })
    } catch (error) {
        console.error('Error in translate PUT:', error)
        return NextResponse.json(
            { error: 'Failed to save translation' },
            { status: 500 }
        )
    }
}
