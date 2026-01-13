# Kendo Translation API Reference

## Overview

The Kendo Translation API provides endpoints for articles, translation memory, AI-powered translation suggestions, and the MAC-RAG pipeline.

**Base URL:** `https://kendo-translation.onrender.com` (or `http://localhost:3000` for development)

---

## Authentication

Most write operations require authentication via Supabase Auth session cookies.

| Endpoint                           | Auth Required                  |
| ---------------------------------- | ------------------------------ |
| `GET /api/articles`                | ❌ No                          |
| `POST /api/articles`               | ✅ Yes                         |
| `PUT /api/articles/[id]/translate` | ✅ Yes                         |
| `POST /api/translate/mac-rag`      | ❌ No (logs user if available) |
| `POST /api/agent/logs`             | ✅ Yes                         |

---

## Endpoints

### Articles

#### GET /api/articles

List all articles with pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**

```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "Article Title",
      "content_ja": "Japanese content...",
      "content_en": "English content...",
      "translation_status": "draft",
      "created_at": "2024-12-30T00:00:00Z"
    }
  ],
  "total": 634,
  "page": 1
}
```

---

#### GET /api/articles/[id]

Get a single article by ID.

**Response:**

```json
{
  "id": "uuid",
  "title": "Article Title",
  "content_ja": "Full Japanese content...",
  "content_en": "Full English content...",
  "source_url_ja": "https://kendojidai.net/...",
  "source_url_en": "https://kendojidai.com/...",
  "translation_status": "published",
  "quality_score": 0.85
}
```

---

#### PUT /api/articles/[id]/translate

Update an article's translation. **Requires authentication.**

**Request Body:**

```json
{
  "content_en": "Updated English translation...",
  "translation_status": "draft"
}
```

**Response:**

```json
{
  "success": true,
  "article": { ... }
}
```

---

### Translation

#### POST /api/translate/suggest

Get AI-powered translation suggestion with JA-EN specialist analysis.

**Request Body:**

```json
{
  "source_text": "Japanese text to translate...",
  "context": "Optional context about the content"
}
```

**Response:**

```json
{
  "translation": "English translation...",
  "confidence": 0.85,
  "jaenFeatures": {
    "honorificMappings": [
      { "japanese": "田中先生", "englishRendering": "Tanaka-sensei" }
    ],
    "onomatopoeiaRenderings": [],
    "keigoLevel": "polite"
  }
}
```

---

#### POST /api/translate/mac-rag

MAC-RAG pipeline for context-aware translation. Supports multiple phases.

**Request Body:**

```json
{
  "sourceText": "Japanese text to translate...",
  "phase": "translate",
  "sourceLang": "ja",
  "targetLang": "en",
  "literalContext": "Optional special instructions...",
  "articleId": "uuid (optional, for logging)",
  "videoId": "uuid (optional, for logging)"
}
```

**Phases:**
| Phase | Description |
|-------|-------------|
| `context` | Build context only (domain, style, analysis) |
| `translate` | Generate translation candidates |
| `score` | Score a provided translation |
| `full` | Run entire pipeline |

**Response (translate phase):**

```json
{
  "candidates": [
    {
      "id": "natural-123456",
      "text": "English translation...",
      "approach": "natural",
      "confidence": 0.85
    }
  ],
  "recommendedIndex": 0,
  "timings": { "translate": 1534 }
}
```

---

### Context Retrieval

#### POST /api/context/retrieve

Retrieve bilingual database matches and terminology for source text.

**Request Body:**

```json
{
  "sourceText": "Japanese text to find matches for...",
  "sourceLang": "ja",
  "targetLang": "en",
  "limit": 5
}
```

**Response:**

```json
{
  "tmMatches": [
    {
      "id": "uuid",
      "sourceText": "Similar Japanese text...",
      "targetText": "Existing translation...",
      "matchPercentage": 72,
      "quality": "silver"
    }
  ],
  "terminology": {
    "requiredTerms": [
      { "id": "uuid", "japaneseTerm": "竹刀", "englishTerm": "shinai" }
    ],
    "doNotTranslate": [],
    "preferredTerms": []
  }
}
```

---

### Agent Logs

#### GET /api/agent/logs

Retrieve agent conversation logs. Supports filtering by article/video.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `article_id` | uuid | Filter logs by article |
| `video_id` | uuid | Filter logs by video |
| `stats` | boolean | Include statistics |
| `limit` | number | Max logs to return (default 50) |

**Response:**

```json
{
  "logs": [
    {
      "id": "uuid",
      "timestamp": "2025-01-12T00:00:00Z",
      "agentType": "translation",
      "model": "meta-llama/llama-3.3-70b-instruct",
      "messages": [...],
      "response": "Translation output...",
      "usage": { "promptTokens": 200, "completionTokens": 50 },
      "durationMs": 1534
    }
  ],
  "stats": {
    "totalCalls": 5,
    "totalTokens": 1250,
    "avgDurationMs": 1200
  }
}
```

---

### Translation Memory

#### POST /api/tm/search

Search translation memory for similar source texts.

**Request Body:**

```json
{
  "source_text": "Japanese text to search...",
  "limit": 5
}
```

**Response:**

```json
{
  "matches": [
    {
      "id": "uuid",
      "source_text": "Similar Japanese text...",
      "target_text": "Existing translation...",
      "similarity": 0.72,
      "quality": "silver"
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (login required) |
| 404 | Not Found |
| 500 | Server Error |

---

## Environment Variables

Required for API functionality:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=your-openrouter-key  # For AI translation
```

---

_Last Updated: January 12, 2025_
