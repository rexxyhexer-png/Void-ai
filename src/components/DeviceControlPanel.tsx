import React from 'react';
import {
  Smartphone,
  Zap,
  Phone,
  Camera,
  MessageCircle,
  Youtube,
  Navigation,
  Clock,
  Settings,
  Calculator,
  Share2,
  X,
  Volume2
} from 'lucide-react';
import { ScopedActionRequest } from '../types';

interface DeviceControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction: (request: ScopedActionRequest) => void;
  onVoiceCommandSample: (cmd: string) => void;
}

export const DeviceControlPanel: React.FC<DeviceControlPanelProps> = ({
  isOpen,
  onClose,
  onTriggerAction,
  onVoiceCommandSample
}) => {
  if (!isOpen) return null;

  const quickActions = [
    {
      id: 'torch_toggle',
      title: 'Flashlight (टॉर्च)',
      icon: Zap,
      desc: 'Toggle camera flash torch',
      action: {
        id: 'qa_torch',
        type: 'flashlight' as const,
        title: 'Turn Flashlight ON/OFF (टॉर्च)',
        description: 'Toggle mobile hardware camera torch.',
        target: 'Camera Hardware Torch',
        payload: { enable: true }
      }
    },
    {
      id: 'dialer_open',
      title: 'Phone Dialer (कॉल)',
      icon: Phone,
      desc: 'Open phone dialer pad',
      action: {
        id: 'qa_dial',
        type: 'dialer' as const,
        title: 'Open Phone Dialer Pad',
        description: 'Launches native phone dialer.',
        target: 'tel:',
        payload: { number: '' }
      }
    },
    {
      id: 'camera_open',
      title: 'Camera (कैमरा)',
      icon: Camera,
      desc: 'Open device camera',
      action: {
        id: 'qa_cam',
        type: 'browser' as const,
        title: 'Launch Camera App',
        description: 'Launches native camera viewfinder.',
        target: 'android.media.action.STILL_IMAGE_CAMERA',
        payload: { url: 'intent://camera' }
      }
    },
    {
      id: 'maps_open',
      title: 'Google Maps (रास्ता)',
      icon: Navigation,
      desc: 'Open navigation & maps',
      action: {
        id: 'qa_maps',
        type: 'maps' as const,
        title: 'Launch Google Maps',
        description: 'Opens GPS location map.',
        target: 'geo:0,0?q=Current+Location',
        payload: { destination: 'Current Location' }
      }
    },
    {
      id: 'whatsapp_open',
      title: 'WhatsApp',
      icon: MessageCircle,
      desc: 'Open WhatsApp chats',
      action: {
        id: 'qa_wa',
        type: 'browser' as const,
        title: 'Launch WhatsApp',
        description: 'Opens WhatsApp messenger.',
        target: 'com.whatsapp',
        payload: { url: 'https://wa.me/' }
      }
    },
    {
      id: 'youtube_open',
      title: 'YouTube',
      icon: Youtube,
      desc: 'Search & watch videos',
      action: {
        id: 'qa_yt',
        type: 'browser' as const,
        title: 'Launch YouTube App',
        description: 'Opens YouTube video player.',
        target: 'com.google.android.youtube',
        payload: { url: 'https://www.youtube.com' }
      }
    },
    {
      id: 'alarm_set',
      title: 'Alarm / Clock (अलार्म)',
      icon: Clock,
      desc: 'Set wake-up alarm',
      action: {
        id: 'qa_alarm',
        type: 'alarm' as const,
        title: 'Set Clock Alarm (07:00 AM)',
        description: 'Pre-fills alarm in system clock.',
        target: 'Alarm: 07:00 AM',
        payload: { hour: 7, minute: 0, message: 'VOID AI Alarm' }
      }
    },
    {
      id: 'settings_open',
      title: 'Settings (सेटिंग्स)',
      icon: Settings,
      desc: 'WiFi, Bluetooth, Phone',
      action: {
        id: 'qa_settings',
        type: 'browser' as const,
        title: 'Open Android Settings',
        description: 'Opens system device configuration.',
        target: 'android.settings.SETTINGS',
        payload: { url: 'chrome://settings' }
      }
    }
  ];

  const sampleCommands = [
    'Torch chalu karo',
    'Camera kholo',
    'YouTube kholo',
    'Subah 6 baje ka alarm lagao',
    'Delhi ka rasta dikhao',
    'WhatsApp kholo',
    'Dial 9876543210'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0b0b0b] border border-zinc-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white text-black">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Mobile Control Hub (फ़ोन कंट्रोल हब)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Direct native Android intent controls & voice commands
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Control Grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
            Direct Intent Controls (एक टैप में फ़ोन कंट्रोल)
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map(qa => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.id}
                  onClick={() => {
                    onClose();
                    onTriggerAction(qa.action);
                  }}
                  className="p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-600 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="p-1.5 rounded-lg bg-zinc-950 text-white group-hover:bg-white group-hover:text-black transition-colors">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Launch</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{qa.title}</span>
                    <span className="text-[10px] text-zinc-400 block truncate">{qa.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice Commands Section */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
            Voice & Chat Commands (बोलकर या लिखकर कंट्रोल करें)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {sampleCommands.map(cmd => (
              <button
                key={cmd}
                onClick={() => {
                  onClose();
                  onVoiceCommandSample(cmd);
                }}
                className="py-1 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:text-white text-zinc-300 text-xs transition-all cursor-pointer"
              >
                "{cmd}"
              </button>
            ))}
          </div>
        </div>

        {/* Android Platform Security Guarantee */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
          <span className="text-white font-semibold block">Android Safety Architecture:</span>
          <p className="leading-relaxed">
            All phone operations use official Android Intent contracts (`ACTION_DIAL`, `ACTION_SET_ALARM`, `CameraManager Torch`, `ACTION_VIEW`). Every action presents an explicit confirmation with target details before execution.
          </p>
        </div>
      </div>
    </div>
  );
};
