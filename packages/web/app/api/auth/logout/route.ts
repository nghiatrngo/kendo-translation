import { createClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    // Create response and clear cookies manually to ensure logout on client
    const response = NextResponse.json({ success: true })

    // Defer to supabase client to handle cookie clearing via the cookie store
    // handled by createClient

    return response
}
