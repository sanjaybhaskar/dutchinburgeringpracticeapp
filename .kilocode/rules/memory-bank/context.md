# Active Context: AI Story Reader App

## Current State

**Project Status**: ✅ Complete - AI Story Reader with word tokenization, story TTS playback, speed control, and word translation

The AI Story Reader app is fully functional with Dutch learning stories, text-to-speech, interactive sentence/word features, paragraph-based layout, side translation panel, full story playback, and speed control.

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
  - [x] Refresh Stories button (replace stories)
  - [x] Add More Stories button (append stories, passes existing titles to avoid duplicates)
  - [x] Clickable sentences with highlight (yellow background when selected)
  - [x] Web Speech API for TTS
  - [x] Side translation panel (desktop: sticky right column; mobile: below stories)
  - [x] Loading states and error handling
  - [x] **Redesign (Feb 2026):**
    - [x] Running text paragraph layout (sentences as inline `<span>` elements)
    - [x] `Paragraph` type added to story data model
    - [x] `topic` field added to `Story` type
    - [x] Side translation panel with "Speak Again" button
    - [x] Stories now have 4-6 paragraphs with 4-8 sentences each (500+ words)
    - [x] API accepts `existingTitles` to prevent duplicate stories on "Add More"
    - [x] Longer fallback stories (4 paragraphs each)
  - [x] **Word tokenization & advanced TTS (Feb 2026):**
    - [x] Sentences tokenized into clickable word/phrase spans
    - [x] Click word → look up translation in side panel (with context)
    - [x] Double-click sentence → select whole sentence
    - [x] Word translation API (`/api/translate`) with OpenAI + dictionary fallback
    - [x] Full story TTS playback (▶ Play button per story + Play All in header)
    - [x] Slow / Normal speed control toggle
    - [x] Sentence highlight (cyan) during story playback
    - [x] Word highlight (yellow) when word is selected
    - [x] Stop button during playback
    - [x] `playSequence()` in `useSpeech` hook for sequential TTS with callbacks
    - [x] `tokenizeSentence()` utility in `src/app/lib/tokenize.ts`

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main app component with tokenized text, side panel, playback controls | ✅ Updated |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `src/app/types/story.ts` | TypeScript types (Sentence, Paragraph, Story) | ✅ Ready |
| `src/app/api/stories/route.ts` | Story generation API with paragraphs + existingTitles | ✅ Ready |
| `src/app/api/translate/route.ts` | Word/phrase translation API (OpenAI + dictionary fallback) | ✅ New |
| `src/app/hooks/useSpeech.ts` | TTS hook with `playSequence()` and speed support | ✅ Updated |
| `src/app/lib/tokenize.ts` | Sentence tokenization utility | ✅ New |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Data Model

```typescript
interface Sentence { id, text, translation }
interface Paragraph { id, sentences: Sentence[] }
interface Story { id, title, level, topic, paragraphs: Paragraph[] }
```

## Features Implemented

### Story Management
- **Refresh Stories**: Replaces all current stories with new ones
- **Add More Stories**: Appends new stories, passes `existingTitles` to API to avoid duplicates
- **Level Selection**: Toggle between A1 (beginner) and A2 (elementary) Dutch

### Running Text Layout
- Stories rendered as flowing paragraphs (not button lists)
- Each sentence is an inline `<span>` within a `<p>` tag
- Sentences tokenized into individual word `<span>` elements

### Word/Sentence Interaction
- **Click word** → highlights word (yellow), shows translation in side panel, speaks word
- **Double-click sentence** → highlights sentence, shows full translation, speaks sentence
- **Sentence highlight**: yellow background when selected, cyan when being spoken during playback
- **Word highlight**: yellow background when selected

### Side Translation Panel
- Desktop (lg+): Sticky right column (w-80)
- Mobile: Below stories
- Shows selected Dutch text (word or sentence) + English translation
- Shows context sentence for word selections
- "Speak Again" button to replay TTS
- Loading spinner while translating words
- Placeholder message when nothing selected

### Full Story TTS Playback
- **▶ Play** button on each story card
- **▶️ Play All** button in header (plays all stories sequentially)
- **⏹ Stop** button replaces Play during playback
- Sentence highlighted in cyan as it's being spoken
- Speed control: 🐢 Slow (0.6x) / 🐇 Normal (0.9x)

### Word Translation API
- `/api/translate` POST endpoint
- Uses OpenAI GPT-4o-mini with context for accurate translations
- Falls back to built-in Dutch dictionary when no API key

## Configuration

### Environment Variables (Optional)
- `OPENAI_API_KEY`: Your OpenAI API key for AI-generated stories and word translations

## Quick Start Guide

### To run the app:
```bash
bun run dev
```

### To build for production:
```bash
bun run build
```

## Pending Improvements

- [ ] Add more story themes/topics
- [ ] Add pronunciation speed control slider (instead of toggle)
- [ ] Add bookmark/favorite sentences feature
- [ ] Add word-level boundary highlighting during TTS (requires SpeechSynthesisEvent boundary support)

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| Feb 2026 | AI Story Reader app fully implemented |
| Feb 2026 | Redesign: running text paragraphs, side panel, longer unique stories |
| Feb 2026 | Word tokenization, story TTS playback, speed control, word translation API |

## Notes

- Default stories are provided as fallback when no OpenAI API key is configured
- The app works entirely client-side for TTS functionality
- Stories are displayed in a two-column layout on desktop (stories + side panel)
- `existingTitles` parameter prevents duplicate stories when adding more
- Word translation uses OpenAI with sentence context for accuracy; falls back to built-in dictionary
