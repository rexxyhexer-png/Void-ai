/**
 * Voice Manager (SpeechRecognition & SpeechSynthesis)
 * Enforces safety constraints:
 * - No listening while TTS is speaking
 * - Stop recognition when settings or unfocused
 * - Support Hindi / Hinglish / English
 */

type VoiceStateListener = (state: {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}) => void;

class VoiceManager {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private listeners: Set<VoiceStateListener> = new Set();
  private language = 'hi-IN';

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.notify();
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = final || interim;
        this.notify(currentText);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let errorMsg = 'Speech recognition error';
        if (event.error === 'not-allowed') {
          errorMsg = 'Microphone permission denied';
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech detected';
        } else if (event.error === 'network') {
          errorMsg = 'Network speech service unavailable';
        }
        this.notify('', errorMsg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.notify();
      };
    } catch (e) {
      console.warn('SpeechRecognition initialization error', e);
    }
  }

  public subscribe(listener: VoiceStateListener) {
    this.listeners.add(listener);
    listener({
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      transcript: '',
      error: null
    });
    return () => this.listeners.delete(listener);
  }

  private notify(transcript = '', error: string | null = null) {
    this.listeners.forEach(l =>
      l({
        isListening: this.isListening,
        isSpeaking: this.isSpeaking,
        transcript,
        error
      })
    );
  }

  public setLanguage(lang: string) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public startListening(onFinalResult?: (text: string) => void) {
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    if (!this.recognition) {
      this.notify('', 'Speech recognition is not supported in this browser.');
      return;
    }

    try {
      if (onFinalResult) {
        this.recognition.onresult = (event: any) => {
          let text = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          this.notify(text);
          if (event.results[event.results.length - 1].isFinal) {
            onFinalResult(text.trim());
          }
        };
      }
      this.recognition.start();
    } catch (err: any) {
      // If already started, stop then restart
      this.recognition.stop();
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    this.isListening = false;
    this.notify();
  }

  public speak(text: string, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) return;

    this.stopListening();
    window.speechSynthesis.cancel();

    // Clean markdown before speaking
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.includes('IN')) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.notify();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.notify();
      onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.notify();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.notify();
  }
}

export const voiceManager = new VoiceManager();
