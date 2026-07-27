import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Sparkles, 
  Send, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Trash2, 
  Wand2, 
  Code, 
  Bug, 
  ArrowRight,
  Loader2,
  Cpu,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  Bot,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Command, LogLine } from '../types';

interface CopilotViewProps {
  logs: LogLine[];
  commands: Command[];
  onCreateCommand: (cmd: Omit<Command, 'id'>) => void;
  onAddLog: (newLog: Omit<LogLine, 'id' | 'timestamp'>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  codeSnippet?: {
    trigger: string;
    description: string;
    category: 'Utility' | 'Fun' | 'Moderation' | 'AI' | 'Economy';
    code: string;
  };
}

interface RoomMessage {
  id: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  avatarColor: string;
  isUser?: boolean;
}

export default function CopilotView({ logs, commands, onCreateCommand, onAddLog }: CopilotViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      text: "Welcome to GURU-XD Terminal Copilot V2. I'm connected to the cluster hypervisor via server-side Gemini 3.5 Flash.\n\nI can automatically build custom WhatsApp/Telegram command scripts, diagnose crash dumps, or optimize daemon configs. Try clicking one of the templates below or ask me anything!",
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    }
  ]);
  
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([
    {
      id: 'room-init-1',
      senderName: 'GURU Core',
      senderRole: 'AI Cluster Host',
      text: "Welcome to GURU-XD Team AI Chat Room! I'm GURU Core, your direct interface to the node clusters. Ask any team question here!",
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      avatarColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'room-init-2',
      senderName: 'SpamShield',
      senderRole: 'AI Security Sentinel',
      text: "Standing guard! Safe-link validation engines and participant rate-limiters are primed and secure.",
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      avatarColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'room-init-3',
      senderName: 'FunBot',
      senderRole: 'AI Community Mascot',
      text: "Wazzup operators! Economy ledger is loaded. Type a message or play a quick quiz command here! 🪙🎮",
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      avatarColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'logs' | 'chatroom'>('chat');
  
  // Sandbox Editor State
  const [sandboxCode, setSandboxCode] = useState(`// GURU-XD V2 Hot-deploy sandbox\n// Select a generated prompt template to compose a command.\nmodule.exports = async (client, message, args) => {\n  await message.reply("Hello from V2 sandbox!");\n};`);
  const [sandboxTrigger, setSandboxTrigger] = useState('hello2');
  const [sandboxDesc, setSandboxDesc] = useState('Simulated secondary test command from V2');
  const [sandboxCategory, setSandboxCategory] = useState<'Utility' | 'Fun' | 'Moderation' | 'AI' | 'Economy'>('Utility');
  
  const [copied, setCopied] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, roomMessages, isLoading, activeTab]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sandboxCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAgentClick = (agentName: string) => {
    setInputText(prev => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return `@${agentName} `;
      }
      if (trimmed.startsWith('@')) {
        return trimmed.replace(/^@[A-Za-z0-9_]+\s*/, `@${agentName} `);
      }
      return `@${agentName} ${trimmed}`;
    });
  };

  const handleDeploySandbox = () => {
    if (!sandboxTrigger.trim()) return;

    // Hot deploy
    onCreateCommand({
      trigger: sandboxTrigger.trim(),
      prefix: '.',
      description: sandboxDesc.trim() || 'Custom hot-deployed command script',
      category: sandboxCategory,
      isActive: true,
      code: sandboxCode
    });

    setDeploySuccess(true);
    onAddLog({
      type: 'success',
      source: 'HOT_DEPLOY',
      message: `Hot-loaded Custom V2 Module [.${sandboxTrigger}] directly into the system register.`
    });

    setTimeout(() => setDeploySuccess(false), 3000);
  };

  // Templates list
  const templates = [
    {
      label: 'Build Weather Command',
      prompt: 'Write a JavaScript WhatsApp bot command handler triggered by ".weather <city>" that fetches current weather from a simulated API and formats a gorgeous emoji-rich card response.',
      icon: Wand2
    },
    {
      label: 'Create Anti-Spam Filter',
      prompt: 'Build a group moderation command script triggered by ".spamshield" that detects links containing invite channels and auto-kicks the participant with customized logs.',
      icon: Code
    },
    {
      label: 'Analyze Cluster Logs',
      prompt: 'Review the current active system log lines, analyze failures, identify socket disconnect causes, and suggest the exact configuration corrections to prevent crash state loops.',
      icon: Bug
    },
    {
      label: 'Create Economy Quiz Game',
      prompt: 'Generate an interactive chat trivia mini-game handler triggered by ".quiz" that gives participants coins in our economy ledger database upon answering correct.',
      icon: Cpu
    }
  ];

  const handleSendRoom = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    setIsLoading(true);

    const userMsg: RoomMessage = {
      id: `user-${Date.now()}`,
      senderName: 'You (Admin)',
      senderRole: 'Cluster Operator',
      text: text,
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      avatarColor: 'text-slate-200 bg-slate-900 border-slate-800',
      isUser: true
    };

    setRoomMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Roleplay as 'GURU Core' (the AI Host of GURU-XD WhatsApp/Telegram bot terminal). The user says: "${text}". Give an ultra-brief (maximum 2 sentences) smart systems-level engineer response.` 
        })
      });

      let guruText = "";
      if (response.ok) {
        const data = await response.json();
        guruText = data.response;
      } else {
        throw new Error();
      }

      const guruMsg: RoomMessage = {
        id: `guru-${Date.now()}`,
        senderName: 'GURU Core',
        senderRole: 'AI Cluster Host',
        text: guruText,
        timestamp: new Date().toLocaleTimeString().slice(0, 5),
        avatarColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      };
      setRoomMessages(prev => [...prev, guruMsg]);

      // Then trigger SpamShield after a small timeout
      setTimeout(async () => {
        const shieldResponse = await fetch('/api/copilot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: `Roleplay as 'SpamShield' (the defensive, protective security moderator bot). GURU Core said: "${guruText}". The original user request was: "${text}". Give an ultra-brief 1-sentence funny or informative security-focused reply.` 
          })
        });

        let shieldText = "";
        if (shieldResponse.ok) {
          const data = await shieldResponse.json();
          shieldText = data.response;
        } else {
          shieldText = "Input analysis completed. Anti-packet injection standing by with zero critical alerts! 🛡️";
        }

        const shieldMsg: RoomMessage = {
          id: `shield-${Date.now()}`,
          senderName: 'SpamShield',
          senderRole: 'AI Security Sentinel',
          text: shieldText,
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          avatarColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        };
        setRoomMessages(prev => [...prev, shieldMsg]);

        // Then trigger FunBot
        setTimeout(async () => {
          const funResponse = await fetch('/api/copilot/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: `Roleplay as 'FunBot' (the happy mini-game and meme engine mascot). The user thread discussed: "${text}". Give an ultra-brief high-energy 1-sentence reply with lots of emojis.` 
            })
          });

          let funText = "";
          if (funResponse.ok) {
            const data = await funResponse.json();
            funText = data.response;
          } else {
            funText = "Hype! Let's schedule a chat coin distribution round right now! 🪙✨";
          }

          const funMsg: RoomMessage = {
            id: `fun-${Date.now()}`,
            senderName: 'FunBot',
            senderRole: 'AI Community Mascot',
            text: funText,
            timestamp: new Date().toLocaleTimeString().slice(0, 5),
            avatarColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          };
          setRoomMessages(prev => [...prev, funMsg]);
        }, 600);

      }, 600);

    } catch (e) {
      // Offline fallback
      setTimeout(() => {
        const fallbackGuru: RoomMessage = {
          id: `guru-fallback-${Date.now()}`,
          senderName: 'GURU Core',
          senderRole: 'AI Cluster Host',
          text: `Operator message acknowledged! Initializing sub-modules and thread queues for: "${text}".`,
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          avatarColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
        };
        
        const fallbackShield: RoomMessage = {
          id: `shield-fallback-${Date.now()}`,
          senderName: 'SpamShield',
          senderRole: 'AI Security Sentinel',
          text: `Scan finished: zero malicious scripts or external links identified in query. 🛡️`,
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          avatarColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        };

        const fallbackFun: RoomMessage = {
          id: `fun-fallback-${Date.now()}`,
          senderName: 'FunBot',
          senderRole: 'AI Community Mascot',
          text: `Awesome query! Sounds like a super fun command candidate. Let's make it! 🎉📱`,
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          avatarColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        };

        setRoomMessages(prev => [...prev, fallbackGuru, fallbackShield, fallbackFun]);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    if (activeTab === 'chatroom') {
      handleSendRoom();
      return;
    }

    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // For log-related prompt, we can inject active logs as context
      let contextualPrompt = textToSend;
      if (textToSend.toLowerCase().includes('log') || activeTab === 'logs') {
        const errorLogs = logs.map(l => `[${l.timestamp}] [${l.source}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
        contextualPrompt = `User is asking about system logs. Here is the active terminal log history:\n${errorLogs}\n\nUser Question:\n${textToSend}`;
      }

      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: contextualPrompt })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const botReply = data.response;

      // Extract optional code block if present
      let extractedCode = '';
      let match = botReply.match(/```(?:javascript|js)?([\s\S]*?)```/i);
      if (match && match[1]) {
        extractedCode = match[1].trim();
      }

      // Format custom trigger heuristics
      let triggerWord = 'custom_ai';
      let descText = 'AI Copilot generated command';
      let categoryType: 'Utility' | 'Fun' | 'Moderation' | 'AI' | 'Economy' = 'AI';

      if (textToSend.toLowerCase().includes('weather')) {
        triggerWord = 'weather';
        descText = 'Fetch live weather forecasts for any international city.';
        categoryType = 'Utility';
      } else if (textToSend.toLowerCase().includes('spam') || textToSend.toLowerCase().includes('ban')) {
        triggerWord = 'spamshield';
        descText = 'Hot-reloaded anti-spam invite scanner filter.';
        categoryType = 'Moderation';
      } else if (textToSend.toLowerCase().includes('quiz') || textToSend.toLowerCase().includes('game')) {
        triggerWord = 'quiz';
        descText = 'Start a fast-paced chat trivia game with currency awards.';
        categoryType = 'Economy';
      }

      const botMsgId = `bot-${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: 'assistant',
        text: botReply,
        timestamp: new Date().toLocaleTimeString().slice(0, 5)
      };

      if (extractedCode) {
        botMsg.codeSnippet = {
          trigger: triggerWord,
          description: descText,
          code: extractedCode,
          category: categoryType
        };
        // Prepopulate sandbox with the generated code
        setSandboxCode(extractedCode);
        setSandboxTrigger(triggerWord);
        setSandboxDesc(descText);
        setSandboxCategory(categoryType);
      }

      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error(err);
      // Fallback response
      setTimeout(() => {
        const errorMsg: ChatMessage = {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: `I simulated your request! Since the local environment API keys might be in setup phase, here is a premium V2 simulated response:\n\n### Simulated Command Script Composed\nI have designed a custom script trigger. You can view, edit, and instantly hot-deploy it to the portal state using the **Code Sandbox Panel** on the right!`,
          timestamp: new Date().toLocaleTimeString().slice(0, 5)
        };

        // Inject simulated custom weather snippet
        let simulatedCode = '';
        if (textToSend.toLowerCase().includes('weather')) {
          simulatedCode = `// .weather city command\nconst axios = require("axios");\nmodule.exports = async (client, message, args) => {\n  if (!args.length) return message.reply("Provide a location! e.g. .weather London");\n  const city = args.join(" ");\n  await message.reply(\`🌤️ *Weather for \${city}* 🌤️\\n\\n🌡️ Temperature: 21°C\\n💧 Humidity: 64%\\n💨 Wind: 14 km/h\\n✨ Conditions: Clear Skies\`);\n};`;
          setSandboxCode(simulatedCode);
          setSandboxTrigger('weather');
          setSandboxDesc('Fetch simulated live weather reports.');
          setSandboxCategory('Utility');
        } else if (textToSend.toLowerCase().includes('spam') || textToSend.toLowerCase().includes('shield')) {
          simulatedCode = `// .spamshield moderation\nmodule.exports = async (client, message) => {\n  if (message.body.includes("t.me/") || message.body.includes("chat.whatsapp.com")) {\n    await client.sendMessage(message.from, "🚫 Links are prohibited in this channel.");\n    await client.groupParticipantsUpdate(message.from, [message.sender], "remove");\n  }\n};`;
          setSandboxCode(simulatedCode);
          setSandboxTrigger('spamshield');
          setSandboxDesc('Anti-spam advertisement invite block filter.');
          setSandboxCategory('Moderation');
        } else {
          simulatedCode = `// AI Copilot V2 generated script\nmodule.exports = async (client, message, args) => {\n  const promptText = args.join(" ");\n  await message.reply(\`🤖 Response to prompt "\${promptText}"\`);\n};`;
          setSandboxCode(simulatedCode);
          setSandboxTrigger('ai_response');
          setSandboxDesc('V2 AI custom message responder.');
          setSandboxCategory('AI');
        }

        setMessages(prev => [...prev, errorMsg]);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold bg-blue-500/15 border border-blue-500/20 px-2 py-0.5 rounded-md text-blue-400">V2 AI Release</span>
            <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
              <span>AI Chat & Copilot Hub</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'chatroom' 
              ? 'Multi-agent developer room. Chat live with Core GURU, Security, and Economy agents simultaneously.'
              : 'Chat in real-time with our server-side system model. Auto-generate bot code handlers, diagnose logs, and hot-deploy systems.'
            }
          </p>
        </div>

        {/* View mode buttons */}
        <div className="flex border border-slate-900 bg-slate-950/40 rounded-xl p-1 shrink-0 self-start">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${activeTab === 'chat' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Copilot Chat
          </button>
          
          <button 
            onClick={() => setActiveTab('chatroom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${activeTab === 'chatroom' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Chat Room</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('logs');
              handleSend("Analyze my live server console logs for warnings or errors.");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'logs' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Diagnostics</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Stream (Span 7) */}
        <div className="lg:col-span-7 bg-slate-950/20 border border-slate-900 rounded-xl flex flex-col h-[calc(100vh-240px)] min-h-[520px] max-h-[720px] overflow-hidden">
          
          {/* Header indicator for active chat mode */}
          <div className="px-6 py-3 border-b border-slate-900/60 bg-slate-950/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-400 uppercase">
                {activeTab === 'chatroom' ? 'ACTIVE MULTI-AGENT GROUP CHANNEL' : activeTab === 'logs' ? 'DIAGNOSTIC ENGINE CONSOLE' : 'TERMINAL DIRECT LINK'}
              </span>
            </div>
            {activeTab === 'chatroom' && (
              <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                3 AGENTS CONCURRENT
              </span>
            )}
          </div>

          {/* Interactive Agent status panel for Chat Room */}
          {activeTab === 'chatroom' && (
            <div className="px-6 py-2.5 border-b border-slate-900/40 bg-slate-950/10 grid grid-cols-3 gap-2 shrink-0">
              <div 
                onClick={() => handleAgentClick('GURU Core')}
                className="bg-slate-950/40 border border-slate-900/80 rounded-lg p-2 flex items-center gap-2 hover:border-blue-500/30 transition-all cursor-pointer group"
                title="Click to address GURU Core"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] font-mono font-bold text-slate-300 group-hover:text-blue-400 transition-colors">GURU Core</div>
                  <div className="text-[8px] text-slate-500 truncate">Host | 12ms ping</div>
                </div>
              </div>
              <div 
                onClick={() => handleAgentClick('SpamShield')}
                className="bg-slate-950/40 border border-slate-900/80 rounded-lg p-2 flex items-center gap-2 hover:border-amber-500/30 transition-all cursor-pointer group"
                title="Click to address SpamShield"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] font-mono font-bold text-slate-300 group-hover:text-amber-400 transition-colors">SpamShield</div>
                  <div className="text-[8px] text-slate-500 truncate">Sentinel | Guarding</div>
                </div>
              </div>
              <div 
                onClick={() => handleAgentClick('FunBot')}
                className="bg-slate-950/40 border border-slate-900/80 rounded-lg p-2 flex items-center gap-2 hover:border-emerald-500/30 transition-all cursor-pointer group"
                title="Click to address FunBot"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] font-mono font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">FunBot</div>
                  <div className="text-[8px] text-slate-500 truncate">Mascot | Active</div>
                </div>
              </div>
            </div>
          )}

          {/* Messages block */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
            <AnimatePresence initial={false}>
              {activeTab === 'chatroom' ? (
                // AI Chat Room Renderer
                roomMessages.map((msg) => {
                  const isUser = msg.isUser;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 max-w-[85%] ${isUser ? 'self-end flex-row-reverse ml-auto' : 'self-start'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 border text-[10px] font-bold ${msg.avatarColor}`}>
                        {msg.senderName.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-300">{msg.senderName}</span>
                          <span className="text-[8px] font-mono text-slate-500 uppercase">[{msg.senderRole}]</span>
                        </div>
                        {/* Message Bubble */}
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-normal break-words ${isUser ? 'bg-blue-600 text-white font-mono' : 'bg-slate-950/60 border border-slate-900 text-slate-300'}`}>
                          {isUser ? (
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                          ) : (
                            <div className="markdown-body">
                              <Markdown
                                components={{
                                  h1: ({children}) => <h1 className="text-sm font-bold text-slate-100 my-1">{children}</h1>,
                                  h2: ({children}) => <h2 className="text-xs font-bold text-slate-200 my-1">{children}</h2>,
                                  h3: ({children}) => <h3 className="text-xs font-bold text-slate-200 my-1">{children}</h3>,
                                  p: ({children}) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
                                  ul: ({children}) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                                  ol: ({children}) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                                  li: ({children}) => <li className="text-[11px] text-slate-300">{children}</li>,
                                  code: ({children, className}) => {
                                    const isInline = !className;
                                    return isInline ? (
                                      <code className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 font-mono text-[10px] text-amber-300">{children}</code>
                                    ) : (
                                      <pre className="bg-slate-950/80 border border-slate-900 rounded-lg p-2.5 my-2 overflow-x-auto font-mono text-[10px] text-emerald-400 leading-tight select-all max-w-full scrollbar-thin">
                                        <code>{children}</code>
                                      </pre>
                                    );
                                  }
                                }}
                              >
                                {msg.text}
                              </Markdown>
                            </div>
                          )}
                        </div>
                        <span className={`text-[8px] font-mono text-slate-600 block ${isUser ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                // Standard Copilot Chat Renderer
                messages.map((msg) => {
                  const isBot = msg.sender === 'assistant';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 max-w-[85%] ${isBot ? 'self-start' : 'self-end flex-row-reverse ml-auto'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isBot ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                        {isBot ? <Sparkles className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                      </div>

                      <div className="space-y-1.5">
                        {/* Message Bubble */}
                        <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-normal break-words ${isBot ? 'bg-slate-950/60 border border-slate-900 text-slate-300' : 'bg-blue-600 text-white font-mono'}`}>
                          {!isBot ? (
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                          ) : (
                            <div className="markdown-body">
                              <Markdown
                                components={{
                                  h1: ({children}) => <h1 className="text-sm font-bold text-slate-100 my-1">{children}</h1>,
                                  h2: ({children}) => <h2 className="text-xs font-bold text-slate-200 my-1">{children}</h2>,
                                  h3: ({children}) => <h3 className="text-xs font-bold text-slate-200 my-1">{children}</h3>,
                                  p: ({children}) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
                                  ul: ({children}) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                                  ol: ({children}) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                                  li: ({children}) => <li className="text-[11px] text-slate-300">{children}</li>,
                                  code: ({children, className}) => {
                                    const isInline = !className;
                                    return isInline ? (
                                      <code className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 font-mono text-[10px] text-amber-300">{children}</code>
                                    ) : (
                                      <pre className="bg-slate-950/80 border border-slate-900 rounded-lg p-2.5 my-2 overflow-x-auto font-mono text-[10px] text-emerald-400 leading-tight select-all max-w-full scrollbar-thin">
                                        <code>{children}</code>
                                      </pre>
                                    );
                                  }
                                }}
                              >
                                {msg.text}
                              </Markdown>
                            </div>
                          )}

                          {/* Interactive deployment prompt inside chat bubble if code generated */}
                          {isBot && msg.codeSnippet && (
                            <div className="mt-4 p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                                  <Code className="w-3.5 h-3.5" />
                                  <span>Code Generated: .{msg.codeSnippet.trigger}</span>
                                </span>
                                <span className="text-[9px] text-slate-500 uppercase">{msg.codeSnippet.category}</span>
                              </div>
                              <p className="text-[10px] text-slate-400">{msg.codeSnippet.description}</p>
                              <button
                                onClick={() => {
                                  if (msg.codeSnippet) {
                                    setSandboxCode(msg.codeSnippet.code);
                                    setSandboxTrigger(msg.codeSnippet.trigger);
                                    setSandboxDesc(msg.codeSnippet.description);
                                    setSandboxCategory(msg.codeSnippet.category);
                                  }
                                }}
                                className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 hover:text-blue-300 text-[10px] py-1.5 rounded-lg font-mono transition-all flex items-center justify-center gap-1"
                              >
                                <span>Send Code to Sandbox</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <span className={`text-[9px] font-mono text-slate-600 block ${isBot ? 'text-left' : 'text-right'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] self-start">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center animate-spin">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="bg-slate-950/40 border border-slate-900/60 p-4 rounded-2xl text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>
                    {activeTab === 'chatroom' 
                      ? 'Compiling sequential bot dialogue...' 
                      : 'Streaming hypervisor logic via Gemini...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick chips templates */}
          {activeTab !== 'chatroom' && (
            <div className="p-4 border-t border-slate-900 bg-slate-950/40 flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
              {templates.map((temp, index) => {
                const Icon = temp.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSend(temp.prompt)}
                    className="flex items-center gap-2 border border-slate-900 bg-slate-950 hover:bg-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    <Icon className="w-3 h-3 text-blue-400" />
                    <span>{temp.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Input control form */}
          <div className="p-4 border-t border-slate-900 bg-slate-950/80">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeTab === 'chatroom' 
                    ? "Send a group prompt to Core, Security and FunBot..." 
                    : activeTab === 'logs' 
                    ? "Ask about errors, failures, or socket logs..." 
                    : "Ask Gemini to generate WhatsApp code, fix command bugs..."
                }
                disabled={isLoading}
                className="flex-1 bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none placeholder-slate-500 font-mono"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white p-3 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sandbox deployer (Span 5) */}
        <div className="lg:col-span-5 bg-slate-950/20 border border-slate-900 rounded-xl p-6 flex flex-col h-[calc(100vh-240px)] min-h-[520px] max-h-[720px]">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Title header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Command Code Sandbox</h3>
                  <p className="text-[10px] text-slate-500">Edit and hot-compile compiled handlers.</p>
                </div>
              </div>

              {/* Status or Action */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleCopyCode}
                  className="p-1.5 rounded hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Copy module code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Sandbox input controls */}
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="space-y-1">
                <span className="text-slate-500 text-[9px] uppercase font-sans">Trigger Word</span>
                <div className="flex items-center">
                  <span className="text-slate-600 mr-1 font-bold">.</span>
                  <input 
                    type="text" 
                    value={sandboxTrigger}
                    onChange={(e) => setSandboxTrigger(e.target.value.toLowerCase().replace(/[^a-z0-9_]/gi, ''))}
                    placeholder="help"
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[9px] uppercase font-sans">Category Group</span>
                <select 
                  value={sandboxCategory}
                  onChange={(e) => setSandboxCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2 text-slate-300 focus:outline-none text-[11px]"
                >
                  <option value="Utility">Utility</option>
                  <option value="Fun">Fun</option>
                  <option value="Moderation">Moderation</option>
                  <option value="AI">AI</option>
                  <option value="Economy">Economy</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <span className="text-slate-500 text-[9px] uppercase font-sans">Index Command Description</span>
              <input 
                type="text" 
                value={sandboxDesc}
                onChange={(e) => setSandboxDesc(e.target.value)}
                placeholder="Brief summary displayed in help index"
                className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2 text-slate-300 focus:outline-none text-[11px]"
              />
            </div>

            {/* Main Code Editor */}
            <div className="flex-1 flex flex-col min-h-0">
              <span className="text-slate-500 text-[9px] uppercase font-sans mb-1 font-mono">Handler Logic JavaScript (Module)</span>
              <textarea
                value={sandboxCode}
                onChange={(e) => setSandboxCode(e.target.value)}
                className="flex-1 w-full bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-[11px] text-blue-300 focus:outline-none resize-none scrollbar-thin overflow-y-auto leading-relaxed"
                style={{ tabSize: 2 }}
              />
            </div>
          </div>

          {/* Action deployment */}
          <div className="pt-4 border-t border-slate-900">
            <button
              onClick={handleDeploySandbox}
              disabled={deploySuccess}
              className={`w-full text-xs font-semibold py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
                deploySuccess 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
              }`}
            >
              {deploySuccess ? (
                <>
                  <Check className="w-4 h-4 text-white animate-bounce" />
                  <span>HOT DEPLOYMENT SUCCESSFUL!</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Deploy Command to Active Registry</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-2">Compiled bytecode will be injected into running node clusters immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
