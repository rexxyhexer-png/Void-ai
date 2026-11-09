/**
 * Client-Side Authenticated Encryption (AES-256-GCM)
 * Emulates the Android Keystore hardware-backed encryption in the web environment.
 * Stores only ciphertext and IV; never stores plaintext keys in localStorage.
 */

const DEVICE_KEY_STORAGE = 'void_ai_device_entropy_v1';
const CIPHERTEXT_PREFIX = 'void_enc_v1_';

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  let rawEntropy = localStorage.getItem(DEVICE_KEY_STORAGE);
  if (!rawEntropy) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    rawEntropy = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(DEVICE_KEY_STORAGE, rawEntropy);
  }

  const rawBytes = new Uint8Array(
    rawEntropy.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  return await crypto.subtle.importKey(
    'raw',
    rawBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptAndSaveKey(providerId: string, apiKey: string): Promise<boolean> {
  try {
    const key = await getOrCreateDeviceKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const payload = {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(encrypted)),
      timestamp: Date.now()
    };

    localStorage.setItem(CIPHERTEXT_PREFIX + providerId, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('Failed to encrypt key with AES-GCM', err);
    return false;
  }
}

export async function getDecryptedKey(providerId: string): Promise<string | null> {
  try {
    const stored = localStorage.getItem(CIPHERTEXT_PREFIX + providerId);
    if (!stored) return null;

    const payload = JSON.parse(stored);
    const key = await getOrCreateDeviceKey();
    const iv = new Uint8Array(payload.iv);
    const ciphertext = new Uint8Array(payload.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    console.warn('Decryption failed or key invalidated. Removing compromised slot.', err);
    removeKey(providerId);
    return null;
  }
}

export function hasSavedKey(providerId: string): boolean {
  return localStorage.getItem(CIPHERTEXT_PREFIX + providerId) !== null;
}

export function removeKey(providerId: string): void {
  localStorage.removeItem(CIPHERTEXT_PREFIX + providerId);
}

export function removeAllKeys(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CIPHERTEXT_PREFIX)) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
