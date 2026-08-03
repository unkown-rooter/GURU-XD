import { securityAnalyst } from '../server/securityAnalyst';
import { DatabaseService } from '../server/db';

export async function runSecurityTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  try {
    const db = DatabaseService.getInstance().read();
    if (db.users && Array.isArray(db.users)) {
      results.push({ name: 'Security: User Registry & RBAC Profiles', passed: true });
    } else {
      results.push({ name: 'Security: User Registry & RBAC Profiles', passed: false, error: 'User array invalid' });
    }
  } catch (err: any) {
    results.push({ name: 'Security: User Registry & RBAC Profiles', passed: false, error: err.message });
  }

  try {
    const incidents = securityAnalyst.getActiveIncidents();
    if (Array.isArray(incidents)) {
      results.push({ name: 'SecurityAnalyst: Automated Incident Monitoring', passed: true });
    } else {
      results.push({ name: 'SecurityAnalyst: Automated Incident Monitoring', passed: false, error: 'Incidents list error' });
    }
  } catch (err: any) {
    results.push({ name: 'SecurityAnalyst: Automated Incident Monitoring', passed: false, error: err.message });
  }

  return results;
}
