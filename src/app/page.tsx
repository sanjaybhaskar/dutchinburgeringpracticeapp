'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Story, Sentence, Paragraph } from './types/story';
import { useSpeech, PlaybackSpeed, SPEED_RATES } from './hooks/useSpeech';
import { tokenizeSentence, stripPunctuation } from './lib/tokenize';

// ─── Selection types ──────────────────────────────────────────────────────────

type SelectionKind = 'sentence' | 'word';

interface Selection {
  kind: SelectionKind;
  /** For sentence: the sentence id. For word: "sentenceId::tokenText" */
  id: string;
  /** The Dutch text that was selected */
  text: string;
  /** Translation (sentence: from data; word: fetched async) */
  translation: string | null;
  /** The full sentence text (for word context) */
  sentenceText?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten all sentences from a story in order */
function getAllSentences(story: Story): Sentence[] {
  return story.paragraphs.flatMap((p) => p.sentences);
}

/** Flatten all sentences from all stories */
function getAllStorySentences(stories: Story[]): Array<{ storyId: string; sentence: Sentence }> {
  return stories.flatMap((story) =>
    story.paragraphs.flatMap((p) =>
      p.sentences.map((s) => ({ storyId: story.id, sentence: s }))
    )
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [level, setLevel] = useState<'A1' | 'A2'>('A1');
  const [speed, setSpeed] = useState<PlaybackSpeed>('normal');
  // Which sentence id is currently being spoken during story playback
  const [speakingSentenceId, setSpeakingSentenceId] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const { speak, playSequence, stop, isSpeaking, isPlayingStory, isSupported } = useSpeech();

  // ── Story fetching ──────────────────────────────────────────────────────────

  const fetchStories = useCallback(
    async (replace = false, existingTitles: string[] = []) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: 3, level, existingTitles }),
        });

        const data = await response.json();

        if (data.error) setError(data.error);

        if (replace) {
          setStories(data.stories || []);
        } else {
          setStories((prev) => [...prev, ...(data.stories || [])]);
        }
      } catch (err) {
        setError('Failed to load stories. Please try again.');
        console.error('Error fetching stories:', err);
      } finally {
        setLoading(false);
      }
    },
    [level]
  );

  useEffect(() => {
    fetchStories(true, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  // ── Word translation ────────────────────────────────────────────────────────

  const fetchWordTranslation = useCallback(async (word: string, context?: string): Promise<string> => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word, context }),
      });
      const data = await res.json();
      return data.translation || '[No translation]';
    } catch {
      return '[Translation error]';
    }
  }, []);

  // ── Selection handlers ──────────────────────────────────────────────────────

  const handleSentenceClick = useCallback(
    (sentence: Sentence) => {
      stop();
      setSpeakingSentenceId(null);
      setSelection({
        kind: 'sentence',
        id: sentence.id,
        text: sentence.text,
        translation: sentence.translation,
      });
      speak(sentence.text, { lang: 'nl-NL', rate: SPEED_RATES[speed] });
    },
    [stop, speak, speed]
  );

  const handleWordClick = useCallback(
    async (word: string, sentenceId: string, sentenceText: string) => {
      const clean = stripPunctuation(word);
      if (!clean) return;

      stop();
      setSpeakingSentenceId(null);

      const selId = `${sentenceId}::${word}`;

      // Set selection immediately with null translation (loading)
      setSelection({
        kind: 'word',
        id: selId,
        text: clean,
        translation: null,
        sentenceText,
      });
      setTranslating(true);

      // Speak the word
      speak(clean, { lang: 'nl-NL', rate: SPEED_RATES[speed] });

      // Fetch translation async
      const translation = await fetchWordTranslation(clean, sentenceText);
      setTranslating(false);
      setSelection((prev) =>
        prev?.id === selId ? { ...prev, translation } : prev
      );
    },
    [stop, speak, speed, fetchWordTranslation]
  );

  // ── Story playback ──────────────────────────────────────────────────────────

  const handlePlayStory = useCallback(
    (story: Story) => {
      const sentences = getAllSentences(story);
      const texts = sentences.map((s) => s.text);

      setSelection(null);

      playSequence(
        texts,
        { lang: 'nl-NL', rate: SPEED_RATES[speed] },
        (index) => {
          setSpeakingSentenceId(sentences[index]?.id ?? null);
        },
        () => {
          setSpeakingSentenceId(null);
        }
      );
    },
    [playSequence, speed]
  );

  const handlePlayAll = useCallback(() => {
    const allSentences = getAllStorySentences(stories);
    const texts = allSentences.map(({ sentence }) => sentence.text);

    setSelection(null);

    playSequence(
      texts,
      { lang: 'nl-NL', rate: SPEED_RATES[speed] },
      (index) => {
        setSpeakingSentenceId(allSentences[index]?.sentence.id ?? null);
      },
      () => {
        setSpeakingSentenceId(null);
      }
    );
  }, [playSequence, speed, stories]);

  const handleStop = useCallback(() => {
    stop();
    setSpeakingSentenceId(null);
  }, [stop]);

  const handleSpeakAgain = useCallback(() => {
    if (!selection) return;
    stop();
    speak(selection.text, { lang: 'nl-NL', rate: SPEED_RATES[speed] });
  }, [selection, stop, speak, speed]);

  // ── Other handlers ──────────────────────────────────────────────────────────

  const handleRefresh = () => {
    handleStop();
    setSelection(null);
    fetchStories(true, []);
  };

  const handleAddMore = () => {
    fetchStories(false, stories.map((s) => s.title));
  };

  const handleLevelChange = (newLevel: 'A1' | 'A2') => {
    handleStop();
    setLevel(newLevel);
    setSelection(null);
  };

  const handleSpeedChange = (newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed);
  };

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center mb-4">📚 AI Story Reader</h1>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Level selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">Level:</span>
              <select
                value={level}
                onChange={(e) => handleLevelChange(e.target.value as 'A1' | 'A2')}
                className="bg-neutral-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
              </select>
            </div>

            {/* Speed selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">Speed:</span>
              <div className="flex rounded-lg overflow-hidden border border-neutral-600">
                {(['slow', 'normal'] as PlaybackSpeed[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      speed === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    }`}
                  >
                    {s === 'slow' ? '🐢 Slow' : '🐇 Normal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>🔄</span>
              Refresh Stories
            </button>

            {/* Add more button */}
            <button
              onClick={handleAddMore}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              Add More Stories
            </button>

            {/* Play All / Stop */}
            {stories.length > 0 && (
              isPlayingStory ? (
                <button
                  onClick={handleStop}
                  className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>⏹</span>
                  Stop
                </button>
              ) : (
                <button
                  onClick={handlePlayAll}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>▶️</span>
                  Play All
                </button>
              )
            )}
          </div>

          {!isSupported && (
            <p className="text-yellow-500 text-xs text-center mt-3">
              ⚠️ Text-to-speech not supported in this browser
            </p>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-neutral-400">Loading stories...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6">
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400">
              {error}
            </div>
          </div>
        )}

        {!loading && stories.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Stories column */}
            <div className="lg:flex-1 flex flex-col gap-6">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  selection={selection}
                  speakingSentenceId={speakingSentenceId}
                  isPlayingStory={isPlayingStory}
                  onSentenceClick={handleSentenceClick}
                  onWordClick={handleWordClick}
                  onPlayStory={handlePlayStory}
                  onStop={handleStop}
                />
              ))}
            </div>

            {/* Side translation panel */}
            <aside className="lg:w-80 lg:sticky lg:top-24 lg:self-start">
              <TranslationPanel
                selection={selection}
                translating={translating}
                isSpeaking={isSpeaking}
                onSpeakAgain={handleSpeakAgain}
                onClose={() => {
                  handleStop();
                  setSelection(null);
                }}
              />
            </aside>
          </div>
        )}

        {!loading && stories.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <p className="text-lg mb-4">No stories available</p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Load Stories
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Translation Side Panel ───────────────────────────────────────────────────

interface TranslationPanelProps {
  selection: Selection | null;
  translating: boolean;
  isSpeaking: boolean;
  onSpeakAgain: () => void;
  onClose: () => void;
}

function TranslationPanel({
  selection,
  translating,
  isSpeaking,
  onSpeakAgain,
  onClose,
}: TranslationPanelProps) {
  return (
    <div className="bg-neutral-800 rounded-xl p-6 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
          {selection?.kind === 'word' ? 'Word / Phrase' : 'Translation'}
        </h2>
        {selection && (
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white text-xl leading-none transition-colors"
            aria-label="Close translation"
          >
            ×
          </button>
        )}
      </div>

      {selection ? (
        <div className="space-y-4">
          {/* Selected text */}
          <div>
            <p className="text-xs text-neutral-500 mb-1">
              {selection.kind === 'word' ? '🔤 Word / Phrase' : '🇳🇱 Dutch Sentence'}
            </p>
            <p className="text-lg font-medium text-white leading-relaxed">
              {selection.text}
            </p>
          </div>

          {/* Context sentence (for word selections) */}
          {selection.kind === 'word' && selection.sentenceText && (
            <div>
              <p className="text-xs text-neutral-500 mb-1">📖 In context</p>
              <p className="text-sm text-neutral-300 leading-relaxed italic">
                {selection.sentenceText}
              </p>
            </div>
          )}

          {/* Translation */}
          <div>
            <p className="text-xs text-neutral-500 mb-1">🇬🇧 English</p>
            {translating ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Translating...</span>
              </div>
            ) : (
              <p className="text-lg font-medium text-green-400 leading-relaxed">
                {selection.translation ?? '—'}
              </p>
            )}
          </div>

          {/* Speak Again */}
          <button
            onClick={onSpeakAgain}
            disabled={isSpeaking}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>{isSpeaking ? '🔊' : '▶️'}</span>
            {isSpeaking ? 'Speaking...' : 'Speak Again'}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">👆</p>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Click any <strong className="text-neutral-300">sentence</strong> to hear it and see its translation.
          </p>
          <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
            Or click an individual <strong className="text-neutral-400">word</strong> to look it up.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Story Card ───────────────────────────────────────────────────────────────

interface StoryCardProps {
  story: Story;
  selection: Selection | null;
  speakingSentenceId: string | null;
  isPlayingStory: boolean;
  onSentenceClick: (sentence: Sentence) => void;
  onWordClick: (word: string, sentenceId: string, sentenceText: string) => void;
  onPlayStory: (story: Story) => void;
  onStop: () => void;
}

function StoryCard({
  story,
  selection,
  speakingSentenceId,
  isPlayingStory,
  onSentenceClick,
  onWordClick,
  onPlayStory,
  onStop,
}: StoryCardProps) {
  const isThisStoryPlaying =
    isPlayingStory &&
    story.paragraphs.some((p) => p.sentences.some((s) => s.id === speakingSentenceId));

  return (
    <article className="bg-neutral-800 rounded-xl p-6">
      {/* Story header */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{story.title}</h2>
          {story.topic && (
            <p className="text-sm text-neutral-400 mt-0.5">{story.topic}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-block text-xs px-2 py-1 rounded font-medium ${
              story.level === 'A1'
                ? 'bg-green-900/60 text-green-400'
                : 'bg-blue-900/60 text-blue-400'
            }`}
          >
            {story.level}
          </span>
          {/* Play/Stop this story */}
          {isThisStoryPlaying ? (
            <button
              onClick={onStop}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded font-medium transition-colors flex items-center gap-1"
              title="Stop playback"
            >
              ⏹ Stop
            </button>
          ) : (
            <button
              onClick={() => onPlayStory(story)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded font-medium transition-colors flex items-center gap-1"
              title="Play this story"
            >
              ▶ Play
            </button>
          )}
        </div>
      </div>

      {/* Paragraphs */}
      <div className="space-y-4">
        {story.paragraphs.map((paragraph) => (
          <ParagraphBlock
            key={paragraph.id}
            paragraph={paragraph}
            selection={selection}
            speakingSentenceId={speakingSentenceId}
            onSentenceClick={onSentenceClick}
            onWordClick={onWordClick}
          />
        ))}
      </div>

      {/* Hint */}
      <p className="text-xs text-neutral-500 mt-4">
        👆 Click a <span className="text-neutral-400">sentence</span> to hear it · Click a{' '}
        <span className="text-neutral-400">word</span> to look it up
      </p>
    </article>
  );
}

// ─── Paragraph Block ──────────────────────────────────────────────────────────

interface ParagraphBlockProps {
  paragraph: Paragraph;
  selection: Selection | null;
  speakingSentenceId: string | null;
  onSentenceClick: (sentence: Sentence) => void;
  onWordClick: (word: string, sentenceId: string, sentenceText: string) => void;
}

function ParagraphBlock({
  paragraph,
  selection,
  speakingSentenceId,
  onSentenceClick,
  onWordClick,
}: ParagraphBlockProps) {
  return (
    <p className="text-neutral-200 leading-relaxed text-base">
      {paragraph.sentences.map((sentence, sIdx) => (
        <span key={sentence.id}>
          <SentenceSpan
            sentence={sentence}
            selection={selection}
            isSpeakingNow={speakingSentenceId === sentence.id}
            onSentenceClick={onSentenceClick}
            onWordClick={onWordClick}
          />
          {sIdx < paragraph.sentences.length - 1 && ' '}
        </span>
      ))}
    </p>
  );
}

// ─── Sentence Span ────────────────────────────────────────────────────────────

interface SentenceSpanProps {
  sentence: Sentence;
  selection: Selection | null;
  isSpeakingNow: boolean;
  onSentenceClick: (sentence: Sentence) => void;
  onWordClick: (word: string, sentenceId: string, sentenceText: string) => void;
}

function SentenceSpan({
  sentence,
  selection,
  isSpeakingNow,
  onSentenceClick,
  onWordClick,
}: SentenceSpanProps) {
  const isSentenceSelected = selection?.kind === 'sentence' && selection.id === sentence.id;
  const selectedWordKey =
    selection?.kind === 'word' && selection.id.startsWith(`${sentence.id}::`)
      ? selection.id.split('::')[1]
      : null;

  // Tokenize once per render (stable since sentence.text doesn't change)
  const tokens = tokenizeSentence(sentence.id, sentence.text);

  // Sentence-level highlight: yellow if selected, cyan if currently being spoken
  const sentenceBg = isSpeakingNow
    ? 'bg-cyan-700/60'
    : isSentenceSelected
    ? 'bg-yellow-200/20'
    : '';

  return (
    <span
      className={`rounded px-0.5 transition-colors ${sentenceBg}`}
      // Double-click or right-click selects the whole sentence
      onDoubleClick={() => onSentenceClick(sentence)}
    >
      {tokens.map((token) => {
        if (!token.isWord) {
          // Punctuation / space — render as-is
          return <span key={token.id}>{token.text}</span>;
        }

        const clean = stripPunctuation(token.text);
        const isWordSelected = selectedWordKey === token.text || selectedWordKey === clean;

        return (
          <span
            key={token.id}
            className={`cursor-pointer rounded transition-colors ${
              isWordSelected
                ? 'bg-yellow-300 text-neutral-900 font-medium'
                : isSentenceSelected
                ? 'hover:bg-blue-200/30'
                : isSpeakingNow
                ? 'hover:bg-cyan-500/30'
                : 'hover:bg-blue-100/20'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onWordClick(token.text, sentence.id, sentence.text);
            }}
            title={`Click to look up "${clean}"`}
          >
            {token.text}
          </span>
        );
      })}
    </span>
  );
}
