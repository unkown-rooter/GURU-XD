import React, { useState } from 'react';
import { 
  CreditCard, 
  Check, 
  Zap, 
  ShieldCheck, 
  Download, 
  ArrowRight, 
  Sparkles,
  Server,
  Layers,
  BarChart2
} from 'lucide-react';
import { Subscription } from '../types';

interface BillingViewProps {
  subscription: Subscription;
  onUpgradeTier: (tierName: string, price: string) => void;
}

export default function BillingView({ subscription, onUpgradeTier }: BillingViewProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(subscription.tier);

  const plans = [
    {
      name: 'Starter Sandbox',
      price: '$0',
      period: '/month',
      description: 'Ideal for individuals testing bot command scripts.',
      features: [
        'Up to 2 Bot Instances',
        '256 MB RAM per instance',
        '1 GB SSD Storage',
        'Standard Community Support',
        'Shared IP Gateway'
      ]
    },
    {
      name: 'Pro Cluster',
      price: '$19',
      period: '/month',
      badge: 'POPULAR',
      description: 'Perfect for small businesses and active WhatsApp/Telegram communities.',
      features: [
        'Up to 10 Bot Instances',
        '1024 MB RAM per instance',
        '20 GB NVMe SSD Storage',
        'Priority SLA Support',
        'Custom Domain & Webhooks',
        'AI Copilot Unlocked'
      ]
    },
    {
      name: 'Enterprise OS',
      price: '$99',
      period: '/month',
      description: 'Dedicated hypervisor clusters for mission-critical automation.',
      features: [
        'Unlimited Container Instances',
        '4096 MB RAM per instance',
        '100 GB High-Speed Storage',
        'Dedicated IP Address',
        '24/7 Phone & Slack Support',
        'Automated Hourly Backups'
      ]
    }
  ];

  const invoices = [
    { id: 'INV-2026-001', date: 'Jul 01, 2026', amount: '$19.00', status: 'Paid', downloadUrl: '#' },
    { id: 'INV-2026-002', date: 'Jun 01, 2026', amount: '$19.00', status: 'Paid', downloadUrl: '#' },
    { id: 'INV-2026-003', date: 'May 01, 2026', amount: '$19.00', status: 'Paid', downloadUrl: '#' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <span>Subscriptions, Billing & Usage Quotas</span>
          </h1>
          <p className="text-xs text-slate-400">Manage tier subscriptions, usage limits, payment methods, and enterprise billing invoices.</p>
        </div>
      </div>

      {/* Active Subscription Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
              CURRENT ACTIVE PLAN
            </span>
            <span className="text-xs text-slate-400 font-mono">Renews on {subscription.renewalDate}</span>
          </div>

          <h2 className="text-2xl font-bold font-display text-white">{subscription.tier}</h2>
          <p className="text-xs text-slate-300">Includes {subscription.hostedLimit} hosted bot instances with {subscription.storageLimit} NVMe SSD storage.</p>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-2xl font-bold font-mono text-white">{subscription.price}</span>
            <span className="text-xs text-slate-400 font-mono block">/month</span>
          </div>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = subscription.tier.toLowerCase().includes(plan.name.split(' ')[0].toLowerCase());
          return (
            <div
              key={plan.name}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-6 relative ${
                plan.badge 
                  ? 'bg-slate-900/90 border-blue-500/50 shadow-xl shadow-blue-500/10' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 right-6 bg-blue-600 text-white font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-md uppercase">
                  {plan.badge}
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-100">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-mono text-white">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-mono">{plan.period}</span>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-800">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 font-sans">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onUpgradeTier(plan.name, plan.price)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  isCurrent 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                }`}
              >
                {isCurrent ? 'Current Plan Active' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoices History Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="font-bold text-base text-slate-100">Billing History & Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Invoice Number</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Download PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-900/40">
                  <td className="py-3 font-semibold text-slate-200">{inv.id}</td>
                  <td className="py-3 text-slate-400">{inv.date}</td>
                  <td className="py-3 text-slate-200 font-bold">{inv.amount}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
