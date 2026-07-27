import React from 'react';
import { ShieldCheck, FileText, Activity, X, Server, Lock, Globe, Cpu, CheckCircle2 } from 'lucide-react';

interface FooterModalsProps {
  activeModal: 'privacy' | 'terms' | 'status' | null;
  onClose: () => void;
}

export default function FooterModals({ activeModal, onClose }: FooterModalsProps) {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              {activeModal === 'privacy' && <ShieldCheck className="w-5 h-5" />}
              {activeModal === 'terms' && <FileText className="w-5 h-5" />}
              {activeModal === 'status' && <Activity className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <h2 className="font-sans font-bold text-lg text-slate-100">
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'terms' && 'Terms of Service'}
                {activeModal === 'status' && 'Hypervisor System Status'}
              </h2>
              <p className="text-xs text-slate-400">GURU-XD Enterprise Bot Hosting Platform • v1.0.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="overflow-y-auto space-y-4 text-xs font-sans text-slate-300 leading-relaxed pr-2">
          {activeModal === 'privacy' && (
            <>
              <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl text-blue-300 font-mono text-[11px] flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Enterprise Privacy Commitment: End-to-End Encryption & Zero Credential Leakage.</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 font-display">1. Information We Collect</h3>
              <p>
                GURU-XD processes minimum telemetry data necessary to orchestrate, execute, and scale multi-device WhatsApp, Telegram, and Discord bot container clusters. We collect account identifiers, encrypted OAuth session tokens, and container runtime metrics.
              </p>
              <h3 className="text-sm font-semibold text-slate-100 font-display">2. Data Security & Storage</h3>
              <p>
                All container state tokens and environment variables are encrypted at rest using AES-256-GCM and transmitted via TLS 1.3. Plaintext passwords or session keys are never stored in client-side code or browser local state.
              </p>
              <h3 className="text-sm font-semibold text-slate-100 font-display">3. Third-Party Integrations</h3>
              <p>
                Authentication services integrated via Google Identity Services, GitHub OAuth, or Firebase Cloud Firestore adhere strictly to enterprise scopes. We do not sell or monetize cluster telemetry data.
              </p>
            </>
          )}

          {activeModal === 'terms' && (
            <>
              <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl text-blue-300 font-mono text-[11px] flex items-center gap-2">
                <Globe className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Enterprise Service Agreement • SLA Guaranteed 99.99% Node Uptime.</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 font-display">1. Acceptable Use Policy</h3>
              <p>
                By accessing GURU-XD Enterprise Bot Hosting Platform, you agree not to utilize hosted bot containers for malicious spamming, automated phishing, distributed denial of service attacks, or unauthorized data scraping.
              </p>
              <h3 className="text-sm font-semibold text-slate-100 font-display">2. Cluster Resource Allocation</h3>
              <p>
                Subscribed tiers dictate maximum concurrent bot threads, memory thresholds, and NVMe SSD quotas. Automated rate-limiters will restrict instances exceeding CPU bandwidth allocations to preserve cluster stability.
              </p>
              <h3 className="text-sm font-semibold text-slate-100 font-display">3. Termination & Suspension</h3>
              <p>
                GURU-XD reserves the right to suspend or revoke access credentials for accounts violating platform safety standards or abusing gateway sockets.
              </p>
            </>
          )}

          {activeModal === 'status' && (
            <div className="space-y-4 font-mono">
              <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">ALL SYSTEMS OPERATIONAL</span>
                    <span className="text-[10px] text-slate-400">99.998% Uptime over last 90 days</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  HEALTHY
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-blue-400" /> Cluster Ingress</span>
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 12ms</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[98%]" />
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-blue-400" /> Gateway Sockets</span>
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 100%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[100%]" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-semibold">Node Regions</span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>eu-west-2 (London Cluster)</span>
                    <span className="text-emerald-400">Operational</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>us-east-1 (N. Virginia Cluster)</span>
                    <span className="text-emerald-400">Operational</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>ap-south-1 (Mumbai Gateway)</span>
                    <span className="text-emerald-400">Operational</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
