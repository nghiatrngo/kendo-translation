'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [mode] = useState<'login'>('login')
    const router = useRouter()
    const searchParams = useSearchParams()

    // Check for role-based error messages from middleware redirect
    const roleError = searchParams.get('error')
    const roleMessage = searchParams.get('message')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const endpoint = '/api/auth/login'
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            let data
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                data = await response.json()
            } else {
                // If response is not JSON (e.g. 404 HTML from stale deploy), throw specific error
                const text = await response.text()
                console.error('Unexpected non-JSON response:', text.substring(0, 100))
                throw new Error(
                    response.status === 404 
                        ? 'Login service not found. The application might be updating.' 
                        : 'Server error. Please try again later.'
                )
            }

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed')
            }

            // Redirect to original destination or home
            const redirectTo = searchParams.get('redirectTo') || '/'
            router.push(redirectTo)
            router.refresh()
        } catch (err) {
            console.error('Login error:', err)
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                🔐 Login
            </h1>

            {/* Role-based access error from middleware */}
            {roleError && roleMessage && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium">
                        ⚠️ {roleMessage}
                    </p>
                    <p className="text-xs mt-1 opacity-80">
                        {roleError === 'admin_required'
                            ? 'Only administrators can access this page.'
                            : 'Translator or Admin access is required for translation features.'}
                    </p>
                </div>
            )}

            {error && (
                <div className={`${error.includes('Check your email') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} border rounded-lg p-4 mb-6`}>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                        suppressHydrationWarning
                        autoComplete="email"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        minLength={6}
                        suppressHydrationWarning
                        autoComplete="current-password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
                >
                    {loading ? 'Loading...' : 'Sign In'}
                </button>
            </form>

            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
                Don't have an account? Contact an administrator.
            </p>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <Suspense fallback={
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    )
}
