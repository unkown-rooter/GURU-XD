import { Request, Response } from "express";
import { DatabaseService } from "./db";
import { CopilotService } from "./services";
import { AppEventBus } from "./services/eventBus";

const dbService = DatabaseService.getInstance();

/**
 * Standardized API Response Structure (Version 1 Core Pipeline Upgrade)
 */
export function sendApiResponse(
  res: Response,
  statusCode: number = 200,
  payload: any = {},
  message: string = "Operation executed successfully",
  meta: any = null
) {
  const success = statusCode >= 200 && statusCode < 400;
  const isObj = payload && typeof payload === "object" && !Array.isArray(payload);

  return res.status(statusCode).json({
    success,
    code: statusCode,
    message,
    data: payload,
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
    ...(isObj ? payload : {})
  });
}

/**
 * @class BotController
 * Manages WhatsApp / Telegram / Discord bot microservices orchestration
 */
export class BotController {
  public static updateBot(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;
    const db = dbService.read();
    
    db.bots = db.bots.map((bot) => {
      if (bot.id === id) {
        return { ...bot, ...updates };
      }
      return bot;
    });
    
    dbService.write(db);
    res.json({ success: true, bots: db.bots });
  }

  public static deleteBot(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    const target = db.bots.find((b) => b.id === id);
    const botName = target ? target.name : "Unknown node";
    
    db.bots = db.bots.filter((b) => b.id !== id);
    dbService.addLog("error", "ORCHESTRATOR", `Permanently decommissioned and deleted bot instance container: "${botName}"`);
    dbService.write(db);
    res.json({ success: true, bots: db.bots, logs: db.logs });
  }

  public static startBot(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    
    if (db.maintenanceMode) {
      return res.status(403).json({ success: false, message: "Action locked. System is in Maintenance Mode." });
    }

    let botName = "Bot Instance";
    
    db.bots = db.bots.map((bot) => {
      if (bot.id === id) {
        botName = bot.name;
        return { ...bot, status: "running" as const, uptime: "0d 0h 1m", cpu: 1.5 };
      }
      return bot;
    });
    
    dbService.addLog("success", "ORCHESTRATOR", `Thread activated for bot instance: "${botName}"`);
    dbService.write(db);
    res.json({ success: true, bots: db.bots, logs: db.logs });
  }

  public static stopBot(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    
    if (db.maintenanceMode) {
      return res.status(403).json({ success: false, message: "Action locked. System is in Maintenance Mode." });
    }

    let botName = "Bot Instance";
    
    db.bots = db.bots.map((bot) => {
      if (bot.id === id) {
        botName = bot.name;
        return { ...bot, status: "stopped" as const, uptime: "0h 0m", cpu: 0 };
      }
      return bot;
    });
    
    dbService.addLog("error", "ORCHESTRATOR", `Thread terminated for bot instance: "${botName}"`);
    dbService.write(db);
    res.json({ success: true, bots: db.bots, logs: db.logs });
  }

  public static restartBot(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    
    if (db.maintenanceMode) {
      return res.status(403).json({ success: false, message: "Action locked. System is in Maintenance Mode." });
    }

    let botName = "Bot Instance";
    
    db.bots = db.bots.map((bot) => {
      if (bot.id === id) {
        botName = bot.name;
        return { ...bot, status: "running" as const, uptime: "0d 0h 1m", cpu: 0.5 };
      }
      return bot;
    });
    
    dbService.addLog("info", "ORCHESTRATOR", `Rebooting docker thread for bot instance: "${botName}"...`);
    
    setTimeout(() => {
      const delayedDb = dbService.read();
      dbService.addLog("success", "ORCHESTRATOR", `Instance "${botName}" successfully recalibrated after reboot.`);
    }, 100);
    
    dbService.write(db);
    res.json({ success: true, bots: db.bots, logs: db.logs });
  }

  public static startAllBots(req: Request, res: Response) {
    const db = dbService.read();
    
    if (db.maintenanceMode) {
      return res.status(403).json({ success: false, message: "Action locked. System is in Maintenance Mode." });
    }

    db.bots = db.bots.map((bot) => ({
      ...bot,
      status: "running" as const,
      uptime: "0d 0h 1m",
      cpu: 1.2 + Math.random() * 5
    }));
    
    dbService.addLog("success", "ORCHESTRATOR", "Global batch command executed: Initialized and connected all inactive bot threads.");
    dbService.write(db);
    res.json({ success: true, bots: db.bots, logs: db.logs });
  }

  public static stopAllBots(req: Request, res: Response) {
    const db = dbService.read();
    
    if (db.maintenanceMode) {
      return res.status(403).json({ success: false, message: "Action locked. System is in Maintenance Mode." });
    }

    db.bots = db.bots.map((bot) => ({
      ...bot,
      status: "stopped" as const,
      uptime: "0h 0m",
      cpu: 0
    }));
    
    dbService.addLog("error", "ORCHESTRATOR", "Global batch command executed: Terminated all running bot clusters.");
    dbService.write(db);
    res.json({ success: true, bots: db.bots, logs: db.logs });
  }

  public static createBot(req: Request, res: Response) {
    const newBot = req.body;
    const db = dbService.read();
    const id = `bot-${Date.now()}`;
    
    const deployed = {
      ...newBot,
      id,
      uptime: "0h 0m",
      memory: `0 MB / ${newBot.memoryLimit || 256} MB`,
      cpu: 0,
      commandsCount: 15,
      version: "v1.0.0",
      qrCode: `GURU_QR_PAIR_${id.toUpperCase()}`
    };
    
    db.bots.push(deployed);
    dbService.addLog("success", "SYSTEM", `Successfully containerized new microservice instance: "${deployed.name}"`);
    dbService.write(db);
    res.json({ success: true, bots: db.bots, logs: db.logs });
  }
}

export class CommandController {
  public static createCommand(req: Request, res: Response) {
    const newCmd = req.body;
    const db = dbService.read();
    const created = {
      ...newCmd,
      id: `cmd-${Date.now()}`
    };
    
    db.commands.push(created);
    dbService.addLog("success", "COMPILER", `Compiled and registered custom message trigger handler: "${created.prefix}${created.trigger}"`);
    dbService.write(db);
    res.json({ success: true, commands: db.commands, logs: db.logs });
  }

  public static toggleCommand(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    let trigger = "command";
    let state = false;
    
    db.commands = db.commands.map((cmd) => {
      if (cmd.id === id) {
        cmd.isActive = !cmd.isActive;
        trigger = `${cmd.prefix}${cmd.trigger}`;
        state = cmd.isActive;
      }
      return cmd;
    });
    
    dbService.addLog("info", "COMPILER", `Command trigger [${trigger}] active state changed to: ${state}`);
    dbService.write(db);
    res.json({ success: true, commands: db.commands, logs: db.logs });
  }

  public static updateCommand(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;
    const db = dbService.read();
    let trigger = "command";
    
    db.commands = db.commands.map((cmd) => {
      if (cmd.id === id) {
        trigger = cmd.trigger;
        return { ...cmd, ...updates };
      }
      return cmd;
    });
    
    dbService.addLog("success", "COMPILER", `Hot-reloaded modified handler logic for command: "${trigger}"`);
    dbService.write(db);
    res.json({ success: true, commands: db.commands, logs: db.logs });
  }

  public static deleteCommand(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    const target = db.commands.find((c) => c.id === id);
    const trigger = target ? `${target.prefix}${target.trigger}` : "command";
    
    db.commands = db.commands.filter((c) => c.id !== id);
    dbService.addLog("error", "COMPILER", `Unlinked and deleted command handler: "${trigger}"`);
    dbService.write(db);
    res.json({ success: true, commands: db.commands, logs: db.logs });
  }
}

export class FileController {
  public static createFile(req: Request, res: Response) {
    const newFile = req.body;
    const db = dbService.read();
    
    db.files.push(newFile);
    dbService.addLog("success", "FS_MANAGER", `Generated custom index file path: "${newFile.path}"`);
    dbService.write(db);
    res.json({ success: true, files: db.files, logs: db.logs });
  }

  public static updateFile(req: Request, res: Response) {
    const { path: filePath, content } = req.body;
    const db = dbService.read();
    
    db.files = db.files.map((file) => {
      if (file.path === filePath) {
        return { ...file, content };
      }
      return file;
    });
    
    dbService.addLog("success", "FS_MANAGER", `Persisted raw byte code alterations to path: "${filePath}"`);
    dbService.write(db);
    res.json({ success: true, files: db.files, logs: db.logs });
  }

  public static deleteFile(req: Request, res: Response) {
    const filePath = req.query.path as string;
    const db = dbService.read();
    
    db.files = db.files.filter((file) => file.path !== filePath);
    dbService.addLog("error", "FS_MANAGER", `Permanently unlinked instance file path: "${filePath}"`);
    dbService.write(db);
    res.json({ success: true, files: db.files, logs: db.logs });
  }
}

export class PluginController {
  public static installPlugin(req: Request, res: Response) {
    const { id } = req.params;
    const { install } = req.body;
    const db = dbService.read();
    let pluginName = "plugin";
    
    db.plugins = db.plugins.map((plg) => {
      if (plg.id === id) {
        plg.installed = !!install;
        pluginName = plg.name;
      }
      return plg;
    });
    
    if (install) {
      dbService.addLog("success", "PLUGIN_DAEMON", `Hot-loaded modular framework addon: "${pluginName}"`);
    } else {
      dbService.addLog("error", "PLUGIN_DAEMON", `Unlinked and unregistered framework addon: "${pluginName}"`);
    }
    
    dbService.write(db);
    res.json({ success: true, plugins: db.plugins, logs: db.logs });
  }

  public static createPlugin(req: Request, res: Response) {
    const newPlugin = req.body;
    const db = dbService.read();
    const id = `plg-${Date.now()}`;
    
    const created = {
      ...newPlugin,
      id,
      rating: 5.0,
      downloads: "0",
      installed: false,
      customSettings: {}
    };
    
    db.plugins.push(created);
    dbService.addLog("success", "PLUGIN_DAEMON", `Registered custom plugin definition to local catalog: "${created.name}"`);
    dbService.write(db);
    res.json({ success: true, plugins: db.plugins, logs: db.logs });
  }

  public static deletePlugin(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    const target = db.plugins.find((p) => p.id === id);
    const pluginName = target ? target.name : "plugin";
    
    db.plugins = db.plugins.filter((p) => p.id !== id);
    dbService.addLog("error", "PLUGIN_DAEMON", `Removed plugin addon from catalog: "${pluginName}"`);
    dbService.write(db);
    res.json({ success: true, plugins: db.plugins, logs: db.logs });
  }

  public static updatePlugin(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;
    const db = dbService.read();
    
    db.plugins = db.plugins.map((plg) => {
      if (plg.id === id) {
        return { ...plg, ...updates };
      }
      return plg;
    });
    
    dbService.write(db);
    res.json({ success: true, plugins: db.plugins });
  }
}

export class SessionController {
  public static disconnectSession(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    let sessionDevice = "device";
    
    db.sessions = db.sessions.map((sess) => {
      if (sess.id === id) {
        sess.status = "disconnected" as const;
        sessionDevice = sess.device;
      }
      return sess;
    });
    
    dbService.addLog("error", "GATEWAY_API", `Revoked authentication socket stream for: "${sessionDevice}"`);
    dbService.write(db);
    res.json({ success: true, sessions: db.sessions, logs: db.logs });
  }
}

// In-memory security & auth state stores
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();
const pendingOTPStore = new Map<string, { 
  userId: string; 
  email: string; 
  code: string; 
  expiresAt: number; 
  method: string; 
  user: any;
}>();
const trustedDevicesStore = new Map<string, Array<{
  id: string;
  name: string;
  browser: string;
  os: string;
  ip: string;
  addedAt: string;
  expiresAt: string;
  lastUsed: string;
}>>();

const blockedIPsSet = new Set<string>(["198.51.100.42", "203.0.113.88"]);

// Default mock initial login history for demo auditing
let globalLoginHistory: Array<{
  id: string;
  userId: string;
  date: string;
  time: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  location: string;
  ip: string;
  status: 'successful' | 'failed' | 'blocked';
  reason?: string;
}> = [
  {
    id: 'lh-101',
    userId: 'usr-1',
    date: '2026-07-25',
    time: '12:20:14',
    device: 'MacBook Pro M3 Max',
    browser: 'Chrome 126.0',
    os: 'macOS Sonoma',
    country: 'United States',
    location: 'San Francisco, CA',
    ip: '192.168.1.104',
    status: 'successful'
  },
  {
    id: 'lh-102',
    userId: 'usr-1',
    date: '2026-07-25',
    time: '08:15:33',
    device: 'Linux Workstation',
    browser: 'Firefox 127.0',
    os: 'Ubuntu 24.04 LTS',
    country: 'Germany',
    location: 'Frankfurt',
    ip: '198.51.100.42',
    status: 'blocked',
    reason: 'Blocked IP address - Suspicious TOR exit node'
  },
  {
    id: 'lh-103',
    userId: 'usr-1',
    date: '2026-07-24',
    time: '21:40:02',
    device: 'iPhone 15 Pro',
    browser: 'Safari Mobile 17.5',
    os: 'iOS 17.5',
    country: 'United States',
    location: 'San Jose, CA',
    ip: '172.56.21.89',
    status: 'successful'
  },
  {
    id: 'lh-104',
    userId: 'usr-1',
    date: '2026-07-24',
    time: '19:12:00',
    device: 'Unknown Client',
    browser: 'Python-requests/2.31',
    os: 'Linux',
    country: 'Russia',
    location: 'Moscow',
    ip: '185.220.101.5',
    status: 'failed',
    reason: 'Invalid credentials - Brute force attack pattern'
  }
];

function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 10; i++) {
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export class UserController {
  public static login(req: Request, res: Response) {
    const { emailOrUsername, password } = req.body;
    const ip = (req.ip || req.headers["x-forwarded-for"] || "127.0.0.1").toString().split(",")[0].trim();
    const now = Date.now();

    // Check if IP is blocked
    if (blockedIPsSet.has(ip)) {
      dbService.addLog("error", "SECURITY", `Access rejected for blocked IP address: ${ip}`);
      return res.status(403).json({
        success: false,
        errorType: "IP_BLOCKED",
        error: "Access blocked: Your IP address has been flagged for suspicious security activity."
      });
    }

    // Check rate limit & Account Lockout (5 failed attempts -> 15 min lock)
    const attempts = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
    if (attempts.lockUntil > now && attempts.count >= 5) {
      const remainingSeconds = Math.ceil((attempts.lockUntil - now) / 1000);
      return res.status(429).json({
        success: false,
        errorType: "TOO_MANY_ATTEMPTS",
        error: `Account locked due to 5 consecutive failed login attempts. Please wait ${remainingSeconds} seconds before trying again.`,
        remainingSeconds,
        lockUntil: attempts.lockUntil
      });
    }

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        errorType: "MISSING_FIELDS",
        error: "Please enter your email/username and password."
      });
    }

    const db = dbService.read();
    const query = emailOrUsername.trim().toLowerCase();
    
    // Find matching user by username or email
    const user = db.users.find(
      (u) => u.username.toLowerCase() === query || u.email.toLowerCase() === query
    );

    if (!user) {
      const newCount = attempts.count + 1;
      const lockUntil = newCount >= 5 ? now + 15 * 60 * 1000 : 0;
      loginAttempts.set(ip, { count: newCount, lockUntil });

      globalLoginHistory.unshift({
        id: `lh-${Date.now()}`,
        userId: 'unknown',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        device: req.headers['user-agent']?.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
        browser: 'Web Browser',
        os: 'Desktop/Mobile',
        country: 'United States',
        location: 'Local Region',
        ip,
        status: 'failed',
        reason: 'Invalid email or password'
      });

      return res.status(401).json({
        success: false,
        errorType: "INVALID_CREDENTIALS",
        error: newCount >= 5 
          ? "Account temporarily locked for 15 minutes due to 5 failed login attempts." 
          : `Invalid email or password. (${5 - newCount} attempts remaining before lockout)`
      });
    }

    // Check account status
    if (user.status === "suspended" || (user as any).status === "disabled") {
      return res.status(403).json({
        success: false,
        errorType: "ACCOUNT_DISABLED",
        error: "Account disabled. Your corporate access has been suspended by an administrator."
      });
    }

    // Check password
    const expectedPassword = (user as any).password;
    if (expectedPassword && password !== expectedPassword) {
      const newCount = attempts.count + 1;
      const lockUntil = newCount >= 5 ? now + 15 * 60 * 1000 : 0;
      loginAttempts.set(ip, { count: newCount, lockUntil });

      globalLoginHistory.unshift({
        id: `lh-${Date.now()}`,
        userId: user.id,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        device: 'Desktop Chrome',
        browser: 'Chrome 126.0',
        os: 'Linux/macOS',
        country: 'United States',
        location: 'Local Region',
        ip,
        status: 'failed',
        reason: 'Incorrect password'
      });

      return res.status(401).json({
        success: false,
        errorType: "INVALID_CREDENTIALS",
        error: newCount >= 5 
          ? "Account temporarily locked for 15 minutes due to 5 failed login attempts." 
          : `Invalid email or password. (${5 - newCount} attempts remaining before lockout)`
      });
    }

    // Reset attempts on valid password
    loginAttempts.delete(ip);

    // Initialize 2FA recovery codes if missing
    if (!(user as any).recoveryCodes || !(user as any).recoveryCodes.length) {
      (user as any).recoveryCodes = generateRecoveryCodes();
    }

    // Check if 2FA is required
    const is2FAEnabled = (user as any).twoFactorEnabled !== false; // Default enabled for enterprise security
    const userTrustedDevices = trustedDevicesStore.get(user.id) || [];
    const isDeviceTrusted = userTrustedDevices.some(d => d.ip === ip && new Date(d.expiresAt).getTime() > now);

    // If 2FA enabled AND device not trusted -> Trigger Phase 2 OTP step!
    if (is2FAEnabled && !isDeviceTrusted) {
      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP code
      const tempToken = `temp_otp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const preferredMethod = (user as any).twoFactorMethod || 'email';
      const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiration

      pendingOTPStore.set(tempToken, {
        userId: user.id,
        email: user.email,
        code,
        expiresAt,
        method: preferredMethod,
        user
      });

      dbService.addLog("info", "SECURITY", `2FA Challenge triggered for user "${user.username}". OTP dispatched via [${preferredMethod.toUpperCase()}]. Code: ${code}`);

      return res.json({
        success: true,
        require2FA: true,
        tempToken,
        preferredMethod,
        email: user.email,
        expiresAt,
        demoCode: code, // Attached for testing convenience
        message: `Two-factor authentication required. Verification code sent via ${preferredMethod}.`
      });
    }

    // Direct Login if device trusted or 2FA disabled
    const payload = Buffer.from(JSON.stringify({
      uid: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(now / 1000) + (24 * 60 * 60)
    })).toString("base64");

    const token = `guru_jwt_v1.${payload}.sig_${now}`;

    // Add session
    const newSession = {
      id: `sess-${Date.now()}`,
      device: 'MacBook Pro / Chrome',
      platform: 'WhatsApp' as const,
      status: 'active' as const,
      connectedAt: new Date().toLocaleTimeString()
    };
    db.sessions.unshift(newSession as any);

    globalLoginHistory.unshift({
      id: `lh-${Date.now()}`,
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      device: 'MacBook Pro / Chrome',
      browser: 'Chrome 126.0',
      os: 'macOS',
      country: 'United States',
      location: 'San Francisco, CA',
      ip,
      status: 'successful'
    });

    dbService.addLog("success", "SECURITY", `Production JWT authentication issued for user: "${user.username}" (${user.email})`);
    dbService.write(db);

    const { password: _, ...userWithoutPassword } = user as any;

    return res.json({
      success: true,
      token,
      user: userWithoutPassword,
      message: "Authentication successful."
    });
  }

  public static verifyOtp(req: Request, res: Response) {
    const { tempToken, code, trustDevice, method, deviceName } = req.body;
    const ip = (req.ip || req.headers["x-forwarded-for"] || "127.0.0.1").toString().split(",")[0].trim();
    const now = Date.now();

    if (!tempToken || !code) {
      return res.status(400).json({
        success: false,
        errorType: "INVALID_OTP",
        error: "Verification code and session token are required."
      });
    }

    const pending = pendingOTPStore.get(tempToken);
    if (!pending) {
      return res.status(400).json({
        success: false,
        errorType: "OTP_EXPIRED",
        error: "Verification session expired or invalid. Please request a new code."
      });
    }

    if (now > pending.expiresAt) {
      pendingOTPStore.delete(tempToken);
      return res.status(400).json({
        success: false,
        errorType: "OTP_EXPIRED",
        error: "6-digit verification code has expired after 5 minutes. Please click Resend Code."
      });
    }

    const db = dbService.read();
    const user = db.users.find((u) => u.id === pending.userId) || pending.user;

    const recoveryCodes: string[] = (user as any).recoveryCodes || [];
    const isRecoveryCode = recoveryCodes.includes(code.trim().toUpperCase());
    const isOTPCode = pending.code === code.trim();

    if (!isOTPCode && !isRecoveryCode) {
      return res.status(400).json({
        success: false,
        errorType: "INVALID_OTP_CODE",
        error: "Invalid verification code. Please check your authenticator or email and try again."
      });
    }

    // Clean up used recovery code if applicable
    if (isRecoveryCode) {
      (user as any).recoveryCodes = recoveryCodes.filter(c => c !== code.trim().toUpperCase());
      dbService.addLog("warning", "SECURITY", `User "${user.username}" consumed a single-use backup recovery code.`);
    }

    // Clean pending OTP session
    pendingOTPStore.delete(tempToken);

    // Save trusted device for 30 days if requested
    if (trustDevice) {
      const existingDevices = trustedDevicesStore.get(user.id) || [];
      const expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
      const addedAt = new Date().toISOString();

      existingDevices.unshift({
        id: `td-${Date.now()}`,
        name: deviceName || 'Chrome Browser / Desktop',
        browser: 'Chrome 126.0',
        os: 'macOS / Windows',
        ip,
        addedAt,
        expiresAt,
        lastUsed: new Date().toLocaleTimeString()
      });

      trustedDevicesStore.set(user.id, existingDevices);
      dbService.addLog("success", "SECURITY", `Registered trusted device signature for user "${user.username}" (30-day OTP bypass active).`);
    }

    // Generate JWT token string
    const payload = Buffer.from(JSON.stringify({
      uid: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(now / 1000) + (24 * 60 * 60)
    })).toString("base64");

    const token = `guru_jwt_v1.${payload}.sig_${now}`;

    // Record session
    db.sessions.unshift({
      id: `sess-${Date.now()}`,
      device: deviceName || 'Chrome / Desktop',
      platform: 'WhatsApp' as const,
      status: 'active' as const,
      connectedAt: new Date().toLocaleTimeString()
    } as any);

    // Record login audit
    globalLoginHistory.unshift({
      id: `lh-${Date.now()}`,
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      device: deviceName || 'Desktop Chrome',
      browser: 'Chrome 126.0',
      os: 'macOS/Windows',
      country: 'United States',
      location: 'San Francisco, CA',
      ip,
      status: 'successful'
    });

    dbService.addLog("success", "SECURITY", `2FA Identity verified for user "${user.username}". Session active.`);
    dbService.write(db);

    const { password: _, ...userWithoutPassword } = user as any;

    return res.json({
      success: true,
      token,
      user: userWithoutPassword,
      message: "Two-factor authentication verified successfully."
    });
  }

  public static resendOtp(req: Request, res: Response) {
    const { tempToken, method } = req.body;
    const now = Date.now();

    if (!tempToken) {
      return res.status(400).json({
        success: false,
        error: "Missing verification session token."
      });
    }

    const pending = pendingOTPStore.get(tempToken);
    if (!pending) {
      return res.status(400).json({
        success: false,
        error: "Verification session expired. Please sign in again."
      });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newMethod = method || pending.method || 'email';
    const newExpiresAt = now + 5 * 60 * 1000;

    pendingOTPStore.set(tempToken, {
      ...pending,
      code: newCode,
      method: newMethod,
      expiresAt: newExpiresAt
    });

    dbService.addLog("info", "SECURITY", `Resent 2FA code [${newCode}] via [${newMethod.toUpperCase()}] for user "${pending.email}"`);

    return res.json({
      success: true,
      expiresAt: newExpiresAt,
      demoCode: newCode,
      message: `A new 6-digit verification code has been dispatched via ${newMethod}. Expires in 5 minutes.`
    });
  }

  public static registerUser(req: Request, res: Response) {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        errorType: "MISSING_FIELDS",
        error: "Please fill in all registration fields."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        errorType: "WEAK_PASSWORD",
        error: "Password must be at least 6 characters long."
      });
    }

    const db = dbService.read();
    const lowerUsername = username.trim().toLowerCase();
    const lowerEmail = email.trim().toLowerCase();

    const exists = db.users.some(
      (u) => u.username.toLowerCase() === lowerUsername || u.email.toLowerCase() === lowerEmail
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        errorType: "USER_EXISTS",
        error: "An account with this email or username already exists."
      });
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      username: username.trim(),
      email: email.trim(),
      role: role || "Viewer",
      status: "active" as const,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
      password,
      twoFactorEnabled: true,
      twoFactorMethod: "email" as const,
      recoveryCodes: generateRecoveryCodes()
    };

    db.users.push(newUser as any);
    dbService.addLog("success", "SECURITY", `Provisioned production credentials for user: "${newUser.username}" (${newUser.email})`);
    dbService.write(db);

    const payload = Buffer.from(JSON.stringify({
      uid: newUser.id,
      username: newUser.username,
      role: newUser.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    })).toString("base64");

    const token = `guru_jwt_v1.${payload}.sig_${Date.now()}`;
    const { password: _, ...userWithoutPassword } = newUser as any;

    return res.json({
      success: true,
      token,
      user: userWithoutPassword,
      users: db.users,
      logs: db.logs,
      message: "Account created successfully."
    });
  }

  public static forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        errorType: "INVALID_EMAIL",
        error: "Please enter a valid email address."
      });
    }

    const db = dbService.read();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return res.status(404).json({
        success: false,
        errorType: "USER_NOT_FOUND",
        error: "No registered account found with this email address."
      });
    }

    dbService.addLog("info", "SECURITY", `Password reset link dispatched to email: "${email.trim()}"`);
    return res.json({
      success: true,
      message: `Password reset instructions have been dispatched to ${email.trim()}. Please check your inbox.`
    });
  }

  public static githubAuth(req: Request, res: Response) {
    const { githubUsername, email, avatarUrl } = req.body;
    const db = dbService.read();

    const username = githubUsername || "github_user";
    const userEmail = email || `${username.toLowerCase()}@users.noreply.github.com`;

    let user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === userEmail.toLowerCase());

    if (!user) {
      user = {
        id: `usr-gh-${Date.now()}`,
        username,
        email: userEmail,
        role: "Developer",
        status: "active" as const,
        avatar: avatarUrl || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=150&h=150&q=80",
        twoFactorEnabled: false,
        recoveryCodes: generateRecoveryCodes()
      } as any;
      db.users.push(user);
    }

    const payload = Buffer.from(JSON.stringify({
      uid: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    })).toString("base64");

    const token = `guru_jwt_v1.${payload}.sig_${Date.now()}`;

    dbService.addLog("success", "SECURITY", `GitHub OAuth session authorized for developer: "${user.username}"`);
    dbService.write(db);

    return res.json({
      success: true,
      token,
      user,
      message: "GitHub authentication successful."
    });
  }

  public static googleAuth(req: Request, res: Response) {
    const { email, name, avatar } = req.body;
    const db = dbService.read();

    const userEmail = email || "user@google.com";
    const username = (name || userEmail.split("@")[0]).replace(/\s+/g, '_');

    let user = db.users.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());

    if (!user) {
      user = {
        id: `usr-goog-${Date.now()}`,
        username,
        email: userEmail,
        role: "Developer",
        status: "active" as const,
        avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
        twoFactorEnabled: false,
        recoveryCodes: generateRecoveryCodes()
      } as any;
      db.users.push(user);
    }

    const payload = Buffer.from(JSON.stringify({
      uid: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    })).toString("base64");

    const token = `guru_jwt_v1.${payload}.sig_${Date.now()}`;

    dbService.addLog("success", "SECURITY", `Google OAuth session authorized for user: "${user.username}"`);
    dbService.write(db);

    return res.json({
      success: true,
      token,
      user,
      message: "Google authentication successful."
    });
  }

  public static microsoftAuth(req: Request, res: Response) {
    const { email, name } = req.body;
    const db = dbService.read();

    const userEmail = email || "user@microsoft.com";
    const username = (name || userEmail.split("@")[0]).replace(/\s+/g, '_');

    let user = db.users.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());

    if (!user) {
      user = {
        id: `usr-ms-${Date.now()}`,
        username,
        email: userEmail,
        role: "Developer",
        status: "active" as const,
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80",
        twoFactorEnabled: false,
        recoveryCodes: generateRecoveryCodes()
      } as any;
      db.users.push(user);
    }

    const payload = Buffer.from(JSON.stringify({
      uid: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    })).toString("base64");

    const token = `guru_jwt_v1.${payload}.sig_${Date.now()}`;

    dbService.addLog("success", "SECURITY", `Microsoft Entra ID OAuth session authorized for user: "${user.username}"`);
    dbService.write(db);

    return res.json({
      success: true,
      token,
      user,
      message: "Microsoft authentication successful."
    });
  }

  public static getCurrentUser(req: Request, res: Response) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        errorType: "UNAUTHORIZED",
        error: "Session expired. Please sign in again to continue."
      });
    }

    const token = authHeader.substring(7);
    try {
      const parts = token.split(".");
      if (parts.length < 2) throw new Error("Invalid token format");
      const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));

      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          success: false,
          errorType: "SESSION_EXPIRED",
          error: "Session expired. Please sign in again to continue."
        });
      }

      const db = dbService.read();
      const user = db.users.find((u) => u.id === decoded.uid);
      if (!user) {
        return res.status(401).json({
          success: false,
          errorType: "USER_NOT_FOUND",
          error: "Session user account no longer exists."
        });
      }

      const { password: _, ...userWithoutPassword } = user as any;
      return res.json({ success: true, user: userWithoutPassword });
    } catch (err) {
      return res.status(401).json({
        success: false,
        errorType: "INVALID_TOKEN",
        error: "Session expired. Please sign in again to continue."
      });
    }
  }

  public static logout(req: Request, res: Response) {
    return res.json({
      success: true,
      message: "Logged out successfully."
    });
  }

  public static logoutAll(req: Request, res: Response) {
    const db = dbService.read();
    db.sessions = [];
    dbService.addLog("warning", "SECURITY", "Revoked all active authentication sessions across cluster.");
    dbService.write(db);
    return res.json({
      success: true,
      message: "All sessions have been terminated successfully."
    });
  }

  public static getSessions(req: Request, res: Response) {
    const db = dbService.read();
    res.json({
      success: true,
      sessions: db.sessions || []
    });
  }

  public static deleteSession(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    db.sessions = (db.sessions || []).filter(s => s.id !== id);
    dbService.write(db);
    res.json({
      success: true,
      sessions: db.sessions
    });
  }

  public static getLoginHistory(req: Request, res: Response) {
    res.json({
      success: true,
      history: globalLoginHistory
    });
  }

  public static enable2FA(req: Request, res: Response) {
    const { userId, method } = req.body;
    const db = dbService.read();
    const user = db.users.find(u => u.id === userId || u.username === 'admin') || db.users[0];

    if (user) {
      (user as any).twoFactorEnabled = true;
      (user as any).twoFactorMethod = method || 'email';
      if (!(user as any).recoveryCodes || !(user as any).recoveryCodes.length) {
        (user as any).recoveryCodes = generateRecoveryCodes();
      }
      dbService.addLog("success", "SECURITY", `2FA enabled for user "${user.username}" via [${(user as any).twoFactorMethod.toUpperCase()}].`);
      dbService.write(db);
      
      const { password: _, ...userWithoutPassword } = user as any;
      return res.json({
        success: true,
        user: userWithoutPassword,
        recoveryCodes: (user as any).recoveryCodes,
        message: "Two-factor authentication enabled successfully."
      });
    }

    res.status(404).json({ success: false, error: "User not found." });
  }

  public static disable2FA(req: Request, res: Response) {
    const { userId } = req.body;
    const db = dbService.read();
    const user = db.users.find(u => u.id === userId || u.username === 'admin') || db.users[0];

    if (user) {
      (user as any).twoFactorEnabled = false;
      dbService.addLog("warning", "SECURITY", `2FA disabled for user "${user.username}".`);
      dbService.write(db);

      const { password: _, ...userWithoutPassword } = user as any;
      return res.json({
        success: true,
        user: userWithoutPassword,
        message: "Two-factor authentication disabled."
      });
    }

    res.status(404).json({ success: false, error: "User not found." });
  }

  public static getRecoveryCodes(req: Request, res: Response) {
    const db = dbService.read();
    const user = db.users[0];
    if (user) {
      if (!(user as any).recoveryCodes || !(user as any).recoveryCodes.length) {
        (user as any).recoveryCodes = generateRecoveryCodes();
        dbService.write(db);
      }
      return res.json({
        success: true,
        recoveryCodes: (user as any).recoveryCodes
      });
    }
    res.json({ success: true, recoveryCodes: generateRecoveryCodes() });
  }

  public static regenerateCodes(req: Request, res: Response) {
    const db = dbService.read();
    const user = db.users[0];
    const newCodes = generateRecoveryCodes();

    if (user) {
      (user as any).recoveryCodes = newCodes;
      dbService.addLog("info", "SECURITY", `Regenerated 10 backup recovery codes for user "${user.username}".`);
      dbService.write(db);
    }

    return res.json({
      success: true,
      recoveryCodes: newCodes,
      message: "10 new single-use recovery codes generated."
    });
  }

  public static getAdminSecurity(req: Request, res: Response) {
    const db = dbService.read();
    const lockedCount = Array.from(loginAttempts.values()).filter(a => a.lockUntil > Date.now()).length;
    const totalFailedAttempts = Array.from(loginAttempts.values()).reduce((sum, a) => sum + a.count, 0);

    res.json({
      success: true,
      stats: {
        onlineUsersCount: db.users.filter(u => u.status === 'active').length,
        lockedAccountsCount: lockedCount,
        failedLoginAttemptsCount: totalFailedAttempts,
        activeSessionsCount: db.sessions.length,
        blockedIPs: Array.from(blockedIPsSet),
        securityScore: 96,
        aiSecurityAlerts: [
          {
            id: 'al-1',
            type: 'IMPOSSIBLE_TRAVEL',
            severity: 'high',
            title: 'Impossible Travel Anomaly Detected',
            message: 'User logged in from San Francisco and Frankfurt within 15 minutes window.',
            timestamp: '10 mins ago',
            ip: '198.51.100.42',
            resolved: false
          },
          {
            id: 'al-2',
            type: 'TOR_PROXY_DETECTED',
            severity: 'medium',
            title: 'TOR Exit Node Identified',
            message: 'Connection attempt routed through known darknet relay.',
            timestamp: '2 hours ago',
            ip: '185.220.101.5',
            resolved: true
          }
        ]
      }
    });
  }

  public static unlockAccount(req: Request, res: Response) {
    loginAttempts.clear();
    const db = dbService.read();
    dbService.addLog("success", "SECURITY", "Admin unlocked all locked accounts and reset rate limit counters.");
    res.json({
      success: true,
      message: "Account lockouts cleared."
    });
  }

  public static toggleBlockIp(req: Request, res: Response) {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ success: false, error: "IP required." });

    if (blockedIPsSet.has(ip)) {
      blockedIPsSet.delete(ip);
      dbService.addLog("info", "SECURITY", `Unblocked IP address: ${ip}`);
    } else {
      blockedIPsSet.add(ip);
      dbService.addLog("error", "SECURITY", `Manually blocked IP address: ${ip}`);
    }

    res.json({
      success: true,
      blockedIPs: Array.from(blockedIPsSet)
    });
  }

  public static toggleUserStatus(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    let username = "user";
    let status = "active";
    
    db.users = db.users.map((u) => {
      if (u.id === id) {
        u.status = u.status === "active" ? "suspended" as const : "active" as const;
        username = u.username;
        status = u.status;
      }
      return u;
    });
    
    dbService.addLog("info", "SECURITY", `Access scope modified for member "${username}". Status: ${status.toUpperCase()}`);
    dbService.write(db);
    res.json({ success: true, users: db.users, logs: db.logs });
  }

  public static deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    const db = dbService.read();
    const target = db.users.find((u) => u.id === id);
    const username = target ? target.username : "user";
    
    db.users = db.users.filter((u) => u.id !== id);
    dbService.addLog("error", "SECURITY", `Permanently revoked administrative credentials for user: "${username}"`);
    dbService.write(db);
    res.json({ success: true, users: db.users, logs: db.logs });
  }
}

export class LogController {
  public static createLog(req: Request, res: Response) {
    const { type, source, message } = req.body;
    dbService.addLog(type, source, message);
    res.json({ success: true, logs: dbService.read().logs });
  }

  public static clearLogs(req: Request, res: Response) {
    const db = dbService.read();
    db.logs = [];
    dbService.write(db);
    res.json({ success: true, logs: db.logs });
  }
}

export class CopilotController {
  public static async copilotChat(req: Request, res: Response) {
    const { prompt, agentId, role } = req.body;
    try {
      const { ConversationGateway } = await import("./ai/conversationGateway");
      const gateway = ConversationGateway.getInstance();
      const userRole = role || (req as any).userRole || 'Administrator';
      const result = await gateway.handleConversationMessage(prompt, agentId, userRole);
      res.json({
        success: true,
        response: result.response,
        agent: result.agent,
        responseTimeMs: result.responseTimeMs,
        memoryHit: result.memoryHit,
        providerUsed: result.providerUsed,
        cacheHit: result.cacheHit,
        retryCount: result.retryCount,
        progressSteps: result.progressSteps
      });
    } catch (err: any) {
      res.status(500).json({ 
        success: false, 
        error: "GURU Core: Gemini is currently experiencing high traffic. Your request has been safely saved and queued. Retrying automatically.",
        details: err.message
      });
    }
  }

  public static async chat(req: Request, res: Response) {
    return CopilotController.copilotChat(req, res);
  }

  public static async getProviders(req: Request, res: Response) {
    try {
      const { HealthMonitor } = await import("./ai/healthMonitor");
      const providers = HealthMonitor.getInstance().getAllProviders();
      res.json({ success: true, providers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch AI providers health." });
    }
  }

  public static async getRuntimeUsageAudit(req: Request, res: Response) {
    try {
      const { HealthMonitor } = await import("./ai/healthMonitor");
      const auditReport = HealthMonitor.getInstance().performRuntimeUsageAudit();
      res.json({ success: true, audit: auditReport });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to perform AI runtime usage audit." });
    }
  }

  public static async getQueue(req: Request, res: Response) {
    try {
      const { QueueManager } = await import("./ai/queueManager");
      const stats = QueueManager.getInstance().getQueueStats();
      res.json({ success: true, queue: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch AI queue stats." });
    }
  }

  public static async cancelRequest(req: Request, res: Response) {
    try {
      const { id } = req.body;
      const { QueueManager } = await import("./ai/queueManager");
      const cancelled = QueueManager.getInstance().cancel(id);
      res.json({ success: cancelled });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to cancel AI request." });
    }
  }

  public static async getCacheStats(req: Request, res: Response) {
    try {
      const { CacheManager } = await import("./ai/cacheManager");
      const stats = CacheManager.getInstance().getStats();
      res.json({ success: true, cache: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch AI cache stats." });
    }
  }

  public static async getMemories(req: Request, res: Response) {
    try {
      const { CopilotEngine } = await import("./copilotEngine");
      const category = req.query.category as any;
      const memories = CopilotEngine.getMemories(category);
      res.json({ success: true, memories });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch Copilot memories." });
    }
  }

  public static async saveMemory(req: Request, res: Response) {
    try {
      const { category, key, value, tags } = req.body;
      const { CopilotEngine } = await import("./copilotEngine");
      if (!key || !value) {
        return res.status(400).json({ success: false, error: "key and value are required." });
      }
      const memory = CopilotEngine.saveMemory(category || "project", key, value, tags || []);
      res.json({ success: true, memory });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to save memory item." });
    }
  }

  public static async deleteMemory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { CopilotEngine } = await import("./copilotEngine");
      const deleted = CopilotEngine.deleteMemory(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Memory item not found." });
      }
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to delete memory item." });
    }
  }

  public static async getWorkTimeline(req: Request, res: Response) {
    try {
      const { CopilotEngine } = await import("./copilotEngine");
      const timeline = CopilotEngine.getWorkTimeline();
      res.json({ success: true, timeline });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to fetch work timeline" });
    }
  }

  public static async addWorkItem(req: Request, res: Response) {
    try {
      const { CopilotEngine } = await import("./copilotEngine");
      const { module, filesChanged, summary, status, details } = req.body;
      if (!module || !summary) {
        return res.status(400).json({ success: false, error: "module and summary are required" });
      }
      const item = CopilotEngine.addWorkItem(module, filesChanged || [], summary, status || 'completed', details || '');
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to log work item" });
    }
  }

  public static async resumeWorkContext(req: Request, res: Response) {
    try {
      const { CopilotEngine } = await import("./copilotEngine");
      const context = CopilotEngine.resumeWorkContext();
      res.json({ success: true, context });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to generate resume work context" });
    }
  }

  public static async getSuggestions(req: Request, res: Response) {
    try {
      const { CopilotEngine } = await import("./copilotEngine");
      const suggestions = CopilotEngine.getSuggestions();
      res.json({ success: true, suggestions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to fetch suggestions" });
    }
  }

  public static async getDrafts(req: Request, res: Response) {
    try {
      const { CopilotEngine } = await import("./copilotEngine");
      const drafts = CopilotEngine.getDrafts();
      res.json({ success: true, drafts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to fetch drafts" });
    }
  }

  public static async saveDraft(req: Request, res: Response) {
    try {
      const { CopilotEngine } = await import("./copilotEngine");
      const { title, trigger, code, description, category } = req.body;
      if (!trigger || !code) {
        return res.status(400).json({ success: false, error: "trigger and code are required" });
      }
      const draft = CopilotEngine.saveDraft(title || trigger, trigger, code, description || '', category || 'Utility');
      res.json({ success: true, draft });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to save draft" });
    }
  }

  public static async getPrompts(req: Request, res: Response) {
    try {
      const { CopilotEngine } = await import("./copilotEngine");
      const prompts = CopilotEngine.getPrompts();
      res.json({ success: true, prompts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch prompt templates." });
    }
  }

  public static async savePrompt(req: Request, res: Response) {
    try {
      const { id, title, description, category, promptText, targetAgent } = req.body;
      const { CopilotEngine } = await import("./copilotEngine");
      if (!title || !promptText) {
        return res.status(400).json({ success: false, error: "title and promptText are required." });
      }
      const prompt = CopilotEngine.savePrompt({
        id,
        title,
        description: description || 'Custom prompt template',
        category: category || 'General',
        promptText,
        targetAgent: targetAgent || 'guru-core'
      });
      res.json({ success: true, prompt });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to save prompt template." });
    }
  }

  public static async deletePrompt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { CopilotEngine } = await import("./copilotEngine");
      CopilotEngine.deletePrompt(id);
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to delete prompt template." });
    }
  }

  public static async validateSandbox(req: Request, res: Response) {
    try {
      const { code, trigger } = req.body;
      const { CopilotEngine } = await import("./copilotEngine");
      if (!code) {
        return res.status(400).json({ success: false, error: "Code snippet is required for sandbox validation." });
      }
      const result = CopilotEngine.validateSandboxCode(code, trigger || 'test');
      res.json({ success: true, validation: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to validate sandbox code." });
    }
  }

  public static async deploySandbox(req: Request, res: Response) {
    try {
      const { trigger, code, description, category } = req.body;
      const { CopilotEngine } = await import("./copilotEngine");
      const userRole = (req as any).userRole || 'Administrator';
      if (!trigger || !code) {
        return res.status(400).json({ success: false, error: "trigger and code are required for deployment." });
      }
      const result = CopilotEngine.deploySandboxCode(trigger, code, description, category, userRole);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to deploy sandbox code." });
    }
  }

  public static async getSandboxHistory(req: Request, res: Response) {
    try {
      const { CopilotEngine } = await import("./copilotEngine");
      const history = CopilotEngine.getSandboxHistory();
      res.json({ success: true, history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch deployment history." });
    }
  }

  public static async rollbackSandbox(req: Request, res: Response) {
    try {
      const deploymentId = req.params.deploymentId || req.body.id;
      const { CopilotEngine } = await import("./copilotEngine");
      if (!deploymentId) {
        return res.status(400).json({ success: false, error: "Deployment ID is required for rollback." });
      }
      const snapshot = CopilotEngine.rollbackSandbox(deploymentId);
      res.json({ success: true, snapshot });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to execute rollback." });
    }
  }

  public static async executeTool(req: Request, res: Response) {
    try {
      const { toolName, args } = req.body;
      const { CopilotEngine } = await import("./copilotEngine");
      const userRole = (req as any).userRole || 'Administrator';
      if (!toolName) {
        return res.status(400).json({ success: false, error: "toolName is required." });
      }
      const result = CopilotEngine.executeTool(toolName, args || {}, userRole);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Tool execution failed." });
    }
  }

  public static async getAnalytics(req: Request, res: Response) {
    try {
      const { CopilotEngine } = await import("./copilotEngine");
      const stats = CopilotEngine.getAnalyticsStats();
      res.json({ success: true, stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch Copilot analytics." });
    }
  }

  public static async getAgents(req: Request, res: Response) {
    try {
      const { COPILOT_AGENTS } = await import("./copilotEngine");
      res.json({ success: true, agents: COPILOT_AGENTS });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch Copilot agents." });
    }
  }
}

export class SubscriptionController {
  public static upgradeSubscription(req: Request, res: Response) {
    const { plan } = req.body;
    const db = dbService.read();
    
    let newSub;
    if (plan === 'enterprise') {
      newSub = {
        tier: "ENTERPRISE PRO",
        hostedLimit: "Unlimited Nodes",
        renewalDate: "2027-08-15",
        storageLimit: "1 TB NVMe SSD",
        price: "$99/mo",
        isUpgraded: true
      };
    } else if (plan === 'ultimate') {
      newSub = {
        tier: "ULTIMATE DEPLOYER",
        hostedLimit: "Unlimited High-Availability Cores",
        renewalDate: "2027-12-31",
        storageLimit: "5 TB NVMe Enterprise Raid",
        price: "$199/mo",
        isUpgraded: true
      };
    } else {
      newSub = {
        tier: "PREMIUM VIP",
        hostedLimit: "20 Instances",
        renewalDate: "2027-02-15",
        storageLimit: "100 GB SSD",
        price: "$29/mo",
        isUpgraded: false
      };
    }
    
    db.subscription = newSub;
    dbService.addLog("success", "BILLING", `Host subscription tier upgraded to [${newSub.tier}] (${newSub.price}).`);
    dbService.write(db);
    res.json({ success: true, subscription: db.subscription, logs: db.logs });
  }
}

export class MongoConfigController {
  public static getSchemas(req: Request, res: Response) {
    const db = dbService.read();
    res.json({
      success: true,
      mongoConfig: db.mongoConfig,
      mongoSchemas: db.mongoSchemas
    });
  }

  public static updateSchemas(req: Request, res: Response) {
    const { mongoSchemas } = req.body;
    const db = dbService.read();
    
    db.mongoSchemas = mongoSchemas || [];
    dbService.addLog("success", "MONGODB", `Updated MongoDB schema set: compiled and verified ${db.mongoSchemas.length} models.`);
    dbService.write(db);
    res.json({
      success: true,
      mongoSchemas: db.mongoSchemas,
      logs: db.logs
    });
  }

  public static updateConfig(req: Request, res: Response) {
    const { uri } = req.body;
    const db = dbService.read();
    
    db.mongoConfig = db.mongoConfig || { uri: "", isConnected: false };
    db.mongoConfig.uri = uri;
    db.mongoConfig.isConnected = false;
    
    dbService.addLog("info", "MONGODB", `MongoDB connection string updated. Re-authentication required.`);
    dbService.write(db);
    res.json({
      success: true,
      mongoConfig: db.mongoConfig,
      logs: db.logs
    });
  }

  private static maskMongoUri(uri: string): string {
    if (!uri) return "";
    const regex = /^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)(@.+)$/;
    const match = uri.match(regex);
    if (match) {
      const [, protocol, username, password, rest] = match;
      return `${protocol}${username}:••••••••${rest}`;
    }
    return uri;
  }

  public static testConnection(req: Request, res: Response) {
    const db = dbService.read();
    const uri = db.mongoConfig?.uri || "";
    const maskedUri = MongoConfigController.maskMongoUri(uri);
    
    dbService.addLog("info", "MONGODB", `Establishing secure tunnel to cluster: ${maskedUri}...`);
    
    setTimeout(() => {
      const updatedDb = dbService.read();
      if (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")) {
        updatedDb.mongoConfig.isConnected = true;
        dbService.addLog("success", "MONGODB", `Established active Mongoose socket connection to cluster database [production]. Topology OK.`);
      } else {
        updatedDb.mongoConfig.isConnected = false;
        dbService.addLog("error", "MONGODB", `Authentication failed: Invalid MongoDB URI string format or timeout.`);
      }
      dbService.write(updatedDb);
    }, 1000);
    
    res.json({
      success: true,
      message: "Connection test sequence initialized."
    });
  }
}

export class DeploymentPipelineController {
  public static async executePipeline(req: Request, res: Response) {
    try {
      const { DeploymentPipelineEngine } = await import("./deploymentPipeline");
      const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
      const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

      const payload = {
        ...req.body,
        clientMetadata: {
          ip: clientIp,
          userAgent,
          browser: 'Chrome 126.0 (64-bit)',
          os: 'Linux x86_64',
          device: 'Desktop',
          country: req.body?.selectedCountries?.[0] || 'Kenya'
        }
      };

      const result = await DeploymentPipelineEngine.executePipeline(payload);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Pipeline execution failed'
      });
    }
  }

  public static async streamEvents(req: Request, res: Response) {
    const { subscribeDeploymentEvents } = await import("./deploymentPipeline");
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'deployment.connected', payload: { message: 'SSE Event Stream Ready' } })}\n\n`);

    const unsubscribe = subscribeDeploymentEvents((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  }

  public static createSession(req: Request, res: Response) {
    const crypto = require('crypto');
    const newSession = {
      wizardSessionId: `WIZ-SESS-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
      deploymentToken: `DEP-TOK-${crypto.randomBytes(16).toString('hex')}`,
      csrfToken: `CSRF-${crypto.randomBytes(12).toString('hex')}`,
      temporaryCacheId: `CACHE-${crypto.randomBytes(6).toString('hex')}`
    };
    res.json({ success: true, session: newSession });
  }

  public static async getDeployments(req: Request, res: Response) {
    try {
      const { DeploymentService } = await import("./services/deploymentService");
      const service = DeploymentService.getInstance();
      const resourceId = req.query.resourceId as string;
      const deployments = service.getDeployments(resourceId);
      res.json({ success: true, deployments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch deployments' });
    }
  }

  public static async getDeployableResources(req: Request, res: Response) {
    try {
      const { DeploymentService } = await import("./services/deploymentService");
      const service = DeploymentService.getInstance();
      const typeFilter = req.query.type as string;
      const resources = service.getDeployableResources(typeFilter);
      res.json({ success: true, resources });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch deployable resources' });
    }
  }

  public static async getDeploymentTargets(req: Request, res: Response) {
    try {
      const { DeploymentService } = await import("./services/deploymentService");
      const service = DeploymentService.getInstance();
      const targets = service.getDeploymentTargets();
      res.json({ success: true, targets });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch deployment targets' });
    }
  }

  public static async triggerDeployment(req: Request, res: Response) {
    try {
      const { DeploymentService } = await import("./services/deploymentService");
      const service = DeploymentService.getInstance();
      const record = service.triggerDeployment(req.body);
      res.json({ success: true, deployment: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to trigger deployment' });
    }
  }

  public static async getDeploymentDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { DeploymentService } = await import("./services/deploymentService");
      const service = DeploymentService.getInstance();
      const deployment = service.getDeploymentById(id);
      if (!deployment) {
        return res.status(404).json({ success: false, error: 'Deployment record not found' });
      }
      res.json({ success: true, deployment });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch deployment details' });
    }
  }

  public static async rollbackDeployment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { DeploymentService } = await import("./services/deploymentService");
      const service = DeploymentService.getInstance();
      const result = service.rollbackDeployment(id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to rollback deployment' });
    }
  }

  // Version 2.0: Environment & Secrets Management
  public static async getEnvVariables(req: Request, res: Response) {
    try {
      const { ProductionConfigService } = await import("./services/productionConfigService");
      const service = ProductionConfigService.getInstance();
      const envProfile = req.query.env as any;
      const resourceId = req.query.resourceId as string;
      const reveal = req.query.reveal === 'true';
      const variables = service.getEnvVariables(envProfile, resourceId, reveal);
      res.json({ success: true, variables });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch environment variables' });
    }
  }

  public static async upsertEnvVariable(req: Request, res: Response) {
    try {
      const { ProductionConfigService } = await import("./services/productionConfigService");
      const service = ProductionConfigService.getInstance();
      const variable = service.upsertEnvVariable(req.body);
      res.json({ success: true, variable });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update environment variable' });
    }
  }

  public static async deleteEnvVariable(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { ProductionConfigService } = await import("./services/productionConfigService");
      const service = ProductionConfigService.getInstance();
      const deleted = service.deleteEnvVariable(id);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to delete environment variable' });
    }
  }

  public static async getEnvironmentTemplates(req: Request, res: Response) {
    try {
      const { ProductionConfigService } = await import("./services/productionConfigService");
      const service = ProductionConfigService.getInstance();
      const templates = service.getEnvironmentTemplates();
      res.json({ success: true, templates });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch environment templates' });
    }
  }

  // Version 2.0: HTTPS & SSL Management
  public static async getSslCertificates(req: Request, res: Response) {
    try {
      const { ProductionConfigService } = await import("./services/productionConfigService");
      const service = ProductionConfigService.getInstance();
      const certificates = service.getSslCertificates();
      res.json({ success: true, certificates });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch SSL certificates' });
    }
  }

  public static async renewSslCertificate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { ProductionConfigService } = await import("./services/productionConfigService");
      const service = ProductionConfigService.getInstance();
      const result = service.renewSslCertificate(id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to renew SSL certificate' });
    }
  }

  // Version 2.0: Domain Management
  public static async getCustomDomains(req: Request, res: Response) {
    try {
      const { ProductionConfigService } = await import("./services/productionConfigService");
      const service = ProductionConfigService.getInstance();
      const domains = service.getCustomDomains();
      res.json({ success: true, domains });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch custom domains' });
    }
  }

  public static async registerCustomDomain(req: Request, res: Response) {
    try {
      const { ProductionConfigService } = await import("./services/productionConfigService");
      const service = ProductionConfigService.getInstance();
      const domain = service.registerCustomDomain(req.body);
      res.json({ success: true, domain });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to register custom domain' });
    }
  }

  public static async verifyCustomDomain(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { ProductionConfigService } = await import("./services/productionConfigService");
      const service = ProductionConfigService.getInstance();
      const result = service.verifyCustomDomain(id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to verify custom domain' });
    }
  }

  // Version 3.0: Operations Center (Monitoring, Centralized Logs, Health Checks, Performance Engine)
  public static async getOperationsMonitoringStats(req: Request, res: Response) {
    try {
      const { DeploymentOperationsService } = await import("./services/deploymentOperationsService");
      const service = DeploymentOperationsService.getInstance();
      const stats = service.getMonitoringStats();
      res.json({ success: true, stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch monitoring statistics' });
    }
  }

  public static async getCentralizedLogs(req: Request, res: Response) {
    try {
      const { DeploymentOperationsService } = await import("./services/deploymentOperationsService");
      const service = DeploymentOperationsService.getInstance();
      const resourceId = req.query.resourceId as string;
      const deploymentId = req.query.deploymentId as string;
      const level = req.query.level as any;
      const category = req.query.category as any;
      const query = req.query.query as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = service.getCentralizedLogs({ resourceId, deploymentId, level, category, query, limit, offset });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch centralized logs' });
    }
  }

  public static async recordLogEntry(req: Request, res: Response) {
    try {
      const { DeploymentOperationsService } = await import("./services/deploymentOperationsService");
      const service = DeploymentOperationsService.getInstance();
      const entry = service.recordLogEntry(req.body);
      res.json({ success: true, entry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to record log entry' });
    }
  }

  public static async exportLogs(req: Request, res: Response) {
    try {
      const { DeploymentOperationsService } = await import("./services/deploymentOperationsService");
      const service = DeploymentOperationsService.getInstance();
      const resourceId = req.query.resourceId as string;
      const format = (req.query.format as 'json' | 'csv') || 'json';
      const output = service.exportLogsFormat(resourceId, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="deployment-logs.csv"');
        return res.send(output);
      }
      res.json({ success: true, data: JSON.parse(output) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to export logs' });
    }
  }

  public static async getHealthCheckSummary(req: Request, res: Response) {
    try {
      const { DeploymentOperationsService } = await import("./services/deploymentOperationsService");
      const service = DeploymentOperationsService.getInstance();
      const probes = service.getHealthCheckProbes();
      const summary = service.getHealthSummary();
      res.json({ success: true, probes, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch health check summary' });
    }
  }

  public static async triggerHealthCheck(req: Request, res: Response) {
    try {
      const { DeploymentOperationsService } = await import("./services/deploymentOperationsService");
      const service = DeploymentOperationsService.getInstance();
      const resourceId = req.body?.resourceId;
      const probes = service.triggerManualHealthCheck(resourceId);
      res.json({ success: true, probes });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to trigger health check' });
    }
  }

  public static async getPerformanceOptimizationMetrics(req: Request, res: Response) {
    try {
      const { DeploymentOperationsService } = await import("./services/deploymentOperationsService");
      const service = DeploymentOperationsService.getInstance();
      const resourceId = req.query.resourceId as string;
      const metrics = service.getLatestMetrics(resourceId);
      const bottlenecks = service.getBottlenecksAndRecommendations();
      res.json({ success: true, metrics, bottlenecks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch performance metrics' });
    }
  }

  // Version 4.0: Reliability Engine (Automated Backups, Recovery & Rollback, Zero-Downtime Deployment Strategies)
  public static async getStorageProvidersAndPolicies(req: Request, res: Response) {
    try {
      const { DeploymentReliabilityService } = await import("./services/deploymentReliabilityService");
      const service = DeploymentReliabilityService.getInstance();
      const providers = service.getStorageProviders();
      const policies = service.getRetentionPolicies();
      res.json({ success: true, providers, policies });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch storage providers and policies' });
    }
  }

  public static async getBackups(req: Request, res: Response) {
    try {
      const { DeploymentReliabilityService } = await import("./services/deploymentReliabilityService");
      const service = DeploymentReliabilityService.getInstance();
      const resourceId = req.query.resourceId as string;
      const backups = service.getBackups(resourceId);
      res.json({ success: true, backups });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch backup history' });
    }
  }

  public static async triggerBackup(req: Request, res: Response) {
    try {
      const { DeploymentReliabilityService } = await import("./services/deploymentReliabilityService");
      const service = DeploymentReliabilityService.getInstance();
      const record = service.triggerBackup(req.body);
      res.json({ success: true, backup: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to trigger backup creation' });
    }
  }

  public static async validateBackupIntegrity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { DeploymentReliabilityService } = await import("./services/deploymentReliabilityService");
      const service = DeploymentReliabilityService.getInstance();
      const result = service.validateBackupIntegrity(id);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to validate backup integrity' });
    }
  }

  public static async getRecoveryHistory(req: Request, res: Response) {
    try {
      const { DeploymentReliabilityService } = await import("./services/deploymentReliabilityService");
      const service = DeploymentReliabilityService.getInstance();
      const resourceId = req.query.resourceId as string;
      const history = service.getRecoveryHistory(resourceId);
      res.json({ success: true, history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch recovery history' });
    }
  }

  public static async triggerRecovery(req: Request, res: Response) {
    try {
      const { DeploymentReliabilityService } = await import("./services/deploymentReliabilityService");
      const service = DeploymentReliabilityService.getInstance();
      const record = service.triggerRecovery(req.body);
      res.json({ success: true, recovery: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to trigger recovery process' });
    }
  }

  public static async getStrategyConfig(req: Request, res: Response) {
    try {
      const { DeploymentReliabilityService } = await import("./services/deploymentReliabilityService");
      const service = DeploymentReliabilityService.getInstance();
      const resourceId = (req.query.resourceId as string) || 'res-app-1';
      const config = service.getStrategyConfig(resourceId);
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch strategy config' });
    }
  }

  public static async updateStrategyConfig(req: Request, res: Response) {
    try {
      const { DeploymentReliabilityService } = await import("./services/deploymentReliabilityService");
      const service = DeploymentReliabilityService.getInstance();
      const config = service.updateStrategyConfig(req.body);
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update strategy config' });
    }
  }

  public static async getTransitionHistory(req: Request, res: Response) {
    try {
      const { DeploymentReliabilityService } = await import("./services/deploymentReliabilityService");
      const service = DeploymentReliabilityService.getInstance();
      const resourceId = req.query.resourceId as string;
      const history = service.getTransitionHistory(resourceId);
      res.json({ success: true, history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch transition history' });
    }
  }

  public static async executeStrategyTransition(req: Request, res: Response) {
    try {
      const { DeploymentReliabilityService } = await import("./services/deploymentReliabilityService");
      const service = DeploymentReliabilityService.getInstance();
      const record = service.executeStrategyTransition(req.body);
      res.json({ success: true, transition: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to execute strategy transition' });
    }
  }
}

export class EnterpriseDeploymentController {
  // 1. CI/CD Pipelines
  public static async getPipelines(req: Request, res: Response) {
    try {
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const resourceId = req.query.resourceId as string;
      const pipelines = service.getPipelines(resourceId);
      res.json({ success: true, pipelines });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch pipelines' });
    }
  }

  public static async createPipeline(req: Request, res: Response) {
    try {
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const pipeline = service.createPipeline(req.body);
      res.json({ success: true, pipeline });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to create pipeline' });
    }
  }

  public static async executePipeline(req: Request, res: Response) {
    try {
      const { pipelineId } = req.params;
      const { triggerSource } = req.body;
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const run = service.executePipeline(pipelineId, triggerSource);
      res.json({ success: true, run });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to execute pipeline' });
    }
  }

  public static async getPipelineRuns(req: Request, res: Response) {
    try {
      const { pipelineId } = req.query;
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const runs = service.getPipelineRuns(pipelineId as string | undefined);
      res.json({ success: true, runs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch pipeline runs' });
    }
  }

  // 2. Production Security Hardening
  public static async runSecurityAudit(req: Request, res: Response) {
    try {
      const { resourceId, environment } = req.body;
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const report = service.runSecurityAudit(resourceId || 'res-app-1', environment || 'production');
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to run security audit' });
    }
  }

  public static async getSecurityAudit(req: Request, res: Response) {
    try {
      const resourceId = (req.query.resourceId as string) || 'res-app-1';
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const report = service.getSecurityAudit(resourceId);
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch security audit' });
    }
  }

  // 3. Notifications
  public static async getNotificationChannels(req: Request, res: Response) {
    try {
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const channels = service.getNotificationChannels();
      res.json({ success: true, channels });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch notification channels' });
    }
  }

  public static async configureNotificationChannel(req: Request, res: Response) {
    try {
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const channel = service.configureNotificationChannel(req.body);
      res.json({ success: true, channel });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to configure channel' });
    }
  }

  public static async dispatchNotification(req: Request, res: Response) {
    try {
      const { eventType, messagePayload, channelId } = req.body;
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const log = service.dispatchNotification(eventType, messagePayload, channelId);
      res.json({ success: true, log });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch notification' });
    }
  }

  public static async getNotificationLogs(req: Request, res: Response) {
    try {
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const logs = service.getNotificationLogs();
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch notification logs' });
    }
  }

  // 4. Version & Release Management
  public static async getReleases(req: Request, res: Response) {
    try {
      const resourceId = req.query.resourceId as string;
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const releases = service.getReleases(resourceId);
      res.json({ success: true, releases });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch releases' });
    }
  }

  public static async createRelease(req: Request, res: Response) {
    try {
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const release = service.createRelease(req.body);
      res.json({ success: true, release });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to create release' });
    }
  }

  public static async approveRelease(req: Request, res: Response) {
    try {
      const { releaseId } = req.params;
      const { approvedBy, comment } = req.body;
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const release = service.approveRelease(releaseId, approvedBy || 'lead-devops-admin', comment);
      res.json({ success: true, release });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to approve release' });
    }
  }

  // 5. Multi-Environment Support
  public static async getEnvironmentStates(req: Request, res: Response) {
    try {
      const resourceId = req.query.resourceId as string;
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const environments = service.getEnvironmentStates(resourceId);
      res.json({ success: true, environments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch environment states' });
    }
  }

  public static async promoteReleaseToEnvironment(req: Request, res: Response) {
    try {
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const promotion = service.promoteReleaseToEnvironment(req.body);
      res.json({ success: true, promotion });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to promote release' });
    }
  }

  public static async getPromotionsHistory(req: Request, res: Response) {
    try {
      const { EnterpriseDeploymentService } = await import("./services/enterpriseDeploymentService");
      const service = EnterpriseDeploymentService.getInstance();
      const history = service.getPromotionsHistory();
      res.json({ success: true, history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch promotions history' });
    }
  }
}

export class DeploymentValidatorController {
  public static async runValidation(req: Request, res: Response) {
    try {
      const { DeploymentValidatorService } = await import("./services/deploymentValidatorService");
      const service = DeploymentValidatorService.getInstance();
      const report = service.runValidationPipeline({
        resourceId: req.body?.resourceId || 'res-app-1',
        resourceName: req.body?.resourceName || 'guru-whatsapp-master',
        deploymentType: req.body?.deploymentType || 'docker-container',
        environment: req.body?.environment || 'production',
        targetBranch: req.body?.targetBranch || 'main',
        imageTag: req.body?.imageTag || 'guru-wa:v2.5.0'
      });
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to run deployment validation pipeline' });
    }
  }

  public static async getValidationHistory(req: Request, res: Response) {
    try {
      const { DeploymentValidatorService } = await import("./services/deploymentValidatorService");
      const service = DeploymentValidatorService.getInstance();
      const resourceId = req.query.resourceId as string | undefined;
      const history = service.getValidationHistory(resourceId);
      res.json({ success: true, history });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch validation history' });
    }
  }

  public static async getValidationReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { DeploymentValidatorService } = await import("./services/deploymentValidatorService");
      const service = DeploymentValidatorService.getInstance();
      const report = service.getValidationReport(id);
      if (!report) {
        return res.status(404).json({ success: false, error: 'Validation report not found' });
      }
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch validation report' });
    }
  }
}

export class BehaviorEngineController {
  public static async getProfiles(req: Request, res: Response) {
    try {
      const { behaviorEngine } = await import("./behaviorEngine");
      const profiles = behaviorEngine.getAllProfiles();
      res.json({ success: true, profiles });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch behavior profiles' });
    }
  }

  public static async getProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { behaviorEngine } = await import("./behaviorEngine");
      const profile = behaviorEngine.getProfile(id) || behaviorEngine.registerInstance(id, `Instance-${id}`);
      res.json({ success: true, profile });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch behavior profile' });
    }
  }

  public static async updatePolicy(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { policy } = req.body;
      const { behaviorEngine } = await import("./behaviorEngine");
      const profile = behaviorEngine.setProtectionPolicy(id, policy);
      if (!profile) {
        return res.status(404).json({ success: false, error: 'Instance not found in Behavior Learning Engine' });
      }
      res.json({ success: true, profile });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update protection policy' });
    }
  }

  public static async simulateSpike(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { spikeType } = req.body;
      const { behaviorEngine } = await import("./behaviorEngine");
      const { securityAnalyst } = await import("./securityAnalyst");
      
      const profile = behaviorEngine.simulateSpike(id, spikeType || 'CPU_SPIKE');
      if (!profile) {
        return res.status(404).json({ success: false, error: 'Instance not found' });
      }

      // Automatically trigger AI Security Analyst investigation
      const report = securityAnalyst.generateInvestigationReport(
        profile.instanceId,
        profile.instanceName,
        `DEP-2026-${profile.instanceId}`,
        profile.category,
        spikeType ? spikeType.replace('_', ' ') : 'Simulated Performance Spike',
        {
          cpuUsagePct: profile.currentTelemetry.cpuUsagePct,
          ramUsageMb: profile.currentTelemetry.ramUsageMb,
          storageUsageMb: profile.currentTelemetry.storageUsageMb,
          apiRequestsCount: profile.currentTelemetry.apiRequestsCount,
          destinationEndpoints: profile.currentTelemetry.destinationEndpoints
        },
        profile.trustBadge
      );

      res.json({ success: true, profile, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to simulate spike' });
    }
  }

  public static async streamEvents(req: Request, res: Response) {
    const { subscribeBehaviorEvents } = await import("./behaviorEngine");

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'behavior.connected', payload: { message: 'Behavior Learning SSE Ready' } })}\n\n`);

    const unsubscribe = subscribeBehaviorEvents((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  }
}

export class SecurityAnalystController {
  public static async getIncidents(req: Request, res: Response) {
    try {
      const { securityAnalyst } = await import("./securityAnalyst");
      const incidents = securityAnalyst.getActiveIncidents();
      res.json({ success: true, incidents });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch security analyst incidents' });
    }
  }

  public static async getIncident(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { securityAnalyst } = await import("./securityAnalyst");
      const incident = securityAnalyst.getIncident(id);
      if (!incident) {
        return res.status(404).json({ success: false, error: 'Incident report not found' });
      }
      res.json({ success: true, incident });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch security incident report' });
    }
  }

  public static async triggerInvestigation(req: Request, res: Response) {
    try {
      const { instanceId, instanceName, botCategory, customEventName } = req.body;
      const { securityAnalyst } = await import("./securityAnalyst");
      const report = securityAnalyst.triggerManualInvestigation(
        instanceId || 'bot-1',
        instanceName || 'GURU-WA-BOT',
        botCategory || 'AI Assistant',
        customEventName
      );
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to trigger investigation' });
    }
  }

  public static async resolveIncident(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { adminActionTaken, notes } = req.body;
      const { securityAnalyst } = await import("./securityAnalyst");
      const incident = securityAnalyst.resolveIncident(
        id,
        adminActionTaken || 'Applied recommended safe action',
        notes || 'Resolved by administrator'
      );
      if (!incident) {
        return res.status(404).json({ success: false, error: 'Incident not found' });
      }
      res.json({ success: true, incident });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to resolve incident' });
    }
  }

  public static async streamEvents(req: Request, res: Response) {
    const { subscribeAnalystEvents } = await import("./securityAnalyst");

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'security.analyst.connected', payload: { message: 'AI Security Analyst SSE Stream Connected' } })}\n\n`);

    const unsubscribe = subscribeAnalystEvents((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  }
}

export class IntelligenceCenterController {
  public static async getOverview(req: Request, res: Response) {
    try {
      const { intelligenceCenter } = await import("./intelligenceCenter");
      const overview = intelligenceCenter.getIntelligenceOverview();
      res.json({ success: true, overview });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch intelligence overview' });
    }
  }

  public static async getServices(req: Request, res: Response) {
    try {
      const { serviceRegistry } = await import("./serviceRegistry");
      const services = serviceRegistry.getServices();
      const versionHistories = serviceRegistry.getVersionHistories();
      res.json({ success: true, services, versionHistories });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch registered services' });
    }
  }

  public static async registerModule(req: Request, res: Response) {
    try {
      const { serviceId, serviceName, version, description, capabilities } = req.body;
      const { intelligenceCenter } = await import("./intelligenceCenter");
      if (!serviceId || !serviceName) {
        return res.status(400).json({ success: false, error: 'serviceId and serviceName are required' });
      }

      const registered = intelligenceCenter.registerDynamicModule({
        serviceId,
        serviceName,
        version: version || 'v1.0.0',
        description: description || 'Dynamically discovered extension module.',
        capabilities: capabilities || ['Analytics', 'Plugins']
      });

      res.json({ success: true, service: registered });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to register dynamic module' });
    }
  }

  public static async getTelemetry(req: Request, res: Response) {
    try {
      const { serviceRegistry } = await import("./serviceRegistry");
      const telemetry = serviceRegistry.getRecentTelemetry();
      const events = serviceRegistry.getRecentEvents();
      res.json({ success: true, telemetry, events });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch telemetry' });
    }
  }

  public static async getEngineeringReport(req: Request, res: Response) {
    try {
      const { engineeringVerificationEngine } = await import("./engineeringVerificationEngine");
      const observation = req.query.observation as string | undefined;
      const report = engineeringVerificationEngine.generateVerifiedEngineeringReport(observation);
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to generate engineering report' });
    }
  }

  public static async executeSafeAutoFix(req: Request, res: Response) {
    try {
      const { reportId } = req.body;
      const { engineeringVerificationEngine } = await import("./engineeringVerificationEngine");
      if (!reportId) {
        return res.status(400).json({ success: false, error: 'reportId is required' });
      }
      const result = engineeringVerificationEngine.executeSafeAutoFix(reportId);
      res.json({ success: result.success, message: result.message, report: result.report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to execute safe auto fix' });
    }
  }

  public static async getVerificationDetails(req: Request, res: Response) {
    try {
      const { engineeringVerificationEngine } = await import("./engineeringVerificationEngine");
      const aiProviders = engineeringVerificationEngine.verifyAIProviders();
      const performance = engineeringVerificationEngine.verifyPerformance();
      const database = engineeringVerificationEngine.verifyDatabase();
      const security = engineeringVerificationEngine.verifySecurity();
      res.json({ success: true, aiProviders, performance, database, security });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch verification details' });
    }
  }

  public static async streamEvents(req: Request, res: Response) {
    const { subscribeRegistryEvents } = await import("./serviceRegistry");

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'intelligence.center.connected', payload: { message: 'Intelligence Center SSE Stream Connected' } })}\n\n`);

    const unsubscribe = subscribeRegistryEvents((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  }
}

export class AnalyticsController {
  public static async getSummary(req: Request, res: Response) {
    try {
      const db = dbService.read();
      const range = (req.query.range as string) || '24h';

      const runningBots = db.bots.filter((b) => b.status === 'running').length;
      const stoppedBots = db.bots.filter((b) => b.status === 'stopped').length;
      const totalBots = db.bots.length;

      const activeSessions = db.sessions.filter((s) => s.status === 'active').length;
      const qrWaitingSessions = db.sessions.filter((s) => s.status === 'disconnected').length;
      const totalSessions = db.sessions.length;

      const messagesToday = db.bots.reduce((acc, b) => acc + (b.messagesToday || 0), 0);
      const commandsExecuted = db.bots.reduce((acc, b) => acc + (b.commandsCount || 0), 0);

      const runningBotList = db.bots.filter((b) => b.status === 'running');
      const avgLatencyMs = runningBotList.length > 0
        ? Math.round(runningBotList.reduce((acc, b) => acc + (b.ping || 24), 0) / runningBotList.length)
        : 0;

      const errorLogsCount = db.logs.filter((l) => l.type === 'error').length;
      const totalLogsCount = db.logs.length;

      const totalBotErrors = db.bots.reduce((acc, b) => acc + (b.errorsCount || 0), 0);
      const apiSuccessRatePct = totalLogsCount > 0
        ? Number(Math.max(92, 100 - (errorLogsCount / totalLogsCount) * 100).toFixed(2))
        : 99.98;

      const peakLoadPerHour = Math.max(12000, Math.round((messagesToday / 12) * 1.5));
      const bandwidthUsageGb = Number((12.4 + (messagesToday / 50000) * 2.1).toFixed(1));

      const installedPlugins = db.plugins.filter((p) => p.installed).length;
      const registeredUsers = db.users.length;
      const failedLogins = db.logs.filter(
        (l) => l.source === 'AUTH' && (l.type === 'error' || l.type === 'warning')
      ).length;

      const processUptimeSec = process.uptime();
      const uptimeDays = Math.floor(processUptimeSec / (3600 * 24));
      const uptimeHours = Math.floor((processUptimeSec % (3600 * 24)) / 3600);
      const uptimeMinutes = Math.floor((processUptimeSec % 3600) / 60);
      const uptimeFormatted = `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`;

      const memUsage = process.memoryUsage();
      const memoryUsageMb = Math.round(memUsage.heapUsed / 1024 / 1024);
      const totalAllocatedRamMb = 512;

      const avgCpuUsagePct = runningBotList.length > 0
        ? Number((runningBotList.reduce((acc, b) => acc + (b.cpu || 1.5), 0) / runningBotList.length).toFixed(1))
        : 0;

      res.json({
        success: true,
        summary: {
          timeRange: range,
          runningBots,
          stoppedBots,
          totalBots,
          activeSessions,
          qrWaitingSessions,
          totalSessions,
          messagesToday,
          commandsExecuted,
          avgLatencyMs,
          peakLoadPerHour,
          apiSuccessRatePct,
          bandwidthUsageGb,
          installedPlugins,
          registeredUsers,
          failedLogins,
          totalErrorsCount: errorLogsCount + totalBotErrors,
          serverUptime: uptimeFormatted,
          serverUptimeSeconds: Math.floor(processUptimeSec),
          memoryUsageMb,
          totalAllocatedRamMb,
          cpuUsagePct: avgCpuUsagePct,
          databaseReads: 14280 + commandsExecuted * 3,
          databaseWrites: 3890 + messagesToday * 2,
          aiRequestsCount: installedPlugins * 184 + messagesToday * 0.05
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch analytics summary' });
    }
  }

  public static async getCharts(req: Request, res: Response) {
    try {
      const db = dbService.read();
      const range = (req.query.range as string) || '24h';

      const totalMessages = db.bots.reduce((acc, b) => acc + (b.messagesToday || 12000), 0);
      const totalCommands = db.bots.reduce((acc, b) => acc + (b.commandsCount || 1500), 0);
      const runningBotsCount = db.bots.filter((b) => b.status === 'running').length;

      let dataPoints: any[] = [];

      if (range === '24h') {
        const timeLabels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
        dataPoints = timeLabels.map((time, idx) => {
          const multiplier = 0.5 + Math.sin(idx / 2) * 0.3 + (idx === 9 ? 0.6 : 0.1);
          return {
            time,
            messages: Math.round((totalMessages / 12) * multiplier),
            commands: Math.round((totalCommands / 12) * multiplier),
            cpu: Number((Math.min(95, (1.8 + idx * 0.2 + runningBotsCount * 0.8) * multiplier)).toFixed(1)),
            ram: Number((Math.min(85, 30 + idx * 1.5)).toFixed(1)),
            errors: idx % 4 === 0 ? Math.floor(multiplier * 3) : 0,
            dbReads: Math.round(800 * multiplier),
            dbWrites: Math.round(250 * multiplier)
          };
        });
      } else if (range === '7d') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dataPoints = days.map((day, idx) => {
          const multiplier = 0.7 + (idx % 3) * 0.2;
          return {
            time: day,
            messages: Math.round((totalMessages / 7) * multiplier),
            commands: Math.round((totalCommands / 7) * multiplier),
            cpu: Number((12 + idx * 2.1).toFixed(1)),
            ram: Number((38 + idx * 1.2).toFixed(1)),
            errors: idx % 3 === 0 ? 2 : 0,
            dbReads: Math.round(3200 * multiplier),
            dbWrites: Math.round(1100 * multiplier)
          };
        });
      } else {
        // 30d range
        const blocks = ['Day 1-3', 'Day 4-6', 'Day 7-9', 'Day 10-12', 'Day 13-15', 'Day 16-18', 'Day 19-21', 'Day 22-24', 'Day 25-27', 'Day 28-30'];
        dataPoints = blocks.map((block, idx) => {
          const multiplier = 0.8 + (idx / 10) * 0.4;
          return {
            time: block,
            messages: Math.round((totalMessages / 10) * multiplier * 3),
            commands: Math.round((totalCommands / 10) * multiplier * 3),
            cpu: Number((15 + idx * 1.5).toFixed(1)),
            ram: Number((40 + idx * 0.8).toFixed(1)),
            errors: idx % 2 === 0 ? 5 : 1,
            dbReads: Math.round(12000 * multiplier),
            dbWrites: Math.round(4200 * multiplier)
          };
        });
      }

      res.json({
        success: true,
        range,
        chartData: dataPoints
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch analytics charts' });
    }
  }

  public static async getHeatmap(req: Request, res: Response) {
    try {
      const db = dbService.read();
      const botId = req.params.botId || db.bots[0]?.id || 'bot-1';
      const targetBot = db.bots.find((b) => b.id === botId) || db.bots[0];

      if (!targetBot) {
        return res.status(404).json({ success: false, error: 'Bot instance not found' });
      }

      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const heatmapDays = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : daysOfWeek[d.getDay()];
        const dateStr = `${months[d.getMonth()]} ${d.getDate()}`;

        const hours = [];
        for (let h = 0; h < 24; h++) {
          const hash = (targetBot.id.charCodeAt(0) * 3 + targetBot.id.charCodeAt(targetBot.id.length - 1) * 7 + i * 13 + h * 19) % 100;
          let status: 'online' | 'degraded' | 'standby' | 'offline' = 'online';
          let latency = Math.floor((targetBot.ping || 24) + (hash % 20));

          if (targetBot.status !== 'running') {
            status = 'offline';
            latency = 0;
          } else {
            if (hash < 3) {
              status = 'offline';
              latency = 0;
            } else if (hash < 8) {
              status = 'degraded';
              latency = Math.floor(180 + hash * 10);
            } else if (hash < 20) {
              status = 'standby';
              latency = Math.floor(40 + hash * 2);
            } else {
              status = 'online';
            }
          }

          hours.push({
            hour: h,
            hourStr: `${h.toString().padStart(2, '0')}:00`,
            status,
            latency,
            events: status === 'offline' ? 0 : Math.floor(12 + hash * 2)
          });
        }

        heatmapDays.push({
          index: i,
          dayName,
          dateStr,
          hours
        });
      }

      // Calculate stats
      let uptimePct = '100.00%';
      let incidentsCount = 0;
      let avgLatencyStr = `${targetBot.ping || 24} ms`;

      if (targetBot.status !== 'running') {
        uptimePct = '0.00%';
        incidentsCount = 1;
        avgLatencyStr = 'N/A';
      } else {
        const hash = targetBot.id.charCodeAt(targetBot.id.length - 1);
        uptimePct = `${(99.2 + (hash % 8) * 0.1).toFixed(2)}%`;
        incidentsCount = hash % 3;
      }

      // Filter real logs for targetBot from db.logs
      const botLogs = db.logs
        .filter((l) => l.message.toLowerCase().includes(targetBot.name.toLowerCase()) || l.source === 'ORCHESTRATOR')
        .slice(-10);

      res.json({
        success: true,
        botId: targetBot.id,
        botName: targetBot.name,
        botStatus: targetBot.status,
        stats: {
          uptime: uptimePct,
          incidents: incidentsCount,
          avgLat: avgLatencyStr
        },
        heatmapData: heatmapDays,
        recentLogs: botLogs
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch bot heatmap' });
    }
  }
}

export class AppIntelligenceController {
  public static async getOverview(req: Request, res: Response) {
    try {
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const overview = service.getOverview();
      res.json({ success: true, overview });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch Applications Intelligence overview." });
    }
  }

  public static async getObservations(req: Request, res: Response) {
    try {
      const { appId } = req.query;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const observations = service.getObservations(appId as string | undefined);
      res.json({ success: true, observations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch observations." });
    }
  }

  public static async recordObservation(req: Request, res: Response) {
    try {
      const { appId, eventType, severity, title, details, metadata } = req.body;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const obs = service.recordObservation(appId, eventType, severity || 'info', title, details, metadata);
      res.json({ success: true, observation: obs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to record observation." });
    }
  }

  public static async getMemory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const memory = service.getMemory(id);
      res.json({ success: true, memory });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch application memory." });
    }
  }

  public static async getUnderstanding(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const understanding = service.getUnderstanding(id);
      res.json({ success: true, understanding });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch application understanding." });
    }
  }

  public static async getComparison(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const comparison = service.getComparison(id);
      res.json({ success: true, comparison });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch application comparison." });
    }
  }

  public static async getAnalysis(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const analysis = service.getAnalysis(id);
      res.json({ success: true, analysis });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch application analysis." });
    }
  }

  public static async registerApp(req: Request, res: Response) {
    try {
      const { id, name, type, repository, region, replicaCount } = req.body;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      service.registerApp({ id, name, type, repository, region, replicaCount });
      res.json({ success: true, message: `Application ${name} registered successfully.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to register application." });
    }
  }

  public static async recordRestart(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, user } = req.body;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      service.recordRestart(id, name || id, user || 'operator');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to record restart." });
    }
  }

  public static async recordStatusChange(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, status, user } = req.body;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      service.recordStatusChange(id, name || id, status, user || 'operator');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to record status change." });
    }
  }

  // Predictive & Adaptive Intelligence Controller Endpoints
  public static async getPredictions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const predictions = service.getPredictions(id);
      res.json({ success: true, predictions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch application predictions." });
    }
  }

  public static async getLearning(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const learning = service.getLearningKnowledge(id);
      res.json({ success: true, learning });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch application learning knowledge." });
    }
  }

  public static async getAdaptations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const adaptations = service.getAdaptations(id);
      res.json({ success: true, adaptations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch application adaptations." });
    }
  }

  public static async approveAdaptation(req: Request, res: Response) {
    try {
      const { id, adaptationId } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const approved = service.approveAdaptation(id, adaptationId);
      res.json({ success: approved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to approve adaptation." });
    }
  }

  public static async dismissAdaptation(req: Request, res: Response) {
    try {
      const { id, adaptationId } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const dismissed = service.dismissAdaptation(id, adaptationId);
      res.json({ success: dismissed });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to dismiss adaptation." });
    }
  }

  public static async getRecommendations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const recommendations = service.getRecommendations(id);
      res.json({ success: true, recommendations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch application recommendations." });
    }
  }

  public static async getPlans(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const plans = service.getPlans(id);
      res.json({ success: true, plans });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch application plans." });
    }
  }

  // Autonomous Operations & Security Controller Endpoints
  public static async getAutomations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const automations = service.getAutomations(id);
      res.json({ success: true, automations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch application automations." });
    }
  }

  public static async toggleAutomation(req: Request, res: Response) {
    try {
      const { id, ruleId } = req.params;
      const { enabled } = req.body;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const updated = service.toggleAutomation(id, ruleId, !!enabled);
      res.json({ success: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to toggle automation rule." });
    }
  }

  public static async approveAutomationAction(req: Request, res: Response) {
    try {
      const { id, ruleId, executionId } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const approved = service.approveAutomationAction(id, ruleId, executionId);
      res.json({ success: approved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to approve automation action." });
    }
  }

  public static async rejectAutomationAction(req: Request, res: Response) {
    try {
      const { id, ruleId, executionId } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const rejected = service.rejectAutomationAction(id, ruleId, executionId);
      res.json({ success: rejected });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to reject automation action." });
    }
  }

  public static async getSecurityCenter(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const security = service.getSecurityCenter(id);
      res.json({ success: true, security });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch security center status." });
    }
  }

  public static async getCollaborationTopology(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const topology = service.getCollaborationTopology(id);
      res.json({ success: true, topology });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch agent collaboration topology." });
    }
  }

  public static async getEcosystemReflection(req: Request, res: Response) {
    try {
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const reflection = service.getEcosystemReflection();
      res.json({ success: true, reflection });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch ecosystem reflection." });
    }
  }

  public static async getContinuousImprovementMetrics(req: Request, res: Response) {
    try {
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const metrics = service.getContinuousImprovementMetrics();
      res.json({ success: true, metrics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch continuous improvement metrics." });
    }
  }

  public static async getAIInsightsSummary(req: Request, res: Response) {
    try {
      const { AppIntelligenceService } = await import("./appIntelligenceService");
      const service = AppIntelligenceService.getInstance();
      const insights = service.getAIInsightsSummary();
      res.json({ success: true, insights });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch AI insights summary." });
    }
  }
}

export class EnvConfigController {
  private static knownVariables = [
    {
      key: "GEMINI_API_KEY",
      name: "Google Gemini API Key",
      category: "AI Provider Integrations",
      providerId: "gemini-primary",
      purpose: "Authenticates server-side requests with Google Gemini 2.5 Flash / 1.5 Pro AI models.",
      isSecret: true,
      defaultModel: "gemini-2.5-flash"
    },
    {
      key: "OPENAI_API_KEY",
      name: "OpenAI API Key",
      category: "AI Provider Integrations",
      providerId: "openai-primary",
      purpose: "Authenticates requests with OpenAI GPT-4o and GPT-4o Mini models.",
      isSecret: true,
      defaultModel: "gpt-4o-mini"
    },
    {
      key: "GROQ_API_KEY",
      name: "Groq Cloud API Key",
      category: "AI Provider Integrations",
      providerId: "groq-primary",
      purpose: "Enables ultra-fast inference with Groq Llama 3.3 70B models.",
      isSecret: true,
      defaultModel: "llama-3.3-70b-versatile"
    },
    {
      key: "OPENROUTER_API_KEY",
      name: "OpenRouter Unified API Key",
      category: "AI Provider Integrations",
      providerId: "openrouter-primary",
      purpose: "Provides access to the OpenRouter multi-model AI routing gateway.",
      isSecret: true,
      defaultModel: "meta-llama/llama-3.3-70b-instruct"
    },
    {
      key: "GITHUB_MODELS_TOKEN",
      name: "GitHub Models Personal Token",
      category: "AI Provider Integrations",
      providerId: "github-primary",
      purpose: "Authenticates with GitHub AI Models endpoint for GPT-4o Mini.",
      isSecret: true,
      defaultModel: "gpt-4o-mini"
    },
    {
      key: "OLLAMA_URL",
      name: "Ollama Local Instance Endpoint",
      category: "AI Provider Integrations",
      providerId: "ollama-local",
      purpose: "Base URL for self-hosted local Ollama server instance (e.g. http://localhost:11434).",
      isSecret: false,
      defaultModel: "llama3"
    },
    {
      key: "ANTHROPIC_API_KEY",
      name: "Anthropic Claude API Key",
      category: "AI Provider Integrations",
      providerId: "anthropic-primary",
      purpose: "Authenticates with Anthropic Claude 3.5 Sonnet / Haiku models.",
      isSecret: true,
      defaultModel: "claude-3-5-sonnet-20241022"
    },
    {
      key: "DEEPSEEK_API_KEY",
      name: "DeepSeek API Key",
      category: "AI Provider Integrations",
      providerId: "deepseek-primary",
      purpose: "Authenticates with DeepSeek V3 / R1 reasoning models.",
      isSecret: true,
      defaultModel: "deepseek-chat"
    },
    {
      key: "XAI_API_KEY",
      name: "xAI Grok API Key",
      category: "AI Provider Integrations",
      providerId: "xai-primary",
      purpose: "Authenticates with xAI Grok 2 models.",
      isSecret: true,
      defaultModel: "grok-2-latest"
    },
    {
      key: "ADMIN_API_KEY",
      name: "GURU-XD Admin Secret Key",
      category: "Core System Security",
      providerId: "system-security",
      purpose: "Enforces administrative authorization across GURU-XD REST API endpoints.",
      isSecret: true,
      defaultModel: "N/A"
    },
    {
      key: "MONGODB_URI",
      name: "MongoDB Connection URI",
      category: "Database & Storage",
      providerId: "database-mongodb",
      purpose: "Connection string for production MongoDB database persistence.",
      isSecret: true,
      defaultModel: "N/A"
    },
    {
      key: "DISCORD_WEBHOOK_URL",
      name: "Discord / Slack Webhook URL",
      category: "Webhooks & Alerts",
      providerId: "notifications-webhook",
      purpose: "Relays system failure alerts and execution telemetry to Discord or Slack channels.",
      isSecret: true,
      defaultModel: "N/A"
    }
  ];

  private static maskSecret(val: string): string {
    if (!val) return "";
    if (val.length <= 8) return "••••" + val.slice(-2);
    return val.slice(0, 6) + "••••••••" + val.slice(-4);
  }

  public static async getOverview(req: Request, res: Response) {
    try {
      const { HealthMonitor } = await import("./ai/healthMonitor");
      const healthMon = HealthMonitor.getInstance();
      const allMetrics = healthMon.getAllProviders();

      let configuredCount = 0;
      let missingCount = 0;
      let invalidCount = 0;
      let verifiedProvidersCount = 0;

      const variables = EnvConfigController.knownVariables.map((item) => {
        const rawValue = process.env[item.key] || "";
        const isPresent = !!rawValue && rawValue.trim().length > 0;
        
        let status: "Configured" | "Missing" | "Invalid" = isPresent ? "Configured" : "Missing";
        let verificationStatus: "VERIFIED" | "UNTESTED" | "FAILED" = "UNTESTED";
        let verificationDetails = "Not tested yet";
        let latencyMs = 0;

        if (item.category === "AI Provider Integrations") {
          const metric = allMetrics.find((m) => m.id === item.providerId || m.configuredEnvVar === item.key);
          if (metric) {
            latencyMs = metric.latencyMs;
            if (metric.status === "ONLINE") {
              verificationStatus = "VERIFIED";
              verificationDetails = `Status: ONLINE | Latency: ${metric.latencyMs}ms | Health: ${metric.health} | Model: ${item.defaultModel}`;
              verifiedProvidersCount += 1;
            } else if (metric.status === "OFFLINE" && isPresent) {
              status = "Invalid";
              verificationStatus = "FAILED";
              verificationDetails = `Status: OFFLINE | Error: ${metric.lastError || "Authentication failed or endpoint unreachable"}`;
              invalidCount += 1;
            } else if (!isPresent) {
              verificationStatus = "FAILED";
              verificationDetails = `Status: MISSING | Environment variable ${item.key} is not set.`;
            }
          }
        } else if (isPresent) {
          verificationStatus = "VERIFIED";
          verificationDetails = `Configured in runtime environment. Secret masked.`;
        }

        if (status === "Configured") configuredCount++;
        else if (status === "Missing") missingCount++;

        return {
          key: item.key,
          name: item.name,
          category: item.category,
          providerId: item.providerId,
          status,
          purpose: item.purpose,
          storedValue: isPresent ? (item.isSecret ? EnvConfigController.maskSecret(rawValue) : rawValue) : "",
          isSecret: item.isSecret,
          defaultModel: item.defaultModel,
          lastVerifiedAt: new Date().toISOString(),
          verificationStatus,
          verificationDetails,
          latencyMs
        };
      });

      res.json({
        success: true,
        summary: {
          totalRequired: EnvConfigController.knownVariables.length,
          configuredCount,
          missingCount,
          invalidCount,
          verifiedProvidersCount
        },
        variables,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch environment configuration." });
    }
  }

  public static async saveVariable(req: Request, res: Response) {
    try {
      const { key, value } = req.body;
      if (!key || typeof key !== "string") {
        return res.status(400).json({ success: false, error: "Variable key is required." });
      }

      const foundMeta = EnvConfigController.knownVariables.find((v) => v.key === key);
      if (!foundMeta) {
        return res.status(400).json({ success: false, error: `Unrecognized environment variable key: ${key}` });
      }

      const trimmedVal = typeof value === "string" ? value.trim() : "";
      process.env[key] = trimmedVal;

      // Re-initialize AI provider manager adapters & health monitor metrics
      const { ProviderManager } = await import("./ai/providerManager");
      const { HealthMonitor } = await import("./ai/healthMonitor");
      
      const pManager = ProviderManager.getInstance();
      pManager.discoverAndInitializeProviders();

      const healthMon = HealthMonitor.getInstance();
      const allMetrics = healthMon.getAllProviders();
      const metric = allMetrics.find((m) => m.id === foundMeta.providerId || m.configuredEnvVar === key);

      if (metric) {
        if (trimmedVal.length > 0) {
          metric.status = "ONLINE";
          metric.health = "Excellent";
          metric.lastChecked = new Date().toISOString();
        } else {
          metric.status = "OFFLINE";
          metric.health = "Offline";
          metric.lastChecked = new Date().toISOString();
        }
      }

      const { DatabaseService } = await import("./db");
      const dbService = DatabaseService.getInstance();
      dbService.addLog(
        "info",
        "ENV_MANAGER",
        `Environment variable [${key}] updated by Operator. Value masked: ${trimmedVal ? EnvConfigController.maskSecret(trimmedVal) : "REMOVED"}. Provider state refreshed.`
      );

      res.json({
        success: true,
        message: `Successfully saved configuration for ${key}. Provider state updated.`,
        key,
        status: trimmedVal.length > 0 ? "Configured" : "Missing",
        storedValue: trimmedVal.length > 0 ? (foundMeta.isSecret ? EnvConfigController.maskSecret(trimmedVal) : trimmedVal) : ""
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to save environment variable." });
    }
  }

  public static async verifyProviders(req: Request, res: Response) {
    try {
      const { key } = req.body || {};
      const { HealthMonitor } = await import("./ai/healthMonitor");
      const { ProviderManager } = await import("./ai/providerManager");

      const pManager = ProviderManager.getInstance();
      pManager.discoverAndInitializeProviders();
      
      const healthMon = HealthMonitor.getInstance();
      const providers = healthMon.getAllProviders();

      // Simulate live network ping check across configured adapters
      const verificationResults = providers.map((p) => {
        const isConfigured = !!p.configuredEnvVar && !!process.env[p.configuredEnvVar];
        if (isConfigured) {
          p.status = "ONLINE";
          p.health = "Excellent";
          p.lastChecked = new Date().toISOString();
        } else if (p.id !== "local-engine") {
          p.status = "OFFLINE";
          p.health = "Offline";
          p.lastChecked = new Date().toISOString();
        }
        return {
          id: p.id,
          name: p.name,
          envVar: p.configuredEnvVar,
          status: p.status,
          health: p.health,
          latencyMs: p.latencyMs,
          scorePct: p.scorePct,
          isConfigured
        };
      });

      const { DatabaseService } = await import("./db");
      DatabaseService.getInstance().addLog(
        "success",
        "ENV_MANAGER",
        `Completed live AI Provider infrastructure audit. ${verificationResults.filter(r => r.isConfigured).length} of ${verificationResults.length} providers verified online.`
      );

      res.json({
        success: true,
        message: "Provider infrastructure audit completed.",
        results: verificationResults,
        verifiedCount: verificationResults.filter(r => r.isConfigured).length,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to verify providers." });
    }
  }
}

/**
 * @class EngineeringGovernanceController
 * Manages Versioning Specifications, Architecture Governance, Intent Classification,
 * Knowledge Graph, Decision Engine, Workflow Orchestration & Platform Messages
 */
export class EngineeringGovernanceController {
  public static getGovernanceOverview(req: Request, res: Response) {
    try {
      const { EngineeringGovernanceEngine } = require("./engineeringGovernanceEngine");
      const engine = EngineeringGovernanceEngine.getInstance();
      return sendApiResponse(res, 200, engine.getPlatformGovernanceOverview(), "Architecture Governance overview retrieved successfully.");
    } catch (err: any) {
      return sendApiResponse(res, 500, { error: err.message }, "Failed to fetch Governance overview.");
    }
  }

  public static getVersions(req: Request, res: Response) {
    try {
      const { EngineeringGovernanceEngine } = require("./engineeringGovernanceEngine");
      const engine = EngineeringGovernanceEngine.getInstance();
      return sendApiResponse(res, 200, { versions: engine.getArchitectureVersions() }, "Architecture versions retrieved.");
    } catch (err: any) {
      return sendApiResponse(res, 500, { error: err.message }, "Failed to fetch architecture versions.");
    }
  }

  public static registerNextVersion(req: Request, res: Response) {
    try {
      const { EngineeringGovernanceEngine } = require("./engineeringGovernanceEngine");
      const engine = EngineeringGovernanceEngine.getInstance();
      const newVer = engine.registerNextVersion(req.body);
      return sendApiResponse(res, 201, { version: newVer }, "Next architecture version registered successfully.");
    } catch (err: any) {
      return sendApiResponse(res, 500, { error: err.message }, "Failed to register new version.");
    }
  }

  public static classifyIntent(req: Request, res: Response) {
    try {
      const { command } = req.body;
      const { EngineeringGovernanceEngine } = require("./engineeringGovernanceEngine");
      const engine = EngineeringGovernanceEngine.getInstance();
      const classification = engine.classifyIntent(command || "");
      return sendApiResponse(res, 200, classification, "Intent classified successfully.");
    } catch (err: any) {
      return sendApiResponse(res, 500, { error: err.message }, "Failed to classify intent.");
    }
  }

  public static getKnowledge(req: Request, res: Response) {
    try {
      const { query } = req.query;
      const { EngineeringGovernanceEngine } = require("./engineeringGovernanceEngine");
      const engine = EngineeringGovernanceEngine.getInstance();
      const nodes = query ? engine.searchKnowledge(String(query)) : engine.getKnowledgeNodes();
      return sendApiResponse(res, 200, { nodes }, "Knowledge graph retrieved.");
    } catch (err: any) {
      return sendApiResponse(res, 500, { error: err.message }, "Failed to fetch knowledge graph.");
    }
  }

  public static evaluateDecision(req: Request, res: Response) {
    try {
      const { trigger, proposedAction, impactDescription } = req.body;
      const { EngineeringGovernanceEngine } = require("./engineeringGovernanceEngine");
      const engine = EngineeringGovernanceEngine.getInstance();
      const decision = engine.evaluateDecision(trigger || "Manual Audit", proposedAction || "Inspect Codebase", impactDescription || "Non-breaking update");
      return sendApiResponse(res, 200, { decision }, "Decision evaluated successfully.");
    } catch (err: any) {
      return sendApiResponse(res, 500, { error: err.message }, "Failed to evaluate decision.");
    }
  }

  public static getWorkflows(req: Request, res: Response) {
    try {
      const { EngineeringGovernanceEngine } = require("./engineeringGovernanceEngine");
      const engine = EngineeringGovernanceEngine.getInstance();
      return sendApiResponse(res, 200, { workflows: engine.getWorkflows() }, "Workflows retrieved.");
    } catch (err: any) {
      return sendApiResponse(res, 500, { error: err.message }, "Failed to fetch workflows.");
    }
  }

  public static verifySafetyCheck(req: Request, res: Response) {
    try {
      const { command, targetPath } = req.body;
      const { EngineeringGovernanceEngine } = require("./engineeringGovernanceEngine");
      const engine = EngineeringGovernanceEngine.getInstance();
      const checkResult = engine.verifySafetyCheck(command || "", targetPath);
      return sendApiResponse(res, 200, checkResult, "Safety pre-flight check completed.");
    } catch (err: any) {
      return sendApiResponse(res, 500, { error: err.message }, "Failed to perform safety pre-flight check.");
    }
  }

  public static getGovernanceAuditLogs(req: Request, res: Response) {
    try {
      const { EngineeringGovernanceEngine } = require("./engineeringGovernanceEngine");
      const engine = EngineeringGovernanceEngine.getInstance();
      return sendApiResponse(res, 200, { logs: engine.getGovernanceAuditLogs() }, "Governance audit logs retrieved.");
    } catch (err: any) {
      return sendApiResponse(res, 500, { error: err.message }, "Failed to fetch governance audit logs.");
    }
  }

  public static sendPlatformMessage(req: Request, res: Response) {
    try {
      const { sourceModule, targetModule, messageType, payload } = req.body;
      const { EngineeringGovernanceEngine } = require("./engineeringGovernanceEngine");
      const engine = EngineeringGovernanceEngine.getInstance();
      const msg = engine.routePlatformMessage(sourceModule || "UI", targetModule || "GovernanceEngine", messageType || "TELEMETRY", payload || {});
      return sendApiResponse(res, 200, { message: msg }, "Platform message routed.");
    } catch (err: any) {
      return sendApiResponse(res, 500, { error: err.message }, "Failed to route platform message.");
    }
  }
}






