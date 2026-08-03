# AppEventBus Specification & Event Directory

## Overview
`AppEventBus` is the central async event backbone for GURU-XD. It decouples core system components, enables real-time WebSocket/SSE streaming, drives automated audit logging, and triggers background health/security alerts.

---

## Architecture & Features

1. **Decoupled Async Delivery**: Handlers run via `setImmediate` to prevent blocking the HTTP event loop.
2. **Dead Letter Queue (DLQ)**: Failed handlers are captured with error stack, payload snapshot, and retry metadata.
3. **Delivery Telemetry**: Tracks delivery duration, success count, failure count, and listener registration stats.
4. **Wildcard & Category Filtering**: Supports scoped category channels (`LOG_ALERT`, `SECURITY`, `DEPLOYMENT`, `CONFIG`, `CACHE`).

---

## System Event Directory

| Event Name | Publisher | Payload Description | Subscribers |
| :--- | :--- | :--- | :--- |
| `CACHE_REDIS_CONNECTED` | `CacheService` | Redis host, port, cluster mode | Telemetry, PlatformHealth |
| `CACHE_FLUSHED` | `CacheService` | Timestamp, caller | Logging, Audit |
| `CACHE_WARMED_UP` | `CacheService` | Loaded keys count, duration ms | Telemetry, Analytics |
| `LOG_ALERT_TRIGGERED` | `LoggingService` | Log ID, level, category, message, source | SecurityAnalyst, Notifications |
| `BACKUP_COMPLETED` | `BackupService` | Snapshot ID, size, record count | RecoveryService, PlatformHealth |
| `BACKUP_FAILED` | `BackupService` | Snapshot ID, error message | RecoveryService, IncidentManager |
| `RECOVERY_STARTED` | `RecoveryService` | Recovery ID, snapshot ID, dry run flag | AuditService, DeploymentPipeline |
| `RECOVERY_COMPLETED` | `RecoveryService` | Recovery ID, duration ms, restored count | PlatformHealth, Logging |
| `RECOVERY_FAILED` | `RecoveryService` | Recovery ID, error, rollback status | IncidentManager, SecurityAnalyst |
| `PERFORMANCE_BOTTLENECK_DETECTED` | `PerformanceService` | Type (Slow Route / Lag), duration ms | CopilotEngine, PlatformHealth |
| `CONFIGURATION_CHANGED` | `ConfigService` | Key/Feature flag, revision, actor | CacheService, AppRuntime |
| `HEALTH_CHANGED` | `PlatformHealthService` | Old status, new status, overall score | NotificationService, Dashboard |
| `DEPLOYMENT_COMPLETED` | `DeploymentPipeline` | Deployment ID, status, target | Analytics, ApplicationManager |
| `SECURITY_INCIDENT_RAISED` | `SecurityAnalyst` | Incident ID, severity, target | NotificationService, Audit |

---

## Performance & Reliability Metrics
- **Avg Delivery Duration**: < 1.0 ms
- **Max DLQ Capacity**: 500 entries (auto-pruned)
- **Thread Safety**: Concurrent-safe Node.js `EventEmitter` wrapping with custom listener tracking
