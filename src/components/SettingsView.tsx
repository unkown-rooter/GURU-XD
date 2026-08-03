import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  RefreshCw, 
  Bell, 
  ShieldAlert, 
  Database, 
  SlidersHorizontal,
  CloudLightning,
  Webhook,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';

interface SettingsViewProps {
  onSettingsSaved?: () => void;
}

export default function SettingsView({ onSettingsSaved }: SettingsViewProps) {
  const [autoRestart, setAutoRestart] = useState(true);
  const [debugLogs, setDebugLogs] = useState(false);
  const [backups, setBackups] = useState(true);
  const [discordWebhook, setDiscordWebhook] = useState(false);

  // Retention Policy fields
  const [autoClear7Days, setAutoClear7Days] = useState(false);
  const [autoPurgeAuditLogs30Days, setAutoPurgeAuditLogs30Days] = useState(false);
  const [maxLogEntries, setMaxLogEntries] = useState(150);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  // Fetch current settings and maintenance mode status
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/retention').then(res => res.json()),
      fetch('/api/maintenance').then(res => res.json())
    ])
      .then(([retentionData, maintenanceData]) => {
        if (retentionData.success && retentionData.retentionPolicy) {
          setAutoClear7Days(retentionData.retentionPolicy.autoClear7Days);
          setAutoPurgeAuditLogs30Days(retentionData.retentionPolicy.autoPurgeAuditLogs30Days || false);
          setMaxLogEntries(retentionData.retentionPolicy.maxLogEntries);
        }
        if (maintenanceData.success) {
          setMaintenanceMode(maintenanceData.maintenanceMode);
        }
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveStatus({ type: 'idle', message: '' });

    try {
      const [resRetention, resMaintenance] = await Promise.all([
        fetch('/api/retention', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            autoClear7Days,
            autoPurgeAuditLogs30Days,
            maxLogEntries
          })
        }),
        fetch('/api/maintenance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maintenanceMode
          })
        })
      ]);

      if (resRetention.ok && resMaintenance.ok) {
        setSaveStatus({
          type: 'success',
          message: 'Settings saved and applied successfully. System states have been refreshed!'
        });
        
        // Notify parent to sync the main state (so logs are updated instantly)
        if (onSettingsSaved) {
          onSettingsSaved();
        }

        setTimeout(() => {
          setSaveStatus({ type: 'idle', message: '' });
        }, 5000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus({
        type: 'error',
        message: 'Could not connect to the cluster server to save configurations.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">Global Host Settings</h1>
        <p className="text-xs text-slate-400">Configure core node behaviors, automatic failure recoveries, log retention parameters, and notification channels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Settings options (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Recoveries */}
          <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              <span>Daemon Core Controls</span>
            </h2>

            <div className="space-y-5">
              {/* Option 1 */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-200 block">Auto-Restart on Crash</span>
                  <p className="text-xs text-slate-400 max-w-md">Instantly reboot instance threads if they experience socket disconnects or Node runtime errors.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoRestart(!autoRestart)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoRestart ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoRestart ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Option 2 */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-200 block">Extended Debug logs</span>
                  <p className="text-xs text-slate-400 max-w-md">Stream detailed socket payloads and ping telemetry directly to the Live Console stream.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDebugLogs(!debugLogs)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    debugLogs ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    debugLogs ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Option 3 */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-200 block">Automated Ledger Backups</span>
                  <p className="text-xs text-slate-400 max-w-md">Save encrypted configuration state blocks and command handlers to Cloud SSD every 24 hours.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBackups(!backups)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    backups ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    backups ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Section: Maintenance Mode */}
          <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>System Security & Maintenance Controls</span>
            </h2>

            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-200 block">Global Maintenance Mode</span>
                  <p className="text-xs text-slate-400 max-w-md">Activate a system-wide maintenance lock. This will display a highly visible warning banner to all active users and completely freeze bot starts, stops, and restarts.</p>
                </div>
                <button
                  type="button"
                  id="toggle-maintenance-mode"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    maintenanceMode ? 'bg-rose-600 ring-2 ring-rose-500/50' : 'bg-slate-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {maintenanceMode && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/10 text-rose-400 rounded-xl text-xs flex items-start gap-2.5 font-mono animate-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 animate-bounce" />
                  <div>
                    <span className="font-bold block uppercase tracking-wider text-[10px] text-rose-500 font-sans mb-1">State Modification Lock Activated</span>
                    <span>All docker thread triggers and instance calibrators are offline. Users will be blocked from initiating starts or stops on WhatsApp & Telegram gateways.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Retention Policy */}
          <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Retention Policy</span>
            </h2>

            <div className="space-y-5">
              {/* Option: Auto-clear logs older than 7 days */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-200 block">Auto-clear logs older than 7 days</span>
                  <p className="text-xs text-slate-400 max-w-md">Automatically purge logs and telemetry records older than 7 calendar days to prevent database bloating.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoClear7Days(!autoClear7Days)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoClear7Days ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoClear7Days ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Option: Auto-purge Audit Logs older than 30 days */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-200 block">Auto-purge Audit Logs older than 30 days</span>
                  <p className="text-xs text-slate-400 max-w-md">Automatically purge AuditLog collection entries older than 30 days to optimize index sizes and query performance.</p>
                </div>
                <button
                  type="button"
                  id="toggle-auto-purge-audit-logs"
                  onClick={() => setAutoPurgeAuditLogs30Days(!autoPurgeAuditLogs30Days)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoPurgeAuditLogs30Days ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoPurgeAuditLogs30Days ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Option: Max Log Entries */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-slate-200 block">Maximum Log Entries limit</span>
                    <p className="text-xs text-slate-400 max-w-md">The threshold of log entries kept in system memory before older records are truncated.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={10}
                      max={5000}
                      value={maxLogEntries}
                      onChange={(e) => setMaxLogEntries(Math.max(10, parseInt(e.target.value) || 0))}
                      className="w-24 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-2 text-slate-200 focus:outline-none font-mono text-center text-xs"
                    />
                    <span className="text-xs text-slate-500 font-mono">entries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Webhooks */}
          <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-emerald-400" />
              <span>External API Notification Links</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-200 block">Slack & Discord Hook Alerts</span>
                  <p className="text-xs text-slate-400 max-w-md">Relay critical notifications (e.g. offline pairing, halts, suspended limits) to slack channels.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDiscordWebhook(!discordWebhook)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    discordWebhook ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    discordWebhook ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {discordWebhook && (
                <div className="space-y-1.5 font-mono text-xs animate-in slide-in-from-top-2 duration-200">
                  <span className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Slack/Discord Webhook URL</span>
                  <input 
                    type="url" 
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Alert messages for status feedback */}
          {saveStatus.type !== 'idle' && (
            <div className={`p-4 rounded-lg flex items-start gap-3 text-xs animate-in fade-in duration-200 ${
              saveStatus.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {saveStatus.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{saveStatus.message}</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button 
              onClick={handleSaveSettings}
              disabled={isSaving || isLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-6 py-2.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'Applying Settings...' : 'Save All Configurations'}</span>
            </button>
            {isLoading && (
              <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Loading latest settings...</span>
              </span>
            )}
          </div>
        </div>

        {/* Status block (Span 1) */}
        <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-6 flex flex-col justify-between min-h-[300px]">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-200">Active Node Version</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Control panel cluster releases.</p>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900/60 font-mono text-xs space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Core Release:</span>
                <span className="text-slate-200">v4.8.2-stable</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Node cluster:</span>
                <span className="text-slate-200">v18.20.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vite compilation:</span>
                <span className="text-slate-200">v6.2.3</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-semibold text-xs py-2.5 rounded-lg transition-colors cursor-pointer mt-6">
            Force Cluster Restart
          </button>
        </div>
      </div>
    </div>
  );
}
