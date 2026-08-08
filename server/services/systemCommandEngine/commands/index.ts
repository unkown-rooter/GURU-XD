import { commandRegistry } from '../CommandRegistry';
import { systemCommands } from './systemCommands';
import { databaseCommands } from './databaseCommands';
import { logCommands } from './logCommands';
import { pluginCommands } from './pluginCommands';
import { botCommands } from './botCommands';
import { aiCommands } from './aiCommands';
import { cacheMemoryCommands } from './cacheMemoryCommands';
import { sessionUserCommands } from './sessionUserCommands';
import { serviceNetworkCommands } from './serviceNetworkCommands';
import { securityDiagnosticsCommands } from './securityDiagnosticsCommands';

export function initializeSystemCommands(): void {
  const allCommands = [
    ...systemCommands,
    ...databaseCommands,
    ...logCommands,
    ...pluginCommands,
    ...botCommands,
    ...aiCommands,
    ...cacheMemoryCommands,
    ...sessionUserCommands,
    ...serviceNetworkCommands,
    ...securityDiagnosticsCommands
  ];

  allCommands.forEach((cmd) => {
    commandRegistry.register(cmd);
  });
}

export {
  systemCommands,
  databaseCommands,
  logCommands,
  pluginCommands,
  botCommands,
  aiCommands,
  cacheMemoryCommands,
  sessionUserCommands,
  serviceNetworkCommands,
  securityDiagnosticsCommands
};
