# Kendo Translation User Tutorial

Welcome to Kendo Translation! This guide will help you get started with reading, translating, and managing Kendo content.

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Reader Mode](#2-reader-mode)
3. [Translator Mode](#3-translator-mode)
4. [MAC-RAG Translation](#4-mac-rag-translation)
5. [Dashboard](#5-dashboard)
6. [Keyboard Shortcuts](#6-keyboard-shortcuts)

---

## 1. Getting Started

### Visit the Platform

Open your browser and navigate to:

- **Production**: https://kendo-translation.onrender.com
- **Local**: http://localhost:3000

### Navigation

The header shows all main sections:

- **Dashboard** - Platform statistics
- **Articles** - Browse 634 Kendo articles
- **Videos** - Watch annotated videos
- **Terminology** - Search 920+ Kendo terms
- **Translate** - AI-assisted translation
- **🔬 MAC-RAG** - Advanced context-aware translation

### Theme Toggle

Click the ☀️ or 🌙 button in the header to switch between light and dark mode. Your preference is saved automatically.

### User Roles

| Role       | Can Read | Can Translate | Can Admin |
| ---------- | -------- | ------------- | --------- |
| Reader     | ✅       | ❌            | ❌        |
| Translator | ✅       | ✅            | ❌        |
| Admin      | ✅       | ✅            | ✅        |

---

## 2. Reader Mode

### Browse Articles

1. Click **Articles** in the navigation
2. Scroll through the list of 634 articles
3. Articles show:

   - Title (Japanese or English)
   - Translation status badge
   - Source URL

4. Click any article to view the full content

### Article Detail View

- **Left panel**: Japanese source text
- **Right panel**: English translation
- Side-by-side display for easy comparison

### Terminology Search

1. Click **Terminology** in the navigation
2. Use the search bar to find terms
3. Each term shows:
   - Japanese (kanji)
   - Reading (hiragana)
   - English meaning
   - Domain (technique, equipment, etc.)

### Video Notes

1. Click **Videos** in the navigation
2. Select a video to watch
3. The YouTube player shows on the left
4. Add timestamped notes as you watch
5. Notes are saved automatically

---

## 3. Translator Mode

### Select an Article

1. Click **Translate** in the navigation
2. Choose an article to translate
3. Opens the Translation Editor

### Translation Editor

The editor has several sections:

#### Source & Target

- **Left**: Japanese source text (read-only)
- **Right**: English translation (editable)

#### AI Translation Suggestion

1. Click **🤖 Get AI Suggestion**
2. Wait for the AI to generate a translation
3. Review the suggestion with:
   - **Confidence score** (0-100%)
   - **Honorific mappings** (先生 → sensei)
   - **Onomatopoeia** (擬音語 renderings)
   - **Keigo level** (polite/casual)
4. Click **Accept** to use the suggestion
5. Or edit manually

#### Translation Memory (TM)

The TM panel shows similar past translations:

- **Match percentage** (72% match)
- **Source text** snippet
- **Target text** snippet
- Click **Use this** to apply a TM match

#### Save Your Work

1. Edit the translation in the right panel
2. Click **💾 Save Translation**
3. Or press `Cmd/Ctrl+S`

---

## 4. MAC-RAG Translation

**MAC-RAG** (Multilingual Agent Collaboration with RAG) is the advanced translation mode with context-aware features.

### Access MAC-RAG

1. Click **🔬 MAC-RAG** in the navigation
2. Select an article from the queue
3. The MAC-RAG translation page opens

### Context Building Tab

Before translating, review the context:

- **Special Instructions**: Add any specific guidance for the translation
- **Source Text**: The Japanese text to translate

### Retrieval Results Tab

View what the system found:

- **Bilingual DB Matches**: Similar past translations with relevance scores
- **Terminology**: Required terms and their translations

### Generate Translation

1. Review/edit the context if needed
2. Click **Generate Translation**
3. Wait for the AI to produce the translation
4. View the result in the LLM Output section

### Agent Logs

Track all AI interactions:

1. Click the **Agent Logs** tab
2. See all LLM calls for this article
3. Expand any log to see full prompts and responses
4. Stats show total calls, tokens, and timing

---

## 5. Dashboard

Click **Dashboard** to see platform statistics:

| Stat           | Description                |
| -------------- | -------------------------- |
| 📄 Articles    | Total articles in database |
| 📚 TM Entries  | Translation memory entries |
| 📖 Terminology | Kendo terms                |
| 🔖 Bookmarks   | Your saved items           |

### Mode Cards

Quick links to different translation modes:

- Article Browser
- Translation Editor
- MAC-RAG Pipeline
- Terminology Search

---

## 6. Keyboard Shortcuts

| Shortcut           | Action                                     |
| ------------------ | ------------------------------------------ |
| `Cmd/Ctrl + S`     | Save translation                           |
| `Cmd/Ctrl + Enter` | Get AI suggestion                          |
| `←` / `→`          | Navigate articles (when not in text field) |

---

## Tips & Tricks

1. **Use MAC-RAG for Complex Text**: The context-aware translation provides better results for technical Kendo content.

2. **Check Bilingual Matches**: Before translating, see if similar content was already translated.

3. **Review Agent Logs**: See exactly what the AI was thinking for transparency.

4. **Keyboard Workflow**: Use `Cmd+Enter` for AI, edit, then `Cmd+S` to save quickly.

5. **Dark Mode at Night**: Toggle dark mode for comfortable late-night translation sessions.

---

_Need help? Open an issue on [GitHub](https://github.com/nghiatrngo/kendo-translation)_

_Last Updated: January 12, 2025_
