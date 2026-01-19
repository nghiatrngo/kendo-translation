
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Missing config' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError || !users) {
        return NextResponse.json({ error: listError?.message }, { status: 400 })
    }

    const results = []
    const wenqianId = users.find(u => u.email === 'wenqian@test.com')?.id

    for (const user of users) {
        const newPassword = (user.email === 'wenqian@test.com') ? '11011995' : 'test-password'
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        )

        results.push({
            email: user.email,
            id: user.id,
            status: updateError ? 'Failed' : 'Updated',
            error: updateError?.message
        })
    }

    return NextResponse.json({ results })
}
