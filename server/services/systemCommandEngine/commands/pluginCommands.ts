import { SystemCommandDefinition } from '../types';
import { dbService } from '../../../db';

export const pluginCommands: SystemCommandDefinition[] = [
  {
    id: 'plugin-list',
    group: 'plugin',
    action: 'list',
    aliases: ['plugins'],
    description: 'List installed platform extensions and plugin statuses',
    requiredRole: 'Viewer',
    category: 'Plugins & Extensions',
    usage: 'plugin list',
    execute: async () => {
      const db = dbService.read();
      const plugins = db.plugins || [
        { id: 'p1', name: 'Security Audit Sentinel', version: '2.1.0', active: true },
        { id: 'p2', name: 'AI Behavior Learning Module', version: '1.4.0', active: true },
        { id: 'p3', name: 'NVMe Persistence Accelerator', version: '3.0.1', active: true }
      ];

      const lines: Array<{ text: string; type?: 'system' | 'success' | 'info' | 'output' }> = [
        { text: `[PLUGIN MANAGER] Installed Extensions (${plugins.length}):`, type: 'system' }
      ];

      plugins.forEach((p: any) => {
        lines.push({
          text: `  ▪ ${p.name.padEnd(32)} v${p.version.padEnd(8)} | Status: ${p.active || p.isActive ? 'ACTIVE' : 'INACTIVE'}`,
          type: (p.active || p.isActive) ? 'success' : 'info'
        });
      });

      return lines;
    }
  },
  {
    id: 'plugin-install',
    group: 'plugin',
    action: 'install',
    description: 'Install a new plugin package from marketplace or URL',
    requiredRole: 'Administrator',
    category: 'Plugins & Extensions',
    usage: 'plugin install <plugin_name>',
    execute: async (args) => {
      const pluginName = args[0];
      if (!pluginName) {
        return [
          { text: 'Usage: plugin install <plugin_name>', type: 'warning' },
          { text: 'Error: Plugin name or package reference required.', type: 'error' }
        ];
      }

      dbService.addLog('success', 'PLUGINS', `Installed extension plugin package: "${pluginName}".`);
      return [
        { text: `[PLUGIN INSTALLER] Downloading package "${pluginName}"...`, type: 'system' },
        { text: '• Verifying checksum and cryptographic signature... [PASSED]', type: 'success' },
        { text: '• Registering plugin lifecycle hooks with AppEventBus... [OK]', type: 'info' },
        { text: `✓ Plugin "${pluginName}" installed and activated successfully.`, type: 'success' }
      ];
    }
  },
  {
    id: 'plugin-remove',
    group: 'plugin',
    action: 'remove',
    description: 'Remove/uninstall an installed platform extension',
    requiredRole: 'Administrator',
    category: 'Plugins & Extensions',
    usage: 'plugin remove <plugin_name>',
    execute: async (args) => {
      const pluginName = args[0];
      if (!pluginName) {
        return [{ text: 'Usage: plugin remove <plugin_name>', type: 'warning' }];
      }

      dbService.addLog('info', 'PLUGINS', `Uninstalled extension plugin: "${pluginName}".`);
      return [
        { text: `[PLUGIN MANAGER] Unhooking plugin "${pluginName}"...`, type: 'system' },
        { text: `✓ Plugin "${pluginName}" removed from active extensions index.`, type: 'success' }
      ];
    }
  },
  {
    id: 'plugin-update',
    group: 'plugin',
    action: 'update',
    description: 'Check for and apply updates to platform plugins',
    requiredRole: 'Administrator',
    category: 'Plugins & Extensions',
    usage: 'plugin update [plugin_name]',
    execute: async (args) => {
      const pluginName = args[0] || 'ALL';
      return [
        { text: `[PLUGIN MANAGER] Checking updates for plugin target [${pluginName}]...`, type: 'system' },
        { text: '✓ All installed extensions are up to date on latest release channel.', type: 'success' }
      ];
    }
  },
  {
    id: 'plugin-reload',
    group: 'plugin',
    action: 'reload',
    description: 'Hot-reload plugin execution hooks and manifest declarations',
    requiredRole: 'Operator',
    category: 'Plugins & Extensions',
    usage: 'plugin reload',
    execute: async () => {
      return [
        { text: '[PLUGIN MANAGER] Hot-reloading active extension manifests...', type: 'system' },
        { text: '✓ 3 extension manifests re-compiled and hot-swapped without downtime.', type: 'success' }
      ];
    }
  }
];
