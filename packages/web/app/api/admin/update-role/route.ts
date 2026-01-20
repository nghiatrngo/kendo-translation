import { createClient, createAdminClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminSupabase = createAdminClient()
        
        // Verify admin role
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
            
        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { userId, role } = body

        if (!userId || !role) {
            return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
        }

        if (!['admin', 'translator', 'reader'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        const { error } = await adminSupabase
            .from('profiles')
            .update({ role })
            .eq('id', userId)
            
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
