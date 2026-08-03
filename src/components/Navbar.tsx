import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  Server, 
  Clock, 
  Search, 
  Terminal, 
  Play, 
  Square, 
  Trash2, 
  LayoutDashboard, 
  Sparkles, 
  Bot, 
  ScrollText, 
  Settings, 
  Users, 
  FolderClosed, 
  X,
  Keyboard,
  Radio,
  BarChart3,
  User,
  Blocks,
  Menu
} from 'lucide-react';
import { isFirebaseConfigured } from '../firebase';


import logoUrl from '../assets/images/guru_xd_logo_1784332841454.jpg';
import UserProfileCard from './UserProfileCard';

interface NavbarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  systemMetrics: { cpu: number; ram: string };
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onStartAllBots?: () => void;
  onStopAllBots?: () => void;
  onClearLogs?: () => void;
  onToggleMobileMenu?: () => void;
  maintenanceMode?: boolean;
  user?: { username: string; role: string; avatar?: string };
  onLogout?: () => void;
  currentWorkspace?: { name: string; type: string };
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Action';
  label: string;
  shortcut?: string;
  icon: React.ComponentType<any>;
  action: () => void;
}

export default function Navbar({ 
  onRefresh, 
  isRefreshing, 
  systemMetrics, 
  currentTab, 
  setCurrentTab,
  onStartAllBots,
  onStopAllBots,
  onClearLogs,
  onToggleMobileMenu,
  maintenanceMode = false,
  user,
  onLogout,
  currentWorkspace = { name: 'Personal Sandbox', type: 'Personal' }
}: NavbarProps) {
  const [time, setTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Set up keyboard shortcuts (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearchQuery('');
        setSelectedIndex(0);
      }
      
      // Close on escape
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // List of all command options (Jumps & Actions)
  const commandItems: CommandItem[] = [
    {
      id: 'jump-dashboard',
      category: 'Navigation',
      label: 'Jump to Dashboard',
      shortcut: 'G 1',
      icon: LayoutDashboard,
      action: () => setCurrentTab('dashboard')
    },
    {
      id: 'jump-copilot',
      category: 'Navigation',
      label: 'Jump to AI Chat & Copilot',
      shortcut: 'G 2',
      icon: Sparkles,
      action: () => setCurrentTab('copilot')
    },
    {
      id: 'jump-bots',
      category: 'Navigation',
      label: 'Jump to Bot Instances',
      shortcut: 'G 3',
      icon: Bot,
      action: () => setCurrentTab('bots')
    },
    {
      id: 'jump-commands',
      category: 'Navigation',
      label: 'Jump to Command Index',
      shortcut: 'G 4',
      icon: Terminal,
      action: () => setCurrentTab('commands')
    },
    {
      id: 'jump-files',
      category: 'Navigation',
      label: 'Jump to File Explorer',
      shortcut: 'G 5',
      icon: FolderClosed,
      action: () => setCurrentTab('files')
    },
    {
      id: 'jump-plugins',
      category: 'Navigation',
      label: 'Jump to Plugin Catalog',
      shortcut: 'G 6',
      icon: Blocks,
      action: () => setCurrentTab('plugins')
    },
    {
      id: 'jump-sessions',
      category: 'Navigation',
      label: 'Jump to Device Sessions',
      shortcut: 'G 7',
      icon: Radio,
      action: () => setCurrentTab('sessions')
    },
    {
      id: 'jump-logs',
      category: 'Navigation',
      label: 'Jump to Live Console Logs',
      shortcut: 'G 8',
      icon: ScrollText,
      action: () => setCurrentTab('logs')
    },
    {
      id: 'jump-analytics',
      category: 'Navigation',
      label: 'Jump to Analytics',
      shortcut: 'G 9',
      icon: BarChart3,
      action: () => setCurrentTab('analytics')
    },
    {
      id: 'jump-users',
      category: 'Navigation',
      label: 'Jump to Portal Users',
      shortcut: 'G 10',
      icon: Users,
      action: () => setCurrentTab('users')
    },
    {
      id: 'jump-profile',
      category: 'Navigation',
      label: 'Jump to Admin Profile',
      shortcut: 'G 11',
      icon: User,
      action: () => setCurrentTab('profile')
    },
    {
      id: 'jump-settings',
      category: 'Navigation',
      label: 'Jump to Global Settings',
      shortcut: 'G 12',
      icon: Settings,
      action: () => setCurrentTab('settings')
    },
    {
      id: 'action-start-all',
      category: 'Action',
      label: maintenanceMode ? 'Start All Bots (LOCKED - Maintenance Mode)' : 'Start All Bots',
      shortcut: maintenanceMode ? undefined : 'Alt + S',
      icon: Play,
      action: () => {
        if (!maintenanceMode && onStartAllBots) onStartAllBots();
      }
    },
    {
      id: 'action-stop-all',
      category: 'Action',
      label: maintenanceMode ? 'Stop All Bots (LOCKED - Maintenance Mode)' : 'Stop All Bots',
      shortcut: maintenanceMode ? undefined : 'Alt + T',
      icon: Square,
      action: () => {
        if (!maintenanceMode && onStopAllBots) onStopAllBots();
      }
    },
    {
      id: 'action-clear-logs',
      category: 'Action',
      label: 'Clear Console Logs',
      shortcut: 'Alt + C',
      icon: Trash2,
      action: () => {
        if (onClearLogs) onClearLogs();
      }
    }
  ];

  // Filter commands based on user query
  const filteredItems = commandItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle arrow key navigation inside the list
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 gap-4">
        {/* Left Section - Quick Search Input & Mobile Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 bg-slate-900/60 border border-slate-800 focus:outline-none hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Keyboard command trigger visual wrapper */}
          <div 
            onClick={() => {
              setIsOpen(true);
              setSearchQuery('');
              setSelectedIndex(0);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl text-xs text-slate-400 hover:text-slate-200 cursor-pointer transition-all duration-200 select-none shadow-inner"
          >
            <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="flex-1 truncate font-medium">Search terminal commands...</span>
            <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/60 text-[10px] font-mono text-slate-400 shrink-0 font-semibold">⌘K</span>
          </div>
        </div>

        {/* Right Section - Stats & Controllers */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {/* Live Status indicator */}
          {isFirebaseConfigured ? (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-400 font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
              <span>CLOUD SYNC ACTIVE</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span>PORTAL ACTIVE</span>
            </div>
          )}

          {/* Dynamic Clock */}
          <div className="hidden lg:flex items-center gap-2 text-slate-300 font-mono text-xs border-r border-slate-900/80 pr-4">
            <Clock className="w-3.5 h-3.5 text-blue-400/80" />
            <span className="font-semibold">{time.toLocaleTimeString()}</span>
          </div>

          {/* Live CPU */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold font-mono">Cluster CPU</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-16 h-1.5 bg-slate-900/90 border border-slate-800/80 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    systemMetrics.cpu > 90 ? 'bg-rose-500' : systemMetrics.cpu > 80 ? 'bg-amber-500' : 'bg-blue-500'
                  }`} 
                  style={{ width: `${systemMetrics.cpu}%` }}
                />
              </div>
              <span className={`text-xs font-mono font-bold ${
                systemMetrics.cpu > 90 ? 'text-rose-400' : systemMetrics.cpu > 80 ? 'text-amber-400' : 'text-slate-200'
              }`}>{systemMetrics.cpu.toFixed(1)}%</span>
            </div>
          </div>

          {/* Sync Controller */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800/80 bg-slate-900/80 hover:bg-slate-800/90 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all duration-200 cursor-pointer select-none shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
            <span className="hidden xs:inline">Sync</span>
          </button>

          {/* Top Bar User Profile Badge Button */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowProfilePopover(!showProfilePopover)}
                className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl border border-slate-800/80 hover:border-blue-500/40 bg-slate-900/80 hover:bg-slate-800/90 transition-all duration-200 cursor-pointer shadow-sm"
                title="Profile & Quick System Info"
              >
                <img 
                  src={user.avatar || logoUrl} 
                  alt={user.username} 
                  className="w-6 h-6 rounded-lg object-cover ring-1 ring-blue-500/30"
                />
                <span className="text-xs font-bold font-mono text-slate-200 hidden md:inline">
                  {user.username.toUpperCase()}
                </span>
                <User className="w-3.5 h-3.5 text-blue-400" />
              </button>

              {/* Profile Popover Modal */}
              {showProfilePopover && (
                <div className="absolute right-0 top-full mt-2 w-80 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <UserProfileCard
                    user={user}
                    currentWorkspace={currentWorkspace}
                    botsCount={12}
                    onLogout={onLogout || (() => {})}
                    setCurrentTab={(tab) => {
                      setCurrentTab(tab);
                      setShowProfilePopover(false);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Global Command Search Modal (Backdrop) */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-[10vh] px-4 z-50 animate-in fade-in duration-200">
          <div 
            ref={modalRef}
            className="w-full max-w-xl bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-300 flex flex-col max-h-[75vh]"
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 border-b border-slate-850 bg-slate-950/40">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a screen to jump or action command to run..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleModalKeyDown}
                className="w-full bg-transparent border-none py-4 text-xs font-mono text-slate-100 focus:outline-none placeholder-slate-500"
              />
              <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-[9px] font-mono text-slate-500 shrink-0">
                <Keyboard className="w-3 h-3" /> ESC to Close
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Stream list */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-900/40 leading-none">
              {filteredItems.length > 0 ? (
                // Group by Category helper
                (['Navigation', 'Action'] as const).map(cat => {
                  const itemsInCat = filteredItems.filter(i => i.category === cat);
                  if (itemsInCat.length === 0) return null;
                  
                  return (
                    <div key={cat} className="py-2 first:pt-1">
                      <div className="px-3 py-1.5 text-[9px] font-semibold text-slate-500 tracking-wider uppercase font-mono">
                        {cat === 'Navigation' ? 'Direct Application Tabs' : 'Global Console Actions'}
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {itemsInCat.map(item => {
                          const itemIndex = filteredItems.indexOf(item);
                          const isSelected = itemIndex === selectedIndex;
                          const ItemIcon = item.icon;
                          
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                item.action();
                                setIsOpen(false);
                              }}
                              onMouseEnter={() => setSelectedIndex(itemIndex)}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                                  : 'text-slate-300 hover:bg-slate-950/40 hover:text-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <ItemIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                <span className="font-medium">{item.label}</span>
                              </div>
                              {item.shortcut && (
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                  isSelected 
                                    ? 'bg-blue-700 text-blue-100 border border-blue-500/20' 
                                    : 'bg-slate-950 text-slate-500 border border-slate-900'
                                }`}>
                                  {item.shortcut}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  No matching workspace commands or tabs found.
                </div>
              )}
            </div>

            {/* Hint Footer bar */}
            <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-850 flex items-center justify-between text-[9px] font-mono text-slate-500 select-none">
              <span className="hidden xs:inline">Use ↑↓ keys to select and Enter to execute.</span>
              <span>Total commands matched: {filteredItems.length}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
