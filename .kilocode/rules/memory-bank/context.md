# Active Context: AI Story Reader App

## Current State

**Project Status**: ✅ Complete — Single-story Dutch reader with topic selector, varied Q&A types, Next/Previous navigation with story cache, reading progress tracking, TTS, word translation, and procedural story generation (no API key needed)

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
  - [x] **Update (Feb 2026) — Varied Q&A types + Next/Previous navigation:**
    - [x] `ComprehensionQuestion` type extended: `type` (open/multiple_choice/fill_blank/true_false), `options?`, `correctBool?`
    - [x] Each story has 4 questions, one of each type
    - [x] Multiple choice: 4 options, click to select, auto-reveals answer, correct/wrong feedback
    - [x] Fill in the blank: sentence with ___, reveal missing word on button click
    - [x] True/False: statement with Waar/Onwaar reveal + explanation
    - [x] Open: full-sentence answer revealed on button click
    - [x] Story history cache: array of fetched stories stored in state
    - [x] Next button: navigates forward in cache or fetches new unique story
    - [x] Previous button: navigates back in local cache (no re-fetch)
    - [x] Story counter: "X / Y" shows position in history
    - [x] Fixed repeated stories bug: all cached titles passed as `existingTitles`
    - [x] Level/topic change resets history and fetches fresh story
  - [x] **Update (Feb 2026) — Procedural story generator (no API key needed):**
    - [x] Added `STORY_TEMPLATES` array: 8 templates (2 per topic × A1/A2) with `{var}` placeholders
    - [x] Word lists: 24 Dutch names, 15 cities, 10 foods, 10 hobbies, 10 jobs, seasons, months
    - [x] `generateProceduralStory()` fills templates with random vars, tries 20× for unique title
    - [x] Titles include variable values (e.g. "Een Dag met Emma", "Een Reis naar Utrecht")
    - [x] API fallback chain: OpenAI → procedural generator → static pool
    - [x] Effectively infinite unique stories without any API key

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main app: single story, topic selector, Q&A, progress tracking | ✅ Updated |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `src/app/types/story.ts` | TypeScript types (Sentence, Paragraph, Story, ComprehensionQuestion, QuestionType, StoryTopic) | ✅ Updated |
| `src/app/api/stories/route.ts` | Story generation API — single story, topic param, varied Q&A types, 8-story fallback pool | ✅ Updated |
| `src/app/api/translate/route.ts` | Word/phrase translation API (OpenAI + MyMemory free API + dictionary fallback) | ✅ Ready |
| `src/app/hooks/useSpeech.ts` | TTS hook with `playSequence()` and speed support | ✅ Ready |
| `src/app/lib/tokenize.ts` | Sentence tokenization utility | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Data Model

```typescript
type StoryTopic = 'daily life' | 'travel' | 'market' | 'Dutch culture';
type QuestionType = 'open' | 'multiple_choice' | 'fill_blank' | 'true_false';

interface Sentence { id, text, translation }
interface Paragraph { id, sentences: Sentence[] }
interface ComprehensionQuestion { id, type: QuestionType, question, answer, options?: string[], correctBool?: boolean }
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
- **Next**: Navigates forward in local story cache, or fetches a new unique story if at the end
- **Previous**: Navigates back in local story cache (no re-fetch)
- **Story counter**: Shows current position "X / Y" in history
- **Level**: A1 (beginner) / A2 (elementary) — changing level resets history
- **Topic**: daily life / travel / market / Dutch culture — changing topic resets history
- **Repeated stories fix**: All cached story titles passed as `existingTitles` when fetching next

### Reading Progress (localStorage)
- Tracks which sentence IDs have been heard (clicked or played via TTS)
- Tracks which story titles have been fully read (all sentences heard)
- Progress bar per story showing heard/total sentences
- Sidebar stats: total stories read, total sentences heard
- Completed story list (last 5)
- Reset progress button

### Comprehension Q&A
- 4 questions per story (in Dutch), one of each type:
  - **Multiple choice**: 4 options, click to select, auto-reveals answer with correct/wrong feedback
  - **Fill in the blank**: sentence with ___, click "Show Answer" to reveal missing word
  - **True/False**: statement, click "Show Answer" to reveal Waar/Onwaar + explanation
  - **Open**: open-ended question, click "Show Answer" to reveal full answer

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
| Feb 2026 | Varied Q&A types (MC/fill-blank/T-F/open) + Next/Previous navigation with story cache |
| Feb 2026 | Fix: procedural story generator — infinite unique stories without API key |

## Notes

- API now returns `{ story }` (singular) not `{ stories }` (array)
- Progress is stored in `localStorage` under key `dutch-reader-progress`
- Fallback pool has 8 stories: 2 per topic (1 A1 + 1 A2 each), all ≥500 words
- `existingTitles` (all cached story titles) prevents duplicate stories when clicking Next
- Story history is stored in React state (`storyHistory[]` + `currentIndex`); Previous navigates without re-fetching
- Each story has 4 questions: 1 multiple_choice + 1 fill_blank + 1 true_false + 1 open
- Procedural generator uses 8 templates × random vars (24 names, 15 cities, 10 foods, etc.) → effectively infinite unique stories
