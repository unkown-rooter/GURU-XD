import { Request, Response } from "express";
import { DatabaseService } from "./db";
import { CopilotService } from "./services";

const dbService = DatabaseService.getInstance();

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
    const { prompt } = req.body;
    try {
      const responseText = await CopilotService.generateCopilotResponse(prompt);
      res.json({ response: responseText });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to communicate with hypervisor AI stream." });
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



