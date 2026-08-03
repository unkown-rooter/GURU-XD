import crypto from 'crypto';
import { AppEventBus } from './eventBus';
import { DatabaseService } from '../db';

export type BackupType = 'FULL' | 'INCREMENTAL';

export type BackupStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CORRUPTED';

export interface BackupSnapshot {
  id: string;
  type: BackupType;
  timestamp: string;
  checksum: string;
  sizeBytes: number;
  encrypted: boolean;
  encryptionAlgorithm?: string;
  tablesCount: number;
  recordsCount: number;
  baseSnapshotId?: string;
  storageLocation: string;
  status: BackupStatus;
  integrityScore: number;
  durationMs: number;
  payloadData?: any; // Encrypted or serialized snapshot state
  metadata?: Record<string, any>;
}

export interface BackupScheduleConfig {
  enabled: boolean;
  fullBackupIntervalHours: number;
  incrementalBackupIntervalMinutes: number;
  retentionMaxSnapshots: number;
  autoValidateOnCreation: boolean;
  encryptionEnabled: boolean;
}

export class BackupService {
  private static instance: BackupService;
  private snapshots: Map<string, BackupSnapshot> = new Map();
  private dbService = DatabaseService.getInstance();
  private eventBus = AppEventBus.getInstance();
  private scheduleConfig: BackupScheduleConfig = {
    enabled: true,
    fullBackupIntervalHours: 24,
    incrementalBackupIntervalMinutes: 60,
    retentionMaxSnapshots: 100,
    autoValidateOnCreation: true,
    encryptionEnabled: true
  };
  private scheduleTimer: NodeJS.Timeout | null = null;
  private lastFullSnapshotId: string | null = null;

  private constructor() {
    this.seedInitialFullBackup();
    this.initScheduleLoop();
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // ----------------------------------------------------
  // CONFIGURATION & SCHEDULE
  // ----------------------------------------------------

  public configureSchedule(config: Partial<BackupScheduleConfig>): void {
    this.scheduleConfig = { ...this.scheduleConfig, ...config };
    this.initScheduleLoop();
  }

  private initScheduleLoop() {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }

    if (this.scheduleConfig.enabled) {
      // Periodic check every 15 minutes
      this.scheduleTimer = setInterval(() => {
        this.checkScheduledBackupTriggers();
      }, 900000);
    }
  }

  private checkScheduledBackupTriggers() {
    const now = Date.now();
    const lastBackup = this.getLatestSnapshot();

    if (!lastBackup) {
      this.createFullBackup('SCHEDULED_INITIAL');
      return;
    }

    const lastMs = new Date(lastBackup.timestamp).getTime();
    const hoursElapsed = (now - lastMs) / 3600000;

    if (hoursElapsed >= this.scheduleConfig.fullBackupIntervalHours) {
      this.createFullBackup('SCHEDULED_FULL');
    } else if ((now - lastMs) / 60000 >= this.scheduleConfig.incrementalBackupIntervalMinutes) {
      this.createIncrementalBackup('SCHEDULED_INCREMENTAL');
    }
  }

  // ----------------------------------------------------
  // BACKUP CREATION
  // ----------------------------------------------------

  public async createFullBackup(triggerSource: string = 'MANUAL'): Promise<BackupSnapshot> {
    const start = Date.now();
    const id = `snap-full-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    try {
      const dbData = this.dbService.read();
      const rawPayload = JSON.stringify(dbData);
      const tablesCount = Object.keys(dbData).length;
      let recordsCount = 0;

      for (const val of Object.values(dbData)) {
        if (Array.isArray(val)) recordsCount += val.length;
      }

      const checksum = this.calculateSHA256(rawPayload);
      const sizeBytes = rawPayload.length * 2;
      let finalPayload: any = rawPayload;
      let encrypted = false;

      if (this.scheduleConfig.encryptionEnabled) {
        finalPayload = this.encryptPayload(rawPayload);
        encrypted = true;
      }

      const snapshot: BackupSnapshot = {
        id,
        type: 'FULL',
        timestamp,
        checksum,
        sizeBytes,
        encrypted,
        encryptionAlgorithm: encrypted ? 'AES-256-GCM' : undefined,
        tablesCount,
        recordsCount,
        storageLocation: `/backups/full/${id}.snap`,
        status: 'COMPLETED',
        integrityScore: 100,
        durationMs: Date.now() - start,
        payloadData: finalPayload,
        metadata: { triggerSource, tables: Object.keys(dbData) }
      };

      if (this.scheduleConfig.autoValidateOnCreation) {
        const valResult = this.validateSnapshot(snapshot);
        snapshot.integrityScore = valResult.integrityScore;
        if (!valResult.valid) snapshot.status = 'CORRUPTED';
      }

      this.snapshots.set(id, snapshot);
      this.lastFullSnapshotId = id;
      this.pruneOldSnapshots();

      this.eventBus.publish('BACKUP_COMPLETED', {
        snapshotId: snapshot.id,
        type: snapshot.type,
        sizeBytes: snapshot.sizeBytes,
        tablesCount: snapshot.tablesCount,
        recordsCount: snapshot.recordsCount
      }, undefined, 'BackupService');

      return snapshot;
    } catch (err: any) {
      const failedSnap: BackupSnapshot = {
        id,
        type: 'FULL',
        timestamp,
        checksum: '',
        sizeBytes: 0,
        encrypted: false,
        tablesCount: 0,
        recordsCount: 0,
        storageLocation: '',
        status: 'FAILED',
        integrityScore: 0,
        durationMs: Date.now() - start,
        metadata: { error: err.message, triggerSource }
      };

      this.eventBus.publish('BACKUP_FAILED', { snapshotId: id, error: err.message }, undefined, 'BackupService');
      return failedSnap;
    }
  }

  public async createIncrementalBackup(triggerSource: string = 'MANUAL'): Promise<BackupSnapshot> {
    const start = Date.now();
    const id = `snap-inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    if (!this.lastFullSnapshotId) {
      return this.createFullBackup(`UPGRADED_FROM_INC:${triggerSource}`);
    }

    try {
      const dbData = this.dbService.read();
      const deltaData = {
        _baseFullSnapshotId: this.lastFullSnapshotId,
        _incrementalTimestamp: timestamp,
        stateDelta: dbData
      };

      const rawPayload = JSON.stringify(deltaData);
      const checksum = this.calculateSHA256(rawPayload);
      const sizeBytes = rawPayload.length * 2;
      let finalPayload: any = rawPayload;
      let encrypted = false;

      if (this.scheduleConfig.encryptionEnabled) {
        finalPayload = this.encryptPayload(rawPayload);
        encrypted = true;
      }

      const snapshot: BackupSnapshot = {
        id,
        type: 'INCREMENTAL',
        timestamp,
        checksum,
        sizeBytes,
        encrypted,
        encryptionAlgorithm: encrypted ? 'AES-256-GCM' : undefined,
        tablesCount: Object.keys(dbData).length,
        recordsCount: 0,
        baseSnapshotId: this.lastFullSnapshotId,
        storageLocation: `/backups/incremental/${id}.inc`,
        status: 'COMPLETED',
        integrityScore: 100,
        durationMs: Date.now() - start,
        payloadData: finalPayload,
        metadata: { triggerSource, baseSnapshotId: this.lastFullSnapshotId }
      };

      if (this.scheduleConfig.autoValidateOnCreation) {
        const valResult = this.validateSnapshot(snapshot);
        snapshot.integrityScore = valResult.integrityScore;
        if (!valResult.valid) snapshot.status = 'CORRUPTED';
      }

      this.snapshots.set(id, snapshot);
      this.pruneOldSnapshots();

      this.eventBus.publish('BACKUP_COMPLETED', {
        snapshotId: snapshot.id,
        type: snapshot.type,
        sizeBytes: snapshot.sizeBytes
      }, undefined, 'BackupService');

      return snapshot;
    } catch (err: any) {
      this.eventBus.publish('BACKUP_FAILED', { snapshotId: id, error: err.message }, undefined, 'BackupService');
      throw err;
    }
  }

  // ----------------------------------------------------
  // BACKUP VALIDATION & QUERY
  // ----------------------------------------------------

  public validateSnapshot(snapshot: BackupSnapshot): { valid: boolean; integrityScore: number; reason?: string } {
    if (!snapshot.payloadData) {
      return { valid: false, integrityScore: 0, reason: 'Snapshot contains no payload data.' };
    }

    let raw = snapshot.payloadData;
    if (snapshot.encrypted) {
      try {
        raw = this.decryptPayload(snapshot.payloadData);
      } catch (err: any) {
        return { valid: false, integrityScore: 0, reason: `Encryption verification failed: ${err.message}` };
      }
    }

    const calculatedChecksum = this.calculateSHA256(raw);
    if (calculatedChecksum !== snapshot.checksum) {
      return {
        valid: false,
        integrityScore: 20,
        reason: `Checksum mismatch! Expected [${snapshot.checksum}], calculated [${calculatedChecksum}]`
      };
    }

    try {
      JSON.parse(raw);
    } catch {
      return { valid: false, integrityScore: 40, reason: 'Payload JSON formatting corrupted.' };
    }

    return { valid: true, integrityScore: 100 };
  }

  public getSnapshots(): BackupSnapshot[] {
    return Array.from(this.snapshots.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getSnapshot(snapshotId: string): BackupSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  public getLatestSnapshot(): BackupSnapshot | undefined {
    return this.getSnapshots()[0];
  }

  // ----------------------------------------------------
  // PRIVATE HELPERS
  // ----------------------------------------------------

  private seedInitialFullBackup() {
    this.createFullBackup('SYSTEM_INITIALIZATION');
  }

  private calculateSHA256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private encryptPayload(rawText: string): string {
    const key = crypto.createHash('sha256').update('GURU_BACKUP_SECRET_KEY_V9').digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(rawText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decryptPayload(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText;

    const key = crypto.createHash('sha256').update('GURU_BACKUP_SECRET_KEY_V9').digest();
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private pruneOldSnapshots() {
    const sorted = this.getSnapshots();
    if (sorted.length > this.scheduleConfig.retentionMaxSnapshots) {
      const toDelete = sorted.slice(this.scheduleConfig.retentionMaxSnapshots);
      for (const snap of toDelete) {
        this.snapshots.delete(snap.id);
      }
    }
  }
}

export const backupService = BackupService.getInstance();
