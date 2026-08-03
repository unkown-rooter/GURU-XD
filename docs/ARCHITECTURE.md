# GURU-XD System Architecture & Platform Integration (V1 - V9)

## Overview
GURU-XD is an enterprise-grade, autonomous multi-layer AI platform designed for high-availability application hosting, real-time intelligence telemetry, security analysis, automated deployment pipelines, and self-healing production services.

---

## Architectural Layers (V1 - V9)

### V1: API Gateway & Router Layer
- **Components**: `server/routes.ts`, `server/controllers.ts`, `server/middleware.ts`
- **Responsibility**: Express router mounting `/api/v1` and legacy `/api` endpoints with dual-mounting for 100% backward compatibility. Enforces API rate limiting, `apiGuard` authorization, and real-time route execution latency tracking.

### V2: Core Infrastructure & State Engine
- **Components**: `server/db.ts`, `server/serviceRegistry.ts`, `server/services/eventBus.ts`
- **Responsibility**:
  - `DatabaseService`: Thread-safe JSON file persistence engine storing bots, logs, sessions, and configuration state.
  - `ServiceRegistry`: Centralized dependency injection container managing singletons and service lifecycle states (`UNINITIALIZED`, `INITIALIZING`, `READY`, `DEGRADED`, `STOPPED`).
  - `AppEventBus`: Non-blocking, decoupled async pub/sub bus with dead-letter queueing and execution performance monitoring.

### V3: Cognitive Core & Intelligence Center
- **Components**: `server/memoryService.ts`, `server/behaviorEngine.ts`, `server/intelligenceCenter.ts`
- **Responsibility**: Real-time behavioral profile tracking, anomaly detection, telemetry aggregation, and intelligence event streaming.

### V4: AI Terminal Copilot & Autonomous AI Co-Brain
- **Components**: `server/copilotEngine.ts`, `server/ai/*`
- **Responsibility**: Natural language terminal agent powered by `@google/genai` Gemini SDK with sandbox code verification, memory persistence, work timeline tracking, and function call execution.

### V5: Enterprise Deployment & Infrastructure Pipeline
- **Components**: `server/deploymentPipeline.ts`, `server/services/enterpriseDeploymentService.ts`, `server/services/deploymentValidatorService.ts`
- **Responsibility**: Continuous integration/deployment pipeline supporting staged promotions, automated rollbacks, SSL certificate management, custom domain verification, and multi-cloud target validation.

### V6: Applications Manager & Runtime Engine
- **Components**: `server/services/applicationManager.ts`, `server/appIntelligenceService.ts`
- **Responsibility**: Autonomous application lifecycle tracking, runtime monitoring, status transitions, and self-correcting restart operations.

### V7: Analytics & Telemetry Engine
- **Components**: `server/services/analyticsService.ts`, `server/services/metricsService.ts`
- **Responsibility**: System metrics aggregation, heatmap visualization, operational performance charts, and audit telemetry reporting.

### V8: Security & Trust Platform
- **Components**: `server/securityAnalyst.ts`, `server/services/authService.ts`, `server/services/rbacService.ts`, `server/services/encryptionService.ts`, `server/services/trustService.ts`
- **Responsibility**: Multi-factor authentication, RBAC authorization, automated vulnerability scanning, AES-256 payload encryption, and real-time security incident response.

### V9: Production Services & Platform Reliability
- **Components**:
  - `CacheService`: Multi-tier L1 memory & L2 Redis cache with tag/pattern invalidation and cache warming.
  - `LoggingService`: Structured JSON log rotation with category indexing and CSV/JSON export.
  - `BackupService`: Automated AES-256 encrypted snapshot backup with SHA-256 integrity verification.
  - `RecoveryService`: Point-in-Time Recovery (PITR) and automatic rollback verification.
  - `PerformanceService`: CPU/Memory tracking, slow route detection, and event loop lag monitoring.
  - `ConfigService`: Dynamic environment configuration, feature flags, and revision rollbacks.
  - `PlatformHealthService`: Consolidated 8-subsystem health scoring and incident management.

---

## Inter-Layer Communication Flow
```
Client Request
      │
      ▼
 [V1 Routes / API Gateway]
      │
      ├──> [V8 Security / RBAC / Rate Limiter]
      │
      ▼
 [V1 Controllers]
      │
      ├──> [V2 ServiceRegistry] ──> Inject Singleton Instances
      │
      ├──> [V9 Production Services] (Cache, Config, Performance)
      │
      ├──> [V3 Memory / Behavior Engine] ──> [V4 Copilot AI Engine]
      │
      ├──> [V5 Deployment Pipeline] ──> [V6 Applications Engine]
      │
      ▼
 [V2 AppEventBus] ──> Asynchronous Broadcast to Telemetry & Audit Subscribers
```
