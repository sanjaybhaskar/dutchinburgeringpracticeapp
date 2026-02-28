'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice | null;
}

export type PlaybackSpeed = 'verySlow' | 'slow' | 'normal' | 'fast';

export const SPEED_RATES: Record<PlaybackSpeed, number> = {
  verySlow: 0.6,
  slow: 0.8,
  normal: 1.0,
  fast: 1.2,
};

export const SPEED_LABELS: Record<PlaybackSpeed, string> = {
  verySlow: '0.6×',
  slow: '0.8×',
  normal: '1.0×',
  fast: '1.2×',
};

// Initialize outside component to avoid effect
const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Score a voice for Dutch TTS quality.
 * Higher score = better quality / more preferred.
 */
function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();

  // Must be Dutch
  if (!lang.startsWith('nl')) return -1;

  // Prefer nl-NL over nl-BE
  if (lang === 'nl-nl') score += 10;
  else if (lang.startsWith('nl')) score += 5;

  // Neural / AI voices (highest quality)
  if (name.includes('neural')) score += 50;
  if (name.includes('natural')) score += 40;

  // Microsoft Edge neural voices (excellent quality)
  if (name.includes('microsoft') && name.includes('neural')) score += 60;
  if (name.includes('colette')) score += 55; // Microsoft Colette Neural (nl-NL)
  if (name.includes('fenna')) score += 54;   // Microsoft Fenna Neural (nl-NL)
  if (name.includes('maarten')) score += 53; // Microsoft Maarten Neural (nl-NL)
  if (name.includes('dena')) score += 52;    // Microsoft Dena Neural (nl-BE)

  // Google voices (good quality on Chrome/Android)
  if (name.includes('google')) score += 30;

  // Apple voices (good quality on Safari/macOS/iOS)
  if (name.includes('xander')) score += 28; // macOS Dutch voice
  if (name.includes('claire')) score += 27; // macOS Dutch voice

  // Enhanced / premium voices
  if (name.includes('enhanced')) score += 20;
  if (name.includes('premium')) score += 25;

  // Compact / basic voices (lower quality)
  if (name.includes('compact')) score -= 10;

  // Local voices are generally more reliable than remote
  if (voice.localService) score += 5;

  return score;
}

/**
 * Get Dutch voices sorted by quality (best first).
 */
export function getDutchVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices
    .filter((v) => v.lang.toLowerCase().startsWith('nl'))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

/**
 * Pick the best available Dutch voice.
 */
function pickBestDutchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const dutch = getDutchVoices(voices);
  return dutch[0] ?? null;
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPlayingStory, setIsPlayingStory] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Ref to track if story playback should continue
  const storyPlaybackRef = useRef<{ active: boolean; index: number }>({ active: false, index: 0 });

  useEffect(() => {
    if (!isSpeechSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);

        // Auto-select best Dutch voice if none selected yet
        setSelectedVoice((prev) => {
          if (prev) return prev; // keep user's choice
          return pickBestDutchVoice(availableVoices);
        });
      }
    };

    loadVoices();

    // Voices may load asynchronously (especially on mobile browsers)
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Mobile browsers (Chrome on Android, Safari on iOS) often delay voice loading.
    // Poll a few times to catch voices that arrive after the initial render.
    const retryDelays = [100, 500, 1000, 2000];
    const timers = retryDelays.map((delay) => setTimeout(loadVoices, delay));

    return () => {
      timers.forEach(clearTimeout);
      window.speechSynthesis.cancel();
    };
  }, []);

  /** Derived: Dutch voices sorted by quality */
  const dutchVoices = getDutchVoices(voices);

  /** Speak a single text snippet */
  const speak = useCallback(
    (text: string, options: SpeechOptions = {}) => {
      if (!isSpeechSupported) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      storyPlaybackRef.current.active = false;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || 'nl-NL';
      utterance.rate = options.rate ?? SPEED_RATES.normal;
      utterance.pitch = options.pitch ?? 1;

      // Voice priority: explicit option > user-selected > auto-best
      const voiceToUse = options.voice !== undefined ? options.voice : selectedVoice;
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [selectedVoice]
  );

  /**
   * Play a sequence of texts (sentences) one after another.
   * Calls onSentenceStart(index) when each sentence begins.
   * Calls onDone() when all sentences have been spoken or playback is stopped.
   */
  const playSequence = useCallback(
    (
      texts: string[],
      options: SpeechOptions = {},
      onSentenceStart?: (index: number) => void,
      onDone?: () => void
    ) => {
      if (!isSpeechSupported || texts.length === 0) {
        onDone?.();
        return;
      }

      window.speechSynthesis.cancel();

      const playbackState = { active: true, index: 0 };
      storyPlaybackRef.current = playbackState;
      setIsPlayingStory(true);

      // Voice priority: explicit option > user-selected > auto-best
      const voiceToUse = options.voice !== undefined ? options.voice : selectedVoice;

      const speakNext = (index: number) => {
        // Check if playback was cancelled
        if (!playbackState.active || index >= texts.length) {
          setIsPlayingStory(false);
          setIsSpeaking(false);
          onDone?.();
          return;
        }

        onSentenceStart?.(index);

        const utterance = new SpeechSynthesisUtterance(texts[index]);
        utterance.lang = options.lang || 'nl-NL';
        utterance.rate = options.rate ?? SPEED_RATES.normal;
        utterance.pitch = options.pitch ?? 1;

        if (voiceToUse) {
          utterance.voice = voiceToUse;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          if (playbackState.active) {
            speakNext(index + 1);
          } else {
            setIsSpeaking(false);
            setIsPlayingStory(false);
          }
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPlayingStory(false);
          onDone?.();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      speakNext(0);
    },
    [selectedVoice]
  );

  const stop = useCallback(() => {
    if (!isSpeechSupported) return;
    storyPlaybackRef.current.active = false;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPlayingStory(false);
  }, []);

  return {
    speak,
    playSequence,
    stop,
    isSpeaking,
    isPlayingStory,
    isSupported: isSpeechSupported,
    voices,
    dutchVoices,
    selectedVoice,
    setSelectedVoice,
  };
}
