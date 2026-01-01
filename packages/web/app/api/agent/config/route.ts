/**
 * Agent Configuration API
 * 
 * GET /api/agent/config - Returns current configuration
 * PUT /api/agent/config - Updates agent configuration (persisted to localStorage via client)
 */

import { NextRequest, NextResponse } from 'next/server';

// Fallback models if API fails
const FALLBACK_MODELS = [
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', provider: 'openrouter' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'openrouter' },
    { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', provider: 'openrouter' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', provider: 'openrouter' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openrouter' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'openrouter' },
];

interface AgentConfig {
    agentType: string;
    model: string;
    provider: string;
}

interface FetchedModel {
    id: string;
    name: string;
    provider: string;
}

// In-memory cache
let cachedModels: FetchedModel[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchModels(): Promise<FetchedModel[]> {
    const now = Date.now();
    if (cachedModels && (now - lastFetchTime < CACHE_TTL)) {
        return cachedModels;
    }

    const provider = process.env.LLM_PROVIDER || 'openrouter';
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.warn('No API key found, using fallback models');
        return FALLBACK_MODELS;
    }

    try {
        let models: FetchedModel[] = [];

        if (provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
            const data = await res.json();
            models = data.data.map((m: any) => ({
                id: m.id,
                name: m.id, // OpenAI doesn't provide friendly names in list
                provider: 'openai'
            }));
        } else {
            // Default to OpenRouter
            const res = await fetch('https://openrouter.ai/api/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!res.ok) throw new Error(`OpenRouter API error: ${res.statusText}`);
            const data = await res.json();
            models = data.data.map((m: any) => ({
                id: m.id,
                name: m.name || m.id,
                provider: 'openrouter'
            }));
        }

        // Sort by name
        models.sort((a, b) => a.name.localeCompare(b.name));

        cachedModels = models;
        lastFetchTime = now;
        return models;
    } catch (error) {
        console.error('Failed to fetch models:', error);
        return cachedModels || FALLBACK_MODELS;
    }
}

export async function GET() {
    const agentTypes = ['translation', 'analysis', 'reflection', 'ja_en_specialist'];
    const defaultModel = process.env.LLM_PROVIDER === 'openai'
        ? 'gpt-4o'
        : 'meta-llama/llama-3.3-70b-instruct:free';

    const configs: AgentConfig[] = agentTypes.map(agentType => {
        const envKey = `${agentType.toUpperCase()}_AGENT_MODEL`;
        const model = process.env[envKey] || defaultModel;

        // Determine provider from model prefix
        let provider = 'openrouter';
        if (model.startsWith('openai/') || model.startsWith('gpt-')) {
            provider = 'openai';
        }

        return {
            agentType,
            model,
            provider,
        };
    });

    const availableModels = await fetchModels();

    return NextResponse.json({
        configs,
        defaultProvider: process.env.LLM_PROVIDER || 'openrouter',
        defaultModel,
        availableModels,
        settings: {
            temperature: 0.3,
            maxTokens: 4096,
        },
    });
}

/**
 * PUT /api/agent/config
 * 
 * Note: Server-side env vars cannot be modified at runtime.
 * This endpoint validates the request and returns the intended config.
 * Actual persistence is handled client-side via localStorage.
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { configs } = body;

        if (!configs || !Array.isArray(configs)) {
            return NextResponse.json(
                { error: 'Invalid config format' },
                { status: 400 }
            );
        }

        const availableModels = await fetchModels();

        // Validate each config entry
        for (const config of configs) {
            if (!config.agentType || !config.model) {
                return NextResponse.json(
                    { error: `Invalid config for agent: ${config.agentType}` },
                    { status: 400 }
                );
            }

            // Check if model is in available list (fetched)
            // Note: We might want to allow "unknown" models if the user knows what they are doing,
            // but for now strict validation protects against typos.
            // If the cache is stale, they might need to wait 5m or restart? 
            // Better: if validation fails, try force-refreshing the cache once?
            let validModel = availableModels.find(m => m.id === config.model);

            if (!validModel) {
                // Try one refresh if finding fails, in case it's a brand new model
                if (Date.now() - lastFetchTime > 5000) { // Don't spam refresh
                    cachedModels = null; // Invalidate
                    const freshModels = await fetchModels();
                    validModel = freshModels.find(m => m.id === config.model);
                }
            }

            if (!validModel) {
                return NextResponse.json(
                    { error: `Unknown model: ${config.model}` },
                    { status: 400 }
                );
            }
        }

        // Return validated config (client will persist to localStorage)
        return NextResponse.json({
            success: true,
            configs,
            message: 'Configuration validated. Save to apply.',
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update config' },
            { status: 500 }
        );
    }
}
