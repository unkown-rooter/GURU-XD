import { Router } from "express";
import { DatabaseService } from "./db";
import { apiGuard, rateLimiter } from "./middleware";
import {
  BotController,
  CommandController,
  FileController,
  PluginController,
  SessionController,
  UserController,
  LogController,
  CopilotController,
  SubscriptionController,
  MongoConfigController,
  DeploymentPipelineController,
  BehaviorEngineController,
  SecurityAnalystController,
  IntelligenceCenterController,
  AnalyticsController
} from "./controllers";

const router = Router();
const dbService = DatabaseService.getInstance();

// Apply global telemetry fluctuation when getting overall data
router.get("/api/data", (req, res) => {
  dbService.fluctuateTelemetry();
  res.json(dbService.read());
});

// Credentials check route
router.get("/api/credentials", (req, res) => {
  const adminApiKey = process.env.ADMIN_API_KEY || 'gr-live_9438275983759843279584379258943';
  res.json({
    success: true,
    adminApiKey,
    hasCustomMongoUri: !!process.env.MONGODB_URI,
    hasCustomApiKey: !!process.env.ADMIN_API_KEY,
    hasCustomDiscordWebhook: !!process.env.DISCORD_WEBHOOK_URL,
    hasGeminiApiKey: !!process.env.GEMINI_API_KEY
  });
});

// Subscription upgrade route
router.post("/api/subscription/upgrade", apiGuard, SubscriptionController.upgradeSubscription);

// Retention policy settings routes
router.get("/api/retention", (req, res) => {
  const db = dbService.read();
  if (!db.retentionPolicy) {
    db.retentionPolicy = {
      autoClear7Days: false,
      maxLogEntries: 150
    };
    dbService.write(db);
  }
  res.json({ success: true, retentionPolicy: db.retentionPolicy });
});

router.post("/api/retention", apiGuard, (req, res) => {
  const { autoClear7Days, maxLogEntries } = req.body;
  const db = dbService.read();
  db.retentionPolicy = {
    autoClear7Days: !!autoClear7Days,
    maxLogEntries: typeof maxLogEntries === 'number' ? maxLogEntries : 150
  };
  
  // Enforce policy immediately
  dbService.enforceRetentionPolicy(db);
  
  dbService.addLog("success", "SYSTEM", `Retention policy updated. Auto-clear >7d: ${db.retentionPolicy.autoClear7Days}, Max entries: ${db.retentionPolicy.maxLogEntries}`);
  dbService.write(db);
  res.json({ success: true, retentionPolicy: db.retentionPolicy, logs: db.logs });
});

// Mongo Config Schema routes
router.get("/api/maintenance", (req, res) => {
  const db = dbService.read();
  res.json({ success: true, maintenanceMode: !!db.maintenanceMode });
});

router.post("/api/maintenance", apiGuard, (req, res) => {
  const { maintenanceMode } = req.body;
  const db = dbService.read();
  db.maintenanceMode = !!maintenanceMode;
  dbService.addLog(
    db.maintenanceMode ? "warning" : "success",
    "SYSTEM",
    `Global system-wide maintenance mode has been ${db.maintenanceMode ? "ACTIVATED" : "DEACTIVATED"} by Administrator.`
  );
  dbService.write(db);
  res.json({ success: true, maintenanceMode: db.maintenanceMode, logs: db.logs });
});

router.get("/api/mongo/schemas", MongoConfigController.getSchemas);
router.post("/api/mongo/schemas", apiGuard, MongoConfigController.updateSchemas);
router.post("/api/mongo/config", apiGuard, MongoConfigController.updateConfig);
router.post("/api/mongo/test-connection", apiGuard, MongoConfigController.testConnection);

// Deployment Pipeline & Security routes
router.post("/api/deployment/pipeline", apiGuard, DeploymentPipelineController.executePipeline);
router.get("/api/deployment/events", DeploymentPipelineController.streamEvents);
router.post("/api/deployment/session/new", apiGuard, DeploymentPipelineController.createSession);

// Behavior Learning Engine routes
router.get("/api/behavior/profiles", apiGuard, BehaviorEngineController.getProfiles);
router.get("/api/behavior/profile/:id", apiGuard, BehaviorEngineController.getProfile);
router.post("/api/behavior/profile/:id/policy", apiGuard, BehaviorEngineController.updatePolicy);
router.post("/api/behavior/profile/:id/simulate-spike", apiGuard, BehaviorEngineController.simulateSpike);
router.get("/api/behavior/events", BehaviorEngineController.streamEvents);

// AI Security Analyst routes
router.get("/api/security-analyst/incidents", apiGuard, SecurityAnalystController.getIncidents);
router.get("/api/security-analyst/incidents/:id", apiGuard, SecurityAnalystController.getIncident);
router.post("/api/security-analyst/investigate", apiGuard, SecurityAnalystController.triggerInvestigation);
router.post("/api/security-analyst/incidents/:id/resolve", apiGuard, SecurityAnalystController.resolveIncident);
router.get("/api/security-analyst/events", SecurityAnalystController.streamEvents);

// Intelligence Center & Service Registry routes
router.get("/api/intelligence/overview", apiGuard, IntelligenceCenterController.getOverview);
router.get("/api/intelligence/services", apiGuard, IntelligenceCenterController.getServices);
router.post("/api/intelligence/register-module", apiGuard, IntelligenceCenterController.registerModule);
router.get("/api/intelligence/telemetry", apiGuard, IntelligenceCenterController.getTelemetry);
router.get("/api/intelligence/events", IntelligenceCenterController.streamEvents);

// Production Analytics routes
router.get("/api/analytics/summary", apiGuard, AnalyticsController.getSummary);
router.get("/api/analytics/charts", apiGuard, AnalyticsController.getCharts);
router.get("/api/analytics/heatmap/:botId", apiGuard, AnalyticsController.getHeatmap);

// Bot Management routes
router.put("/api/bots/:id", apiGuard, BotController.updateBot);
router.delete("/api/bots/:id", apiGuard, BotController.deleteBot);
router.post("/api/bots/:id/start", apiGuard, BotController.startBot);
router.post("/api/bots/:id/stop", apiGuard, BotController.stopBot);
router.post("/api/bots/:id/restart", apiGuard, BotController.restartBot);
router.post("/api/bots/start-all", apiGuard, BotController.startAllBots);
router.post("/api/bots/stop-all", apiGuard, BotController.stopAllBots);
router.post("/api/bots", apiGuard, BotController.createBot);

// Custom command handler routes
router.post("/api/commands", apiGuard, CommandController.createCommand);
router.put("/api/commands/:id/toggle", apiGuard, CommandController.toggleCommand);
router.put("/api/commands/:id", apiGuard, CommandController.updateCommand);
router.delete("/api/commands/:id", apiGuard, CommandController.deleteCommand);

// Virtual filesystem management
router.post("/api/files", apiGuard, FileController.createFile);
router.put("/api/files", apiGuard, FileController.updateFile);
router.delete("/api/files", apiGuard, FileController.deleteFile);

// Plugins routes
router.put("/api/plugins/:id/install", apiGuard, PluginController.installPlugin);
router.post("/api/plugins", apiGuard, PluginController.createPlugin);
router.delete("/api/plugins/:id", apiGuard, PluginController.deletePlugin);
router.put("/api/plugins/:id", apiGuard, PluginController.updatePlugin);

// Active sockets gateway
router.put("/api/sessions/:id/disconnect", apiGuard, SessionController.disconnectSession);

// Portal Production Authentication/user routes
router.post("/api/auth/login", rateLimiter(20, 60000), UserController.login);
router.post("/api/auth/verify-otp", rateLimiter(20, 60000), UserController.verifyOtp);
router.post("/api/auth/resend-otp", rateLimiter(10, 60000), UserController.resendOtp);
router.post("/api/auth/register", rateLimiter(10, 60000), UserController.registerUser);
router.post("/api/auth/forgot-password", rateLimiter(10, 60000), UserController.forgotPassword);
router.post("/api/auth/github", rateLimiter(20, 60000), UserController.githubAuth);
router.post("/api/auth/google", rateLimiter(20, 60000), UserController.googleAuth);
router.post("/api/auth/microsoft", rateLimiter(20, 60000), UserController.microsoftAuth);
router.get("/api/auth/me", UserController.getCurrentUser);
router.post("/api/auth/logout", UserController.logout);
router.post("/api/auth/logout-all", UserController.logoutAll);

// Session & Login History Security API
router.get("/api/auth/sessions", UserController.getSessions);
router.delete("/api/auth/session/:id", UserController.deleteSession);
router.get("/api/auth/login-history", UserController.getLoginHistory);

// 2FA & Security Management API
router.post("/api/auth/enable-2fa", UserController.enable2FA);
router.post("/api/auth/disable-2fa", UserController.disable2FA);
router.get("/api/auth/recovery-codes", UserController.getRecoveryCodes);
router.post("/api/auth/regenerate-codes", UserController.regenerateCodes);

// Admin Security API
router.get("/api/auth/admin/security", UserController.getAdminSecurity);
router.post("/api/auth/admin/unlock", UserController.unlockAccount);
router.post("/api/auth/admin/block-ip", UserController.toggleBlockIp);

router.post("/api/users", UserController.registerUser);
router.put("/api/users/:id/toggle", apiGuard, UserController.toggleUserStatus);
router.delete("/api/users/:id", apiGuard, UserController.deleteUser);

// Logger endpoints
router.post("/api/logs", apiGuard, LogController.createLog);
router.delete("/api/logs", apiGuard, LogController.clearLogs);

// AI Terminal Copilot routes
router.post("/api/copilot/chat", rateLimiter(30, 60000), CopilotController.chat);
router.get("/api/copilot/memory", apiGuard, CopilotController.getMemories);
router.post("/api/copilot/memory", apiGuard, CopilotController.saveMemory);
router.delete("/api/copilot/memory/:id", apiGuard, CopilotController.deleteMemory);

router.get("/api/copilot/work-timeline", apiGuard, CopilotController.getWorkTimeline);
router.post("/api/copilot/work-timeline", apiGuard, CopilotController.addWorkItem);
router.get("/api/copilot/work/resume", apiGuard, CopilotController.resumeWorkContext);
router.get("/api/copilot/suggestions", apiGuard, CopilotController.getSuggestions);

router.get("/api/copilot/drafts", apiGuard, CopilotController.getDrafts);
router.post("/api/copilot/drafts", apiGuard, CopilotController.saveDraft);

router.get("/api/copilot/prompts", apiGuard, CopilotController.getPrompts);
router.post("/api/copilot/prompts", apiGuard, CopilotController.savePrompt);
router.delete("/api/copilot/prompts/:id", apiGuard, CopilotController.deletePrompt);

router.post("/api/copilot/sandbox/validate", apiGuard, CopilotController.validateSandbox);
router.post("/api/copilot/sandbox/deploy", apiGuard, CopilotController.deploySandbox);
router.get("/api/copilot/sandbox/history", apiGuard, CopilotController.getSandboxHistory);
router.post("/api/copilot/sandbox/rollback/:deploymentId", apiGuard, CopilotController.rollbackSandbox);

router.post("/api/copilot/execute-tool", apiGuard, CopilotController.executeTool);
router.get("/api/copilot/analytics", apiGuard, CopilotController.getAnalytics);
router.get("/api/copilot/agents", apiGuard, CopilotController.getAgents);

// AI Engine Reliability & Provider Health routes
router.get("/api/ai/providers", apiGuard, CopilotController.getProviders);
router.get("/api/ai/queue", apiGuard, CopilotController.getQueue);
router.post("/api/ai/cancel", apiGuard, CopilotController.cancelRequest);
router.get("/api/ai/cache", apiGuard, CopilotController.getCacheStats);

// Hypervisor active status simple ping endpoint
router.get("/api/status", (req, res) => {
  res.json({
    uptime: process.uptime(),
    message: "GURU-XD Host system active",
    timestamp: new Date()
  });
});

export default router;
