import { cacheService } from '../server/services/cacheService';
import { loggingService } from '../server/services/loggingService';
import { backupService } from '../server/services/backupService';
import { recoveryService } from '../server/services/recoveryService';
import { performanceService } from '../server/services/performanceService';
import { configService } from '../server/services/configService';
import { platformHealthService } from '../server/services/platformHealthService';

export async function runServiceTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: CacheService
  try {
    await cacheService.set('testKey', { foo: 'bar' }, 10000, { namespace: 'unit' });
    const val = await cacheService.get<{ foo: string }>('testKey', 'unit');
    if (val?.foo === 'bar') {
      results.push({ name: 'CacheService: Get/Set Value', passed: true });
    } else {
      results.push({ name: 'CacheService: Get/Set Value', passed: false, error: 'Value mismatch' });
    }
  } catch (err: any) {
    results.push({ name: 'CacheService: Get/Set Value', passed: false, error: err.message });
  }

  // Test 2: LoggingService
  try {
    const entry = loggingService.info('SYSTEM', 'Unit Test Log Entry', { test: true });
    const queried = loggingService.queryLogs({ searchQuery: 'Unit Test Log Entry' });
    if (queried.length > 0 && queried[0].id === entry.id) {
      results.push({ name: 'LoggingService: Structured Log & Query', passed: true });
    } else {
      results.push({ name: 'LoggingService: Structured Log & Query', passed: false, error: 'Log query failed' });
    }
  } catch (err: any) {
    results.push({ name: 'LoggingService: Structured Log & Query', passed: false, error: err.message });
  }

  // Test 3: BackupService
  try {
    const snap = await backupService.createFullBackup('UNIT_TEST');
    const val = backupService.validateSnapshot(snap);
    if (snap.status === 'COMPLETED' && val.valid) {
      results.push({ name: 'BackupService: Snapshot Creation & SHA256 Integrity', passed: true });
    } else {
      results.push({ name: 'BackupService: Snapshot Creation & SHA256 Integrity', passed: false, error: val.reason });
    }
  } catch (err: any) {
    results.push({ name: 'BackupService: Snapshot Creation & SHA256 Integrity', passed: false, error: err.message });
  }

  // Test 4: ConfigService
  try {
    configService.set('TEST_PROP', 'ENABLED_123', { namespace: 'unit' });
    const val = configService.get('TEST_PROP', undefined, 'unit');
    if (val === 'ENABLED_123') {
      results.push({ name: 'ConfigService: Dynamic Configuration & Namespace', passed: true });
    } else {
      results.push({ name: 'ConfigService: Dynamic Configuration & Namespace', passed: false, error: 'Config value mismatch' });
    }
  } catch (err: any) {
    results.push({ name: 'ConfigService: Dynamic Configuration & Namespace', passed: false, error: err.message });
  }

  return results;
}
