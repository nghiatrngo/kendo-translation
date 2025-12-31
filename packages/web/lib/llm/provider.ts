/**
 * LLM Provider Abstraction Layer
 * 
 * Ported from mARTr/annotation_platform/src/lib/llm/provider.ts
 * Supports OpenAI and OpenRouter with per-agent model configuration
 */

export interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: "text" | "json";
}

export interface ChatResponse {
    content: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}

export interface LLMProvider {
    chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
    getDefaultModel(): string;
}

/**
 * OpenAI Provider
 */
class OpenAIProvider implements LLMProvider {
    private apiKey: string;
    private baseUrl = "https://api.openai.com/v1";

    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || "";
    }

    getDefaultModel(): string {
        return "gpt-4o";
    }

    async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
        const model = options?.model?.replace("openai/", "") || this.getDefaultModel();

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options?.temperature ?? 0.3,
                max_tokens: options?.maxTokens,
                response_format:
                    options?.responseFormat === "json"
                        ? { type: "json_object" }
                        : undefined,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || "",
            model: data.model,
            usage: data.usage
                ? {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                }
                : undefined,
        };
    }
}

/**
 * OpenRouter Provider (default)
 * 
 * Provides access to multiple models including Claude, GPT-4, Gemini, Llama
 */
class OpenRouterProvider implements LLMProvider {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY || "";
        this.baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
    }

    getDefaultModel(): string {
        return "meta-llama/llama-3.3-70b-instruct:free";
    }

    async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
        const model = options?.model || this.getDefaultModel();

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
                "HTTP-Referer": "https://kendo-translation.local",
                "X-Title": "Kendo Translation Platform",
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options?.temperature ?? 0.3,
                max_tokens: options?.maxTokens,
                response_format:
                    options?.responseFormat === "json"
                        ? { type: "json_object" }
                        : undefined,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || "",
            model: data.model,
            usage: data.usage
                ? {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                }
                : undefined,
        };
    }
}

// Provider instances (singleton pattern)
let openaiProvider: OpenAIProvider | null = null;
let openrouterProvider: OpenRouterProvider | null = null;

/**
 * Get the configured LLM provider
 */
export function getProvider(providerType?: "openai" | "openrouter"): LLMProvider {
    const type = providerType || (process.env.LLM_PROVIDER as "openai" | "openrouter") || "openrouter";

    if (type === "openai") {
        if (!openaiProvider) {
            openaiProvider = new OpenAIProvider();
        }
        return openaiProvider;
    }

    if (!openrouterProvider) {
        openrouterProvider = new OpenRouterProvider();
    }
    return openrouterProvider;
}

/**
 * Agent types supported by the system
 */
export type AgentType = "translation" | "analysis" | "reflection" | "ja_en_specialist";

/**
 * Get model configuration for a specific agent
 */
export function getAgentModel(agentType: AgentType): string {
    const envKey = `${agentType.toUpperCase()}_AGENT_MODEL`;
    return process.env[envKey] || getProvider().getDefaultModel();
}

/**
 * Get provider for a specific agent based on its configured model
 */
export function getAgentProvider(
    agentType: AgentType
): { provider: LLMProvider; model: string } {
    const model = getAgentModel(agentType);

    // Determine provider from model prefix
    if (model.startsWith("openai/") || model.startsWith("gpt-")) {
        return { provider: getProvider("openai"), model };
    }

    // OpenRouter handles all other models (anthropic/, google/, meta-llama/, etc.)
    return { provider: getProvider("openrouter"), model };
}

/**
 * Helper to make a chat request with agent-specific configuration
 * Now includes logging for debugging and transparency
 */
export async function agentChat(
    agentType: AgentType,
    messages: Message[],
    options?: Omit<ChatOptions, "model">
): Promise<ChatResponse> {
    const { provider, model } = getAgentProvider(agentType);
    const startTime = Date.now();

    try {
        const response = await provider.chat(messages, { ...options, model });

        // Log successful call (dynamic import to avoid circular deps)
        const { logAgentCall } = await import('./agent-logger');
        logAgentCall({
            agentType,
            messages,
            response: response.content,
            model: response.model,
            usage: response.usage,
            durationMs: Date.now() - startTime,
        });

        return response;
    } catch (error) {
        // Log failed call
        const { logAgentCall } = await import('./agent-logger');
        logAgentCall({
            agentType,
            messages,
            response: '',
            model,
            durationMs: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}

/**
 * Simple chat helper using default provider
 */
export async function chat(
    messages: Message[],
    options?: ChatOptions
): Promise<ChatResponse> {
    const provider = getProvider();
    return provider.chat(messages, options);
}
