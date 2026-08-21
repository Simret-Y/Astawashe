export type VoiceState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';
export type VoiceLang = 'en-US' | 'am-ET';

// Global reference to current active SpeechRecognition instance
let activeRecognition: any = null;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SpeechRecognition;
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

interface ListeningOptions {
  lang: VoiceLang;
  onResult: (transcript: string) => void;
  onError?: (errorMsg: string) => void;
  onStateChange?: (state: VoiceState) => void;
}

export function startListening(options: ListeningOptions): () => void {
  const { lang, onResult, onError, onStateChange } = options;

  if (!isSpeechRecognitionSupported()) {
    onError?.('Speech recognition is not supported in this browser. Please type your message.');
    return () => {};
  }

  // Stop any active recognition
  stopListening();
  // Stop any active speech output
  stopSpeaking();

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  const recognition = new SpeechRecognition();
  activeRecognition = recognition;

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = lang;

  recognition.onstart = () => {
    onStateChange?.('LISTENING');
  };

  recognition.onresult = (event: any) => {
    try {
      const transcript = event.results[0][0].transcript;
      if (transcript && transcript.trim()) {
        onResult(transcript.trim());
      } else {
        onError?.('Could not understand speech. Please try speaking again.');
        onStateChange?.('IDLE');
      }
    } catch {
      onStateChange?.('IDLE');
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    
    // Graceful fallback if am-ET is not supported by browser speech engine
    if (lang === 'am-ET' && (event.error === 'language-not-supported' || event.error === 'no-speech')) {
      console.warn('Fallback: am-ET speech recognition not available in browser. Switching to en-US');
      onError?.('Amharic speech engine not available in browser. Using English speech recognition.');
    } else if (event.error !== 'aborted') {
      onError?.('Speech recognition error. Please try typing or speak again.');
    }
    
    onStateChange?.('IDLE');
  };

  recognition.onend = () => {
    activeRecognition = null;
    onStateChange?.('IDLE');
  };

  try {
    recognition.start();
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    onStateChange?.('IDLE');
  }

  return () => {
    stopListening();
  };
}

export function stopListening(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {
      // Ignore
    }
    activeRecognition = null;
  }
}

export function speakText(
  text: string,
  lang: VoiceLang = 'en-US',
  onStateChange?: (state: VoiceState) => void
): void {
  if (!isSpeechSynthesisSupported()) {
    return;
  }

  // Cancel any existing playback before starting new speech
  stopSpeaking();

  // Clean text before speech synthesis (remove emojis, bullets, asterisks, URLs)
  let cleanText = text
    .replace(/[\u1F600-\u1F64F\u1F300-\u1F5FF\u1F680-\u1F6FF\u1F700-\u1F77F\u1F780-\u1F7FF\u1F800-\u1F8FF\u1F900-\u1F9FF\u1FA00-\u1FA6F\u1FA70-\u1FAFF\u2600-\u26FF\u2700-\u27BF]/g, '')
    .replace(/•/g, '')
    .replace(/-/g, ' ')
    .replace(/\*/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    onStateChange?.('SPEAKING');
  };

  utterance.onend = () => {
    onStateChange?.('IDLE');
  };

  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    onStateChange?.('IDLE');
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Failed to speak text:', err);
    onStateChange?.('IDLE');
  }
}

export function stopSpeaking(onStateChange?: (state: VoiceState) => void): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
  onStateChange?.('IDLE');
}
