import { SemverCompatibilityResult } from './types';

export class VersionChecker {
  public static readonly CORE_ORCHESTRATOR_VERSION = '2.5.0';

  public static compareSemver(v1: string, v2: string): number {
    const clean1 = v1.replace(/^v/, '').split('.').map(Number);
    const clean2 = v2.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const num1 = clean1[i] || 0;
      const num2 = clean2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  public static checkCompatibility(minVersionRequired?: string): SemverCompatibilityResult {
    if (!minVersionRequired) {
      return {
        compatible: true,
        coreVersion: this.CORE_ORCHESTRATOR_VERSION,
        requestedVersion: 'none'
      };
    }

    const comparison = this.compareSemver(this.CORE_ORCHESTRATOR_VERSION, minVersionRequired);
    const compatible = comparison >= 0;

    return {
      compatible,
      coreVersion: this.CORE_ORCHESTRATOR_VERSION,
      requestedVersion: minVersionRequired,
      reason: compatible
        ? `Core orchestrator v${this.CORE_ORCHESTRATOR_VERSION} satisfies requirement >= v${minVersionRequired}`
        : `Core orchestrator v${this.CORE_ORCHESTRATOR_VERSION} is lower than required min version v${minVersionRequired}`
    };
  }
}
