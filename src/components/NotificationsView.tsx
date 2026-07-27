import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Rocket, 
  Sparkles, 
  CreditCard, 
  Check, 
  Trash2,
  X
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'security';
  read: boolean;
}

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'Deployment Successful',
      message: 'Container cluster "whatsapp-bot-1" successfully deployed on London EU-West-2 node.',
      timestamp: '5 mins ago',
      severity: 'success',
      read: false
    },
    {
      id: 'n-2',
      title: 'Security Alert: New API Key Created',
      message: 'Admin Key "GitHub Actions Deployment Pipeline" generated with Full Admin access.',
      timestamp: '1 hour ago',
      severity: 'security',
      read: false
    },
    {
      id: 'n-3',
      title: 'High CPU Usage Warning',
      message: 'Instance "Discord AutoMod Agent" reached 85% CPU limit. Consider scaling RAM quota.',
      timestamp: '3 hours ago',
      severity: 'warning',
      read: true
    },
    {
      id: 'n-4',
      title: 'Plugin Marketplace Update',
      message: 'Anti-Link Bot Guard updated to v2.4.0 with automated regex link scanner.',
      timestamp: 'Yesterday',
      severity: 'info',
      read: true
    }
  ]);

  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !n.read;
    return n.severity === activeFilter.toLowerCase();
  });

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            <span>Notification & Alert Center</span>
          </h1>
          <p className="text-xs text-slate-400">Real-time telemetry feeds, container deployment alerts, security logs, and subscription notices.</p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={markAllRead}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Mark All Read
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-sans text-xs">
        {['All', 'Unread', 'Success', 'Security', 'Warning', 'Info'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors ${
              activeFilter === f 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications Feed List */}
      <div className="space-y-3">
        {filteredNotifs.length > 0 ? (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                !n.read 
                  ? 'bg-blue-600/10 border-blue-500/30 shadow-lg shadow-blue-500/5' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  n.severity === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  n.severity === 'security' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  n.severity === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {n.severity === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {n.severity === 'security' && <ShieldAlert className="w-4 h-4" />}
                  {n.severity === 'warning' && <AlertTriangle className="w-4 h-4" />}
                  {n.severity === 'info' && <Info className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-100">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] font-mono text-slate-500 block pt-1">{n.timestamp}</span>
                </div>
              </div>

              <button
                onClick={() => setNotifications(notifications.filter((item) => item.id !== n.id))}
                className="text-slate-500 hover:text-rose-400 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-slate-500 text-xs">
            No notifications matching the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
