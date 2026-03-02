# Active Context: Dutch Inburgering Practice App

## Current State

**Project Status**: ✅ Complete — Dutch civic integration (inburgering) exam practice app with exam-style texts, 5 multiple-choice Q&A per story, Next/Previous navigation with story cache, reading progress tracking, TTS with always-visible Dutch voice dropdown, word translation, and multi-tier story generation (OpenAI → Groq free LLM → procedural → static pool)

## Recently Completed

- [x] **Update (Feb 2026) — Voice dropdown always visible + 5 multiple choice Q&A only:**
  - [x] Voice dropdown now always visible on both mobile and desktop when TTS is supported (`isSupported &&` condition)
  - [x] Added "🇳🇱 Default Dutch (nl-NL)" as first option in voice dropdown — always present even when no Dutch voice objects are loaded
  - [x] Selecting "Default Dutch" sets `selectedVoice = null`, which causes utterances to use `lang='nl-NL'` (already the default)
  - [x] `QuestionType` simplified to only `'multiple_choice'` — removed `'open'`, `'fill_blank'`, `'true_false'`
  - [x] `ComprehensionQuestion.options` is now required (not optional)
  - [x] `ComprehensionQuestion.correctBool` removed
  - [x] All 8 static stories in `STORY_POOL` updated to have 5 multiple choice questions each
  - [x] All 12 story templates in `STORY_TEMPLATES` updated to have 5 multiple choice questions each
  - [x] LLM prompt updated to request exactly 5 multiple choice questions (was 4 mixed types)
  - [x] `parseLLMStory()`, `hydrateStory()`, `generateProceduralStory()` all updated to use `type: 'multiple_choice' as const`
  - [x] `QuestionCard` component simplified — removed toggle button, fill_blank, true_false, open sections
  - [x] `QUESTION_TYPE_LABELS` removed from `page.tsx`
  - [x] `QuestionType` import removed from `page.tsx`

- [x] **Fix (Feb 2026) — Dutch voice dropdown not appearing on mobile:**
  - [x] Root cause: mobile browsers (Chrome on Android, Safari on iOS) return empty array from `getVoices()` on first call; `voiceschanged` event may not fire until user interaction
  - [x] Added retry polling in `useSpeech.ts`: after initial `loadVoices()` call, schedules retries at 100ms, 500ms, 1000ms, 2000ms delays to catch late-loading voices
  - [x] `loadVoices()` now only updates state when `availableVoices.length > 0` (avoids overwriting a populated list with an empty one)
  - [x] Mobile voice dropdown now shows even when `dutchVoices.length === 0`: renders a "No Dutch voices found — using browser default" message instead of hiding the row entirely
  - [x] Condition changed from `dutchVoices.length > 0 &&` to `isSupported &&` so the Voice row is always visible in the mobile settings panel when TTS is supported

- [x] **Update (Feb 2026) — Play Story resumes from last clicked sentence:**
  - [x] Added `lastClickedSentenceIdRef` (useRef) to track the last sentence the user clicked
  - [x] `handleSentenceClick` and `handleWordClick` both update `lastClickedSentenceIdRef.current`
  - [x] `handlePlayStory` now finds the start index from `lastClickedSentenceIdRef`, slices `sentences` and `texts` from that point, and passes the sliced arrays to `playSequence`
  - [x] `onSentenceStart` callback uses the sliced `slicedSentences[index]` (not the full array) so highlight and progress tracking remain correct
  - [x] Ref is reset to `null` on new story fetch, Next navigation, and Previous navigation so fresh stories always start from the beginning

- [x] **Update (Feb 2026) — Compact mobile footer with collapsible How-to-Use section:**
  - [x] Footer reduced from `py-8` to `py-3` on mobile (`lg:py-6` on desktop)
  - [x] On mobile: shows only credit line + "📖 How to Use ▼" toggle button
  - [x] Tapping toggle expands/collapses the 4-step instruction grid (`footerOpen` state)
  - [x] Desktop: full footer always visible, unchanged layout
  - [x] Card padding reduced (`p-3` vs `p-4`), emoji size reduced (`text-lg` vs `text-2xl`), rounded-lg vs rounded-xl
  - [x] Instruction text shortened for mobile readability

- [x] **Update (Feb 2026) — Improved TTS quality: smart voice selection + expanded speed options + voice picker:**
  - [x] `useSpeech.ts` — `scoreVoice()` ranks Dutch voices by quality: neural > enhanced > standard; prefers Microsoft Edge neural voices (Colette, Fenna, Maarten), Google, Apple; penalizes compact voices
  - [x] `getDutchVoices()` exported helper — returns all Dutch voices sorted by quality score
  - [x] Auto-selects best Dutch voice on load; user can override via voice selector dropdown
  - [x] `selectedVoice` / `setSelectedVoice` state exposed from hook; voice passed to all `speak()` and `playSequence()` calls
  - [x] Speed options expanded: `verySlow` (0.6×) / `slow` (0.8×) / `normal` (1.0×) / `fast` (1.2×) — was just slow/normal
  - [x] `SPEED_LABELS` exported for UI display
  - [x] Voice selector dropdown added to both mobile ⚙️ settings panel and desktop controls row
  - [x] Voice names cleaned up in UI (strips "Microsoft /Google /Apple " prefix); remote voices marked with ☁️

- [x] **Update (Feb 2026) — Mobile UX: compact header + no word tooltip overlay:**
  - [x] Header controls hidden behind ⚙️ toggle on mobile; desktop shows full controls row unchanged
  - [x] Mobile always-visible action bar: ← / → navigation, Play/Stop, level badge + topic emoji
  - [x] Collapsible settings panel (level, topic, speed) slides open on ⚙️ tap; auto-closes on selection
  - [x] Title row: About toggle (left), title (center), ⚙️ (right) — compact 3-column layout
  - [x] Removed `title` tooltip attribute from word `<span>` — no more browser native tooltip overlay on word hover/click
  - [x] Word translation still routes to bottom sheet (mobile) / sidebar (desktop) via `selectedWord` state

- [x] **Update (Feb 2026) — Mobile translation UX fix (fixed bottom sheet):**
  - [x] Translation panel no longer placed permanently at the bottom on mobile (avoids scroll-after-every-click problem)
  - [x] On mobile (`< lg`): translation panel renders as a **fixed bottom sheet** that slides up (`translate-y-0`) when a sentence/word is selected, and slides away (`translate-y-full`) when dismissed
  - [x] Drag handle bar at top of sheet; tap it (or the × button) to dismiss
  - [x] Sheet is `max-h-[55vh]` with `overflow-y-auto` so long translations don't cover the whole screen
  - [x] Main content gets `pb-[55vh]` on mobile when panel is open so the sheet never covers the last sentence
  - [x] Desktop sidebar (`lg:w-80 lg:sticky`) unchanged — now explicitly `hidden lg:block`
  - [x] Mobile-only stats panel added below comprehension questions (since sidebar is hidden on mobile)

- [x] **Update (Feb 2026) — About toggle + footer instructions:**
  - [x] "About" toggle button added next to the app title in the header
  - [x] Collapsible About panel: avatar emoji, Sanjay Bhaskar name, ASML, personal motivation text, tag badges
  - [x] Footer with 4-step "How to Use" guide (pick level/topic → read & listen → look up words → test yourself)
  - [x] Footer credit line: "Built with ❤️ by Sanjay Bhaskar"

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
    - [x] Reading progress tracked in localStorage
    - [x] Stories API returns a single story per request (not an array)
    - [x] OpenAI prompt: ≥500 words, 5-6 paragraphs, 4 comprehension questions
    - [x] Fallback pool: 8 pre-written stories (A1+A2, all 4 topics) each ≥500 words with Q&A
    - [x] Loading spinner during story generation
    - [x] Error state with "Try Again" button
  - [x] **Update (Feb 2026) — Varied Q&A types + Next/Previous navigation:**
    - [x] `ComprehensionQuestion` type extended: `type` (open/multiple_choice/fill_blank/true_false), `options?`, `correctBool?`
    - [x] Each story has 4 questions, one of each type
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
    - [x] API fallback chain: OpenAI → procedural generator → static pool
  - [x] **Update (Feb 2026) — Dutch Inburgering Practice rebranding + exam content:**
    - [x] Renamed app: "📚 Dutch Story Reader" → "🇳🇱 Dutch Inburgering Practice"
    - [x] Added subtitle: "Civic integration exam preparation · Reading & comprehension"
    - [x] Added 6 new inburgering topics: healthcare, housing, work and rights, civic integration, education, finance and taxes
    - [x] Added B1 and B2 levels (exam-difficulty) alongside A1/A2
    - [x] Level badge colors: A1=green, A2=blue, B1=orange, B2=red
    - [x] Updated story prompt to be inburgering-focused with formal Dutch register for B1/B2
    - [x] Added Groq free LLM API integration (`llama-3.1-8b-instant`) — set `GROQ_API_KEY` env var
    - [x] New API fallback chain: OpenAI → Groq → procedural → static pool
    - [x] Added 4 new B1/B2 story templates: healthcare (B1), housing (B1), work & rights (B2), civic integration (B2)
    - [x] `buildStoryPrompt()` shared function for both OpenAI and Groq
    - [x] `parseLLMStory()` shared JSON parser for both LLM responses
    - [x] Story type updated: `level: 'A1' | 'A2' | 'B1' | 'B2'`
    - [x] `StoryTopic` type updated with 6 new topics

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main app: single story, topic selector, Q&A, progress tracking | ✅ Updated |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `src/app/types/story.ts` | TypeScript types (Sentence, Paragraph, Story, ComprehensionQuestion, QuestionType, StoryTopic) | ✅ Updated |
| `src/app/api/stories/route.ts` | Story generation API — multi-tier LLM fallback, inburgering prompt, B1/B2 templates | ✅ Updated |
| `src/app/api/translate/route.ts` | Word/phrase translation API (OpenAI + MyMemory free API + dictionary fallback) | ✅ Ready |
| `src/app/hooks/useSpeech.ts` | TTS hook with `playSequence()` and speed support | ✅ Ready |
| `src/app/lib/tokenize.ts` | Sentence tokenization utility | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Data Model

```typescript
type StoryTopic = 'daily life' | 'travel' | 'market' | 'Dutch culture' | 'healthcare' | 'housing' | 'work and rights' | 'civic integration' | 'education' | 'finance and taxes';
type QuestionType = 'open' | 'multiple_choice' | 'fill_blank' | 'true_false';

interface Sentence { id, text, translation }
interface Paragraph { id, sentences: Sentence[] }
interface ComprehensionQuestion { id, type: QuestionType, question, answer, options?: string[], correctBool?: boolean }
interface Story { id, title, level: 'A1' | 'A2' | 'B1' | 'B2', topic, paragraphs: Paragraph[], questions?: ComprehensionQuestion[] }
```

## API Changes

### `/api/stories` (POST)
- **Request**: `{ level, topic, existingTitles }`
- **Response**: `{ story: Story }` (single story, not array)
- **Fallback chain**: OpenAI → Groq (free) → procedural generator → static pool
- OpenAI/Groq prompt generates ≥500 words, 5-6 paragraphs, 4 Q&A, inburgering-focused
- B1/B2 prompt uses formal Dutch register, civic/institutional scenarios
- Fallback pool: 8 stories covering all 4 original topics × 2 levels

### `/api/translate` (POST)
- **Request**: `{ text, context? }`
- **Response**: `{ translation }`
- Tier 1: Built-in dictionary (~150 common Dutch words)
- Tier 2: MyMemory free API (no key needed)
- Tier 3: `[No translation found for "…"]`

## Features Implemented

### Story Generation (Multi-tier)
1. **OpenAI** (`OPENAI_API_KEY`) — GPT-4o-mini, inburgering-focused prompt
2. **Groq** (`GROQ_API_KEY`) — llama-3.1-8b-instant, free tier, same prompt
3. **Procedural generator** — 12 templates (8 original A1/A2 + 4 new B1/B2) × random vars
4. **Static pool** — 8 pre-written stories (last resort)

### Topics (10 total)
- Daily Life, Travel, Market, Dutch Culture (original)
- Healthcare, Housing, Work & Rights, Civic Integration, Education, Finance & Taxes (new)

### Levels (4 total)
- A1 (beginner), A2 (elementary) — original
- B1 (intermediate, formal language), B2 (upper-intermediate, exam-level) — new

### Story Navigation
- **Next**: Navigates forward in local story cache, or fetches a new unique story if at the end
- **Previous**: Navigates back in local story cache (no re-fetch)
- **Story counter**: Shows current position "X / Y" in history
- **Level/Topic change**: Resets history and fetches fresh story

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
- `OPENAI_API_KEY`: For AI-generated stories and word translations (OpenAI)
- `GROQ_API_KEY`: For AI-generated stories via Groq free tier (get at https://console.groq.com)

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
| Feb 2026 | Rebrand to Dutch Inburgering Practice; B1/B2 levels; 6 new topics; Groq free LLM; exam-style prompts |
| Feb 2026 | Mobile UX: compact header + ⚙️ settings panel; fixed bottom sheet for translation; About toggle |
| Feb 2026 | Improved TTS: smart voice selection (neural > enhanced > standard), 4 speed options, voice picker UI |
| Feb 2026 | Compact mobile footer: collapsible How-to-Use section, reduced padding/font sizes |
| Feb 2026 | Play Story resumes from last clicked sentence (lastClickedSentenceIdRef) |
| Feb 2026 | Fix: Dutch voice dropdown on mobile — retry polling (100/500/1000/2000ms) + fallback message when no Dutch voices found |
| Feb 2026 | Voice dropdown always visible with "Default Dutch (nl-NL)" option; Q&A changed to 5 multiple choice only |
| Mar 2026 | Added A2 inburgering story "Een Afspraak bij de Huisarts" to STORY_POOL (9 stories total) |

## Notes

- API now returns `{ story }` (singular) not `{ stories }` (array)
- Progress is stored in `localStorage` under key `dutch-reader-progress`
- Fallback pool has 8 stories: 2 per topic (1 A1 + 1 A2 each), all ≥500 words
- `existingTitles` (all cached story titles) prevents duplicate stories when clicking Next
- Story history is stored in React state (`storyHistory[]` + `currentIndex`); Previous navigates without re-fetching
- Each story has 5 questions, all `multiple_choice` type
- Procedural generator now has 12 templates (8 A1/A2 + 4 B1/B2 inburgering templates)
- Groq API uses `llama-3.1-8b-instant` model — free tier, no credit card required
- B1/B2 stories cover: healthcare system, housing/rental law, employment rights, civic integration exam
