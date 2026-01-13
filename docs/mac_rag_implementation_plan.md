# MAC-RAG Translation System: Implementation Plan

**Version 1.0 | December 2024**  
**Status**: ✅ Implemented (January 2025)

---

## Overview

This document outlines a breadth-first implementation plan for the MAC-RAG (Multilingual Agent Collaboration for RAG-based Translation) system, organized into 3 main phases following the project description architecture.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MAC-RAG TRANSLATION PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐│
│  │   PRE-TRANSLATION   │ → │    TRANSLATION      │ → │  POST-TRANSLATION   ││
│  │     (Phase 0-2)     │   │     (Phase 3)       │   │     (Phase 4)       ││
│  ├─────────────────────┤   ├─────────────────────┤   ├─────────────────────┤│
│  │ • Context Init      │   │ • LLM Inference     │   │ • Quality Assessment││
│  │ • RAG Retrieval     │   │ • Multi-candidate   │   │ • Memory Update     ││
│  │ • Context Pairing   │   │   generation        │   │ • Feedback Loop     ││
│  │ • User Review Panel │   │ • User selection    │   │ • User DB decisions ││
│  └─────────────────────┘   └─────────────────────┘   └─────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: PRE-TRANSLATION (Context Building)

### 1.1 Phase 0 - Context Initialization

Analyze source text to establish baseline understanding before retrieval.

| Component             | Description                        | Output                                        |
| --------------------- | ---------------------------------- | --------------------------------------------- |
| **Semantic Analyzer** | Initial analysis of source text    | Key concepts, entities, domain indicators     |
| **Domain Classifier** | Determine content domain           | Domain tag (legal, medical, technical, kendo) |
| **Style Detector**    | Identify formality and tone        | Style profile (formal/casual, audience)       |
| **TM Loader**         | Load relevant translation memories | Active TM context                             |

**Context Object Structure:**

```typescript
interface ContextObject {
  sourceText: string;
  sourceLang: "ja" | "en";
  targetLang: "ja" | "en";
  domain: DomainClassification;
  style: StyleProfile;
  entities: Entity[];
  keyTerms: string[];
  audienceProfile?: AudienceProfile;
}
```

### 1.2 Phase 1 - Contextual Retrieval (RAG)

Retrieve relevant context from multiple sources.

| Source                   | Query Method             | Relevancy Threshold |
| ------------------------ | ------------------------ | ------------------- |
| **Translation Memory**   | Semantic + BM25 hybrid   | ≥70% fuzzy match    |
| **Terminology Database** | Exact + fuzzy term match | ≥80% confidence     |
| **Domain Corpus**        | Semantic similarity      | ≥60% relevance      |
| **Cross-Lingual KB**     | Entity-based lookup      | Direct match        |

**Retrieval Results Structure:**

```typescript
interface RetrievalResults {
  tmMatches: TMMatch[]; // Previous translations
  terminology: TermEntry[]; // Required terms
  corpusExamples: CorpusExample[]; // Domain examples
  crossLingualRefs: Reference[]; // Wikipedia/Wikidata links
  coverageReport: CoverageReport; // What's covered/missing
}
```

### 1.3 Phase 2 - Multilingual Context Pairing

Synthesize retrieved information into unified context.

```
Retrieved Segments (JA + EN)
         ↓
┌─────────────────────────────────┐
│     Context Pairing Engine      │
├─────────────────────────────────┤
│ 1. Semantic Alignment           │ ← Match JA-EN pairs by meaning
│ 2. Context Weighting            │ ← Rank by relevance, recency
│ 3. Gap Identification           │ ← Flag missing coverage
│ 4. Context Synthesis            │ ← Create unified prompt context
└─────────────────────────────────┘
         ↓
   Paired Multilingual Context
```

### 1.4 Context Builder UI Panel

**User-facing panel for reviewing and editing context before translation.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTEXT BUILDER PANEL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─── Source Analysis ──────────────────────────────────────────────────┐  │
│  │ Domain: [Kendo - Technical ▼]     Style: [Formal ▼]                  │  │
│  │ Entities: 竹刀(shinai), 面(men), 構え(kamae)  [+ Add] [Edit]        │  │
│  │ Key Terms: 7 detected  [View All]                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─── Translation Memory Matches ────────────────────────────────────────┐ │
│  │ ☑ "正しい構えを..." → "The correct stance..." (92% match)    [Remove]│ │
│  │ ☑ "竹刀の握り方..." → "How to grip the shinai..." (87% match)[Remove]│ │
│  │ ☐ "基本的な打ち..." → "Basic striking..." (71% match)         [Add]  │ │
│  │                                                      [+ Add Custom TM] │ │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─── Terminology Constraints ───────────────────────────────────────────┐ │
│  │ REQUIRED:                                                             │ │
│  │   竹刀 → shinai  [Edit]    面 → men  [Edit]    小手 → kote  [Edit]   │ │
│  │ DO NOT TRANSLATE:                                                     │ │
│  │   剣道, suburi, keiko                                    [+ Add Term] │ │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─── Domain Corpus Examples ────────────────────────────────────────────┐ │
│  │ ☑ Example 1: [Kurita Sensei video transcript]                 [View] │ │
│  │ ☑ Example 2: [Beginner's Guide - Stance section]              [View] │ │
│  │                                                    [+ Add From Corpus] │ │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─── Coverage Gaps ─────────────────────────────────────────────────────┐ │
│  │ ⚠ No TM match for: "足さばき" (footwork)                             │ │
│  │ ⚠ Term not in glossary: "踏み込み" (fumikomi)           [Add to DB]  │ │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Context Summary: 2 TM matches, 5 terms, 2 examples, 2 gaps          │  │
│  │                                                                      │  │
│  │  [Reset Context]           [Save as Preset]       [→ Start Translation]│ │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**User Actions:**

- ✅ Add/remove TM matches from context
- ✅ Edit terminology mappings
- ✅ Add custom terms to constraints
- ✅ Include/exclude corpus examples
- ✅ Resolve coverage gaps before translation
- ✅ Save context as reusable preset

---

## Phase 2: TRANSLATION (LLM Inference)

### 2.1 Phase 3 - Translation Inference

Generate translation using synthesized multilingual context.

**Prompt Template:**

```
SYSTEM: You are an expert {domain} translator for {source_lang} to {target_lang}.
Register: {formality_level}
Audience: {audience_description}

CONTEXT:
## Translation Memory References
{tm_matches with match percentages}

## Terminology Constraints
REQUIRED: {required_terms}
DO NOT TRANSLATE: {preserve_terms}

## Domain Examples
{corpus_examples}

TASK:
Translate the following text:

SOURCE: {source_text}

TRANSLATION:
```

**Multi-Candidate Generation:**
| Candidate | Approach | Use Case |
|-----------|----------|----------|
| Candidate A | Literal/Faithful | Technical documentation |
| Candidate B | Adaptive/Natural | Marketing, creative |
| Candidate C | Formal | Business, legal |

**Translation UI:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TRANSLATION CANDIDATES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Source (JA):                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 正しい構えとは、竹刀を正しく握り、相手に対して正中線を意識する      │  │
│  │ ことから始まります。                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ○ Candidate A (Literal) - Confidence: 0.87                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ A correct stance begins with properly gripping the shinai and being  │  │
│  │ aware of the center line toward the opponent.                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ● Candidate B (Natural) - Confidence: 0.91 ← RECOMMENDED                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ The proper stance starts with holding your shinai correctly while   │  │
│  │ maintaining awareness of the centerline facing your opponent.        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ○ Candidate C (Formal) - Confidence: 0.84                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ The correct posture commences with the proper grip upon the shinai,  │  │
│  │ orienting oneself toward the opponent along the central axis.        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [Edit Selected]    [Regenerate]    [→ Accept & Continue to Post-Process]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 3: POST-TRANSLATION (Quality & Memory)

### 3.1 Phase 4 - Quality Assessment

Evaluate translation quality using automated metrics.

| Metric                     | Description                        | Weight |
| -------------------------- | ---------------------------------- | ------ |
| **Fluency Score**          | Natural reading in target language | 0.30   |
| **Adequacy Score**         | Meaning preservation from source   | 0.35   |
| **Terminology Compliance** | Required terms used correctly      | 0.20   |
| **Style Consistency**      | Matches requested formality/tone   | 0.15   |

**LLM-Assisted Scoring:**

```
SYSTEM: You are a translation quality evaluator.

Evaluate this translation:
SOURCE: {source}
TRANSLATION: {translation}
TERMINOLOGY REQUIREMENTS: {terms}

Score each dimension (0.0-1.0):
1. Fluency: Does it read naturally?
2. Adequacy: Is meaning preserved?
3. Terminology: Are required terms used?
4. Style: Does it match the requested register?

Provide:
- Overall score (weighted average)
- Specific issues found
- Improvement suggestions
```

### 3.2 Memory Update Decisions

**User controls what gets saved to databases.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      POST-TRANSLATION: DATABASE UPDATE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─── Quality Assessment Results ────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  Overall Score: 0.89 ████████████████████░░░░  HIGH QUALITY           │ │
│  │                                                                       │ │
│  │  Fluency:     0.92 ████████████████████░░░░                          │ │
│  │  Adequacy:    0.88 ██████████████████░░░░░░                          │ │
│  │  Terminology: 0.90 ███████████████████░░░░░                          │ │
│  │  Style:       0.85 █████████████████░░░░░░░                          │ │
│  │                                                                       │ │
│  │  Issues Found: 1 minor                                                │ │
│  │  • "centerline" could be "center line" (style preference)            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─── Translation Memory Update ─────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  ☑ Save this translation pair to TM                                  │ │
│  │    Source: "正しい構えとは、竹刀を正しく握り..."                     │ │
│  │    Target: "The proper stance starts with holding your shinai..."    │ │
│  │    Quality Score: 0.89                                                │ │
│  │    Domain: Kendo - Technical                                          │ │
│  │                                                    [Preview in TM]    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─── Terminology Database Update ───────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  New terms detected in this translation:                              │ │
│  │  ☑ 正中線 → centerline          [Edit]     [Add to Glossary]         │ │
│  │  ☐ 相手 → opponent              [Edit]     [Skip - too generic]      │ │
│  │                                                                       │ │
│  │  Confirm existing terms used correctly:                               │ │
│  │  ✓ 構え → stance (confirmed)                                         │ │
│  │  ✓ 竹刀 → shinai (confirmed)                                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─── Context Association ───────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  Record which context was most useful:                                │ │
│  │  ☑ TM Match: "正しい構えを..." (92%) - HELPFUL                       │ │
│  │  ☐ TM Match: "竹刀の握り方..." (87%) - NOT USED                      │ │
│  │  ☑ Corpus Example: Kurita Sensei video - HELPFUL                     │ │
│  │                                                                       │ │
│  │  This improves future retrieval relevancy scoring.                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  [Skip All Updates]    [Apply Selected]    [→ Finish & Save All]     │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**User Decisions:**

- ☑ Save translation pair to TM (with quality score)
- ☑ Add new terms to terminology database
- ☑ Record which context was helpful (improves future retrieval)
- ☑ Flag issues for human review

---

## Breadth-First Implementation Plan

### Overview

Implement the system in horizontal layers, ensuring each phase has basic functionality before adding depth.

```
                    BREADTH-FIRST IMPLEMENTATION

Layer 1: ████████████████████████████████████████  Core Pipeline
         [Pre-Trans Basic] [Trans Basic] [Post Basic]

Layer 2: ████████████████████████████████████████  UI & User Control
         [Context Panel]   [Candidates]  [DB Update Panel]

Layer 3: ████████████████████████████████████████  RAG Enhancement
         [TM + Terms]      [Multi-Gen]   [Quality Metrics]

Layer 4: ████████████████████████████████████████  Advanced Features
         [Gap Detection]   [JA-EN Agent] [Learning Loop]
```

---

### Layer 1: Core Pipeline (Week 1-2)

**Goal:** End-to-end translation flow with minimal features.

| Step | Task                                         | Files                            | Priority |
| ---- | -------------------------------------------- | -------------------------------- | -------- |
| 1.1  | Create basic context object from source text | `lib/context/context-builder.ts` | HIGH     |
| 1.2  | Simple domain/style detection (rule-based)   | `lib/context/analyzers.ts`       | HIGH     |
| 1.3  | Basic TM lookup (exact match only)           | `app/api/context/tm/route.ts`    | HIGH     |
| 1.4  | LLM translation with static prompt           | `app/api/translate/route.ts`     | HIGH     |
| 1.5  | Simple quality score (LLM-based)             | `lib/quality/scorer.ts`          | HIGH     |
| 1.6  | Basic save to TM                             | `app/api/memory/save/route.ts`   | HIGH     |

**Deliverable:** User can input text → get translation → save to TM.

---

### Layer 2: UI & User Control (Week 3-4)

**Goal:** User can see and edit context, select candidates, control DB updates.

| Step | Task                                   | Files                                      | Priority |
| ---- | -------------------------------------- | ------------------------------------------ | -------- |
| 2.1  | Context Builder Panel component        | `components/ContextBuilderPanel.tsx`       | HIGH     |
| 2.2  | TM matches display with add/remove     | `components/context/TMMatchList.tsx`       | HIGH     |
| 2.3  | Terminology editor component           | `components/context/TerminologyEditor.tsx` | HIGH     |
| 2.4  | Translation candidates display         | `components/TranslationCandidates.tsx`     | HIGH     |
| 2.5  | Post-translation panel with checkboxes | `components/PostTranslationPanel.tsx`      | HIGH     |
| 2.6  | Quality score visualization            | `components/QualityScoreDisplay.tsx`       | MEDIUM   |

**Deliverable:** Full 3-panel UI workflow.

---

### Layer 3: RAG Enhancement (Week 5-6)

**Goal:** Rich context retrieval and multi-candidate generation.

| Step | Task                                    | Files                            | Priority |
| ---- | --------------------------------------- | -------------------------------- | -------- |
| 3.1  | Fuzzy TM matching (semantic similarity) | `lib/retrieval/tm-search.ts`     | HIGH     |
| 3.2  | Terminology DB integration              | `lib/retrieval/terminology.ts`   | HIGH     |
| 3.3  | Domain corpus retrieval                 | `lib/retrieval/corpus.ts`        | MEDIUM   |
| 3.4  | Context pairing/weighting logic         | `lib/context/context-pairer.ts`  | HIGH     |
| 3.5  | Multi-candidate generation (3 styles)   | `lib/translation/multi-gen.ts`   | MEDIUM   |
| 3.6  | Detailed quality metrics (4 dimensions) | `lib/quality/detailed-scorer.ts` | MEDIUM   |

**Deliverable:** Smart retrieval + multiple translation options.

---

### Layer 4: Advanced Features (Week 7-8)

**Goal:** Japanese-specific handling, learning loop, gap detection.

| Step | Task                          | Files                              | Priority |
| ---- | ----------------------------- | ---------------------------------- | -------- |
| 4.1  | Coverage gap detection        | `lib/context/gap-detector.ts`      | MEDIUM   |
| 4.2  | JA→EN subject inference       | `lib/agents/ja-en-agent.ts`        | HIGH     |
| 4.3  | Honorific/keigo handling      | `lib/agents/honorific-handler.ts`  | MEDIUM   |
| 4.4  | Context usefulness tracking   | `lib/learning/context-feedback.ts` | LOW      |
| 4.5  | Quality threshold routing     | `lib/quality/routing.ts`           | LOW      |
| 4.6  | Preset context saving/loading | `lib/context/presets.ts`           | LOW      |

**Deliverable:** Production-ready translation system.

---

## File Structure

```
packages/web/
├── app/
│   ├── api/
│   │   ├── context/
│   │   │   ├── analyze/route.ts      # Phase 0: Context init
│   │   │   ├── retrieve/route.ts     # Phase 1: RAG retrieval
│   │   │   └── pair/route.ts         # Phase 2: Context pairing
│   │   ├── translate/
│   │   │   ├── route.ts              # Phase 3: Translation
│   │   │   └── candidates/route.ts   # Multi-candidate generation
│   │   └── post/
│   │       ├── score/route.ts        # Phase 4: Quality scoring
│   │       └── save/route.ts         # Phase 4: Memory update
│   └── translate/
│       └── page.tsx                  # Main translation page
├── components/
│   ├── translation/
│   │   ├── ContextBuilderPanel.tsx   # Pre-translation UI
│   │   ├── TranslationPanel.tsx      # Translation UI
│   │   └── PostTranslationPanel.tsx  # Post-translation UI
│   └── context/
│       ├── TMMatchList.tsx
│       ├── TerminologyEditor.tsx
│       ├── CorpusExamples.tsx
│       └── GapAlerts.tsx
└── lib/
    ├── context/
    │   ├── context-builder.ts
    │   ├── analyzers.ts
    │   ├── context-pairer.ts
    │   └── gap-detector.ts
    ├── retrieval/
    │   ├── tm-search.ts
    │   ├── terminology.ts
    │   └── corpus.ts
    ├── translation/
    │   └── multi-gen.ts
    ├── quality/
    │   ├── scorer.ts
    │   └── routing.ts
    ├── agents/
    │   └── ja-en-agent.ts
    └── learning/
        └── context-feedback.ts
```

---

## Success Criteria

| Phase            | Metric                             | Target            |
| ---------------- | ---------------------------------- | ----------------- |
| Pre-Translation  | Context build time                 | < 3 seconds       |
| Pre-Translation  | User can edit all context elements | 100% coverage     |
| Translation      | Candidate generation time          | < 10 seconds      |
| Translation      | User can select/edit any candidate | Yes               |
| Post-Translation | Quality score accuracy (vs human)  | > 0.8 correlation |
| Post-Translation | User controls all DB updates       | 100% user choice  |
| Overall          | End-to-end translation time        | < 30 seconds      |

---

## Timeline Summary

| Week | Focus                    | Deliverable                 |
| ---- | ------------------------ | --------------------------- |
| 1-2  | Layer 1: Core Pipeline   | Basic end-to-end flow       |
| 3-4  | Layer 2: UI & Control    | Full 3-panel interface      |
| 5-6  | Layer 3: RAG Enhancement | Smart retrieval + multi-gen |
| 7-8  | Layer 4: Advanced        | JA-EN agent + learning loop |
