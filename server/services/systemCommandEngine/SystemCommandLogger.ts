import fs from 'fs';
import path from 'path';
import { CommandResult, CommandContext } from './types';

export interface AuditLogEntry {
  timestamp: string;
  flow: string;
  userId: string;
  userRole: string;
  clientIp: string;
  sessionId: string;
  command: string;
  group?: string;
  action?: string;
  executionMs: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class SystemCommandLogger {
  private static instance: SystemCommandLogger;
  private logFilePath: string;
  private inMemoryLogs: AuditLogEntry[] = [];
  private maxInMemory = 1000;

  private constructor() {
    this.logFilePath = path.join(process.cwd(), 'system_audit.log');
    this.ensureLogFileExists();
  }

  public static getInstance(): SystemCommandLogger {
    if (!SystemCommandLogger.instance) {
      SystemCommandLogger.instance = new SystemCommandLogger();
    }
    return SystemCommandLogger.instance;
  }

  private ensureLogFileExists(): void {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        const header = `================================================================================\n` +
                       `GURU-XD SYSTEM COMMAND AUDIT TELEMETRY LOG\n` +
                       `Created: ${new Date().toISOString()}\n` +
                       `================================================================================\n\n`;
        fs.writeFileSync(this.logFilePath, header, { encoding: 'utf8' });
      }
    } catch (err) {
      console.error('[SystemCommandLogger] Failed to initialize system_audit.log file:', err);
    }
  }

  /**
   * Security Monitoring & Threat Metrics
   */
  private failedAttemptsWindow: Map<string, Array<{ timestamp: number; reason: string }>> = new Map();
  private securityBreaches: Array<{ timestamp: string; ip: string; userId: string; reason: string; command: string }> = [];

  /**
   * Log command execution flow from SystemCommandEngine
   */
  public logExecution(result: CommandResult, context: CommandContext = {}): void {
    try {
      const timestamp = result.timestamp || new Date().toISOString();
      const userId = context.userId || 'usr-system-admin';
      const userRole = context.userRole || 'Administrator';
      const clientIp = context.clientIp || '127.0.0.1';
      const sessionId = context.sessionId || 'sess-main';
      const flow = result.success ? 'EXECUTE_SUCCESS' : (result.error === 'ACCESS_DENIED' ? 'ACCESS_DENIED' : 'EXECUTE_FAILED');

      const entry: AuditLogEntry = {
        timestamp,
        flow,
        userId,
        userRole,
        clientIp,
        sessionId,
        command: result.command,
        group: result.group,
        action: result.action,
        executionMs: result.executionMs,
        success: result.success,
        error: result.error,
        metadata: result.metadata
      };

      // 1. Maintain in-memory log buffer
      this.inMemoryLogs.push(entry);
      if (this.inMemoryLogs.length > this.maxInMemory) {
        this.inMemoryLogs.shift();
      }

      // 2. Security Threat & Burst Detection
      if (!result.success && (result.error === 'ACCESS_DENIED' || result.error === 'INSUFFICIENT_ROLE' || result.error === 'RATE_LIMIT')) {
        const now = Date.now();
        const key = `${clientIp}:${userId}`;
        const attempts = this.failedAttemptsWindow.get(key) || [];
        // Keep attempts within last 5 minutes (300,000 ms)
        const recent = attempts.filter(a => now - a.timestamp < 300000);
        recent.push({ timestamp: now, reason: result.error || 'FAILED' });
        this.failedAttemptsWindow.set(key, recent);

        if (recent.length >= 4) {
          const breachEntry = {
            timestamp,
            ip: clientIp,
            userId,
            reason: `Repeated security failures (${recent.length} attempts in 5m): ${result.error}`,
            command: result.command
          };
          this.securityBreaches.push(breachEntry);
          if (this.securityBreaches.length > 200) this.securityBreaches.shift();

          console.warn(`[SECURITY BREACH DETECTED] High frequency security failure from IP: ${clientIp}, User: ${userId}`);
        }
      }

      // 3. Format single line entry for protected system_audit.log file
      const formattedLine = `[${timestamp}] [${flow}] UserID: ${userId} | Role: ${userRole} | IP: ${clientIp} | Sess: ${sessionId} | Cmd: "${result.command}" (Group: ${result.group || 'N/A'}, Action: ${result.action || 'N/A'}) | Status: ${result.success ? 'SUCCESS' : 'FAILED'} | ExecMs: ${result.executionMs}ms${result.error ? ` | Error: ${result.error}` : ''}\n`;

      // 4. Asynchronously append to system_audit.log
      fs.appendFile(this.logFilePath, formattedLine, 'utf8', (err) => {
        if (err) {
          console.error('[SystemCommandLogger] Error writing to system_audit.log:', err);
        }
      });
    } catch (err) {
      console.error('[SystemCommandLogger] Error formatting audit log entry:', err);
    }
  }

  /**
   * Get telemetry stats summary for monitoring
   */
  public getTelemetryStats() {
    const total = this.inMemoryLogs.length;
    const successes = this.inMemoryLogs.filter(l => l.success).length;
    const failures = total - successes;
    const accessDenied = this.inMemoryLogs.filter(l => l.error === 'ACCESS_DENIED').length;
    const avgExecMs = total > 0 
      ? Math.round(this.inMemoryLogs.reduce((acc, l) => acc + (l.executionMs || 0), 0) / total) 
      : 0;

    return {
      totalLogs: total,
      successes,
      failures,
      accessDenied,
      avgExecMs,
      securityBreachCount: this.securityBreaches.length,
      activeThreats: this.securityBreaches.slice(-10)
    };
  }

  /**
   * Get recorded security threats / breach alerts
   */
  public getSecurityThreats() {
    return this.securityBreaches;
  }

  /**
   * Retrieve recent in-memory audit logs
   */
  public getRecentLogs(limit = 50): AuditLogEntry[] {
    return this.inMemoryLogs.slice(-limit);
  }

  /**
   * Read raw protected system_audit.log contents
   */
  public getLogFilePath(): string {
    return this.logFilePath;
  }

  /**
   * Read contents of log file as array of strings
   */
  public readAuditFileLines(limit = 100): string[] {
    try {
      if (!fs.existsSync(this.logFilePath)) return [];
      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      return lines.slice(-limit);
    } catch (err) {
      console.error('[SystemCommandLogger] Error reading system_audit.log:', err);
      return [];
    }
  }
}

export const systemCommandLogger = SystemCommandLogger.getInstance();
