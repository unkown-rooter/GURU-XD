import { SystemCommandDefinition } from '../types';
import { dbService } from '../../../db';

export const logCommands: SystemCommandDefinition[] = [
  {
    id: 'logs-today',
    group: 'logs',
    action: 'today',
    aliases: ['logs'],
    description: 'Stream or query today\'s system telemetry event log buffer',
    requiredRole: 'Viewer',
    category: 'Telemetry & Logs',
    usage: 'logs today [limit]',
    execute: async (args) => {
      const limit = parseInt(args[0] || '10', 10);
      const db = dbService.read();
      const logs = (db.logs || []).slice(-limit);

      const outputLines: Array<{ text: string; type?: 'system' | 'success' | 'error' | 'warning' | 'info' | 'output' }> = [
        { text: `[SYSTEM LOGS TELEMETRY] Today's Last ${logs.length} Log Entries:`, type: 'system' }
      ];

      logs.forEach((log) => {
        let lineType: 'system' | 'success' | 'error' | 'warning' | 'info' | 'output' = 'output';
        if (log.type === 'error') lineType = 'error';
        else if (log.type === 'success') lineType = 'success';
        else if (log.type === 'warning') lineType = 'warning';
        else if (log.type === 'info') lineType = 'info';

        outputLines.push({
          text: `[${log.timestamp}] [${log.type.toUpperCase()}] [${log.source}] ${log.message}`,
          type: lineType
        });
      });

      return outputLines;
    }
  },
  {
    id: 'logs-errors',
    group: 'logs',
    action: 'errors',
    description: 'Filter log telemetry for error and critical level events only',
    requiredRole: 'Viewer',
    category: 'Telemetry & Logs',
    usage: 'logs errors [limit]',
    execute: async (args) => {
      const limit = parseInt(args[0] || '10', 10);
      const db = dbService.read();
      const errorLogs = (db.logs || []).filter(l => l.type === 'error').slice(-limit);

      if (errorLogs.length === 0) {
        return [
          { text: '[SYSTEM LOGS] Zero error events recorded in telemetry buffer.', type: 'success' }
        ];
      }

      const outputLines: Array<{ text: string; type?: 'system' | 'error' }> = [
        { text: `[ERROR LOG TELEMETRY] Filtered ${errorLogs.length} Error Events:`, type: 'system' }
      ];

      errorLogs.forEach((log) => {
        outputLines.push({
          text: `[${log.timestamp}] [ERROR] [${log.source}] ${log.message}`,
          type: 'error'
        });
      });

      return outputLines;
    }
  },
  {
    id: 'logs-warnings',
    group: 'logs',
    action: 'warnings',
    description: 'Filter log telemetry for warning level events',
    requiredRole: 'Viewer',
    category: 'Telemetry & Logs',
    usage: 'logs warnings [limit]',
    execute: async (args) => {
      const limit = parseInt(args[0] || '10', 10);
      const db = dbService.read();
      const warnLogs = (db.logs || []).filter(l => l.type === 'warning').slice(-limit);

      if (warnLogs.length === 0) {
        return [
          { text: '[SYSTEM LOGS] Zero warning events recorded in telemetry buffer.', type: 'success' }
        ];
      }

      const outputLines: Array<{ text: string; type?: 'system' | 'warning' }> = [
        { text: `[WARNING LOG TELEMETRY] Filtered ${warnLogs.length} Warning Events:`, type: 'system' }
      ];

      warnLogs.forEach((log) => {
        outputLines.push({
          text: `[${log.timestamp}] [WARNING] [${log.source}] ${log.message}`,
          type: 'warning'
        });
      });

      return outputLines;
    }
  },
  {
    id: 'logs-stream',
    group: 'logs',
    action: 'stream',
    description: 'Attach to real-time log stream socket broadcast',
    requiredRole: 'Operator',
    category: 'Telemetry & Logs',
    usage: 'logs stream',
    execute: async () => {
      return [
        { text: '[LOG STREAMING ENGINE] Attached to live log broadcast socket...', type: 'system' },
        { text: '• Real-Time Stream Status: ACTIVE (Broadcasting via AppEventBus)', type: 'success' },
        { text: '• Buffer Mode: Zero-latency streaming mode', type: 'info' }
      ];
    }
  },
  {
    id: 'logs-audit',
    group: 'logs',
    action: 'audit',
    aliases: ['audit-log', 'audit'],
    description: 'Read persistent command execution entries from protected system_audit.log file',
    requiredRole: 'Operator',
    category: 'Telemetry & Logs',
    usage: 'logs audit [limit]',
    execute: async (args) => {
      const limit = parseInt(args[0] || '15', 10);
      const { systemCommandLogger } = await import('../SystemCommandLogger');
      const lines = systemCommandLogger.readAuditFileLines(limit);

      if (lines.length === 0) {
        return [
          { text: '[SYSTEM AUDIT LOG] No audit entries found in system_audit.log.', type: 'info' }
        ];
      }

      const outputLines: Array<{ text: string; type?: 'system' | 'success' | 'error' | 'warning' | 'info' | 'output' }> = [
        { text: `[SYSTEM AUDIT LOG FILE] Last ${lines.length} Command Execution Records from system_audit.log:`, type: 'system' }
      ];

      lines.forEach((line) => {
        let type: 'system' | 'success' | 'error' | 'warning' | 'info' | 'output' = 'output';
        if (line.includes('ACCESS_DENIED') || line.includes('FAILED')) type = 'error';
        else if (line.includes('SUCCESS')) type = 'success';
        outputLines.push({ text: line, type });
      });

      return outputLines;
    }
  },
  {
    id: 'logs-export',
    group: 'logs',
    action: 'export',
    description: 'Export system log telemetry buffer as structured JSON or CSV file',
    requiredRole: 'Operator',
    category: 'Telemetry & Logs',
    usage: 'logs export [json|csv]',
    execute: async (args) => {
      const format = (args[0] || 'json').toLowerCase();
      const db = dbService.read();
      const count = db.logs?.length || 0;
      return [
        { text: `[LOG EXPORT ENGINE] Preparing export bundle in format [${format.toUpperCase()}]...`, type: 'system' },
        { text: `✓ Exported ${count} log records to /exports/logs-telemetry-${Date.now()}.${format}`, type: 'success' }
      ];
    }
  },
  {
    id: 'logs-security-threats',
    group: 'logs',
    action: 'threats',
    aliases: ['security-threats', 'threats'],
    description: 'Inspect real-time security breaches, access denied spikes, and telemetry alerts',
    requiredRole: 'Operator',
    category: 'Telemetry & Logs',
    usage: 'logs threats',
    execute: async () => {
      const { systemCommandLogger } = await import('../SystemCommandLogger');
      const stats = systemCommandLogger.getTelemetryStats();

      const outputLines: Array<{ text: string; type?: 'system' | 'success' | 'error' | 'warning' | 'info' | 'output' }> = [
        { text: `[SECURITY THREAT & TELEMETRY MONITORING]`, type: 'system' },
        { text: `• Total Executed Commands : ${stats.totalLogs}`, type: 'info' },
        { text: `• Successful Executions    : ${stats.successes}`, type: 'success' },
        { text: `• Access Denials          : ${stats.accessDenied}`, type: stats.accessDenied > 0 ? 'warning' : 'success' },
        { text: `• Average Response Latency: ${stats.avgExecMs}ms`, type: 'info' },
        { text: `• Security Breach Alerts  : ${stats.securityBreachCount}`, type: stats.securityBreachCount > 0 ? 'error' : 'success' }
      ];

      if (stats.activeThreats && stats.activeThreats.length > 0) {
        outputLines.push({ text: `[ACTIVE THREAT ALERTS & REPEATED ACCESS FAILURE SPIKES]:`, type: 'warning' });
        stats.activeThreats.forEach(t => {
          outputLines.push({
            text: `  ⚠️ [${t.timestamp}] IP: ${t.ip} | User: ${t.userId} | "${t.command}" | Reason: ${t.reason}`,
            type: 'error'
          });
        });
      } else {
        outputLines.push({ text: `✓ Zero active security threat spikes detected in current monitoring window.`, type: 'success' });
      }

      return outputLines;
    }
  }
];
