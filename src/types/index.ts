export type ProviderId = 'groq' | 'gemini' | 'openai' | 'compatible';

export type ConversationMode = 'short' | 'normal' | 'detailed';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  defaultModel: string;
  fallbackModel: string;
  baseUrl: string;
  modelsEndpoint: string;
  chatEndpoint: string;
  apiKeyHelp: string;
}

export interface ScopedActionRequest {
  id: string;
  type: 'dialer' | 'maps' | 'alarm' | 'share' | 'browser' | 'flashlight' | 'file_export';
  title: string;
  description: string;
  target: string;
  payload: any;
}

export interface AppSettings {
  provider: ProviderId;
  model: string;
  availableModels: string[];
  temperature: number;
  mode: ConversationMode;
  rememberKeyOnDevice: boolean;
  customBaseUrl?: string;
  speechLanguage: string;
}
