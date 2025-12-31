import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        console.error('Supabase Env Vars missing!', { url: !!url, key: !!key })
    } else {
        console.log('Supabase Client Initializing with URL:', url)
    }

    const client = createBrowserClient(url!, key!)

    // Debugging: Attach to window
    if (typeof window !== 'undefined') {
        // @ts-ignore
        window.supabase = client
    }

    return client
}
