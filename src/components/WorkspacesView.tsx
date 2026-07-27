import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Plus, 
  Check, 
  ShieldCheck, 
  UserPlus, 
  Settings, 
  Trash2, 
  Globe, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

export interface WorkspaceItem {
  id: string;
  name: string;
  type: 'Personal' | 'Business' | 'School' | 'Church' | 'Organization' | 'Team';
  memberCount: number;
  instanceCount: number;
  isOwner: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Developer' | 'Viewer';
  avatar: string;
  joinedAt: string;
}

interface WorkspacesViewProps {
  currentWorkspace: WorkspaceItem;
  workspaces: WorkspaceItem[];
  onSwitchWorkspace: (workspace: WorkspaceItem) => void;
  onCreateWorkspace: (name: string, type: WorkspaceItem['type']) => void;
}

export default function WorkspacesView({
  currentWorkspace,
  workspaces,
  onSwitchWorkspace,
  onCreateWorkspace
}: WorkspacesViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsType, setNewWsType] = useState<WorkspaceItem['type']>('Business');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 'm-1',
      name: 'Root Administrator',
      email: 'admin@guru-xd.com',
      role: 'Owner',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      joinedAt: '2026-01-10'
    },
    {
      id: 'm-2',
      name: 'Lead DevOps Engineer',
      email: 'devops@guru-xd.com',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      joinedAt: '2026-02-14'
    },
    {
      id: 'm-3',
      name: 'Bot Automation Dev',
      email: 'botdev@guru-xd.com',
      role: 'Developer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      joinedAt: '2026-03-01'
    }
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Developer' | 'Viewer'>('Developer');

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setTeamMembers([
      ...teamMembers,
      {
        id: 'm-' + Date.now(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail.trim(),
        role: inviteRole,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        joinedAt: new Date().toISOString().split('T')[0]
      }
    ]);

    setInviteEmail('');
  };

  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    onCreateWorkspace(newWsName.trim(), newWsType);
    setNewWsName('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            <span>Workspaces & Team Governance</span>
          </h1>
          <p className="text-xs text-slate-400">Switch context between organizations, invite developers, and manage enterprise role-based permissions.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create Workspace</span>
        </button>
      </div>

      {/* Workspace Switcher Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((ws) => {
          const isActive = currentWorkspace.id === ws.id;
          return (
            <div
              key={ws.id}
              onClick={() => onSwitchWorkspace(ws)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative ${
                isActive 
                  ? 'bg-blue-600/10 border-blue-500/40 shadow-xl shadow-blue-500/10' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100">{ws.name}</span>
                {isActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>ACTIVE</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full text-[10px] text-slate-300">
                  {ws.type}
                </span>
                <span>•</span>
                <span>{ws.memberCount} Members</span>
                <span>•</span>
                <span>{ws.instanceCount} Apps</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Members Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>{currentWorkspace.name} Members & Roles</span>
            </h3>
            <p className="text-xs text-slate-400">Manage developer access, administrative capabilities, and invited operators.</p>
          </div>
        </div>

        {/* Invite Member Form */}
        <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="member@company.com"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none cursor-pointer"
          >
            <option value="Admin">Admin (Full Control)</option>
            <option value="Developer">Developer (Deploy & Write)</option>
            <option value="Viewer">Viewer (Read Only)</option>
          </select>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-blue-600/20 whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Send Invitation</span>
          </button>
        </form>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="pb-3">User</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Joined</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3 font-sans">
                      <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700" />
                      <div>
                        <span className="font-semibold text-slate-100 block">{member.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      member.role === 'Owner' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                        : member.role === 'Admin' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{member.joinedAt}</td>
                  <td className="py-3 text-right">
                    {member.role !== 'Owner' && (
                      <button
                        onClick={() => setTeamMembers(teamMembers.filter((m) => m.id !== member.id))}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100">Create New Workspace</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Acme Corp, Global Community, HighSchool Tech"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Workspace Type</label>
                <select
                  value={newWsType}
                  onChange={(e) => setNewWsType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Personal">Personal Workspace</option>
                  <option value="Business">Business Enterprise</option>
                  <option value="School">School / University</option>
                  <option value="Church">Church / Non-Profit</option>
                  <option value="Organization">Organization</option>
                  <option value="Team">Development Team</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
