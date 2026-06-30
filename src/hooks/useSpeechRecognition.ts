import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';

type VoiceModule = typeof import('@dev-amirzubair/react-native-voice').default;

let Voice: VoiceModule | null = null;
let voiceLoadAttempted = false;

async function getVoice(): Promise<VoiceModule | null> {
  if (voiceLoadAttempted) return Voice;
  voiceLoadAttempted = true;
  try {
    const mod = await import('@dev-amirzubair/react-native-voice');
    Voice = mod.default;
    return Voice;
  } catch {
    return null;
  }
}

function normalize(text: string): string {
  return text.trim().normalize('NFC').replace(/\s+/g, '');
}

function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= an; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= bn; j++) {
      if (i === 0) {
        matrix[i][j] = j;
      } else {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
  }
  return matrix[an][bn];
}

function similarity(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);
  if (normA === normB) return 1;
  const dist = levenshtein(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  return 1 - dist / maxLen;
}

export function isPronunciationMatch(spoken: string, expected: string): boolean {
  if (!spoken || !expected) return false;
  const SIMILARITY_THRESHOLD = 0.7;
  return similarity(spoken, expected) >= SIMILARITY_THRESHOLD;
}

export type SpeechRecognitionState = {
  isAvailable: boolean;
  isListening: boolean;
  recognizedText: string;
  partialText: string;
  error: string | null;
};

export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechRecognitionState>({
    isAvailable: false,
    isListening: false,
    recognizedText: '',
    partialText: '',
    error: null,
  });
  const voiceRef = useRef<VoiceModule | null>(null);
  const destroyedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    getVoice().then((v) => {
      if (!mounted) return;
      if (!v) {
        setState((s) => ({ ...s, isAvailable: false }));
        return;
      }
      voiceRef.current = v;
      setState((s) => ({ ...s, isAvailable: true }));

      v.onSpeechStart = () => {
        if (mounted) setState((s) => ({ ...s, isListening: true, error: null }));
      };
      v.onSpeechEnd = () => {
        if (mounted) setState((s) => ({ ...s, isListening: false }));
      };
      v.onSpeechResults = (e: any) => {
        if (!mounted) return;
        const text = (e.value?.[0] || '').trim();
        if (text) {
          setState((s) => ({ ...s, recognizedText: text, partialText: '' }));
        }
      };
      v.onSpeechPartialResults = (e: any) => {
        if (!mounted) return;
        const text = (e.value?.[0] || '').trim();
        if (text) {
          setState((s) => ({ ...s, partialText: text }));
        }
      };
      v.onSpeechError = (e: any) => {
        if (!mounted) return;
        const msg = e.error?.message || e.error?.code || e.error || 'Unknown error';
        setState((s) => ({ ...s, error: msg, isListening: false }));
      };
    });

    return () => {
      mounted = false;
      destroyedRef.current = true;
      const v = voiceRef.current;
      if (v) {
        try { v.destroy(); } catch {}
      }
    };
  }, []);

  const startListening = useCallback(async (locale: string = 'ne-NP') => {
    const v = voiceRef.current;
    if (!v) {
      setState((s) => ({ ...s, error: 'Speech recognition not available' }));
      return;
    }
    try {
      setState((s) => ({ ...s, recognizedText: '', partialText: '', error: null }));
      if (Platform.OS === 'ios') (v as any).isIOS = true;
      await v.start(locale);
    } catch (e: any) {
      const msg = e.message || String(e);
      setState((s) => ({ ...s, error: msg }));
    }
  }, []);

  const stopListening = useCallback(async () => {
    const v = voiceRef.current;
    if (!v) return;
    try {
      await v.stop();
    } catch {}
  }, []);

  return { ...state, startListening, stopListening };
}
