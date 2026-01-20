import { createClient, createAdminClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

        // Fetch all profiles
        const { data: profiles, error } = await adminSupabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            
        if (error) {
            console.error('Error fetching profiles:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json({ profiles })
    } catch (error) {
        console.error('Admin users API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
