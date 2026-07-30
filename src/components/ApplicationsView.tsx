import React, { useState, useEffect } from 'react';
import { 
  AppWindow, 
  Plus, 
  Play, 
  Square, 
  RotateCw, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  HardDrive, 
  Globe, 
  Bot, 
  Terminal, 
  Layers, 
  Code2, 
  Zap, 
  X, 
  Sliders, 
  Key, 
  Trash2,
  Box,
  Radio,
  Sparkles,
  Eye,
  Brain,
  BarChart3,
  TrendingUp,
  Activity,
  ShieldCheck
} from 'lucide-react';
import AppIntelligenceDrawer from './AppIntelligenceDrawer';
import AIInsightsExperienceView from './AIInsightsExperienceView';
import { AppIntelligenceOverview } from '../types/appIntelligence';

export interface Application {
  id: string;
  name: string;
  type: 'WhatsApp Bot' | 'Telegram Bot' | 'Discord Bot' | 'Node.js App' | 'Express API' | 'Python App' | 'AI Agent' | 'Worker' | 'Docker Container';
  status: 'running' | 'stopped' | 'building' | 'error';
  uptime: string;
  memory: string;
  cpu: number;
  url?: string;
  repository?: string;
  envVars: Record<string, string>;
  replicaCount: number;
  region: string;
}

interface ApplicationsViewProps {
  applications: Application[];
  onCreateApp: (app: Omit<Application, 'id' | 'status' | 'uptime' | 'memory' | 'cpu'>) => void;
  onToggleStatus: (id: string) => void;
  onRestartApp: (id: string) => void;
  onDeleteApp: (id: string) => void;
}

export default function ApplicationsView({
  applications,
  onCreateApp,
  onToggleStatus,
  onRestartApp,
  onDeleteApp
}: ApplicationsViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'ai_insights'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  // Intelligence Layer 1 Drawer State
  const [inspectingIntelligenceApp, setInspectingIntelligenceApp] = useState<Application | null>(null);
  const [overview, setOverview] = useState<AppIntelligenceOverview | null>(null);

  // New App Form States
  const [appName, setAppName] = useState('');
  const [appType, setAppType] = useState<Application['type']>('Node.js App');
  const [appRepo, setAppRepo] = useState('');
  const [appRegion, setAppRegion] = useState('us-east-1 (N. Virginia)');
  const [appReplicas, setAppReplicas] = useState(1);
  const [envPairs, setEnvPairs] = useState<{ key: string; value: string }[]>([
    { key: 'NODE_ENV', value: 'production' },
    { key: 'PORT', value: '3000' }
  ]);

  useEffect(() => {
    fetchIntelligenceOverview();
  }, [applications.length]);

  const fetchIntelligenceOverview = async () => {
    try {
      const res = await fetch('/api/applications/intelligence/overview');
      if (res.ok) {
        const data = await res.json();
        if (data.overview) setOverview(data.overview);
      }
    } catch (err) {
      console.error("Error fetching intelligence overview:", err);
    }
  };

  const categories = ['All', 'Bots', 'Web Services', 'AI Agents', 'Workers & Docker'];

  const filterAppByType = (app: Application) => {
    if (selectedType === 'All') return true;
    if (selectedType === 'Bots') return app.type.includes('Bot');
    if (selectedType === 'Web Services') return ['Node.js App', 'Express API', 'Python App'].includes(app.type);
    if (selectedType === 'AI Agents') return app.type === 'AI Agent';
    if (selectedType === 'Workers & Docker') return ['Worker', 'Docker Container'].includes(app.type);
    return true;
  };

  const filteredApps = applications.filter((app) => {
    const matchesCategory = filterAppByType(app);
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;

    const envVarsRecord: Record<string, string> = {};
    envPairs.forEach((pair) => {
      if (pair.key.trim()) {
        envVarsRecord[pair.key.trim()] = pair.value;
      }
    });

    const newAppPayload = {
      name: appName.trim(),
      type: appType,
      repository: appRepo.trim() || 'github.com/guru-xd/app-template',
      envVars: envVarsRecord,
      replicaCount: appReplicas,
      region: appRegion
    };

    onCreateApp(newAppPayload);

    // Register with Layer 1 Intelligence
    const generatedId = `app-${Date.now()}`;
    fetch('/api/applications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: generatedId,
        name: newAppPayload.name,
        type: newAppPayload.type,
        repository: newAppPayload.repository,
        region: newAppPayload.region,
        replicaCount: newAppPayload.replicaCount
      })
    }).then(() => fetchIntelligenceOverview());

    setAppName('');
    setAppRepo('');
    setEnvPairs([{ key: 'NODE_ENV', value: 'production' }]);
    setShowCreateModal(false);
  };

  const handleToggleAppStatus = (id: string, name: string, currentStatus: string) => {
    onToggleStatus(id);
    const newStatus = currentStatus === 'running' ? 'stopped' : 'running';
    fetch(`/api/applications/${id}/record-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, status: newStatus, user: 'root-admin' })
    }).then(() => fetchIntelligenceOverview());
  };

  const handleRestartAppContainer = (id: string, name: string) => {
    onRestartApp(id);
    fetch(`/api/applications/${id}/record-restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, user: 'root-admin' })
    }).then(() => fetchIntelligenceOverview());
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <AppWindow className="w-6 h-6 text-blue-500" />
            <span>Cloud Applications & Agents</span>
          </h1>
          <p className="text-xs text-slate-400">Manage, scale, and monitor full-stack apps, AI agents, Discord/WhatsApp bots, and worker containers.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Applications List
            </button>
            <button
              onClick={() => setViewMode('ai_insights')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                viewMode === 'ai_insights'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Ecosystem Insights</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy App</span>
          </button>
        </div>
      </div>

      {/* Autonomous Operations & Insights Banner */}
      <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-slate-100 flex items-center gap-2">
                <span>Autonomous Operations Engine</span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  SYSTEM FULLY ACTIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">Safe automation policies, runtime security audits, multi-agent collaboration topologies, and autonomous ecosystem reflections.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] self-end md:self-center">
            <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Cluster Health Score: {overview?.clusterHealthScorePct || 98.4}%
            </span>
          </div>
        </div>

        {/* Operational Intelligence Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center font-mono text-xs">
          <div className="bg-slate-900/60 border border-emerald-500/20 p-3 rounded-xl">
            <span className="text-[9px] text-emerald-400 uppercase font-bold block">⚙️ Automate</span>
            <span className="text-xs font-bold text-slate-100">{overview?.activeAutomationsCount || 3} Safe Rules</span>
          </div>
          <div className="bg-slate-900/60 border border-rose-500/20 p-3 rounded-xl">
            <span className="text-[9px] text-rose-400 uppercase font-bold block">🛡 Protect</span>
            <span className="text-xs font-bold text-slate-100">Grade {overview?.securityGrade || 'A'} ({overview?.securityScore || 94})</span>
          </div>
          <div className="bg-slate-900/60 border border-blue-500/20 p-3 rounded-xl">
            <span className="text-[9px] text-blue-400 uppercase font-bold block">🤝 Agents</span>
            <span className="text-xs font-bold text-slate-100">{overview?.activeAgentsCount || 7} Swarm Active</span>
          </div>
          <div className="bg-slate-900/60 border border-amber-500/20 p-3 rounded-xl">
            <span className="text-[9px] text-amber-400 uppercase font-bold block">🔮 Predict</span>
            <span className="text-xs font-bold text-slate-100">{overview?.activePredictionsCount || 4} Risk Checks</span>
          </div>
          <div className="bg-slate-900/60 border border-purple-500/20 p-3 rounded-xl">
            <span className="text-[9px] text-purple-400 uppercase font-bold block">💡 Recommend</span>
            <span className="text-xs font-bold text-slate-100">{overview?.personalizedRecommendationsCount || 6} Recs</span>
          </div>
          <div className="bg-slate-900/60 border border-cyan-500/20 p-3 rounded-xl">
            <span className="text-[9px] text-cyan-400 uppercase font-bold block">🧠 Reflection</span>
            <span className="text-xs font-bold text-slate-100">{overview?.reflectionScorePct || 96.2}% Score</span>
          </div>
        </div>
      </div>

      {viewMode === 'ai_insights' ? (
        <AIInsightsExperienceView />
      ) : (
        <>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedType(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedType === cat 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid of Applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredApps.map((app) => (
          <div 
            key={app.id} 
            className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-slate-950/50 relative group"
          >
            {/* Top Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  {app.type.includes('Bot') && <Bot className="w-5 h-5" />}
                  {app.type.includes('App') && <Code2 className="w-5 h-5" />}
                  {app.type.includes('API') && <Zap className="w-5 h-5" />}
                  {app.type === 'AI Agent' && <Sparkles className="w-5 h-5 text-amber-400" />}
                  {app.type === 'Worker' && <Layers className="w-5 h-5" />}
                  {app.type === 'Docker Container' && <Box className="w-5 h-5 text-cyan-400" />}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                    {app.name}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    {app.type}
                  </span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1.5 border ${
                app.status === 'running' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : app.status === 'building'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'running' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                {app.status.toUpperCase()}
              </span>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850/60 text-center font-mono">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">CPU</span>
                <span className="text-xs font-semibold text-slate-200">{app.cpu}%</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">RAM</span>
                <span className="text-xs font-semibold text-slate-200">{app.memory}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Uptime</span>
                <span className="text-xs font-semibold text-slate-200">{app.uptime}</span>
              </div>
            </div>

            {/* Application Meta */}
            <div className="space-y-1.5 text-xs text-slate-400 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Region:</span>
                <span className="text-slate-300">{app.region}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Replicas:</span>
                <span className="text-slate-300">{app.replicaCount} Container Instance</span>
              </div>
              {app.repository && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Source:</span>
                  <span className="text-blue-400 hover:underline truncate max-w-[160px]">{app.repository}</span>
                </div>
              )}
            </div>

            {/* Layer 1 Intelligence Inspector Button */}
            <button
              onClick={() => setInspectingIntelligenceApp(app)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-amber-600/10 hover:from-blue-600/20 hover:via-purple-600/20 hover:to-amber-600/20 text-slate-200 border border-slate-750 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Layer 1 Intelligence & Insights</span>
            </button>

            {/* Actions Bar */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleAppStatus(app.id, app.name, app.status)}
                  title={app.status === 'running' ? 'Stop Container' : 'Start Container'}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    app.status === 'running' 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                >
                  {app.status === 'running' ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleRestartAppContainer(app.id, app.name)}
                  title="Restart App Container"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setSelectedApp(app)}
                  title="Environment Variables & Config"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                {app.url && (
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>Open URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => onDeleteApp(app.id)}
                  title="Delete Application"
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      </>
      )}

      {/* Application Operations & Insights Drawer */}
      {inspectingIntelligenceApp && (
        <AppIntelligenceDrawer
          app={inspectingIntelligenceApp}
          onClose={() => setInspectingIntelligenceApp(null)}
          onRestartApp={(id) => handleRestartAppContainer(id, inspectingIntelligenceApp.name)}
          onToggleStatus={(id) => handleToggleAppStatus(id, inspectingIntelligenceApp.name, inspectingIntelligenceApp.status)}
        />
      )}

      {/* Create Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <AppWindow className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-100">Deploy New Application</h2>
                  <p className="text-xs text-slate-400">Select stack, environment variables, and deployment region</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Application Name</label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. trading-bot-api, whatsapp-support-agent"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Runtime Stack</label>
                  <select
                    value={appType}
                    onChange={(e) => setAppType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="WhatsApp Bot">WhatsApp Bot (Baileys/WA-Web)</option>
                    <option value="Telegram Bot">Telegram Bot (Grammy/Telegraf)</option>
                    <option value="Discord Bot">Discord Bot (Discord.js)</option>
                    <option value="Node.js App">Node.js Service</option>
                    <option value="Express API">Express API Server</option>
                    <option value="Python App">Python (FastAPI / Flask)</option>
                    <option value="AI Agent">Gemini / LangChain AI Agent</option>
                    <option value="Worker">Background Queue Worker</option>
                    <option value="Docker Container">Custom Dockerfile Container</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Deployment Region</label>
                  <select
                    value={appRegion}
                    onChange={(e) => setAppRegion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="us-east-1 (N. Virginia)">us-east-1 (N. Virginia)</option>
                    <option value="eu-west-2 (London)">eu-west-2 (London)</option>
                    <option value="ap-south-1 (Mumbai)">ap-south-1 (Mumbai)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Git Repository URL</label>
                <input
                  type="text"
                  value={appRepo}
                  onChange={(e) => setAppRepo(e.target.value)}
                  placeholder="https://github.com/org/repo.git"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              {/* Environment Variables */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Environment Variables</span>
                  <button
                    type="button"
                    onClick={() => setEnvPairs([...envPairs, { key: '', value: '' }])}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variable</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {envPairs.map((pair, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="KEY"
                        value={pair.key}
                        onChange={(e) => {
                          const newPairs = [...envPairs];
                          newPairs[index].key = e.target.value;
                          setEnvPairs(newPairs);
                        }}
                        className="w-1/2 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="VALUE"
                        value={pair.value}
                        onChange={(e) => {
                          const newPairs = [...envPairs];
                          newPairs[index].value = e.target.value;
                          setEnvPairs(newPairs);
                        }}
                        className="w-1/2 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setEnvPairs(envPairs.filter((_, idx) => idx !== index))}
                        className="text-slate-500 hover:text-rose-400 p-2 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-colors cursor-pointer"
                >
                  Deploy Container Cluster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected App Config Drawer Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-100">{selectedApp.name} Configuration</h3>
                <p className="text-xs text-slate-400">{selectedApp.type} • {selectedApp.region}</p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <span className="text-slate-400 block font-sans font-semibold">Active Environment Variables</span>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(selectedApp.envVars || {}).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center text-[11px]">
                    <span className="text-blue-400 font-bold">{key}</span>
                    <span className="text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded truncate max-w-[200px]">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

