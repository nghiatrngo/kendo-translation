import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    // 1. Verify Authentication & Admin Role
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // 2. Parse Request
    const { email, password, role } = await request.json()

    if (!email || !password || !role) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Create User using Service Role Key
    // Note: We create a NEW client with service role because the user's client cannot create other users.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
        console.error('Missing Service Role Key or URL')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Auto-confirm the user
    })

    if (authError) {
        console.error('Error creating user:', authError)
        return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 4. Update Profile Role
    // The trigger might create the profile, but we need to ensure the role is set correctly.
    // Ideally the trigger uses a default, but we want to set it to the requested role immediately.
    // We can update the profile now.
    if (authData.user) {
        const { error: profileError } = await adminClient
            .from('profiles')
            .update({ role })
            .eq('id', authData.user.id)
        
        if (profileError) {
             console.error('Error updating profile role:', profileError)
             // We don't fail the request if user creation succeeded, but we warn
             return NextResponse.json({ 
                 user: authData.user, 
                 warning: 'User created but role update failed. Please update manually.' 
             })
        }
    }

    return NextResponse.json({ user: authData.user, message: 'User created successfully' })
}
