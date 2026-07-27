import React, { useState } from 'react';
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Eye, 
  EyeOff,
  Lock,
  Calendar,
  X
} from 'lucide-react';

export interface ApiKeyItem {
  id: string;
  name: string;
  keySecret: string;
  prefix: string;
  createdAt: string;
  expiresAt: string;
  scope: 'Full Admin' | 'Read/Write Apps' | 'Read-Only Telemetry';
  lastUsed: string;
}

interface ApiKeysViewProps {
  apiKeys: ApiKeyItem[];
  onCreateKey: (key: Omit<ApiKeyItem, 'id' | 'createdAt' | 'lastUsed'>) => void;
  onRevokeKey: (id: string) => void;
}

export default function ApiKeysView({ apiKeys, onCreateKey, onRevokeKey }: ApiKeysViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyScope, setKeyScope] = useState<ApiKeyItem['scope']>('Read/Write Apps');
  const [keyExpirationDays, setKeyExpirationDays] = useState(30);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null);

  const handleCopySecret = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const randomSecret = 'guru_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + Number(keyExpirationDays));

    onCreateKey({
      name: keyName.trim(),
      keySecret: randomSecret,
      prefix: randomSecret.substring(0, 14) + '...',
      expiresAt: expireDate.toISOString().split('T')[0],
      scope: keyScope
    });

    setKeyName('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Key className="w-6 h-6 text-blue-500" />
            <span>API Keys & Security Tokens</span>
          </h1>
          <p className="text-xs text-slate-400">Generate, scope, and manage programmatic authorization tokens for CI/CD integrations and REST APIs.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* Security Banner */}
      <div className="p-4 bg-blue-950/30 border border-blue-900/40 rounded-2xl flex items-center gap-3 text-xs text-blue-300">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
        <p className="leading-relaxed">
          API keys carry full service privileges according to their assigned scope. Keep your keys secret and never commit plain keys to public GitHub repositories.
        </p>
      </div>

      {/* Keys List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="p-4">Key Identifier</th>
                <th className="p-4">Secret Key Token</th>
                <th className="p-4">Access Scope</th>
                <th className="p-4">Created</th>
                <th className="p-4">Expires</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {apiKeys.map((item) => {
                const isVisible = visibleKeyId === item.id;
                const isCopied = copiedId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-sans font-semibold text-slate-100">{item.name}</td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] text-blue-400 font-mono">
                          {isVisible ? item.keySecret : item.prefix}
                        </span>
                        <button
                          onClick={() => setVisibleKeyId(isVisible ? null : item.id)}
                          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                          title={isVisible ? 'Hide Key' : 'Reveal Secret'}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopySecret(item.id, item.keySecret)}
                          className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                          title="Copy Key Secret"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {item.scope}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{item.createdAt}</td>
                    <td className="p-4 text-slate-400">{item.expiresAt}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onRevokeKey(item.id)}
                        className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Revoke Token
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100">Generate New API Key</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Key Name / Description</label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. GitHub Actions Deployment Pipeline"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Permission Scope</label>
                <select
                  value={keyScope}
                  onChange={(e) => setKeyScope(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Full Admin">Full Admin (Deploy, Modify, Delete)</option>
                  <option value="Read/Write Apps">Read/Write Apps & Instances</option>
                  <option value="Read-Only Telemetry">Read-Only Logs & Analytics</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Key Expiration (Days)</label>
                <select
                  value={keyExpirationDays}
                  onChange={(e) => setKeyExpirationDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year</option>
                  <option value={9999}>Never Expire</option>
                </select>
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
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
