'use client';

import { useState, useCallback, useEffect } from 'react';
import { Story, Sentence } from './types/story';
import { useSpeech } from './hooks/useSpeech';

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(null);
  const [level, setLevel] = useState<'A1' | 'A2'>('A1');
  const { speak, stop, isSpeaking, isSupported } = useSpeech();

  // Fetch stories
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

        if (data.error) {
          setError(data.error);
        }

        if (replace) {
          setStories(data.stories || []);
        } else {
          // Append new stories
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

  // Initial load
  useEffect(() => {
    fetchStories(true, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  // Handle refresh (replace all stories)
  const handleRefresh = () => {
    stop();
    setSelectedSentence(null);
    fetchStories(true, []);
  };

  // Handle add more (append stories, pass existing titles to avoid duplicates)
  const handleAddMore = () => {
    fetchStories(false, stories.map((s) => s.title));
  };

  // Handle sentence click
  const handleSentenceClick = (sentence: Sentence) => {
    stop();
    setSelectedSentence(sentence);
    speak(sentence.text, { lang: 'nl-NL', rate: 0.8 });
  };

  // Handle speak again
  const handleSpeakAgain = () => {
    if (selectedSentence) {
      stop();
      speak(selectedSentence.text, { lang: 'nl-NL', rate: 0.8 });
    }
  };

  // Handle level change
  const handleLevelChange = (newLevel: 'A1' | 'A2') => {
    setLevel(newLevel);
    setSelectedSentence(null);
    stop();
  };

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center mb-4">📚 AI Story Reader</h1>

          {/* Controls */}
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
          </div>

          {/* TTS Status */}
          {!isSupported && (
            <p className="text-yellow-500 text-xs text-center mt-3">
              ⚠️ Text-to-speech not supported in this browser
            </p>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-neutral-400">Loading stories...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400">
              {error}
            </div>
          </div>
        )}

        {/* Two-column layout: stories + side panel */}
        {!loading && stories.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Stories column */}
            <div className="lg:flex-1 flex flex-col gap-6">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  selectedSentence={selectedSentence}
                  onSentenceClick={handleSentenceClick}
                />
              ))}
            </div>

            {/* Side translation panel */}
            <aside className="lg:w-80 lg:sticky lg:top-24 lg:self-start">
              <TranslationPanel
                selectedSentence={selectedSentence}
                isSpeaking={isSpeaking}
                onSpeakAgain={handleSpeakAgain}
                onClose={() => {
                  stop();
                  setSelectedSentence(null);
                }}
              />
            </aside>
          </div>
        )}

        {/* Empty state */}
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

// Translation Side Panel Component
interface TranslationPanelProps {
  selectedSentence: Sentence | null;
  isSpeaking: boolean;
  onSpeakAgain: () => void;
  onClose: () => void;
}

function TranslationPanel({
  selectedSentence,
  isSpeaking,
  onSpeakAgain,
  onClose,
}: TranslationPanelProps) {
  return (
    <div className="bg-neutral-800 rounded-xl p-6 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
          Translation
        </h2>
        {selectedSentence && (
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white text-xl leading-none transition-colors"
            aria-label="Close translation"
          >
            ×
          </button>
        )}
      </div>

      {selectedSentence ? (
        <div className="space-y-4">
          {/* Dutch sentence */}
          <div>
            <p className="text-xs text-neutral-500 mb-1">🇳🇱 Dutch</p>
            <p className="text-lg font-medium text-white leading-relaxed">
              {selectedSentence.text}
            </p>
          </div>

          {/* English translation */}
          <div>
            <p className="text-xs text-neutral-500 mb-1">🇬🇧 English</p>
            <p className="text-lg font-medium text-green-400 leading-relaxed">
              {selectedSentence.translation}
            </p>
          </div>

          {/* Speak Again button */}
          <button
            onClick={onSpeakAgain}
            disabled={isSpeaking}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <span>{isSpeaking ? '🔊' : '▶️'}</span>
            {isSpeaking ? 'Speaking...' : 'Speak Again'}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">👆</p>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Click any sentence to see its translation and hear it spoken aloud.
          </p>
        </div>
      )}
    </div>
  );
}

// Story Card Component
interface StoryCardProps {
  story: Story;
  selectedSentence: Sentence | null;
  onSentenceClick: (sentence: Sentence) => void;
}

function StoryCard({ story, selectedSentence, onSentenceClick }: StoryCardProps) {
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
        <span
          className={`inline-block text-xs px-2 py-1 rounded font-medium shrink-0 ${
            story.level === 'A1'
              ? 'bg-green-900/60 text-green-400'
              : 'bg-blue-900/60 text-blue-400'
          }`}
        >
          {story.level}
        </span>
      </div>

      {/* Paragraphs as flowing text */}
      <div className="space-y-4">
        {story.paragraphs.map((paragraph) => (
          <p key={paragraph.id} className="text-neutral-200 leading-relaxed text-base">
            {paragraph.sentences.map((sentence, index) => (
              <span key={sentence.id}>
                <span
                  onClick={() => onSentenceClick(sentence)}
                  className={`cursor-pointer rounded transition-colors ${
                    selectedSentence?.id === sentence.id
                      ? 'bg-yellow-200 dark:bg-yellow-800 text-neutral-900 dark:text-white'
                      : 'hover:bg-blue-100 dark:hover:bg-blue-900'
                  }`}
                >
                  {sentence.text}
                </span>
                {index < paragraph.sentences.length - 1 && <span> </span>}
              </span>
            ))}
          </p>
        ))}
      </div>

      {/* Hint */}
      <p className="text-xs text-neutral-500 mt-4">👆 Click a sentence to hear it</p>
    </article>
  );
}
