import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Smartphone, 
  Key, 
  Clock, 
  MapPin, 
  Globe, 
  Power, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Activity, 
  UserCheck, 
  Cpu, 
  Zap, 
  Trash2,
  Shield,
  Eye,
  CheckCircle2,
  XCircle,
  Laptop
} from 'lucide-react';
import { LoginHistoryItem, TrustedDevice, SecurityAlert } from '../types';

export default function SecurityHubView() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'history' | 'recovery' | 'admin'>('dashboard');

  // Stats State
  const [securityScore, setSecurityScore] = useState(96);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'email' | 'sms' | 'authenticator'>('email');

  // Sessions State
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Login History State
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Recovery Codes State
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Admin Security State
  const [adminStats, setAdminStats] = useState<any>(null);
  const [blockedIpInput, setBlockedIpInput] = useState('');

  // Fetch Security Stats & History on mount
  useEffect(() => {
    fetchSessions();
    fetchLoginHistory();
    fetchRecoveryCodes();
    fetchAdminSecurity();
  }, []);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch('/api/auth/sessions');
      const data = await res.json();
      if (res.ok && data.sessions) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchLoginHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/auth/login-history');
      const data = await res.json();
      if (res.ok && data.history) {
        setLoginHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchRecoveryCodes = async () => {
    try {
      const res = await fetch('/api/auth/recovery-codes');
      const data = await res.json();
      if (res.ok && data.recoveryCodes) {
        setRecoveryCodes(data.recoveryCodes);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminSecurity = async () => {
    try {
      const res = await fetch('/api/auth/admin/security');
      const data = await res.json();
      if (res.ok && data.stats) {
        setAdminStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTerminateSession = async (id: string) => {
    try {
      await fetch(`/api/auth/session/${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    try {
      await fetch('/api/auth/logout-all', { method: 'POST' });
      fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegenerateCodes = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/auth/regenerate-codes', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.recoveryCodes) {
        setRecoveryCodes(data.recoveryCodes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadCodes = () => {
    const text = `GURU-XD CLOUD OS - EMERGENCY RECOVERY CODES\nGenerated: ${new Date().toLocaleString()}\n\n` + recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') + `\n\nKeep these single-use codes in a safe place.`;
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "guru-xd-recovery-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleUnlockAll = async () => {
    try {
      await fetch('/api/auth/admin/unlock', { method: 'POST' });
      fetchAdminSecurity();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleBlockIp = async (ipToBlock?: string) => {
    const targetIp = ipToBlock || blockedIpInput.trim();
    if (!targetIp) return;
    try {
      await fetch('/api/auth/admin/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: targetIp })
      });
      setBlockedIpInput('');
      fetchAdminSecurity();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">
              Enterprise Security Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
              Zero-Trust Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage 2FA policies, active sessions, threat intelligence, and emergency backup keys.
          </p>
        </div>

        {/* Security Score Badge */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shrink-0">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500"
                strokeDasharray={`${securityScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-mono font-extrabold text-emerald-400">{securityScore}%</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Security Score</div>
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Enterprise Grade</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Hub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'sessions' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Active Sessions ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'history' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Login History</span>
        </button>

        <button
          onClick={() => setActiveTab('recovery')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'recovery' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Backup Recovery Codes</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'admin' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Admin Threat Panel</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SECURITY DASHBOARD OVERVIEW                         */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Security Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password Health</span>
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-slate-100">Enterprise Grade</div>
              <p className="text-[11px] text-slate-400">
                12+ Characters, Uppercase, Numbers & Symbols. Next rotation in 60 days.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">2FA Protection</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <span>Active</span>
                <span className="text-xs font-normal text-slate-400">({twoFactorMethod.toUpperCase()})</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-Factor OTP challenge required on all unrecognised devices.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trusted Devices</span>
                <Laptop className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-slate-100">1 Device Trusted</div>
              <p className="text-[11px] text-slate-400">
                30-day automatic OTP bypass signature enabled for current browser.
              </p>
            </div>
          </div>

          {/* AI Security Threat Detection Summary */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-100">AI Threat Intelligence Engine</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                Real-Time Guard Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {adminStats?.aiSecurityAlerts?.map((alert: SecurityAlert) => (
                <div key={alert.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{alert.title}</span>
                    </span>
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      alert.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                    <span>IP: {alert.ip}</span>
                    <span>{alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ACTIVE SESSIONS MANAGER                            */}
      {/* ========================================================= */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Active Authentication Sockets</h3>
              <p className="text-xs text-slate-400">Review all devices currently signed into your account.</p>
            </div>
            <button
              onClick={handleTerminateAllOtherSessions}
              className="px-4 py-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Terminate All Other Sessions</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((sess) => (
              <div 
                key={sess.id}
                className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{sess.device}</h4>
                      <p className="text-[10px] font-mono text-slate-400">IP: {sess.ip || '192.168.1.104'}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active Now
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/50">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-sans">Connected At</span>
                    <span className="text-slate-300">{sess.connectedAt || 'Today'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-sans">Platform</span>
                    <span className="text-slate-300">{sess.platform || 'WhatsApp/Web'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    onClick={() => handleTerminateSession(sess.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke Session</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: LOGIN HISTORY AUDIT TABLE                          */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Authentication Audit Logs</h3>
            <button 
              onClick={fetchLoginHistory}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Log</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Device / OS</th>
                  <th className="p-3">Location / Country</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loginHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-slate-400">{item.date} {item.time}</td>
                    <td className="p-3 font-semibold text-slate-200">{item.device} ({item.os})</td>
                    <td className="p-3 text-slate-400">{item.location}, {item.country}</td>
                    <td className="p-3 font-mono text-slate-300">{item.ip}</td>
                    <td className="p-3">
                      {item.status === 'successful' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                          ✓ Successful
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
                          ✕ Failed
                        </span>
                      )}
                      {item.status === 'blocked' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold uppercase">
                          🛑 IP Blocked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: BACKUP RECOVERY CODES                              */}
      {/* ========================================================= */}
      {activeTab === 'recovery' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Emergency Backup Recovery Codes</h3>
              <p className="text-xs text-slate-400">
                Single-use codes for logging in when your primary 2FA device is lost or unavailable.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCodes}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodes ? 'Copied' : 'Copy All'}</span>
              </button>

              <button
                onClick={handleDownloadCodes}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>

              <button
                onClick={handleRegenerateCodes}
                disabled={isRegenerating}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate New Codes</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {recoveryCodes.map((code, idx) => (
              <div 
                key={idx}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center font-mono text-xs font-bold text-blue-400 tracking-wider shadow-inner"
              >
                <span className="text-[10px] text-slate-600 block font-normal">{idx + 1}.</span>
                <span>{code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ADMIN THREAT PANEL                                  */}
      {/* ========================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Locked Accounts</span>
              <div className="text-2xl font-bold text-amber-400">{adminStats?.lockedAccountsCount || 0}</div>
              <p className="text-[11px] text-slate-500">Accounts locked due to 5 failed password attempts.</p>
              <button
                onClick={handleUnlockAll}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline"
              >
                Clear All Account Lockouts
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Blocked IP Addresses</span>
              <div className="text-2xl font-bold text-rose-400">{adminStats?.blockedIPs?.length || 0}</div>
              <p className="text-[11px] text-slate-500">IP Addresses currently blocked by security firewall.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Online Members</span>
              <div className="text-2xl font-bold text-emerald-400">{adminStats?.onlineUsersCount || 1}</div>
              <p className="text-[11px] text-slate-500">Active authenticated portal accounts.</p>
            </div>
          </div>

          {/* Block IP Controls */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">IP Firewall Blocklist</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={blockedIpInput}
                onChange={(e) => setBlockedIpInput(e.target.value)}
                placeholder="Enter IP Address (e.g. 198.51.100.42)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 flex-1 font-mono"
              />
              <button
                onClick={() => handleToggleBlockIp()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Block IP
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {adminStats?.blockedIPs?.map((ip: string) => (
                <div key={ip} className="px-3 py-1 bg-slate-950 border border-rose-900/50 rounded-lg text-xs font-mono text-rose-400 flex items-center gap-2">
                  <span>{ip}</span>
                  <button onClick={() => handleToggleBlockIp(ip)} className="hover:text-white cursor-pointer">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
