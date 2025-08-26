import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export function useVoiceChat() {
  const isNative = typeof Capacitor !== 'undefined' && (Capacitor as any).isNativePlatform?.();

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Web SR references
  const recRef = useRef<any | null>(null);
  const onResultRef = useRef<((t: string) => void) | null>(null);
  const stopRef = useRef<null | (() => Promise<void> | void)>(null);

  useEffect(() => {
    if (isNative) {
      setSupported(true); // Use native plugin on iOS
      return;
    }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return; // Unsupported on Safari/iOS WebView
    setSupported(true);
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      try {
        const t = e?.results?.[0]?.[0]?.transcript ?? '';
        setTranscript(t);
        onResultRef.current?.(t);
      } catch {}
    };
    rec.onerror = (e: any) => setError(String(e?.error || 'speech error'));
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, [isNative]);

  const start = async (onResult?: (t: string) => void) => {
    onResultRef.current = onResult || null;
    setTranscript('');
    setError(null);

    if (isNative) {
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        const has = await SpeechRecognition.hasPermission();
        if (!has) await SpeechRecognition.requestPermission();
        await SpeechRecognition.start({ language: 'en-US', partialResults: false, popup: false });
        const sub = await SpeechRecognition.addListener('partialResults', (e: any) => {
          const t = Array.isArray(e?.value) ? e.value.join(' ') : (e?.matches?.[0] ?? '');
          if (t) {
            setTranscript(t);
            onResultRef.current?.(t);
          }
        });
        stopRef.current = async () => { await SpeechRecognition.stop(); await sub.remove(); };
        setListening(true);
      } catch (err: any) {
        setError(err?.message || 'native speech error');
      }
      return;
    }

    // Web path
    try {
      recRef.current?.start();
      setListening(true);
      stopRef.current = () => recRef.current?.stop();
    } catch (err: any) {
      setError(err?.message || 'web speech error');
    }
  };

  const stop = async () => {
    try { await stopRef.current?.(); } catch {}
    setListening(false);
  };

  const speak = (text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = 1; u.pitch = 1;
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.speak(u);
    } catch {}
  };

  return { supported, listening, transcript, error, start, stop, speak };
}