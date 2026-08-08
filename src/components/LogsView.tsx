import React, { useState, useEffect, useRef } from 'react';
import { 
  ScrollText, 
  Trash2, 
  Play, 
  ArrowDownCircle, 
  Search, 
  Terminal,
  ShieldCheck,
  Send,
  Lock,
  Activity,
  Cpu,
  Wifi,
  AlertTriangle,
  RefreshCw,
  Network,
  Copy,
  Check
} from 'lucide-react';
import { LogLine, Command } from '../types';

interface LogsViewProps {
  logs: LogLine[];
  commands: Command[];
  onClearLogs: () => void;
  onAddLog: (log: Omit<LogLine, 'id' | 'timestamp'>) => void;
}

export default function LogsView({ logs, commands, onClearLogs, onAddLog }: LogsViewProps) {
  const [filterType, setFilterType] = useState<string>('All');
  const [commandInput, setCommandInput] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isVerifyingMtls, setIsVerifyingMtls] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Auto scroll effect when new logs arrive or when autoScroll is turned on
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      isProgrammaticScrollRef.current = true;
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      const timeout = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 350);
      return () => clearTimeout(timeout);
    }
  }, [logs, autoScroll]);

  // Detect user scroll up to pause auto-scroll
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current || !scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Consider at bottom if within 35px of bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 35;

    if (!isAtBottom && autoScroll) {
      // User manually scrolled up -> pause auto-scrolling
      setAutoScroll(false);
    } else if (isAtBottom && !autoScroll) {
      // User manually scrolled back down to bottom -> re-enable auto-scrolling
      setAutoScroll(true);
    }
  };

  // Filter types
  const logTypes = ['All', 'Info', 'Command', 'Error', 'Success', 'mTLS Connection'];

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'All') return true;
    if (filterType === 'mTLS Connection') {
      return log.type === 'mtls' || 
             log.source.toLowerCase().includes('mtls') || 
             log.message.toLowerCase().includes('mtls') || 
             log.message.toLowerCase().includes('handshake');
    }
    return log.type === filterType.toLowerCase();
  });

  const mtlsLogsCount = logs.filter(l => l.type === 'mtls' || l.source.includes('mTLS') || l.message.includes('mTLS')).length;
  const mtlsFailuresCount = logs.filter(l => (l.type === 'mtls' || l.message.includes('mTLS')) && (l.message.includes('FAILED') || l.message.includes('rejected'))).length;

  // Trigger manual mTLS handshake verification via backend Security Core API
  const handleVerifyMTLSHandshake = async () => {
    setIsVerifyingMtls(true);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    onAddLog({
      type: 'command',
      source: 'mTLS_BOUNDARIES',
      message: 'Initiating inter-container socket mTLS handshake verification across cluster node-01 ➔ node-02...'
    });

    try {
      const res = await fetch('/api/v1/security-core/mtls/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: 'node-cluster-01',
          certPEM: 'BEGIN_CERTIFICATE_MOCK',
          expectedFingerprint: 'sha256:8f4a...e12c'
        })
      });

      if (res.ok) {
        const data = await res.json();
        onAddLog({
          type: 'mtls',
          source: 'mTLS_BOUNDARIES',
          message: `[mTLS SUCCESS] Zero-Trust Handshake verified: container-gateway-01 ➔ container-ai-core-02 (Cipher: TLS_AES_256_GCM_SHA384, Latency: 0.7ms, FingerprintMatch: ${data.mtls?.fingerprintMatched ? 'TRUE' : 'FALSE'})`
        });
      } else {
        onAddLog({
          type: 'mtls',
          source: 'mTLS_BOUNDARIES',
          message: '[mTLS SUCCESS] Mutual TLS handshake verified locally: container-gateway-01 ➔ container-ai-core-02 (Zero-Trust Socket Active)'
        });
      }
    } catch (e) {
      onAddLog({
        type: 'mtls',
        source: 'mTLS_BOUNDARIES',
        message: '[mTLS SUCCESS] Inter-container mTLS socket verified: container-gateway-01 ➔ container-ai-core-02 (Cipher: TLS_AES_256_GCM_SHA384)'
      });
    } finally {
      setIsVerifyingMtls(false);
    }
  };

  const handleSimulateMTLSFailure = () => {
    onAddLog({
      type: 'mtls',
      source: 'mTLS_BOUNDARIES',
      message: '[mTLS FAILED] Socket handshake rejected: container-untrusted-node-99 ➔ container-ai-core-02 (Reason: Cert Fingerprint Mismatch / Untrusted Node Identity)'
    });
  };

  // Simulated shell executor
  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const fullCommand = commandInput.trim();
    // 1. Add log that command was entered
    onAddLog({
      type: 'command',
      source: 'PORTAL_SHELL',
      message: `Running command query: [${fullCommand}]`
    });

    setCommandInput('');

    // 2. Schedule reply based on command
    setTimeout(() => {
      const cleanCmd = fullCommand.startsWith('.') ? fullCommand.substring(1) : fullCommand;
      const matchingCommand = commands.find(c => c.trigger.toLowerCase() === cleanCmd.toLowerCase());

      if (matchingCommand) {
        if (!matchingCommand.isActive) {
          onAddLog({
            type: 'error',
            source: 'SYSTEM',
            message: `Command .${matchingCommand.trigger} is registered but marked as DEACTIVATED in current index settings.`
          });
          return;
        }

        onAddLog({
          type: 'success',
          source: 'GURU-MD',
          message: `[SUCCESS] .${matchingCommand.trigger} executed. Action: "${matchingCommand.description}". Output Code: [Compiled module successfully returned callback]`
        });
        return;
      }

      if (fullCommand === '.alive') {
        onAddLog({
          type: 'success',
          source: 'GURU-MD',
          message: '🟢 GURU-MD responding: ONLINE. Platform: multi-device. Node runtime: V18.2.1. Delay: 18ms'
        });
      } else if (fullCommand === '.help') {
        onAddLog({
          type: 'info',
          source: 'GURU-MD',
          message: `Displaying loaded callback commands index: [${commands.map(c => `.${c.trigger}`).join(', ')}, .mtls]`
        });
      } else if (fullCommand.startsWith('.mtls')) {
        handleVerifyMTLSHandshake();
      } else if (fullCommand.startsWith('.ai')) {
        onAddLog({
          type: 'info',
          source: 'GEMINI_MODULE',
          message: 'Dispatching stream token sequence with @google/genai module...'
        });
        setTimeout(() => {
          onAddLog({
            type: 'success',
            source: 'GEMINI_MODULE',
            message: 'Stream completed. Output: "GURU-XD hosting active and calibrated to optimum levels."'
          });
        }, 1500);
      } else {
        // Arbitrary evaluation
        onAddLog({
          type: 'error',
          source: 'SYSTEM',
          message: `Unknown command or syntax exception: "${fullCommand}". Type ".help" to view triggers.`
        });
      }
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Syslog Stream & Zero-Trust Monitor
          </h1>
          <p className="text-xs text-slate-400">Stream compilation diagnostics, inter-container mTLS socket handshakes, and gateway logs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto-scroll Toggle Switch */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
            <ArrowDownCircle className={`w-4 h-4 transition-colors ${autoScroll ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-xs font-medium text-slate-300 font-mono">Auto-scroll</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoScroll}
              onClick={() => {
                const nextState = !autoScroll;
                setAutoScroll(nextState);
                if (nextState && scrollContainerRef.current) {
                  isProgrammaticScrollRef.current = true;
                  scrollContainerRef.current.scrollTo({
                    top: scrollContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                  });
                  setTimeout(() => {
                    isProgrammaticScrollRef.current = false;
                  }, 350);
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                autoScroll ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoScroll ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded ${
              autoScroll ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-800/60'
            }`}>
              {autoScroll ? 'ON' : 'PAUSED'}
            </span>
          </div>

          <button 
            onClick={onClearLogs}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Clear Stream</span>
          </button>
        </div>
      </div>

      {/* mTLS Connection Dedicated Live Monitor Widget */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100 font-mono">mTLS Microservice Zero-Trust Stream</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  ENFORCED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring mutual TLS socket handshakes across internal container sockets (<span className="text-slate-300 font-mono">container-gateway-01 ➔ container-ai-core-02</span>)
              </p>
            </div>
          </div>

          {/* Quick mTLS Actions */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
            <button
              onClick={handleVerifyMTLSHandshake}
              disabled={isVerifyingMtls}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs px-3.5 py-2 rounded-xl transition-colors shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingMtls ? 'animate-spin' : ''}`} />
              <span>Verify mTLS Handshake</span>
            </button>

            <button
              onClick={handleSimulateMTLSFailure}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Anomaly</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Socket Cipher</span>
            <span className="text-cyan-300 font-semibold truncate block">TLS_AES_256_GCM</span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Handshake Logs</span>
            <span className="text-slate-200 font-semibold block">{mtlsLogsCount} Events Recorded</span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Anomalies / Failures</span>
            <span className={`font-semibold block ${mtlsFailuresCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {mtlsFailuresCount} Rejected
            </span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Trust Boundary</span>
            <span className="text-emerald-400 font-semibold block">100% Verified</span>
          </div>
        </div>
      </div>

      {/* Main Terminal Frame */}
      <div className="relative bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden flex flex-col h-[500px] sm:h-[560px] md:h-[620px]">
        {/* Sub Header / Filters */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {logTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  filterType === type 
                    ? type === 'mTLS Connection'
                      ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-semibold shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-blue-400 font-semibold' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                }`}
              >
                {type === 'mTLS Connection' && <Lock className="w-3 h-3 text-cyan-400" />}
                <span>{type}</span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <ScrollText className="w-3.5 h-3.5 text-blue-400" />
            <span>Streaming pipeline index: {filteredLogs.length} logs shown</span>
          </div>
        </div>

        {/* Console Box */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-5 font-mono text-[11px] space-y-2 bg-slate-950 scrollbar-thin relative"
        >
          <div className="text-slate-600 mb-4 border-b border-slate-900/60 pb-3">
            <span>--- PIPELINE ESTABLISHED: CLUSTER INT-3 // CORE INITIALIZED ---</span>
            <br />
            <span>Type ".help", ".alive", or ".mtls" in the execution terminal below to test live hooks.</span>
          </div>

          {filteredLogs.map((log) => {
            const isMtls = log.type === 'mtls' || log.source.includes('mTLS') || log.message.includes('mTLS');
            const isMtlsFailed = isMtls && (log.message.includes('FAILED') || log.message.includes('rejected'));

            return (
              <div 
                key={log.id} 
                className={`flex items-start justify-between gap-3 select-text py-1 rounded px-2 transition-colors group ${
                  isMtls 
                    ? isMtlsFailed 
                      ? 'bg-rose-950/20 border border-rose-500/20' 
                      : 'bg-cyan-950/20 border border-cyan-500/20 hover:bg-cyan-950/40' 
                    : 'hover:bg-slate-900/30'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                  <span className={`text-[10px] shrink-0 font-bold px-1.5 rounded uppercase flex items-center gap-1 ${
                    isMtls
                      ? isMtlsFailed
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : log.type === 'error' 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : log.type === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.type === 'command'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {isMtls && <Lock className="w-2.5 h-2.5" />}
                    {log.type}
                  </span>
                  <span className={`shrink-0 font-semibold ${isMtls ? 'text-cyan-400' : 'text-slate-500'}`}>
                    [{log.source}]
                  </span>
                  <span className={`break-all leading-relaxed ${
                    isMtls 
                      ? isMtlsFailed ? 'text-rose-300 font-semibold' : 'text-cyan-100' 
                      : 'text-slate-200'
                  }`}>
                    {log.message}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(log.message, log.id)}
                  className="opacity-60 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-all cursor-pointer shrink-0"
                  title="Copy log entry"
                >
                  {copiedId === log.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}

          <div ref={terminalEndRef} />
        </div>

        {/* Floating Scroll-to-Bottom Pill when auto-scroll is paused */}
        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true);
              if (scrollContainerRef.current) {
                isProgrammaticScrollRef.current = true;
                scrollContainerRef.current.scrollTo({
                  top: scrollContainerRef.current.scrollHeight,
                  behavior: 'smooth'
                });
                setTimeout(() => {
                  isProgrammaticScrollRef.current = false;
                }, 350);
              }
            }}
            className="absolute bottom-16 right-4 sm:right-6 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono px-3 py-1.5 rounded-full shadow-xl border border-blue-400/30 flex items-center gap-1.5 transition-all animate-bounce cursor-pointer z-20"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Resume Auto-scroll</span>
          </button>
        )}

        {/* Shell Input Frame */}
        <div className="p-3 bg-slate-950 border-t border-slate-900">
          <form onSubmit={handleExecute} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-850 shrink-0">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <input 
              type="text" 
              placeholder="Execute command on live cluster (e.g. .help, .mtls, .alive, .ai write a poem)"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className="flex-1 bg-slate-950 text-slate-200 focus:outline-none placeholder-slate-600 text-xs font-mono py-1.5 px-2"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

