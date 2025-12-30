# Kendo Translation - Reference Documentation

**Purpose**: Detailed reference for inheriting components from previous projects.  
**Last Updated**: December 30, 2024

---

## Inheritance Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          kendo-translation                                   │
├────────────────────┬──────────────────────┬─────────────────────────────────┤
│  annotation_platform│      MAC-RAG         │        youtube_note             │
│  ─────────────────  │  ──────────────────  │  ────────────────────           │
│  • Dashboard UI     │  • Python Agents     │  • Express API Pattern          │
│  • Prisma → Migrate │  • Coordinator       │  • Supabase Integration         │
│  • LLM Provider     │  • JA-EN Specialist  │  • JWT Authentication           │
│  • Agent Orchestr.  │  • Translation       │  • CORS Configuration           │
│  • Translation UI   │  • Reflection Loop   │  • GitHub Pages Deploy          │
│  • Settings Page    │  • Terminology DB    │  • Video Player Logic           │
│  • Book/Video Mode  │  • TM 1,264 entries  │  • Notes CRUD Pattern           │
└────────────────────┴──────────────────────┴─────────────────────────────────┘
```

---

## 1. annotation_platform Deep Dive

**Location**: `/Users/nghiango-mbp/git_repo/mARTr/annotation_platform`  
**Tech**: Next.js 14 + Prisma + SQLite + Tailwind CSS

### 1.1 Project Structure

```
annotation_platform/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Dashboard (inherit UI pattern)
│   │   ├── annotate/page.tsx     ← Translation interface (inherit)
│   │   ├── book/page.tsx         ← Book mode (inherit)
│   │   ├── video/page.tsx        ← Video mode (adapt)
│   │   ├── import/page.tsx       ← Data import (inherit)
│   │   ├── settings/page.tsx     ← LLM config (inherit)
│   │   └── api/
│   │       ├── pairs/            ← Translation pair CRUD
│   │       ├── books/            ← Book management
│   │       ├── videos/           ← Video management
│   │       ├── settings/         ← Settings CRUD
│   │       └── memory/           ← Vector DB operations
│   └── lib/
│       ├── agents/
│       │   ├── orchestrator.ts   ← Agent coordination (inherit)
│       │   ├── retrieval-agent.ts
│       │   ├── inference-agent.ts
│       │   └── memory-agent.ts
│       ├── llm/
│       │   └── provider.ts       ← LLM abstraction (INHERIT)
│       ├── vectordb/
│       │   └── index.ts          ← Multi-collection search
│       └── db.ts                 ← Prisma client
├── prisma/
│   └── schema.prisma             ← 8 models (MIGRATE to Supabase)
└── scripts/
    └── extract_kendo_pairs.mjs   ← Data extraction
```

### 1.2 Database Schema (Prisma → Supabase Migration)

| Prisma Model | Supabase Table | Status |
|--------------|----------------|--------|
| `TranslationPair` | `articles` + `translation_pairs` | Split |
| `Book` | `books` | Migrate |
| `Video` | `videos` | Migrate |
| `Annotation` | `annotations` | Migrate |
| `Suggestion` | `ai_suggestions` | Migrate |
| `Term` | `terminology` | Migrate |
| `Settings` | `settings` | Migrate |

#### Key Model: TranslationPair
```prisma
model TranslationPair {
  id          String   @id @default(cuid())
  sourceText  String   // Japanese text
  targetText  String   // English text (reference)
  domain      String   // "kendo", "regulations", etc.
  mode        String   @default("general") // "book", "video", "general"
  bookId      String?
  videoId     String?
  timestamp   Float?   // For video segments
  createdAt   DateTime @default(now())
}
```

### 1.3 LLM Provider (INHERIT COMPLETELY)

**File**: `src/lib/llm/provider.ts` (209 lines)

Provides abstraction over OpenAI and OpenRouter with per-agent model configuration.

```typescript
// Key exports to inherit:
interface Message { role: "system" | "user" | "assistant"; content: string }
interface ChatOptions { model?: string; temperature?: number; responseFormat?: "text" | "json" }
interface ChatResponse { content: string; model: string; usage?: { promptTokens, completionTokens } }
interface LLMProvider { chat(messages, options): Promise<ChatResponse>; getDefaultModel(): string }

// Provider classes:
class OpenAIProvider implements LLMProvider { ... }
class OpenRouterProvider implements LLMProvider { ... }

// Utility functions:
function getProvider(type?: "openai" | "openrouter"): LLMProvider
function getAgentModel(agentType: "retrieval" | "inference" | "memory"): string
function getAgentProvider(agentType): { provider, model }
async function agentChat(agentType, messages, options): Promise<ChatResponse>
```

**Usage Pattern**:
```typescript
import { agentChat } from "@/lib/llm/provider";

const response = await agentChat("inference", [
  { role: "system", content: "You are a translator..." },
  { role: "user", content: sourceText }
], { temperature: 0.3, responseFormat: "json" });
```

### 1.4 UI Components to Inherit

#### Dashboard (page.tsx)
- Stats grid with color-coded cards
- Translation mode cards (Book, Video, General)
- Quick action links
- Getting started guide

#### Key Pattern: StatCard
```tsx
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "yellow" | "green" | "red";
}) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
    ...
  };
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colors[color]} border`}>
      ...
    </div>
  );
}
```

### 1.5 Agent Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Agent Orchestrator                   │
├─────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│ │  Retrieval  │ │  Inference  │ │   Memory    │    │
│ │    Agent    │ │    Agent    │ │    Agent    │    │
│ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘    │
│        │               │               │            │
│        ▼               ▼               ▼            │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐       │
│  │ ChromaDB │   │  OpenAI  │   │  SQLite  │       │
│  │ (Vector) │   │  GPT-4   │   │   (DB)   │       │
│  └──────────┘   └──────────┘   └──────────┘       │
└─────────────────────────────────────────────────────┘
```

---

## 2. MAC-RAG Deep Dive

**Location**: `/Users/nghiango-mbp/git_repo/mARTr/MAC-RAG`  
**Tech**: Python + SQLAlchemy + ChromaDB + MLflow

### 2.1 Project Structure

```
MAC-RAG/
├── src/
│   ├── agents/
│   │   ├── base.py               ← BaseAgent class (INHERIT PATTERN)
│   │   ├── coordinator.py        ← Pipeline orchestration (INHERIT)
│   │   ├── analysis.py           ← Source analysis
│   │   ├── retrieval.py          ← RAG retrieval
│   │   ├── translation.py        ← Core translation (INHERIT)
│   │   ├── reflection.py         ← Quality scoring
│   │   ├── improvement.py        ← Apply feedback
│   │   └── ja_en_specialist.py   ← JA→EN handling (INHERIT)
│   ├── db/
│   │   ├── models.py             ← SQLAlchemy models (REFERENCE)
│   │   ├── config.py             ← Database config
│   │   └── vector.py             ← ChromaDB wrapper
│   ├── llm/
│   │   └── provider.py           ← Python LLM abstraction
│   └── monitoring/
│       └── mlflow_tracker.py     ← Performance tracking
├── data/
│   ├── terminology/
│   │   └── kendo_terms.json      ← 1000+ terms (COPY)
│   └── onomatopoeia.json         ← Sound words (COPY)
└── notebooks/
    ├── tutorial_nb.ipynb         ← Pipeline examples
    └── monitoring_nb.ipynb       ← MLflow dashboard
```

### 2.2 Agent Pipeline (INHERIT ARCHITECTURE)

```
Source Text
    │
    ▼
┌─────────────────┐
│ Analysis Agent  │ → Domain, complexity, entities
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JA-EN Specialist│ → Subject resolution, honorifics, onomatopoeia
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retrieval Agent │ → Terminology, TM matches
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│              Quality Loop (max 3)            │
│  Translation → Reflection → Improvement      │
└─────────────────────────────────────────────┘
         │
         ▼
   Target Text (Score ≥ 0.85)
```

### 2.3 Database Models (REFERENCE FOR SUPABASE)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Project` | Translation project | name, lang, honorific_strategy, qe_threshold |
| `Translation` | Single translation | source_text, target_text, status, quality_score |
| `Segment` | Translation segment | source_text, target_text, subject_resolution |
| `TermEntry` | Terminology | source_term, target_term, domain, term_type |
| `TranslationMemory` | TM entry | source_text, target_text, quality, human_approved |
| `Onomatopoeia` | Sound words | japanese, english_options, type |
| `AgentLog` | Debug logs | agent_id, phase, input_data, output_data |

### 2.4 JA-EN Specialist Features (INHERIT LOGIC)

```python
class JAENSpecialistAgent(BaseAgent):
    """Japanese-to-English specific handling."""
    
    async def process(self, input_data, context):
        # 1. Subject Resolution (Japanese omits subjects)
        subject_resolutions = await self._resolve_subjects(source_text, analysis)
        
        # 2. Honorific Handling (田中先生 → Tanaka-sensei)
        honorific_mappings = self._analyze_honorifics(source_text, strategy)
        
        # 3. Onomatopoeia Rendering (ニコニコ → "smiling brightly")
        onomatopoeia_renderings = self._render_onomatopoeia(source_text)
        
        # 4. Character Voice Analysis
        character_voice = self._analyze_voice(source_text, target_text)
        
        # 5. Build Enhanced Prompt
        enhanced_prompt = self._build_enhanced_prompt(...)
        
        return AgentResult(data={
            "subject_resolutions": subject_resolutions,
            "honorific_mappings": honorific_mappings,
            "onomatopoeia_renderings": onomatopoeia_renderings,
            "keigo_level": keigo_level,
            "enhanced_prompt": enhanced_prompt
        })
```

### 2.5 Data Assets to Copy

| Asset | Location | Size | Description |
|-------|----------|------|-------------|
| `kendo_terms.json` | `data/terminology/` | 203KB | 1000+ Kendo terms |
| `onomatopoeia.json` | `data/` | 6KB | Japanese sound words |
| Translation Memory | `mac_rag.db` | 1,264 entries | Verified pairs |
| Glossary PDFs | `data/terminology/` | 568KB | Source documents |

---

## 3. youtube_note Deep Dive

**Location**: `/Users/nghiango-mbp/git_repo/youtube_note`  
**Tech**: Express.js + Supabase + JWT + Static HTML

### 3.1 Project Structure

```
youtube_note/
├── index.html               ← Static frontend (GitHub Pages)
├── server-supabase.js       ← Express API (Render.com)
├── package.json             ← Node.js dependencies
├── env.example              ← Environment template
├── render.yaml              ← Render deployment config
├── public/
│   ├── index.html           ← User edition
│   └── index-static.html    ← Local storage version
├── backup-database.js       ← Database backup
├── restore-database.js      ← Database restore
├── DEPLOY-RENDER.md         ← Deployment guide
└── DEPLOY-SUPABASE.md       ← Supabase setup guide
```

### 3.2 Deployment Architecture (INHERIT COMPLETELY)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  GitHub Pages   │────►│  Render.com     │────►│    Supabase     │
│  (Frontend)     │     │  (Express API)  │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     Static HTML         server-supabase.js       users, notes
```

### 3.3 Express Server Pattern (INHERIT)

**File**: `server-supabase.js` (525 lines)

#### CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://nghiatrngo.github.io',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

#### Supabase Client
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
```

#### JWT Authentication Middleware
```javascript
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}
```

### 3.4 API Pattern (INHERIT)

| Method | Endpoint | Pattern |
|--------|----------|---------|
| POST | `/api/auth/register` | Create user, hash password, return JWT |
| POST | `/api/auth/login` | Verify password, return JWT |
| GET | `/api/auth/profile` | `authenticateToken` → Get user |
| GET | `/api/notes` | `authenticateToken` → List user's notes |
| POST | `/api/notes` | `authenticateToken` → Create note |
| PUT | `/api/notes/:id` | `authenticateToken` → Update note (verify ownership) |
| DELETE | `/api/notes/:id` | `authenticateToken` → Delete note (verify ownership) |
| GET | `/health` | Health check (no auth) |

### 3.5 Supabase Query Patterns

#### Create
```javascript
const { data, error } = await supabase
    .from('notes')
    .insert([{ user_id, video_id, text, start_time, end_time }])
    .select('*')
    .single();
```

#### Read (with filter)
```javascript
const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
```

#### Update (with ownership check)
```javascript
const { data, error } = await supabase
    .from('notes')
    .update({ text, start_time, end_time })
    .eq('id', id)
    .eq('user_id', userId)  // Ownership check
    .select('*');
```

#### Delete
```javascript
const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
```

### 3.6 Environment Variables (INHERIT)

```bash
# Server
PORT=3000

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Auth
JWT_SECRET=your-super-secret-jwt-key

# CORS
CORS_ORIGIN=https://nghiatrngo.github.io

# Environment
NODE_ENV=development
```

### 3.7 Render.yaml (INHERIT)

```yaml
services:
  - type: web
    name: youtube-note-api
    runtime: node
    buildCommand: npm install
    startCommand: node server-supabase.js
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: JWT_SECRET
        sync: false
```

---

## 4. Inheritance Map

### What to COPY (no modification)
| Source | File | Purpose |
|--------|------|---------|
| annotation_platform | `src/lib/llm/provider.ts` | LLM abstraction |
| MAC-RAG | `data/terminology/kendo_terms.json` | Terminology |
| MAC-RAG | `data/onomatopoeia.json` | Onomatopoeia |
| youtube_note | `render.yaml` | Deployment config |

### What to ADAPT
| Source | Component | Adaptation |
|--------|-----------|------------|
| annotation_platform | `prisma/schema.prisma` | Convert to Supabase SQL |
| annotation_platform | `src/app/page.tsx` | Add Reader/Translator modes |
| annotation_platform | `src/lib/agents/` | Port to Next.js API routes |
| youtube_note | `server-supabase.js` | Integrate into Next.js API |
| MAC-RAG | Agent logic | Convert Python → TypeScript or microservice |

### What to MERGE
| Components | Into | Strategy |
|------------|------|----------|
| annotation_platform UI + youtube_note notes | Reader View | Combine layouts |
| annotation_platform translation + MAC-RAG | Translator View | API integration |
| youtube_note auth + Both DBs | Shared Auth | Supabase Auth |

---

## 5. Technology Decision Matrix

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Frontend | Next.js 14 | annotation_platform already uses it |
| Database | Supabase | youtube_note pattern, free tier, realtime |
| Auth | Supabase Auth | Replace custom JWT with managed auth |
| Styling | Tailwind CSS | Both projects use it |
| LLM | OpenRouter | Supports multiple models |
| Translation Engine | Python Microservice | Keep MAC-RAG as separate service |
| Deployment | GitHub Pages + Render | Proven with youtube_note |

---

*Reference documentation created: December 30, 2024*
