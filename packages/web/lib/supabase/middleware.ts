import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Public paths that don't require authentication
    const publicPaths = ['/login', '/auth', '/api/auth']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // Redirect unauthenticated users to login
    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
    }

    // Role-based access control
    if (user) {
        // Fetch user's profile to get role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const userRole = profile?.role || 'reader'

        // Routes that require specific roles
        const isAdminOnly = pathname.startsWith('/admin')
        const isTranslatorRequired = pathname.startsWith('/translate')

        // Admin-only routes
        if (isAdminOnly && userRole !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('error', 'admin_required')
            url.searchParams.set('message', 'Admin access required')
            return NextResponse.redirect(url)
        }

        // Translator routes (admin or translator allowed)
        if (isTranslatorRequired && userRole === 'reader') {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('error', 'translator_required')
            url.searchParams.set('message', 'Translator access required')
            return NextResponse.redirect(url)
        }
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
}
