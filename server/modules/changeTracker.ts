import { PlatformChangeLogEntry, PlatformChangeCategory, PlatformChangeSeverity } from './types';

export class ChangeTracker {
  private static instance: ChangeTracker;
  private changeLogs: PlatformChangeLogEntry[] = [];
  private readonly maxLogEntries = 500;

  private constructor() {}

  public static getInstance(): ChangeTracker {
    if (!ChangeTracker.instance) {
      ChangeTracker.instance = new ChangeTracker();
    }
    return ChangeTracker.instance;
  }

  public recordChange(params: {
    category: PlatformChangeCategory;
    severity: PlatformChangeSeverity;
    eventType: string;
    description: string;
    sourceModuleId?: string;
    oldValue?: any;
    newValue?: any;
  }): PlatformChangeLogEntry {
    const entry: PlatformChangeLogEntry = {
      id: `CHG-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`,
      timestamp: new Date().toISOString(),
      category: params.category,
      severity: params.severity,
      sourceModuleId: params.sourceModuleId,
      eventType: params.eventType,
      description: params.description,
      oldValue: params.oldValue,
      newValue: params.newValue
    };

    this.changeLogs.unshift(entry); // Newest first

    if (this.changeLogs.length > this.maxLogEntries) {
      this.changeLogs = this.changeLogs.slice(0, this.maxLogEntries);
    }

    console.log(`[CHANGE TRACKER] [${entry.severity}] ${entry.category} - ${entry.description}`);
    return entry;
  }

  public getRecentChanges(limit = 50): PlatformChangeLogEntry[] {
    return this.changeLogs.slice(0, limit);
  }

  public getChangesByCategory(category: PlatformChangeCategory, limit = 50): PlatformChangeLogEntry[] {
    return this.changeLogs.filter(log => log.category === category).slice(0, limit);
  }

  public getChangesByModule(moduleId: string, limit = 50): PlatformChangeLogEntry[] {
    return this.changeLogs.filter(log => log.sourceModuleId === moduleId).slice(0, limit);
  }

  public getChangesBySeverity(severity: PlatformChangeSeverity, limit = 50): PlatformChangeLogEntry[] {
    return this.changeLogs.filter(log => log.severity === severity).slice(0, limit);
  }

  public getChangeCountSince(timestampIso: string): number {
    const sinceTime = new Date(timestampIso).getTime();
    return this.changeLogs.filter(log => new Date(log.timestamp).getTime() >= sinceTime).length;
  }

  public clearLogs(): void {
    this.changeLogs = [];
  }
}

export const changeTracker = ChangeTracker.getInstance();
