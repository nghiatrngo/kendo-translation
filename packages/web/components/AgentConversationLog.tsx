'use client'

import { useState, useEffect, useCallback } from 'react'

interface Message {
    role: 'system' | 'user' | 'assistant'
    content: string
}

interface AgentLog {
    id: string
    timestamp: string
    agentType: string
    messages: Message[]
    response: string
    model: string
    usage?: {
        promptTokens: number
        completionTokens: number
    }
    durationMs: number
    error?: string
}

interface LogsResponse {
    logs: AgentLog[]
    stats?: {
        totalCalls: number
        byAgent: Record<string, number>
        totalTokens: number
        avgDurationMs: number
    }
}

const AGENT_COLORS: Record<string, string> = {
    translation: 'bg-blue-100 text-blue-800 border-blue-200',
    analysis: 'bg-green-100 text-green-800 border-green-200',
    reflection: 'bg-purple-100 text-purple-800 border-purple-200',
    ja_en_specialist: 'bg-orange-100 text-orange-800 border-orange-200',
}

const AGENT_ICONS: Record<string, string> = {
    translation: '🔄',
    analysis: '🔍',
    reflection: '🪞',
    ja_en_specialist: '🇯🇵',
}

interface AgentConversationLogProps {
    articleId?: string
    autoRefresh?: boolean
    refreshInterval?: number
}

export default function AgentConversationLog({
    articleId,
    autoRefresh = false,
    refreshInterval = 5000
}: AgentConversationLogProps) {
    const [data, setData] = useState<LogsResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

    const fetchLogs = useCallback(async () => {
        try {
            let url = '/api/agent/logs?stats=true&limit=50'
            if (articleId) {
                // When filtering by article, we want all logs
                // The API will handle the higher limit
                url = `/api/agent/logs?article_id=${articleId}&stats=true`
            }
            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to load logs')
            const result = await response.json()
            setData(result)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLogs()

        if (autoRefresh) {
            const interval = setInterval(fetchLogs, refreshInterval)
            return () => clearInterval(interval)
        }
    }, [fetchLogs, autoRefresh, refreshInterval])

    const toggleExpand = (id: string) => {
        setExpandedLogs(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const truncate = (text: string, length: number) => {
        if (text.length <= length) return text
        return text.substring(0, length) + '...'
    }

    if (loading) {
        return (
            <div className="p-4 text-center text-gray-500">
                <span className="animate-pulse">Loading agent logs...</span>
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

    return (
        <div className="space-y-4">
            {/* Header with Stats */}
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800">💬 Agent Conversation Log</h3>
                <button
                    onClick={fetchLogs}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Stats Bar */}
            {data?.stats && (
                <div className="flex gap-4 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                    <span>Total: <strong>{data.stats.totalCalls}</strong></span>
                    <span>Tokens: <strong>{data.stats.totalTokens.toLocaleString()}</strong></span>
                    <span>Avg: <strong>{data.stats.avgDurationMs}ms</strong></span>
                </div>
            )}

            {/* Logs */}
            {!data?.logs || data.logs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    No agent conversations yet. Click &quot;Get AI Suggestion&quot; to see logs.
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {data.logs.map((log) => {
                        const isExpanded = expandedLogs.has(log.id)
                        const colorClass = AGENT_COLORS[log.agentType] || 'bg-gray-100 text-gray-800 border-gray-200'
                        const icon = AGENT_ICONS[log.agentType] || '🤖'

                        return (
                            <div
                                key={log.id}
                                className={`border rounded-lg ${log.error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                            >
                                {/* Log Header */}
                                <button
                                    onClick={() => toggleExpand(log.id)}
                                    className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded border ${colorClass}`}>
                                            {icon} {log.agentType}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatTime(log.timestamp)}
                                        </span>
                                        {log.error && (
                                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                                Error
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {log.usage && (
                                            <span>{log.usage.promptTokens + log.usage.completionTokens} tokens</span>
                                        )}
                                        <span>{log.durationMs}ms</span>
                                        <span>{isExpanded ? '▼' : '▶'}</span>
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 p-3 space-y-3 text-sm">
                                        {/* Model */}
                                        <div>
                                            <span className="text-xs text-gray-500">Model:</span>{' '}
                                            <code className="text-xs bg-gray-100 px-1 rounded">{log.model}</code>
                                        </div>

                                        {/* Messages */}
                                        {log.messages.map((msg, i) => (
                                            <div key={i} className="space-y-1">
                                                <div className="text-xs font-medium text-gray-600 uppercase">
                                                    {msg.role === 'system' && '📋 System Prompt'}
                                                    {msg.role === 'user' && '👤 User Prompt'}
                                                    {msg.role === 'assistant' && '🤖 Assistant'}
                                                </div>
                                                <div className="bg-gray-50 rounded p-2 text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                    {truncate(msg.content, 500)}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Response */}
                                        {log.response && (
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium text-gray-600 uppercase">
                                                    📤 Response
                                                </div>
                                                <div className="bg-green-50 border border-green-200 rounded p-2 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                    {truncate(log.response, 500)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Error */}
                                        {log.error && (
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium text-red-600 uppercase">
                                                    ❌ Error
                                                </div>
                                                <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
                                                    {log.error}
                                                </div>
                                            </div>
                                        )}

                                        {/* Usage */}
                                        {log.usage && (
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                <span>Prompt: {log.usage.promptTokens} tokens</span>
                                                <span>Completion: {log.usage.completionTokens} tokens</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
