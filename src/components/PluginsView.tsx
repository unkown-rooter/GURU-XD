import React, { useState } from 'react';
import { 
  Blocks, 
  Search, 
  Download, 
  Star, 
  Check, 
  Plus, 
  Trash2,
  RefreshCw,
  Settings,
  PlusCircle,
  Code,
  Terminal,
  ChevronDown,
  X,
  AlertTriangle,
  Info,
  ShoppingCart,
  ShieldCheck,
  Power,
  UploadCloud,
  Sparkles
} from 'lucide-react';
import { Plugin } from '../types';

export interface ExtendedPlugin extends Plugin {
  compatibility?: string;
  reviewsCount?: number;
  license?: string;
  updateStatus?: 'Up to date' | 'Update Available';
  price?: string;
  enabled?: boolean;
}

interface PluginsViewProps {
  plugins: Plugin[];
  onInstallPlugin: (id: string) => void;
  onUninstallPlugin: (id: string) => void;
  onCreatePlugin: (newPlg: Omit<Plugin, 'id' | 'rating' | 'downloads' | 'installed' | 'customSettings'>) => void;
  onDeletePlugin: (id: string) => void;
  onUpdatePlugin: (id: string, updates: Partial<Plugin>) => void;
}

export default function PluginsView({ 
  plugins, 
  onInstallPlugin, 
  onUninstallPlugin,
  onCreatePlugin,
  onDeletePlugin,
  onUpdatePlugin
}: PluginsViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Plugin state tracking for enables/updates
  const [enabledState, setEnabledState] = useState<Record<string, boolean>>({
    'plg-1': true,
    'plg-2': true,
    'plg-3': false
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [configPluginId, setConfigPluginId] = useState<string | null>(null);
  
  // Custom addon creation states
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginDesc, setNewPluginDesc] = useState('');
  const [newPluginCat, setNewPluginCat] = useState<'Admin' | 'Entertainment' | 'Automation' | 'Integrations'>('Automation');
  const [newPluginAuthor, setNewPluginAuthor] = useState('');
  const [newPluginCode, setNewPluginCode] = useState('// Entry point for custom marketplace plugin\nmodule.exports = async (context) => {\n  const { message, bot } = context;\n  if (message.body === ".ping") {\n    await message.reply("Pong from GURU-XD Plugin SDK!");\n  }\n};');
  const [newPluginSchema, setNewPluginSchema] = useState('API_KEY=Your Third-Party Auth Token\nCOOLDOWN_SEC=5');

  // Key-value editor states for configured plugin
  const [settingsKeys, setSettingsKeys] = useState<{ key: string; value: string }[]>([]);

  const categories = ['All', 'Admin', 'Automation', 'Entertainment', 'Integrations', 'Premium Marketplace'];

  const extendedPluginsList: ExtendedPlugin[] = plugins.map((p, idx) => ({
    ...p,
    compatibility: idx % 2 === 0 ? 'Node.js 20+ • Baileys v6.5' : 'Telegram MTProto • Python 3.11',
    reviewsCount: 12 + idx * 7,
    license: idx === 1 ? 'Proprietary' : 'MIT License',
    updateStatus: idx === 0 ? 'Update Available' : 'Up to date',
    price: idx === 1 ? '$9.99' : 'Free',
    enabled: enabledState[p.id] !== undefined ? enabledState[p.id] : p.installed
  }));

  const filteredPlugins = extendedPluginsList.filter((plg) => {
    if (activeCategory === 'Premium Marketplace') return plg.price !== 'Free';
    const matchesCat = activeCategory === 'All' || plg.category === activeCategory;
    const matchesSearch = plg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          plg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          plg.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleToggleInstall = (id: string, isInstalled: boolean) => {
    setLoadingId(id);
    setTimeout(() => {
      if (isInstalled) {
        onUninstallPlugin(id);
      } else {
        onInstallPlugin(id);
      }
      setLoadingId(null);
    }, 800);
  };

  const handleToggleEnable = (id: string) => {
    setEnabledState(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleUpdatePluginVersion = (plg: Plugin) => {
    setLoadingId(plg.id);
    setTimeout(() => {
      onUpdatePlugin(plg.id, { version: '2.5.0' });
      setLoadingId(null);
    }, 1000);
  };

  const handleOpenConfig = (plg: Plugin) => {
    setConfigPluginId(plg.id);
    const entries = Object.entries(plg.customSettings || {});
    if (entries.length > 0) {
      setSettingsKeys(entries.map(([key, value]) => ({ key, value })));
    } else {
      const defaultKeys = (plg.configSchema || 'API_KEY=\nCOOLDOWN_SEC=')
        .split('\n')
        .map(line => {
          const parts = line.split('=');
          return { key: parts[0] || 'CONFIG_VAR', value: parts[1] || '' };
        });
      setSettingsKeys(defaultKeys);
    }
  };

  const handleSaveConfig = (id: string) => {
    const configRecord: Record<string, string> = {};
    settingsKeys.forEach((item) => {
      if (item.key.trim()) {
        configRecord[item.key.trim()] = item.value;
      }
    });
    onUpdatePlugin(id, { customSettings: configRecord });
    setConfigPluginId(null);
  };

  const handleCreatePluginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPluginName.trim() || !newPluginAuthor.trim()) return;

    onCreatePlugin({
      name: newPluginName,
      description: newPluginDesc,
      category: newPluginCat,
      author: newPluginAuthor,
      version: '1.0.0',
      code: newPluginCode,
      configSchema: newPluginSchema
    });

    setNewPluginName('');
    setNewPluginDesc('');
    setNewPluginCat('Automation');
    setNewPluginAuthor('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Blocks className="w-6 h-6 text-blue-500" />
            <span>Plugin Marketplace</span>
          </h1>
          <p className="text-xs text-slate-400">Discover, install, configure, purchase, and publish extensions for GURU-XD bots and microservices.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer self-start shadow-lg shadow-blue-600/20"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Publish Plugin</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
                activeCategory === cat 
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20' 
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search Marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-500 font-mono"
          />
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlugins.map((plg) => {
          const isLoading = loadingId === plg.id;
          const isConfiguring = configPluginId === plg.id;

          return (
            <div 
              key={plg.id}
              className={`p-5 rounded-2xl bg-slate-900/60 border flex flex-col justify-between transition-all duration-300 space-y-4 hover:shadow-xl hover:shadow-slate-950/50 ${
                plg.installed 
                  ? 'border-blue-500/40 shadow-lg shadow-blue-500/10' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Plugin Card Top Bar */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                      plg.installed 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}>
                      <Blocks className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>{plg.name}</span>
                        {plg.price !== 'Free' && (
                          <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">
                            PREMIUM
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">by {plg.author}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-full uppercase">
                    {plg.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {plg.description}
                </p>

                {/* Compatibility & Ratings metadata */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Rating:</span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{plg.rating}</span>
                      <span className="text-slate-500 text-[10px]">({plg.reviewsCount} reviews)</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Downloads:</span>
                    <span className="text-slate-200">{plg.downloads}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Version / Compatibility:</span>
                    <span className="text-slate-300 text-[10px]">{plg.version} • {plg.compatibility}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">License:</span>
                    <span className="text-slate-400">{plg.license}</span>
                  </div>
                </div>

                {/* Config Editor inside card */}
                {isConfiguring && (
                  <div className="space-y-3 font-mono text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-xs text-blue-400 font-bold flex items-center gap-1">
                        <Settings className="w-3.5 h-3.5" /> Configure Variables
                      </span>
                      <button 
                        onClick={() => setConfigPluginId(null)}
                        className="text-slate-500 hover:text-slate-300 text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {settingsKeys.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <input 
                            type="text"
                            value={item.key}
                            onChange={(e) => {
                              const newKeys = [...settingsKeys];
                              newKeys[idx].key = e.target.value;
                              setSettingsKeys(newKeys);
                            }}
                            className="w-1/2 bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200"
                          />
                          <input 
                            type="text"
                            value={item.value}
                            onChange={(e) => {
                              const newKeys = [...settingsKeys];
                              newKeys[idx].value = e.target.value;
                              setSettingsKeys(newKeys);
                            }}
                            className="w-1/2 bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSaveConfig(plg.id)}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {plg.installed ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleEnable(plg.id)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                          plg.enabled 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{plg.enabled ? 'Enabled' : 'Disabled'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenConfig(plg)}
                        title="Configure Plugin"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleInstall(plg.id, true)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Uninstall
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleToggleInstall(plg.id, false)}
                    disabled={isLoading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : plg.price !== 'Free' ? (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Purchase ({plg.price})</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Install Plugin</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Publish Plugin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-500" />
                <span>Publish Plugin to Marketplace</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreatePluginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Plugin Name</label>
                <input
                  type="text"
                  required
                  value={newPluginName}
                  onChange={(e) => setNewPluginName(e.target.value)}
                  placeholder="e.g. Anti-Spam Captcha Sentinel"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Developer / Author</label>
                <input
                  type="text"
                  required
                  value={newPluginAuthor}
                  onChange={(e) => setNewPluginAuthor(e.target.value)}
                  placeholder="e.g. CyberBot Labs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Description</label>
                <textarea
                  required
                  value={newPluginDesc}
                  onChange={(e) => setNewPluginDesc(e.target.value)}
                  placeholder="Explain what this plugin accomplishes on active bot instances..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 h-20 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Publish Plugin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
