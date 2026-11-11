import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { Composer } from './components/Composer';
import { MessageList } from './components/MessageList';
import { SettingsModal } from './components/SettingsModal';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { DeviceControlPanel } from './components/DeviceControlPanel';
import { JarvisAutomationModal } from './components/JarvisAutomationModal';
import { ChatMessage, AppSettings, ScopedActionRequest, ProviderId, ConversationMode } from './types';
import { PROVIDER_CONFIGS, ProviderClient } from './services/providers';
import { ActionService } from './services/actions';
import { encryptAndSaveKey, getDecryptedKey, hasSavedKey, removeKey, removeAllKeys } from './utils/crypto';
import { voiceManager } from './utils/voice';
import { downloadDebugApk } from './services/zipExporter';
import { Package } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    return {
      provider: 'groq',
      model: PROVIDER_CONFIGS.groq.defaultModel,
      availableModels: [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'openai/gpt-oss-20b',
        'mixtral-8x7b-32768'
      ],
      temperature: 0.7,
      mode: 'short',
      rememberKeyOnDevice: true,
      speechLanguage: 'hi-IN'
    };
  });

  const [hasEncryptedKey, setHasEncryptedKey] = useState(false);
  const [activeSessionKey, setActiveSessionKey] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Modals & Panels
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeviceControlOpen, setIsDeviceControlOpen] = useState(false);
  const [isJarvisModalOpen, setIsJarvisModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<ScopedActionRequest | null>(null);

  // Voice State
  const [voiceState, setVoiceState] = useState({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    error: null as string | null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Check stored encrypted key on provider change
  useEffect(() => {
    async function checkKey() {
      const hasKey = hasSavedKey(settings.provider);
      setHasEncryptedKey(hasKey);
      if (hasKey) {
        const decrypted = await getDecryptedKey(settings.provider);
        if (decrypted) {
          setActiveSessionKey(decrypted);
        }
      } else {
        setActiveSessionKey('');
      }
    }
    checkKey();
  }, [settings.provider]);

  // Subscribe to voice events
  useEffect(() => {
    const unsubscribe = voiceManager.subscribe((state) => {
      setVoiceState(state);
      if (state.transcript && state.isListening) {
        setInput(state.transcript);
      }
      if (state.error) {
        setErrorNotification(state.error);
        setTimeout(() => setErrorNotification(null), 4000);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleCycleMode = () => {
    const modes: ConversationMode[] = ['short', 'normal', 'detailed'];
    const nextIdx = (modes.indexOf(settings.mode) + 1) % modes.length;
    setSettings(prev => ({ ...prev, mode: modes[nextIdx] }));
  };

  const handleToggleVoice = () => {
    if (voiceState.isListening) {
      voiceManager.stopListening();
    } else {
      voiceManager.startListening((finalText) => {
        if (finalText) {
          setInput(finalText);
          // Check if it's a mobile control voice command
          const detectedAction = ActionService.detectAction(finalText);
          if (detectedAction) {
            setPendingAction(detectedAction);
          }
        }
      });
    }
  };

  const handleSpeak = (text: string) => {
    voiceManager.speak(text);
  };

  const handleSaveKey = async (rawKey: string, remember: boolean) => {
    setActiveSessionKey(rawKey);
    if (remember) {
      await encryptAndSaveKey(settings.provider, rawKey);
      setHasEncryptedKey(true);
    } else {
      removeKey(settings.provider);
      setHasEncryptedKey(false);
    }

    // Refresh model catalog
    await handleTestAndFetchModels(rawKey);
  };

  const handleForgetCurrentKey = () => {
    removeKey(settings.provider);
    setActiveSessionKey('');
    setHasEncryptedKey(false);
  };

  const handleForgetAllKeys = () => {
    removeAllKeys();
    setActiveSessionKey('');
    setHasEncryptedKey(false);
  };

  const handleTestAndFetchModels = async (keyOverride?: string) => {
    const key = keyOverride || activeSessionKey;
    if (!key) {
      setErrorNotification('Please provide an API key first');
      setTimeout(() => setErrorNotification(null), 3000);
      return;
    }

    try {
      setIsLoadingModels(true);
      const catalog = await ProviderClient.fetchModelCatalog(
        settings.provider,
        key,
        settings.customBaseUrl
      );
      setSettings(prev => ({
        ...prev,
        availableModels: catalog,
        model: catalog.includes(prev.model) ? prev.model : catalog[0]
      }));
    } catch (err: any) {
      setErrorNotification(err.message);
      setTimeout(() => setErrorNotification(null), 4000);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleQuickAction = (command: string) => {
    setInput(command);
    const detected = ActionService.detectAction(command);
    if (detected) {
      setPendingAction(detected);
    }
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;

    // Stop listening before sending
    voiceManager.stopListening();

    // Check for scoped Android actions first
    const detectedAction = ActionService.detectAction(trimmedInput);
    if (detectedAction) {
      setPendingAction(detectedAction);
    }

    if (!activeSessionKey) {
      // If action was detected, we allow action execution even if no key yet
      if (!detectedAction) {
        setErrorNotification('Please set your personal API key in Settings');
        setIsSettingsOpen(true);
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now()
    };

    const assistantMessageId = Math.random().toString(36).substring(7);
    const initialAssistantMsg: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    setMessages(prev => [...prev, userMessage, initialAssistantMsg]);
    setInput('');

    if (!activeSessionKey) {
      // Direct local intent response if no API key configured
      const reply = detectedAction
        ? `[Mobile Control]: Intent dispatched for "${detectedAction.title}". Please confirm on screen to execute.`
        : 'Please configure your personal BYOK key in Settings to receive generative responses.';
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessageId ? { ...m, content: reply, isStreaming: false } : m
        )
      );
      return;
    }

    setIsStreaming(true);
    setErrorNotification(null);
    abortControllerRef.current = new AbortController();

    try {
      let accumulated = '';
      await ProviderClient.streamChat(
        settings.provider,
        activeSessionKey,
        settings.model,
        settings.temperature,
        settings.mode,
        [...messages, userMessage],
        settings.customBaseUrl,
        (token) => {
          accumulated += token;
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessageId ? { ...m, content: accumulated } : m
            )
          );
        },
        abortControllerRef.current.signal
      );

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessageId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorText = err.message || 'Stream connection failed';
        setErrorNotification(errorText);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: m.content || `[Error: ${errorText}]`,
                  isStreaming: false
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setMessages(prev =>
      prev.map(m => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const res = await ActionService.executeAction(pendingAction);
    setPendingAction(null);
    if (res.success) {
      setErrorNotification(`Action executed: ${res.message}`);
    } else {
      setErrorNotification(`Action failed: ${res.message}`);
    }
    setTimeout(() => setErrorNotification(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between brush-bg text-white relative selection:bg-white selection:text-black">
      {/* Top Bar with Branding, Phone Control & Circular Controls */}
      <TopBar
        mode={settings.mode}
        isListening={voiceState.isListening}
        isSpeaking={voiceState.isSpeaking}
        onCycleMode={handleCycleMode}
        onToggleVoice={handleToggleVoice}
        onOpenSettings={() => {
          voiceManager.stopListening();
          setIsSettingsOpen(true);
        }}
        onOpenProjectExplorer={() => setIsProjectModalOpen(true)}
        onOpenDeviceControls={() => setIsDeviceControlOpen(true)}
        onOpenJarvisAutomation={() => setIsJarvisModalOpen(true)}
        onClearChat={() => {
          handleCancelStreaming();
          setMessages([]);
        }}
      />

      {/* Direct APK Download Banner */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-1 pb-1">
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white text-black shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Direct Android APK Download (app-debug.apk)</span>
              <span className="text-[11px] text-zinc-400 block">No GitHub 404 errors — download the compiled debug APK directly instantly!</span>
            </div>
          </div>
          <button
            onClick={() => downloadDebugApk()}
            className="py-1.5 px-3.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Download APK</span>
          </button>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {errorNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 max-w-md animate-in slide-in-from-top duration-150">
          <span className="w-2 h-2 rounded-full bg-white shrink-0 animate-pulse"></span>
          <span className="truncate">{errorNotification}</span>
        </div>
      )}

      {/* Chat Messages List */}
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        mode={settings.mode}
        providerName={PROVIDER_CONFIGS[settings.provider].name}
        modelName={settings.model}
        hasKey={hasEncryptedKey || Boolean(activeSessionKey)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSpeak={handleSpeak}
      />

      {/* Angular Cutout Message Composer with Quick Action Chips */}
      <Composer
        input={input}
        isStreaming={isStreaming}
        isListening={voiceState.isListening}
        onInputChange={setInput}
        onSend={handleSend}
        onCancel={handleCancelStreaming}
        onToggleMic={handleToggleVoice}
        onQuickAction={handleQuickAction}
        providerName={PROVIDER_CONFIGS[settings.provider].name}
        modelName={settings.model}
      />

      {/* Mobile Device Control Hub Modal */}
      <DeviceControlPanel
        isOpen={isDeviceControlOpen}
        onClose={() => setIsDeviceControlOpen(false)}
        onTriggerAction={(action) => setPendingAction(action)}
        onVoiceCommandSample={(cmd) => handleQuickAction(cmd)}
      />

      {/* BYOK Settings & Keystore Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        hasStoredKey={hasEncryptedKey}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={newVals => setSettings(prev => ({ ...prev, ...newVals }))}
        onSaveKey={handleSaveKey}
        onForgetCurrentKey={handleForgetCurrentKey}
        onForgetAllKeys={handleForgetAllKeys}
        onTestAndFetchModels={handleTestAndFetchModels}
        isLoadingModels={isLoadingModels}
      />

      {/* Scoped Intent Confirmation Modal */}
      <ActionConfirmModal
        request={pendingAction}
        onConfirm={handleConfirmAction}
        onDismiss={() => setPendingAction(null)}
      />

      {/* Native Android Project Source & Downloader Modal */}
      <AndroidProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />

      {/* Jarvis-Grade Automation Hub Modal */}
      <JarvisAutomationModal
        isOpen={isJarvisModalOpen}
        onClose={() => setIsJarvisModalOpen(false)}
        onSendSimulationMessage={(msg) => handleQuickAction(msg)}
      />
    </div>
  );
}
