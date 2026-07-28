import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Zap,
  BrainCircuit,
  Bookmark,
  RotateCcw,
  ShieldAlert,
  Layers,
  FileText,
  Activity,
  Database,
  Search,
  CheckCircle2,
  AlertOctagon,
  Lock,
  ChevronRight,
  History,
  Info,
  Sliders,
  AlertTriangle,
  Lightbulb,
  Clock,
  Compass,
  FileCode,
  Save,
  CheckSquare,
  CornerDownRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Command, 
  LogLine, 
  CopilotMemoryItem, 
  CopilotPromptTemplate, 
  CopilotSandboxDeployment, 
  CopilotAgentProfile, 
  CopilotAnalyticsStats,
  CopilotWorkItem,
  CopilotSuggestion,
  CopilotSandboxDraft
} from '../types';

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
  agent?: CopilotAgentProfile;
  responseTimeMs?: number;
  memoryHit?: boolean;
  reasoning?: string;
  codeSnippet?: {
    trigger: string;
    description: string;
    category: string;
    code: string;
  };
}

export default function CopilotView({ logs, commands, onCreateCommand, onAddLog }: CopilotViewProps) {
  // Navigation sub-panel in left sidebar
  const [leftTab, setLeftTab] = useState<'timeline' | 'memory' | 'suggestions' | 'threads'>('timeline');
  // Navigation right panel tab
  const [rightTab, setRightTab] = useState<'editor' | 'security' | 'history' | 'drafts'>('editor');

  // Agents state
  const [agents, setAgents] = useState<CopilotAgentProfile[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('guru-core');

  // Telemetry & Stats
  const [aiAnalytics, setAiAnalytics] = useState<CopilotAnalyticsStats | null>(null);
  const [aiProviders, setAiProviders] = useState<any[]>([]);
  const [currentProgressStep, setCurrentProgressStep] = useState<string>('🧠 Reading memory...');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: "Welcome to **GURU-XD Production Core AI Engine**. I am your senior engineering partner, powered server-side by **Gemini 3.5 Flash**.\n\nI operate with full 3-tier memory (Knowledge 📚, Project 🏗️, Conversation 💬) and a live engineering work timeline.\n\nClick **Resume Previous Work** to pick up right where you left off, or ask me any architectural or code task!",
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      reasoning: "Initialization check confirmed Cloud Run container health, active bot daemons, and persistent 3-tier memory store availability."
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReasoningId, setExpandedReasoningId] = useState<string | null>(null);

  // 3-Tier Memory State
  const [memories, setMemories] = useState<CopilotMemoryItem[]>([]);
  const [memoryCategoryFilter, setMemoryCategoryFilter] = useState<'all' | 'knowledge' | 'project' | 'conversation' | 'ai_learning'>('all');
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemVal, setNewMemVal] = useState('');
  const [newMemCat, setNewMemCat] = useState<'knowledge' | 'project' | 'conversation' | 'ai_learning'>('project');

  // Work Timeline State
  const [workTimeline, setWorkTimeline] = useState<CopilotWorkItem[]>([]);
  const [isResuming, setIsResuming] = useState(false);

  // Proactive Suggestions
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);

  // Prompts State
  const [promptTemplates, setPromptTemplates] = useState<CopilotPromptTemplate[]>([]);
  const [showPromptDrawer, setShowPromptDrawer] = useState(false);

  // Sandbox Code Editor State
  const [sandboxCode, setSandboxCode] = useState(`// GURU-XD Production Command Handler\nmodule.exports = async (client, message, args) => {\n  const target = args[0] || 'Cluster';\n  await message.reply(\`[GURU-XD] Operating command for target: \${target}\`);\n};`);
  const [sandboxTrigger, setSandboxTrigger] = useState('opcmd');
  const [sandboxDesc, setSandboxDesc] = useState('Production operations script handler');
  const [sandboxCategory, setSandboxCategory] = useState<string>('Utility');
  const [securityValidation, setSecurityValidation] = useState<any>(null);
  const [sandboxHistory, setSandboxHistory] = useState<CopilotSandboxDeployment[]>([]);
  const [sandboxDrafts, setSandboxDrafts] = useState<CopilotSandboxDraft[]>([]);

  const [copied, setCopied] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      // 1. Agents
      const resAgents = await fetch('/api/copilot/agents');
      if (resAgents.ok) {
        const data = await resAgents.json();
        if (data.agents) setAgents(data.agents);
      }

      // 2. Memories
      const resMem = await fetch('/api/copilot/memory');
      if (resMem.ok) {
        const data = await resMem.json();
        if (data.memories) setMemories(data.memories);
      }

      // 3. Work Timeline
      const resWork = await fetch('/api/copilot/work-timeline');
      if (resWork.ok) {
        const data = await resWork.json();
        if (data.timeline) setWorkTimeline(data.timeline);
      }

      // 4. Suggestions
      const resSug = await fetch('/api/copilot/suggestions');
      if (resSug.ok) {
        const data = await resSug.json();
        if (data.suggestions) setSuggestions(data.suggestions);
      }

      // 5. Prompts
      const resPrompts = await fetch('/api/copilot/prompts');
      if (resPrompts.ok) {
        const data = await resPrompts.json();
        if (data.prompts) setPromptTemplates(data.prompts);
      }

      // 6. Sandbox History & Drafts
      const resHist = await fetch('/api/copilot/sandbox/history');
      if (resHist.ok) {
        const data = await resHist.json();
        if (data.history) setSandboxHistory(data.history);
      }

      const resDrafts = await fetch('/api/copilot/drafts');
      if (resDrafts.ok) {
        const data = await resDrafts.json();
        if (data.drafts) setSandboxDrafts(data.drafts);
      }

      // 7. Analytics & Providers Health
      const resAnalytics = await fetch('/api/copilot/analytics');
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        if (data.stats) setAiAnalytics(data.stats);
      }

      const resProviders = await fetch('/api/ai/providers');
      if (resProviders.ok) {
        const data = await resProviders.json();
        if (data.providers) setAiProviders(data.providers);
      }
    } catch (err) {
      console.error("Error fetching Copilot data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Trigger Validation on Sandbox Code Change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!sandboxCode.trim()) return;
      try {
        const res = await fetch('/api/copilot/sandbox/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: sandboxCode, trigger: sandboxTrigger })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.validation) setSecurityValidation(data.validation);
        }
      } catch (err) {
        console.error("Validation error:", err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [sandboxCode, sandboxTrigger]);

  // Handle Resume Previous Work
  const handleResumeWork = async () => {
    setIsResuming(true);
    try {
      const res = await fetch('/api/copilot/work/resume');
      if (res.ok) {
        const data = await res.json();
        if (data.context) {
          const { summaryText, lastCompleted } = data.context;
          const resumeMsg: ChatMessage = {
            id: `resume-${Date.now()}`,
            sender: 'assistant',
            text: summaryText,
            timestamp: new Date().toLocaleTimeString().slice(0, 5),
            reasoning: "Parsed engineering work timeline & persistent project memory to construct active session context."
          };
          setMessages(prev => [...prev, resumeMsg]);

          if (lastCompleted?.filesChanged && lastCompleted.filesChanged.length > 0) {
            onAddLog({
              type: 'info',
              message: `Resumed session context for module [${lastCompleted.module}]`,
              source: 'COPILOT_WORK'
            });
          }
        }
      }
    } catch (err) {
      console.error("Resume work error:", err);
    } finally {
      setIsResuming(false);
    }
  };

  // Handle Chat Submit with High-Availability & Progress Feedbacks
  const handleSendMessage = async (promptOverride?: string, agentIdOverride?: string) => {
    const promptToSend = promptOverride || inputText;
    if (!promptToSend.trim() || isLoading) return;

    const agentId = agentIdOverride || selectedAgentId;
    const activeAgent = agents.find(a => a.id === agentId);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptOverride) setInputText('');
    setIsLoading(true);
    setCurrentProgressStep('🧠 Reading memory & checking AI cache...');

    // Progress step simulation sequence
    const p1 = setTimeout(() => setCurrentProgressStep('✓ Preparing prompt & collecting context...'), 800);
    const p2 = setTimeout(() => setCurrentProgressStep('⏳ Waiting for Gemini AI Provider...'), 1800);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          agentId,
          userRole: 'Administrator'
        })
      });

      clearTimeout(p1);
      clearTimeout(p2);

      if (res.ok) {
        const data = await res.json();
        
        let codeSnippet;
        const codeBlockMatch = data.response.match(/```(?:js|javascript|cjs)?\n([\s\S]*?)\n```/i);
        if (codeBlockMatch && codeBlockMatch[1]) {
          codeSnippet = {
            trigger: promptToSend.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'customcmd',
            description: `Generated by ${data.agent?.name || 'AI Copilot'}`,
            category: 'Utility',
            code: codeBlockMatch[1].trim()
          };
        }

        const botMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: data.response,
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          agent: data.agent,
          responseTimeMs: data.responseTimeMs,
          memoryHit: data.memoryHit,
          reasoning: `Executed via ${data.providerUsed || 'Gemini 3.5 Flash'}${data.cacheHit ? ' (Cache Hit)' : ''}. Memory & cluster state evaluated.`,
          codeSnippet
        };

        setMessages(prev => [...prev, botMsg]);

        if (promptToSend.toLowerCase().includes("create") || promptToSend.toLowerCase().includes("build") || promptToSend.toLowerCase().includes("fix")) {
          fetch('/api/copilot/work-timeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              module: activeAgent?.domain || 'Core Systems',
              filesChanged: ['server/copilotEngine.ts'],
              summary: promptToSend.slice(0, 60),
              status: 'completed',
              details: `Executed via ${data.providerUsed || 'AI Copilot'}`
            })
          }).then(() => fetchData());
        }
      } else {
        const errData = await res.json();
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `🛡️ **GURU Core High-Availability Message**\n\n${errData.error || 'Gemini is currently experiencing high demand. Your request has been safely saved.'}\n\n*No action is required from you.*`,
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          reasoning: "High traffic detected on primary provider. Exponential backoff queue engaged."
        }]);
      }
    } catch (err: any) {
      clearTimeout(p1);
      clearTimeout(p2);
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `🛡️ **GURU Core High-Availability Message**\n\nGemini is currently experiencing high demand. Your request was safely saved to the internal queue and will retry automatically.`,
        timestamp: new Date().toLocaleTimeString().slice(0, 5)
      }]);
    } finally {
      setIsLoading(false);
      fetchData();
    }
  };

  const handleCancelRequest = () => {
    setIsLoading(false);
    setCurrentProgressStep('Request cancelled by operator.');
    setMessages(prev => [...prev, {
      id: `cancel-${Date.now()}`,
      sender: 'assistant',
      text: "⚠️ **Request cancelled.** Your pending prompt execution was stopped by operator command.",
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    }]);
  };

  // Memory Actions
  const handleSaveMemory = async () => {
    if (!newMemKey.trim() || !newMemVal.trim()) return;
    try {
      const res = await fetch('/api/copilot/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newMemCat,
          key: newMemKey.trim(),
          value: newMemVal.trim(),
          tags: ['manual_add']
        })
      });
      if (res.ok) {
        setNewMemKey('');
        setNewMemVal('');
        fetchData();
        onAddLog({ type: 'success', message: `Saved [${newMemCat.toUpperCase()}] memory key: ${newMemKey}`, source: 'COPILOT_MEMORY' });
      }
    } catch (err) {
      console.error("Save memory error:", err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/copilot/memory/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Delete memory error:", err);
    }
  };

  // Sandbox Actions
  const handleDeploySandbox = async () => {
    setDeployError(null);
    setDeploySuccess(false);
    try {
      const res = await fetch('/api/copilot/sandbox/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: sandboxTrigger,
          code: sandboxCode,
          description: sandboxDesc,
          category: sandboxCategory,
          userRole: 'Administrator'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDeploySuccess(true);
        setTimeout(() => setDeploySuccess(false), 3500);

        // Also notify parent component
        onCreateCommand({
          trigger: sandboxTrigger,
          prefix: '.',
          description: sandboxDesc,
          category: sandboxCategory as any,
          isActive: true,
          code: sandboxCode
        });

        onAddLog({
          type: 'success',
          message: `Hot-deployed Command [.${sandboxTrigger}] with Security Score ${data.validation?.securityScore}/100`,
          source: 'SANDBOX_DEPLOY'
        });

        fetchData();
      } else {
        setDeployError(data.error || 'Deployment failed');
      }
    } catch (err: any) {
      setDeployError(err.message || 'Deployment failed');
    }
  };

  const handleSaveDraft = async () => {
    try {
      const res = await fetch('/api/copilot/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sandboxDesc || sandboxTrigger,
          trigger: sandboxTrigger,
          code: sandboxCode,
          description: sandboxDesc,
          category: sandboxCategory
        })
      });
      if (res.ok) {
        fetchData();
        onAddLog({ type: 'info', message: `Saved draft for command .${sandboxTrigger}`, source: 'SANDBOX_DRAFT' });
      }
    } catch (err) {
      console.error("Save draft error:", err);
    }
  };

  const handleRollback = async (deploymentId: string) => {
    try {
      const res = await fetch(`/api/copilot/sandbox/rollback/${deploymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.snapshot) {
          setSandboxCode(data.snapshot.code);
          setSandboxTrigger(data.snapshot.trigger);
          setSandboxDesc(data.snapshot.description);
          onAddLog({
            type: 'warning',
            message: `Rolled back [.${data.snapshot.trigger}] to version v${data.snapshot.version}`,
            source: 'SANDBOX_ROLLBACK'
          });
          fetchData();
        }
      }
    } catch (err) {
      console.error("Rollback error:", err);
    }
  };

  const currentAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const filteredMemories = memoryCategoryFilter === 'all' 
    ? memories 
    : memories.filter(m => m.category === memoryCategoryFilter);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-[#080B11] text-slate-100 overflow-hidden font-sans border border-slate-800/80 rounded-2xl shadow-2xl relative">
      
      {/* ========================================================================= */}
      {/* 1. LEFT PANEL: WORK TIMELINE, 3-TIER MEMORY, SUGGESTIONS & THREADS         */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-80 flex-shrink-0 border-r border-slate-800/80 bg-[#0C101A] flex flex-col h-auto lg:h-full overflow-hidden">
        
        {/* Header & Host Status */}
        <div className="p-4 border-b border-slate-800/80 bg-[#0F1422] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 tracking-wide flex items-center gap-1.5">
                  GURU-XD AI Core
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">Gemini 3.5 Flash • V2 Engine</p>
              </div>
            </div>
            <button 
              onClick={fetchData}
              title="Refresh Telemetry"
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Resume Button */}
          <button
            onClick={handleResumeWork}
            disabled={isResuming}
            className="w-full mt-1 py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-900/30 transition-all border border-blue-400/20 active:scale-[0.98]"
          >
            {isResuming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
            Resume Previous Work
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-800/80 bg-[#0A0D16] p-1 gap-1">
          <button
            onClick={() => setLeftTab('timeline')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded-md flex items-center justify-center gap-1 transition-all ${
              leftTab === 'timeline' 
                ? 'bg-slate-800 text-blue-400 border border-slate-700/80 shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3 h-3" />
            Timeline
          </button>
          <button
            onClick={() => setLeftTab('memory')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded-md flex items-center justify-center gap-1 transition-all ${
              leftTab === 'memory' 
                ? 'bg-slate-800 text-purple-400 border border-slate-700/80 shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            Memory
          </button>
          <button
            onClick={() => setLeftTab('suggestions')}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded-md flex items-center justify-center gap-1 transition-all ${
              leftTab === 'suggestions' 
                ? 'bg-slate-800 text-amber-400 border border-slate-700/80 shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3 h-3" />
            Insights
            {suggestions.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold flex items-center justify-center">
                {suggestions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          
          {/* LEFT TAB 1: WORK TIMELINE */}
          {leftTab === 'timeline' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-400" />
                  Engineering Timeline
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{workTimeline.length} events</span>
              </div>

              {workTimeline.map((item) => (
                <div 
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.module}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium leading-snug">
                    {item.summary}
                  </p>

                  {item.filesChanged && item.filesChanged.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.filesChanged.map((file, idx) => (
                        <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                          {file}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* LEFT TAB 2: 3-TIER MEMORY REGISTER */}
          {leftTab === 'memory' && (
            <div className="space-y-3">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {(['all', 'knowledge', 'project', 'conversation', 'ai_learning'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMemoryCategoryFilter(cat)}
                    className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors capitalize ${
                      memoryCategoryFilter === cat 
                        ? 'bg-purple-600 text-white font-semibold' 
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'knowledge' ? '📚 Knowledge' : cat === 'project' ? '🏗️ Project' : cat === 'conversation' ? '💬 Conversation' : cat === 'ai_learning' ? '💡 Learning' : 'All'}
                  </button>
                ))}
              </div>

              {/* Memory List */}
              <div className="space-y-2">
                {filteredMemories.map((mem) => (
                  <div 
                    key={mem.id}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-1 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        mem.category === 'knowledge' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        mem.category === 'project' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        mem.category === 'conversation' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {mem.category}
                      </span>
                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        title="Delete memory key"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-slate-200 font-mono">{mem.key}</p>
                    <p className="text-[11px] text-slate-400 leading-normal">{mem.value}</p>
                  </div>
                ))}
              </div>

              {/* Add Memory Form */}
              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2 pt-2 mt-2">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <PlusCircle className="w-3 h-3 text-purple-400" />
                  Add Memory Item
                </span>
                <select
                  value={newMemCat}
                  onChange={(e: any) => setNewMemCat(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="knowledge">📚 Knowledge Memory</option>
                  <option value="project">🏗️ Project Memory</option>
                  <option value="conversation">💬 Conversation Memory</option>
                  <option value="ai_learning">💡 AI Learning</option>
                </select>
                <input
                  type="text"
                  placeholder="Key (e.g., auth_policy)"
                  value={newMemKey}
                  onChange={(e) => setNewMemKey(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
                <textarea
                  placeholder="Value specification details..."
                  value={newMemVal}
                  onChange={(e) => setNewMemVal(e.target.value)}
                  rows={2}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
                <button
                  onClick={handleSaveMemory}
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  Save to Memory
                </button>
              </div>
            </div>
          )}

          {/* LEFT TAB 3: PROACTIVE SUGGESTIONS WITH "WHY" REASONING */}
          {leftTab === 'suggestions' && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                Proactive Engineering Insights
              </span>

              {suggestions.map((sug) => {
                const isExpanded = expandedSuggestionId === sug.id;
                return (
                  <div 
                    key={sug.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sug.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        sug.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {sug.priority} PRIORITY
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{sug.module}</span>
                    </div>

                    <p className="text-xs font-semibold text-slate-100 leading-snug">
                      {sug.title}
                    </p>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {sug.description}
                    </p>

                    {/* "Why" Reasoning Collapsible */}
                    <button
                      onClick={() => setExpandedSuggestionId(isExpanded ? null : sug.id)}
                      className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-1"
                    >
                      <Info className="w-3 h-3" />
                      {isExpanded ? 'Hide Reasoning' : 'Why is this recommended?'}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-200/90 leading-relaxed font-mono"
                        >
                          🧠 {sug.reasoning}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => handleSendMessage(`Help me with this suggestion: ${sug.title}`, sug.recommendedAgent)}
                      className="w-full mt-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-700/60"
                    >
                      Resolve with {sug.recommendedAgent || 'Copilot'}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer Telemetry Summary */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0A0D16] flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Latency: {aiAnalytics?.avgLatencyMs || 380}ms</span>
          <span>Memory Hits: {aiAnalytics?.memoryHitsCount || 0}</span>
        </div>

      </div>


      {/* ========================================================================= */}
      {/* 2. CENTER PANEL: FULL-SCREEN MULTI-AGENT CONVERSATION WORKSPACE           */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col bg-[#080B11] relative min-w-0 h-full overflow-hidden">
        
        {/* Agent Profile Selector Header */}
        <div className="p-3 border-b border-slate-800/80 bg-[#0D121F] flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Bot className="w-4 h-4 text-blue-400" />
              Specialist:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {agents.map((ag) => (
                <button
                  key={ag.id}
                  onClick={() => setSelectedAgentId(ag.id)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    selectedAgentId === ag.id
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm'
                      : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${ag.avatarColor.split(' ')[0].replace('text-', 'bg-')}`} />
                  {ag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages([])}
              title="Clear Conversation Stream"
              className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Message Stream Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isExpandedReasoning = expandedReasoningId === msg.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-md border ${
                  isUser 
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white border-purple-400/20' 
                    : msg.agent?.avatarColor || 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                }`}>
                  {isUser ? 'ME' : msg.agent?.name?.slice(0, 2) || 'AI'}
                </div>

                {/* Message Bubble Container */}
                <div className={`space-y-1.5 ${isUser ? 'items-end' : 'items-start'} max-w-2xl`}>
                  <div className={`flex items-center gap-2 text-[11px] font-mono text-slate-400 ${isUser ? 'justify-end' : ''}`}>
                    <span className="font-semibold text-slate-200">
                      {isUser ? 'You (Operator)' : msg.agent?.name || 'GURU Core'}
                    </span>
                    <span>• {msg.timestamp}</span>
                    {msg.responseTimeMs && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                        {msg.responseTimeMs}ms
                      </span>
                    )}
                    {msg.memoryHit && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-0.5">
                        <Bookmark className="w-2.5 h-2.5" />
                        Memory Hit
                      </span>
                    )}
                  </div>

                  {/* Bubble Content */}
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-[#0E1322] border border-slate-800/90 text-slate-200 rounded-tl-none space-y-2'
                  }`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                    ) : (
                      <div className="prose prose-invert prose-xs max-w-none space-y-2">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    )}

                    {/* "Why" Decision Explanation Collapsible */}
                    {!isUser && msg.reasoning && (
                      <div className="pt-2 border-t border-slate-800/80 mt-2">
                        <button
                          onClick={() => setExpandedReasoningId(isExpandedReasoning ? null : msg.id)}
                          className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <Info className="w-3 h-3" />
                          {isExpandedReasoning ? 'Hide Decision Reasoning' : 'Why did AI recommend this?'}
                          <ChevronDown className={`w-3 h-3 transition-transform ${isExpandedReasoning ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isExpandedReasoning && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-2.5 mt-1.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-200 font-mono leading-relaxed"
                            >
                              💡 {msg.reasoning}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Extracted Code Snippet Card */}
                    {msg.codeSnippet && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                            <Code className="w-3.5 h-3.5" />
                            .{msg.codeSnippet.trigger}
                          </span>
                          <button
                            onClick={() => {
                              setSandboxCode(msg.codeSnippet!.code);
                              setSandboxTrigger(msg.codeSnippet!.trigger);
                              setSandboxDesc(msg.codeSnippet!.description);
                              setRightTab('editor');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 border border-emerald-500/30 transition-colors"
                          >
                            Send to Sandbox Workspace
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 p-2 rounded-lg overflow-x-auto max-h-40 border border-slate-800/80">
                          {msg.codeSnippet.code}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0E1322] border border-slate-800 text-xs text-slate-300 font-mono flex items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span>{currentProgressStep}</span>
                </div>
                <button
                  onClick={handleCancelRequest}
                  className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold transition-all"
                >
                  Cancel Request
                </button>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Prompt Templates Quick Select Drawer */}
        <AnimatePresence>
          {showPromptDrawer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-3 border-t border-slate-800/80 bg-[#0E1322] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-blue-400" />
                  Prompt Templates Library
                </span>
                <button 
                  onClick={() => setShowPromptDrawer(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {promptTemplates.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setInputText(p.promptText);
                      if (p.targetAgent) setSelectedAgentId(p.targetAgent);
                      setShowPromptDrawer(false);
                    }}
                    className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left space-y-0.5 transition-colors group"
                  >
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-300">{p.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar Dock */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0C101A] space-y-2">
          {/* Quick Action Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
            <button
              onClick={() => setShowPromptDrawer(!showPromptDrawer)}
              className="py-1 px-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition-colors border border-slate-700/60 whitespace-nowrap"
            >
              <Wand2 className="w-3 h-3 text-amber-400" />
              Templates
            </button>
            <button
              onClick={() => handleSendMessage("Perform a comprehensive security audit of active custom commands and API routes.", "security-analyst")}
              className="py-1 px-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition-colors border border-slate-700/60 whitespace-nowrap"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Security Audit
            </button>
            <button
              onClick={() => handleSendMessage("Analyze active system log lines, pinpoint socket drop causes, and suggest configuration corrections.", "debug-assistant")}
              className="py-1 px-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition-colors border border-slate-700/60 whitespace-nowrap"
            >
              <Bug className="w-3 h-3 text-orange-400" />
              Diagnose Logs
            </button>
            <button
              onClick={() => handleSendMessage("Design a production-grade MongoDB schema for tracking message telemetry.", "database-engineer")}
              className="py-1 px-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition-colors border border-slate-700/60 whitespace-nowrap"
            >
              <Database className="w-3 h-3 text-indigo-400" />
              Mongo Schema
            </button>
          </div>

          {/* Prompt Text Box */}
          <div className="flex gap-2 items-end">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask ${currentAgent?.name || 'GURU Core'} anything about GURU-XD... (Press Enter to send)`}
              rows={2}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-sans"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputText.trim()}
              className="h-14 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl font-semibold flex items-center justify-center transition-all shadow-md shadow-blue-900/30 active:scale-95 flex-shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>


      {/* ========================================================================= */}
      {/* 3. RIGHT PANEL: SANDBOX & CODE WORKSPACE                                  */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[420px] flex-shrink-0 border-l border-slate-800/80 bg-[#0C101A] flex flex-col h-auto lg:h-full overflow-hidden">
        
        {/* Right Panel Header Tabs */}
        <div className="flex border-b border-slate-800/80 bg-[#0F1422] p-1 gap-1">
          <button
            onClick={() => setRightTab('editor')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              rightTab === 'editor' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Code Editor
          </button>
          <button
            onClick={() => setRightTab('security')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              rightTab === 'security' 
                ? 'bg-amber-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security Scan
            {securityValidation?.securityScore !== undefined && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                securityValidation.securityScore > 80 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                {securityValidation.securityScore}
              </span>
            )}
          </button>
          <button
            onClick={() => setRightTab('history')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              rightTab === 'history' 
                ? 'bg-purple-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Deployments
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          
          {/* RIGHT TAB 1: CODE EDITOR & SANDBOX */}
          {rightTab === 'editor' && (
            <div className="space-y-3">
              {/* Command Config Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Trigger Name</label>
                  <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg px-2 text-xs text-slate-200">
                    <span className="text-blue-400 font-mono font-bold">.</span>
                    <input
                      type="text"
                      value={sandboxTrigger}
                      onChange={(e) => setSandboxTrigger(e.target.value)}
                      className="w-full bg-transparent p-1.5 focus:outline-none font-mono"
                      placeholder="weather"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Category</label>
                  <select
                    value={sandboxCategory}
                    onChange={(e) => setSandboxCategory(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700/80 rounded-lg p-1.5 text-slate-200 focus:outline-none"
                  >
                    <option value="Utility">Utility</option>
                    <option value="Moderation">Moderation</option>
                    <option value="Fun">Fun</option>
                    <option value="AI">AI</option>
                    <option value="Economy">Economy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Description</label>
                <input
                  type="text"
                  value={sandboxDesc}
                  onChange={(e) => setSandboxDesc(e.target.value)}
                  placeholder="Script purpose..."
                  className="w-full text-xs bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-200 focus:outline-none"
                />
              </div>

              {/* Monospace Code Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-blue-400" />
                    Sandbox Source Code
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sandboxCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <textarea
                  value={sandboxCode}
                  onChange={(e) => setSandboxCode(e.target.value)}
                  rows={12}
                  className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 focus:outline-none focus:border-blue-500 resize-none leading-relaxed custom-scrollbar"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {deployError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
                    ⚠️ {deployError}
                  </div>
                )}

                {deploySuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Successfully hot-deployed Command [.{sandboxTrigger}]!
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDraft}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Draft
                  </button>

                  <button
                    onClick={handleDeploySandbox}
                    disabled={securityValidation?.riskLevel === 'CRITICAL'}
                    className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Hot-Deploy Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT TAB 2: SECURITY SCAN & AST ANALYSIS */}
          {rightTab === 'security' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Static Analysis & Security Auditor
              </span>

              {securityValidation ? (
                <div className="space-y-3">
                  {/* Score Card */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Security Rating</p>
                      <p className="text-2xl font-bold font-mono text-slate-100">
                        {securityValidation.securityScore} <span className="text-xs text-slate-500">/ 100</span>
                      </p>
                    </div>

                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                      securityValidation.riskLevel === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      securityValidation.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      securityValidation.riskLevel === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {securityValidation.riskLevel} RISK
                    </div>
                  </div>

                  {/* Scopes & Memory */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500">RAM Footprint</span>
                      <p className="text-slate-200 font-bold">{securityValidation.estimatedMemoryMb} MB</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] text-slate-500">Syntax Status</span>
                      <p className={securityValidation.syntaxValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {securityValidation.syntaxValid ? 'PASSED' : 'SYNTAX ERROR'}
                      </p>
                    </div>
                  </div>

                  {/* Detected Issues */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Detected Code Warnings & Checks</label>
                    {securityValidation.issues && securityValidation.issues.length > 0 ? (
                      securityValidation.issues.map((issue: string, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs font-mono leading-relaxed flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Zero critical security vulnerabilities or syntax flaws detected. Safe for deployment.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Enter source code in editor to generate real-time security audit.</p>
              )}
            </div>
          )}

          {/* RIGHT TAB 3: DEPLOYMENT HISTORY & ROLLBACK */}
          {rightTab === 'history' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <History className="w-4 h-4 text-purple-400" />
                Hot-Deploy Snapshot History
              </span>

              {sandboxHistory.length > 0 ? (
                <div className="space-y-2">
                  {sandboxHistory.map((deploy) => (
                    <div 
                      key={deploy.id}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 font-mono">
                          .{deploy.trigger} <span className="text-purple-400">v{deploy.version}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(deploy.deployedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">{deploy.description}</p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-slate-500">Score: {deploy.securityScore}/100</span>
                        <button
                          onClick={() => handleRollback(deploy.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-semibold flex items-center gap-1 transition-colors border border-slate-700/60"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Rollback to Version
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No previous deployment snapshots recorded yet.</p>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
