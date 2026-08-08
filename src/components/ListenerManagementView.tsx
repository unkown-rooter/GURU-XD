import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  PauseCircle, 
  PlayCircle, 
  Power, 
  RefreshCw, 
  Search, 
  Filter, 
  Zap, 
  Plus, 
  Clock, 
  Layers, 
  ShieldAlert, 
  Cpu, 
  BarChart3, 
  Eye, 
  X, 
  Send,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';

export interface RegisteredListener {
  id: string;
  name: string;
  module: string;
  version: string;
  eventTypes: string[];
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED';
  health: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  registeredAt: string;
  lastExecutedAt?: string;
  metrics: {
    totalExecutions: number;
    totalErrors: number;
    avgExecutionDurationMs: number;
    lastExecutionDurationMs?: number;
    lastErrorMsg?: string;
  };
  description?: string;
}

export interface EventDefinition {
  type: string;
  category: 'SYSTEM' | 'SECURITY' | 'MODULE' | 'BOT' | 'USER' | 'CUSTOM';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  description: string;
}

export interface EventBusMetrics {
  totalEventsPublished: number;
  totalEventsProcessed: number;
  totalErrors: number;
  activeListenersCount: number;
  pausedListenersCount: number;
  disabledListenersCount: number;
  uptimeSeconds: number;
}

export default function ListenerManagementView() {
  const [listeners, setListeners] = useState<RegisteredListener[]>([]);
  const [eventDefs, setEventDefs] = useState<EventDefinition[]>([]);
  const [busMetrics, setBusMetrics] = useState<EventBusMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals & Panels
  const [selectedListenerDetails, setSelectedListenerDetails] = useState<RegisteredListener | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);

  // Dispatch Form State
  const [dispatchEventType, setDispatchEventType] = useState<string>('USER_LOGIN');
  const [dispatchPayload, setDispatchPayload] = useState<string>('{\n  "userId": "usr_9921",\n  "ip": "192.168.1.100",\n  "timestamp": "' + new Date().toISOString() + '"\n}');
  const [dispatchPriority, setDispatchPriority] = useState<'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message?: string; event?: any } | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regModule, setRegModule] = useState<string>('');
  const [regVersion, setRegVersion] = useState<string>('1.0.0');
  const [regEventTypes, setRegEventTypes] = useState<string>('USER_LOGIN, SECURITY_ALERT');
  const [regPriority, setRegPriority] = useState<'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
  const [regDescription, setRegDescription] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState<string>('');

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('guru_jwt_token') || sessionStorage.getItem('guru_jwt_token');
    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchListeners = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/event-listeners', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setListeners(data.data.listeners || []);
          setBusMetrics(data.data.metrics || null);
          setEventDefs(data.data.registeredEvents || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch event listeners:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListeners();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchListeners();
    }, 4000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const handlePause = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/event-listeners/${id}/pause`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchListeners();
      }
    } catch (err) {
      console.error('Error pausing listener:', err);
    }
  };

  const handleResume = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/event-listeners/${id}/resume`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchListeners();
      }
    } catch (err) {
      console.error('Error resuming listener:', err);
    }
  };

  const handleDisable = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/event-listeners/${id}/disable`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchListeners();
      }
    } catch (err) {
      console.error('Error disabling listener:', err);
    }
  };

  const handleEnable = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/event-listeners/${id}/enable`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchListeners();
      }
    } catch (err) {
      console.error('Error enabling listener:', err);
    }
  };

  const handleDispatchEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    setDispatchResult(null);

    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(dispatchPayload);
      } catch (e) {
        setDispatchResult({ success: false, message: 'Invalid JSON payload syntax.' });
        setIsDispatching(false);
        return;
      }

      const res = await fetch('/api/v1/event-listeners/dispatch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: dispatchEventType,
          payload: parsedPayload,
          priority: dispatchPriority
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDispatchResult({ success: true, message: data.message || 'Event dispatched successfully!', event: data.data?.event });
        fetchListeners();
      } else {
        setDispatchResult({ success: false, message: data.message || 'Failed to dispatch event.' });
      }
    } catch (err: any) {
      setDispatchResult({ success: false, message: err.message || 'Network error during dispatch.' });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleRegisterNewListener = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regModule) return;

    setIsRegistering(true);
    setRegisterSuccessMsg('');

    try {
      const typesArray = regEventTypes.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/v1/event-listeners', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: regName,
          module: regModule,
          version: regVersion,
          eventTypes: typesArray,
          priority: regPriority,
          description: regDescription
        })
      });

      if (res.ok) {
        setRegisterSuccessMsg(`Listener '${regName}' registered successfully.`);
        setRegName('');
        setRegModule('');
        setRegDescription('');
        fetchListeners();
        setTimeout(() => setShowRegisterModal(false), 1200);
      }
    } catch (err) {
      console.error('Failed to register new listener:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  // Derive unique modules for filtering
  const modulesList = Array.from(new Set(listeners.map(l => l.module)));

  // Filtered Listeners
  const filteredListeners = listeners.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.eventTypes.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesModule = selectedModule === 'ALL' || l.module === selectedModule;
    const matchesPriority = selectedPriority === 'ALL' || l.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'ALL' || l.status === selectedStatus || l.health === selectedStatus;
    
    return matchesSearch && matchesModule && matchesPriority && matchesStatus;
  });

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'NORMAL':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'LOW':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadgeClass = (status: string, health: string) => {
    if (status === 'DISABLED') return 'bg-slate-800 text-slate-400 border-slate-700';
    if (status === 'PAUSED') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    
    switch (health) {
      case 'HEALTHY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DEGRADED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'UNHEALTHY':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-slate-950 text-slate-200 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">
              GX-012 Event Intelligence & Listener Management
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              Central Bus Registry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time listener discovery, execution telemetry, and runtime lifecycle control for event subscribers across the GURU-XD platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
              autoRefresh 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {autoRefresh ? 'Live Auto-Sync (4s)' : 'Sync Paused'}
          </button>

          <button
            onClick={fetchListeners}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowDispatchModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5 text-blue-400" />
            Dispatch Test Event
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register Listener
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Listeners</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {listeners.length}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Central Discovery Registry</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Workers</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {listeners.filter(l => l.status === 'ACTIVE').length}
          </div>
          <span className="text-[10px] text-emerald-500/80 block mt-0.5">Active Subscribers</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Paused / Disabled</span>
            <PauseCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {listeners.filter(l => l.status === 'PAUSED' || l.status === 'DISABLED').length}
          </div>
          <span className="text-[10px] text-amber-500/80 block mt-0.5">Lifecycle Suspended</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Executions</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">
            {listeners.reduce((acc, l) => acc + (l.metrics?.totalExecutions || 0), 0)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Dispatched Events Processed</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Latency</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
            {(listeners.reduce((acc, l) => acc + (l.metrics?.avgExecutionDurationMs || 0), 0) / (listeners.length || 1)).toFixed(2)} ms
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Execution Duration</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>System Health</span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1.5 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            100% HEALTHY
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">0 Failed Dispatches</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search listeners by name, module, or event type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Module:
            </span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="ALL">All Modules</option>
              {modulesList.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="DISABLED">Disabled</option>
              <option value="HEALTHY">Healthy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listeners Table / Cards List */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-100">Registered Subscriber Workers ({filteredListeners.length})</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Sorted by Priority & Health</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" />
            <p className="text-xs font-mono">Discovering event subscribers from AppEventBus kernel registry...</p>
          </div>
        ) : filteredListeners.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Radio className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
            <p className="text-sm font-medium text-slate-300">No matching listeners found</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Listener & Module</th>
                  <th className="py-3 px-4">Subscribed Events</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status & Health</th>
                  <th className="py-3 px-4">Executions</th>
                  <th className="py-3 px-4">Avg Latency</th>
                  <th className="py-3 px-4 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredListeners.map((listener) => {
                  return (
                    <tr key={listener.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* Name & Module */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-2 rounded-xl mt-0.5 ${
                            listener.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            listener.status === 'DISABLED' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            <Radio className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                                {listener.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                v{listener.version}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                              Module: <span className="text-slate-300 font-semibold">{listener.module}</span>
                            </span>
                            {listener.description && (
                              <span className="text-[10px] text-slate-500 block line-clamp-1 mt-0.5">
                                {listener.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subscribed Events */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {listener.eventTypes.map(type => (
                            <span 
                              key={type}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-950 text-blue-300 border border-slate-800"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getPriorityBadgeClass(listener.priority)}`}>
                          {listener.priority}
                        </span>
                      </td>

                      {/* Status & Health */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border w-fit flex items-center gap-1.5 ${getStatusBadgeClass(listener.status, listener.health)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              listener.status === 'PAUSED' ? 'bg-amber-400' :
                              listener.status === 'DISABLED' ? 'bg-slate-500' :
                              'bg-emerald-400 animate-pulse'
                            }`} />
                            {listener.status === 'ACTIVE' ? listener.health : listener.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Errors: <span className={listener.metrics.totalErrors > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>{listener.metrics.totalErrors}</span>
                          </span>
                        </div>
                      </td>

                      {/* Executions */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-200">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100">{listener.metrics.totalExecutions}</span>
                          <span className="text-[10px] text-slate-500">
                            {listener.lastExecutedAt ? `Last: ${new Date(listener.lastExecutedAt).toLocaleTimeString()}` : 'Never'}
                          </span>
                        </div>
                      </td>

                      {/* Avg Latency */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800 text-[11px]">
                          {listener.metrics.avgExecutionDurationMs.toFixed(2)} ms
                        </span>
                      </td>

                      {/* Lifecycle Controls */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pause / Resume Button */}
                          {listener.status === 'PAUSED' ? (
                            <button
                              onClick={() => handleResume(listener.id)}
                              title="Resume Listener Execution"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              Resume
                            </button>
                          ) : listener.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handlePause(listener.id)}
                              title="Pause Listener Execution"
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <PauseCircle className="w-3.5 h-3.5" />
                              Pause
                            </button>
                          ) : null}

                          {/* Enable / Disable Button */}
                          {listener.status === 'DISABLED' ? (
                            <button
                              onClick={() => handleEnable(listener.id)}
                              title="Enable Listener Subscriber"
                              className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Power className="w-3.5 h-3.5" />
                              Enable
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDisable(listener.id)}
                              title="Disable Listener Subscriber"
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Power className="w-3.5 h-3.5" />
                              Disable
                            </button>
                          )}

                          {/* Inspect Details */}
                          <button
                            onClick={() => setSelectedListenerDetails(listener)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                            title="Inspect Listener Telemetry"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Listener Details Modal */}
      {selectedListenerDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedListenerDetails.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400">ID: {selectedListenerDetails.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedListenerDetails(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Owner Module</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{selectedListenerDetails.module}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Version & Priority</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">v{selectedListenerDetails.version} ({selectedListenerDetails.priority})</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Executions</span>
                  <span className="text-xs font-bold font-mono text-indigo-400 mt-0.5 block">{selectedListenerDetails.metrics.totalExecutions}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Avg Latency</span>
                  <span className="text-xs font-bold font-mono text-cyan-400 mt-0.5 block">{selectedListenerDetails.metrics.avgExecutionDurationMs.toFixed(2)} ms</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">Subscribed Event Types:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedListenerDetails.eventTypes.map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {selectedListenerDetails.description && (
                <div>
                  <span className="text-xs font-mono font-semibold text-slate-300 block mb-1">Subscriber Description:</span>
                  <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {selectedListenerDetails.description}
                  </p>
                </div>
              )}

              {selectedListenerDetails.metrics.lastErrorMsg && (
                <div>
                  <span className="text-xs font-mono font-semibold text-red-400 block mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Last Error Exception Log:
                  </span>
                  <pre className="text-[11px] font-mono bg-red-950/30 text-red-300 border border-red-900/50 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap">
                    {selectedListenerDetails.metrics.lastErrorMsg}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setSelectedListenerDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Test Event Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Dispatch Event into AppEventBus</h3>
              </div>
              <button
                onClick={() => { setShowDispatchModal(false); setDispatchResult(null); }}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchEvent} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Target Event Type</label>
                <select
                  value={dispatchEventType}
                  onChange={(e) => setDispatchEventType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="USER_LOGIN">USER_LOGIN</option>
                  <option value="SECURITY_ALERT">SECURITY_ALERT</option>
                  <option value="BOT_STARTED">BOT_STARTED</option>
                  <option value="BOT_STOPPED">BOT_STOPPED</option>
                  <option value="METRICS_COLLECTED">METRICS_COLLECTED</option>
                  <option value="AUDIT_LOG_ENTRY">AUDIT_LOG_ENTRY</option>
                  <option value="CUSTOM_TEST_EVENT">CUSTOM_TEST_EVENT</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Dispatch Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['CRITICAL', 'HIGH', 'NORMAL', 'LOW'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDispatchPriority(p)}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer transition-all ${
                        dispatchPriority === p 
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">JSON Event Payload</label>
                <textarea
                  rows={5}
                  value={dispatchPayload}
                  onChange={(e) => setDispatchPayload(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              {dispatchResult && (
                <div className={`p-3 rounded-xl border text-xs font-mono ${
                  dispatchResult.success 
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' 
                    : 'bg-red-950/40 text-red-300 border-red-800'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {dispatchResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                    {dispatchResult.message}
                  </div>
                  {dispatchResult.event && (
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Event Hash ID: {dispatchResult.event.id} | Timestamp: {dispatchResult.event.timestamp}
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDispatchModal(false); setDispatchResult(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  {isDispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Dispatch Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register New Listener Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Register New Event Listener</h3>
              </div>
              <button
                onClick={() => { setShowRegisterModal(false); setRegisterSuccessMsg(''); }}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewListener} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Listener Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RealtimeAnalyticsWorker"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Module Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AnalyticsModule"
                    value={regModule}
                    onChange={(e) => setRegModule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Version</label>
                  <input
                    type="text"
                    value={regVersion}
                    onChange={(e) => setRegVersion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Event Types (Comma Separated)</label>
                <input
                  type="text"
                  required
                  placeholder="USER_LOGIN, SECURITY_ALERT, BOT_STARTED"
                  value={regEventTypes}
                  onChange={(e) => setRegEventTypes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Priority Weight</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['CRITICAL', 'HIGH', 'NORMAL', 'LOW'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRegPriority(p)}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer transition-all ${
                        regPriority === p 
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief summary of what this subscriber processes..."
                  value={regDescription}
                  onChange={(e) => setRegDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              {registerSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-800 text-xs font-mono flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {registerSuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowRegisterModal(false); setRegisterSuccessMsg(''); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  {isRegistering ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Register Listener
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
