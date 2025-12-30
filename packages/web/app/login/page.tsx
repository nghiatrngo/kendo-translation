export default function LoginPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    🔐 Login
                </h1>

                {/* Placeholder content */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-6">
                    <p className="text-yellow-800 text-sm">
                        🚧 Coming in Iteration 2
                    </p>
                    <p className="text-yellow-600 text-xs mt-1">
                        Supabase Auth integration
                    </p>
                </div>

                {/* Placeholder form */}
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            disabled
                            placeholder="your@email.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            disabled
                            placeholder="••••••••"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled
                        className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed"
                    >
                        Sign In (Coming Soon)
                    </button>
                </form>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Don't have an account?{" "}
                    <span className="text-gray-400">Sign up (Coming Soon)</span>
                </p>
            </div>
        </div>
    );
}
