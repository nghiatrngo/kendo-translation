'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                setError('Check your email for the confirmation link!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error

                // Redirect to original destination or home
                const redirectTo = searchParams.get('redirectTo') || '/'
                router.push(redirectTo)
                router.refresh()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                🔐 {mode === 'login' ? 'Login' : 'Sign Up'}
            </h1>

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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
                >
                    {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
            </form>

            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-blue-600 hover:underline"
                >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
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
