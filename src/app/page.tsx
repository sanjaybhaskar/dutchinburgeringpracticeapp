'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Story, Sentence, Paragraph, ComprehensionQuestion, StoryTopic, QuestionType } from './types/story';
import { useSpeech, PlaybackSpeed, SPEED_RATES } from './hooks/useSpeech';
import { tokenizeSentence, stripPunctuation } from './lib/tokenize';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOPICS: { value: StoryTopic; label: string; emoji: string }[] = [
  { value: 'daily life', label: 'Daily Life', emoji: '🏠' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'market', label: 'Market', emoji: '🛒' },
  { value: 'Dutch culture', label: 'Dutch Culture', emoji: '🌷' },
];

const PROGRESS_KEY = 'dutch-reader-progress';

// ─── Progress tracking ────────────────────────────────────────────────────────

interface ReadingProgress {
  /** Set of story titles that have been fully read (all sentences seen) */
  readStoryTitles: string[];
  /** Set of sentence IDs that have been clicked/heard */
  heardSentenceIds: string[];
}

function loadProgress(): ReadingProgress {
  if (typeof window === 'undefined') return { readStoryTitles: [], heardSentenceIds: [] };
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { readStoryTitles: [], heardSentenceIds: [] };
    return JSON.parse(raw);
  } catch {
    return { readStoryTitles: [], heardSentenceIds: [] };
  }
}

function saveProgress(progress: ReadingProgress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage errors
  }
}

// ─── Selection types ──────────────────────────────────────────────────────────

interface SelectedSentence {
  id: string;
  text: string;
  translation: string;
}

interface SelectedWord {
  key: string;
  sentenceId: string;
  text: string;
  sentenceText: string;
  translation: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAllSentences(story: Story): Sentence[] {
  return story.paragraphs.flatMap((p) => p.sentences);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  // Story history cache: array of fetched stories; currentIndex points to the active one
  const [storyHistory, setStoryHistory] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Derived: current story
  const story = currentIndex >= 0 ? storyHistory[currentIndex] ?? null : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Two independent selection states
  const [selectedSentence, setSelectedSentence] = useState<SelectedSentence | null>(null);
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [translatingWord, setTranslatingWord] = useState(false);

  const [level, setLevel] = useState<'A1' | 'A2'>('A1');
  const [topic, setTopic] = useState<StoryTopic>('daily life');
  const [speed, setSpeed] = useState<PlaybackSpeed>('normal');

  // Which sentence id is currently being spoken during story playback
  const [speakingSentenceId, setSpeakingSentenceId] = useState<string | null>(null);

  // Q&A state — keyed by story id so each story has independent answer reveals
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());
  // Multiple-choice selected option per question id
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Progress tracking
  const [progress, setProgress] = useState<ReadingProgress>({ readStoryTitles: [], heardSentenceIds: [] });
  const progressRef = useRef<ReadingProgress>({ readStoryTitles: [], heardSentenceIds: [] });

  const { speak, playSequence, stop, isSpeaking, isPlayingStory, isSupported } = useSpeech();

  // Load progress from localStorage on mount
  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    progressRef.current = p;
  }, []);

  // ── Story fetching ──────────────────────────────────────────────────────────

  /**
   * Fetch a new story and append it to the history.
   * existingTitles is derived from the current history to avoid repeats.
   */
  const fetchStory = useCallback(
    async (opts: { level: 'A1' | 'A2'; topic: string; existingTitles: string[] }) => {
      setLoading(true);
      setError(null);
      setSelectedSentence(null);
      setSelectedWord(null);
      setRevealedAnswers(new Set());
      setSelectedOptions({});
      stop();
      setSpeakingSentenceId(null);

      try {
        const response = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: opts.level,
            topic: opts.topic,
            existingTitles: opts.existingTitles,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          setError(data.error);
        }

        if (data.story) {
          setStoryHistory((prev) => {
            const next = [...prev, data.story];
            setCurrentIndex(next.length - 1);
            return next;
          });
        }
      } catch (err) {
        setError('Failed to load story. Please try again.');
        console.error('Error fetching story:', err);
      } finally {
        setLoading(false);
      }
    },
    [stop]
  );

  // Load initial story on mount
  useEffect(() => {
    fetchStory({ level, topic, existingTitles: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ── Progress helpers ────────────────────────────────────────────────────────

  const markSentenceHeard = useCallback(
    (sentenceId: string) => {
      const current = progressRef.current;
      if (current.heardSentenceIds.includes(sentenceId)) return;
      const updated: ReadingProgress = {
        ...current,
        heardSentenceIds: [...current.heardSentenceIds, sentenceId],
      };
      progressRef.current = updated;
      setProgress(updated);
      saveProgress(updated);

      // Check if all sentences in the current story have been heard
      if (story) {
        const allIds = getAllSentences(story).map((s) => s.id);
        const heardSet = new Set(updated.heardSentenceIds);
        if (allIds.every((id) => heardSet.has(id))) {
          if (!updated.readStoryTitles.includes(story.title)) {
            const withStory: ReadingProgress = {
              ...updated,
              readStoryTitles: [...updated.readStoryTitles, story.title],
            };
            progressRef.current = withStory;
            setProgress(withStory);
            saveProgress(withStory);
          }
        }
      }
    },
    [story]
  );

  // ── Selection handlers ──────────────────────────────────────────────────────

  const handleSentenceClick = useCallback(
    (sentence: Sentence) => {
      stop();
      setSpeakingSentenceId(null);
      setSelectedSentence({
        id: sentence.id,
        text: sentence.text,
        translation: sentence.translation,
      });
      setSelectedWord(null);
      speak(sentence.text, { lang: 'nl-NL', rate: SPEED_RATES[speed] });
      markSentenceHeard(sentence.id);
    },
    [stop, speak, speed, markSentenceHeard]
  );

  const handleWordClick = useCallback(
    async (word: string, sentence: Sentence) => {
      const clean = stripPunctuation(word);
      if (!clean) return;

      const alreadySelected = selectedSentence?.id === sentence.id;
      if (!alreadySelected) {
        stop();
        setSpeakingSentenceId(null);
        setSelectedSentence({
          id: sentence.id,
          text: sentence.text,
          translation: sentence.translation,
        });
        speak(sentence.text, { lang: 'nl-NL', rate: SPEED_RATES[speed] });
        markSentenceHeard(sentence.id);
      }

      const wordKey = `${sentence.id}::${word}`;

      setSelectedWord({
        key: wordKey,
        sentenceId: sentence.id,
        text: clean,
        sentenceText: sentence.text,
        translation: null,
      });
      setTranslatingWord(true);

      const translation = await fetchWordTranslation(clean, sentence.text);
      setTranslatingWord(false);
      setSelectedWord((prev) =>
        prev?.key === wordKey ? { ...prev, translation } : prev
      );
    },
    [stop, speak, speed, fetchWordTranslation, selectedSentence, markSentenceHeard]
  );

  // ── Story playback ──────────────────────────────────────────────────────────

  const handlePlayStory = useCallback(() => {
    if (!story) return;
    const sentences = getAllSentences(story);
    const texts = sentences.map((s) => s.text);

    setSelectedSentence(null);
    setSelectedWord(null);

    playSequence(
      texts,
      { lang: 'nl-NL', rate: SPEED_RATES[speed] },
      (index) => {
        const s = sentences[index];
        if (s) {
          setSpeakingSentenceId(s.id);
          markSentenceHeard(s.id);
        }
      },
      () => {
        setSpeakingSentenceId(null);
      }
    );
  }, [story, playSequence, speed, markSentenceHeard]);

  const handleStop = useCallback(() => {
    stop();
    setSpeakingSentenceId(null);
  }, [stop]);

  const handleSpeakAgain = useCallback(() => {
    if (!selectedSentence) return;
    stop();
    speak(selectedSentence.text, { lang: 'nl-NL', rate: SPEED_RATES[speed] });
  }, [selectedSentence, stop, speak, speed]);

  // ── Navigation handlers ─────────────────────────────────────────────────────

  /** Navigate to the next story: fetch a new one if at the end of history */
  const handleNext = useCallback(() => {
    if (currentIndex < storyHistory.length - 1) {
      // Navigate forward in existing history
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedSentence(null);
      setSelectedWord(null);
      setRevealedAnswers(new Set());
      setSelectedOptions({});
      stop();
      setSpeakingSentenceId(null);
    } else {
      // Fetch a brand-new story; pass ALL titles in history to avoid repeats
      const existingTitles = storyHistory.map((s) => s.title);
      fetchStory({ level, topic, existingTitles });
    }
  }, [currentIndex, storyHistory, level, topic, fetchStory, stop]);

  /** Navigate to the previous story from local cache */
  const handlePrev = useCallback(() => {
    if (currentIndex <= 0) return;
    const prevIdx = currentIndex - 1;
    setCurrentIndex(prevIdx);
    setSelectedSentence(null);
    setSelectedWord(null);
    setRevealedAnswers(new Set());
    setSelectedOptions({});
    stop();
    setSpeakingSentenceId(null);
  }, [currentIndex, stop]);

  const handleLevelChange = (newLevel: 'A1' | 'A2') => {
    setLevel(newLevel);
    // Reset history when level changes
    setStoryHistory([]);
    setCurrentIndex(-1);
    fetchStory({ level: newLevel, topic, existingTitles: [] });
  };

  const handleTopicChange = (newTopic: StoryTopic) => {
    setTopic(newTopic);
    // Reset history when topic changes
    setStoryHistory([]);
    setCurrentIndex(-1);
    fetchStory({ level, topic: newTopic, existingTitles: [] });
  };

  const handleSpeedChange = (newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed);
  };

  // ── Q&A handlers ────────────────────────────────────────────────────────────

  const toggleAnswer = (questionId: string) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedOptions((prev) => ({ ...prev, [questionId]: option }));
    // Auto-reveal answer when an option is selected
    setRevealedAnswers((prev) => new Set([...prev, questionId]));
  };

  // ── Computed ────────────────────────────────────────────────────────────────

  const storyProgress = story
    ? (() => {
        const allIds = getAllSentences(story).map((s) => s.id);
        const heardSet = new Set(progress.heardSentenceIds);
        const heard = allIds.filter((id) => heardSet.has(id)).length;
        return { heard, total: allIds.length, pct: Math.round((heard / allIds.length) * 100) };
      })()
    : null;

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center mb-4">📚 Dutch Story Reader</h1>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Level selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">Level:</span>
              <div className="flex rounded-lg overflow-hidden border border-neutral-600">
                {(['A1', 'A2'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLevelChange(l)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      level === l
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">Topic:</span>
              <select
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value as StoryTopic)}
                className="bg-neutral-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-600"
              >
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </option>
                ))}
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

            {/* Prev / Next navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={loading || currentIndex <= 0}
                title="Previous story"
                className="bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:cursor-not-allowed px-3 py-1.5 rounded-l-lg text-sm font-medium transition-colors flex items-center gap-1 border-r border-neutral-600"
              >
                ← Prev
              </button>
              <span className="bg-neutral-700 px-2 py-1.5 text-xs text-neutral-400 select-none">
                {storyHistory.length === 0 ? '—' : `${currentIndex + 1} / ${storyHistory.length}`}
              </span>
              <button
                onClick={handleNext}
                disabled={loading}
                title="Next story"
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-3 py-1.5 rounded-r-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                Next →
              </button>
            </div>

            {/* Play / Stop */}
            {story && (
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
                  onClick={handlePlayStory}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>▶️</span>
                  Play Story
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
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-400 text-lg">Generating your story...</p>
            <p className="text-neutral-500 text-sm mt-1">This may take a moment</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="mb-6">
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-medium">Error loading story</p>
                <p className="text-sm mt-1">{error}</p>
                <button
                  onClick={handleNext}
                  className="mt-3 bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Story content */}
        {!loading && story && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Story column */}
            <div className="lg:flex-1 min-w-0">
              {/* Story header */}
              <div className="bg-neutral-800 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{story.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded font-medium ${
                          story.level === 'A1'
                            ? 'bg-green-900/60 text-green-400'
                            : 'bg-blue-900/60 text-blue-400'
                        }`}
                      >
                        {story.level}
                      </span>
                      {story.topic && (
                        <span className="text-xs px-2 py-1 rounded bg-neutral-700 text-neutral-300">
                          {TOPICS.find((t) => t.value === story.topic)?.emoji ?? '📖'}{' '}
                          {story.topic}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reading progress */}
                  {storyProgress && (
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-neutral-500 mb-1">Reading progress</p>
                      <div className="w-32 bg-neutral-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${storyProgress.pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        {storyProgress.heard}/{storyProgress.total} sentences
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-neutral-500">
                  👆 Click a <span className="text-neutral-400">sentence</span> to hear it ·{' '}
                  Then click a <span className="text-neutral-400">word</span> to look it up
                </p>
              </div>

              {/* Story text */}
              <article className="bg-neutral-800 rounded-xl p-6 mb-6">
                <div className="space-y-5">
                  {story.paragraphs.map((paragraph) => (
                    <ParagraphBlock
                      key={paragraph.id}
                      paragraph={paragraph}
                      selectedSentenceId={selectedSentence?.id ?? null}
                      selectedWordKey={selectedWord?.key ?? null}
                      speakingSentenceId={speakingSentenceId}
                      heardSentenceIds={progress.heardSentenceIds}
                      onSentenceClick={handleSentenceClick}
                      onWordClick={handleWordClick}
                    />
                  ))}
                </div>
              </article>

              {/* Comprehension questions */}
              {story.questions && story.questions.length > 0 && (
                <section className="bg-neutral-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>🧠</span>
                    Comprehension Questions
                  </h3>
                  <div className="space-y-4">
                    {story.questions.map((q) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        isRevealed={revealedAnswers.has(q.id)}
                        selectedOption={selectedOptions[q.id] ?? null}
                        onToggle={() => toggleAnswer(q.id)}
                        onSelectOption={(opt) => handleSelectOption(q.id, opt)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Side translation panel */}
            <aside className="lg:w-80 lg:sticky lg:top-24 lg:self-start">
              <TranslationPanel
                selectedSentence={selectedSentence}
                selectedWord={selectedWord}
                translatingWord={translatingWord}
                isSpeaking={isSpeaking}
                onSpeakAgain={handleSpeakAgain}
                onClose={() => {
                  handleStop();
                  setSelectedSentence(null);
                  setSelectedWord(null);
                }}
              />

              {/* Stats panel */}
              <div className="bg-neutral-800 rounded-xl p-4 mt-4">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                  📊 Your Progress
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Stories read</span>
                    <span className="text-white font-medium">{progress.readStoryTitles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Sentences heard</span>
                    <span className="text-white font-medium">{progress.heardSentenceIds.length}</span>
                  </div>
                </div>
                {progress.readStoryTitles.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-700">
                    <p className="text-xs text-neutral-500 mb-2">Completed stories:</p>
                    <ul className="space-y-1">
                      {progress.readStoryTitles.slice(-5).map((title) => (
                        <li key={title} className="text-xs text-green-400 flex items-center gap-1">
                          <span>✓</span>
                          <span className="truncate">{title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => {
                    const reset: ReadingProgress = { readStoryTitles: [], heardSentenceIds: [] };
                    progressRef.current = reset;
                    setProgress(reset);
                    saveProgress(reset);
                  }}
                  className="mt-3 w-full text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Reset progress
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Empty state */}
        {!loading && !story && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <p className="text-4xl mb-4">📖</p>
            <p className="text-lg mb-4">No story loaded</p>
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors text-white"
            >
              Load a Story
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Comprehension Question Card ──────────────────────────────────────────────

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  open: '💬 Open',
  multiple_choice: '🔘 Multiple Choice',
  fill_blank: '✏️ Fill in the Blank',
  true_false: '✅ True / False',
};

interface QuestionCardProps {
  question: ComprehensionQuestion;
  isRevealed: boolean;
  selectedOption: string | null;
  onToggle: () => void;
  onSelectOption: (option: string) => void;
}

function QuestionCard({ question, isRevealed, selectedOption, onToggle, onSelectOption }: QuestionCardProps) {
  const typeLabel = QUESTION_TYPE_LABELS[question.type] ?? '💬 Open';

  // Determine if the selected option is correct (for multiple_choice)
  const isCorrect = selectedOption !== null && selectedOption === question.answer;
  const isWrong = selectedOption !== null && selectedOption !== question.answer;

  return (
    <div className="border border-neutral-700 rounded-lg overflow-hidden">
      {/* Question header */}
      <div className="px-4 py-3 bg-neutral-700/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <span className="text-xs text-neutral-500 font-medium">{typeLabel}</span>
            <p className="text-sm text-neutral-200 leading-relaxed mt-1">{question.question}</p>
          </div>
          {/* For open / true_false / fill_blank: toggle button */}
          {question.type !== 'multiple_choice' && (
            <button
              onClick={onToggle}
              className="text-neutral-400 hover:text-white shrink-0 mt-0.5 transition-colors text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
            >
              {isRevealed ? 'Hide' : 'Show Answer'}
            </button>
          )}
        </div>
      </div>

      {/* Multiple choice options */}
      {question.type === 'multiple_choice' && question.options && (
        <div className="px-4 py-3 space-y-2">
          {question.options.map((opt) => {
            const isSelected = selectedOption === opt;
            const isThisCorrect = opt === question.answer;
            let optClass = 'border border-neutral-600 bg-neutral-700/40 text-neutral-200 hover:bg-neutral-700';
            if (isSelected && isThisCorrect) optClass = 'border border-green-500 bg-green-900/30 text-green-300';
            else if (isSelected && !isThisCorrect) optClass = 'border border-red-500 bg-red-900/30 text-red-300';
            else if (!isSelected && isRevealed && isThisCorrect) optClass = 'border border-green-500/50 bg-green-900/20 text-green-400';
            return (
              <button
                key={opt}
                onClick={() => onSelectOption(opt)}
                disabled={selectedOption !== null}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${optClass} disabled:cursor-default`}
              >
                {opt}
              </button>
            );
          })}
          {selectedOption && (
            <p className={`text-xs mt-1 ${isCorrect ? 'text-green-400' : isWrong ? 'text-red-400' : ''}`}>
              {isCorrect ? '✓ Correct!' : '✗ Not quite. The correct answer is highlighted above.'}
            </p>
          )}
        </div>
      )}

      {/* Fill in the blank — show answer on toggle */}
      {question.type === 'fill_blank' && isRevealed && (
        <div className="px-4 py-3 bg-blue-900/20 border-t border-neutral-700">
          <p className="text-xs text-neutral-500 mb-1">Missing word:</p>
          <p className="text-sm text-blue-300 font-medium">{question.answer}</p>
        </div>
      )}

      {/* True / False — show answer on toggle */}
      {question.type === 'true_false' && isRevealed && (
        <div className="px-4 py-3 bg-yellow-900/20 border-t border-neutral-700">
          <p className="text-xs text-neutral-500 mb-1">
            {question.correctBool === true ? '✅ Waar (True)' : question.correctBool === false ? '❌ Onwaar (False)' : 'Answer:'}
          </p>
          <p className="text-sm text-yellow-300 leading-relaxed">{question.answer}</p>
        </div>
      )}

      {/* Open question — show answer on toggle */}
      {question.type === 'open' && isRevealed && (
        <div className="px-4 py-3 bg-green-900/20 border-t border-neutral-700">
          <p className="text-xs text-neutral-500 mb-1">Answer:</p>
          <p className="text-sm text-green-400 leading-relaxed">{question.answer}</p>
        </div>
      )}
    </div>
  );
}

// ─── Translation Side Panel ───────────────────────────────────────────────────

interface TranslationPanelProps {
  selectedSentence: SelectedSentence | null;
  selectedWord: SelectedWord | null;
  translatingWord: boolean;
  isSpeaking: boolean;
  onSpeakAgain: () => void;
  onClose: () => void;
}

function TranslationPanel({
  selectedSentence,
  selectedWord,
  translatingWord,
  isSpeaking,
  onSpeakAgain,
  onClose,
}: TranslationPanelProps) {
  const hasSelection = selectedSentence !== null;

  return (
    <div className="bg-neutral-800 rounded-xl p-6 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
          {selectedWord ? 'Word / Phrase' : 'Translation'}
        </h2>
        {hasSelection && (
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white text-xl leading-none transition-colors"
            aria-label="Close translation"
          >
            ×
          </button>
        )}
      </div>

      {hasSelection ? (
        <div className="space-y-4">
          {selectedWord ? (
            <div>
              <p className="text-xs text-neutral-500 mb-1">🔤 Word / Phrase</p>
              <p className="text-lg font-medium text-white leading-relaxed">
                {selectedWord.text}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-neutral-500 mb-1">🇳🇱 Dutch Sentence</p>
              <p className="text-base font-medium text-white leading-relaxed">
                {selectedSentence.text}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-neutral-500 mb-1">🇬🇧 English</p>
            {translatingWord ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Translating...</span>
              </div>
            ) : (
              <p className="text-lg font-medium text-green-400 leading-relaxed">
                {selectedWord
                  ? (selectedWord.translation ?? '—')
                  : selectedSentence.translation}
              </p>
            )}
          </div>

          {selectedWord && (
            <div>
              <p className="text-xs text-neutral-500 mb-1">📖 In sentence</p>
              <p className="text-sm text-neutral-300 leading-relaxed italic">
                {selectedWord.sentenceText}
              </p>
              <p className="text-sm text-green-400/70 leading-relaxed italic mt-1">
                {selectedSentence?.translation}
              </p>
            </div>
          )}

          <button
            onClick={onSpeakAgain}
            disabled={isSpeaking}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>{isSpeaking ? '🔊' : '▶️'}</span>
            {isSpeaking ? 'Speaking...' : 'Speak Sentence Again'}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">👆</p>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Click any <strong className="text-neutral-300">sentence</strong> to hear it and see its translation.
          </p>
          <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
            Then click an individual <strong className="text-neutral-400">word</strong> to look it up.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Paragraph Block ──────────────────────────────────────────────────────────

interface ParagraphBlockProps {
  paragraph: Paragraph;
  selectedSentenceId: string | null;
  selectedWordKey: string | null;
  speakingSentenceId: string | null;
  heardSentenceIds: string[];
  onSentenceClick: (sentence: Sentence) => void;
  onWordClick: (word: string, sentence: Sentence) => void;
}

function ParagraphBlock({
  paragraph,
  selectedSentenceId,
  selectedWordKey,
  speakingSentenceId,
  heardSentenceIds,
  onSentenceClick,
  onWordClick,
}: ParagraphBlockProps) {
  return (
    <p className="text-neutral-200 leading-relaxed text-base">
      {paragraph.sentences.map((sentence, sIdx) => (
        <span key={sentence.id}>
          <SentenceSpan
            sentence={sentence}
            isSelected={selectedSentenceId === sentence.id}
            selectedWordKey={selectedWordKey}
            isSpeakingNow={speakingSentenceId === sentence.id}
            isHeard={heardSentenceIds.includes(sentence.id)}
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
  isSelected: boolean;
  selectedWordKey: string | null;
  isSpeakingNow: boolean;
  isHeard: boolean;
  onSentenceClick: (sentence: Sentence) => void;
  onWordClick: (word: string, sentence: Sentence) => void;
}

function SentenceSpan({
  sentence,
  isSelected,
  selectedWordKey,
  isSpeakingNow,
  isHeard,
  onSentenceClick,
  onWordClick,
}: SentenceSpanProps) {
  const tokens = tokenizeSentence(sentence.id, sentence.text);

  const sentenceBg = isSpeakingNow
    ? 'bg-cyan-700/60'
    : isSelected
    ? 'bg-yellow-200/20'
    : '';

  return (
    <span
      className={`rounded px-0.5 transition-colors cursor-pointer ${sentenceBg} ${
        !isSelected && !isSpeakingNow ? 'hover:bg-blue-100/10' : ''
      } ${isHeard && !isSelected && !isSpeakingNow ? 'text-neutral-300' : ''}`}
      onClick={() => onSentenceClick(sentence)}
    >
      {tokens.map((token) => {
        if (!token.isWord) {
          return <span key={token.id}>{token.text}</span>;
        }

        const clean = stripPunctuation(token.text);
        const isWordSelected =
          selectedWordKey === `${sentence.id}::${token.text}` ||
          selectedWordKey === `${sentence.id}::${clean}`;

        return (
          <span
            key={token.id}
            className={`rounded transition-colors ${
              isWordSelected
                ? 'bg-yellow-300 text-neutral-900 font-medium'
                : isSelected
                ? 'hover:bg-blue-200/30 cursor-pointer'
                : isSpeakingNow
                ? 'hover:bg-cyan-500/30 cursor-pointer'
                : 'hover:bg-blue-100/20 cursor-pointer'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onWordClick(token.text, sentence);
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
