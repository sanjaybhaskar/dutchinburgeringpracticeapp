'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice | null;
}

// Initialize outside component to avoid effect
const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!isSpeechSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'nl-NL'; // Dutch by default
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    
    if (options.voice) {
      utterance.voice = options.voice;
    } else {
      // Try to find a Dutch voice
      const dutchVoice = voices.find(v => v.lang.startsWith('nl'));
      if (dutchVoice) {
        utterance.voice = dutchVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stop = useCallback(() => {
    if (!isSpeechSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported: isSpeechSupported,
    voices,
  };
}
