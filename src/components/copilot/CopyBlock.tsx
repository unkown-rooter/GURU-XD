import React, { useState } from 'react';
import { Copy, Check, Code, Terminal, FileCode, Server, Database, Shield, Zap } from 'lucide-react';

export interface CopyBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CopyBlock({ code, language = 'javascript', title }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getLanguageBadge = (lang: string) => {
    const l = lang.toLowerCase();
    if (l === 'js' || l === 'javascript' || l === 'node' || l === 'nodejs') {
      return { name: 'Node.js / JS', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Code };
    }
    if (l === 'python' || l === 'py') {
      return { name: 'Python', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: FileCode };
    }
    if (l === 'json') {
      return { name: 'JSON', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: FileCode };
    }
    if (l === 'yaml' || l === 'yml') {
      return { name: 'YAML', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: FileCode };
    }
    if (l === 'shell' || l === 'bash' || l === 'sh' || l === 'cmd') {
      return { name: 'Shell / Terminal', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Terminal };
    }
    if (l === 'sql' || l === 'postgres' || l === 'mongo') {
      return { name: 'Database / SQL', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: Database };
    }
    if (l === 'env' || l === 'environment') {
      return { name: 'Environment Secrets', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: Shield };
    }
    if (l === 'html' || l === 'css') {
      return { name: lang.toUpperCase(), color: 'bg-sky-500/10 text-sky-400 border-sky-500/20', icon: Code };
    }
    if (l === 'log' || l === 'logs') {
      return { name: 'Log Stream', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Server };
    }
    return { name: lang.toUpperCase(), color: 'bg-slate-800 text-slate-300 border-slate-700', icon: Zap };
  };

  const badge = getLanguageBadge(language);
  const IconComponent = badge.icon;

  return (
    <div className="my-3 rounded-xl bg-[#090D16] border border-slate-800/90 shadow-xl overflow-hidden font-mono group">
      {/* Block Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border ${badge.color}`}>
            <IconComponent className="w-3 h-3" />
            {badge.name}
          </span>
          {title && <span className="text-xs text-slate-400 font-sans truncate">{title}</span>}
        </div>

        <button
          onClick={handleCopy}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Container */}
      <div className="p-3.5 overflow-x-auto custom-scrollbar text-[11px] leading-relaxed text-slate-200 bg-[#060911]">
        <pre className="font-mono whitespace-pre">{code}</pre>
      </div>
    </div>
  );
}
