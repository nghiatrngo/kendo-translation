'use client'

import { useState, useEffect } from 'react'

interface AgentConfig {
    agentType: string
    model: string
    provider: string
}

interface AvailableModel {
    id: string
    name: string
    provider: string
}

interface ConfigResponse {
    configs: AgentConfig[]
    defaultProvider: string
    defaultModel: string
    availableModels: AvailableModel[]
    settings: {
        temperature: number
        maxTokens: number
    }
}

const LOCAL_STORAGE_KEY = 'kendo-translation-agent-config'

export default function AgentConfigPanel() {
    const [config, setConfig] = useState<ConfigResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Text editor state
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState('')
    const [parseError, setParseError] = useState<string | null>(null)

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/agent/config')
                if (!response.ok) throw new Error('Failed to load config')
                const data: ConfigResponse = await response.json()

                // Check for saved config in localStorage
                const savedConfig = localStorage.getItem(LOCAL_STORAGE_KEY)
                if (savedConfig) {
                    try {
                        const parsed = JSON.parse(savedConfig)
                        // Merge saved models with server config
                        const mergedConfigs = data.configs.map(serverConfig => {
                            const saved = parsed.find((s: AgentConfig) => s.agentType === serverConfig.agentType)
                            return saved ? { ...serverConfig, model: saved.model } : serverConfig
                        })
                        data.configs = mergedConfigs
                    } catch {
                        // Ignore invalid localStorage data
                    }
                }

                setConfig(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [])

    const handleStartEdit = () => {
        if (config) {
            // Format config for editing
            const editableConfig = config.configs.map(c => ({
                agentType: c.agentType,
                model: c.model,
                provider: c.provider
            }))
            setEditText(JSON.stringify(editableConfig, null, 2))
            setParseError(null)
            setIsEditing(true)
        }
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditText('')
        setParseError(null)
    }

    const handleSave = async () => {
        // Validate JSON
        let parsed: AgentConfig[]
        try {
            parsed = JSON.parse(editText)
            if (!Array.isArray(parsed)) {
                throw new Error('Config must be an array')
            }
            for (const item of parsed) {
                if (!item.agentType || !item.model) {
                    throw new Error('Each config must have agentType and model')
                }
            }
        } catch (err) {
            setParseError(err instanceof Error ? err.message : 'Invalid JSON')
            return
        }

        setSaving(true)
        setMessage(null)

        try {
            // Validate with server
            const response = await fetch('/api/agent/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configs: parsed }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to save')
            }

            // Save to localStorage
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed))

            // Update displayed config
            if (config) {
                setConfig({ ...config, configs: parsed })
            }

            setIsEditing(false)
            setMessage({ type: 'success', text: 'Configuration saved! Changes apply to new translations.' })
        } catch (err) {
            setMessage({
                type: 'error',
                text: err instanceof Error ? err.message : 'Failed to save'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        if (config) {
            localStorage.removeItem(LOCAL_STORAGE_KEY)
            const resetConfigs = config.configs.map(c => ({
                ...c,
                model: config.defaultModel
            }))
            setConfig({ ...config, configs: resetConfigs })
            setMessage({ type: 'success', text: 'Reset to default configuration.' })
        }
    }

    if (loading) {
        return (
            <div className="p-4 text-center text-gray-500">
                <span className="animate-pulse">Loading agent configuration...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                Error: {error}
            </div>
        )
    }

    if (!config) return null

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800">⚙️ Agent Configuration</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        Provider: <span className="font-medium">{config.defaultProvider}</span>
                    </span>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-2 rounded text-sm ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {isEditing ? (
                /* Text Editor Mode */
                <div className="space-y-3">
                    <div className="text-xs text-gray-500">
                        Edit the JSON configuration below. Each agent needs <code>agentType</code> and <code>model</code>.
                    </div>
                    <textarea
                        value={editText}
                        onChange={(e) => {
                            setEditText(e.target.value)
                            setParseError(null)
                        }}
                        className="w-full h-64 font-mono text-xs bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        spellCheck={false}
                    />
                    {parseError && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            ❌ {parseError}
                        </div>
                    )}
                    <div className="text-xs text-gray-500">
                        Available models: {config.availableModels.map(m => m.id).join(', ')}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                        >
                            {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                    </div>
                </div>
            ) : (
                /* View Mode */
                <>
                    {/* Current Config Display */}
                    <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                        <pre className="whitespace-pre-wrap">
                            {JSON.stringify(config.configs.map(c => ({
                                agentType: c.agentType,
                                model: c.model
                            })), null, 2)}
                        </pre>
                    </div>

                    {/* Settings (read-only) */}
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700 mb-2">Default Settings</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-gray-500">Temperature:</span>{' '}
                                <span className="text-gray-800">{config.settings.temperature}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Max Tokens:</span>{' '}
                                <span className="text-gray-800">{config.settings.maxTokens}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={handleReset}
                            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        >
                            Reset to Default
                        </button>
                        <button
                            onClick={handleStartEdit}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            ✏️ Edit Configuration
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
