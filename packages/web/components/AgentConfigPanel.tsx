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
    const [defaultPrompts, setDefaultPrompts] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // UI State
    const [activeTab, setActiveTab] = useState<'models' | 'translation' | 'quality'>('models')
    const [activeSubTab, setActiveSubTab] = useState<string>('literal') // for translation approaches

    // Text editor state
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState('')
    const [parseError, setParseError] = useState<string | null>(null)

    // Prompt editor state (keyed by "agentType:approach")
    const [promptEdits, setPromptEdits] = useState<Record<string, string>>({})

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/agent/config')
                if (!response.ok) throw new Error('Failed to load config')
                const data: any = await response.json()

                // Check for saved config in localStorage (Models only)
                const savedConfig = localStorage.getItem(LOCAL_STORAGE_KEY)
                if (savedConfig) {
                    try {
                        const parsed = JSON.parse(savedConfig)
                        const mergedConfigs = data.configs.map((serverConfig: AgentConfig) => {
                            const saved = parsed.find((s: AgentConfig) => s.agentType === serverConfig.agentType)
                            return saved ? { ...serverConfig, model: saved.model } : serverConfig
                        })
                        data.configs = mergedConfigs
                    } catch { }
                }

                // Initialize prompts
                if (!data.prompts) data.prompts = [];

                setConfig(data)
                setDefaultPrompts(data.defaultPrompts || {})

                // Initialize prompt edits with current values or defaults
                const edits: Record<string, string> = {}

                // Helper to set edit
                const setEdit = (key: string, val: string) => { edits[key] = val }

                // Translation
                ['literal', 'natural', 'formal'].forEach(approach => {
                    const custom = data.prompts.find((p: any) => p.agentType === 'translation' && p.approach === approach)
                    setEdit(`translation:${approach}`, custom?.template || data.defaultPrompts[`translation:${approach}`] || '')
                })

                // Quality
                const customQuality = data.prompts.find((p: any) => p.agentType === 'reflection' && (!p.approach || p.approach === 'quality'))
                setEdit('reflection:quality', customQuality?.template || data.defaultPrompts['reflection:quality'] || '')

                setPromptEdits(edits)

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [])

    const handleStartEditModels = () => {
        if (!config) return;
        const editableConfig = config.configs.map(c => ({
            agentType: c.agentType,
            model: c.model,
            provider: c.provider
        }))
        setEditText(JSON.stringify(editableConfig, null, 2))
        setParseError(null)
        setIsEditing(true)
    }

    const handleSaveModels = async () => {
        let parsed: any
        try {
            parsed = JSON.parse(editText)
            if (!Array.isArray(parsed)) throw new Error('Config must be an array')
        } catch (err) {
            setParseError(err instanceof Error ? err.message : 'Invalid JSON')
            return
        }

        setSaving(true)
        setMessage(null)

        try {
            const response = await fetch('/api/agent/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configs: parsed }),
            })

            if (!response.ok) throw new Error('Failed to save')

            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed))
            if (config) setConfig({ ...config, configs: parsed })
            setIsEditing(false)
            setMessage({ type: 'success', text: 'Configuration saved!' })
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save' })
        } finally {
            setSaving(false)
        }
    }

    const handleSavePrompt = async (agentType: string, approach: string) => {
        const key = approach === 'quality' ? 'reflection:quality' : `${agentType}:${approach}`;
        const template = promptEdits[key];

        setSaving(true)
        setMessage(null)

        try {
            const payload = {
                prompts: [{
                    agentType,
                    approach: approach === 'quality' ? undefined : approach, // quality usually doesn't need approach but we can store it or use null
                    template
                }]
            }

            const response = await fetch('/api/agent/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!response.ok) throw new Error('Failed to save prompt')

            setMessage({ type: 'success', text: 'Prompt saved!' })
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save prompt' })
        } finally {
            setSaving(false)
        }
    }

    const handleResetPrompt = (key: string) => {
        setPromptEdits(prev => ({
            ...prev,
            [key]: defaultPrompts[key] || ''
        }))
        setMessage({ type: 'success', text: 'Reset to default (unsaved). Click Save to apply.' })
    }

    if (loading) return <div className="p-4 text-center animate-pulse">Loading config...</div>
    if (error) return <div className="p-4 bg-red-50 text-red-700 rounded">Error: {error}</div>
    if (!config) return null

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800">⚙️ Agent Configuration</h3>
                <div className="flex bg-gray-200 rounded p-1 text-xs">
                    <button
                        className={`px-3 py-1 rounded ${activeTab === 'models' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => { setActiveTab('models'); setIsEditing(false); }}
                    >
                        Models
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${activeTab === 'translation' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => { setActiveTab('translation'); setIsEditing(false); }}
                    >
                        Translation Prompts
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${activeTab === 'quality' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => { setActiveTab('quality'); setIsEditing(false); }}
                    >
                        Quality Prompts
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-2 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* MODELS TAB */}
            {activeTab === 'models' && (
                <div className="space-y-4">
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full h-64 font-mono text-xs p-3 border rounded bg-gray-50"
                            />
                            {parseError && <div className="text-red-600 text-xs">{parseError}</div>}
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs border rounded">Cancel</button>
                                <button onClick={handleSaveModels} disabled={saving} className="px-3 py-1 text-xs bg-blue-600 text-white rounded">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded p-3 font-mono text-xs overflow-auto">
                            <pre>{JSON.stringify(config.configs.map(c => ({ agentType: c.agentType, model: c.model })), null, 2)}</pre>
                            <div className="mt-2 flex justify-end">
                                <button onClick={handleStartEditModels} className="px-3 py-1 text-xs bg-blue-600 text-white rounded">Edit Models</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TRANSLATION PROMPTS TAB */}
            {activeTab === 'translation' && (
                <div className="space-y-4">
                    <div className="flex border-b text-xs">
                        {['literal', 'natural', 'formal'].map(sub => (
                            <button
                                key={sub}
                                className={`px-4 py-2 border-b-2 ${activeSubTab === sub ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500'}`}
                                onClick={() => setActiveSubTab(sub)}
                            >
                                {sub.charAt(0).toUpperCase() + sub.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <textarea
                            value={promptEdits[`translation:${activeSubTab}`] || ''}
                            onChange={(e) => setPromptEdits(prev => ({ ...prev, [`translation:${activeSubTab}`]: e.target.value }))}
                            className="w-full h-80 p-3 border rounded text-xs leading-relaxed font-mono"
                            placeholder="Enter prompt template..."
                        />
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => handleResetPrompt(`translation:${activeSubTab}`)}
                                className="text-xs text-gray-500 hover:text-red-600"
                            >
                                ↺ Reset to Default
                            </button>
                            <button
                                onClick={() => handleSavePrompt('translation', activeSubTab)}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                            >
                                {saving ? 'Saving...' : '💾 Save Prompt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QUALITY PROMPTS TAB */}
            {activeTab === 'quality' && (
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">Prompt used by the Quality/Reflection agent to score translations.</p>
                    <textarea
                        value={promptEdits['reflection:quality'] || ''}
                        onChange={(e) => setPromptEdits(prev => ({ ...prev, 'reflection:quality': e.target.value }))}
                        className="w-full h-80 p-3 border rounded text-xs leading-relaxed font-mono"
                    />
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => handleResetPrompt('reflection:quality')}
                            className="text-xs text-gray-500 hover:text-red-600"
                        >
                            ↺ Reset to Default
                        </button>
                        <button
                            onClick={() => handleSavePrompt('reflection', 'quality')}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        >
                            {saving ? 'Saving...' : '💾 Save Prompt'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
