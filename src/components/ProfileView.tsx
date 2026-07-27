import React, { useState, useEffect } from 'react';
import logoUrl from '../assets/images/guru_xd_logo_1784332841454.jpg';
import { 
  User, 
  Key, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Copy,
  Check,
  CreditCard,
  Zap,
  Sparkles,
  Server,
  Database,
  Lock,
  ArrowRight,
  ShieldAlert,
  Coins
} from 'lucide-react';
import { Subscription } from '../types';

interface ProfileViewProps {
  subscription: Subscription;
  onUpgradeSubscription: (plan: 'enterprise' | 'ultimate' | 'premium') => Promise<void>;
}

export default function ProfileView({ subscription, onUpgradeSubscription }: ProfileViewProps) {
  const [showAPIKey, setShowAPIKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'enterprise' | 'ultimate' | null>(null);
  
  // Credit card form mock states
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCVC, setCardCVC] = useState('•••');
  const [cardName, setCardName] = useState('Primary Administrator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load credentials from server environment
  const [apiKey, setApiKey] = useState('gr-live_9438275983759843279584379258943');
  const [envStatus, setEnvStatus] = useState({
    hasCustomMongoUri: false,
    hasCustomApiKey: false,
    hasCustomDiscordWebhook: false,
    hasGeminiApiKey: false
  });

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const res = await fetch('/api/credentials');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setApiKey(data.adminApiKey);
            setEnvStatus({
              hasCustomMongoUri: data.hasCustomMongoUri,
              hasCustomApiKey: data.hasCustomApiKey,
              hasCustomDiscordWebhook: data.hasCustomDiscordWebhook,
              hasGeminiApiKey: data.hasGeminiApiKey
            });
          }
        }
      } catch (err) {
        console.error("Failed to load environment credentials:", err);
      }
    };
    fetchCredentials();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startUpgrade = (plan: 'enterprise' | 'ultimate') => {
    setSelectedPlan(plan);
    setIsUpgrading(true);
    setShowSuccess(false);
  };

  const handleCancelUpgrade = () => {
    setIsUpgrading(false);
    setSelectedPlan(null);
  };

  const handleConfirmUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    
    setIsSubmitting(true);
    // Simulate payment transaction
    setTimeout(async () => {
      try {
        await onUpgradeSubscription(selectedPlan);
        setIsSubmitting(false);
        setShowSuccess(true);
        setTimeout(() => {
          setIsUpgrading(false);
          setSelectedPlan(null);
          setShowSuccess(false);
        }, 2000);
      } catch (err) {
        setIsSubmitting(false);
        alert("Transaction failed. Please try again.");
      }
    }, 1500);
  };

  const getPlanDetails = (plan: 'enterprise' | 'ultimate') => {
    if (plan === 'enterprise') {
      return {
        name: "ENTERPRISE PRO",
        price: "$99/mo",
        hostedLimit: "Unlimited Nodes",
        storageLimit: "1 TB NVMe SSD",
        features: [
          "Unlimited Bot Clusters & Instances",
          "Dedicated Hypervisor Cores",
          "Priority 24/7 SLA Tech Support",
          "Encrypted Daily State Backups",
          "Custom API Integrations & Webhooks",
          "Enterprise DDoS Spam Protection"
        ]
      };
    } else {
      return {
        name: "ULTIMATE DEPLOYER",
        price: "$199/mo",
        hostedLimit: "Unlimited HA Cores",
        storageLimit: "5 TB NVMe Enterprise Raid",
        features: [
          "Multi-Region Redundant Failovers",
          "Uncapped Network Sockets (10 Gbps)",
          "Antigravity Low-latency Thread Pooling",
          "Advanced Custom LLM Plug-ins",
          "Dedicated Account Security Engineer",
          "Bespoke Cluster Management Suite"
        ]
      };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">Admin Portal & Billing</h1>
          <p className="text-xs text-slate-400">Manage administrative credentials, API access keys, and host subscription tier configurations.</p>
        </div>
        
        {subscription.isUpgraded && (
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>VIP CLUSTER SUBSCRIPTION ACTIVE</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Profile Card & Info (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Credentials */}
          <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-semibold text-slate-200">Personal Information</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-900/60">
              <img 
                src={logoUrl} 
                alt="Profile Avatar" 
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-800"
              />
              <div className="space-y-1.5 text-center sm:text-left font-mono">
                <span className="text-slate-200 font-bold text-lg font-sans block">Primary Administrator</span>
                <span className="text-slate-500 text-xs block">admin@guru-xd.com</span>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full uppercase">
                    Owner Level 3
                  </span>
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-full uppercase">
                    {subscription.tier}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <span className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">User identifier</span>
                <input 
                  type="text" 
                  disabled 
                  value="usr_0093821"
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg p-3 text-slate-400 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Sign In IP Address</span>
                <input 
                  type="text" 
                  disabled 
                  value="109.243.120.46"
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg p-3 text-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card: API Token Key */}
          <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">API Access Key</h2>
              <p className="text-[11px] text-slate-500">Provide this secret token to interface exterior clients or server requests with the cluster backend.</p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="relative flex-1">
                <input 
                  type={showAPIKey ? 'text' : 'password'} 
                  disabled 
                  value={apiKey}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg p-3 pr-10 text-slate-300 focus:outline-none tracking-wider"
                />
                <button
                  onClick={() => setShowAPIKey(!showAPIKey)}
                  className="absolute right-3 top-2.5 p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showAPIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="p-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer shrink-0"
                title="Copy Token to Clipboard"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* NEW: Production Hosting & Environment Integration Status */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.01] rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-semibold font-display text-slate-200">Production Deployment Status</h3>
                  <p className="text-[11px] text-slate-400">Decoupled system telemetry and environment variables verification.</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono px-2 py-1 rounded-md shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span>ONLINE HOSTING SYSTEM OK</span>
              </div>
            </div>

            {/* Hosting environment info bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-slate-900/60 rounded-xl p-3.5 space-y-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">ACTIVE ROUTING GATEWAY</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-mono font-semibold text-slate-300">Cloud Run Production Ingress</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Serving incoming webhook queries securely via port 3000 to reverse-proxy cluster modules.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-900/60 rounded-xl p-3.5 space-y-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">STATE RECOVERY PERSISTENCE</span>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${envStatus.hasCustomMongoUri ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {envStatus.hasCustomMongoUri ? 'Active Atlas Cloud Sync' : 'Dynamic Session Persistence'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  {envStatus.hasCustomMongoUri 
                    ? 'Connected securely to external database cluster. Schema mutations writing to collection ledgers in real-time.' 
                    : 'Currently executing inside dynamic local container storage. Define MONGODB_URI to activate Atlas.'}
                </p>
              </div>
            </div>

            {/* Credentials Validation Matrix */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Real-World Integration Checklist</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. MONGODB_URI */}
                <div className="flex items-start justify-between p-3 bg-slate-900/25 border border-slate-900 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-200 block">MONGODB_URI</span>
                    <p className="text-[10px] text-slate-500">External Atlas database connection state.</p>
                  </div>
                  {envStatus.hasCustomMongoUri ? (
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                      STANDBY DEMO
                    </span>
                  )}
                </div>

                {/* 2. GEMINI_API_KEY */}
                <div className="flex items-start justify-between p-3 bg-slate-900/25 border border-slate-900 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-200 block">GEMINI_API_KEY</span>
                    <p className="text-[10px] text-slate-500">AI Terminal Copilot & WhatsApp/TG models.</p>
                  </div>
                  {envStatus.hasGeminiApiKey ? (
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                      OPERATIONAL
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase">
                      PENDING KEY
                    </span>
                  )}
                </div>

                {/* 3. ADMIN_API_KEY */}
                <div className="flex items-start justify-between p-3 bg-slate-900/25 border border-slate-900 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-200 block">ADMIN_API_KEY</span>
                    <p className="text-[10px] text-slate-500">Secures remote endpoints.</p>
                  </div>
                  {envStatus.hasCustomApiKey ? (
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                      CONFIGURED
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                      DEFAULT DEMO
                    </span>
                  )}
                </div>

                {/* 4. DISCORD_WEBHOOK_URL */}
                <div className="flex items-start justify-between p-3 bg-slate-900/25 border border-slate-900 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-200 block">DISCORD_WEBHOOK</span>
                    <p className="text-[10px] text-slate-500">Relays cluster crash telemetry logs.</p>
                  </div>
                  {envStatus.hasCustomDiscordWebhook ? (
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                      ACTIVE HOOK
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                      DISABLED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Hosting platform guidelines */}
            <div className="bg-blue-500/[0.03] border border-blue-500/10 rounded-xl p-3.5 space-y-1.5 font-sans">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Securing Production Environment Hosting</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When deploying to online hosting platforms (such as <strong>Render</strong>, <strong>Railway</strong>, <strong>Cloud Run</strong>, or <strong>Vercel</strong>), ensure you add the variables listed in <code>.env.example</code> into your hosting dashboard secrets console. This completely removes hardcoded demo fallback values and routes state transitions to your live databases.
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Status Panel */}
        <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-6 flex flex-col justify-between min-h-[340px]">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-200">Subscription Status</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Your hosting plan specs & renewal milestones.</p>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900/60 font-mono text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tier:</span>
                <span className={`${subscription.isUpgraded ? 'text-amber-400' : 'text-blue-400'} font-bold`}>
                  {subscription.tier}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Hosted limit:</span>
                <span className="text-slate-200">{subscription.hostedLimit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Server renewal:</span>
                <span className="text-slate-200">{subscription.renewalDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Storage allocation:</span>
                <span className="text-slate-200">{subscription.storageLimit}</span>
              </div>
            </div>
          </div>

          {!subscription.isUpgraded ? (
            <div className="bg-gradient-to-r from-blue-900/10 to-amber-500/5 border border-slate-850 p-3 rounded-xl mt-4">
              <span className="text-[10px] text-slate-400 leading-normal block">
                ⭐ You are on the standard VIP plan. Upgrade to unleash unlimited instances & ultra-performance threads.
              </span>
            </div>
          ) : (
            <button 
              onClick={() => onUpgradeSubscription('premium')}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 font-semibold text-[11px] py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              Downgrade to Premium Plan ($29/mo)
            </button>
          )}
        </div>
      </div>

      {/* Pricing and Upgrades Plans Area */}
      {!isUpgrading ? (
        <div className="space-y-6">
          <div className="border-t border-slate-900 pt-8">
            <h2 className="text-lg font-bold font-display text-slate-100">Host Upgrade Clusters</h2>
            <p className="text-xs text-slate-400">Scale up your background deamons with high-availability bare-metal resources.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Plan 1: Enterprise Pro */}
            <div className={`border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
              subscription.tier === 'ENTERPRISE PRO' 
                ? 'bg-blue-950/10 border-blue-500/40 shadow-xl shadow-blue-950/20' 
                : 'bg-slate-950/10 border-slate-900 hover:border-slate-800'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-blue-400 font-mono text-[10px] uppercase tracking-widest font-bold">Recommended for Teams</span>
                    <h3 className="text-xl font-bold font-display text-slate-100 mt-1">Enterprise Pro</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-100 font-mono">$99</span>
                    <span className="text-xs text-slate-500 block">per month</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Power multiple active bots simultaneously with dedicated hypervisor hardware and 1 TB of high-speed SSD.
                </p>

                <div className="border-t border-slate-900/60 my-4 pt-4 space-y-2.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">KEY CAPABILITIES:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Unlimited Bot Instances</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Dedicated Cores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>1 TB NVMe SSD</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>SLA 24/7 Priority</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                {subscription.tier === 'ENTERPRISE PRO' ? (
                  <div className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-center py-2.5 rounded-xl text-xs font-semibold">
                    YOUR CURRENT ACTIVE TIER
                  </div>
                ) : (
                  <button 
                    onClick={() => startUpgrade('enterprise')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Upgrade to Enterprise Pro</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Card Plan 2: Ultimate Deployer */}
            <div className={`border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
              subscription.tier === 'ULTIMATE DEPLOYER' 
                ? 'bg-amber-950/10 border-amber-500/40 shadow-xl shadow-amber-950/20' 
                : 'bg-slate-950/10 border-slate-900 hover:border-slate-800'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
              <div className="absolute top-3 right-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-full uppercase">
                MAX SPECS
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-amber-400 font-mono text-[10px] uppercase tracking-widest font-bold">Uncapped Operations</span>
                    <h3 className="text-xl font-bold font-display text-slate-100 mt-1">Ultimate Deployer</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-100 font-mono">$199</span>
                    <span className="text-xs text-slate-500 block">per month</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Bespoke, multi-region redundant thread clusters. Designed for massive enterprise messaging campaigns and custom integrations.
                </p>

                <div className="border-t border-slate-900/60 my-4 pt-4 space-y-2.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">KEY CAPABILITIES:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>High-Availability Cores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>5 TB Enterprise Raid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Multi-Region Failover</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Uncapped Web Sockets</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                {subscription.tier === 'ULTIMATE DEPLOYER' ? (
                  <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-center py-2.5 rounded-xl text-xs font-semibold">
                    YOUR CURRENT ACTIVE TIER
                  </div>
                ) : (
                  <button 
                    onClick={() => startUpgrade('ultimate')}
                    className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Upgrade to Ultimate Deployer</span>
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Checkout Screen */
        <div className="border border-slate-900 bg-slate-950/40 rounded-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-900 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 font-display">Secure Portal Checkout</h3>
                <p className="text-[10px] text-slate-500">Encrypted payment verification tunnel</p>
              </div>
            </div>
            <button 
              onClick={handleCancelUpgrade}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Cancel Transaction
            </button>
          </div>

          {showSuccess ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-100 font-display">Transaction Complete!</h4>
                <p className="text-xs text-emerald-400 font-mono">Cluster core authorization successful.</p>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Subscription credentials have been synchronized and applied to the database ledger. System logging thread generated.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Checkout Form */}
              <form onSubmit={handleConfirmUpgrade} className="lg:col-span-3 space-y-5 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Cardholder Name</label>
                  <input 
                    type="text" 
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Credit Card Number</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none tracking-widest"
                    />
                    <CreditCard className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Expiration Date</label>
                    <input 
                      type="text" 
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">CVC Security Code</label>
                    <input 
                      type="text" 
                      required
                      maxLength={4}
                      value={cardCVC}
                      onChange={(e) => setCardCVC(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none text-center"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-950/10 border border-blue-900/20 rounded-xl text-slate-400 text-[10px] leading-relaxed flex items-start gap-2.5 font-sans">
                  <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Your transaction details are secure under industry-grade, bank-level RSA 2048 encryption schemas. All payments are securely routed and processed offline.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Encrypting Payment Stream...</span>
                  ) : (
                    <>
                      <span>Authorize billing upgrade transaction of {getPlanDetails(selectedPlan).price}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Selected Plan Details Recap */}
              <div className="lg:col-span-2 bg-slate-950/60 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 font-bold block">UPGRADE TARGET SPECIFICATION</span>
                    <h4 className="text-xl font-bold font-display text-slate-100 mt-1">
                      {getPlanDetails(selectedPlan).name}
                    </h4>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-900/80 font-mono text-xs space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Upgrade fee:</span>
                      <span className="text-slate-100 font-bold">{getPlanDetails(selectedPlan).price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Instance limit:</span>
                      <span className="text-slate-100">{getPlanDetails(selectedPlan).hostedLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Disk allocation:</span>
                      <span className="text-slate-100">{getPlanDetails(selectedPlan).storageLimit}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase block">INCLUDED BENEFITS:</span>
                    <ul className="text-[11px] space-y-1.5 text-slate-300">
                      {getPlanDetails(selectedPlan).features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-4 mt-6 flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-mono text-slate-400 uppercase">FULLY LICENSED & COMPLIANT</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
