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

const AGENT_LABELS: Record<string, string> = {
    translation: '🔄 Translation',
    analysis: '🔍 Analysis',
    reflection: '🪞 Reflection',
    ja_en_specialist: '🇯🇵 JA-EN Specialist',
}

const AGENT_DESCRIPTIONS: Record<string, string> = {
    translation: 'Performs core JA→EN translation',
    analysis: 'Analyzes source text complexity',
    reflection: 'Reviews translation quality',
    ja_en_specialist: 'Handles Japanese linguistic features',
}

const LOCAL_STORAGE_KEY = 'kendo-translation-agent-config'

export default function AgentConfigPanel() {
    const [config, setConfig] = useState<ConfigResponse | null>(null)
    const [editedConfigs, setEditedConfigs] = useState<AgentConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [hasChanges, setHasChanges] = useState(false)

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
                setEditedConfigs(data.configs.map(c => ({ ...c })))
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [])

    const handleModelChange = (agentType: string, model: string) => {
        const modelInfo = config?.availableModels.find(m => m.id === model)
        setEditedConfigs(prev => prev.map(c =>
            c.agentType === agentType
                ? { ...c, model, provider: modelInfo?.provider || 'openrouter' }
                : c
        ))
        setHasChanges(true)
        setMessage(null)
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage(null)

        try {
            // Validate with server
            const response = await fetch('/api/agent/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configs: editedConfigs }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to save')
            }

            // Save to localStorage
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(editedConfigs))

            // Update displayed config
            if (config) {
                setConfig({ ...config, configs: editedConfigs })
            }

            setHasChanges(false)
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
            setEditedConfigs(config.configs.map(c => ({
                ...c,
                model: config.defaultModel
            })))
            setHasChanges(true)
            setMessage({ type: 'success', text: 'Reset to default. Click Save to apply.' })
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
                    {hasChanges && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                            Unsaved
                        </span>
                    )}
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

            {/* Agent Cards */}
            <div className="grid gap-3">
                {editedConfigs.map((agent) => (
                    <div
                        key={agent.agentType}
                        className="bg-white border border-gray-200 rounded-lg p-3"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-700">
                                {AGENT_LABELS[agent.agentType] || agent.agentType}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {agent.provider}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                            {AGENT_DESCRIPTIONS[agent.agentType]}
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Model:</label>
                            <select
                                value={agent.model}
                                onChange={(e) => handleModelChange(agent.agentType, e.target.value)}
                                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {config.availableModels.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
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
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={`px-3 py-1.5 text-xs rounded ${hasChanges && !saving
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}
