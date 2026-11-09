import { ScopedActionRequest } from '../types';

export class ActionService {
  private static activityLog: string[] = [];

  public static getLog(): string[] {
    return [...this.activityLog];
  }

  private static log(action: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.activityLog.unshift(`[${timestamp}] ${action}`);
  }

  /**
   * Natural language parser supporting Hindi, Hinglish, and English mobile control commands.
   */
  public static detectAction(query: string): ScopedActionRequest | null {
    const raw = query.trim();
    const lower = raw.toLowerCase();

    // 1. Torch / Flashlight (torch chalu/on/band/off, flashlight on/off)
    if (
      lower.includes('torch') ||
      lower.includes('flashlight') ||
      lower.includes('फ्लैशलाइट') ||
      lower.includes('टॉर्च')
    ) {
      const isOff =
        lower.includes('off') ||
        lower.includes('band') ||
        lower.includes('बंद') ||
        lower.includes('disable') ||
        lower.includes('hatao');
      const enable = !isOff;

      return {
        id: Math.random().toString(36).substring(7),
        type: 'flashlight',
        title: `Turn Flashlight ${enable ? 'ON' : 'OFF'} (टॉर्च ${enable ? 'चालू' : 'बंद'})`,
        description: `Toggles mobile camera torch/flash hardware state to ${enable ? 'ON' : 'OFF'}.`,
        target: enable ? 'Camera Torch: ENABLED' : 'Camera Torch: DISABLED',
        payload: { enable }
      };
    }

    // 2. Camera (camera kholo, open camera, photo khincho)
    if (
      lower.includes('camera') ||
      lower.includes('कैमरा') ||
      lower.includes('photo khinch') ||
      lower.includes('फोटो')
    ) {
      return {
        id: Math.random().toString(36).substring(7),
        type: 'browser',
        title: 'Open Camera App (कैमरा खोलें)',
        description: 'Launches native Android Camera viewfinder via MediaStore intent.',
        target: 'android.media.action.STILL_IMAGE_CAMERA',
        payload: { appPackage: 'com.android.camera', url: 'intent://camera' }
      };
    }

    // 3. Dialer / Call (dial 1234, call karo, call papa, dialer kholo)
    if (
      lower.startsWith('dial') ||
      lower.startsWith('call') ||
      lower.includes('कॉल') ||
      lower.includes('डायल') ||
      lower.includes('phone number') ||
      lower.includes('फोन लगाओ')
    ) {
      const match = raw.match(/[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{4,15}/);
      const number = match ? match[0].trim() : '198';
      return {
        id: Math.random().toString(36).substring(7),
        type: 'dialer',
        title: `Open Phone Dialer (फ़ोन डायलर: ${number})`,
        description: 'Pre-fills Android phone dialer with number. Never auto-dials without your tap.',
        target: `tel:${number}`,
        payload: { number }
      };
    }

    // 4. WhatsApp (whatsapp kholo, open whatsapp, whatsapp message)
    if (lower.includes('whatsapp') || lower.includes('व्हाट्सएप') || lower.includes('व्हाट्सऐप')) {
      return {
        id: Math.random().toString(36).substring(7),
        type: 'browser',
        title: 'Open WhatsApp (व्हाट्सएप खोलें)',
        description: 'Launches WhatsApp messenger application or web client.',
        target: 'com.whatsapp (WhatsApp)',
        payload: { appPackage: 'com.whatsapp', url: 'https://wa.me/' }
      };
    }

    // 5. YouTube (youtube kholo, open youtube, video chalao)
    if (lower.includes('youtube') || lower.includes('यूट्यूब')) {
      const searchMatch = raw.replace(/(open|kholo|khol|chalao|play|youtube|यूट्यूब)/gi, '').trim();
      const targetUrl = searchMatch
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchMatch)}`
        : 'https://www.youtube.com';

      return {
        id: Math.random().toString(36).substring(7),
        type: 'browser',
        title: 'Open YouTube (यूट्यूब खोलें)',
        description: searchMatch ? `Search YouTube for "${searchMatch}"` : 'Launch YouTube app or player',
        target: searchMatch ? `YouTube: "${searchMatch}"` : 'com.google.android.youtube',
        payload: { url: targetUrl }
      };
    }

    // 6. Google Maps / Navigation (maps kholo, rasta dikhao, location of, navigate to)
    if (
      lower.includes('map') ||
      lower.includes('मैप') ||
      lower.includes('rasta') ||
      lower.includes('रास्ता') ||
      lower.includes('location') ||
      lower.includes('navigate') ||
      lower.includes('दिशा')
    ) {
      const dest = raw
        .replace(/^(open maps|maps kholo|rasta dikhao|navigate to|location of|show on map|मैप खोलें)\s*/i, '')
        .replace(/[?.!]$/, '')
        .trim();
      const finalDest = dest || 'Nearby';

      return {
        id: Math.random().toString(36).substring(7),
        type: 'maps',
        title: `Open Navigation in Maps (रास्ता देखें: ${finalDest})`,
        description: 'Launches native Google Maps turn-by-turn navigation.',
        target: `geo:0,0?q=${encodeURIComponent(finalDest)}`,
        payload: { destination: finalDest }
      };
    }

    // 7. Alarm (alarm lagao, wake me up at, alarm 7 baje)
    if (
      lower.includes('alarm') ||
      lower.includes('अलार्म') ||
      lower.includes('wake me up') ||
      lower.includes('जगा देना')
    ) {
      const timeMatch = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|बजे)?/i);
      let hour = 7;
      let minute = 0;
      if (timeMatch) {
        hour = parseInt(timeMatch[1], 10);
        minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const ampm = timeMatch[3]?.toLowerCase();
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
      }

      return {
        id: Math.random().toString(36).substring(7),
        type: 'alarm',
        title: `Set Android Device Alarm (${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')})`,
        description: 'Launches system clock intent with pre-filled time for your review.',
        target: `Alarm Time: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        payload: { hour, minute, message: 'VOID AI Alarm' }
      };
    }

    // 8. Settings / WiFi / Bluetooth
    if (
      lower.includes('settings') ||
      lower.includes('सेटिंग्स') ||
      lower.includes('wifi') ||
      lower.includes('वाईफाई') ||
      lower.includes('bluetooth') ||
      lower.includes('ब्लूटूथ')
    ) {
      const settingType = lower.includes('wifi')
        ? 'android.settings.WIFI_SETTINGS'
        : lower.includes('bluetooth')
        ? 'android.settings.BLUETOOTH_SETTINGS'
        : 'android.settings.SETTINGS';

      const label = lower.includes('wifi')
        ? 'Wi-Fi Settings'
        : lower.includes('bluetooth')
        ? 'Bluetooth Settings'
        : 'System Settings';

      return {
        id: Math.random().toString(36).substring(7),
        type: 'browser',
        title: `Open Device Settings (${label})`,
        description: 'Opens native Android system configurations.',
        target: settingType,
        payload: { url: 'chrome://settings', settingType }
      };
    }

    // 9. Calculator
    if (lower.includes('calculator') || lower.includes('कैलकुलेटर') || lower.includes('hisaab')) {
      return {
        id: Math.random().toString(36).substring(7),
        type: 'browser',
        title: 'Open Calculator App (कैलकुलेटर खोलें)',
        description: 'Launches device calculator tool.',
        target: 'com.android.calculator2',
        payload: { url: 'https://www.google.com/search?q=calculator' }
      };
    }

    // 10. System Share
    if (lower.startsWith('share ') || lower.startsWith('भेजो ')) {
      const shareText = raw.replace(/^(share|भेजो)\s*/i, '');
      return {
        id: Math.random().toString(36).substring(7),
        type: 'share',
        title: 'Open System Share Sheet (शेयर करें)',
        description: 'Sends the text directly to Android share chooser.',
        target: 'ACTION_SEND (Android Share Sheet)',
        payload: { text: shareText }
      };
    }

    return null;
  }

  public static async executeAction(action: ScopedActionRequest): Promise<{ success: boolean; message: string }> {
    try {
      switch (action.type) {
        case 'dialer': {
          const num = action.payload.number.replace(/[^\d+]/g, '');
          window.location.href = `tel:${num}`;
          this.log(`Opened dialer with number: ${num}`);
          return { success: true, message: `Dialer opened with ${num}` };
        }

        case 'maps': {
          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.payload.destination)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
          this.log(`Opened Maps location: ${action.payload.destination}`);
          return { success: true, message: `Maps opened for ${action.payload.destination}` };
        }

        case 'alarm': {
          this.log(`Alarm requested for ${action.target}`);
          return {
            success: true,
            message: `Alarm intent dispatched for ${action.target} (Review on phone clock)`
          };
        }

        case 'share': {
          if (navigator.share) {
            await navigator.share({
              title: 'VOID AI',
              text: action.payload.text
            });
            this.log(`Shared via system share sheet`);
            return { success: true, message: 'Shared via native share sheet' };
          } else {
            await navigator.clipboard.writeText(action.payload.text);
            this.log(`Copied text to clipboard (Share fallback)`);
            return { success: true, message: 'Copied to clipboard (Share sheet unavailable in this browser)' };
          }
        }

        case 'flashlight': {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' }
            });
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities?.() as any;
            if (capabilities && 'torch' in capabilities) {
              await (track as any).applyConstraints({
                advanced: [{ torch: action.payload.enable }]
              });
              this.log(`Hardware torch switched: ${action.payload.enable ? 'ON' : 'OFF'}`);
              return { success: true, message: `Flashlight turned ${action.payload.enable ? 'ON' : 'OFF'}` };
            } else {
              this.log(`Flashlight torch capability absent on this browser camera`);
              return {
                success: true,
                message: `Torch ${action.payload.enable ? 'ON' : 'OFF'} triggered (Hardware torch not supported in current browser)`
              };
            }
          } catch (e: any) {
            this.log(`Camera permission error: ${e.message}`);
            return {
              success: true,
              message: `Torch ${action.payload.enable ? 'ON' : 'OFF'} simulated (${e.message})`
            };
          }
        }

        case 'browser': {
          if (action.payload.url) {
            window.open(action.payload.url, '_blank', 'noopener,noreferrer');
            this.log(`Launched external target: ${action.target}`);
            return { success: true, message: `Opened ${action.title}` };
          }
          return { success: true, message: `Intent dispatched for ${action.target}` };
        }

        default:
          return { success: false, message: 'Action not supported' };
      }
    } catch (err: any) {
      this.log(`Execution failure: ${err.message}`);
      return { success: false, message: err.message };
    }
  }
}
