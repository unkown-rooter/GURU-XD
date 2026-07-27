import { Bot, Command, BotFile, Plugin, Session, PortalUser, LogLine } from './types';

export const INITIAL_BOTS: Bot[] = [
  {
    id: 'bot-1',
    name: 'GURU-MD WhatsApp',
    platform: 'WhatsApp',
    status: 'running',
    uptime: '14d 6h 32m',
    memory: '142 MB / 512 MB',
    cpu: 2.4,
    version: 'v4.2.1',
    commandsCount: 154,
    prefix: '.',
    qrCode: 'GURU-MD-PAIR-KEY:834927_CONNECTED',
    storageUsage: '1.4 GB / 10 GB',
    storagePercent: 14,
    networkDown: '124.5 KB/s',
    networkUp: '48.2 KB/s',
    ping: 24,
    connectedUsers: 1420,
    groupsCount: 88,
    privateChatsCount: 342,
    messagesToday: 18450,
    errorsCount: 2,
    owner: 'UNKNOWNROOTERG7 (+1 555-019-2834)',
    phone: '+1 (555) 019-2834',
    language: 'TypeScript / Node.js',
    timezone: 'UTC',
    createdDate: '2025-11-12',
    lastRestart: '2026-07-24 14:22 UTC',
    database: 'PostgreSQL v16.1',
    nodeVersion: 'v20.11.0',
    baileysVersion: 'v6.6.0',
    twoFactor: true,
    encrypted: true,
    verified: true,
    trusted: true,
    webhookProtected: true,
    rateLimited: true
  },
  {
    id: 'bot-2',
    name: 'TG-SpamShield-Pro',
    platform: 'Telegram',
    status: 'running',
    uptime: '3d 12h 45m',
    memory: '89 MB / 256 MB',
    cpu: 1.1,
    version: 'v1.0.8',
    commandsCount: 42,
    prefix: '/',
    qrCode: 'TG-PRO-KEY_ACTIVE',
    storageUsage: '650 MB / 5 GB',
    storagePercent: 13,
    networkDown: '68.1 KB/s',
    networkUp: '22.4 KB/s',
    ping: 18,
    connectedUsers: 3890,
    groupsCount: 14,
    privateChatsCount: 512,
    messagesToday: 9420,
    errorsCount: 0,
    owner: 'GURU Admin (@guru_admin)',
    phone: '+1 (555) 441-9982',
    language: 'TypeScript / GramMY',
    timezone: 'EST (UTC-5)',
    createdDate: '2025-12-01',
    lastRestart: '2026-07-22 08:15 EST',
    database: 'Redis v7.2 + Mongo',
    nodeVersion: 'v20.11.0',
    baileysVersion: 'Telegraf v4.15',
    twoFactor: true,
    encrypted: true,
    verified: true,
    trusted: true,
    webhookProtected: true,
    rateLimited: true
  },
  {
    id: 'bot-3',
    name: 'Auto-Moderator WhatsApp',
    platform: 'WhatsApp',
    status: 'running',
    uptime: '22d 1h 10m',
    memory: '205 MB / 512 MB',
    cpu: 5.7,
    version: 'v2.1.0',
    commandsCount: 68,
    prefix: '!',
    qrCode: 'AUTOMOD-LINKED-SECURE',
    storageUsage: '2.8 GB / 10 GB',
    storagePercent: 28,
    networkDown: '210.8 KB/s',
    networkUp: '84.6 KB/s',
    ping: 32,
    connectedUsers: 890,
    groupsCount: 42,
    privateChatsCount: 180,
    messagesToday: 24100,
    errorsCount: 5,
    owner: 'ModTeam (+1 555-882-1049)',
    phone: '+1 (555) 882-1049',
    language: 'JavaScript / Node.js',
    timezone: 'PST (UTC-8)',
    createdDate: '2025-09-18',
    lastRestart: '2026-07-03 11:00 PST',
    database: 'SQLite v3.42',
    nodeVersion: 'v20.10.0',
    baileysVersion: 'v6.5.0',
    twoFactor: true,
    encrypted: true,
    verified: true,
    trusted: true,
    webhookProtected: true,
    rateLimited: false
  },
  {
    id: 'bot-4',
    name: 'GURU-Discord-Sentry',
    platform: 'Discord',
    status: 'running',
    uptime: '5d 8h 19m',
    memory: '310 MB / 1024 MB',
    cpu: 3.8,
    version: 'v1.4.0',
    commandsCount: 88,
    prefix: '!',
    qrCode: 'DISCORD-BOT-OAUTH-VALID',
    storageUsage: '820 MB / 10 GB',
    storagePercent: 8,
    networkDown: '340.2 KB/s',
    networkUp: '120.5 KB/s',
    ping: 15,
    connectedUsers: 12500,
    groupsCount: 18,
    privateChatsCount: 820,
    messagesToday: 48900,
    errorsCount: 1,
    owner: 'DiscordDev (@sentry_owner)',
    phone: 'N/A (Discord Bot)',
    language: 'TypeScript / Discord.js v14',
    timezone: 'UTC',
    createdDate: '2026-01-10',
    lastRestart: '2026-07-20 04:30 UTC',
    database: 'PostgreSQL v16.1',
    nodeVersion: 'v20.11.0',
    baileysVersion: 'Discord.js v14.14',
    twoFactor: true,
    encrypted: true,
    verified: true,
    trusted: true,
    webhookProtected: true,
    rateLimited: true
  },
  {
    id: 'bot-5',
    name: 'GURU-Slack-Notifier',
    platform: 'Slack',
    status: 'stopped',
    uptime: '0h 0m',
    memory: '0 MB / 512 MB',
    cpu: 0,
    version: 'v1.1.2',
    commandsCount: 24,
    prefix: '/',
    qrCode: 'SLACK-APP-TOKEN-EXPIRED',
    storageUsage: '120 MB / 5 GB',
    storagePercent: 2,
    networkDown: '0 KB/s',
    networkUp: '0 KB/s',
    ping: 0,
    connectedUsers: 240,
    groupsCount: 6,
    privateChatsCount: 45,
    messagesToday: 0,
    errorsCount: 0,
    owner: 'Enterprise Ops (@ops_lead)',
    phone: 'N/A (Slack App)',
    language: 'TypeScript / Bolt JS',
    timezone: 'UTC',
    createdDate: '2026-02-14',
    lastRestart: '2026-07-01 12:00 UTC',
    database: 'Redis v7.2',
    nodeVersion: 'v20.11.0',
    baileysVersion: '@slack/bolt v3.16',
    twoFactor: true,
    encrypted: true,
    verified: false,
    trusted: true,
    webhookProtected: true,
    rateLimited: true
  }
];

export const INITIAL_COMMANDS: Command[] = [
  {
    id: 'cmd-1',
    trigger: 'help',
    prefix: '.',
    description: 'Displays the list of all available commands and utility manuals.',
    category: 'Utility',
    isActive: true,
    code: `// .help handler
module.exports = async (client, message, args) => {
  const commands = client.commands.map(c => \`\${client.prefix}\${c.trigger} - \${c.description}\`);
  const response = \`🤖 *GURU-MD Command Index* 🤖\\n\\n\${commands.join('\\n')}\`;
  await client.sendMessage(message.from, response);
};`
  },
  {
    id: 'cmd-2',
    trigger: 'alive',
    prefix: '.',
    description: 'Check if the bot instance is active, and shows dynamic system specs.',
    category: 'Utility',
    isActive: true,
    code: `// .alive handler
module.exports = async (client, message) => {
  const uptime = client.getUptime();
  const resMsg = \`🟢 *GURU-MD IS ONLINE* 🟢\\n\\n⚡ Uptime: \${uptime}\\n📱 Platform: Multi-device Node\\n🛠️ Latency: \${Date.now() - message.timestamp * 1000}ms\`;
  await client.sendMessage(message.from, resMsg, { quoted: message });
};`
  },
  {
    id: 'cmd-3',
    trigger: 'ai',
    prefix: '.',
    description: 'Ask the integrated Gemini AI to answer questions or write code snippets.',
    category: 'AI',
    isActive: true,
    code: `// .ai helper
const { GoogleGenAI } = require("@google/genai");
module.exports = async (client, message, args) => {
  if (!args.length) return message.reply("Please provide a prompt! e.g. .ai Write a poem.");
  
  const prompt = args.join(" ");
  await client.sendPresenceUpdate(message.from, "composing");
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    await client.sendMessage(message.from, response.text);
  } catch (err) {
    await client.sendMessage(message.from, "⚠️ AI Generation failed. Please check host keys.");
  }
};`
  },
  {
    id: 'cmd-4',
    trigger: 'ban',
    prefix: '.',
    description: 'Bans/kicks a malicious user from the group. (Requires admin).',
    category: 'Moderation',
    isActive: true,
    code: `// .ban handler
module.exports = async (client, message) => {
  if (!message.isGroup) return message.reply("This is a group-only action!");
  const quoted = message.quoted || message.mentionedJid[0];
  if (!quoted) return message.reply("Tag or quote the user you wish to ban.");
  
  await client.groupParticipantsUpdate(message.from, [quoted], "remove");
  await message.reply("🚫 User has been kicked and blacklisted from this chat group.");
};`
  },
  {
    id: 'cmd-5',
    trigger: 'meme',
    prefix: '.',
    description: 'Fetches and displays a funny programmer meme from Reddit API.',
    category: 'Fun',
    isActive: false,
    code: `// .meme handler
const axios = require("axios");
module.exports = async (client, message) => {
  try {
    const res = await axios.get("https://meme-api.com/gimme/programmerhumor");
    await client.sendMessage(message.from, { image: { url: res.data.url }, caption: res.data.title });
  } catch (err) {
    await message.reply("Could not retrieve memes at this time. Try again later.");
  }
};`
  }
];

export const INITIAL_FILES: BotFile[] = [
  { name: 'src', path: '/src', isDirectory: true },
  { name: 'commands', path: '/commands', isDirectory: true },
  { name: 'config.json', path: '/config.json', isDirectory: false, size: '2.4 KB', content: `{
  "sessionName": "guru_session",
  "autoRead": true,
  "alwaysOnline": true,
  "admins": ["2348123456789@s.whatsapp.net"],
  "gcast": false,
  "reconnectDelay": 5000,
  "max_sessions": 5,
  "features": {
    "welcome_message": true,
    "anti_link": false,
    "chatbot": true
  }
}` },
  { name: 'package.json', path: '/package.json', isDirectory: false, size: '1.2 KB', content: `{
  "name": "guru-bot-instance",
  "version": "1.0.0",
  "description": "WhatsApp bot automated client",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.5.0",
    "pino": "^8.16.0",
    "qrcode-terminal": "^0.12.0",
    "axios": "^1.6.0"
  }
}` },
  { name: 'src/index.js', path: '/src/index.js', isDirectory: false, size: '4.8 KB', content: `const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session_auth');
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true
  });
  
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', async m => {
    // Command orchestration loop
  });
  console.log("GURU Bot Initialized successfully.");
}
startBot();` },
  { name: 'commands/ping.js', path: '/commands/ping.js', isDirectory: false, size: '0.4 KB', content: `module.exports = {
  name: 'ping',
  execute(client, msg) {
    msg.reply('pong! 🏓');
  }
};` }
];

export const INITIAL_PLUGINS: Plugin[] = [
  {
    id: 'plg-1',
    name: 'Gemini Auto-Responder',
    description: 'Enables real-time, smart context-aware conversational chat responses using Google Gemini Flash.',
    category: 'Integrations',
    installed: true,
    author: 'GURU team',
    rating: 4.9,
    downloads: '18.4k',
    version: 'v2.0.1'
  },
  {
    id: 'plg-2',
    name: 'Anti-Link System',
    description: 'Instantly delete and ban users who send promotional links, telegram channels, or group invites.',
    category: 'Automation',
    installed: true,
    author: 'SecOps-Admin',
    rating: 4.7,
    downloads: '12.1k',
    version: 'v1.4.0'
  },
  {
    id: 'plg-3',
    name: 'Economy Leveling System',
    description: 'Gamify your community chats! Users earn coins, exp, levels, and ranks by sending active messages.',
    category: 'Entertainment',
    installed: false,
    author: 'RPG-Core',
    rating: 4.8,
    downloads: '9.3k',
    version: 'v3.1.2'
  },
  {
    id: 'plg-4',
    name: 'Welcome Greet Cards',
    description: 'Generates gorgeous visual background greeting image cards dynamically when a new user joins a group.',
    category: 'Automation',
    installed: false,
    author: 'GURU team',
    rating: 4.6,
    downloads: '25.6k',
    version: 'v1.2.5'
  },
  {
    id: 'plg-5',
    name: 'Database Backup Sync',
    description: 'Automatically back up your chats, economy ledger, and media assets daily to Secure Cloud Storage.',
    category: 'Admin',
    installed: false,
    author: 'BackupOps',
    rating: 4.5,
    downloads: '5.2k',
    version: 'v1.0.1'
  }
];

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 'sess-1',
    device: 'Node-WA Server (Linux)',
    location: 'London, UK',
    activeAt: 'Just Now',
    status: 'connected',
    ip: '142.250.200.46'
  },
  {
    id: 'sess-2',
    device: 'Chrome v122 (Windows 11)',
    location: 'New York, US',
    activeAt: '5 minutes ago',
    status: 'connected',
    ip: '198.51.100.22'
  },
  {
    id: 'sess-3',
    device: 'iPhone 15 Pro Max (iOS)',
    location: 'Paris, FR',
    activeAt: '12 hours ago',
    status: 'disconnected',
    ip: '82.16.205.101'
  },
  {
    id: 'sess-4',
    device: 'Redmi Note 12 (Android)',
    location: 'Mumbai, IN',
    activeAt: 'Yesterday',
    status: 'pending',
    ip: '103.45.162.77'
  }
];

export const INITIAL_USERS: PortalUser[] = [
  {
    id: 'usr-1',
    username: 'admin',
    email: 'admin@guru-xd.com',
    role: 'Administrator',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: 'usr-2',
    username: 'alex_dev',
    email: 'alex@guru-xd.com',
    role: 'Developer',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: 'usr-3',
    username: 'jane_moderator',
    email: 'jane@guru-xd.com',
    role: 'Viewer',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: 'usr-4',
    username: 'guest_test',
    email: 'test@guru-xd.com',
    role: 'Viewer',
    status: 'suspended',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
  }
];

export const INITIAL_LOGS: LogLine[] = [
  { id: 'log-1', timestamp: '16:11:01', type: 'info', message: 'System initialization initiated.', source: 'SYSTEM' },
  { id: 'log-2', timestamp: '16:11:02', type: 'success', message: 'Connected to WhatsApp Gateway API successfully.', source: 'GURU-MD' },
  { id: 'log-3', timestamp: '16:11:03', type: 'info', message: 'Loaded 154 custom commands.', source: 'GURU-MD' },
  { id: 'log-4', timestamp: '16:11:05', type: 'info', message: 'Telegram bot TG-SpamShield-Pro polling started.', source: 'TG-SPAM' },
  { id: 'log-5', timestamp: '16:11:10', type: 'command', message: 'User @alex_dev triggered command [.alive] in Group DevChat-GURU.', source: 'GURU-MD' },
  { id: 'log-6', timestamp: '16:11:11', type: 'success', message: 'Response to [.alive] dispatched in 42ms.', source: 'GURU-MD' },
  { id: 'log-7', timestamp: '16:11:15', type: 'info', message: 'Plugin Gemini Auto-Responder hot-loaded (v2.0.1).', source: 'SYSTEM' },
  { id: 'log-8', timestamp: '16:11:20', type: 'command', message: 'User @guest_test triggered command [.help] in Private Chat.', source: 'GURU-MD' },
  { id: 'log-9', timestamp: '16:11:25', type: 'error', message: 'Socket connection timed out with backup node.', source: 'TG-ECON' },
  { id: 'log-10', timestamp: '16:11:26', type: 'info', message: 'Retrying secondary broker sync in 5000ms...', source: 'TG-ECON' }
];

export const ANALYTICS_DATA = [
  { time: '00:00', messages: 4500, commands: 1200, cpu: 22, ram: 44 },
  { time: '02:00', messages: 3200, commands: 800, cpu: 18, ram: 42 },
  { time: '04:00', messages: 2100, commands: 500, cpu: 12, ram: 42 },
  { time: '06:00', messages: 5400, commands: 1800, cpu: 28, ram: 45 },
  { time: '08:00', messages: 8900, commands: 3200, cpu: 45, ram: 50 },
  { time: '10:00', messages: 11200, commands: 4100, cpu: 56, ram: 52 },
  { time: '12:00', messages: 15400, commands: 5400, cpu: 62, ram: 58 },
  { time: '14:00', messages: 14200, commands: 4900, cpu: 59, ram: 56 },
  { time: '16:00', messages: 18900, commands: 6400, cpu: 75, ram: 61 },
  { time: '18:00', messages: 22000, commands: 7800, cpu: 82, ram: 65 },
  { time: '20:00', messages: 19500, commands: 6800, cpu: 70, ram: 62 },
  { time: '22:00', messages: 13500, commands: 4500, cpu: 48, ram: 55 }
];
