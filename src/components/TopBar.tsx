import React from 'react';
import { Settings, Mic, Trash2, Code2, Volume2, Smartphone, Bot } from 'lucide-react';
import { ConversationMode } from '../types';

interface TopBarProps {
  mode: ConversationMode;
  isListening: boolean;
  isSpeaking: boolean;
  onCycleMode: () => void;
  onToggleVoice: () => void;
  onOpenSettings: () => void;
  onOpenProjectExplorer: () => void;
  onOpenDeviceControls: () => void;
  onOpenJarvisAutomation: () => void;
  onClearChat: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  isListening,
  isSpeaking,
  onCycleMode,
  onToggleVoice,
  onOpenSettings,
  onOpenProjectExplorer,
  onOpenDeviceControls,
  onOpenJarvisAutomation,
  onClearChat
}) => {
  return (
    <header className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between z-20">
      {/* Brand Zone */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-2xl font-black italic tracking-tighter text-white select-none">
            VOID AI
          </span>
          <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-semibold -mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            Android Native
          </span>
        </div>
      </div>

      {/* Circular Top Controls Zone */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mode Selector Pill */}
        <button
          onClick={onCycleMode}
          title={`Active Mode: ${mode.toUpperCase()} (Click to switch)`}
          className="h-9 px-2.5 sm:px-3 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
        >
          <span className="text-[10px] text-zinc-400">MODE</span>
          <span className="text-white font-bold">{mode}</span>
        </button>

        {/* Jarvis Automation Hub Button */}
        <button
          onClick={onOpenJarvisAutomation}
          title="Jarvis Automation: WhatsApp/Insta Auto-Reply & Reel Gestures"
          className="h-9 px-2.5 sm:px-3 rounded-full bg-zinc-900 border border-zinc-700 hover:border-white text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Bot className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">Jarvis Mode</span>
        </button>

        {/* Mobile Control Hub Button */}
        <button
          onClick={onOpenDeviceControls}
          title="Mobile Device Controls (फ़ोन कंट्रोल हब)"
          className="w-9 h-9 sm:w-auto sm:px-3 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs font-medium flex items-center justify-center sm:gap-1.5 transition-all cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-white" />
          <span className="hidden md:inline">Phone Control</span>
        </button>

        {/* Voice Dictation Button */}
        <button
          onClick={onToggleVoice}
          title={isListening ? 'Stop Listening' : 'Voice Dictate (Hindi / Hinglish / English)'}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isListening
              ? 'bg-white text-black ring-2 ring-white/50 animate-pulse'
              : isSpeaking
              ? 'bg-zinc-800 text-white ring-1 ring-zinc-700'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
          }`}
        >
          {isListening ? (
            <Mic className="w-4 h-4 text-black animate-bounce" />
          ) : isSpeaking ? (
            <Volume2 className="w-4 h-4 text-white animate-pulse" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        {/* Android Native Project Source & Exporter Button */}
        <button
          onClick={onOpenProjectExplorer}
          title="Inspect Native Android Kotlin/Compose Project & Download ZIP"
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <Code2 className="w-4 h-4" />
        </button>

        {/* Clear Chat */}
        <button
          onClick={onClearChat}
          title="Clear Conversation"
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* BYOK Settings & Keystore */}
        <button
          onClick={onOpenSettings}
          title="BYOK Provider & Security Settings"
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
