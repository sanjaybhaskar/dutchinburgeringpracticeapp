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

  // Fetch initial stories
  const fetchStories = useCallback(async (replace = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 3, level }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      }
      
      if (replace) {
        setStories(data.stories || []);
      } else {
        // Append new stories
        setStories(prev => [...prev, ...(data.stories || [])]);
      }
    } catch (err) {
      setError('Failed to load stories. Please try again.');
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, [level]);

  // Initial load
  useEffect(() => {
    fetchStories(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  // Handle refresh (replace all stories)
  const handleRefresh = () => {
    stop();
    setSelectedSentence(null);
    fetchStories(true);
  };

  // Handle add more (append stories)
  const handleAddMore = () => {
    fetchStories(false);
  };

  // Handle sentence click
  const handleSentenceClick = (sentence: Sentence) => {
    // Stop any current speech
    stop();
    
    // Set selected sentence
    setSelectedSentence(sentence);
    
    // Speak the sentence
    speak(sentence.text, { lang: 'nl-NL', rate: 0.8 });
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center mb-4">
            📚 AI Story Reader
          </h1>
          
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Stories grid */}
      {!loading && stories.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                selectedSentence={selectedSentence}
                onSentenceClick={handleSentenceClick}
              />
            ))}
          </div>
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

      {/* Translation panel */}
      {selectedSentence && (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-800 border-t border-neutral-700 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-neutral-400 mb-1">Dutch:</p>
                <p className="text-lg font-medium text-white">{selectedSentence.text}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-400 mb-1">English:</p>
                <p className="text-lg font-medium text-green-400">{selectedSentence.translation}</p>
              </div>
              <button
                onClick={() => {
                  stop();
                  setSelectedSentence(null);
                }}
                className="text-neutral-400 hover:text-white text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Story Card Component
interface StoryCardProps {
  story: Story;
  selectedSentence: Sentence | null;
  onSentenceClick: (sentence: Sentence) => void;
}

function StoryCard({ story, selectedSentence, onSentenceClick }: StoryCardProps) {
  const isAnySentenceSelected = selectedSentence !== null;
  
  return (
    <article className="bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 hover:border-neutral-600 transition-colors">
      {/* Story header */}
      <div className="bg-neutral-700/50 px-4 py-3">
        <h2 className="font-semibold text-lg truncate">{story.title}</h2>
        <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${
          story.level === 'A1' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
        }`}>
          Level {story.level}
        </span>
      </div>

      {/* Sentences */}
      <div className="p-4 space-y-2">
        {story.sentences.map((sentence) => {
          const isSelected = selectedSentence?.id === sentence.id;
          
          return (
            <button
              key={sentence.id}
              onClick={() => onSentenceClick(sentence)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-700/50 hover:bg-neutral-700 text-neutral-200'
              } ${isAnySentenceSelected && !isSelected ? 'opacity-50' : ''}`}
            >
              <span className="text-sm">{sentence.text}</span>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <div className="px-4 pb-3">
        <p className="text-xs text-neutral-500">
          👆 Click a sentence to hear it
        </p>
      </div>
    </article>
  );
}
