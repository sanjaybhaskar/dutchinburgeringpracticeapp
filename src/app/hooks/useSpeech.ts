'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice | null;
}

export type PlaybackSpeed = 'slow' | 'normal';

export const SPEED_RATES: Record<PlaybackSpeed, number> = {
  slow: 0.6,
  normal: 0.9,
};

// Initialize outside component to avoid effect
const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPlayingStory, setIsPlayingStory] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Ref to track if story playback should continue
  const storyPlaybackRef = useRef<{ active: boolean; index: number }>({ active: false, index: 0 });

  useEffect(() => {
    // Get available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();

    // Voices may load asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

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
      utterance.pitch = options.pitch || 1;

      if (options.voice) {
        utterance.voice = options.voice;
      } else {
        const dutchVoice = voices.find((v) => v.lang.startsWith('nl'));
        if (dutchVoice) utterance.voice = dutchVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [voices]
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

      const dutchVoice = voices.find((v) => v.lang.startsWith('nl')) ?? null;

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
        utterance.pitch = options.pitch || 1;

        if (options.voice) {
          utterance.voice = options.voice;
        } else if (dutchVoice) {
          utterance.voice = dutchVoice;
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
    [voices]
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
  };
}
