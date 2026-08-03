import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Clock, 
  Shield, 
  Search, 
  RotateCw, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Database,
  AlertTriangle,
  Info,
  ShieldAlert
} from 'lucide-react';
import { PortalUser } from '../types';
import logoUrl from '../assets/images/guru_xd_logo_1784332841454.jpg';

export interface AuditLogItem {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_DELETE';
  timestamp: string;
  userId: string;
  entity: string;
  entityId?: string;
  details?: any;
  severity?: 'Info' | 'Warning' | 'Critical';
}

export const getLogSeverity = (log: AuditLogItem): 'Info' | 'Warning' | 'Critical' => {
  if (log.severity) {
    const sev = String(log.severity).toLowerCase();
    if (sev === 'critical' || sev === 'error' || sev === 'high') return 'Critical';
    if (sev === 'warning' || sev === 'warn' || sev === 'medium') return 'Warning';
    if (sev === 'info' || sev === 'low') return 'Info';
  }
  if (log.operation === 'BULK_DELETE' || log.operation === 'DELETE') {
    return 'Critical';
  }
  if (log.operation === 'UPDATE') {
    return 'Warning';
  }
  return 'Info';
};

interface UserActivityModalProps {
  user: PortalUser;
  onClose: () => void;
}

export default function UserActivityModal({ user, onClose }: UserActivityModalProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOp, setSelectedOp] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  const fetchUserActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      // First try fetching specifically by user ID activity
      const res = await fetch(`/api/v1/users/${encodeURIComponent(user.id)}/activity`);
      let data = await res.json();
      
      let fetchedLogs: AuditLogItem[] = [];
      if (data && data.success && data.result && Array.isArray(data.result.data)) {
        fetchedLogs = data.result.data;
      } else {
        // Fallback to dao audit-logs query
        const fallbackRes = await fetch(`/api/v1/dao/audit-logs?userId=${encodeURIComponent(user.id)}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData && fallbackData.success && fallbackData.result && Array.isArray(fallbackData.result.data)) {
          fetchedLogs = fallbackData.result.data;
        }
      }

      // If no logs found by exact user ID (e.g. for default demo users), also fetch general entity/user logs
      if (fetchedLogs.length === 0) {
        const genRes = await fetch(`/api/v1/dao/audit-logs?limit=100`);
        const genData = await genRes.json();
        if (genData && genData.success && genData.result && Array.isArray(genData.result.data)) {
          // Filter logs matching username or userId or system
          const matched = genData.result.data.filter((l: AuditLogItem) => 
            l.userId === user.id || 
            l.userId.toLowerCase() === user.username.toLowerCase() ||
            l.entityId === user.id
          );
          if (matched.length > 0) {
            fetchedLogs = matched;
          } else if (user.username === 'admin') {
            // Show system logs for admin if no specific logs
            fetchedLogs = genData.result.data;
          }
        }
      }

      setLogs(fetchedLogs);
    } catch (err: any) {
      console.error('Failed to fetch user activity:', err);
      setError('Unable to load audit logs from the database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserActivity();
  }, [user.id]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = logs.filter(log => {
    const matchesOp = selectedOp === 'ALL' || log.operation === selectedOp;
    const severity = getLogSeverity(log);
    const matchesSeverity = selectedSeverity === 'ALL' || severity === selectedSeverity;
    const matchesSearch = searchQuery.trim() === '' || 
      log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entityId && log.entityId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesOp && matchesSeverity && matchesSearch;
  });

  const getOpBadgeClass = (op: string) => {
    switch (op) {
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'BULK_DELETE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSeverityBadge = (log: AuditLogItem) => {
    const severity = getLogSeverity(log);
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Critical</span>
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Warning</span>
          </span>
        );
      case 'Info':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Info className="w-3 h-3 text-blue-400" />
            <span>Info</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-900 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-900 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <img 
              src={user.username === 'admin' ? logoUrl : user.avatar} 
              alt={user.username} 
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/30 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-sans tracking-tight">{user.username}</h2>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold">
                  {user.role}
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                  user.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {user.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email} • ID: <span className="text-slate-300">{user.id}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchUserActivity}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Audit Logs"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Filter & Search */}
        <div className="p-4 border-b border-slate-900 bg-slate-950/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shrink-0 font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Operation Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-850/80 overflow-x-auto">
              {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'BULK_DELETE'].map(op => (
                <button
                  key={op}
                  onClick={() => setSelectedOp(op)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    selectedOp === op
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>

            {/* Severity Dropdown Filter */}
            <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-lg border border-slate-850/80 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">Severity:</span>
              <select
                id="audit-log-severity-filter"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] font-mono rounded-md px-2 py-1 focus:outline-none focus:border-blue-500/80 cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="Info">Info (Routine)</option>
                <option value="Warning">Warning (Modifications)</option>
                <option value="Critical">Critical (Destructive)</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Search entity or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-blue-500/80 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none text-xs font-mono"
            />
          </div>
        </div>

        {/* Activity Logs Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 font-mono">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <RotateCw className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs">Querying AuditLog collection for {user.username}...</p>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-rose-400 bg-rose-950/20 rounded-xl border border-rose-900/40 p-6">
              <AlertCircle className="w-8 h-8" />
              <p className="text-xs text-center font-sans">{error}</p>
              <button 
                onClick={fetchUserActivity}
                className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs rounded-lg cursor-pointer transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-500 border border-dashed border-slate-900 rounded-xl bg-slate-950/20">
              <Database className="w-8 h-8 text-slate-600" />
              <p className="text-xs font-sans text-slate-400 font-medium">No audit log entries recorded for this filter.</p>
              <p className="text-[11px] text-slate-600 max-w-sm text-center">Actions performed by or targeting this member through the DAO layer will appear here in real time.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const isExpanded = expandedLogIds[log.id];
              const formattedTime = new Date(log.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <div 
                  key={log.id} 
                  className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl p-3.5 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getOpBadgeClass(log.operation)}`}>
                        {log.operation}
                      </span>
                      {getSeverityBadge(log)}
                      <span className="text-slate-200 font-semibold font-sans">{log.entity}</span>
                      {log.entityId && (
                        <span className="text-slate-500 text-[11px]">ID: <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{log.entityId}</code></span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-slate-500 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>{formattedTime}</span>
                    </div>
                  </div>

                  {/* Details Toggle */}
                  {log.details && (
                    <div className="mt-2.5 pt-2 border-t border-slate-900/80">
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer transition-colors font-sans"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? 'Hide Payload Details' : 'View Payload Details'}</span>
                      </button>

                      {isExpanded && (
                        <pre className="mt-2 p-3 bg-slate-950 border border-slate-900 rounded-lg text-[11px] text-slate-300 overflow-x-auto font-mono leading-relaxed">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 font-mono shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>Showing <strong className="text-slate-300">{filteredLogs.length}</strong> of <strong className="text-slate-300">{logs.length}</strong> audit entries</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer transition-colors font-sans font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
