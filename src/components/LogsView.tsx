import React, { useState, useEffect, useRef } from 'react';
import { 
  ScrollText, 
  Trash2, 
  Play, 
  ArrowDownCircle, 
  Search, 
  Terminal,
  ShieldCheck,
  Send
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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);

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
  const logTypes = ['All', 'Info', 'Command', 'Error', 'Success'];

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'All') return true;
    return log.type === filterType.toLowerCase();
  });

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
          message: `Displaying loaded callback commands index: [${commands.map(c => `.${c.trigger}`).join(', ')}]`
        });
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">Syslog Stream</h1>
          <p className="text-xs text-slate-400">Stream compilation diagnostics, active WhatsApp/Telegram hook parameters, and gateway logs.</p>
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

      {/* Main Terminal Frame */}
      <div className="relative bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden flex flex-col h-[500px] sm:h-[560px] md:h-[620px]">
        {/* Sub Header / Filters */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {logTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  filterType === type 
                    ? 'bg-slate-900 border border-slate-800 text-blue-400 font-semibold' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                }`}
              >
                {type}
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
            <span>Type ".help" or ".alive" in the execution terminal below to test live hooks.</span>
          </div>

          {filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 select-text hover:bg-slate-900/30 py-0.5 rounded px-1.5 transition-colors">
              <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
              <span className={`text-[10px] shrink-0 font-bold px-1.5 rounded uppercase ${
                log.type === 'error' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                  : log.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : log.type === 'command'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {log.type}
              </span>
              <span className="text-slate-500 shrink-0 font-semibold">[{log.source}]</span>
              <span className="text-slate-200 break-all leading-relaxed">{log.message}</span>
            </div>
          ))}

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
              placeholder="Execute command on live cluster (e.g. .help, .alive, .ai write a poem)"
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
