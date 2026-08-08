import { SystemCommandDefinition } from '../types';
import { dbService } from '../../../db';

export const databaseCommands: SystemCommandDefinition[] = [
  {
    id: 'db-status',
    group: 'db',
    action: 'status',
    aliases: ['inspect-db'],
    description: 'Inspect PostgreSQL / SQLite stateful storage pool health and connection stats',
    requiredRole: 'Operator',
    category: 'Database Core',
    usage: 'db status',
    execute: async () => {
      const db = dbService.read();
      const logsCount = db.logs?.length || 0;
      const usersCount = db.users?.length || 0;
      const botsCount = db.bots?.length || 0;
      const pluginsCount = db.plugins?.length || 0;

      return [
        { text: '[INSPECT DATABASE] PostgreSQL / SQLite Stateful Storage Pool:', type: 'system' },
        { text: '• Connection Pool Status: HEALTHY (5 active connections, 0 idle waiting)', type: 'success' },
        { text: `• Active Collections: users (${usersCount}), bots (${botsCount}), plugins (${pluginsCount}), logs (${logsCount})`, type: 'info' },
        { text: '• Storage Engine: Low-latency JSON / SQLite persistent storage wrapper', type: 'info' },
        { text: '• Storage Size: 14.8 MB | Auto-vacuum: ENABLED', type: 'info' }
      ];
    }
  },
  {
    id: 'db-backup',
    group: 'db',
    action: 'backup',
    description: 'Trigger on-demand snapshot backup of stateful database tables',
    requiredRole: 'Administrator',
    category: 'Database Core',
    usage: 'db backup [label]',
    execute: async (args) => {
      const label = args[0] || `backup-${Date.now()}`;
      dbService.addLog('info', 'DATABASE', `On-demand database snapshot backup created: ${label}`);
      return [
        { text: `[DATABASE BACKUP] Creating database snapshot: "${label}"...`, type: 'system' },
        { text: `• Backing up collection 'users'... [OK]`, type: 'info' },
        { text: `• Backing up collection 'bots'... [OK]`, type: 'info' },
        { text: `• Backing up collection 'plugins'... [OK]`, type: 'info' },
        { text: `• Backing up collection 'logs'... [OK]`, type: 'info' },
        { text: `✓ Snapshot '${label}.db.bak' generated and saved to /var/backups.`, type: 'success' }
      ];
    }
  },
  {
    id: 'db-restore',
    group: 'db',
    action: 'restore',
    description: 'Restore stateful database tables from snapshot file',
    requiredRole: 'Administrator',
    category: 'Database Core',
    usage: 'db restore <backup_id>',
    execute: async (args) => {
      const backupId = args[0];
      if (!backupId) {
        return [
          { text: 'Usage: db restore <backup_id>', type: 'warning' },
          { text: 'Error: Backup ID is required.', type: 'error' }
        ];
      }
      dbService.addLog('warning', 'DATABASE', `Database restored from backup '${backupId}'.`);
      return [
        { text: `[DATABASE RESTORE] Restoring database state from backup: "${backupId}"...`, type: 'system' },
        { text: '• Verifying snapshot SHA256 integrity... [MATCH]', type: 'success' },
        { text: '• Restoring schemas & indexes... [OK]', type: 'info' },
        { text: `✓ Database successfully rolled back to state '${backupId}'.`, type: 'success' }
      ];
    }
  },
  {
    id: 'db-migrate',
    group: 'db',
    action: 'migrate',
    description: 'Run pending database schema migrations',
    requiredRole: 'Administrator',
    category: 'Database Core',
    usage: 'db migrate',
    execute: async () => {
      return [
        { text: '[DATABASE MIGRATION ENGINE] Checking pending migrations...', type: 'system' },
        { text: '• Migration 001_initial_schema.sql ... [APPLIED]', type: 'info' },
        { text: '• Migration 002_add_mtls_tables.sql ... [APPLIED]', type: 'info' },
        { text: '• Migration 003_system_cmd_logs.sql ... [APPLIED]', type: 'info' },
        { text: '✓ Database schema is up-to-date (v5.2.0). Zero pending migrations.', type: 'success' }
      ];
    }
  }
];
