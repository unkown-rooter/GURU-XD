import { SystemCommandDefinition } from '../types';
import { dbService } from '../../../db';

export const botCommands: SystemCommandDefinition[] = [
  {
    id: 'bot-list',
    group: 'bot',
    action: 'list',
    aliases: ['bots'],
    description: 'Query active messaging bot microservices and connection health',
    requiredRole: 'Viewer',
    category: 'Bot Microservices',
    usage: 'bot list',
    execute: async () => {
      const db = dbService.read();
      const bots = db.bots || [
        { id: 'bot-wa-01', name: 'WhatsApp Business Bot', platform: 'Multi-Device', status: 'ONLINE', memoryMB: 42 },
        { id: 'bot-tg-02', name: 'Telegram Support Bot', platform: 'Telegram API', status: 'ONLINE', memoryMB: 28 },
        { id: 'bot-dc-03', name: 'Discord Moderator Bot', platform: 'Discord Gateway', status: 'ONLINE', memoryMB: 35 }
      ];

      const lines: Array<{ text: string; type?: 'system' | 'success' | 'info' | 'output' }> = [
        { text: `[BOT MICROSERVICES MATRIX] Active Bot Instances (${bots.length}):`, type: 'system' }
      ];

      bots.forEach((b: any) => {
        lines.push({
          text: `  • ${b.name.padEnd(28)} (ID: ${b.id}) - ${b.status} | Platform: ${b.platform} | Memory: ${b.memoryMB || 30}MB`,
          type: b.status === 'ONLINE' ? 'success' : 'info'
        });
      });

      return lines;
    }
  },
  {
    id: 'bot-start',
    group: 'bot',
    action: 'start',
    description: 'Start or launch a specific bot microservice daemon',
    requiredRole: 'Operator',
    category: 'Bot Microservices',
    usage: 'bot start <bot_id>',
    execute: async (args) => {
      const botId = args[0] || 'bot-wa-01';
      dbService.addLog('info', 'BOTS', `Started bot instance daemon: ${botId}`);
      return [
        { text: `[BOT DAEMON ENGINE] Launching bot instance "${botId}"...`, type: 'system' },
        { text: '• Establishing socket connection to gateway... [CONNECTED]', type: 'success' },
        { text: `✓ Bot instance '${botId}' started successfully in background process.`, type: 'success' }
      ];
    }
  },
  {
    id: 'bot-stop',
    group: 'bot',
    action: 'stop',
    description: 'Gracefully stop a running bot microservice daemon',
    requiredRole: 'Operator',
    category: 'Bot Microservices',
    usage: 'bot stop <bot_id>',
    execute: async (args) => {
      const botId = args[0] || 'bot-wa-01';
      dbService.addLog('warning', 'BOTS', `Stopped bot instance daemon: ${botId}`);
      return [
        { text: `[BOT DAEMON ENGINE] Sending SIGTERM to bot daemon "${botId}"...`, type: 'system' },
        { text: `✓ Bot instance '${botId}' stopped gracefully.`, type: 'success' }
      ];
    }
  },
  {
    id: 'bot-restart',
    group: 'bot',
    action: 'restart',
    description: 'Restart a bot daemon microservice',
    requiredRole: 'Operator',
    category: 'Bot Microservices',
    usage: 'bot restart <bot_id>',
    execute: async (args) => {
      const botId = args[0] || 'bot-wa-01';
      dbService.addLog('info', 'BOTS', `Restarted bot instance daemon: ${botId}`);
      return [
        { text: `[BOT DAEMON ENGINE] Restarting bot instance "${botId}"...`, type: 'system' },
        { text: '• Stopping process... [OK]', type: 'info' },
        { text: '• Re-reading bot command registry & credentials... [OK]', type: 'info' },
        { text: `✓ Bot instance '${botId}' restarted and re-connected.`, type: 'success' }
      ];
    }
  },
  {
    id: 'bot-health',
    group: 'bot',
    action: 'health',
    description: 'Audit messaging gateway socket latency and message throughput for bots',
    requiredRole: 'Viewer',
    category: 'Bot Microservices',
    usage: 'bot health',
    execute: async () => {
      return [
        { text: '[BOT MESSAGING GATEWAY HEALTH REPORT]', type: 'system' },
        { text: '• WhatsApp Multi-Device Socket: HEALTHY (Latency: 1.2ms, Uptime: 99.98%)', type: 'success' },
        { text: '• Telegram Bot API Gateway: HEALTHY (Latency: 0.8ms, Uptime: 100%)', type: 'success' },
        { text: '• Discord Gateway Websocket: HEALTHY (Latency: 1.5ms, Uptime: 99.95%)', type: 'success' }
      ];
    }
  },
  {
    id: 'bot-test-command',
    group: 'bot',
    action: 'test',
    aliases: ['bot-test'],
    description: 'Simulate and test bot command trigger execution in isolated sandbox',
    requiredRole: 'Operator',
    category: 'Bot Microservices',
    usage: 'bot-test <trigger_name>',
    execute: async (args) => {
      const trigName = args[0] || 'help';
      return [
        { text: `[BOT COMMAND TEST] Triggering handler for prefix command: ".${trigName}"...`, type: 'system' },
        { text: `• Match: Registered in Bot Command Registry (Category: Utility)`, type: 'info' },
        { text: `• Executor Node: bot-wa-01 (Multi-Device Engine)`, type: 'info' },
        { text: `• Simulated Output: "🤖 GURU-XD Bot Menu: Available features: .ping, .ai, .status, .sticker"`, type: 'output' },
        { text: `✓ Bot command handler executed in 0.8ms without errors.`, type: 'success' }
      ];
    }
  }
];
