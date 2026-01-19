
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// Script logic
async function generateReport() {
    // If we don't have service role key, we can use the anon key but we likely won't see all users if strict RLS is on.
    // However, the user asked to generate the list.
    // Let's assume we can get profiles using anon key + admin logic OR we need service key.
    
    // Check args
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const useServiceKey = !!serviceRoleKey
    
    if (!useServiceKey) {
        console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not found. Using anon key. Result may be incomplete.')
    }

    const key = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !key) {
        console.error('Missing config')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, key)

    console.log('Fetching profiles...')
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (profileError) {
        console.error('Error fetching profiles:', profileError)
        return
    }

    // Attempt to get emails if we have service key
    let usersMap = {}
    if (useServiceKey) {
        console.log('Fetching auth users...')
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
        if (!authError && users) {
             users.forEach(u => {
                 usersMap[u.id] = u.email
             })
        }
    }

    const reportLines = [
        '# Active Users Report',
        `Generated at: ${new Date().toLocaleString()}`,
        '',
        '| Username | Email | Role | Created At | ID |',
        '| --- | --- | --- | --- | --- |'
    ]

    profiles.forEach(p => {
        const email = usersMap[p.id] || p.email || (useServiceKey ? 'N/A' : '(Hidden)')
        const username = p.username || 'N/A'
        const role = p.role
        const created = new Date(p.created_at).toLocaleDateString()
        reportLines.push(`| ${username} | ${email} | ${role} | ${created} | ${p.id} |`)
    })

    fs.writeFileSync('active_users.md', reportLines.join('\n'))
    console.log('Report generated: active_users.md')
}

generateReport()
