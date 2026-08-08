import { SystemCommandDefinition } from '../types';
import { dbService } from '../../../db';

export const sessionUserCommands: SystemCommandDefinition[] = [
  {
    id: 'session-list',
    group: 'session',
    action: 'list',
    description: 'List active administrator and API sessions across the platform',
    requiredRole: 'Operator',
    category: 'User & Security Management',
    usage: 'session list',
    execute: async () => {
      const db = dbService.read();
      const sessions = db.sessions || [
        { id: 'sess-01', user: 'admin', ip: '127.0.0.1', created: '2026-08-07T07:00:00Z', active: true }
      ];

      const lines: Array<{ text: string; type?: 'system' | 'success' | 'info' | 'output' }> = [
        { text: `[ACTIVE PLATFORM SESSIONS] (${sessions.length} sessions active):`, type: 'system' }
      ];

      sessions.forEach((s: any) => {
        lines.push({
          text: `  ▪ Session ID: ${s.id.padEnd(12)} | User: ${(s.username || s.user || 'admin').padEnd(12)} | IP: ${(s.ip || '127.0.0.1').padEnd(15)} | Active: YES`,
          type: 'success'
        });
      });

      return lines;
    }
  },
  {
    id: 'user-list',
    group: 'user',
    action: 'list',
    description: 'List platform users, role assignments, and account statuses',
    requiredRole: 'Operator',
    category: 'User & Security Management',
    usage: 'user list',
    execute: async () => {
      const db = dbService.read();
      const users = db.users || [
        { id: 'u1', username: 'admin', role: 'Administrator', status: 'active' }
      ];

      const lines: Array<{ text: string; type?: 'system' | 'success' | 'info' | 'output' }> = [
        { text: `[REGISTERED USERS] (${users.length} accounts):`, type: 'system' }
      ];

      users.forEach((u: any) => {
        lines.push({
          text: `  ▪ User: ${u.username.padEnd(16)} | Role: ${(u.role || 'Administrator').padEnd(16)} | Status: ${u.status.toUpperCase()}`,
          type: u.status === 'active' ? 'success' : 'info'
        });
      });

      return lines;
    }
  }
];
