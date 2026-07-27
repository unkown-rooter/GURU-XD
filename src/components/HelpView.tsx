import React, { useState } from 'react';
import { 
  HelpCircle, 
  Code, 
  Terminal, 
  BookOpen, 
  FileCode, 
  Copy, 
  Check, 
  Layers, 
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';

export default function HelpView() {
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [activeTab, setActiveTab] = useState<'docs' | 'sdk' | 'faq'>('docs');

  const sdkManifestExample = `{
  "id": "guru-anti-link-guard",
  "name": "Anti-Link Security Guard",
  "version": "2.4.0",
  "author": "GURU Security Lab",
  "category": "Automation",
  "permissions": [
    "read_messages",
    "delete_messages",
    "kick_participants"
  ],
  "commands": [
    { "trigger": ".antilink", "description": "Toggle link protection on group chat" }
  ],
  "configSchema": {
    "MAX_WARNINGS": 3,
    "ALLOW_WHITELIST_DOMAINS": ["guru-xd.com", "github.com"]
  }
}`;

  const handleCopySdk = () => {
    navigator.clipboard.writeText(sdkManifestExample);
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-500" />
            <span>Help Center & Developer Plugin SDK</span>
          </h1>
          <p className="text-xs text-slate-400">Documentation, API reference manuals, and Plugin SDK specifications for building third-party extensions.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-sans text-xs">
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === 'docs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
          }`}
        >
          System Documentation
        </button>
        <button
          onClick={() => setActiveTab('sdk')}
          className={`px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === 'sdk' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
          }`}
        >
          Plugin SDK Reference
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors ${
            activeTab === 'faq' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
          }`}
        >
          Frequently Asked Questions
        </button>
      </div>

      {activeTab === 'sdk' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-slate-100">GURU-XD Plugin Manifest Specification (v2.0)</h3>
              </div>
              <button
                onClick={handleCopySdk}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono cursor-pointer transition-colors"
              >
                {copiedSdk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSdk ? 'Copied Manifest' : 'Copy JSON'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Every plugin published to the Plugin Marketplace requires a valid JSON manifest describing its entry point, permissions scope, custom commands, and environment variables.
            </p>

            <pre className="p-4 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-blue-300 overflow-x-auto">
              {sdkManifestExample}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Connecting WhatsApp & Telegram Instances</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              GURU-XD supports multi-session pairing codes and QR codes for WhatsApp Web (Baileys daemon) and bot tokens for Telegram / Discord.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>AI Copilot Smart Execution</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask AI Copilot to restart containers, optimize RAM limits, or create new bot instances using natural language.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
            <h4 className="font-bold text-xs text-slate-100">How do atomic container rollbacks work?</h4>
            <p className="text-xs text-slate-400">Deployments are built into immutable Docker images. Rolling back instantaneously redirects traffic to the prior container image without downtime.</p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
            <h4 className="font-bold text-xs text-slate-100">Are WhatsApp and Telegram sessions saved across server restarts?</h4>
            <p className="text-xs text-slate-400">Yes! Credentials and auth session keys are backed up in secure MongoDB / Firestore collections and synced to persistent storage.</p>
          </div>
        </div>
      )}
    </div>
  );
}
