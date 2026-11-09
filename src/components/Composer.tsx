import React, { useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Mic,
  MicOff,
  Zap,
  Phone,
  Camera,
  Clock,
  Navigation,
  Youtube,
  MessageCircle
} from 'lucide-react';

interface ComposerProps {
  input: string;
  isStreaming: boolean;
  isListening: boolean;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onToggleMic: () => void;
  onQuickAction: (command: string) => void;
  providerName: string;
  modelName: string;
}

export const Composer: React.FC<ComposerProps> = ({
  input,
  isStreaming,
  isListening,
  onInputChange,
  onSend,
  onCancel,
  onToggleMic,
  onQuickAction,
  providerName,
  modelName
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        onSend();
      }
    }
  };

  const quickControlChips = [
    { label: 'Torch', icon: Zap, command: 'Torch chalu karo' },
    { label: 'Camera', icon: Camera, command: 'Camera kholo' },
    { label: 'Dialer', icon: Phone, command: 'Dial 198' },
    { label: 'Alarm', icon: Clock, command: 'Subah 7 baje alarm lagao' },
    { label: 'Maps', icon: Navigation, command: 'Nearby hospital maps me dikhao' },
    { label: 'YouTube', icon: Youtube, command: 'YouTube kholo' },
    { label: 'WhatsApp', icon: MessageCircle, command: 'WhatsApp kholo' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-1 z-20 space-y-2">
      {/* Listening Status Bar */}
      {isListening && (
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-md text-xs text-white animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>Listening for mobile voice command (Hindi / Hinglish / English)...</span>
        </div>
      )}

      {/* Mobile Control Quick Action Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 shrink-0 select-none">
          Control:
        </span>
        {quickControlChips.map(chip => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => onQuickAction(chip.command)}
              className="py-1 px-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Icon className="w-3 h-3 text-white" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Signature Compact Angular Black Message Composer with White Cutout Border */}
      <div className="relative group">
        <div className="angular-cutout-border bg-[#070707] transition-all duration-150 p-2 sm:p-2.5">
          <div className="flex items-end gap-2">
            {/* Native Voice Dictate Button */}
            <button
              type="button"
              onClick={onToggleMic}
              title={isListening ? 'Stop listening' : 'Start voice command / dictation'}
              className={`p-2 rounded-md transition-all shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Input Field */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask VOID AI or command mobile ("Torch chalu karo", "Camera kholo")...`}
              className="w-full bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none resize-none py-1.5 leading-relaxed max-h-32 min-h-[36px]"
            />

            {/* Action Buttons: Stop / Send */}
            <div className="flex items-center gap-1 shrink-0 pb-0.5">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onCancel}
                  title="Cancel generation"
                  className="p-2 rounded-md bg-white text-black hover:bg-zinc-200 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!input.trim()}
                  title="Send message or execute command (Enter)"
                  className={`p-2 rounded-md transition-all cursor-pointer ${
                    input.trim()
                      ? 'bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-sm'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quiet Subtitle Specs */}
        <div className="flex items-center justify-between px-1.5 pt-1.5 text-[11px] text-zinc-400 font-mono">
          <span>Enter to send or trigger action · Shift+Enter new line</span>
          <span className="truncate max-w-[200px]">Mobile Intent Engine Active</span>
        </div>
      </div>
    </div>
  );
};
