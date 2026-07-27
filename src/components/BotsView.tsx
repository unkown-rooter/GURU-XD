import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot as BotIcon, 
  Smartphone, 
  Settings2, 
  Scan, 
  Play, 
  Square, 
  RotateCcw, 
  Plus, 
  Check, 
  X, 
  AlertTriangle,
  QrCode,
  Trash2,
  Settings,
  Cpu,
  Layers,
  Terminal,
  Sliders,
  Key,
  Blocks,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Server,
  Shield,
  Copy,
  MoreVertical,
  Download,
  Upload,
  Activity,
  HardDrive,
  Wifi,
  Globe,
  Users,
  MessageSquare,
  MessageCircle,
  FileText,
  RefreshCw,
  Lock,
  ShieldCheck,
  Zap,
  Award,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Database,
  Clock,
  Radio,
  Pause,
  Archive,
  Share2,
  Sparkles,
  Link2,
  Unlink,
  CheckCircle2,
  HelpCircle,
  Hash
} from 'lucide-react';
import { Bot, Plugin } from '../types';
import DeployWizardModal from './DeployWizardModal';

interface BotsViewProps {
  bots: Bot[];
  plugins?: Plugin[];
  onStartBot: (id: string) => void;
  onStopBot: (id: string) => void;
  onRestartBot: (id: string) => void;
  onDeployBot: (bot: Omit<Bot, 'id' | 'uptime' | 'memory' | 'cpu' | 'commandsCount' | 'version'>) => void;
  onUpdatePrefix: (id: string, prefix: string) => void;
  onUpdateBot: (id: string, updates: Partial<Bot>) => void;
  onDeleteBot: (id: string) => void;
  maintenanceMode?: boolean;
}

export default function BotsView({ 
  bots, 
  plugins = [],
  onStartBot, 
  onStopBot, 
  onRestartBot, 
  onDeployBot,
  onUpdatePrefix,
  onUpdateBot,
  onDeleteBot,
  maintenanceMode = false
}: BotsViewProps) {
  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [presetFilter, setPresetFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'cpu' | 'ram' | 'status' | 'created' | 'uptime'>('name');

  // Interactive UI Modal & Drawer States
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [showPluginsModal, setShowPluginsModal] = useState<boolean>(false);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [settingsBotId, setSettingsBotId] = useState<string | null>(null);
  const [quickMenuBotId, setQuickMenuBotId] = useState<string | null>(null);
  const [pairingDropdownBotId, setPairingDropdownBotId] = useState<string | null>(null);

  // Expanded View states per Instance
  const [expandedConsoleId, setExpandedConsoleId] = useState<string | null>(null);
  const [expandedInfoId, setExpandedInfoId] = useState<string | null>(null);

  // Live Console Log Stream state
  const [botLogsMap, setBotLogsMap] = useState<Record<string, Array<{ id: string; time: string; type: 'info' | 'warn' | 'error' | 'socket' | 'memory' | 'connection'; message: string }>>>({});
  const [consoleFilter, setConsoleFilter] = useState<string>('all');
  const [consoleSearch, setConsoleSearch] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Create Bot Wizard form states
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [newBotName, setNewBotName] = useState('');
  const [newBotPlatform, setNewBotPlatform] = useState<'WhatsApp' | 'Telegram' | 'Discord' | 'Slack'>('WhatsApp');
  const [newBotPrefix, setNewBotPrefix] = useState('.');
  const [newBotMemoryLimit, setNewBotMemoryLimit] = useState<number>(256);
  const [newBotCpuLimit, setNewBotCpuLimit] = useState<number>(50);
  const [newBotLogLevel, setNewBotLogLevel] = useState<'info' | 'warning' | 'error' | 'silent'>('info');
  const [newBotAutoRestart, setNewBotAutoRestart] = useState<boolean>(true);
  const [newBotAiResponder, setNewBotAiResponder] = useState<boolean>(false);

  // Environment Variables for Wizard & Settings
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: 'GEMINI_API_KEY', value: 'AIzaSyD_EXAMPLE_KEY_FOR_GEMINI_1' },
    { key: 'WHATSAPP_SESSION_NAME', value: 'guru_session' },
    { key: 'OWNER_NUMBER', value: '1234567890' }
  ]);
  const [tempKey, setTempKey] = useState('');
  const [tempValue, setTempValue] = useState('');
  const [selectedPluginIds, setSelectedPluginIds] = useState<string[]>([]);

  // Orchestrating terminal simulation animation states
  const [orchestrationTerminal, setOrchestrationTerminal] = useState<string[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState<boolean>(false);
  const [orchestrationComplete, setOrchestrationComplete] = useState<boolean>(false);

  // Pairing Modal States
  const [pairingMode, setPairingMode] = useState<'qr' | 'code' | 'reconnect' | 'info'>('qr');
  const [pairingStep, setPairingStep] = useState<'idle' | 'linking' | 'linked'>('idle');
  const [pairingCode, setPairingCode] = useState('');
  const [linkingStatusText, setLinkingStatusText] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrString, setQrString] = useState('');
  const [qrCountdown, setQrCountdown] = useState(20);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isRefreshingCode, setIsRefreshingCode] = useState(false);

  // Live Socket Log Simulation Loop for Running Instances
  useEffect(() => {
    const interval = setInterval(() => {
      bots.forEach((bot) => {
        if (bot.status === 'running') {
          const types: Array<'info' | 'warn' | 'error' | 'socket' | 'memory' | 'connection'> = ['info', 'socket', 'memory', 'connection', 'warn'];
          const randomType = types[Math.floor(Math.random() * types.length)];
          const timeStr = new Date().toLocaleTimeString();

          let msg = '';
          switch (randomType) {
            case 'socket':
              msg = `[WebSocket] Ping/Pong frame ACK received (${Math.floor(Math.random() * 20 + 10)}ms) - Session heartbeat active.`;
              break;
            case 'memory':
              msg = `[GC Monitor] Heap allocation: ${(Math.random() * 20 + 120).toFixed(1)}MB / Limit ${bot.memoryLimit || 512}MB. Buffer optimal.`;
              break;
            case 'connection':
              msg = `[Daemon Net] Inbound message payload processed from pool #${Math.floor(Math.random() * 900 + 100)}.`;
              break;
            case 'warn':
              msg = `[Rate Limiter] High transaction velocity detected on prefix '${bot.prefix}'. Throttle bucket at 12%.`;
              break;
            default:
              msg = `[Core Service] Command router executed trigger successfully. Active commands: ${bot.commandsCount}.`;
              break;
          }

          setBotLogsMap((prev) => {
            const existing = prev[bot.id] || [
              { id: '1', time: '11:00:00', type: 'info', message: `Daemon process started for ${bot.name} (${bot.platform})` },
              { id: '2', time: '11:00:01', type: 'connection', message: `Authentication token verified. Network socket opened.` }
            ];
            const newLog = { id: Math.random().toString(), time: timeStr, type: randomType, message: msg };
            return {
              ...prev,
              [bot.id]: [...existing.slice(-80), newLog]
            };
          });
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [bots]);

  // Auto-scroll console terminal to bottom
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [botLogsMap, expandedConsoleId, autoScroll]);

  // Pairing QR Timer Loop
  useEffect(() => {
    if (!showQRModal || pairingStep !== 'idle' || !selectedBot) return;

    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          setIsRefreshingCode(true);
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
          setPairingCode(`${code.slice(0, 4)}-${code.slice(4)}`);
          
          const randomPayload = `2@${Math.random().toString(36).substring(2, 15)},${Math.random().toString(36).substring(2, 15)},${selectedBot.id}`;
          setQrString(randomPayload);
          
          setTimeout(() => {
            setIsRefreshingCode(false);
          }, 400);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showQRModal, pairingStep, selectedBot]);

  // Reset Environment Variable Presets on Wizard Platform Change
  const resetEnvForPlatform = (platform: 'WhatsApp' | 'Telegram' | 'Discord' | 'Slack') => {
    setNewBotPlatform(platform);
    if (platform === 'WhatsApp') {
      setEnvVars([
        { key: 'GEMINI_API_KEY', value: 'AIzaSyD_EXAMPLE_KEY_FOR_GEMINI_1' },
        { key: 'WHATSAPP_SESSION_NAME', value: 'guru_session' },
        { key: 'OWNER_NUMBER', value: '1234567890' }
      ]);
      setNewBotPrefix('.');
    } else if (platform === 'Telegram') {
      setEnvVars([
        { key: 'GEMINI_API_KEY', value: 'AIzaSyD_EXAMPLE_KEY_FOR_GEMINI_1' },
        { key: 'TELEGRAM_BOT_TOKEN', value: '123456789:AAH_Example_Token' },
        { key: 'TELEGRAM_ADMIN_ID', value: '987654321' }
      ]);
      setNewBotPrefix('/');
    } else if (platform === 'Discord') {
      setEnvVars([
        { key: 'DISCORD_BOT_TOKEN', value: 'MTE5MjM4ND...ExampleToken' },
        { key: 'DISCORD_CLIENT_ID', value: '1192384912039' }
      ]);
      setNewBotPrefix('!');
    } else {
      setEnvVars([
        { key: 'SLACK_BOT_TOKEN', value: 'xoxb-example-slack-token' },
        { key: 'SLACK_SIGNING_SECRET', value: 'a1b2c3d4e5f6g7h8' }
      ]);
      setNewBotPrefix('/');
    }
  };

  const openCreateWizard = () => {
    setWizardStep(1);
    setNewBotName('');
    setNewBotPlatform('WhatsApp');
    setNewBotPrefix('.');
    setNewBotMemoryLimit(256);
    setNewBotCpuLimit(50);
    setNewBotLogLevel('info');
    setNewBotAutoRestart(true);
    setNewBotAiResponder(false);
    resetEnvForPlatform('WhatsApp');
    setSelectedPluginIds([]);
    setOrchestrationTerminal([]);
    setIsOrchestrating(false);
    setOrchestrationComplete(false);
    setShowCreateModal(true);
  };

  const openQR = (bot: Bot, mode: 'qr' | 'code' | 'reconnect' | 'info' = 'qr') => {
    setSelectedBot(bot);
    setPairingStep('idle');
    setPairingMode(mode);
    setPhoneNumber('');
    setPairingDropdownBotId(null);
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setPairingCode(`${code.slice(0, 4)}-${code.slice(4)}`);
    
    const randomPayload = `2@${Math.random().toString(36).substring(2, 12)},${Math.random().toString(36).substring(2, 12)},${bot.id}`;
    setQrString(randomPayload);
    setQrCountdown(20);
    setShowQRModal(true);
  };

  const startSimulatedPairing = () => {
    setPairingStep('linking');
    const steps = [
      'Establishing secure full-duplex socket handshake...',
      'Exchanging node public-key identity credentials...',
      'Verifying credential tokens & crypto signatures...',
      'Registering device metadata to daemon hypervisor...',
      'Synchronizing multi-device message transaction ledger...',
      'Device pairing completely authenticated! Cluster status: active.'
    ];
    let currentIdx = 0;
    setLinkingStatusText(steps[0]);

    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < steps.length) {
        setLinkingStatusText(steps[currentIdx]);
      } else {
        clearInterval(interval);
        setPairingStep('linked');
        if (selectedBot) {
          onUpdateBot(selectedBot.id, { status: 'running' });
        }
      }
    }, 700);
  };

  const handleCreateBotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    onDeployBot({
      name: newBotName,
      platform: newBotPlatform,
      prefix: newBotPrefix,
      status: 'stopped'
    });
    setShowCreateModal(false);
  };

  // Filter & Search Logic
  const filteredBots = bots.filter((bot) => {
    // Search query match
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = bot.name.toLowerCase().includes(q);
      const matchPhone = (bot.phone || '').toLowerCase().includes(q);
      const matchPlatform = bot.platform.toLowerCase().includes(q);
      const matchVersion = bot.version.toLowerCase().includes(q);
      const matchStatus = bot.status.toLowerCase().includes(q);
      const matchOwner = (bot.owner || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchPlatform && !matchVersion && !matchStatus && !matchOwner) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && bot.status !== statusFilter) {
      return false;
    }

    // Platform filter
    if (platformFilter !== 'all' && bot.platform !== platformFilter) {
      return false;
    }

    // Preset filter
    if (presetFilter === 'high_cpu' && bot.cpu <= 3.0) return false;
    if (presetFilter === 'high_ram' && parseInt(bot.memory || '0') <= 200) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'cpu') return b.cpu - a.cpu;
    if (sortBy === 'ram') return parseInt(b.memory || '0') - parseInt(a.memory || '0');
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    if (sortBy === 'uptime') return b.uptime.localeCompare(a.uptime);
    return 0;
  });

  // Export JSON Config function
  const handleExportConfig = (bot: Bot) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${bot.name.toLowerCase().replace(/\s+/g, '_')}_config.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Quick Health Strip metrics calculations
  const runningCount = bots.filter(b => b.status === 'running').length;
  const startingCount = bots.filter(b => b.status === 'starting' || b.status === 'restarting' || b.status === 'updating').length;
  const offlineCount = bots.filter(b => b.status === 'stopped' || b.status === 'suspended').length;
  
  const totalConnectedUsers = bots.reduce((acc, b) => acc + (b.connectedUsers || 0), 0) || 1274;
  const totalMessagesToday = bots.reduce((acc, b) => acc + (b.messagesToday || 0), 0) || 48293;
  const avgCpu = bots.length > 0 ? Math.round(bots.reduce((acc, b) => acc + (b.cpu || 0), 0) / bots.length) : 29;
  const avgRam = 63; // Enterprise cluster memory footprint

  // Helper badge color assigner for status
  const getStatusBadge = (status: Bot['status']) => {
    switch (status) {
      case 'running':
        return {
          label: 'RUNNING',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400 animate-pulse'
        };
      case 'starting':
        return {
          label: 'STARTING',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400 animate-ping'
        };
      case 'restarting':
        return {
          label: 'RESTARTING',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-400 animate-spin'
        };
      case 'updating':
        return {
          label: 'UPDATING',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400 animate-pulse'
        };
      case 'suspended':
        return {
          label: 'SUSPENDED',
          bg: 'bg-slate-800 text-slate-400 border-slate-700',
          dot: 'bg-slate-500'
        };
      case 'stopped':
      default:
        return {
          label: 'STOPPED',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500'
        };
    }
  };

  // Helper badge color assigner for platform
  const getPlatformBadge = (platform: Bot['platform']) => {
    switch (platform) {
      case 'WhatsApp':
        return {
          label: 'WhatsApp',
          bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
          icon: <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
        };
      case 'Telegram':
        return {
          label: 'Telegram',
          bg: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80',
          icon: <Radio className="w-3.5 h-3.5 text-cyan-400" />
        };
      case 'Discord':
        return {
          label: 'Discord',
          bg: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80',
          icon: <BotIcon className="w-3.5 h-3.5 text-indigo-400" />
        };
      case 'Slack':
        return {
          label: 'Slack',
          bg: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
          icon: <Hash className="w-3.5 h-3.5 text-amber-400" />
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tiny Quick Health Strip */}
      <div className="bg-slate-950/90 border border-slate-850 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 overflow-x-auto text-[11px] font-mono shadow-md backdrop-blur-md scrollbar-none">
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Quick Health:</span>
          </span>

          <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Running:</span>
            <strong className="text-emerald-400 font-bold">{runningCount}</strong>
          </span>

          <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-slate-400">Starting:</span>
            <strong className="text-amber-400 font-bold">{startingCount}</strong>
          </span>

          <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-400">Offline:</span>
            <strong className="text-rose-400 font-bold">{offlineCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-xs">💾</span>
            <span className="text-slate-400">RAM:</span>
            <strong className="text-purple-400 font-bold">{avgRam}%</strong>
          </span>

          <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-xs">⚡</span>
            <span className="text-slate-400">CPU:</span>
            <strong className="text-cyan-400 font-bold">{avgCpu}%</strong>
          </span>

          <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-xs">🌐</span>
            <span className="text-slate-400">Connected Devices:</span>
            <strong className="text-blue-400 font-bold">{totalConnectedUsers.toLocaleString()}</strong>
          </span>

          <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-xs">📨</span>
            <span className="text-slate-400">Messages Today:</span>
            <strong className="text-teal-400 font-bold">{totalMessagesToday.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <span>Hosted Core Node Instances</span>
              <span className="text-xs font-mono font-normal bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                {bots.length} Active
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise multi-tenant daemon hypervisor. Configure, pair, monitor, and scale automated messaging clusters.
          </p>
        </div>

        <button 
          onClick={openCreateWizard}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer self-start group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          <span>Deploy New Instance</span>
        </button>
      </div>

      {maintenanceMode && (
        <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl text-xs flex items-center justify-between text-rose-400 font-mono animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
            <span>
              <strong className="text-rose-300 font-sans font-bold uppercase">System-wide Lock:</strong> Maintenance mode active. Process spawning is frozen.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-[9px] uppercase font-sans font-bold">Locked</span>
        </div>
      )}

      {/* Control Toolbar: Search, Filters, & Sorting */}
      <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-2xl space-y-3 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bot Name, Phone, Platform, Version, Status, Owner..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2 relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="running">🟢 Running</option>
              <option value="stopped">🔴 Stopped</option>
              <option value="starting">🟡 Starting</option>
              <option value="restarting">🔵 Restarting</option>
              <option value="updating">🟣 Updating</option>
              <option value="suspended">⚪ Suspended</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Platform Filter */}
          <div className="md:col-span-2 relative">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none"
            >
              <option value="all">All Platforms</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Telegram">Telegram</option>
              <option value="Discord">Discord</option>
              <option value="Slack">Slack</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3 relative">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none"
              >
                <option value="name">Sort by Name (A-Z)</option>
                <option value="cpu">Sort by CPU Usage</option>
                <option value="ram">Sort by RAM Usage</option>
                <option value="status">Sort by Status</option>
                <option value="uptime">Sort by Uptime</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Filter Presets Pill Badges */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto text-[11px] font-mono scrollbar-none">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider shrink-0">Presets:</span>
          
          <button
            onClick={() => setPresetFilter('all')}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
              presetFilter === 'all' 
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-semibold' 
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            All Nodes ({bots.length})
          </button>

          <button
            onClick={() => setPresetFilter('high_cpu')}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              presetFilter === 'high_cpu' 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold' 
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3 h-3 text-amber-400" />
            <span>High CPU (&gt; 3.0%)</span>
          </button>

          <button
            onClick={() => setPresetFilter('high_ram')}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              presetFilter === 'high_ram' 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold' 
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3 text-purple-400" />
            <span>High RAM (&gt; 200 MB)</span>
          </button>

          {(searchQuery || statusFilter !== 'all' || platformFilter !== 'all' || presetFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPlatformFilter('all');
                setPresetFilter('all');
              }}
              className="text-rose-400 hover:text-rose-300 text-[10px] underline ml-auto shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredBots.length === 0 && (
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <BotIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No Instance Nodes Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or deploy a new instance.</p>
          </div>
          <button 
            onClick={openCreateWizard}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy Instance Now</span>
          </button>
        </div>
      )}

      {/* Instance Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredBots.map((bot) => {
          const isRunning = bot.status === 'running';
          const statusBadge = getStatusBadge(bot.status);
          const platformBadge = getPlatformBadge(bot.platform);

          // Resource percent calculations
          const memoryUsageMB = parseInt(bot.memory || '0');
          const maxMemoryMB = bot.memoryLimit || 512;
          const memoryPercent = Math.min(100, Math.round((memoryUsageMB / maxMemoryMB) * 100));

          const cpuUsage = bot.cpu || 0;
          const cpuPercent = Math.min(100, Math.round((cpuUsage / (bot.cpuLimit || 100)) * 100));

          const storagePercent = bot.storagePercent || 15;

          const isConsoleExpanded = expandedConsoleId === bot.id;
          const isInfoExpanded = expandedInfoId === bot.id;
          const isQuickMenuOpen = quickMenuBotId === bot.id;
          const isPairingDropdownOpen = pairingDropdownBotId === bot.id;

          const instanceLogs = botLogsMap[bot.id] || [
            { id: '1', time: '10:00:00', type: 'info', message: `Daemon process initialized for ${bot.name}` },
            { id: '2', time: '10:00:02', type: 'connection', message: `Full-duplex socket established.` }
          ];

          return (
            <div 
              key={bot.id} 
              className={`bg-slate-950/70 border rounded-2xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between group hover:border-blue-500/30 ${
                isRunning ? 'border-slate-800' : 'border-rose-950/50'
              }`}
            >
              {/* Card Top Header: Avatar, Name, Badges, Quick Action Menu */}
              <div className="p-5 border-b border-slate-900 bg-slate-900/40 relative">
                <div className="flex items-start justify-between gap-3">
                  {/* Avatar & Title */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
                        isRunning 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-2 ring-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        <BotIcon className="w-7 h-7" />
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 ${statusBadge.dot}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-slate-100 truncate tracking-tight">{bot.name}</h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${platformBadge.bg}`}>
                          {platformBadge.icon}
                          <span>{platformBadge.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] font-mono">
                        <span className="text-slate-400">{bot.version}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">Prefix: <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-300">{bot.prefix}</code></span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 truncate">ID: {bot.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Quick Action Menu Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${statusBadge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                      <span>{statusBadge.label}</span>
                    </span>

                    {/* Quick Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() => setQuickMenuBotId(isQuickMenuOpen ? null : bot.id)}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Quick Actions Menu"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Quick Action Dropdown Menu */}
                      {isQuickMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 font-sans text-xs">
                          <button 
                            onClick={() => {
                              onDeployBot({
                                name: `${bot.name} (Copy)`,
                                platform: bot.platform,
                                prefix: bot.prefix,
                                status: 'stopped'
                              });
                              setQuickMenuBotId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-blue-400" />
                            <span>Duplicate Instance</span>
                          </button>

                          <button 
                            onClick={() => {
                              handleExportConfig(bot);
                              setQuickMenuBotId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-teal-400" />
                            <span>Export Config</span>
                          </button>

                          <button 
                            onClick={() => {
                              setShowRestoreModal(true);
                              setQuickMenuBotId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            <span>Import Config</span>
                          </button>

                          <button 
                            onClick={() => {
                              openQR(bot, 'reconnect');
                              setQuickMenuBotId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Reset Session</span>
                          </button>

                          <button 
                            onClick={() => {
                              setSettingsBotId(bot.id);
                              setQuickMenuBotId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5 text-purple-400" />
                            <span>Rename / Config</span>
                          </button>

                          <div className="border-t border-slate-800 my-1" />

                          {isRunning ? (
                            <button 
                              onClick={() => {
                                onStopBot(bot.id);
                                setQuickMenuBotId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-amber-400 hover:bg-amber-500/10 text-left transition-colors cursor-pointer"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause Daemon</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                onStartBot(bot.id);
                                setQuickMenuBotId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-emerald-400 hover:bg-emerald-500/10 text-left transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Resume Daemon</span>
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              setConfirmDeleteId(bot.id);
                              setQuickMenuBotId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-left transition-colors cursor-pointer font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Instance</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body: Resource Section with Animated Progress Bars */}
              <div className="p-5 space-y-4">
                <div className="space-y-3 font-mono text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span>Resource Allocation & Load</span>
                  </span>

                  {/* CPU Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-emerald-400" />
                        <span>CPU Usage</span>
                      </span>
                      <span className="text-emerald-400 font-bold">{cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
                        style={{ width: `${Math.max(5, cpuPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* RAM Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-blue-400" />
                        <span>RAM Usage</span>
                      </span>
                      <span className="text-blue-400 font-bold">{bot.memory || '0 MB / 512 MB'}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-blue-500/50"
                        style={{ width: `${Math.max(5, memoryPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Storage Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-purple-400" />
                        <span>Storage Usage</span>
                      </span>
                      <span className="text-purple-400 font-bold">{bot.storageUsage || '1.4 GB / 10 GB'}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-purple-500/50"
                        style={{ width: `${Math.max(5, storagePercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Network Speed */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-amber-400" />
                      <span>Network I/O Speed</span>
                    </span>
                    <span className="text-slate-200">
                      ↓ <strong className="text-emerald-400">{bot.networkDown || '124.5 KB/s'}</strong> / ↑ <strong className="text-blue-400">{bot.networkUp || '48.2 KB/s'}</strong>
                    </span>
                  </div>
                </div>

                {/* Live Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">Uptime</span>
                    <span className="text-slate-200 font-semibold truncate block mt-0.5">{bot.uptime}</span>
                  </div>

                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">Latency Ping</span>
                    <span className="text-emerald-400 font-bold block mt-0.5">{bot.ping || 24} ms</span>
                  </div>

                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">Users</span>
                    <span className="text-slate-200 font-semibold block mt-0.5">{bot.connectedUsers || 1420}</span>
                  </div>

                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">Groups</span>
                    <span className="text-slate-200 font-semibold block mt-0.5">{bot.groupsCount || 88}</span>
                  </div>

                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">Private Chats</span>
                    <span className="text-slate-200 font-semibold block mt-0.5">{bot.privateChatsCount || 342}</span>
                  </div>

                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">Today Msgs</span>
                    <span className="text-blue-400 font-bold block mt-0.5">{bot.messagesToday || 18450}</span>
                  </div>

                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">Commands</span>
                    <span className="text-teal-400 font-bold block mt-0.5">{bot.commandsCount}</span>
                  </div>

                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">Errors Today</span>
                    <span className="text-amber-400 font-bold block mt-0.5">{bot.errorsCount || 0}</span>
                  </div>
                </div>

                {/* Security Badges Row */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>2FA</span>
                  </span>

                  <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>AES-256</span>
                  </span>

                  <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>

                  <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>Trusted</span>
                  </span>

                  <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Webhook Sec</span>
                  </span>

                  <span className="bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Rate Limited</span>
                  </span>
                </div>

                {/* Collapsible Bot Information Section Toggle */}
                <div className="pt-1">
                  <button
                    onClick={() => setExpandedInfoId(isInfoExpanded ? null : bot.id)}
                    className="w-full py-1.5 px-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-400" />
                      <span>Extended Metadata & Daemon Spec</span>
                    </span>
                    {isInfoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isInfoExpanded && (
                    <div className="mt-2 p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1.5 font-mono text-[11px] text-slate-300 animate-in fade-in duration-200">
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">Owner Identity:</span>
                        <span className="text-slate-100 font-semibold">{bot.owner || 'UNKNOWNROOTERG7'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">Phone Number:</span>
                        <span className="text-blue-400">{bot.phone || '+1 (555) 019-2834'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">Language Stack:</span>
                        <span className="text-teal-300">{bot.language || 'TypeScript / Node.js'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">Timezone:</span>
                        <span className="text-slate-300">{bot.timezone || 'UTC'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">Created Date:</span>
                        <span className="text-slate-300">{bot.createdDate || '2025-11-12'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">Last Restart:</span>
                        <span className="text-amber-400">{bot.lastRestart || '2026-07-24 14:22 UTC'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">Database Engine:</span>
                        <span className="text-purple-300">{bot.database || 'PostgreSQL v16.1'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-900 pb-1">
                        <span className="text-slate-500">Node Runtime:</span>
                        <span className="text-emerald-400">{bot.nodeVersion || 'v20.11.0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Baileys / Lib Version:</span>
                        <span className="text-cyan-300">{bot.baileysVersion || 'v6.6.0'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable Live Console Terminal Section */}
                {isConsoleExpanded && (
                  <div className="mt-3 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 font-mono text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="font-bold text-slate-100">Live Terminal Console: {bot.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAutoScroll(!autoScroll)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            autoScroll 
                              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40' 
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}
                        >
                          AutoScroll {autoScroll ? 'ON' : 'OFF'}
                        </button>

                        <button
                          onClick={() => {
                            const logsText = instanceLogs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
                            const blob = new Blob([logsText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${bot.name.toLowerCase()}_live_logs.log`;
                            a.click();
                          }}
                          title="Download Log File"
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setBotLogsMap(prev => ({ ...prev, [bot.id]: [] }));
                          }}
                          title="Clear Logs"
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Console Log Stream */}
                    <div className="h-44 overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-900 space-y-1.5 text-[11px] scrollbar-thin">
                      {instanceLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2 text-slate-300 leading-relaxed">
                          <span className="text-slate-600 shrink-0">[{log.time}]</span>
                          <span className={`px-1 rounded text-[9px] font-bold uppercase shrink-0 ${
                            log.type === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            log.type === 'warn' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            log.type === 'socket' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {log.type}
                          </span>
                          <span className="break-all">{log.message}</span>
                        </div>
                      ))}
                      <div ref={consoleEndRef} />
                    </div>
                  </div>
                )}
              </div>

              {/* Instance Actions Row: Icon Buttons with Tooltips, Hover Effects & Pairing Dropdown */}
              <div className="p-4 border-t border-slate-900 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2">
                {/* Pairing Dropdown Menu Button */}
                <div className="relative">
                  <button
                    onClick={() => setPairingDropdownBotId(isPairingDropdownOpen ? null : bot.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-300 hover:text-white font-mono text-xs font-semibold transition-all cursor-pointer shadow-md group"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Pairing &amp; Link</span>
                    <ChevronDown className="w-3 h-3 text-blue-400" />
                  </button>

                  {isPairingDropdownOpen && (
                    <div className="absolute left-0 bottom-full mb-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in duration-150 font-sans text-xs">
                      <button
                        onClick={() => openQR(bot, 'qr')}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pair via QR Code</span>
                      </button>

                      <button
                        onClick={() => openQR(bot, 'code')}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                        <span>Pair via Pairing Code</span>
                      </button>

                      <button
                        onClick={() => openQR(bot, 'reconnect')}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reconnect Instance</span>
                      </button>

                      <button
                        onClick={() => {
                          onUpdateBot(bot.id, { status: 'stopped' });
                          setPairingDropdownBotId(null);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Disconnect Session</span>
                      </button>

                      <div className="border-t border-slate-800 my-1" />

                      <button
                        onClick={() => openQR(bot, 'info')}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-left transition-colors cursor-pointer text-[11px]"
                      >
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span>Session Expiry Info</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Primary Action Icon Buttons */}
                <div className="flex items-center gap-1 flex-wrap">
                  {/* Start / Stop Toggle */}
                  {isRunning ? (
                    <button
                      onClick={() => onStopBot(bot.id)}
                      title="Stop Instance"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartBot(bot.id)}
                      title="Start Instance"
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Restart */}
                  <button
                    onClick={() => onRestartBot(bot.id)}
                    title="Restart Daemon"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Reload Stats */}
                  <button
                    onClick={() => {
                      onUpdateBot(bot.id, { 
                        cpu: parseFloat((Math.random() * 4 + 1).toFixed(1)),
                        ping: Math.floor(Math.random() * 20 + 15)
                      });
                    }}
                    title="Reload Metrics"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Logs Toggle */}
                  <button
                    onClick={() => setExpandedConsoleId(isConsoleExpanded ? null : bot.id)}
                    title="Live Logs Terminal"
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isConsoleExpanded 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                  </button>

                  {/* Security Modal */}
                  <button
                    onClick={() => {
                      setSelectedBot(bot);
                      setShowSecurityModal(true);
                    }}
                    title="Security Badges & Controls"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-400 hover:text-teal-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>

                  {/* API Keys */}
                  <button
                    onClick={() => {
                      setSelectedBot(bot);
                      setShowApiModal(true);
                    }}
                    title="API Keys & Webhooks"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-indigo-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>

                  {/* Plugins */}
                  <button
                    onClick={() => {
                      setSelectedBot(bot);
                      setShowPluginsModal(true);
                    }}
                    title="Instance Plugins"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-400 hover:text-purple-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Blocks className="w-3.5 h-3.5" />
                  </button>

                  {/* Backup */}
                  <button
                    onClick={() => handleExportConfig(bot)}
                    title="Download Backup Config"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 hover:text-blue-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Restore */}
                  <button
                    onClick={() => setShowRestoreModal(true)}
                    title="Restore Configuration"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setConfirmDeleteId(bot.id)}
                    title="Delete Instance"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 text-rose-400 hover:text-rose-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgraded Deploy New Instance Multi-Step Wizard Modal */}
      <DeployWizardModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onDeploy={(newBot) => {
          onDeployBot(newBot);
          setShowCreateModal(false);
        }}
      />

      {/* Pair Instance Modal */}
      {showQRModal && selectedBot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-400" />
                <span>Pairing Portal: {selectedBot.name}</span>
              </h3>
              <button onClick={() => setShowQRModal(false)} className="text-slate-500 hover:text-slate-300 p-1 rounded-lg">✕</button>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setPairingMode('qr')}
                className={`flex-1 py-1.5 text-center rounded-lg cursor-pointer ${pairingMode === 'qr' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
              >
                QR Code
              </button>
              <button
                onClick={() => setPairingMode('code')}
                className={`flex-1 py-1.5 text-center rounded-lg cursor-pointer ${pairingMode === 'code' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
              >
                Pairing Code
              </button>
            </div>

            {pairingMode === 'qr' && (
              <div className="text-center space-y-4 py-2">
                <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-slate-200">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`}
                    alt="Scan QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-slate-400">Scan this code in linked devices settings. Refreshes in {qrCountdown}s.</p>
                <button
                  onClick={startSimulatedPairing}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Simulate QR Scan Confirmation
                </button>
              </div>
            )}

            {pairingMode === 'code' && (
              <div className="space-y-4 py-2 font-mono text-xs">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-2">
                  <span className="text-slate-500 text-[10px] uppercase">Your 8-Digit Pairing Key</span>
                  <div className="text-2xl font-bold tracking-widest text-blue-400">{pairingCode}</div>
                </div>
                <button
                  onClick={startSimulatedPairing}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Verify Pairing Code &amp; Connect
                </button>
              </div>
            )}

            {pairingStep === 'linking' && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-mono text-blue-300 text-center space-y-2 animate-pulse">
                <p>{linkingStatusText}</p>
              </div>
            )}

            {pairingStep === 'linked' && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-300 text-center space-y-2">
                <p>✅ Device linked successfully! Daemon is online.</p>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full py-2 bg-emerald-600 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Modal */}
      {showSecurityModal && selectedBot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>Security Policies: {selectedBot.name}</span>
              </h3>
              <button onClick={() => setShowSecurityModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-300">Two-Factor Auth (2FA)</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-300">AES-256 Payload Encryption</span>
                <span className="text-emerald-400 font-bold">ENABLED</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-300">Webhook Signature Guard</span>
                <span className="text-emerald-400 font-bold">VERIFIED</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-300">Rate Limiter Bucket</span>
                <span className="text-teal-400 font-bold">100 req/min</span>
              </div>
            </div>

            <button
              onClick={() => setShowSecurityModal(false)}
              className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Security Reference
            </button>
          </div>
        </div>
      )}

      {/* API Modal */}
      {showApiModal && selectedBot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>API Endpoint Credentials</span>
              </h3>
              <button onClick={() => setShowApiModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Instance Webhook Endpoint</label>
                <input 
                  readOnly 
                  value={`https://api.guru-xd.internal/v1/bot/${selectedBot.id}/webhook`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-indigo-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Daemon Secret Key</label>
                <input 
                  readOnly 
                  value={`guru_live_sec_${selectedBot.id}_994827`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300"
                />
              </div>
            </div>

            <button
              onClick={() => setShowApiModal(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-100">Delete Instance Node?</h3>
              <p className="text-xs text-slate-400 mt-1">This will permanently terminate the daemon process and remove local session databases.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteBot(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-rose-500/20"
              >
                Yes, Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
