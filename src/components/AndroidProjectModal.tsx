import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, FolderArchive, Smartphone, Package } from 'lucide-react';
import { ANDROID_FILES, downloadAndroidProjectZip, downloadDebugApk } from '../services/zipExporter';

interface AndroidProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({ isOpen, onClose }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);

  if (!isOpen) return null;

  const currentFile = ANDROID_FILES[selectedFileIndex] || ANDROID_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      await downloadAndroidProjectZip();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadApk = async () => {
    try {
      setIsDownloadingApk(true);
      await downloadDebugApk();
    } finally {
      setIsDownloadingApk(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0b0b] border border-zinc-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#080808]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white text-black">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <span>Native Android Project & Debug APK</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-normal">
                  SDK 35 · 1 Module
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Download app-debug.apk directly or export complete Kotlin/Compose project ZIP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadApk}
              disabled={isDownloadingApk}
              className="py-1.5 px-3.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <Package className={`w-3.5 h-3.5 ${isDownloadingApk ? 'animate-bounce' : ''}`} />
              <span>{isDownloadingApk ? 'Building APK...' : 'Download app-debug.apk'}</span>
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="py-1.5 px-3.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-white text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Bundling...' : 'Project ZIP'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content split view: File list on left, Code viewer on right */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 bg-[#080808] overflow-y-auto shrink-0 p-3 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Project Structure
            </div>
            {ANDROID_FILES.map((file, idx) => {
              const active = idx === selectedFileIndex;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                    active
                      ? 'bg-white text-black font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate">{file.path}</span>
                  <span className="text-[9px] opacity-70 uppercase tracking-wider">{file.category}</span>
                </button>
              );
            })}

            {/* Quick guide */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 px-2 space-y-2 text-[11px] text-zinc-400">
              <div className="font-semibold text-zinc-300 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-white" />
                <span>Build Instructions</span>
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-400">
                1. Unzip downloaded <code className="text-white">void-ai-android.zip</code><br />
                2. Open in Android Studio Ladybug<br />
                3. Connect phone via USB debugging<br />
                4. Run <code className="text-white">./gradlew assembleDebug</code>
              </p>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden">
            {/* Active File Bar */}
            <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-300 font-medium">
                  {currentFile.path}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="py-1 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-300 leading-relaxed bg-[#050505]">
              <pre className="whitespace-pre">
                <code>{currentFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
