import React from 'react';
import { AlertCircle, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { ScopedActionRequest } from '../types';

interface ActionConfirmModalProps {
  request: ScopedActionRequest | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  request,
  onConfirm,
  onDismiss
}) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0e0e0e] border border-zinc-700/80 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">
              Scoped Android Intent Confirmation
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white">
            {request.title}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {request.description}
          </p>
        </div>

        {/* Exact Target Box */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1 font-mono">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">
            EXACT TARGET INTENT
          </span>
          <span className="text-xs text-white break-all font-medium">
            {request.target}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Cancel / Dismiss
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 px-3 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>Confirm & Launch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
