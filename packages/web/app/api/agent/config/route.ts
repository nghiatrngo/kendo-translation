/**
 * Agent Configuration API
 * 
 * GET /api/agent/config - Returns current configuration
 * PUT /api/agent/config - Updates agent configuration (persisted to localStorage via client)
 */

import { NextRequest, NextResponse } from 'next/server';

// Available models for selection
export const AVAILABLE_MODELS = [
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

    return NextResponse.json({
        configs,
        defaultProvider: process.env.LLM_PROVIDER || 'openrouter',
        defaultModel,
        availableModels: AVAILABLE_MODELS,
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

        // Validate each config entry
        for (const config of configs) {
            if (!config.agentType || !config.model) {
                return NextResponse.json(
                    { error: `Invalid config for agent: ${config.agentType}` },
                    { status: 400 }
                );
            }

            // Check if model is in available list
            const validModel = AVAILABLE_MODELS.find(m => m.id === config.model);
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
