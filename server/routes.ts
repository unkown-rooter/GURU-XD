import { Router, Request, Response, NextFunction } from "express";
import { DatabaseService } from "./db";
import { dao } from "./dao";
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
  AnalyticsController,
  AppIntelligenceController,
  EnterpriseDeploymentController,
  DeploymentValidatorController,
  EnvConfigController,
  EngineeringGovernanceController,
  BotAdapterController
} from "./controllers";

const router = Router();
const v1Router = Router();
const dbService = DatabaseService.getInstance();

// ============================================================================
// ROUTE METRICS & MONITORING HOOKS
// ============================================================================
const routeMetricsMap = new Map<string, { hits: number; lastHit: string; totalDurationMs: number; errors: number }>();

function trackRouteMetrics(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const routeKey = `${req.method} ${req.route?.path || req.path}`;
    const duration = Date.now() - start;
    const existing = routeMetricsMap.get(routeKey) || { hits: 0, lastHit: "", totalDurationMs: 0, errors: 0 };
    existing.hits += 1;
    existing.lastHit = new Date().toISOString();
    existing.totalDurationMs += duration;
    if (res.statusCode >= 400) existing.errors += 1;
    routeMetricsMap.set(routeKey, existing);
  });
  next();
}

v1Router.use(trackRouteMetrics);

/**
 * @openapi
 * /api/v1/metrics:
 *   get:
 *     summary: Retrieve real-time endpoint execution metrics & telemetry
 *     tags: [Telemetry & Diagnostics]
 */
v1Router.get("/metrics", apiGuard, (req, res) => {
  const metrics: Record<string, any> = {};
  routeMetricsMap.forEach((val, key) => {
    metrics[key] = {
      ...val,
      avgDurationMs: val.hits > 0 ? Number((val.totalDurationMs / val.hits).toFixed(2)) : 0
    };
  });
  res.json({
    success: true,
    code: 200,
    message: "Endpoint execution metrics retrieved successfully",
    data: { metrics, totalTrackedRoutes: routeMetricsMap.size },
    metrics,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// 1. CORE SYSTEM & TELEMETRY ROUTES
// ============================================================================

/**
 * @openapi
 * /api/v1/database/metrics:
 *   get:
 *     summary: Database telemetry, metrics, and active storage driver status
 *     tags: [Core System]
 */
v1Router.get("/database/metrics", (req, res) => {
  res.json({
    success: true,
    metrics: dbService.getMetrics(),
    health: dbService.checkHealth()
  });
});

/**
 * @openapi
 * /api/v1/database/health:
 *   get:
 *     summary: Database connection health check
 *     tags: [Core System]
 */
v1Router.get("/database/health", (req, res) => {
  res.json({
    success: true,
    health: dbService.checkHealth()
  });
});

/**
 * @openapi
 * /api/v1/dao/stats:
 *   get:
 *     summary: DAO Layer global stats and cluster metrics
 *     tags: [Data Access Layer]
 */
v1Router.get("/dao/stats", (req, res) => {
  res.json({
    success: true,
    globalStats: dao.getGlobalStats(),
    clusterOverview: dao.bot.getClusterOverview(),
    metrics: dbService.getMetrics()
  });
});

/**
 * @openapi
 * /api/v1/dao/bots:
 *   get:
 *     summary: Query bots via BotDao with filtering & pagination
 *     tags: [Data Access Layer]
 */
v1Router.get("/dao/bots", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = req.query.search as string;
  const platform = req.query.platform as "WhatsApp" | "Telegram";

  let result;
  if (platform) {
    result = dao.bot.findMany((b) => b.platform === platform, { page, limit });
  } else if (search) {
    result = dao.bot.searchBots(search, { page, limit });
  } else {
    result = dao.bot.findAll(undefined, { page, limit });
  }

  res.json({ success: true, result });
});

/**
 * @openapi
 * /api/v1/dao/commands:
 *   get:
 *     summary: Query commands via CommandDao with filtering & pagination
 *     tags: [Data Access Layer]
 */
v1Router.get("/dao/commands", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = req.query.search as string;

  const result = search
    ? dao.command.searchCommands(search, { page, limit })
    : dao.command.findAll(undefined, { page, limit });

  res.json({ success: true, result });
});

/**
 * @openapi
 * /api/v1/dao/users:
 *   get:
 *     summary: Query users via UserDao with role filtering & password stripping
 *     tags: [Data Access Layer]
 */
v1Router.get("/dao/users", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = req.query.search as string;

  const result = dao.user.findAllSanitized(search, { page, limit });
  res.json({ success: true, result });
});

/**
 * @openapi
 * /api/v1/dao/audit-logs:
 *   get:
 *     summary: Query audit logs from AuditLogDao
 *     tags: [Data Access Layer]
 */
v1Router.get("/dao/audit-logs", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const userId = req.query.userId as string;
  const entity = req.query.entity as string;

  let result;
  if (userId) {
    result = dao.auditLog.findMany((entry) => entry.userId === userId || entry.entityId === userId, { page, limit });
  } else if (entity) {
    result = dao.auditLog.findByEntity(entity, { page, limit });
  } else {
    result = dao.auditLog.findAll({ page, limit });
  }
  res.json({ success: true, result });
});

/**
 * @openapi
 * /api/v1/users/:id/activity:
 *   get:
 *     summary: Fetch audit trail and activity log for a specific user ID
 *     tags: [Users]
 */
v1Router.get("/users/:id/activity", (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const result = dao.auditLog.findMany((entry) => entry.userId === id || entry.entityId === id, { page, limit });
  res.json({ success: true, userId: id, result });
});

/**
 * @openapi
 * /api/v1/database/snapshots:
 *   get:
 *     summary: List all database snapshots
 *   post:
 *     summary: Create a manual database snapshot
 */
v1Router.get("/database/snapshots", (req, res) => {
  res.json({
    success: true,
    snapshots: dbService.listSnapshots()
  });
});

v1Router.post("/database/snapshots", apiGuard, (req, res) => {
  const { tag } = req.body;
  const snap = dbService.createSnapshot(tag || "manual-ui");
  dbService.addLog("success", "DATABASE_ENGINE", `Created manual database snapshot: ${snap.id} (${snap.checksum.substring(0, 8)})`);
  res.json({
    success: true,
    snapshot: {
      id: snap.id,
      tag: snap.tag,
      timestamp: snap.timestamp,
      checksum: snap.checksum
    }
  });
});

v1Router.post("/database/snapshots/:id/restore", apiGuard, (req, res) => {
  const { id } = req.params;
  const ok = dbService.restoreFromSnapshot(id);
  if (ok) {
    dbService.addLog("warning", "DATABASE_ENGINE", `Restored database state from snapshot ID: ${id}`);
    res.json({ success: true, message: `Successfully restored database from snapshot ${id}` });
  } else {
    res.status(404).json({ success: false, message: `Snapshot ${id} not found or invalid` });
  }
});

/**
 * @openapi
 * /api/v1/data:
 *   get:
 *     summary: Telemetry fluctuation & database state fetch
 *     tags: [Core System]
 */
v1Router.get("/data", (req, res) => {
  dbService.fluctuateTelemetry();
  res.json(dbService.read());
});

/**
 * @openapi
 * /api/v1/credentials:
 *   get:
 *     summary: System security credentials check
 *     tags: [Core System]
 */
v1Router.get("/credentials", (req, res) => {
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

/**
 * @openapi
 * /api/v1/status:
 *   get:
 *     summary: System status ping
 *     tags: [Core System]
 */
v1Router.get("/status", (req, res) => {
  res.json({
    uptime: process.uptime(),
    message: "GURU-XD Host system active",
    timestamp: new Date()
  });
});

// ============================================================================
// 2. SUBSCRIPTION & MAINTENANCE & RETENTION ROUTES
// ============================================================================
v1Router.post("/subscription/upgrade", apiGuard, SubscriptionController.upgradeSubscription);

v1Router.get("/retention", (req, res) => {
  const db = dbService.read();
  if (!db.retentionPolicy) {
    db.retentionPolicy = {
      autoClear7Days: false,
      autoPurgeAuditLogs30Days: false,
      maxLogEntries: 150
    };
    dbService.write(db);
  }
  res.json({ success: true, retentionPolicy: db.retentionPolicy });
});

v1Router.post("/retention", apiGuard, (req, res) => {
  const { autoClear7Days, autoPurgeAuditLogs30Days, maxLogEntries } = req.body;
  const db = dbService.read();
  db.retentionPolicy = {
    autoClear7Days: !!autoClear7Days,
    autoPurgeAuditLogs30Days: !!autoPurgeAuditLogs30Days,
    maxLogEntries: typeof maxLogEntries === 'number' ? maxLogEntries : 150
  };
  
  dbService.enforceRetentionPolicy(db);
  dbService.addLog("success", "SYSTEM", `Retention policy updated. Auto-clear >7d: ${db.retentionPolicy.autoClear7Days}, Auto-purge audit logs >30d: ${db.retentionPolicy.autoPurgeAuditLogs30Days}, Max entries: ${db.retentionPolicy.maxLogEntries}`);
  dbService.write(db);
  res.json({ success: true, retentionPolicy: db.retentionPolicy, logs: db.logs });
});

v1Router.get("/maintenance", (req, res) => {
  const db = dbService.read();
  res.json({ success: true, maintenanceMode: !!db.maintenanceMode });
});

v1Router.post("/maintenance", apiGuard, (req, res) => {
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

// ============================================================================
// 3. MONGO CONFIG SCHEMAS
// ============================================================================
v1Router.get("/mongo/schemas", MongoConfigController.getSchemas);
v1Router.post("/mongo/schemas", apiGuard, MongoConfigController.updateSchemas);
v1Router.post("/mongo/config", apiGuard, MongoConfigController.updateConfig);
v1Router.post("/mongo/test-connection", apiGuard, MongoConfigController.testConnection);

// ============================================================================
// 4. DEPLOYMENT PIPELINE & INFRASTRUCTURE ROUTES
// ============================================================================
v1Router.post("/deployment/pipeline", apiGuard, DeploymentPipelineController.executePipeline);
v1Router.get("/deployment/events", DeploymentPipelineController.streamEvents);
v1Router.post("/deployment/session/new", apiGuard, DeploymentPipelineController.createSession);

v1Router.get("/deployments", apiGuard, DeploymentPipelineController.getDeployments);
v1Router.get("/deployments/resources", apiGuard, DeploymentPipelineController.getDeployableResources);
v1Router.get("/deployments/targets", apiGuard, DeploymentPipelineController.getDeploymentTargets);
v1Router.post("/deployments/trigger", apiGuard, DeploymentPipelineController.triggerDeployment);
v1Router.get("/deployments/:id", apiGuard, DeploymentPipelineController.getDeploymentDetails);
v1Router.post("/deployments/:id/rollback", apiGuard, DeploymentPipelineController.rollbackDeployment);

// Production Configuration (v2.0)
v1Router.get("/deployments/config/env", apiGuard, DeploymentPipelineController.getEnvVariables);
v1Router.post("/deployments/config/env", apiGuard, DeploymentPipelineController.upsertEnvVariable);
v1Router.delete("/deployments/config/env/:id", apiGuard, DeploymentPipelineController.deleteEnvVariable);
v1Router.get("/deployments/config/templates", apiGuard, DeploymentPipelineController.getEnvironmentTemplates);

v1Router.get("/deployments/ssl/certificates", apiGuard, DeploymentPipelineController.getSslCertificates);
v1Router.post("/deployments/ssl/:id/renew", apiGuard, DeploymentPipelineController.renewSslCertificate);

v1Router.get("/deployments/domains", apiGuard, DeploymentPipelineController.getCustomDomains);
v1Router.post("/deployments/domains", apiGuard, DeploymentPipelineController.registerCustomDomain);
v1Router.post("/deployments/domains/:id/verify", apiGuard, DeploymentPipelineController.verifyCustomDomain);

// Operations Center (v3.0)
v1Router.get("/deployments/operations/stats", apiGuard, DeploymentPipelineController.getOperationsMonitoringStats);
v1Router.get("/deployments/operations/logs", apiGuard, DeploymentPipelineController.getCentralizedLogs);
v1Router.post("/deployments/operations/logs", apiGuard, DeploymentPipelineController.recordLogEntry);
v1Router.get("/deployments/operations/logs/export", apiGuard, DeploymentPipelineController.exportLogs);
v1Router.get("/deployments/operations/health", apiGuard, DeploymentPipelineController.getHealthCheckSummary);
v1Router.post("/deployments/operations/health/probe", apiGuard, DeploymentPipelineController.triggerHealthCheck);
v1Router.get("/deployments/operations/performance", apiGuard, DeploymentPipelineController.getPerformanceOptimizationMetrics);

// Reliability Engine (v4.0)
v1Router.get("/deployments/reliability/storage-providers", apiGuard, DeploymentPipelineController.getStorageProvidersAndPolicies);
v1Router.get("/deployments/reliability/backups", apiGuard, DeploymentPipelineController.getBackups);
v1Router.post("/deployments/reliability/backups", apiGuard, DeploymentPipelineController.triggerBackup);
v1Router.post("/deployments/reliability/backups/:id/validate", apiGuard, DeploymentPipelineController.validateBackupIntegrity);
v1Router.get("/deployments/reliability/recovery/history", apiGuard, DeploymentPipelineController.getRecoveryHistory);
v1Router.post("/deployments/reliability/recovery/trigger", apiGuard, DeploymentPipelineController.triggerRecovery);
v1Router.get("/deployments/reliability/strategy/config", apiGuard, DeploymentPipelineController.getStrategyConfig);
v1Router.post("/deployments/reliability/strategy/config", apiGuard, DeploymentPipelineController.updateStrategyConfig);
v1Router.get("/deployments/reliability/strategy/transitions", apiGuard, DeploymentPipelineController.getTransitionHistory);
v1Router.post("/deployments/reliability/strategy/transitions", apiGuard, DeploymentPipelineController.executeStrategyTransition);

// Enterprise Deployment Platform (v5.0)
v1Router.get("/deployments/enterprise/pipelines", apiGuard, EnterpriseDeploymentController.getPipelines);
v1Router.post("/deployments/enterprise/pipelines", apiGuard, EnterpriseDeploymentController.createPipeline);
v1Router.post("/deployments/enterprise/pipelines/:pipelineId/execute", apiGuard, EnterpriseDeploymentController.executePipeline);
v1Router.get("/deployments/enterprise/pipelines/runs", apiGuard, EnterpriseDeploymentController.getPipelineRuns);

v1Router.post("/deployments/enterprise/security/audit", apiGuard, EnterpriseDeploymentController.runSecurityAudit);
v1Router.get("/deployments/enterprise/security/audit", apiGuard, EnterpriseDeploymentController.getSecurityAudit);

v1Router.get("/deployments/enterprise/notifications/channels", apiGuard, EnterpriseDeploymentController.getNotificationChannels);
v1Router.post("/deployments/enterprise/notifications/channels", apiGuard, EnterpriseDeploymentController.configureNotificationChannel);
v1Router.post("/deployments/enterprise/notifications/dispatch", apiGuard, EnterpriseDeploymentController.dispatchNotification);
v1Router.get("/deployments/enterprise/notifications/logs", apiGuard, EnterpriseDeploymentController.getNotificationLogs);

v1Router.get("/deployments/enterprise/releases", apiGuard, EnterpriseDeploymentController.getReleases);
v1Router.post("/deployments/enterprise/releases", apiGuard, EnterpriseDeploymentController.createRelease);
v1Router.post("/deployments/enterprise/releases/:releaseId/approve", apiGuard, EnterpriseDeploymentController.approveRelease);

v1Router.get("/deployments/enterprise/environments", apiGuard, EnterpriseDeploymentController.getEnvironmentStates);
v1Router.post("/deployments/enterprise/environments/promote", apiGuard, EnterpriseDeploymentController.promoteReleaseToEnvironment);
v1Router.get("/deployments/enterprise/environments/promotions", apiGuard, EnterpriseDeploymentController.getPromotionsHistory);

// Deployment Validator System
v1Router.post("/deployments/validator/run", apiGuard, DeploymentValidatorController.runValidation);
v1Router.get("/deployments/validator/history", apiGuard, DeploymentValidatorController.getValidationHistory);
v1Router.get("/deployments/validator/reports/:id", apiGuard, DeploymentValidatorController.getValidationReport);

// ============================================================================
// 5. BEHAVIOR LEARNING ENGINE & AI SECURITY ANALYST
// ============================================================================
v1Router.get("/behavior/profiles", apiGuard, BehaviorEngineController.getProfiles);
v1Router.get("/behavior/profile/:id", apiGuard, BehaviorEngineController.getProfile);
v1Router.post("/behavior/profile/:id/policy", apiGuard, BehaviorEngineController.updatePolicy);
v1Router.post("/behavior/profile/:id/rebaseline", apiGuard, BehaviorEngineController.rebaselineProfile);
v1Router.post("/behavior/profile/:id/policy-override", apiGuard, BehaviorEngineController.policyOverride);
v1Router.post("/behavior/profile/:id/toggle-status", apiGuard, BehaviorEngineController.toggleStatus);
v1Router.post("/behavior/profile/:id/simulate-spike", apiGuard, BehaviorEngineController.simulateSpike);
v1Router.get("/behavior/profile/:id/analytics", apiGuard, BehaviorEngineController.getAnalytics);
v1Router.get("/behavior/rules", apiGuard, BehaviorEngineController.getRules);
v1Router.post("/behavior/rules", apiGuard, BehaviorEngineController.addRule);
v1Router.get("/behavior/organization", apiGuard, BehaviorEngineController.getOrganizationOverview);
v1Router.get("/behavior/events", BehaviorEngineController.streamEvents);

v1Router.get("/security-analyst/incidents", apiGuard, SecurityAnalystController.getIncidents);
v1Router.get("/security-analyst/incidents/:id", apiGuard, SecurityAnalystController.getIncident);
v1Router.get("/security-analyst/stats", apiGuard, SecurityAnalystController.getStats);
v1Router.get("/security-analyst/historical", apiGuard, SecurityAnalystController.getHistorical);
v1Router.post("/security-analyst/investigate", apiGuard, SecurityAnalystController.triggerInvestigation);
v1Router.post("/security-analyst/incidents/:id/resolve", apiGuard, SecurityAnalystController.resolveIncident);
v1Router.post("/security-analyst/incidents/:id/dismiss", apiGuard, SecurityAnalystController.dismissIncident);
v1Router.post("/security-analyst/scan-prompt", apiGuard, SecurityAnalystController.scanPayload);
v1Router.get("/security-analyst/events", SecurityAnalystController.streamEvents);

// ============================================================================
// 6. INTELLIGENCE CENTER & PRODUCTION ANALYTICS
// ============================================================================
v1Router.get("/intelligence/overview", apiGuard, IntelligenceCenterController.getOverview);
v1Router.get("/intelligence/services", apiGuard, IntelligenceCenterController.getServices);
v1Router.post("/intelligence/register-module", apiGuard, IntelligenceCenterController.registerModule);
v1Router.get("/intelligence/telemetry", apiGuard, IntelligenceCenterController.getTelemetry);
v1Router.get("/intelligence/engineering-report", apiGuard, IntelligenceCenterController.getEngineeringReport);
v1Router.post("/intelligence/safe-auto-fix", apiGuard, IntelligenceCenterController.executeSafeAutoFix);
v1Router.get("/intelligence/verification-details", apiGuard, IntelligenceCenterController.getVerificationDetails);
v1Router.get("/intelligence/events", IntelligenceCenterController.streamEvents);

v1Router.get("/analytics/summary", apiGuard, AnalyticsController.getSummary);
v1Router.get("/analytics/charts", apiGuard, AnalyticsController.getCharts);
v1Router.get("/analytics/heatmap/:botId", apiGuard, AnalyticsController.getHeatmap);

// ============================================================================
// 7. BOT MANAGEMENT & CUSTOM COMMANDS & VIRTUAL FS & PLUGINS
// ============================================================================
v1Router.put("/bots/:id", apiGuard, BotController.updateBot);
v1Router.delete("/bots/:id", apiGuard, BotController.deleteBot);
v1Router.post("/bots/:id/start", apiGuard, BotController.startBot);
v1Router.post("/bots/:id/stop", apiGuard, BotController.stopBot);
v1Router.post("/bots/:id/restart", apiGuard, BotController.restartBot);
v1Router.post("/bots/start-all", apiGuard, BotController.startAllBots);
v1Router.post("/bots/stop-all", apiGuard, BotController.stopAllBots);
v1Router.post("/bots", apiGuard, BotController.createBot);

v1Router.post("/commands", apiGuard, CommandController.createCommand);
v1Router.put("/commands/:id/toggle", apiGuard, CommandController.toggleCommand);
v1Router.put("/commands/:id", apiGuard, CommandController.updateCommand);
v1Router.delete("/commands/:id", apiGuard, CommandController.deleteCommand);

v1Router.post("/files", apiGuard, FileController.createFile);
v1Router.put("/files", apiGuard, FileController.updateFile);
v1Router.delete("/files", apiGuard, FileController.deleteFile);

v1Router.put("/plugins/:id/install", apiGuard, PluginController.installPlugin);
v1Router.post("/plugins", apiGuard, PluginController.createPlugin);
v1Router.delete("/plugins/:id", apiGuard, PluginController.deletePlugin);
v1Router.put("/plugins/:id", apiGuard, PluginController.updatePlugin);

v1Router.put("/sessions/:id/disconnect", apiGuard, SessionController.disconnectSession);

// ============================================================================
// 8. AUTHENTICATION & USER MANAGEMENT
// ============================================================================
v1Router.post("/auth/login", rateLimiter(20, 60000), UserController.login);
v1Router.post("/auth/verify-otp", rateLimiter(20, 60000), UserController.verifyOtp);
v1Router.post("/auth/resend-otp", rateLimiter(10, 60000), UserController.resendOtp);
v1Router.post("/auth/register", rateLimiter(10, 60000), UserController.registerUser);
v1Router.post("/auth/forgot-password", rateLimiter(10, 60000), UserController.forgotPassword);
v1Router.post("/auth/github", rateLimiter(20, 60000), UserController.githubAuth);
v1Router.post("/auth/google", rateLimiter(20, 60000), UserController.googleAuth);
v1Router.post("/auth/microsoft", rateLimiter(20, 60000), UserController.microsoftAuth);
v1Router.get("/auth/me", UserController.getCurrentUser);
v1Router.post("/auth/logout", UserController.logout);
v1Router.post("/auth/logout-all", UserController.logoutAll);

v1Router.get("/auth/sessions", UserController.getSessions);
v1Router.delete("/auth/session/:id", UserController.deleteSession);
v1Router.get("/auth/login-history", UserController.getLoginHistory);

v1Router.post("/auth/enable-2fa", UserController.enable2FA);
v1Router.post("/auth/disable-2fa", UserController.disable2FA);
v1Router.get("/auth/recovery-codes", UserController.getRecoveryCodes);
v1Router.post("/auth/regenerate-codes", UserController.regenerateCodes);

v1Router.get("/auth/admin/security", UserController.getAdminSecurity);
v1Router.post("/auth/admin/unlock", UserController.unlockAccount);
v1Router.post("/auth/admin/block-ip", UserController.toggleBlockIp);

v1Router.post("/users", UserController.registerUser);
v1Router.put("/users/:id/toggle", apiGuard, UserController.toggleUserStatus);
v1Router.delete("/users/:id", apiGuard, UserController.deleteUser);

// ============================================================================
// 9. SYSTEM LOGS & AI TERMINAL COPILOT
// ============================================================================
v1Router.post("/logs", apiGuard, LogController.createLog);
v1Router.delete("/logs", apiGuard, LogController.clearLogs);

v1Router.post("/copilot/chat", rateLimiter(30, 60000), CopilotController.chat);
v1Router.get("/copilot/memory", apiGuard, CopilotController.getMemories);
v1Router.post("/copilot/memory", apiGuard, CopilotController.saveMemory);
v1Router.delete("/copilot/memory/:id", apiGuard, CopilotController.deleteMemory);

v1Router.get("/copilot/work-timeline", apiGuard, CopilotController.getWorkTimeline);
v1Router.post("/copilot/work-timeline", apiGuard, CopilotController.addWorkItem);
v1Router.get("/copilot/work/resume", apiGuard, CopilotController.resumeWorkContext);
v1Router.get("/copilot/suggestions", apiGuard, CopilotController.getSuggestions);

v1Router.get("/copilot/drafts", apiGuard, CopilotController.getDrafts);
v1Router.post("/copilot/drafts", apiGuard, CopilotController.saveDraft);

v1Router.get("/copilot/prompts", apiGuard, CopilotController.getPrompts);
v1Router.post("/copilot/prompts", apiGuard, CopilotController.savePrompt);
v1Router.delete("/copilot/prompts/:id", apiGuard, CopilotController.deletePrompt);

v1Router.post("/copilot/sandbox/validate", apiGuard, CopilotController.validateSandbox);
v1Router.post("/copilot/sandbox/deploy", apiGuard, CopilotController.deploySandbox);
v1Router.get("/copilot/sandbox/history", apiGuard, CopilotController.getSandboxHistory);
v1Router.post("/copilot/sandbox/rollback/:deploymentId", apiGuard, CopilotController.rollbackSandbox);

v1Router.post("/copilot/execute-tool", apiGuard, CopilotController.executeTool);
v1Router.get("/copilot/analytics", apiGuard, CopilotController.getAnalytics);
v1Router.get("/copilot/agents", apiGuard, CopilotController.getAgents);

v1Router.get("/ai/providers", apiGuard, CopilotController.getProviders);
v1Router.get("/ai/usage-audit", apiGuard, CopilotController.getRuntimeUsageAudit);
v1Router.get("/ai/queue", apiGuard, CopilotController.getQueue);
v1Router.post("/ai/cancel", apiGuard, CopilotController.cancelRequest);
v1Router.get("/ai/cache", apiGuard, CopilotController.getCacheStats);

// Environment Configuration Manager Routes
v1Router.get("/env/manager", apiGuard, EnvConfigController.getOverview);
v1Router.post("/env/manager/save", apiGuard, EnvConfigController.saveVariable);
v1Router.post("/env/manager/verify", apiGuard, EnvConfigController.verifyProviders);

// ============================================================================
// 10. APPLICATIONS INTELLIGENCE & AUTONOMOUS OPS
// ============================================================================
v1Router.get("/applications/intelligence/overview", apiGuard, AppIntelligenceController.getOverview);
v1Router.get("/applications/observations", apiGuard, AppIntelligenceController.getObservations);
v1Router.post("/applications/observations", apiGuard, AppIntelligenceController.recordObservation);
v1Router.get("/applications/:id/memory", apiGuard, AppIntelligenceController.getMemory);
v1Router.get("/applications/:id/understanding", apiGuard, AppIntelligenceController.getUnderstanding);
v1Router.get("/applications/:id/compare", apiGuard, AppIntelligenceController.getComparison);
v1Router.get("/applications/:id/analysis", apiGuard, AppIntelligenceController.getAnalysis);

v1Router.get("/applications/:id/predictions", apiGuard, AppIntelligenceController.getPredictions);
v1Router.get("/applications/:id/learning", apiGuard, AppIntelligenceController.getLearning);
v1Router.get("/applications/:id/adaptations", apiGuard, AppIntelligenceController.getAdaptations);
v1Router.post("/applications/:id/adaptations/:adaptationId/approve", apiGuard, AppIntelligenceController.approveAdaptation);
v1Router.post("/applications/:id/adaptations/:adaptationId/dismiss", apiGuard, AppIntelligenceController.dismissAdaptation);
v1Router.get("/applications/:id/recommendations", apiGuard, AppIntelligenceController.getRecommendations);
v1Router.get("/applications/:id/plans", apiGuard, AppIntelligenceController.getPlans);

v1Router.get("/applications/:id/automations", apiGuard, AppIntelligenceController.getAutomations);
v1Router.post("/applications/:id/automations/:ruleId/toggle", apiGuard, AppIntelligenceController.toggleAutomation);
v1Router.post("/applications/:id/automations/:ruleId/executions/:executionId/approve", apiGuard, AppIntelligenceController.approveAutomationAction);
v1Router.post("/applications/:id/automations/:ruleId/executions/:executionId/reject", apiGuard, AppIntelligenceController.rejectAutomationAction);
v1Router.get("/applications/:id/security", apiGuard, AppIntelligenceController.getSecurityCenter);
v1Router.get("/applications/:id/collaboration", apiGuard, AppIntelligenceController.getCollaborationTopology);
v1Router.get("/applications/reflection", apiGuard, AppIntelligenceController.getEcosystemReflection);
v1Router.get("/applications/improvement", apiGuard, AppIntelligenceController.getContinuousImprovementMetrics);
v1Router.get("/applications/ai-insights", apiGuard, AppIntelligenceController.getAIInsightsSummary);

v1Router.post("/applications/register", apiGuard, AppIntelligenceController.registerApp);
v1Router.post("/applications/:id/record-restart", apiGuard, AppIntelligenceController.recordRestart);
v1Router.post("/applications/:id/record-status", apiGuard, AppIntelligenceController.recordStatusChange);

// ============================================================================
// 11. ENGINEERING GOVERNANCE & ARCHITECTURE VERSIONS ENGINE (V0 - V7 SPECS)
// ============================================================================
v1Router.get("/governance/overview", apiGuard, EngineeringGovernanceController.getGovernanceOverview);
v1Router.get("/governance/versions", apiGuard, EngineeringGovernanceController.getVersions);
v1Router.post("/governance/versions/next", apiGuard, EngineeringGovernanceController.registerNextVersion);
v1Router.post("/governance/intent/classify", apiGuard, EngineeringGovernanceController.classifyIntent);
v1Router.get("/governance/knowledge", apiGuard, EngineeringGovernanceController.getKnowledge);
v1Router.post("/governance/decision/evaluate", apiGuard, EngineeringGovernanceController.evaluateDecision);
v1Router.get("/governance/workflows", apiGuard, EngineeringGovernanceController.getWorkflows);
v1Router.post("/governance/safety-check", apiGuard, EngineeringGovernanceController.verifySafetyCheck);
v1Router.get("/governance/audit-logs", apiGuard, EngineeringGovernanceController.getGovernanceAuditLogs);
v1Router.post("/governance/message/route", apiGuard, EngineeringGovernanceController.sendPlatformMessage);

// ============================================================================
// 12. BOT ADAPTER SERVICE ROUTES (Priority 1 - Baileys MD & Telegram Bridge)
// ============================================================================
v1Router.get("/bots/adapters", apiGuard, BotAdapterController.getAdapters);
v1Router.get("/bots/adapters/:botId/status", apiGuard, BotAdapterController.getAdapterStatus);
v1Router.post("/bots/adapters/:botId/connect", apiGuard, BotAdapterController.connectAdapter);
v1Router.post("/bots/adapters/:botId/disconnect", apiGuard, BotAdapterController.disconnectAdapter);
v1Router.post("/bots/adapters/:botId/send", apiGuard, BotAdapterController.sendAdapterMessage);
v1Router.post("/bots/adapters/:botId/webhook", apiGuard, BotAdapterController.handleAdapterWebhook);

// ============================================================================
// API ROUTER REGISTRATION (NON-BREAKING DUAL MOUNTING FOR /api/v1 AND /api)
// ============================================================================
// Mount v1 router under /api/v1 (New Versioned Routing Standard)
router.use("/api/v1", v1Router);

// Mount v1 router under /api (Preserves 100% Backward Compatibility)
router.use("/api", v1Router);

export default router;
