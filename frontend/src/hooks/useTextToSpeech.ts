import { useState, useEffect, useRef, useCallback } from 'react';

export type TTSPlaybackState = 'idle' | 'playing' | 'paused';

export interface TTSState {
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  rate: number;
  activeMessageId: string | number | null;
  playbackState: TTSPlaybackState;
  activeEngine?: 'indic-neural' | 'browser' | null;
  speak: (id: string | number, text: string, langHint?: string, onEnd?: () => void) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
}

/**
 * Detects whether the given text is primarily Gujarati, Hindi (Devanagari), or English/Latin.
 */
export function detectScriptLanguage(text: string): 'gu' | 'hi' | 'en' {
  if (!text) return 'en';
  const guMatches = (text.match(/[\u0A80-\u0AFF]/g) || []).length;
  const hiMatches = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (guMatches > 0 && guMatches >= hiMatches) return 'gu';
  if (hiMatches > 0 && hiMatches > guMatches) return 'hi';
  return 'en';
}

/**
 * Removes markdown formatting, special characters, and awkward tokens
 * to produce natural, smooth speech cadence.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Replace emoji or icon sequences if any with spaces
    .replace(/👋|💡|🎉|🔥|💪|⚡|✨|🤖|🧠|📌|👉/gu, '')
    // Remove markdown headers, bold, italics, code marks
    .replace(/[#*_`~]/g, '')
    // Replace markdown bullets with punctuation for natural pause
    .replace(/^[-*•]\s+/gm, '')
    // Replace URLs with 'link'
    .replace(/https?:\/\/\S+/g, '')
    // Convert multiple line breaks into pause-inducing periods
    .replace(/\n\s*\n/g, '. ')
    .replace(/\n/g, ', ')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Custom hook providing robust Web Speech Synthesis capabilities
 */
export function useTextToSpeech(): TTSState {
  const isSupported =
    typeof window !== 'undefined' &&
    ('speechSynthesis' in window || typeof Audio !== 'undefined');

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRateState] = useState<number>(1.0);
  const [activeMessageId, setActiveMessageId] = useState<string | number | null>(null);
  const [playbackState, setPlaybackState] = useState<TTSPlaybackState>('idle');
  const [activeEngine, setActiveEngine] = useState<'indic-neural' | 'browser' | null>(null);

  // Keep refs to avoid garbage collection and stale closures
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const rateRef = useRef<number>(1.0);

  selectedVoiceRef.current = selectedVoice;
  rateRef.current = rate;

  // Populate available browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Find best matching voice given text script and language hint
  const pickVoice = useCallback((text: string, langHint?: string): SpeechSynthesisVoice | null => {
    if (selectedVoiceRef.current) {
      return selectedVoiceRef.current;
    }
    if (!voices || voices.length === 0) return null;

    const hint = langHint?.toLowerCase() || '';
    const scriptLang = detectScriptLanguage(text);
    const effectiveLang = (hint && hint !== 'auto') ? hint : scriptLang;

    // 1. Gujarati Target
    if (effectiveLang === 'gu' || effectiveLang.startsWith('gu')) {
      const guVoice = voices.find(v =>
        v.lang.toLowerCase().startsWith('gu') ||
        v.name.toLowerCase().includes('gujarati') ||
        v.name.toLowerCase().includes('dhwani')
      );
      if (guVoice) return guVoice;

      // Fallback to Hindi voice for natural Indic phonetics
      const hiVoice = voices.find(v =>
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('swara') ||
        v.name.toLowerCase().includes('madhur')
      );
      if (hiVoice) return hiVoice;

      // Fallback to Indian English
      const inVoice = voices.find(v =>
        v.lang.toLowerCase() === 'en-in' ||
        v.lang.toLowerCase() === 'en_in' ||
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('neerja')
      );
      if (inVoice) return inVoice;
    }

    // 2. Hindi Target
    if (effectiveLang === 'hi' || effectiveLang.startsWith('hi')) {
      const hiVoice = voices.find(v =>
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('swara') ||
        v.name.toLowerCase().includes('madhur') ||
        v.name.toLowerCase().includes('kalpana') ||
        v.name.toLowerCase().includes('hemant')
      );
      if (hiVoice) return hiVoice;

      // Fallback to Indian English
      const inVoice = voices.find(v =>
        v.lang.toLowerCase() === 'en-in' ||
        v.lang.toLowerCase() === 'en_in' ||
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('neerja')
      );
      if (inVoice) return inVoice;
    }

    // 3. English or Standard Target
    if (effectiveLang === 'en' || effectiveLang.startsWith('en') || !hint) {
      const enInVoice = voices.find(v =>
        v.lang.toLowerCase() === 'en-in' ||
        v.lang.toLowerCase() === 'en_in' ||
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('neerja')
      );
      if (enInVoice && effectiveLang !== 'en-us') return enInVoice;

      const enVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
      if (enVoice) return enVoice;
    }

    return voices.find(v => v.default) || voices[0] || null;
  }, [voices]);

  const stop = useCallback(() => {
    isPausedRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch (e) {
        console.warn('Error cancelling audio element:', e);
      }
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Error cancelling speech synthesis:', e);
      }
    }
    utteranceRef.current = null;
    setActiveMessageId(null);
    setPlaybackState('idle');
    setActiveEngine(null);
  }, []);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {
        console.warn('Error pausing audio element:', e);
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch (e) {
        console.warn('Error pausing speech synthesis:', e);
      }
    }
    setPlaybackState('paused');
  }, []);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    if (audioRef.current) {
      audioRef.current.playbackRate = rateRef.current;
      audioRef.current
        .play()
        .then(() => setPlaybackState('playing'))
        .catch((err) => {
          console.warn('Error resuming audio element:', err);
        });
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        setPlaybackState('playing');
      } catch (e) {
        console.warn('Error resuming speech synthesis:', e);
      }
    }
  }, []);

  // Internal helper for native Web Speech API fallback
  const speakWithBrowserSynthesis = useCallback(
    (id: string | number, spokenText: string, effectiveLang: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setActiveMessageId(null);
        setPlaybackState('idle');
        setActiveEngine(null);
        return;
      }

      setActiveEngine('browser');
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utteranceRef.current = utterance;

      let targetLang = 'en-US';
      if (effectiveLang === 'gu' || effectiveLang.startsWith('gu')) {
        targetLang = 'gu-IN';
      } else if (effectiveLang === 'hi' || effectiveLang.startsWith('hi')) {
        targetLang = 'hi-IN';
      } else if (effectiveLang === 'en' || effectiveLang.startsWith('en')) {
        targetLang = 'en-IN';
      }

      const chosenVoice = pickVoice(spokenText, effectiveLang);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang || targetLang;
      } else {
        utterance.lang = targetLang;
      }

      utterance.rate = rateRef.current;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setActiveMessageId(id);
        setPlaybackState('playing');
      };

      utterance.onpause = () => {
        setPlaybackState('paused');
      };

      utterance.onresume = () => {
        setPlaybackState('playing');
      };

      utterance.onend = () => {
        utteranceRef.current = null;
        setActiveMessageId(null);
        setPlaybackState('idle');
        setActiveEngine(null);
        if (onEnd) {
          onEnd();
        }
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.warn('Speech synthesis error occurred:', event.error);
        }
        utteranceRef.current = null;
        setActiveMessageId(null);
        setPlaybackState('idle');
        setActiveEngine(null);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Failed to trigger speech synthesis:', err);
        utteranceRef.current = null;
        setActiveMessageId(null);
        setPlaybackState('idle');
        setActiveEngine(null);
      }
    },
    [pickVoice]
  );

  const speak = useCallback(
    (id: string | number, text: string, langHint?: string, onEnd?: () => void) => {
      const spokenText = cleanTextForSpeech(text);
      if (!spokenText) return;

      // Stop any active utterance or audio stream first
      stop();

      const hint = langHint?.toLowerCase() || '';
      const scriptLang = detectScriptLanguage(spokenText);
      const effectiveLang = (hint && hint !== 'auto') ? hint : scriptLang;

      // Use authentic Google Indic TTS proxy for Gujarati & Hindi
      const isIndic = effectiveLang === 'gu' || effectiveLang === 'hi';

      if (isIndic) {
        const targetLang = effectiveLang.startsWith('gu') ? 'gu' : 'hi';
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setActiveMessageId(id);
        setPlaybackState('playing');
        setActiveEngine('indic-neural');
        isPausedRef.current = false;

        fetch('/api/speech/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: spokenText,
            lang: targetLang
          }),
          signal: controller.signal
        })
          .then(async (res) => {
            if (!res.ok) {
              throw new Error(`Speech API returned HTTP status ${res.status}`);
            }
            const blob = await res.blob();
            if (controller.signal.aborted) return;

            const url = URL.createObjectURL(blob);
            blobUrlRef.current = url;

            const audio = new Audio(url);
            audioRef.current = audio;
            audio.playbackRate = rateRef.current;

            audio.onended = () => {
              if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
              }
              audioRef.current = null;
              setActiveMessageId(null);
              setPlaybackState('idle');
              setActiveEngine(null);
              if (onEnd) onEnd();
            };

            audio.onpause = () => {
              if (audioRef.current && !audio.ended) {
                setPlaybackState('paused');
              }
            };

            audio.onplay = () => {
              setPlaybackState('playing');
            };

            audio.onerror = (e) => {
              console.warn('Audio playback error, falling back to browser speech synthesis:', e);
              if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
              }
              audioRef.current = null;
              speakWithBrowserSynthesis(id, spokenText, targetLang, onEnd);
            };

            if (isPausedRef.current) {
              setPlaybackState('paused');
            } else {
              audio.play().catch((err) => {
                console.warn('Audio play failed, falling back:', err);
                speakWithBrowserSynthesis(id, spokenText, targetLang, onEnd);
              });
            }
          })
          .catch((err) => {
            if (err.name === 'AbortError') return;
            console.warn('Indic speech proxy failed, falling back to browser synthesis:', err);
            speakWithBrowserSynthesis(id, spokenText, targetLang, onEnd);
          });
      } else {
        // Standard English / Latin speech via browser synthesis
        speakWithBrowserSynthesis(id, spokenText, effectiveLang, onEnd);
      }
    },
    [stop, speakWithBrowserSynthesis]
  );

  const setRate = useCallback(
    (newRate: number) => {
      setRateState(newRate);
      rateRef.current = newRate;
      if (audioRef.current) {
        audioRef.current.playbackRate = newRate;
      }
      if (utteranceRef.current && playbackState === 'playing') {
        utteranceRef.current.rate = newRate;
      }
    },
    [playbackState]
  );

  return {
    isSupported,
    voices,
    selectedVoice,
    rate,
    activeMessageId,
    playbackState,
    activeEngine,
    speak,
    pause,
    resume,
    stop,
    setRate,
    setSelectedVoice
  };
}
