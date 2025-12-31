/**
 * MAC-RAG Context Builder
 * Phase 0: Build context object from source text for translation pipeline
 */

// === TYPE DEFINITIONS ===

export type SourceLanguage = 'ja' | 'en';
export type TargetLanguage = 'ja' | 'en';

export type DomainType = 'kendo' | 'martial_arts' | 'technical' | 'general';
export type FormalityLevel = 'formal' | 'semi_formal' | 'casual' | 'colloquial';
export type ToneType = 'instructional' | 'narrative' | 'conversational' | 'technical';

export interface Entity {
    text: string;
    type: 'term' | 'person' | 'organization' | 'technique' | 'equipment';
    translation?: string;
    confidence: number;
}

export interface DomainClassification {
    primary: DomainType;
    secondary?: DomainType;
    confidence: number;
    indicators: string[];
}

export interface StyleProfile {
    formality: FormalityLevel;
    tone: ToneType;
    audience: 'beginner' | 'intermediate' | 'advanced' | 'general';
    keigoLevel?: 'sonkeigo' | 'teineigo' | 'kenjogo' | 'casual';
}

export interface ContextObject {
    // Core content
    sourceText: string;
    sourceLang: SourceLanguage;
    targetLang: TargetLanguage;

    // Analysis results
    domain: DomainClassification;
    style: StyleProfile;
    entities: Entity[];
    keyTerms: string[];

    // Metadata
    segmentCount: number;
    estimatedComplexity: 'low' | 'medium' | 'high';
    createdAt: Date;
}

// === CONTEXT BUILDER ===

export interface BuildContextOptions {
    sourceText: string;
    sourceLang?: SourceLanguage;
    targetLang?: TargetLanguage;
}

/**
 * Detect language from text (basic heuristic)
 */
export function detectLanguage(text: string): SourceLanguage {
    // Check for Japanese characters (hiragana, katakana, kanji)
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const hasJapanese = japaneseRegex.test(text);

    // Count Japanese vs Latin characters
    const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;

    return japaneseChars > latinChars ? 'ja' : 'en';
}

/**
 * Count segments (sentences) in text
 */
export function countSegments(text: string, lang: SourceLanguage): number {
    if (lang === 'ja') {
        // Japanese sentence endings
        const segments = text.split(/[。！？\n]+/).filter(s => s.trim().length > 0);
        return segments.length || 1;
    } else {
        // English sentence endings
        const segments = text.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
        return segments.length || 1;
    }
}

/**
 * Build a context object from source text
 * This is the main entry point for Phase 0: Context Initialization
 */
export async function buildContext(options: BuildContextOptions): Promise<ContextObject> {
    const { sourceText } = options;

    // Detect languages if not provided
    const sourceLang = options.sourceLang || detectLanguage(sourceText);
    const targetLang = options.targetLang || (sourceLang === 'ja' ? 'en' : 'ja');

    // Import analyzers dynamically to avoid circular deps
    const { analyzeDomain, analyzeStyle, extractEntities, extractKeyTerms, estimateComplexity } = await import('./analyzers');

    // Run analysis
    const domain = analyzeDomain(sourceText, sourceLang);
    const style = analyzeStyle(sourceText, sourceLang);
    const entities = extractEntities(sourceText, sourceLang);
    const keyTerms = extractKeyTerms(sourceText, sourceLang);
    const segmentCount = countSegments(sourceText, sourceLang);
    const estimatedComplexity = estimateComplexity(sourceText, sourceLang, entities.length);

    return {
        sourceText,
        sourceLang,
        targetLang,
        domain,
        style,
        entities,
        keyTerms,
        segmentCount,
        estimatedComplexity,
        createdAt: new Date(),
    };
}

/**
 * Serialize context for API transport
 */
export function serializeContext(context: ContextObject): string {
    return JSON.stringify({
        ...context,
        createdAt: context.createdAt.toISOString(),
    });
}

/**
 * Deserialize context from API transport
 */
export function deserializeContext(json: string): ContextObject {
    const parsed = JSON.parse(json);
    return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
    };
}
