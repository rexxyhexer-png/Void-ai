import React, { useState } from 'react';
import { X, Eye, EyeOff, Shield, RefreshCw, Key, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { ProviderId, AppSettings } from '../types';
import { PROVIDER_CONFIGS } from '../services/providers';

interface SettingsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  hasStoredKey: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSaveKey: (key: string, remember: boolean) => Promise<void>;
  onForgetCurrentKey: () => void;
  onForgetAllKeys: () => void;
  onTestAndFetchModels: (key: string) => Promise<void>;
  isLoadingModels: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  hasStoredKey,
  onClose,
  onUpdateSettings,
  onSaveKey,
  onForgetCurrentKey,
  onForgetAllKeys,
  onTestAndFetchModels,
  isLoadingModels
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [rememberKey, setRememberKey] = useState(settings.rememberKeyOnDevice);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentProviderConfig = PROVIDER_CONFIGS[settings.provider];

  const handleSave = async () => {
    if (apiKeyInput.trim()) {
      await onSaveKey(apiKeyInput.trim(), rememberKey);
      setApiKeyInput('');
      setSaveStatus('Key encrypted & securely connected');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleTest = async () => {
    if (apiKeyInput.trim()) {
      await onTestAndFetchModels(apiKeyInput.trim());
    } else {
      await onTestAndFetchModels('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b0b0b] border border-zinc-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              BYOK Provider & Keystore
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Select Intelligence Provider
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['groq', 'gemini', 'openai', 'compatible'] as ProviderId[]).map((id) => {
              const active = settings.provider === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onUpdateSettings({ provider: id, model: PROVIDER_CONFIGS[id].defaultModel })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compatible custom URL if selected */}
        {settings.provider === 'compatible' && (
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Custom Base URL (HTTPS)</label>
            <input
              type="text"
              value={settings.customBaseUrl || ''}
              onChange={e => onUpdateSettings({ customBaseUrl: e.target.value })}
              placeholder="https://api.together.xyz/v1 or https://openrouter.ai/api/v1"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
        )}

        {/* API Key Input Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {currentProviderConfig.name} Key
            </label>
            <a
              href={currentProviderConfig.apiKeyHelp}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-zinc-400 hover:text-white underline"
            >
              Get Key
            </a>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder={hasStoredKey ? '•••••••••••••••• (Encrypted Key Saved)' : 'Enter API Key'}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Remember on Device Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rememberDeviceKey"
              checked={rememberKey}
              onChange={e => {
                setRememberKey(e.target.checked);
                onUpdateSettings({ rememberKeyOnDevice: e.target.checked });
              }}
              className="rounded bg-zinc-900 border-zinc-700 text-white focus:ring-0 cursor-pointer w-4 h-4"
            />
            <label htmlFor="rememberDeviceKey" className="text-xs text-zinc-300 cursor-pointer">
              Remember key on this device (<span className="text-white font-medium">AES-256-GCM Keystore</span>)
            </label>
          </div>

          {/* Action row for key */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={!apiKeyInput.trim()}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                apiKeyInput.trim()
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Save & Connect
            </button>

            <button
              type="button"
              onClick={handleTest}
              disabled={isLoadingModels}
              title="Test API Key & Load Live Models"
              className="py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
              <span>{isLoadingModels ? 'Testing...' : 'Test & Load Models'}</span>
            </button>

            {hasStoredKey && (
              <button
                type="button"
                onClick={onForgetCurrentKey}
                title="Forget locally stored key for this provider"
                className="py-2 px-3 rounded-lg bg-red-950/40 border border-red-900/40 hover:bg-red-900/60 text-red-300 text-xs font-medium transition-all cursor-pointer"
              >
                Forget
              </button>
            )}
          </div>

          {saveStatus && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveStatus}</span>
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Active Model
          </label>
          <div className="flex items-center gap-2">
            <select
              value={settings.model}
              onChange={e => onUpdateSettings({ model: e.target.value })}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600 font-mono"
            >
              {settings.availableModels.map(m => (
                <option key={m} value={m} className="bg-zinc-900 text-white">
                  {m}
                </option>
              ))}
              {!settings.availableModels.includes(settings.model) && (
                <option value={settings.model} className="bg-zinc-900 text-white">
                  {settings.model}
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-400 uppercase tracking-wider">Temperature</span>
            <span className="font-mono text-white font-medium">{settings.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={settings.temperature}
            onChange={e => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-white bg-zinc-800 h-1 rounded-lg cursor-pointer"
          />
        </div>

        {/* Forget All Keys / Wipe Local Vault */}
        <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
          <button
            type="button"
            onClick={onForgetAllKeys}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe All Keystore Encrypted Keys</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
