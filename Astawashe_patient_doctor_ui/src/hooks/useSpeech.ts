import { useCallback, useEffect, useState } from 'react';
import { speechSynthesisAvailable } from '../services/capabilities';
import type { Language } from '../types';

/**
 * Reads text aloud with the browser's built-in speech synthesis.
 * `supported` is false where the browser has no speech engine; callers hide
 * their "Listen" controls in that case.
 */
export function useSpeech() {
  const supported = speechSynthesisAvailable();
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string, lang: Language) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'am' ? 'am-ET' : 'en-US';
      u.rate = 0.9;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [supported],
  );

  useEffect(() => stop, [stop]);

  return { supported, speaking, speak, stop };
}
