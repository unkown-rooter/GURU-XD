import React, { useState } from 'react';
import logoUrl from '../assets/images/guru_xd_logo_1784332841454.jpg';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  UserX, 
  UserCheck, 
  Plus, 
  X,
  Lock,
  Activity,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PortalUser } from '../types';
import UserActivityModal from './UserActivityModal';

interface UsersViewProps {
  users: PortalUser[];
  onAddUser: (user: PortalUser) => void;
  onToggleUserStatus: (id: string) => void;
  onDeleteUser: (id: string) => void;
}

export default function UsersView({ 
  users, 
  onAddUser, 
  onToggleUserStatus, 
  onDeleteUser 
}: UsersViewProps) {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<PortalUser | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // New User States
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'Administrator' | 'Developer' | 'Viewer'>('Viewer');

  // Summary Metrics Calculations
  const activeUsersCount = users.filter(u => u.status === 'active').length;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const registrationsThisMonthCount = users.filter(u => {
    if (u.createdAt) {
      const d = new Date(u.createdAt);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
    }
    return false;
  }).length;

  const pendingApprovalsCount = users.filter(
    u => u.status === 'pending' || u.approvalStatus === 'pending'
  ).length;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim()) return;

    onAddUser({
      id: `usr-${Date.now()}`,
      username: newUsername,
      email: newEmail,
      role: newRole,
      status: 'active',
      createdAt: new Date().toISOString(),
      approvalStatus: 'approved',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?auto=format&fit=crop&w=150&h=150&q=80`
    });

    setNewUsername('');
    setNewEmail('');
    setNewRole('Viewer');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">Portal Administrators</h1>
          <p className="text-xs text-slate-400">Review team accounts permitted to monitor or halt active WhatsApp/Telegram bot clusters.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer self-start shrink-0 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Member</span>
        </button>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Active Users */}
        <div className="bg-slate-950/40 border border-slate-900 hover:border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4 transition-all shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Total Active Users</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-100">{activeUsersCount}</span>
              <span className="text-[11px] text-emerald-400 font-mono font-medium">({Math.round((activeUsersCount / (users.length || 1)) * 100)}%)</span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">{activeUsersCount} of {users.length} accounts operational</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* New Registrations This Month */}
        <div className="bg-slate-950/40 border border-slate-900 hover:border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4 transition-all shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Registrations This Month</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-100">{registrationsThisMonthCount}</span>
              <span className="text-[11px] text-blue-400 font-mono font-medium">+new</span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Approval Requests */}
        <div className="bg-slate-950/40 border border-slate-900 hover:border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4 transition-all shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${pendingApprovalsCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                {pendingApprovalsCount}
              </span>
              {pendingApprovalsCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-semibold">
                  Action Req.
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              {pendingApprovalsCount > 0 ? 'Review pending access requests below' : 'All request queues clear'}
            </p>
          </div>
          <div className={`p-3 rounded-xl border shrink-0 ${
            pendingApprovalsCount > 0 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse' 
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Real-time Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search users by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500/80 rounded-lg pl-9 pr-8 py-2 text-slate-200 placeholder-slate-500 focus:outline-none text-xs font-mono"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-[11px] font-mono text-slate-500 self-end sm:self-auto shrink-0">
          Showing <span className="text-slate-300 font-semibold">{filteredUsers.length}</span> of <span className="text-slate-300 font-semibold">{users.length}</span> members
        </div>
      </div>

      {/* Users list table */}
      <div className="bg-slate-950/20 border border-slate-900 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-500 uppercase font-sans tracking-wider font-semibold text-[10px]">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Access Level</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 font-sans">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-6 h-6 text-slate-600 mb-1" />
                      <p className="text-xs font-medium text-slate-400">No members matching "{searchQuery}"</p>
                      <p className="text-[11px] text-slate-600">Try searching for a different username or corporate email.</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-xs text-blue-400 hover:underline font-mono cursor-pointer"
                      >
                        Clear Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((usr) => {
                  const isActive = usr.status === 'active';
                  const isPending = usr.status === 'pending' || usr.approvalStatus === 'pending';
                return (
                  <tr key={usr.id} className="hover:bg-slate-950/40 transition-colors">
                    {/* User Profile */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={usr.username === 'admin' ? logoUrl : usr.avatar} 
                          alt={usr.username} 
                          className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-800 shrink-0"
                        />
                        <div>
                          <span className="text-slate-200 font-semibold text-sm block font-sans">{usr.username}</span>
                          <span className="text-slate-500 text-[10px] block">{usr.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Access level */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        <span>{usr.role}</span>
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                        isPending
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          isPending ? 'bg-amber-400' : isActive ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        {usr.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Activity / Audit Trail */}
                        <button
                          onClick={() => setSelectedUserForActivity(usr)}
                          className="p-1.5 rounded-lg border border-slate-900 hover:border-blue-900/60 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                          title="View User Audit & Activity Trail"
                        >
                          <Activity className="w-4 h-4" />
                        </button>

                        {/* Toggle active / suspend / approve */}
                        <button
                          onClick={() => onToggleUserStatus(usr.id)}
                          className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                            isPending
                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                              : isActive 
                                ? 'border-rose-950 hover:bg-rose-500/10 text-rose-400' 
                                : 'border-emerald-950 hover:bg-emerald-500/10 text-emerald-400'
                          }`}
                          title={isPending ? 'Approve member request' : isActive ? 'Suspend access' : 'Reinstate access'}
                        >
                          {isPending ? <UserCheck className="w-4 h-4 text-amber-300" /> : isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        {/* Erase user */}
                        {usr.username !== 'admin' && (
                          <button
                            onClick={() => onDeleteUser(usr.id)}
                            className="p-1.5 rounded-lg border border-slate-900 hover:border-rose-950 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Revoke access permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-900 w-full max-w-md rounded-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Provision Portal Member</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Username</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. alex_ops"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Corporate Email Address</label>
                <input 
                  type="email"
                  required
                  placeholder="alex@guru-xd.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 uppercase font-sans tracking-wider text-[10px] font-semibold">Permission Level</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-slate-200 focus:outline-none"
                >
                  <option value="Viewer">Viewer (Telemetry metrics only)</option>
                  <option value="Developer">Developer (Can restart bots and edit commands)</option>
                  <option value="Administrator">Administrator (All cluster permissions)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-slate-850 hover:bg-slate-900 text-slate-400 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all shadow-lg shadow-blue-600/20"
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Activity Modal */}
      {selectedUserForActivity && (
        <UserActivityModal
          user={selectedUserForActivity}
          onClose={() => setSelectedUserForActivity(null)}
        />
      )}
    </div>
  );
}
