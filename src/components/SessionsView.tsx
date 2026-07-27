import React, { useState } from 'react';
import { 
  Radio, 
  Smartphone, 
  MapPin, 
  Link, 
  Globe, 
  Clock, 
  Power, 
  RefreshCw,
  Plus
} from 'lucide-react';
import { Session } from '../types';

interface SessionsViewProps {
  sessions: Session[];
  onDisconnectSession: (id: string) => void;
  onRefresh: () => void;
}

export default function SessionsView({ sessions, onDisconnectSession, onRefresh }: SessionsViewProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDisconnect = (id: string) => {
    setLoadingId(id);
    setTimeout(() => {
      onDisconnectSession(id);
      setLoadingId(null);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">Active Device Links</h1>
          <p className="text-xs text-slate-400">Monitor active authentication sockets, linked browsers, and Multi-Device session channels.</p>
        </div>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer self-start"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Sync Active Sockets</span>
        </button>
      </div>

      {/* Grid of link sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((sess) => {
          const isConnected = sess.status === 'connected';
          const isPending = sess.status === 'pending';
          return (
            <div 
              key={sess.id}
              className={`p-6 rounded-2xl bg-slate-950/20 border flex flex-col justify-between space-y-6 transition-all duration-300 ${
                isConnected 
                  ? 'border-slate-900 hover:border-slate-800' 
                  : 'border-rose-950/20 bg-rose-950/5 hover:border-rose-900/20'
              }`}
            >
              {/* Header row */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                    isConnected 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' 
                      : isPending 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}>
                    <Smartphone className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-200">{sess.device}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-500">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{sess.ip}</span>
                    </div>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold border uppercase ${
                  isConnected 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : isPending
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {sess.status}
                </span>
              </div>

              {/* Geo details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono py-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900/60">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans tracking-wider font-semibold">Location Cluster</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sess.location}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans tracking-wider font-semibold">Last Active Sync</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sess.activeAt}</span>
                  </div>
                </div>
              </div>

              {/* Kill link button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-mono text-slate-500">
                  REF-TOKEN: sess_token_{sess.id.replace('sess-', '00')}
                </span>
                
                {isConnected && (
                  <button
                    onClick={() => handleDisconnect(sess.id)}
                    disabled={loadingId === sess.id}
                    className="flex items-center gap-1.5 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-950/60 hover:border-rose-900 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{loadingId === sess.id ? 'Revoking...' : 'Revoke Session'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
