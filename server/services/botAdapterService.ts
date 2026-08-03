import { AppEventBus } from './eventBus';
import { DatabaseService } from '../db';

const eventBus = AppEventBus.getInstance();
const dbService = DatabaseService.getInstance();

export type PlatformType = 'baileys_md' | 'telegram' | 'discord' | 'webhook';

export type AdapterConnectionState = 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'reconnecting' | 'error';

export interface AdapterSession {
  botId: string;
  botName: string;
  platform: PlatformType;
  state: AdapterConnectionState;
  qrCode?: string;
  pairingCode?: string;
  phoneNumber?: string;
  telegramToken?: string;
  webhookUrl?: string;
  connectedAt?: string;
  lastHeartbeat?: string;
  reconnectAttempts: number;
  messagesSent: number;
  messagesReceived: number;
  lastError?: string;
  config: Record<string, any>;
}

export interface InboundMessage {
  id: string;
  botId: string;
  platform: PlatformType;
  senderId: string;
  senderName: string;
  chatId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  timestamp: string;
  rawPayload?: any;
}

export interface OutboundMessage {
  botId: string;
  recipientId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  replyToMessageId?: string;
  buttons?: Array<{ id: string; text: string }>;
}

export class BaileysMDDriver {
  private botId: string;
  private session: AdapterSession;
  private heartbeatInterval?: NodeJS.Timeout;
  private pollingTimeout?: NodeJS.Timeout;

  constructor(botId: string, session: AdapterSession) {
    this.botId = botId;
    this.session = session;
  }

  public async connect(): Promise<{ success: boolean; qrCode?: string; pairingCode?: string }> {
    this.session.state = 'connecting';
    this.session.lastError = undefined;

    // Simulate multi-device session initialization & authentication key generation
    const mockQR = `2@GURU_BAILEYS_MD_KEY_${this.botId.toUpperCase()}_${Date.now()}`;
    const mockPairing = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;

    this.session.qrCode = mockQR;
    this.session.pairingCode = mockPairing;
    this.session.state = 'qr_ready';

    // Broadcast event
    eventBus.publish('bot.qr.generated', {
      botId: this.botId,
      platform: 'baileys_md',
      qrCode: mockQR,
      pairingCode: mockPairing,
      timestamp: new Date().toISOString()
    });

    // Auto-complete connection simulation after pairing window
    this.pollingTimeout = setTimeout(() => {
      this.session.state = 'connected';
      this.session.connectedAt = new Date().toISOString();
      this.session.reconnectAttempts = 0;
      this.startHeartbeat();

      eventBus.publish('bot.status.changed', {
        botId: this.botId,
        platform: 'baileys_md',
        status: 'connected',
        timestamp: new Date().toISOString()
      });

      // Update DB record
      const db = dbService.read();
      const bot = db.bots.find((b: any) => b.id === this.botId);
      if (bot) {
        bot.status = 'running';
        bot.qrCode = mockQR;
        dbService.write(db);
      }
    }, 4000);

    return {
      success: true,
      qrCode: mockQR,
      pairingCode: mockPairing
    };
  }

  public async disconnect(): Promise<boolean> {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.pollingTimeout) clearTimeout(this.pollingTimeout);

    this.session.state = 'disconnected';
    this.session.qrCode = undefined;
    this.session.pairingCode = undefined;

    eventBus.publish('bot.status.changed', {
      botId: this.botId,
      platform: 'baileys_md',
      status: 'disconnected',
      timestamp: new Date().toISOString()
    });

    const db = dbService.read();
    const bot = db.bots.find((b: any) => b.id === this.botId);
    if (bot) {
      bot.status = 'stopped';
      dbService.write(db);
    }

    return true;
  }

  public async sendMessage(outbound: OutboundMessage): Promise<{ success: boolean; messageId: string }> {
    if (this.session.state !== 'connected') {
      throw new Error(`Baileys MD session for ${this.botId} is not connected. Current state: ${this.session.state}`);
    }

    const messageId = `baileys_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.session.messagesSent += 1;

    // Record system log
    dbService.addLog(
      'info',
      'BAILEYS_MD',
      `[${this.session.botName}] Sent Baileys MD WhatsApp message to ${outbound.recipientId}: "${outbound.content.substring(0, 50)}"`
    );

    eventBus.publish('bot.message.sent', {
      botId: this.botId,
      platform: 'baileys_md',
      messageId,
      recipientId: outbound.recipientId,
      content: outbound.content,
      timestamp: new Date().toISOString()
    });

    return { success: true, messageId };
  }

  public handleInbound(rawPayload: any): InboundMessage {
    this.session.messagesReceived += 1;
    const inbound: InboundMessage = {
      id: rawPayload.id || `baileys_in_${Date.now()}`,
      botId: this.botId,
      platform: 'baileys_md',
      senderId: rawPayload.senderId || 'whatsapp_user_123',
      senderName: rawPayload.senderName || 'WhatsApp User',
      chatId: rawPayload.chatId || 'whatsapp_chat_123',
      content: rawPayload.content || 'Hello from Baileys WhatsApp',
      mediaUrl: rawPayload.mediaUrl,
      mediaType: rawPayload.mediaType,
      timestamp: new Date().toISOString(),
      rawPayload
    };

    eventBus.publish('bot.message.received', inbound);
    return inbound;
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.session.lastHeartbeat = new Date().toISOString();
    }, 10000);
  }
}

export class TelegramDriver {
  private botId: string;
  private session: AdapterSession;
  private pollingInterval?: NodeJS.Timeout;

  constructor(botId: string, session: AdapterSession) {
    this.botId = botId;
    this.session = session;
  }

  public async connect(token?: string): Promise<{ success: boolean }> {
    if (token) this.session.telegramToken = token;
    
    this.session.state = 'connecting';

    // Validate bot token structure (basic check)
    if (this.session.telegramToken && !this.session.telegramToken.includes(':')) {
      this.session.state = 'error';
      this.session.lastError = 'Invalid Telegram Bot Token format. Expected format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
      throw new Error(this.session.lastError);
    }

    this.session.state = 'connected';
    this.session.connectedAt = new Date().toISOString();
    this.session.reconnectAttempts = 0;
    this.startLongPolling();

    eventBus.publish('bot.status.changed', {
      botId: this.botId,
      platform: 'telegram',
      status: 'connected',
      timestamp: new Date().toISOString()
    });

    const db = dbService.read();
    const bot = db.bots.find((b: any) => b.id === this.botId);
    if (bot) {
      bot.status = 'running';
      dbService.write(db);
    }

    return { success: true };
  }

  public async disconnect(): Promise<boolean> {
    if (this.pollingInterval) clearInterval(this.pollingInterval);

    this.session.state = 'disconnected';
    eventBus.publish('bot.status.changed', {
      botId: this.botId,
      platform: 'telegram',
      status: 'disconnected',
      timestamp: new Date().toISOString()
    });

    const db = dbService.read();
    const bot = db.bots.find((b: any) => b.id === this.botId);
    if (bot) {
      bot.status = 'stopped';
      dbService.write(db);
    }

    return true;
  }

  public async sendMessage(outbound: OutboundMessage): Promise<{ success: boolean; messageId: string }> {
    if (this.session.state !== 'connected') {
      throw new Error(`Telegram session for ${this.botId} is not connected.`);
    }

    const messageId = `tg_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.session.messagesSent += 1;

    dbService.addLog(
      'info',
      'TELEGRAM',
      `[${this.session.botName}] Sent Telegram API message to ${outbound.recipientId}: "${outbound.content.substring(0, 50)}"`
    );

    eventBus.publish('bot.message.sent', {
      botId: this.botId,
      platform: 'telegram',
      messageId,
      recipientId: outbound.recipientId,
      content: outbound.content,
      timestamp: new Date().toISOString()
    });

    return { success: true, messageId };
  }

  public handleInbound(rawPayload: any): InboundMessage {
    this.session.messagesReceived += 1;
    const inbound: InboundMessage = {
      id: rawPayload.message_id ? `tg_${rawPayload.message_id}` : `tg_in_${Date.now()}`,
      botId: this.botId,
      platform: 'telegram',
      senderId: rawPayload.from?.id ? String(rawPayload.from.id) : 'telegram_user_123',
      senderName: rawPayload.from?.first_name || 'Telegram User',
      chatId: rawPayload.chat?.id ? String(rawPayload.chat.id) : 'telegram_chat_123',
      content: rawPayload.text || '/start',
      timestamp: new Date().toISOString(),
      rawPayload
    };

    eventBus.publish('bot.message.received', inbound);
    return inbound;
  }

  private startLongPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      this.session.lastHeartbeat = new Date().toISOString();
    }, 12000);
  }
}

export class BotAdapterService {
  private static instance: BotAdapterService;
  private sessions: Map<string, AdapterSession> = new Map();
  private baileysDrivers: Map<string, BaileysMDDriver> = new Map();
  private telegramDrivers: Map<string, TelegramDriver> = new Map();

  private constructor() {
    this.initDefaultSessions();
  }

  public static getInstance(): BotAdapterService {
    if (!BotAdapterService.instance) {
      BotAdapterService.instance = new BotAdapterService();
    }
    return BotAdapterService.instance;
  }

  private initDefaultSessions() {
    const db = dbService.read();
    db.bots.forEach((bot: any) => {
      const platformStr = String(bot.platform || '').toLowerCase();
      const platform: PlatformType = platformStr.includes('telegram') ? 'telegram' : 'baileys_md';
      const session: AdapterSession = {
        botId: bot.id,
        botName: bot.name,
        platform,
        state: bot.status === 'running' ? 'connected' : 'disconnected',
        reconnectAttempts: 0,
        messagesSent: Math.floor(Math.random() * 500) + 10,
        messagesReceived: Math.floor(Math.random() * 800) + 20,
        connectedAt: bot.status === 'running' ? new Date().toISOString() : undefined,
        config: {}
      };

      this.sessions.set(bot.id, session);

      if (platform === 'baileys_md') {
        const driver = new BaileysMDDriver(bot.id, session);
        this.baileysDrivers.set(bot.id, driver);
      } else if (platform === 'telegram') {
        const driver = new TelegramDriver(bot.id, session);
        this.telegramDrivers.set(bot.id, driver);
      }
    });
  }

  public getAllSessions(): AdapterSession[] {
    return Array.from(this.sessions.values());
  }

  public getSession(botId: string): AdapterSession | undefined {
    return this.sessions.get(botId);
  }

  public async connectBot(botId: string, options?: { telegramToken?: string; phoneNumber?: string }): Promise<any> {
    let session = this.sessions.get(botId);
    if (!session) {
      const db = dbService.read();
      const bot = db.bots.find((b: any) => b.id === botId);
      const platformStr = String(bot?.platform || '').toLowerCase();
      session = {
        botId,
        botName: bot?.name || `Bot ${botId}`,
        platform: platformStr.includes('telegram') ? 'telegram' : 'baileys_md',
        state: 'disconnected',
        reconnectAttempts: 0,
        messagesSent: 0,
        messagesReceived: 0,
        config: {}
      };
      this.sessions.set(botId, session);
    }

    if (session.platform === 'baileys_md') {
      let driver = this.baileysDrivers.get(botId);
      if (!driver) {
        driver = new BaileysMDDriver(botId, session);
        this.baileysDrivers.set(botId, driver);
      }
      return await driver.connect();
    } else if (session.platform === 'telegram') {
      let driver = this.telegramDrivers.get(botId);
      if (!driver) {
        driver = new TelegramDriver(botId, session);
        this.telegramDrivers.set(botId, driver);
      }
      return await driver.connect(options?.telegramToken);
    }

    throw new Error(`Unsupported platform adapter: ${session.platform}`);
  }

  public async disconnectBot(botId: string): Promise<boolean> {
    const session = this.sessions.get(botId);
    if (!session) return false;

    if (session.platform === 'baileys_md') {
      const driver = this.baileysDrivers.get(botId);
      if (driver) return await driver.disconnect();
    } else if (session.platform === 'telegram') {
      const driver = this.telegramDrivers.get(botId);
      if (driver) return await driver.disconnect();
    }

    session.state = 'disconnected';
    return true;
  }

  public async sendMessage(botId: string, outbound: OutboundMessage): Promise<any> {
    const session = this.sessions.get(botId);
    if (!session) throw new Error(`Bot session not found: ${botId}`);

    if (session.platform === 'baileys_md') {
      const driver = this.baileysDrivers.get(botId);
      if (!driver) throw new Error(`Baileys driver not initialized for ${botId}`);
      return await driver.sendMessage(outbound);
    } else if (session.platform === 'telegram') {
      const driver = this.telegramDrivers.get(botId);
      if (!driver) throw new Error(`Telegram driver not initialized for ${botId}`);
      return await driver.sendMessage(outbound);
    }

    throw new Error(`Unsupported messaging platform: ${session.platform}`);
  }

  public handleInboundWebhook(botId: string, rawPayload: any): InboundMessage {
    const session = this.sessions.get(botId);
    if (!session) throw new Error(`Bot session not found for webhook: ${botId}`);

    if (session.platform === 'baileys_md') {
      const driver = this.baileysDrivers.get(botId);
      if (driver) return driver.handleInbound(rawPayload);
    } else if (session.platform === 'telegram') {
      const driver = this.telegramDrivers.get(botId);
      if (driver) return driver.handleInbound(rawPayload);
    }

    session.messagesReceived += 1;
    const inbound: InboundMessage = {
      id: `generic_${Date.now()}`,
      botId,
      platform: session.platform,
      senderId: rawPayload.senderId || 'unknown_sender',
      senderName: rawPayload.senderName || 'External User',
      chatId: rawPayload.chatId || 'default_chat',
      content: rawPayload.content || JSON.stringify(rawPayload),
      timestamp: new Date().toISOString(),
      rawPayload
    };

    eventBus.publish('bot.message.received', inbound);
    return inbound;
  }
}
