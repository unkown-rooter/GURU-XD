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
  Lock
} from 'lucide-react';
import { PortalUser } from '../types';

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
  
  // New User States
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'Administrator' | 'Developer' | 'Viewer'>('Viewer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim()) return;

    onAddUser({
      id: `usr-${Date.now()}`,
      username: newUsername,
      email: newEmail,
      role: newRole,
      status: 'active',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?auto=format&fit=crop&w=150&h=150&q=80`
    });

    setNewUsername('');
    setNewEmail('');
    setNewRole('Viewer');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">Portal Administrators</h1>
          <p className="text-xs text-slate-400">Review team accounts permitted to monitor or halt active WhatsApp/Telegram bot clusters.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Member</span>
        </button>
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
              {users.map((usr) => {
                const isActive = usr.status === 'active';
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
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {usr.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle active / suspend */}
                        <button
                          onClick={() => onToggleUserStatus(usr.id)}
                          className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                            isActive 
                              ? 'border-rose-950 hover:bg-rose-500/10 text-rose-400' 
                              : 'border-emerald-950 hover:bg-emerald-500/10 text-emerald-400'
                          }`}
                          title={isActive ? 'Suspend access' : 'Reinstate access'}
                        >
                          {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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
              })}
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
    </div>
  );
}
