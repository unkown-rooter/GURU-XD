import { runServiceTests } from './service.test';
import { runHealthTests } from './health.test';
import { runSecurityTests } from './security.test';
import { runAITests } from './ai_architecture.test';
import { runMultiProviderTests } from './multi_provider_architecture.test';

async function main() {
  console.log('=====================================================');
  console.log(' GURU-XD AUTOMATED INTEGRATION & SUITE VALIDATION');
  console.log('=====================================================');

  const allResults = [
    ...(await runServiceTests()),
    ...(await runHealthTests()),
    ...(await runSecurityTests()),
    ...(await runAITests()),
    ...(await runMultiProviderTests())
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const res of allResults) {
    if (res.passed) {
      console.log(` \x1b[32m[PASS]\x1b[0m ${res.name}`);
      passedCount++;
    } else {
      console.log(` \x1b[31m[FAIL]\x1b[0m ${res.name} -> Error: ${res.error}`);
      failedCount++;
    }
  }

  console.log('-----------------------------------------------------');
  console.log(` TOTAL: ${allResults.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('=====================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
