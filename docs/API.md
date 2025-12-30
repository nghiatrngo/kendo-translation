# Kendo Translation API Reference

## Overview

The Kendo Translation API provides endpoints for accessing articles, translation memory, and AI-powered translation suggestions.

**Base URL:** `https://your-deployment.com` (or `http://localhost:3000` for development)

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

Update an article's translation.

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
| 404 | Not Found |
| 500 | Server Error |

---

## Rate Limits

Currently no rate limits are enforced. This may change for production deployments.

---

## Environment Variables

Required for API functionality:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=your-openrouter-key  # For AI translation
```
