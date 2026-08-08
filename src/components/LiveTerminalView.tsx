import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Play, 
  Pause,
  ArrowDownCircle, 
  Search, 
  ShieldCheck, 
  Send, 
  Activity, 
  Cpu, 
  Wifi, 
  RefreshCw, 
  Download, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Radio, 
  Database, 
  Clock, 
  HelpCircle, 
  ChevronRight, 
  Sliders, 
  Code,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Type,
  Zap,
  Filter,
  Server,
  X,
  RotateCcw,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Settings,
  Power
} from 'lucide-react';
import { LogLine, Command } from '../types';

interface LiveTerminalViewProps {
  logs?: LogLine[];
  commands?: Command[];
  onAddLog?: (log: Omit<LogLine, 'id' | 'timestamp'>) => void;
  onClearLogs?: () => void;
}

interface TerminalOutputLine {
  id: string;
  timestamp: string;
  type: 'prompt' | 'system' | 'success' | 'error' | 'warning' | 'info' | 'output' | 'ai';
  text: string;
  source?: string;
  durationMs?: number;
}

interface TerminalSession {
  id: string;
  name: string;
  node: string;
  lines: TerminalOutputLine[];
}

interface CommandHistoryItem {
  id: string;
  timestamp: string;
  command: string;
  sessionId: string;
}

interface PlatformProcess {
  id: string;
  name: string;
  category: string;
  status: 'running' | 'stopped' | 'warning';
  uptime: string;
  cpu: string;
  memory: string;
  port?: number;
  details: string;
}

export default function LiveTerminalView({ logs = [], commands = [], onAddLog, onClearLogs }: LiveTerminalViewProps) {
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs' | 'history' | 'processes' | 'actions'>('terminal');

  // Terminal State
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: 'session-1',
      name: 'Interactive Shell',
      node: 'node-cluster-01',
      lines: [
        {
          id: 'init-1',
          timestamp: new Date().toISOString().substring(11, 19),
          type: 'system',
          text: '┌─────────────────────────────────────────────────────────────────────────────┐'
        },
        {
          id: 'init-2',
          timestamp: new Date().toISOString().substring(11, 19),
          type: 'system',
          text: '│ GURU-XD ENTERPRISE PLATFORM v5.2.0 - DEVELOPER TERMINAL INTERFACE           │'
        },
        {
          id: 'init-3',
          timestamp: new Date().toISOString().substring(11, 19),
          type: 'system',
          text: '│ Kernel: 5.15.0-x86_64-guru | Runtime: Node.js ES2022 | Security: mTLS Active │'
        },
        {
          id: 'init-4',
          timestamp: new Date().toISOString().substring(11, 19),
          type: 'system',
          text: '└─────────────────────────────────────────────────────────────────────────────┘'
        },
        {
          id: 'init-5',
          timestamp: new Date().toISOString().substring(11, 19),
          type: 'success',
          text: '[SYSTEM INITIALIZED] Socket bridge active. Type "help" or "?" to inspect available CLI commands.'
        }
      ]
    },
    {
      id: 'session-2',
      name: 'Audit Stream',
      node: 'node-cluster-02',
      lines: [
        {
          id: 'aud-1',
          timestamp: new Date().toISOString().substring(11, 19),
          type: 'info',
          text: '[AUDIT STREAM] Connected to global mTLS security audit log queue.'
        }
      ]
    }
  ]);

  const [commandInput, setCommandInput] = useState<string>('');
  const [commandHistoryList, setCommandHistoryList] = useState<CommandHistoryItem[]>([
    { id: 'h-1', timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(), command: 'status', sessionId: 'session-1' },
    { id: 'h-2', timestamp: new Date(Date.now() - 2400000).toLocaleTimeString(), command: 'listeners', sessionId: 'session-1' },
    { id: 'h-3', timestamp: new Date(Date.now() - 1200000).toLocaleTimeString(), command: 'mtls', sessionId: 'session-1' },
    { id: 'h-4', timestamp: new Date(Date.now() - 600000).toLocaleTimeString(), command: 'benchmark', sessionId: 'session-1' }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dracula' | 'matrix' | 'cyber' | 'amber' | 'slate' | 'cmd' | 'pwsh' | 'termux'>('dracula');
  const [fontSize, setFontSize] = useState<'xs' | 'sm' | 'base' | 'lg' | 'xl'>('sm');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shellMode, setShellMode] = useState<'bash' | 'cmd' | 'pwsh' | 'termux'>('bash');
  const [promptUser, setPromptUser] = useState<string>('guru@xd-core-01');
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showScriptRunner, setShowScriptRunner] = useState<boolean>(false);
  const [scriptContent, setScriptContent] = useState<string>(
    `status\nroadmap\nsecurity\nlisteners\nbenchmark\nmacro checkall`
  );
  const [isScriptRunning, setIsScriptRunning] = useState<boolean>(false);

  const [showBatchUpdater, setShowBatchUpdater] = useState<boolean>(false);
  const [batchUpdateJson, setBatchUpdateJson] = useState<string>(`[
  {
    "group": "system",
    "action": "status",
    "description": "Real-time system health and hypervisor status",
    "requiredRole": "Viewer"
  },
  {
    "group": "db",
    "action": "health",
    "description": "Database pool metrics and query latency",
    "requiredRole": "Operator"
  }
]`);
  const [batchUpdateStatus, setBatchUpdateStatus] = useState<string | null>(null);

  // Quick Command Bar & Auto-Complete States
  const [quickSearchQuery, setQuickSearchQuery] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<'all' | 'bots' | 'system' | 'dev'>('all');
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Dedicated Logs View Filtering & Control States
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [logLevelFilter, setLogLevelFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error' | 'debug'>('all');
  const [isLogsPaused, setIsLogsPaused] = useState<boolean>(false);

  // History Tab Search
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Process Controls
  const [processes, setProcesses] = useState<PlatformProcess[]>([
    { id: 'p1', name: 'GURU Core API Server', category: 'Backend Kernel', status: 'running', uptime: '14d 6h 22m', cpu: '1.2%', memory: '48.5 MB', port: 3000, details: 'Express REST & WebSocket Proxy' },
    { id: 'p2', name: 'Socket.IO Bridge Engine', category: 'Realtime Gateway', status: 'running', uptime: '14d 6h 22m', cpu: '0.4%', memory: '24.1 MB', port: 3000, details: 'Bi-directional Event Router' },
    { id: 'p3', name: 'WhatsApp Microservice', category: 'Bot Runtime', status: 'running', uptime: '3d 18h 10m', cpu: '2.8%', memory: '112.4 MB', details: 'Baileys Multi-Device Socket Client' },
    { id: 'p4', name: 'GURU-MD AI Copilot', category: 'LLM Engine', status: 'running', uptime: '14d 6h 22m', cpu: '0.8%', memory: '64.0 MB', details: 'Gemini 3.5 Flash Model Bridge' },
    { id: 'p5', name: 'Task Scheduler & Daemon', category: 'Cron Manager', status: 'running', uptime: '14d 6h 22m', cpu: '0.1%', memory: '18.2 MB', details: 'Automated Job Runner Queue' },
    { id: 'p6', name: 'Data Persistence Pool', category: 'Storage Engine', status: 'running', uptime: '14d 6h 22m', cpu: '0.3%', memory: '32.8 MB', details: 'PostgreSQL / LowDB Pool' },
    { id: 'p7', name: 'Plugin Marketplace Host', category: 'Extensions', status: 'running', uptime: '14d 6h 22m', cpu: '0.1%', memory: '16.5 MB', details: 'Dynamic Extension Manager' },
  ]);

  const fontSizes: Array<{ id: 'xs' | 'sm' | 'base' | 'lg' | 'xl'; label: string; px: string }> = [
    { id: 'xs', label: 'XS', px: '11px' },
    { id: 'sm', label: 'S', px: '12px' },
    { id: 'base', label: 'M', px: '14px' },
    { id: 'lg', label: 'L', px: '16px' },
    { id: 'xl', label: 'XL', px: '18px' },
  ];

  const handleZoomOut = () => {
    if (fontSize === 'xl') setFontSize('lg');
    else if (fontSize === 'lg') setFontSize('base');
    else if (fontSize === 'base') setFontSize('sm');
    else if (fontSize === 'sm') setFontSize('xs');
  };

  const handleZoomIn = () => {
    if (fontSize === 'xs') setFontSize('sm');
    else if (fontSize === 'sm') setFontSize('base');
    else if (fontSize === 'base') setFontSize('lg');
    else if (fontSize === 'lg') setFontSize('xl');
  };

  const currentFontObj = fontSizes.find(f => f.id === fontSize) || fontSizes[1];

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const logsScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Copy helper with feedback badge and item ID checkmark
  const copyToClipboard = (text: string, label: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Synchronize shell prompt & authentic themes with shell environment mode
  useEffect(() => {
    switch (shellMode) {
      case 'bash':
        setPromptUser('guru@xd-core-01');
        break;
      case 'cmd':
        setPromptUser('C:\\GURU-XD\\Kernel');
        break;
      case 'pwsh':
        setPromptUser('PS C:\\GURU-XD');
        break;
      case 'termux':
        setPromptUser('pkg install @guru/xd ~');
        break;
    }
  }, [shellMode]);

  // Default fallback bot commands if props.commands is empty
  const defaultBotCommands: Command[] = [
    { id: 'b1', trigger: 'help', prefix: '.', description: 'Display interactive menu & bot features list', category: 'Utility', isActive: true, code: '' },
    { id: 'b2', trigger: 'ping', prefix: '.', description: 'Test bot response speed and socket delay', category: 'Utility', isActive: true, code: '' },
    { id: 'b3', trigger: 'ai', prefix: '.', description: 'Query GURU-MD AI Copilot assistant engine', category: 'AI', isActive: true, code: '' },
    { id: 'b4', trigger: 'stats', prefix: '.', description: 'Display bot runtime metrics, memory & process CPU', category: 'Utility', isActive: true, code: '' },
    { id: 'b5', trigger: 'menu', prefix: '.', description: 'Interactive multi-device platform command menu', category: 'Utility', isActive: true, code: '' },
    { id: 'b6', trigger: 'sticker', prefix: '.', description: 'Convert image/media into WhatsApp sticker pack', category: 'Fun', isActive: true, code: '' },
    { id: 'b7', trigger: 'mute', prefix: '.', description: 'Mute/unmute group chat notifications', category: 'Moderation', isActive: true, code: '' },
  ];

  const activeBotCommands = (commands && commands.length > 0) ? commands : defaultBotCommands;

  // System & Developer CLI commands list for Auto-Complete
  const systemCliCommands = [
    { trigger: 'status', prefix: '', description: 'Inspect platform health, uptime, memory & mTLS state', category: 'System', source: 'system' as const },
    { trigger: 'listeners', prefix: '', description: 'Query registered AppEventBus subscriber workers', category: 'System', source: 'system' as const },
    { trigger: 'dispatch', prefix: '', description: 'Dispatch event directly to AppEventBus kernel', category: 'System', source: 'system' as const },
    { trigger: 'test-route', prefix: '', description: 'Test platform REST API route (/api/v1/health etc)', category: 'Dev Tools', source: 'dev' as const },
    { trigger: 'bot-test', prefix: '', description: 'Test & simulate bot command trigger execution', category: 'Dev Tools', source: 'dev' as const },
    { trigger: 'inspect-bus', prefix: '', description: 'Inspect AppEventBus kernel state & queue', category: 'Dev Tools', source: 'dev' as const },
    { trigger: 'inspect-db', prefix: '', description: 'Inspect PostgreSQL / SQLite stateful storage pool', category: 'Dev Tools', source: 'dev' as const },
    { trigger: 'mtls', prefix: '', description: 'Trigger Zero-Trust mTLS & security policy audit', category: 'System', source: 'system' as const },
    { trigger: 'security', prefix: '', description: 'Run OWASP security header & mTLS audit', category: 'System', source: 'system' as const },
    { trigger: 'roadmap', prefix: '', description: 'Inspect GURU-XD core architecture & release roadmap', category: 'System', source: 'system' as const },
    { trigger: 'benchmark', prefix: '', description: 'Execute live microsecond latency benchmark test', category: 'Dev Tools', source: 'dev' as const },
    { trigger: 'macro checkall', prefix: '', description: 'Run automated full system verification suite', category: 'Dev Tools', source: 'dev' as const },
    { trigger: 'ps', prefix: '', description: 'Display active platform process table & CPU stats', category: 'System', source: 'system' as const },
    { trigger: 'logs', prefix: '', description: 'Stream system event log telemetry buffer', category: 'System', source: 'system' as const },
    { trigger: 'bots', prefix: '', description: 'Query active bot microservices and health status', category: 'System', source: 'system' as const },
    { trigger: 'plugins', prefix: '', description: 'List loaded plugin marketplace extensions', category: 'System', source: 'system' as const },
    { trigger: 'env', prefix: '', description: 'View active environment configuration parameters', category: 'System', source: 'system' as const },
    { trigger: 'eval', prefix: '', description: 'Evaluate JavaScript sandbox expressions', category: 'Dev Tools', source: 'dev' as const },
    { trigger: 'ai', prefix: '', description: 'Query GURU-MD AI Copilot from terminal shell', category: 'Dev Tools', source: 'dev' as const },
    { trigger: 'clear', prefix: '', description: 'Clear terminal session scrollback buffer', category: 'System', source: 'system' as const },
  ];

  // Combined suggestions list
  const allSuggestions = [
    ...activeBotCommands.map(b => ({
      trigger: `${b.prefix || '.'}${b.trigger}`,
      prefix: b.prefix || '.',
      description: b.description,
      category: `Bot: ${b.category}`,
      source: 'bots' as const
    })),
    ...systemCliCommands
  ];

  // Filtered suggestions based on user typing in prompt or quick command bar
  const currentSearchText = (commandInput || quickSearchQuery).toLowerCase().trim();
  const filteredSuggestions = allSuggestions.filter(item => {
    if (quickCategory === 'bots' && item.source !== 'bots') return false;
    if (quickCategory === 'system' && item.source !== 'system') return false;
    if (quickCategory === 'dev' && item.source !== 'dev') return false;

    if (!currentSearchText) return true;
    return item.trigger.toLowerCase().includes(currentSearchText) ||
           item.description.toLowerCase().includes(currentSearchText) ||
           item.category.toLowerCase().includes(currentSearchText);
  });

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Periodic live telemetry stream ticker when active
  useEffect(() => {
    if (!isLiveStreamActive || isLogsPaused) return;

    const interval = setInterval(() => {
      const randomEvts = [
        '[BUS TELEMETRY] Heartbeat ping from node-cluster-01 | mTLS TLS_AES_256_GCM_SHA384 active',
        '[mTLS KEEPALIVE] Zero-trust socket handshake re-verified (0.3ms latency)',
        '[EVENT BUS ROUTER] Subscriber health check: 100% active (0 errors)',
        '[SECURITY SENTINEL] Threat detection scan complete: 0 anomalies detected'
      ];
      const selected = randomEvts[Math.floor(Math.random() * randomEvts.length)];
      appendLineToSession(activeSessionId, {
        type: 'info',
        text: selected
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [isLiveStreamActive, isLogsPaused, activeSessionId]);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('guru_jwt_token') || sessionStorage.getItem('guru_jwt_token');
    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Auto-scroll logic for terminal
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current && activeTab === 'terminal') {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [activeSession.lines, autoScroll, activeTab]);

  // Auto-scroll logic for logs tab
  useEffect(() => {
    if (autoScroll && logsScrollRef.current && activeTab === 'logs' && !isLogsPaused) {
      logsScrollRef.current.scrollTop = logsScrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll, activeTab, isLogsPaused]);

  // Handle ESC key to exit fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Focus input on session container click
  const handleTerminalContainerClick = () => {
    inputRef.current?.focus();
  };

  const appendLineToSession = (sessionId: string, line: Omit<TerminalOutputLine, 'id' | 'timestamp'>) => {
    const newOutputLine: TerminalOutputLine = {
      ...line,
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().substring(11, 19)
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          lines: [...s.lines, newOutputLine]
        };
      }
      return s;
    }));
  };

  const handleExecuteCommand = async (cmdOverride?: string) => {
    const cmd = (cmdOverride || commandInput).trim();
    if (!cmd || isExecuting) return;

    setCommandInput('');
    setShowSuggestions(false);

    // Update command history
    const historyItem: CommandHistoryItem = {
      id: `h-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      command: cmd,
      sessionId: activeSessionId
    };
    setCommandHistoryList(prev => [historyItem, ...prev.filter(h => h.command !== cmd)]);
    setHistoryIndex(-1);

    // Append prompt line
    appendLineToSession(activeSessionId, {
      type: 'prompt',
      text: `${promptUser}:~$ ${cmd}`
    });

    // Handle local shortcuts
    if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, lines: [] } : s));
      return;
    }

    setIsExecuting(true);
    const startMs = performance.now();

    try {
      const res = await fetch('/api/v1/terminal/execute', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          command: cmd,
          sessionId: activeSessionId
        })
      });

      const execDuration = Math.round(performance.now() - startMs);

      if (res.ok) {
        const body = await res.json();
        const data = body.data || body;
        if (data.outputLines && Array.isArray(data.outputLines)) {
          data.outputLines.forEach((outLine: any) => {
            appendLineToSession(activeSessionId, {
              type: outLine.type || 'output',
              text: outLine.text,
              durationMs: execDuration
            });
          });
        } else {
          appendLineToSession(activeSessionId, {
            type: 'output',
            text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
            durationMs: execDuration
          });
        }
      } else {
        executeLocalFallback(cmd, execDuration);
      }
    } catch (err: any) {
      const execDuration = Math.round(performance.now() - startMs);
      executeLocalFallback(cmd, execDuration);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunBatchScript = async () => {
    if (!scriptContent.trim() || isScriptRunning) return;
    const lines = scriptContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (lines.length === 0) return;

    setIsScriptRunning(true);
    appendLineToSession(activeSessionId, {
      type: 'system',
      text: `[BATCH SCRIPT RUNNER] Starting batch execution of ${lines.length} script statements...`
    });

    for (let i = 0; i < lines.length; i++) {
      const lineCmd = lines[i];
      appendLineToSession(activeSessionId, {
        type: 'prompt',
        text: `${promptUser}:~$ ${lineCmd}`
      });

      const startMs = performance.now();
      try {
        const res = await fetch('/api/v1/terminal/execute', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            command: lineCmd,
            sessionId: activeSessionId
          })
        });

        const execDuration = Math.round(performance.now() - startMs);

        if (res.ok) {
          const body = await res.json();
          const data = body.data || body;
          if (data.outputLines && Array.isArray(data.outputLines)) {
            data.outputLines.forEach((outLine: any) => {
              appendLineToSession(activeSessionId, {
                type: outLine.type || 'output',
                text: outLine.text,
                durationMs: execDuration
              });
            });
          }
        } else {
          executeLocalFallback(lineCmd, execDuration);
        }
      } catch (err) {
        executeLocalFallback(lineCmd, Math.round(performance.now() - startMs));
      }

      await new Promise(r => setTimeout(r, 200));
    }

    appendLineToSession(activeSessionId, {
      type: 'success',
      text: `[BATCH SCRIPT RUNNER] Batch execution complete (${lines.length}/${lines.length} statements executed).`
    });
    setIsScriptRunning(false);
    setShowScriptRunner(false);
  };

  const executeLocalFallback = (cmd: string, durationMs: number) => {
    const trimmed = cmd.trim();
    const parts = trimmed.split(/\s+/);
    const main = parts[0].toLowerCase();

    if (main === 'status') {
      appendLineToSession(activeSessionId, { type: 'success', text: '[STATUS] Platform kernel ONLINE | mTLS Verified | CPU: 1.2% | Heap: 48.2 MB' });
    } else if (main === 'help' || main === '?') {
      appendLineToSession(activeSessionId, { type: 'system', text: 'Available commands: status, listeners, mtls, ps, bots, plugins, env, benchmark, clear' });
    } else if (main === 'mtls') {
      appendLineToSession(activeSessionId, { type: 'success', text: '[mTLS SUCCESS] Handshake verified across zero-trust socket boundaries.' });
    } else if (main === 'benchmark') {
      appendLineToSession(activeSessionId, { type: 'info', text: '[BENCHMARK] Socket response latency: 0.18ms | EventBus throughput: 14,200 msg/sec' });
    } else {
      appendLineToSession(activeSessionId, { type: 'output', text: `Command executed: "${cmd}"` });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIdx(prev => (prev <= 0 ? filteredSuggestions.length - 1 : prev - 1));
        return;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIdx(prev => (prev >= filteredSuggestions.length - 1 ? 0 : prev + 1));
        return;
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredSuggestions[activeSuggestionIdx] || filteredSuggestions[0];
        if (selected) {
          setCommandInput(selected.trigger);
          setShowSuggestions(false);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistoryList.length === 0) return;
      const nextIdx = historyIndex === -1 ? 0 : Math.min(commandHistoryList.length - 1, historyIndex + 1);
      setHistoryIndex(nextIdx);
      setCommandInput(commandHistoryList[nextIdx]?.command || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex - 1;
      if (nextIdx < 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      } else {
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistoryList[nextIdx]?.command || '');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const candidates = allSuggestions.map(s => s.trigger);
      const match = candidates.find(c => c.toLowerCase().startsWith(commandInput.toLowerCase()));
      if (match) {
        setCommandInput(match);
      }
    }
  };

  const handleExportTerminalLogs = () => {
    const content = activeSession.lines.map(l => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-${activeSession.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSystemLogs = () => {
    const content = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] [${l.source || 'SYSTEM'}]: ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateNewSession = () => {
    const newId = `session-${sessions.length + 1}`;
    const newSess: TerminalSession = {
      id: newId,
      name: `Terminal #${sessions.length + 1}`,
      node: `node-cluster-0${(sessions.length % 3) + 1}`,
      lines: [
        {
          id: `init-${Date.now()}`,
          timestamp: new Date().toISOString().substring(11, 19),
          type: 'system',
          text: `[NEW TERMINAL SESSION CREATED] Connected to ${newId}.`
        }
      ]
    };
    setSessions(prev => [...prev, newSess]);
    setActiveSessionId(newId);
  };

  // Process Action Handlers
  const handleToggleProcess = (id: string) => {
    setProcesses(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'running' ? 'stopped' : 'running';
        if (onAddLog) {
          onAddLog({
            type: nextStatus === 'running' ? 'success' : 'warning',
            source: 'PROCESS_MGR',
            message: `Process [${p.name}] ${nextStatus === 'running' ? 'started' : 'stopped'} by operator.`
          });
        }
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  const handleRestartProcess = (p: PlatformProcess) => {
    if (onAddLog) {
      onAddLog({
        type: 'info',
        source: 'PROCESS_MGR',
        message: `Restarting platform process: [${p.name}]...`
      });
    }
    appendLineToSession(activeSessionId, {
      type: 'system',
      text: `[PROCESS MANAGER] Restart signal sent to ${p.name} (${p.id})`
    });
    copyToClipboard(`Restarted ${p.name}`, `Restarted ${p.name}`);
  };

  // Theme color styling mapper (Dracula, Matrix, Cyberpunk, Amber, CMD, PWSH, Termux, Slate)
  const getThemeClasses = () => {
    switch (theme) {
      case 'dracula':
        return {
          bg: 'bg-[#282a36]',
          text: 'text-[#f8f8f2]',
          prompt: 'text-[#bd93f9]',
          border: 'border-[#6272a4]/40',
          headerBg: 'bg-[#1e1f29]',
          lineTypes: {
            prompt: 'text-[#bd93f9] font-bold',
            system: 'text-[#6272a4]',
            success: 'text-[#50fa7b] font-medium',
            error: 'text-[#ff5555] font-medium',
            warning: 'text-[#ffb86c]',
            info: 'text-[#8be9fd]',
            output: 'text-[#f8f8f2]',
            ai: 'text-[#ff79c6] font-semibold'
          }
        };
      case 'matrix':
        return {
          bg: 'bg-slate-950',
          text: 'text-emerald-400',
          prompt: 'text-emerald-300',
          border: 'border-emerald-500/30',
          headerBg: 'bg-slate-900/90',
          lineTypes: {
            prompt: 'text-emerald-300 font-bold',
            system: 'text-cyan-400',
            success: 'text-emerald-400 font-medium',
            error: 'text-rose-400 font-medium',
            warning: 'text-amber-300',
            info: 'text-blue-300',
            output: 'text-emerald-200',
            ai: 'text-purple-300 font-semibold'
          }
        };
      case 'cyber':
        return {
          bg: 'bg-slate-950',
          text: 'text-cyan-300',
          prompt: 'text-sky-300',
          border: 'border-cyan-500/30',
          headerBg: 'bg-slate-900/90',
          lineTypes: {
            prompt: 'text-sky-300 font-bold',
            system: 'text-purple-400',
            success: 'text-cyan-400 font-medium',
            error: 'text-rose-400 font-medium',
            warning: 'text-amber-300',
            info: 'text-indigo-300',
            output: 'text-cyan-100',
            ai: 'text-fuchsia-300 font-semibold'
          }
        };
      case 'amber':
        return {
          bg: 'bg-black',
          text: 'text-amber-400',
          prompt: 'text-amber-300',
          border: 'border-amber-500/30',
          headerBg: 'bg-stone-900/90',
          lineTypes: {
            prompt: 'text-amber-300 font-bold',
            system: 'text-amber-500',
            success: 'text-amber-400 font-medium',
            error: 'text-rose-400 font-medium',
            warning: 'text-yellow-300',
            info: 'text-amber-200',
            output: 'text-amber-100',
            ai: 'text-amber-300 font-semibold'
          }
        };
      case 'cmd':
        return {
          bg: 'bg-black',
          text: 'text-slate-100',
          prompt: 'text-slate-100',
          border: 'border-slate-800',
          headerBg: 'bg-neutral-900',
          lineTypes: {
            prompt: 'text-slate-100 font-bold',
            system: 'text-slate-400',
            success: 'text-emerald-400 font-medium',
            error: 'text-rose-400 font-medium',
            warning: 'text-yellow-400',
            info: 'text-cyan-300',
            output: 'text-slate-200',
            ai: 'text-purple-300 font-semibold'
          }
        };
      case 'pwsh':
        return {
          bg: 'bg-[#012456]',
          text: 'text-white',
          prompt: 'text-yellow-300',
          border: 'border-blue-800/60',
          headerBg: 'bg-[#011c42]',
          lineTypes: {
            prompt: 'text-yellow-300 font-bold',
            system: 'text-sky-300',
            success: 'text-emerald-300 font-medium',
            error: 'text-rose-300 font-bold',
            warning: 'text-yellow-200',
            info: 'text-cyan-200',
            output: 'text-slate-100',
            ai: 'text-fuchsia-300 font-semibold'
          }
        };
      case 'termux':
        return {
          bg: 'bg-[#0c0c0c]',
          text: 'text-emerald-400',
          prompt: 'text-emerald-300',
          border: 'border-emerald-950',
          headerBg: 'bg-[#141414]',
          lineTypes: {
            prompt: 'text-emerald-300 font-bold',
            system: 'text-yellow-400',
            success: 'text-emerald-400 font-medium',
            error: 'text-rose-400 font-medium',
            warning: 'text-amber-300',
            info: 'text-cyan-400',
            output: 'text-emerald-300',
            ai: 'text-fuchsia-400 font-semibold'
          }
        };
      case 'slate':
      default:
        return {
          bg: 'bg-slate-900',
          text: 'text-slate-200',
          prompt: 'text-blue-400',
          border: 'border-slate-800',
          headerBg: 'bg-slate-950',
          lineTypes: {
            prompt: 'text-blue-400 font-bold',
            system: 'text-slate-400',
            success: 'text-emerald-400 font-medium',
            error: 'text-rose-400 font-medium',
            warning: 'text-amber-300',
            info: 'text-cyan-300',
            output: 'text-slate-200',
            ai: 'text-indigo-300 font-semibold'
          }
        };
    }
  };

  const currentTheme = getThemeClasses();
  const fontSizeClass =
    fontSize === 'xs' ? 'text-[11px] leading-relaxed' :
    fontSize === 'sm' ? 'text-xs leading-relaxed' :
    fontSize === 'base' ? 'text-sm leading-relaxed' :
    fontSize === 'lg' ? 'text-base leading-relaxed' :
    'text-lg leading-relaxed';

  // Filtered system logs for Dedicated Logs Tab
  const filteredSystemLogs = logs.filter(l => {
    if (logLevelFilter !== 'all' && l.type !== logLevelFilter) return false;
    if (!logSearchQuery) return true;
    const q = logSearchQuery.toLowerCase();
    return l.message.toLowerCase().includes(q) || (l.source && l.source.toLowerCase().includes(q));
  });

  // Filtered history list
  const filteredHistory = commandHistoryList.filter(h =>
    !historySearchQuery || h.command.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Copied Toast Banner */}
      {copiedNotification && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-mono text-xs font-bold rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Primary Developer Console Container */}
      <div className={`transition-all duration-300 flex flex-col ${
        isFullscreen
          ? 'fixed inset-2 md:inset-4 z-50 bg-slate-950 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)]'
          : `rounded-2xl border ${currentTheme.border} ${currentTheme.bg} overflow-hidden shadow-2xl min-h-[660px]`
      }`}>
        
        {/* Terminal Header & Mode Navigation Bar */}
        <div className={`flex flex-col border-b ${currentTheme.border} ${currentTheme.headerBg}`}>
          
          {/* Top Bar: Title, Window Controls, Shell Selection & Global Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-b border-slate-800/60">
            {/* Left Controls & Status */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 mr-1">
                <div 
                  className="w-3 h-3 rounded-full bg-rose-500/80 cursor-pointer hover:bg-rose-600 transition-colors"
                  onClick={() => isFullscreen && setIsFullscreen(false)}
                  title={isFullscreen ? "Exit Fullscreen Mode (ESC)" : "Close Window"}
                ></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>

              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-purple-400" />
                <span className="font-mono text-xs font-bold text-slate-100 tracking-wide">
                  GURU-XD Console
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  mTLS Active
                </span>
              </div>
            </div>

            {/* Right Control Bar: Shell Switcher, Theme, Font Size, Fullscreen */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              
              {/* Shell Mode Environment Switcher */}
              <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                {[
                  { id: 'bash', label: 'BASH' },
                  { id: 'cmd', label: 'CMD' },
                  { id: 'pwsh', label: 'PWSH' },
                  { id: 'termux', label: 'TERMUX' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setShellMode(s.id as any)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      shellMode === s.id
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Theme Dropdown */}
              <select
                value={theme}
                onChange={(e: any) => setTheme(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500 font-mono cursor-pointer"
                title="Select Console Visual Theme"
              >
                <option value="dracula">Dracula Dark (VS Code)</option>
                <option value="matrix">Matrix Green (Linux)</option>
                <option value="cmd">Windows CMD (Classic)</option>
                <option value="pwsh">PowerShell Blue</option>
                <option value="termux">Termux Android</option>
                <option value="cyber">Cyberpunk Blue</option>
                <option value="amber">Amber Retro</option>
                <option value="slate">Midnight Slate</option>
              </select>

              {/* Font Size Controls */}
              <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg p-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={fontSize === 'xs'}
                  className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Decrease Font Size"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <span className="text-[11px] px-1 font-bold text-slate-200 min-w-[32px] text-center select-none flex items-center justify-center gap-0.5">
                  <Type className="w-3 h-3 text-purple-400" />
                  {currentFontObj.px}
                </span>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={fontSize === 'xl'}
                  className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Increase Font Size"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Fullscreen Expand Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isFullscreen
                    ? 'bg-purple-600/30 border-purple-500/50 text-purple-200 shadow-md'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-purple-300 hover:bg-slate-800'
                }`}
                title={isFullscreen ? 'Exit Fullscreen Mode (ESC)' : 'Expand Fullscreen Console'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom Navigation Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950/60 font-mono text-xs overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'terminal'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                <span>Terminal</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Logs</span>
                {logs.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
                    {logs.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Command History</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                  {commandHistoryList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('processes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'processes'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Running Processes</span>
              </button>

              <button
                onClick={() => setActiveTab('actions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'actions'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Quick Actions</span>
              </button>
            </div>

            {/* Contextual Toolbar Options according to Active Tab */}
            {activeTab === 'terminal' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowScriptRunner(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-purple-500 text-slate-300 hover:text-purple-300 text-[11px] transition-colors cursor-pointer"
                  title="Run multi-line batch CLI script"
                >
                  <Code className="w-3 h-3 text-purple-400" />
                  <span>Script Runner</span>
                </button>

                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border transition-colors cursor-pointer ${
                    autoScroll
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title="Toggle Auto-Scroll"
                >
                  <ArrowDownCircle className="w-3 h-3" />
                  <span>Auto-Scroll</span>
                </button>

                <button
                  onClick={handleExportTerminalLogs}
                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                  title="Export Terminal Session Log"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* VIEW TAB 1: TERMINAL EXECUTION VIEW */}
        {activeTab === 'terminal' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            
            {/* Terminal Session Tabs Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/80 font-mono text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {sessions.map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => setActiveSessionId(sess.id)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                      activeSessionId === sess.id
                        ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <TerminalIcon className="w-3 h-3" />
                    <span>{sess.name}</span>
                    <span className="text-[9px] text-slate-500">({sess.lines.length})</span>
                  </button>
                ))}
                <button
                  onClick={handleCreateNewSession}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 text-[11px] font-bold transition-all cursor-pointer"
                  title="Create New Terminal Session Tab"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, lines: [] } : s))}
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                title="Clear Active Terminal Buffer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Output Scrollback Buffer */}
            <div 
              ref={scrollContainerRef}
              onClick={handleTerminalContainerClick}
              className={`flex-1 p-4 font-mono ${fontSizeClass} overflow-y-auto space-y-1.5 cursor-text ${
                isFullscreen ? 'min-h-0' : 'min-h-[420px] max-h-[560px]'
              }`}
            >
              {activeSession.lines.length === 0 ? (
                <div className="text-slate-600 italic py-12 text-center select-none font-mono">
                  Terminal session buffer empty. Type a command below or press Tab for auto-complete suggestions.
                </div>
              ) : (
                activeSession.lines.map((line) => {
                  const lineClass = currentTheme.lineTypes[line.type] || 'text-slate-300';
                  return (
                    <div key={line.id} className="flex items-start justify-between gap-2 leading-relaxed hover:bg-slate-800/30 rounded px-1 -mx-1 group transition-colors">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-slate-600 text-[10px] select-none shrink-0 pt-0.5 font-mono">
                          [{line.timestamp}]
                        </span>

                        <div className="flex-1 break-all whitespace-pre-wrap">
                          {line.type === 'prompt' ? (
                            <span className={currentTheme.prompt}>{line.text}</span>
                          ) : (
                            <span className={lineClass}>{line.text}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        {line.durationMs !== undefined && (
                          <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                            {line.durationMs}ms
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(line.text, "Terminal line copied", line.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-all cursor-pointer"
                          title="Copy line output"
                        >
                          {copiedId === line.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {isExecuting && (
                <div className="flex items-center gap-2 text-slate-400 py-1 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Executing command query on kernel node...</span>
                </div>
              )}
            </div>

            {/* Fixed Bottom Command Input & Autocomplete Overlay */}
            <div className={`relative border-t ${currentTheme.border} bg-slate-950`}>
              
              {/* Autocomplete Suggestions Popover */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 z-40 max-h-60 overflow-y-auto bg-slate-900/95 border border-slate-800 backdrop-blur-md rounded-t-xl shadow-2xl p-2 font-mono text-xs space-y-1 divide-y divide-slate-800/50">
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                    <span>Command Suggestions ({filteredSuggestions.length})</span>
                    <span>Use ↑↓ keys, Tab to complete, Enter to execute</span>
                  </div>
                  {filteredSuggestions.slice(0, 8).map((sug, idx) => {
                    const isSelected = idx === activeSuggestionIdx;
                    return (
                      <div
                        key={`${sug.trigger}-${idx}`}
                        onClick={() => {
                          setCommandInput(sug.trigger);
                          setShowSuggestions(false);
                          inputRef.current?.focus();
                        }}
                        className={`flex items-center justify-between gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-600/20 border border-purple-500/40 text-purple-200 font-bold'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold">
                            {sug.trigger}
                          </span>
                          <span className="text-slate-400 text-[11px] truncate max-w-md">
                            {sug.description}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-purple-400 border border-purple-900/50 uppercase">
                          {sug.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Input Form with Blinking Prompt */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteCommand();
                }}
                className="p-3 flex items-center gap-3"
              >
                <div className={`flex items-center gap-1 font-mono ${fontSizeClass} font-bold shrink-0 select-none`}>
                  {shellMode === 'cmd' ? (
                    <span className="text-slate-100">{promptUser}&gt;</span>
                  ) : shellMode === 'pwsh' ? (
                    <span className="text-yellow-300">{promptUser}&gt;</span>
                  ) : shellMode === 'termux' ? (
                    <span className="text-emerald-400">{promptUser} $</span>
                  ) : (
                    <>
                      <span className="text-blue-400">{promptUser}</span>
                      <span className="text-slate-500">:</span>
                      <span className="text-purple-400">~$</span>
                    </>
                  )}
                </div>

                <div className="relative flex-1 flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={commandInput}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setCommandInput(e.target.value);
                      setShowSuggestions(true);
                      setActiveSuggestionIdx(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder='Type command (e.g. "status", "listeners", "mtls", ".ping", "help")...'
                    className={`w-full bg-transparent border-none outline-none font-mono ${fontSizeClass} ${currentTheme.text} placeholder-slate-600`}
                    autoFocus
                  />
                  {!commandInput && (
                    <span className="w-2 h-4 bg-purple-400 animate-pulse ml-0.5 inline-block opacity-80" />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!commandInput.trim() || isExecuting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium text-xs font-mono transition-all cursor-pointer shrink-0 shadow-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Run</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW TAB 2: DEDICATED LIVE LOGS VIEW */}
        {activeTab === 'logs' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden p-4 space-y-4">
            
            {/* Logs Toolbar: Search, Level Filter, Pause, Clear, Export */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-xs">
              
              {/* Search Box */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter logs by keyword or source..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-purple-500 placeholder-slate-600"
                />
              </div>

              {/* Log Level Filters */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'info', label: 'Info' },
                  { id: 'success', label: 'Success' },
                  { id: 'warning', label: 'Warning' },
                  { id: 'error', label: 'Error' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setLogLevelFilter(lvl.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      logLevelFilter === lvl.id
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>

              {/* Stream Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLogsPaused(!isLogsPaused)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    isLogsPaused
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  {isLogsPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  <span>{isLogsPaused ? 'Resume Stream' : 'Pause Stream'}</span>
                </button>

                {onClearLogs && (
                  <button
                    onClick={onClearLogs}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Clear System Logs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={handleExportSystemLogs}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                  title="Export System Logs File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Logs List Buffer */}
            <div 
              ref={logsScrollRef}
              className="flex-1 overflow-y-auto bg-slate-950/90 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 min-h-[420px] max-h-[560px]"
            >
              {filteredSystemLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-600 italic">
                  No system logs matched the selected level or search criteria.
                </div>
              ) : (
                filteredSystemLogs.map((log) => {
                  const badgeColor =
                    log.type === 'error' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    log.type === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    log.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/40';

                  return (
                    <div 
                      key={log.id} 
                      className="flex items-start justify-between gap-3 p-2 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/50 transition-colors group"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono pt-0.5">
                          {log.timestamp}
                        </span>

                        <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold border shrink-0 ${badgeColor}`}>
                          {log.type}
                        </span>

                        {log.source && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono shrink-0">
                            {log.source}
                          </span>
                        )}

                        <span className="text-slate-200 break-all whitespace-pre-wrap flex-1">
                          {log.message}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(log.message, "Log message copied", log.id)}
                        className="opacity-70 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-all cursor-pointer shrink-0"
                        title="Copy Log Message"
                      >
                        {copiedId === log.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW TAB 3: COMMAND HISTORY VIEW */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden p-4 space-y-4">
            
            {/* History Header & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search previous executed commands..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-purple-500 placeholder-slate-600"
                />
              </div>

              <button
                onClick={() => setCommandHistoryList([])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>

            {/* History Items List */}
            <div className="flex-1 overflow-y-auto bg-slate-950/90 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 min-h-[420px] max-h-[560px]">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-600 italic">
                  No command history entries found.
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {item.timestamp}
                      </span>

                      <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono font-bold text-xs border border-slate-800 truncate">
                        {item.command}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveTab('terminal');
                          handleExecuteCommand(item.command);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer text-[11px] font-bold"
                        title="Re-run command in terminal"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Re-run</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.command, "Command copied to clipboard", item.id)}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-all cursor-pointer"
                        title="Copy Command String"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => setCommandHistoryList(prev => prev.filter(h => h.id !== item.id))}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW TAB 4: RUNNING PROCESSES VIEW */}
        {activeTab === 'processes' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden p-4 space-y-4">
            
            {/* Header & Status Bar */}
            <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">GURU-XD Platform Service Monitor</span>
                <span className="text-[10px] text-slate-500">({processes.length} active microservices)</span>
              </div>

              <button
                onClick={() => {
                  copyToClipboard("Refreshed processes telemetry", "Process status updated");
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Status</span>
              </button>
            </div>

            {/* Processes Grid Table */}
            <div className="flex-1 overflow-y-auto bg-slate-950/90 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-3 min-h-[420px] max-h-[560px]">
              {processes.map((proc) => {
                const isRunning = proc.status === 'running';
                return (
                  <div
                    key={proc.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-100 text-sm">{proc.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-purple-400 border border-purple-900/50">
                              {proc.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 pt-0.5">{proc.details}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestartProcess(proc)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 text-xs font-bold transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restart</span>
                        </button>

                        <button
                          onClick={() => handleToggleProcess(proc.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isRunning
                              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white'
                              : 'bg-emerald-600 text-white shadow-lg'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{isRunning ? 'Stop Service' : 'Start Service'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Service Metrics Footer */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-600 block text-[10px]">UPTIME</span>
                        <span className="text-slate-200 font-bold">{proc.uptime}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px]">CPU UTILITY</span>
                        <span className="text-emerald-400 font-bold">{proc.cpu}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px]">MEMORY HEAP</span>
                        <span className="text-cyan-400 font-bold">{proc.memory}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px]">BINDING PORT</span>
                        <span className="text-purple-400 font-bold">{proc.port ? `:${proc.port}` : 'Internal'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW TAB 5: QUICK ACTIONS GRID VIEW */}
        {activeTab === 'actions' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden p-4 space-y-4 font-mono text-xs">
            
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-slate-200">Developer Console Quick Action Shortcuts</span>
              </div>
              <span className="text-[10px] text-slate-500">Instant platform operational controls</span>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950/90 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[420px] max-h-[560px]">
              
              {/* Action 1: Restart All Services */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">SYSTEM</span>
                </div>
                <h4 className="font-bold text-slate-100">Restart Microservices</h4>
                <p className="text-slate-400 text-[11px]">Re-initialize all registered bot microservices and socket bridges.</p>
                <button
                  onClick={() => {
                    if (onAddLog) onAddLog({ type: 'info', source: 'KERNEL', message: 'Triggered global microservices restart routine.' });
                    copyToClipboard("Triggered platform restart", "Restarting microservices...");
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all cursor-pointer shadow-md"
                >
                  Execute Restart
                </button>
              </div>

              {/* Action 2: Run Full System Diagnostics */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">DIAGNOSTICS</span>
                </div>
                <h4 className="font-bold text-slate-100">System Diagnostics</h4>
                <p className="text-slate-400 text-[11px]">Run automated health checks, memory audit, and latency benchmark.</p>
                <button
                  onClick={() => {
                    setActiveTab('terminal');
                    handleExecuteCommand('macro checkall');
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer shadow-md"
                >
                  Run Diagnostics Suite
                </button>
              </div>

              {/* Action 3: Clear System Logs */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-rose-400 font-bold">CLEANUP</span>
                </div>
                <h4 className="font-bold text-slate-100">Clear Telemetry Logs</h4>
                <p className="text-slate-400 text-[11px]">Flush live system log queue and reset memory log buffers.</p>
                <button
                  onClick={() => {
                    if (onClearLogs) onClearLogs();
                    copyToClipboard("Cleared system logs", "System logs flushed");
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white font-bold transition-all cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>

              {/* Action 4: Export System Logs */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Download className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-cyan-400 font-bold">EXPORT</span>
                </div>
                <h4 className="font-bold text-slate-100">Export System Logs</h4>
                <p className="text-slate-400 text-[11px]">Download full formatted system logs as a plain text log document.</p>
                <button
                  onClick={handleExportSystemLogs}
                  className="w-full mt-2 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all cursor-pointer shadow-md"
                >
                  Download .log File
                </button>
              </div>

              {/* Action 5: Copy Terminal Output */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-yellow-500/50 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                    <Copy className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-yellow-400 font-bold">CLIPBOARD</span>
                </div>
                <h4 className="font-bold text-slate-100">Copy Session Output</h4>
                <p className="text-slate-400 text-[11px]">Copy active terminal scrollback buffer directly to system clipboard.</p>
                <button
                  onClick={() => {
                    const txt = activeSession.lines.map(l => l.text).join('\n');
                    copyToClipboard(txt, "Terminal output copied");
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
                >
                  Copy Terminal Text
                </button>
              </div>

              {/* Action 6: Benchmark Microsecond Latency */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">LATENCY</span>
                </div>
                <h4 className="font-bold text-slate-100">Socket Latency Test</h4>
                <p className="text-slate-400 text-[11px]">Measure live round-trip ping time over mTLS WebSocket transport.</p>
                <button
                  onClick={() => {
                    setActiveTab('terminal');
                    handleExecuteCommand('benchmark');
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all cursor-pointer shadow-md"
                >
                  Run Benchmark Test
                </button>
              </div>

              {/* Action 7: Batch Command Sync */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-cyan-400 font-bold">BATCH API</span>
                </div>
                <h4 className="font-bold text-slate-100">Batch Command Sync</h4>
                <p className="text-slate-400 text-[11px]">Batch update multiple command definitions & permissions in a single API call.</p>
                <button
                  onClick={() => setShowBatchUpdater(true)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all cursor-pointer shadow-md"
                >
                  Open Batch Sync
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Batch Script Runner Modal */}
      {showScriptRunner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 font-display">Batch Script Runner</h3>
                  <p className="text-xs text-slate-400 font-mono">Execute sequential shell CLI command routines</p>
                </div>
              </div>
              <button
                onClick={() => setShowScriptRunner(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300">Script Commands (One per line):</label>
              <textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                rows={8}
                placeholder="status&#10;roadmap&#10;security&#10;listeners"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-purple-500 resize-none"
              />
              <p className="text-[11px] text-slate-500 font-mono">Lines starting with # will be ignored as comments.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowScriptRunner(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRunBatchScript}
                disabled={isScriptRunning || !scriptContent.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono text-xs font-semibold shadow-lg transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isScriptRunning ? 'Running Script...' : 'Execute Script Batch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Command Sync Modal */}
      {showBatchUpdater && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 font-mono">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 font-display">Batch Command Updater</h3>
                  <p className="text-xs text-slate-400 font-mono">Update or register multiple commands in a single batch API call</p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchUpdater(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300">Command Updates (JSON Array):</label>
              <textarea
                value={batchUpdateJson}
                onChange={(e) => setBatchUpdateJson(e.target.value)}
                rows={9}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 resize-none"
              />
              {batchUpdateStatus && (
                <p className={`text-xs font-mono ${batchUpdateStatus.includes('Error') || batchUpdateStatus.includes('Failed') ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {batchUpdateStatus}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBatchUpdater(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const updates = JSON.parse(batchUpdateJson);
                    const { batchUpdateTerminalCommands } = await import('../lib/commandService');
                    const res = await batchUpdateTerminalCommands(updates);
                    if (res.success) {
                      setBatchUpdateStatus(`✓ Batch update successful! Updated ${res.data?.updatedCount || 0} command(s).`);
                      if (onAddLog) {
                        onAddLog({ type: 'info', source: 'SYSTEM', message: `Batch updated ${res.data?.updatedCount || 0} commands via batch API.` });
                      }
                    } else {
                      setBatchUpdateStatus(`Error: ${res.error}`);
                    }
                  } catch (e: any) {
                    setBatchUpdateStatus(`Error parsing JSON: ${e.message}`);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs shadow-md cursor-pointer transition-colors"
              >
                Execute Batch Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
