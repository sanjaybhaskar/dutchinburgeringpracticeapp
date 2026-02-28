# Active Context: AI Story Reader App

## Current State

**Project Status**: ✅ Complete — Single-story Dutch reader with topic selector, Q&A, reading progress tracking, TTS, and word translation

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] **AI Story Reader app features:**
  - [x] Story generation API with OpenAI integration (with fallback to default stories)
  - [x] Level selector (A1/A2)
  - [x] Clickable sentences with highlight (yellow background when selected)
  - [x] Web Speech API for TTS
  - [x] Side translation panel (desktop: sticky right column; mobile: below stories)
  - [x] Loading states and error handling
  - [x] Running text paragraph layout (sentences as inline `<span>` elements)
  - [x] Word tokenization & advanced TTS
  - [x] Full story TTS playback with sentence highlight during playback
  - [x] Slow / Normal speed control toggle
  - [x] Word translation API (`/api/translate`) with OpenAI + MyMemory free API fallback
  - [x] **Redesign (Feb 2026) — Single story + Q&A + Progress:**
    - [x] One story displayed at a time (replaced multi-story list)
    - [x] "New Story" button fetches a fresh story, avoiding already-seen titles
    - [x] Topic selector: daily life, travel, market, Dutch culture
    - [x] Each story includes 4 comprehension questions with reveal-on-click answers
    - [x] Reading progress tracked in localStorage:
      - Sentences heard (subtly dimmed after being clicked/played)
      - Stories fully read (all sentences heard)
      - Progress bar per story (heard/total sentences)
      - Stats panel in sidebar (stories read count, sentences heard count)
      - Reset progress button
    - [x] Stories API returns a single story per request (not an array)
    - [x] OpenAI prompt: ≥500 words, 5-6 paragraphs, 4 comprehension questions
    - [x] Fallback pool: 8 pre-written stories (A1+A2, all 4 topics) each ≥500 words with Q&A
    - [x] Loading spinner during story generation
    - [x] Error state with "Try Again" button

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main app: single story, topic selector, Q&A, progress tracking | ✅ Updated |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `src/app/types/story.ts` | TypeScript types (Sentence, Paragraph, Story, ComprehensionQuestion, StoryTopic) | ✅ Updated |
| `src/app/api/stories/route.ts` | Story generation API — single story, topic param, Q&A, 8-story fallback pool | ✅ Updated |
| `src/app/api/translate/route.ts` | Word/phrase translation API (OpenAI + MyMemory free API + dictionary fallback) | ✅ Ready |
| `src/app/hooks/useSpeech.ts` | TTS hook with `playSequence()` and speed support | ✅ Ready |
| `src/app/lib/tokenize.ts` | Sentence tokenization utility | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Data Model

```typescript
type StoryTopic = 'daily life' | 'travel' | 'market' | 'Dutch culture';

interface Sentence { id, text, translation }
interface Paragraph { id, sentences: Sentence[] }
interface ComprehensionQuestion { id, question, answer }
interface Story { id, title, level, topic, paragraphs: Paragraph[], questions?: ComprehensionQuestion[] }
```

## API Changes

### `/api/stories` (POST)
- **Request**: `{ level, topic, existingTitles }`
- **Response**: `{ story: Story }` (single story, not array)
- OpenAI prompt generates ≥500 words, 5-6 paragraphs, 4 Q&A
- Fallback pool: 8 stories covering all 4 topics × 2 levels

### `/api/translate` (POST)
- **Request**: `{ text, context? }`
- **Response**: `{ translation }`
- Tier 1: Built-in dictionary (~150 common Dutch words)
- Tier 2: MyMemory free API (no key needed)
- Tier 3: `[No translation found for "…"]`

## Features Implemented

### Story Navigation
- **New Story**: Fetches a fresh story, passes `existingTitles` to avoid repeats
- **Level**: A1 (beginner) / A2 (elementary) — changing level resets history
- **Topic**: daily life / travel / market / Dutch culture — changing topic resets history

### Reading Progress (localStorage)
- Tracks which sentence IDs have been heard (clicked or played via TTS)
- Tracks which story titles have been fully read (all sentences heard)
- Progress bar per story showing heard/total sentences
- Sidebar stats: total stories read, total sentences heard
- Completed story list (last 5)
- Reset progress button

### Comprehension Q&A
- 4 questions per story (in Dutch)
- Click question to reveal/hide answer
- Answers shown in green below the question

### TTS Playback
- **▶ Play Story** button plays all sentences sequentially
- **⏹ Stop** button during playback
- Sentence highlighted in cyan as it's being spoken
- Speed: 🐢 Slow (0.6x) / 🐇 Normal (0.9x)
- Click sentence → hear it + show translation
- Click word → show word translation (sentence stays highlighted)

## Configuration

### Environment Variables (Optional)
- `OPENAI_API_KEY`: For AI-generated stories and word translations

## Quick Start

```bash
bun run dev
```

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| Feb 2026 | AI Story Reader app fully implemented |
| Feb 2026 | Redesign: running text paragraphs, side panel, longer unique stories |
| Feb 2026 | Word tokenization, story TTS playback, speed control, word translation API |
| Feb 2026 | Fix: sentence stays highlighted when clicking a word |
| Feb 2026 | Fix: MyMemory free translation fallback; expanded 12-story fallback pool |
| Feb 2026 | Redesign: single story at a time, topic selector, Q&A, reading progress tracking |

## Notes

- API now returns `{ story }` (singular) not `{ stories }` (array)
- Progress is stored in `localStorage` under key `dutch-reader-progress`
- Fallback pool has 8 stories: 2 per topic (1 A1 + 1 A2 each), all ≥500 words
- `existingTitles` prevents duplicate stories when clicking "New Story"
