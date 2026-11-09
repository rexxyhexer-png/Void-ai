import React, { useRef, useEffect } from 'react';
import { Copy, Check, Volume2, Share2, Terminal, Shield, ArrowUpRight } from 'lucide-react';
import { ChatMessage, ConversationMode } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  mode: ConversationMode;
  providerName: string;
  modelName: string;
  hasKey: boolean;
  onOpenSettings: () => void;
  onSpeak: (text: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  mode,
  providerName,
  modelName,
  hasKey,
  onOpenSettings,
  onSpeak
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({ title: 'VOID AI Output', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard for sharing');
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        {/* Recreated native vector banner for VOID AI */}
        <div className="relative mb-6">
          <svg className="w-64 h-24 sm:w-80 sm:h-28 mx-auto" viewBox="0 0 320 110" fill="none">
            <defs>
              <linearGradient id="brushGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            {/* Native textured angular banner backdrop */}
            <path
              d="M 15 15 L 295 5 L 310 95 L 25 105 Z"
              fill="url(#brushGrad)"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
            />
            <path
              d="M 5 25 L 305 15 L 290 85 L 10 95 Z"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white drop-shadow-md">
              VOID AI
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm font-semibold tracking-widest text-zinc-400 uppercase mb-6">
          Personal BYOK Intelligence Engine
        </p>

        {/* Status card */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 max-w-sm w-full text-left space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Provider & Model:</span>
            <span className="text-white font-mono font-medium truncate max-w-[170px]">
              {providerName} · {modelName}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Keystore Security:</span>
            <span className="text-zinc-300 font-medium flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-white" />
              {hasKey ? 'AES-256 Encrypted' : 'Key Required'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Mode:</span>
            <span className="text-white font-semibold uppercase">{mode} (1-4 lines)</span>
          </div>

          {!hasKey && (
            <button
              onClick={onOpenSettings}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Configure Personal API Key</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 max-w-md w-full mt-6 text-left">
          <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-[11px] text-zinc-400">
            <span className="text-white font-medium block mb-0.5">Short Mode Default</span>
            Punchy 1–4 line replies in natural Hinglish or English.
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-[11px] text-zinc-400">
            <span className="text-white font-medium block mb-0.5">Scoped Actions</span>
            Dialer, Maps, Alarms, Torch & SAF with explicit confirmation.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-4xl mx-auto w-full">
      {messages.map((message) => {
        const isUser = message.role === 'user';

        if (isUser) {
          // USER MESSAGE: Content-sized bubble (a dot is a tiny bubble, never a full width card!)
          return (
            <div key={message.id} className="flex justify-end w-full">
              <div className="inline-block max-w-[85%] sm:max-w-[70%] bg-white text-black text-sm px-3.5 py-2 rounded-2xl shadow-sm break-words leading-relaxed select-text font-normal">
                {message.content}
              </div>
            </div>
          );
        }

        // ASSISTANT MESSAGE
        return (
          <div key={message.id} className="flex justify-start w-full">
            <div className="w-full max-w-[92%] sm:max-w-[85%] bg-[#0f0f0f] border border-zinc-800/90 rounded-2xl p-4 text-white text-sm shadow-md space-y-3">
              {/* Message Header */}
              <div className="flex items-center justify-between text-xs text-zinc-500 pb-1 border-b border-zinc-800/50">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white italic tracking-tight">VOID AI</span>
                  <span>·</span>
                  <span className="font-mono text-[11px] text-zinc-400">{modelName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSpeak(message.content)}
                    title="Read aloud via TextToSpeech"
                    className="p-1 hover:text-white transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopy(message.id, message.content)}
                    title="Copy response"
                    className="p-1 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleShare(message.content)}
                    title="Share response"
                    className="p-1 hover:text-white transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="prose prose-invert text-zinc-200 text-sm leading-relaxed max-w-none">
                {message.content ? (
                  <RenderMarkdown content={message.content} />
                ) : message.isStreaming ? (
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse delay-150"></span>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse delay-300"></span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
};

/**
 * Clean markdown renderer with code blocks & copy buttons
 */
const RenderMarkdown: React.FC<{ content: string }> = ({ content }) => {
  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const lang = part.substring(3, firstLineEnd).trim() || 'code';
          const code = part.substring(firstLineEnd + 1, part.length - 3);

          return (
            <div key={index} className="my-2 rounded-lg bg-black border border-zinc-800 overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800 text-zinc-400">
                <span className="text-[11px] font-semibold uppercase">{lang}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="hover:text-white transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-zinc-200 leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Standard paragraphs
        return (
          <p key={index} className="whitespace-pre-wrap leading-relaxed">
            {part}
          </p>
        );
      })}
    </div>
  );
};
