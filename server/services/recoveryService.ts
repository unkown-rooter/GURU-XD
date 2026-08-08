import crypto from 'crypto';
import { AppEventBus } from './eventBus';
import { BackupService, BackupSnapshot } from './backupService';
import { DatabaseService } from '../db';

export interface RestoreOptions {
  dryRun?: boolean;
  verifyStateAfterRestore?: boolean;
  forceUnsafeRestore?: boolean;
  actorId?: string;
}

export interface RecoveryExecutionResult {
  recoveryId: string;
  snapshotIdUsed: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  durationMs: number;
  tablesRestored: number;
  recordsRestored: number;
  verificationPassed: boolean;
  message: string;
  rolledBackToId?: string;
}

export interface DisasterRecoveryReadiness {
  status: 'READY' | 'DEGRADED' | 'NOT_READY';
  readinessScorePct: number;
  latestFullBackupTimestamp?: string;
  latestIncrementalBackupTimestamp?: string;
  recoveryPointObjectiveMinutes: number; // RPO
  estimatedRecoveryTimeMs: number; // RTO estimate
  recommendations: string[];
}

export class RecoveryService {
  private static instance: RecoveryService;
  private backupService = BackupService.getInstance();
  private dbService = DatabaseService.getInstance();
  private eventBus = AppEventBus.getInstance();
  private recoveryHistory: RecoveryExecutionResult[] = [];

  private constructor() {}

  public static getInstance(): RecoveryService {
    if (!RecoveryService.instance) {
      RecoveryService.instance = new RecoveryService();
    }
    return RecoveryService.instance;
  }

  // ----------------------------------------------------
  // SNAPSHOT RESTORE & ROLLBACK
  // ----------------------------------------------------

  public async restoreFromSnapshot(snapshotId: string, options?: RestoreOptions): Promise<RecoveryExecutionResult> {
    const start = Date.now();
    const recoveryId = `recov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const dryRun = options?.dryRun || false;

    this.eventBus.publish('RECOVERY_STARTED', {
      recoveryId,
      snapshotId,
      dryRun,
      actor: options?.actorId || 'system'
    }, undefined, 'RecoveryService');

    const snapshot = this.backupService.getSnapshot(snapshotId);
    if (!snapshot) {
      const failedResult: RecoveryExecutionResult = {
        recoveryId,
        snapshotIdUsed: snapshotId,
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        durationMs: Date.now() - start,
        tablesRestored: 0,
        recordsRestored: 0,
        verificationPassed: false,
        message: `Snapshot [${snapshotId}] not found in Backup Registry.`
      };
      this.eventBus.publish('RECOVERY_FAILED', { recoveryId, reason: failedResult.message }, undefined, 'RecoveryService');
      return failedResult;
    }

    // Validate Snapshot
    const validation = this.backupService.validateSnapshot(snapshot);
    if (!validation.valid && !options?.forceUnsafeRestore) {
      const failedResult: RecoveryExecutionResult = {
        recoveryId,
        snapshotIdUsed: snapshotId,
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        durationMs: Date.now() - start,
        tablesRestored: 0,
        recordsRestored: 0,
        verificationPassed: false,
        message: `Snapshot validation failed: ${validation.reason}`
      };
      this.eventBus.publish('RECOVERY_FAILED', { recoveryId, reason: failedResult.message }, undefined, 'RecoveryService');
      return failedResult;
    }

    // Safety: Take emergency pre-restore snapshot
    let preRestoreSnapshotId: string | undefined;
    try {
      const preSnap = await this.backupService.createFullBackup('PRE_RECOVERY_SAFETY');
      preRestoreSnapshotId = preSnap.id;
    } catch (e) {
      console.warn('[RECOVERY] Failed to create safety pre-restore snapshot');
    }

    if (dryRun) {
      return {
        recoveryId,
        snapshotIdUsed: snapshotId,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        durationMs: Date.now() - start,
        tablesRestored: snapshot.tablesCount,
        recordsRestored: snapshot.recordsCount,
        verificationPassed: true,
        message: `[DRY RUN] Snapshot [${snapshotId}] is valid and ready for execution.`
      };
    }

    // Execute Restore
    try {
      let rawData = snapshot.payloadData;
      if (snapshot.encrypted) {
        // Decrypt payload
        const parts = rawData.split(':');
        if (parts.length === 2) {
          const key = crypto.createHash('sha256').update('GURU_BACKUP_SECRET_KEY_V9').digest();
          const iv = Buffer.from(parts[0], 'hex');
          const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
          let decrypted = decipher.update(parts[1], 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          rawData = decrypted;
        }
      }

      const parsedState = JSON.parse(rawData);

      // Handle Full vs Incremental payload structure
      let targetDbState = parsedState;
      if (snapshot.type === 'INCREMENTAL' && parsedState.stateDelta) {
        targetDbState = parsedState.stateDelta;
      }

      // Write state back into Database
      this.dbService.write(targetDbState);

      // Verification Step
      let verificationPassed = true;
      if (options?.verifyStateAfterRestore !== false) {
        const verifyRes = this.verifyRecoveryState();
        verificationPassed = verifyRes.valid;
        if (!verificationPassed) {
          // Automatic Rollback to preRestoreSnapshotId
          if (preRestoreSnapshotId) {
            console.error('[RECOVERY CRITICAL] Post-restore verification failed! Executing automatic rollback...');
            await this.restoreFromSnapshot(preRestoreSnapshotId, { dryRun: false, forceUnsafeRestore: true });
            const rolledBackResult: RecoveryExecutionResult = {
              recoveryId,
              snapshotIdUsed: snapshotId,
              timestamp: new Date().toISOString(),
              status: 'ROLLED_BACK',
              durationMs: Date.now() - start,
              tablesRestored: 0,
              recordsRestored: 0,
              verificationPassed: false,
              message: `Post-restore state verification failed (${verifyRes.reason}). Rolled back to safety snapshot [${preRestoreSnapshotId}].`,
              rolledBackToId: preRestoreSnapshotId
            };
            this.eventBus.publish('RECOVERY_FAILED', { recoveryId, rolledBack: true }, undefined, 'RecoveryService');
            return rolledBackResult;
          }
        }
      }

      const successResult: RecoveryExecutionResult = {
        recoveryId,
        snapshotIdUsed: snapshotId,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        durationMs: Date.now() - start,
        tablesRestored: Object.keys(targetDbState).length,
        recordsRestored: snapshot.recordsCount,
        verificationPassed,
        message: `Successfully restored database state from snapshot [${snapshotId}].`
      };

      this.recoveryHistory.unshift(successResult);
      this.eventBus.publish('RECOVERY_COMPLETED', {
        recoveryId,
        snapshotId,
        durationMs: successResult.durationMs,
        tablesRestored: successResult.tablesRestored
      }, undefined, 'RecoveryService');

      return successResult;
    } catch (err: any) {
      const failedResult: RecoveryExecutionResult = {
        recoveryId,
        snapshotIdUsed: snapshotId,
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        durationMs: Date.now() - start,
        tablesRestored: 0,
        recordsRestored: 0,
        verificationPassed: false,
        message: `Restore execution error: ${err.message}`
      };

      this.eventBus.publish('RECOVERY_FAILED', { recoveryId, error: err.message }, undefined, 'RecoveryService');
      return failedResult;
    }
  }

  // ----------------------------------------------------
  // POINT-IN-TIME RECOVERY (PITR)
  // ----------------------------------------------------

  public async restoreToPointInTime(targetTimestampIso: string, options?: RestoreOptions): Promise<RecoveryExecutionResult> {
    const targetMs = new Date(targetTimestampIso).getTime();
    const snapshots = this.backupService.getSnapshots();

    // Find latest FULL snapshot prior to targetTimestamp
    const candidateFull = snapshots.find(
      s => s.type === 'FULL' && s.status === 'COMPLETED' && new Date(s.timestamp).getTime() <= targetMs
    );

    if (!candidateFull) {
      return {
        recoveryId: `recov-pitr-failed`,
        snapshotIdUsed: '',
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        durationMs: 0,
        tablesRestored: 0,
        recordsRestored: 0,
        verificationPassed: false,
        message: `No eligible FULL backup snapshot found prior to target timestamp [${targetTimestampIso}].`
      };
    }

    return this.restoreFromSnapshot(candidateFull.id, options);
  }

  // ----------------------------------------------------
  // DISASTER RECOVERY & HEALTH READINESS
  // ----------------------------------------------------

  public getDisasterRecoveryReadiness(): DisasterRecoveryReadiness {
    const snapshots = this.backupService.getSnapshots();
    const fullSnapshots = snapshots.filter(s => s.type === 'FULL' && s.status === 'COMPLETED');
    const incSnapshots = snapshots.filter(s => s.type === 'INCREMENTAL' && s.status === 'COMPLETED');

    const latestFull = fullSnapshots[0];
    const latestInc = incSnapshots[0];

    const recommendations: string[] = [];
    let score = 100;

    if (!latestFull) {
      score = 0;
      recommendations.push('CRITICAL: No valid FULL backup snapshot exists in system!');
    } else {
      const fullAgeHours = (Date.now() - new Date(latestFull.timestamp).getTime()) / 3600000;
      if (fullAgeHours > 24) {
        score -= 30;
        recommendations.push(`Latest FULL backup is ${Math.round(fullAgeHours)} hours old. Trigger a new full backup.`);
      }
    }

    const rpoMinutes = latestInc
      ? Math.round((Date.now() - new Date(latestInc.timestamp).getTime()) / 60000)
      : latestFull
      ? Math.round((Date.now() - new Date(latestFull.timestamp).getTime()) / 60000)
      : 9999;

    const readinessStatus = score >= 80 ? 'READY' : score >= 50 ? 'DEGRADED' : 'NOT_READY';

    return {
      status: readinessStatus,
      readinessScorePct: Math.max(0, score),
      latestFullBackupTimestamp: latestFull?.timestamp,
      latestIncrementalBackupTimestamp: latestInc?.timestamp,
      recoveryPointObjectiveMinutes: rpoMinutes,
      estimatedRecoveryTimeMs: 1500, // Avg 1.5s restore
      recommendations
    };
  }

  public async simulateDisasterFailover(): Promise<{ success: boolean; dryRunResult: RecoveryExecutionResult }> {
    const readiness = this.getDisasterRecoveryReadiness();
    if (readiness.status === 'NOT_READY') {
      throw new Error('Disaster Recovery Failover Simulation aborted: System is NOT_READY.');
    }

    const snapshots = this.backupService.getSnapshots();
    const targetSnap = snapshots[0];

    const dryRunRes = await this.restoreFromSnapshot(targetSnap.id, { dryRun: true });
    return {
      success: dryRunRes.status === 'SUCCESS',
      dryRunResult: dryRunRes
    };
  }

  public verifyRecoveryState(): { valid: boolean; reason?: string } {
    try {
      const currentDb = this.dbService.read();
      if (!currentDb || typeof currentDb !== 'object') {
        return { valid: false, reason: 'Database root object is null or undefined.' };
      }
      if (!Array.isArray(currentDb.bots) || !Array.isArray(currentDb.logs)) {
        return { valid: false, reason: 'Core database collections (bots, logs) missing or invalid.' };
      }
      return { valid: true };
    } catch (err: any) {
      return { valid: false, reason: `Database read verification error: ${err.message}` };
    }
  }

  public getRecoveryHistory(): RecoveryExecutionResult[] {
    return [...this.recoveryHistory];
  }
}

export const recoveryService = RecoveryService.getInstance();
