# Kendo Translation User Tutorial

Welcome to Kendo Translation! This guide will help you get started with reading, translating, and managing Kendo content.

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Reader Mode](#2-reader-mode)
3. [Translator Mode](#3-translator-mode)
4. [Dashboard](#4-dashboard)
5. [Keyboard Shortcuts](#5-keyboard-shortcuts)

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

### Theme Toggle
Click the ☀️ or 🌙 button in the header to switch between light and dark mode. Your preference is saved automatically.

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

## 4. Dashboard

Click **Dashboard** to see platform statistics:

| Stat | Description |
|------|-------------|
| 📄 Articles | Total articles in database |
| 📚 TM Entries | Translation memory entries |
| 📖 Terminology | Kendo terms |
| 🔖 Bookmarks | Your saved items |

### Mode Cards
Quick links to different translation modes:
- Article Browser
- Translation Editor
- Terminology Search

---

## 5. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save translation |
| `Cmd/Ctrl + Enter` | Get AI suggestion |
| `←` / `→` | Navigate articles (when not in text field) |

---

## Tips & Tricks

1. **Use TM First**: Check the Translation Memory panel before getting an AI suggestion - you might find an exact match

2. **Review Honorifics**: The JA-EN specialist identifies Japanese honorifics (先生, さん) - make sure they're rendered appropriately

3. **Keyboard Workflow**: Use `Cmd+Enter` for AI, edit, then `Cmd+S` to save quickly

4. **Dark Mode at Night**: Toggle dark mode for comfortable late-night translation sessions

---

*Need help? Open an issue on [GitHub](https://github.com/nghiatrngo/kendo-translation)*
