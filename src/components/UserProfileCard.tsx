import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Globe, 
  Moon, 
  Sun, 
  Languages, 
  Keyboard, 
  ScrollText, 
  LogOut, 
  Settings, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  Server, 
  HardDrive, 
  Bot as BotIcon, 
  Sparkles, 
  X, 
  Check,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import logoUrl from '../assets/images/guru_xd_logo_1784332841454.jpg';

interface UserProfileCardProps {
  user: { username: string; role: string; avatar?: string };
  currentWorkspace: { name: string; type: string };
  botsCount?: number;
  subscriptionTier?: string;
  sessionTimeLeft?: number;
  onLogout: () => void;
  setCurrentTab: (tab: string) => void;
  onSimulateTimeout?: () => void;
}

export default function UserProfileCard({
  user,
  currentWorkspace,
  botsCount = 12,
  subscriptionTier = 'Enterprise',
  sessionTimeLeft,
  onLogout,
  setCurrentTab,
  onSimulateTimeout
}: UserProfileCardProps) {
  const [isDropdownExpanded, setIsDropdownExpanded] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  
  const [selectedTheme, setSelectedTheme] = useState<'Dark Cyberpunk' | 'Midnight Obsidian' | 'Light Canvas'>('Dark Cyberpunk');
  const [selectedLang, setSelectedLang] = useState<'English (US)' | 'Spanish' | 'French' | 'Indonesian' | 'Portuguese'>('English (US)');

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.username ? user.username.toUpperCase() : 'UNKNOWNROOTERG7';
  const roleTitle = user?.role || 'Super Administrator';

  const shortcutsList = [
    { key: '⌘ + K / Ctrl + K', description: 'Open Global Command Terminal & Search' },
    { key: 'Alt + S', description: 'Start All Container Instances' },
    { key: 'Alt + T', description: 'Stop All Active Bot Clusters' },
    { key: 'Alt + C', description: 'Clear Live Console Output Logs' },
    { key: 'G + 1', description: 'Jump to Main Dashboard' },
    { key: 'G + 2', description: 'Jump to AI Copilot Console' },
    { key: 'G + 3', description: 'Jump to Applications' },
    { key: 'G + 4', description: 'Jump to Deployments' },
    { key: 'G + 5', description: 'Jump to Active Bot Instances' },
    { key: 'G + 6', description: 'Jump to Live Terminal' },
    { key: 'G + 7', description: 'Jump to Database Brain' },
    { key: 'G + 8', description: 'Jump to Plugin Marketplace' }
  ];

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Expanded Profile Dropdown Menu */}
      {isDropdownExpanded && (
        <div className="mb-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-200 divide-y divide-slate-800/80">
          {/* Menu Header */}
          <div className="flex items-center justify-between pb-2 px-1">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Profile Menu</span>
            </span>
            <button 
              onClick={() => setIsDropdownExpanded(false)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expanded Dropdown Items */}
          <div className="pt-2 space-y-1 font-sans text-xs">
            <button
              onClick={() => {
                setCurrentTab('settings');
                setIsDropdownExpanded(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors cursor-pointer text-left font-medium"
            >
              <User className="w-4 h-4 text-blue-400 shrink-0" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('apikeys');
                setIsDropdownExpanded(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors cursor-pointer text-left font-medium"
            >
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Security</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('notifications');
                setIsDropdownExpanded(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors cursor-pointer text-left font-medium"
            >
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('billing');
                setIsDropdownExpanded(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors cursor-pointer text-left font-medium"
            >
              <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Billing</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('teams');
                setIsDropdownExpanded(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors cursor-pointer text-left font-medium"
            >
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Switch Workspace</span>
            </button>

            <button
              onClick={() => {
                setShowAppearanceModal(true);
                setIsDropdownExpanded(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Appearance</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                {selectedTheme.split(' ')[0]}
              </span>
            </button>

            <button
              onClick={() => {
                setShowLanguageModal(true);
                setIsDropdownExpanded(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Languages className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Language</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                {selectedLang.split(' ')[0]}
              </span>
            </button>

            <button
              onClick={() => {
                setShowShortcutsModal(true);
                setIsDropdownExpanded(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors cursor-pointer text-left font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Keyboard Shortcuts</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                ⌘K
              </span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('logs');
                setIsDropdownExpanded(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors cursor-pointer text-left font-medium"
            >
              <ScrollText className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Audit Logs</span>
            </button>

            <div className="pt-1.5 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsDropdownExpanded(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-left font-semibold"
              >
                <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Quick System Information Card */}
      <div 
        onClick={() => setIsDropdownExpanded(!isDropdownExpanded)}
        className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-xl relative group select-none space-y-3"
      >
        {/* User Identity Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img 
                src={user?.avatar || logoUrl} 
                alt={displayName} 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/30 group-hover:ring-blue-500 transition-all shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-xs text-slate-100 truncate tracking-tight flex items-center gap-1.5">
                <span>👤 {displayName}</span>
              </h3>
              <p className="text-[10px] font-mono text-blue-400 truncate">{roleTitle}</p>
            </div>
          </div>

          <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-blue-400 transition-colors shrink-0">
            {isDropdownExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800/80 my-1" />

        {/* System Information Metrics List */}
        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-slate-500">Status</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
              🟢 Online
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="text-slate-500">Workspace</span>
            <span className="text-slate-200 truncate max-w-[130px] font-semibold">
              {currentWorkspace?.name || 'Personal Sandbox'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="text-slate-500">Role</span>
            <span className="text-slate-200 font-semibold">
              {currentWorkspace?.type === 'Personal' ? 'Owner' : 'Super Admin'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="text-slate-500">Current Node</span>
            <span className="text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 text-[10px]">
              Cluster-A
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="text-slate-500">Active Bots</span>
            <span className="text-slate-100 font-bold">
              {botsCount}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="text-slate-500">Storage</span>
            <span className="text-slate-300">
              4.3 GB / 20 GB
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="text-slate-500">Subscription</span>
            <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 text-[10px]">
              {subscriptionTier}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800/80 my-1" />

        {/* Quick Icon Actions Row */}
        <div className="flex items-center justify-between gap-1 text-[11px] font-mono pt-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentTab('settings');
            }}
            title="Settings"
            className="flex-1 py-1 px-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer text-[10px]"
          >
            ⚙ Settings
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentTab('users');
            }}
            title="Account"
            className="flex-1 py-1 px-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer text-[10px]"
          >
            👥 Account
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentTab('billing');
            }}
            title="Billing"
            className="flex-1 py-1 px-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer text-[10px]"
          >
            💳 Billing
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentTab('apikeys');
            }}
            title="Security"
            className="flex-1 py-1 px-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer text-[10px]"
          >
            🔐 Security
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            title="Logout"
            className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 flex items-center justify-center transition-colors cursor-pointer text-[10px]"
          >
            🚪
          </button>
        </div>

        {/* Session lease timer if present */}
        {sessionTimeLeft !== undefined && (
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Lease: {Math.floor(sessionTimeLeft / 60)}m {sessionTimeLeft % 60}s
            </span>
            {onSimulateTimeout && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSimulateTimeout();
                }}
                className="text-blue-400 hover:underline"
              >
                Test Expiration
              </button>
            )}
          </div>
        )}
      </div>

      {/* Appearance Modal */}
      {showAppearanceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-400" />
                <span>Appearance & Theme</span>
              </h3>
              <button onClick={() => setShowAppearanceModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-2 font-sans text-xs">
              {(['Dark Cyberpunk', 'Midnight Obsidian', 'Light Canvas'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                    selectedTheme === theme 
                      ? 'bg-blue-600/10 border-blue-500 text-blue-300 font-semibold' 
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <span>{theme}</span>
                  {selectedTheme === theme && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAppearanceModal(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
            >
              Apply Theme Preference
            </button>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Languages className="w-4 h-4 text-teal-400" />
                <span>Select Display Language</span>
              </h3>
              <button onClick={() => setShowLanguageModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-2 font-sans text-xs">
              {(['English (US)', 'Spanish', 'French', 'Indonesian', 'Portuguese'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                    selectedLang === lang 
                      ? 'bg-teal-500/10 border-teal-500 text-teal-300 font-semibold' 
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <span>{lang}</span>
                  {selectedLang === lang && <Check className="w-4 h-4 text-teal-400" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowLanguageModal(false)}
              className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
            >
              Save Language
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-rose-400" />
                <span>Keyboard Shortcuts & Hotkeys</span>
              </h3>
              <button onClick={() => setShowShortcutsModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {shortcutsList.map((sc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-300 font-sans">{sc.description}</span>
                  <span className="bg-slate-900 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded text-[11px] font-bold">
                    {sc.key}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
            >
              Close Shortcuts Reference
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
