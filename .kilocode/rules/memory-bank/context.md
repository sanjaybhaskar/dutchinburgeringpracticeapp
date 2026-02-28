# Active Context: AI Story Reader App

## Current State

**Project Status**: ✅ Complete - AI Story Reader web app redesigned with running text paragraphs and side panel

The AI Story Reader app is fully functional with Dutch learning stories, text-to-speech, interactive sentence features, paragraph-based layout, and a side translation panel.

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

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main app component with side panel layout | ✅ Redesigned |
| `src/app/layout.tsx` | Root layout | ✅ Updated |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `src/app/types/story.ts` | TypeScript types (Sentence, Paragraph, Story) | ✅ Updated |
| `src/app/api/stories/route.ts` | Story generation API with paragraphs + existingTitles | ✅ Updated |
| `src/app/hooks/useSpeech.ts` | TTS hook | ✅ Unchanged |
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
- Clicking a sentence highlights it with yellow background
- Non-selected sentences show blue hover highlight

### Side Translation Panel
- Desktop (lg+): Sticky right column (w-80)
- Mobile: Below stories
- Shows selected Dutch sentence + English translation
- "Speak Again" button to replay TTS
- Placeholder message when no sentence selected

### Data
- Clean JSON structure with Story, Paragraph, Sentence types
- OpenAI API integration for AI-generated stories (4-6 paragraphs, 500+ words)
- Fallback default stories with paragraph structure

## Configuration

### Environment Variables (Optional)
- `OPENAI_API_KEY`: Your OpenAI API key for AI-generated stories

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
- [ ] Add pronunciation speed control
- [ ] Add bookmark/favorite sentences feature

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| Feb 2026 | AI Story Reader app fully implemented |
| Feb 2026 | Redesign: running text paragraphs, side panel, longer unique stories |

## Notes

- Default stories are provided as fallback when no OpenAI API key is configured
- The app works entirely client-side for TTS functionality
- Stories are displayed in a two-column layout on desktop (stories + side panel)
- `existingTitles` parameter prevents duplicate stories when adding more
