import { ProviderId, ChatMessage, ConversationMode, ProviderConfig } from '../types';

export const PROVIDER_CONFIGS: Record<ProviderId, ProviderConfig> = {
  groq: {
    id: 'groq',
    name: 'Groq BYOK',
    defaultModel: 'llama-3.3-70b-versatile',
    fallbackModel: 'llama-3.1-8b-instant',
    baseUrl: 'https://api.groq.com/openai/v1',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
    chatEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKeyHelp: 'Get your key from console.groq.com'
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini Native',
    defaultModel: 'gemini-2.5-flash',
    fallbackModel: 'gemini-1.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    chatEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKeyHelp: 'Get your key from aistudio.google.com/apikey'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI Chat',
    defaultModel: 'gpt-4o-mini',
    fallbackModel: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
    modelsEndpoint: 'https://api.openai.com/v1/models',
    chatEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKeyHelp: 'Get your key from platform.openai.com'
  },
  compatible: {
    id: 'compatible',
    name: 'OpenAI Compatible (HTTPS)',
    defaultModel: 'default',
    fallbackModel: 'default',
    baseUrl: 'https://api.openai.com/v1',
    modelsEndpoint: '/models',
    chatEndpoint: '/chat/completions',
    apiKeyHelp: 'Self-hosted or 3rd-party endpoint (vLLM, Ollama, OpenRouter)'
  }
};

export class ProviderClient {
  public static async fetchModelCatalog(
    providerId: ProviderId,
    apiKey: string,
    customBaseUrl?: string
  ): Promise<string[]> {
    if (!apiKey) return [];

    try {
      if (providerId === 'gemini') {
        const base = customBaseUrl || PROVIDER_CONFIGS.gemini.baseUrl;
        const res = await fetch(`${base}/models?key=${encodeURIComponent(apiKey)}`);
        if (!res.ok) {
          throw new Error(`Gemini API returned status ${res.status}`);
        }
        const data = await res.json();
        const models: string[] = (data.models || [])
          .filter((m: any) => {
            const name = (m.name || '').replace('models/', '');
            const hasGenerate = m.supportedGenerationMethods?.includes('generateContent');
            return hasGenerate && !name.includes('embedding') && !name.includes('aqa');
          })
          .map((m: any) => m.name.replace('models/', ''));
        return models.length > 0 ? models.sort() : [PROVIDER_CONFIGS.gemini.defaultModel];
      } else {
        const conf = PROVIDER_CONFIGS[providerId];
        const base = customBaseUrl || conf.baseUrl;
        const res = await fetch(`${base}/models`, {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        });
        if (!res.ok) {
          throw new Error(`Provider API returned HTTP ${res.status}`);
        }
        const data = await res.json();
        const list: string[] = (data.data || [])
          .map((m: any) => m.id)
          .filter((id: string) => {
            if (providerId === 'groq') {
              return !id.includes('whisper') && !id.includes('embed') && !id.includes('guard');
            }
            if (providerId === 'openai') {
              return (id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3')) &&
                !id.includes('audio') && !id.includes('realtime');
            }
            return true;
          });
        return list.length > 0 ? list.sort() : [conf.defaultModel];
      }
    } catch (err: any) {
      console.warn('Could not load live model catalog:', err.message);
      return [PROVIDER_CONFIGS[providerId].defaultModel];
    }
  }

  public static async streamChat(
    providerId: ProviderId,
    apiKey: string,
    model: string,
    temperature: number,
    mode: ConversationMode,
    history: ChatMessage[],
    customBaseUrl: string | undefined,
    onToken: (token: string) => void,
    signal: AbortSignal
  ): Promise<void> {
    const systemDirective = getSystemPromptForMode(mode);

    if (providerId === 'gemini') {
      await this.streamGemini(apiKey, model, temperature, systemDirective, history, customBaseUrl, onToken, signal);
    } else {
      await this.streamOpenAiStyle(providerId, apiKey, model, temperature, systemDirective, history, customBaseUrl, onToken, signal);
    }
  }

  private static async streamGemini(
    apiKey: string,
    model: string,
    temperature: number,
    systemDirective: string,
    history: ChatMessage[],
    customBaseUrl: string | undefined,
    onToken: (token: string) => void,
    signal: AbortSignal
  ) {
    const cleanModel = (model || PROVIDER_CONFIGS.gemini.defaultModel).replace('models/', '');
    const base = customBaseUrl || PROVIDER_CONFIGS.gemini.baseUrl;
    const url = `${base}/models/${cleanModel}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

    // Build Gemini contents
    const contents = history
      .filter(m => m.role !== 'system')
      .slice(-40)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

    const body = {
      contents,
      systemInstruction: {
        parts: [{ text: systemDirective }]
      },
      generationConfig: {
        temperature
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      this.classifyHttpError(res.status, errText, cleanModel);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Response stream unavailable');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.substring(6).trim();
          if (jsonStr === '[DONE]') return;
          try {
            const data = JSON.parse(jsonStr);
            const candidates = data.candidates || [];
            if (candidates.length > 0) {
              const parts = candidates[0].content?.parts || [];
              for (const part of parts) {
                // Do NOT display thought parts per Void AI specification
                if (part.thought) continue;
                if (part.text) {
                  onToken(part.text);
                }
              }
            }
          } catch (_) {}
        }
      }
    }
  }

  private static async streamOpenAiStyle(
    providerId: ProviderId,
    apiKey: string,
    model: string,
    temperature: number,
    systemDirective: string,
    history: ChatMessage[],
    customBaseUrl: string | undefined,
    onToken: (token: string) => void,
    signal: AbortSignal
  ) {
    const conf = PROVIDER_CONFIGS[providerId];
    const base = customBaseUrl || conf.baseUrl;
    const url = `${base}/chat/completions`;

    const messages = [
      { role: 'system', content: systemDirective },
      ...history.slice(-40).map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    const body = {
      model: model || conf.defaultModel,
      messages,
      temperature,
      stream: true
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      this.classifyHttpError(res.status, errText, model);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Stream response unavailable');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.substring(6).trim();
          if (dataStr === '[DONE]') return;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              onToken(delta.content);
            }
          } catch (_) {}
        }
      }
    }
  }

  private static classifyHttpError(status: number, rawDetails: string, model: string) {
    if (status === 401) {
      throw new Error('Authentication Failed (401): Invalid or expired API Key.');
    }
    if (status === 403) {
      throw new Error('Permission Denied (403): Your key lacks access to this provider resource.');
    }
    if (status === 404) {
      throw new Error(`Model Unavailable (404): Model '${model}' was not found or has been retired.`);
    }
    if (status === 429) {
      throw new Error('Rate Limit or Quota Exceeded (429): Please try again later or verify billing.');
    }
    if (rawDetails.toLowerCase().includes('billing') || rawDetails.toLowerCase().includes('insufficient_quota')) {
      throw new Error('Billing Issue: Account has exhausted credits or billing is inactive.');
    }
    throw new Error(`Provider Error (HTTP ${status})`);
  }
}

export function getSystemPromptForMode(mode: ConversationMode): string {
  const base = 'You are VOID AI, a personal native intelligence assistant. ';
  switch (mode) {
    case 'short':
      return base + 'Short mode active: Limit your answer strictly to 1-4 punchy, concise lines. Use natural Hinglish or the user\'s language. Do not output conversational filler, preambles, or apologies.';
    case 'normal':
      return base + 'Normal mode active: Provide everyday conversational responses, practical explanations, and balanced depth.';
    case 'detailed':
      return base + 'Detailed mode active: Provide deep technical explanations, comprehensive working code blocks, security considerations, and architecture breakdowns. Support authorized labs, CTFs, defensive analysis, and scoped security learning without enabling malware deployment or credential theft.';
  }
}
