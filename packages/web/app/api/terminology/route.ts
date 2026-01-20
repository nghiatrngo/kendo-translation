import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const supabase = await createClient()

    let queryBuilder = supabase
        .from('terminology')
        .select('*')
        .order('source_term', { ascending: true })

    if (query) {
        queryBuilder = queryBuilder.or(`source_term.ilike.%${query}%,target_term.ilike.%${query}%,reading.ilike.%${query}%`)
    }

    const { data: terms, error } = await queryBuilder.limit(100)

    if (error) {
        console.error('Error fetching terminology:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(terms || [])
}
