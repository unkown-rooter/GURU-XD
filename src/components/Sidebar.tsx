import React, { useState, useEffect } from 'react';
import logoUrl from '../assets/images/guru_xd_logo_1784332841454.jpg';
import UserProfileCard from './UserProfileCard';
import { 
  LayoutDashboard, 
  Bot as BotIcon, 
  Terminal, 
  FolderClosed, 
  Blocks, 
  Radio, 
  Users, 
  ScrollText, 
  BarChart3, 
  User, 
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  X,
  Database,
  Clock,
  AppWindow,
  Rocket,
  Building2,
  ChevronDown,
  Key,
  HardDrive,
  Bell,
  CreditCard,
  HelpCircle,
  Code,
  Brain,
  ShieldCheck,
  Cpu,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { WorkspaceItem } from './WorkspacesView';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
  user: { username: string; role: string; avatar: string };
  isOpen?: boolean;
  onClose?: () => void;
  sessionTimeLeft?: number;
  onSimulateTimeout?: () => void;
  botsCount?: number;
  currentWorkspace: WorkspaceItem;
  workspaces: WorkspaceItem[];
  onSwitchWorkspace: (workspace: WorkspaceItem) => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  onLogout,
  user,
  isOpen,
  onClose,
  sessionTimeLeft,
  onSimulateTimeout,
  botsCount,
  currentWorkspace,
  workspaces,
  onSwitchWorkspace
}: SidebarProps) {
  const [showWsMenu, setShowWsMenu] = useState(false);

  // Requirement 7 & 2: Lock body scrolling whenever the mobile sidebar is opened
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('sidebar-open');
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.classList.remove('sidebar-open');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.classList.remove('sidebar-open');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const menuSections = [
    {
      title: 'CORE PLATFORM',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'copilot', label: 'AI Copilot', icon: Sparkles, badge: 'V2' },
        { id: 'applications', label: 'Applications', icon: AppWindow, count: 5 },
        { id: 'deployments', label: 'Deployments', icon: Rocket },
        { id: 'bots', label: 'Instances', icon: BotIcon, count: botsCount !== undefined ? botsCount : 4 }
      ]
    },
    {
      title: 'DEVELOPER TERMINAL',
      items: [
        { id: 'terminal', label: 'Live Terminal', icon: Terminal },
        { id: 'logs', label: 'Live Logs', icon: ScrollText },
        { id: 'plugins', label: 'Plugin Marketplace', icon: Blocks },
        { id: 'sdk', label: 'Plugin SDK', icon: Code }
      ]
    },
    {
      title: 'STORAGE & DATABASE',
      items: [
        { id: 'database', label: 'Database Brain', icon: Database },
        { id: 'storage', label: 'NVMe Storage', icon: HardDrive },
        { id: 'files', label: 'File Explorer', icon: FolderClosed }
      ]
    },
    {
      title: 'GOVERNANCE & ANALYTICS',
      items: [
        { id: 'architecture-versions', label: 'Architecture Specs V0-V7', icon: Layers, badge: 'SPECS' },
        { id: 'intelligence-center', label: 'Intelligence Center', icon: Cpu, badge: 'CORE' },
        { id: 'env-config', label: 'Env Config Manager', icon: SlidersHorizontal, badge: 'SECURE' },
        { id: 'security-analyst', label: 'AI Security Analyst', icon: ShieldCheck, badge: 'NEW' },
        { id: 'behavior', label: 'Behavior Engine', icon: Brain, badge: 'AI' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'teams', label: 'Teams & Workspaces', icon: Building2 },
        { id: 'security', label: 'Security & 2FA', icon: Key, badge: 'PRO' },
        { id: 'billing', label: 'Billing & Subscriptions', icon: CreditCard },
        { id: 'apikeys', label: 'API Keys', icon: Key },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: '3' },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
        { id: 'help', label: 'Help Center', icon: HelpCircle }
      ]
    }
  ];

  const renderContent = () => (
    <div className="flex flex-col min-h-full bg-slate-950/95 backdrop-blur-md border-r border-slate-900/80 selection:bg-blue-500/20">
      {/* Brand & Workspace Switcher Header */}
      <div className="p-4 border-b border-slate-900/80 shrink-0 space-y-3">
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <img 
              src={logoUrl} 
              alt="GURU-XD Logo" 
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/20 group-hover:ring-blue-400 transition-all duration-300"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-bold text-base text-slate-100 tracking-tight leading-none">
                GURU<span className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">-XD</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-mono font-bold leading-none tracking-wide">
                OS V2.5
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 tracking-widest block mt-0.5 uppercase truncate">Cloud Operating System</span>
          </div>
        </div>

        {/* Workspace Switcher Selector */}
        <div className="relative">
          <button
            onClick={() => setShowWsMenu(!showWsMenu)}
            className="w-full bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-left transition-all duration-200 cursor-pointer shadow-sm hover:border-slate-700/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-100 block truncate leading-tight">{currentWorkspace.name}</span>
                <span className="text-[9px] font-mono text-slate-400 block truncate">{currentWorkspace.type}</span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${showWsMenu ? 'rotate-180 text-blue-400' : ''}`} />
          </button>

          {showWsMenu && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800/90 rounded-xl p-1.5 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
              <span className="text-[9px] font-mono text-slate-400 uppercase px-2.5 py-1 block font-bold tracking-wider">Switch Workspace</span>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    onSwitchWorkspace(ws);
                    setShowWsMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    currentWorkspace.id === ws.id 
                      ? 'bg-blue-600/90 text-white font-semibold shadow-md shadow-blue-600/20' 
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  <span className="text-[9px] font-mono opacity-70 px-1.5 py-0.5 rounded bg-slate-950/40 border border-slate-800/50">{ws.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-slate-400/90 tracking-wider uppercase px-3 block mb-1.5">
              {section.title}
            </span>

            {section.items.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group cursor-pointer relative ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white font-semibold shadow-md shadow-blue-500/20 border border-blue-400/30' 
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/70 border border-transparent hover:border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconComponent className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                      isActive 
                        ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] scale-105' 
                        : 'text-slate-400 group-hover:text-blue-400 group-hover:scale-110'
                    }`} />
                    <span className="truncate tracking-tight">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.badge && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                        isActive 
                          ? 'bg-white/20 text-white backdrop-blur-sm' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:border-blue-500/40'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && !isActive && (
                      <span className="text-[10px] bg-slate-900/90 border border-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded-md group-hover:text-slate-300">
                        {item.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer with Quick System Info & Expanded Dropdown */}
      <div className="p-3 border-t border-slate-900 bg-slate-950 shrink-0 mt-auto">
        <UserProfileCard 
          user={user}
          currentWorkspace={currentWorkspace}
          botsCount={botsCount !== undefined ? botsCount : 12}
          sessionTimeLeft={sessionTimeLeft}
          onLogout={onLogout}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            if (onClose) onClose();
          }}
          onSimulateTimeout={onSimulateTimeout}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-950 border-r border-slate-900 flex-col h-screen sticky top-0 shrink-0">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-scrolling scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
          {renderContent()}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 animate-in fade-in duration-200"
          style={{ touchAction: 'none' }}
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <aside 
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-950 border-r border-slate-900 flex flex-col h-full h-[100dvh] max-h-[100dvh] transform transition-transform duration-300 ease-in-out overscroll-contain shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-3 border-b border-slate-900 bg-slate-950 shrink-0">
          <span className="text-xs font-mono font-bold tracking-widest text-slate-400">NAVIGATION</span>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-scrolling scrollbar-thin"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {renderContent()}
        </div>
      </aside>
    </>
  );
}
