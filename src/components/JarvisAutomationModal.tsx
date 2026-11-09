import React, { useState } from 'react';
import {
  Bot,
  MessageSquare,
  Repeat,
  PhoneOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Play,
  ShieldAlert,
  X,
  Send
} from 'lucide-react';

interface JarvisAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSimulationMessage: (msg: string) => void;
}

export const JarvisAutomationModal: React.FC<JarvisAutomationModalProps> = ({
  isOpen,
  onClose,
  onSendSimulationMessage
}) => {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyPrompt, setAutoReplyPrompt] = useState(
    'Main abhi so raha hoon. VOID AI automated assistant: '
  );
  const [simulatedFriendMsg, setSimulatedFriendMsg] = useState('Bhai jag rha h kya? Urgent kaam tha');
  const [simulatedChatHistory, setSimulatedChatHistory] = useState<Array<{ sender: string; text: string }>>([
    { sender: 'Friend (WhatsApp)', text: 'Bhai jag rha h kya? Urgent kaam tha' },
    {
      sender: 'VOID AI (Auto-Reply)',
      text: 'Main abhi so raha hoon. VOID AI: Dost, message mil gaya hai. Subah call karta hoon ya emergency ho toh call karo!'
    }
  ]);
  const [simulating, setSimulating] = useState(false);

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    if (!simulatedFriendMsg.trim()) return;
    setSimulating(true);

    const newIncoming = { sender: 'Friend (WhatsApp)', text: simulatedFriendMsg };
    setSimulatedChatHistory(prev => [...prev, newIncoming]);

    setTimeout(() => {
      const aiReply = {
        sender: 'VOID AI (Auto-Reply)',
        text: `${autoReplyPrompt} Received: "${simulatedFriendMsg}". The phone owner is asleep and will reply in the morning!`
      };
      setSimulatedChatHistory(prev => [...prev, aiReply]);
      setSimulating(false);
      setSimulatedFriendMsg('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0b0b] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#080808]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white text-black">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <span>Jarvis-Grade Android Automation (जार्विस ऑटोमेशन)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-normal">
                  OS Services Engine
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Background WhatsApp/Instagram Auto-Reply, Call Reject, Reel Gestures & Lock Controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-zinc-300">
          {/* Honest OS Reality Banner */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Android OS Reality vs Jarvis Fantasy (असलियत और नियम)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Android OS की सुरक्षा नीति (Sandboxing) किसी भी ऐप को बिना परमिशन के दूसरे ऐप्स का डेटा पढ़ने या फ़ोन अनलॉक करने की इजाज़त नहीं देती। पर <strong>VOID AI में हमने 2 असली सिस्टम सर्विस तैयार की हैं</strong> जो Android में यह मुमकिन बनाती हैं:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-white font-semibold block">1. NotificationListenerService</span>
                सोते समय WhatsApp / Insta मैसेज को नोटिफिकेशन से पढ़कर AI से रिप्लाई करता है।
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-white font-semibold block">2. AccessibilityService</span>
                Instagram Reels को स्वाइप (gesture scroll) और स्क्रीन लॉक करने की क्षमता।
              </div>
            </div>
          </div>

          {/* Section 1: Background Sleep Auto-Responder */}
          <div className="space-y-3 p-4 rounded-xl bg-[#0e0e0e] border border-zinc-800/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">
                  1. Sleep Auto-Responder (सोते समय WhatsApp / Insta ऑटो-चैट)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReplyEnabled}
                  onChange={e => setAutoReplyEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white peer-checked:after:bg-black"></div>
              </label>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              जब आप सो रहे होंगे, अगर WhatsApp या Instagram पर कोई दोस्त मैसेज करेगा, तो Android RemoteInput के ज़रिए AI अपने आप उसका जवाब दे देगा।
            </p>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Custom Sleep Directive
              </label>
              <input
                type="text"
                value={autoReplyPrompt}
                onChange={e => setAutoReplyPrompt(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
              />
            </div>

            {/* Interactive Simulation Chat Box */}
            <div className="mt-3 p-3 rounded-lg bg-black border border-zinc-800 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                Live Auto-Responder Test (लाइव टेस्ट करके देखें)
              </span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {simulatedChatHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg text-[11px] ${
                      item.sender.includes('Friend')
                        ? 'bg-zinc-900 text-zinc-200'
                        : 'bg-white text-black font-medium'
                    }`}
                  >
                    <span className="block text-[9px] font-bold opacity-75 uppercase mb-0.5">
                      {item.sender}
                    </span>
                    {item.text}
                  </div>
                ))}
                {simulating && (
                  <div className="text-[10px] text-zinc-400 animate-pulse">
                    VOID AI is generating auto-reply...
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={simulatedFriendMsg}
                  onChange={e => setSimulatedFriendMsg(e.target.value)}
                  placeholder="Dost ka test message likhein (e.g. 'Bhai kaha hai?')"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleRunSimulation()}
                />
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={simulating || !simulatedFriendMsg.trim()}
                  className="px-3 py-1.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-zinc-200 cursor-pointer disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Other Jarvis Controls Table */}
          <div className="space-y-3 p-4 rounded-xl bg-[#0e0e0e] border border-zinc-800/90">
            <span className="text-sm font-bold text-white block">
              2. More Jarvis Device Controls (और क्या-क्या कर सकते हैं?)
            </span>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <Repeat className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-bold block text-xs">Instagram Reel Scroll</span>
                  <p className="text-zinc-400 text-[11px]">
                    <code className="text-white">VoidAiAccessibilityService.scrollReelNext()</code> gesture swipe dispatch करता है जिससे बिना हाथ लगाए रील नेक्स्ट हो जाती है।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <PhoneOff className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-bold block text-xs">Call Cut / Reject (कॉल काटना)</span>
                  <p className="text-zinc-400 text-[11px]">
                    <code className="text-white">telecomManager.endCall()</code> (Android 9+) से बोलकर कॉल काटा जा सकता है ("Call cut karo")।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <Lock className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-bold block text-xs">Phone Lock (फ़ोन लॉक करना)</span>
                  <p className="text-zinc-400 text-[11px]">
                    <code className="text-white">performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)</code> से फ़ोन तुरंत लॉक हो जाता है।
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950 border border-red-900/40">
                <Unlock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-red-300 font-bold block text-xs">Phone Unlock Limitation (फ़ोन अनलॉक क्यों नहीं हो सकता?)</span>
                  <p className="text-zinc-400 text-[11px]">
                    Android का <strong>Hardware TEE (Trusted Execution Environment)</strong> किसी भी थर्ड-पार्टी ऐप को बिना यूजर के फिंगरप्रिंट/PIN डाले फोन अनलॉक करने की अनुमति नहीं देता (ताकि कोई भी हैकर या वायरस फोन को अनलॉक न कर सके)।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 flex justify-between items-center bg-[#080808]">
          <span className="text-[11px] text-zinc-400 font-mono">
            Included in /android Kotlin project source
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer"
          >
            Understood (समझ गया)
          </button>
        </div>
      </div>
    </div>
  );
};
