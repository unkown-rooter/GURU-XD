# ServiceRegistry & Lifecycle Management Guide

## Overview
`ServiceRegistry` is the central dependency injection container and service lifecycle coordinator in GURU-XD. It manages singletons, health checks, dependency resolution, startup ordering, and clean shutdown sequences.

---

## Lifecycle States
Every registered service transitions through standard lifecycle states:

```
 [UNINITIALIZED] ──> [INITIALIZING] ──> [READY] ──> [DEGRADED] ──> [STOPPED]
```

1. **UNINITIALIZED**: Service registered in registry metadata, constructor not yet executed.
2. **INITIALIZING**: Dependencies being injected and warm-up tasks running.
3. **READY**: Service fully initialized, passing health checks, ready for requests.
4. **DEGRADED**: Service operational but experiencing elevated latency or dependency errors.
5. **STOPPED**: Gracefully shut down during system termination.

---

## Registered Services Registry

| Service Key | Class Name | Layer | Singleton Instance Method |
| :--- | :--- | :--- | :--- |
| `database` | `DatabaseService` | V2 | `DatabaseService.getInstance()` |
| `serviceRegistry` | `ServiceRegistry` | V2 | `ServiceRegistry.getInstance()` |
| `eventBus` | `AppEventBus` | V2 | `AppEventBus.getInstance()` |
| `memory` | `MemoryService` | V3 | `MemoryService.getInstance()` |
| `behaviorEngine` | `BehaviorEngine` | V3 | `BehaviorEngine.getInstance()` |
| `intelligenceCenter` | `IntelligenceCenter` | V3 | `IntelligenceCenter.getInstance()` |
| `copilotEngine` | `CopilotEngine` | V4 | `CopilotEngine.getInstance()` |
| `deploymentPipeline` | `DeploymentPipelineService` | V5 | `DeploymentPipelineService.getInstance()` |
| `enterpriseDeployment` | `EnterpriseDeploymentService` | V5 | `EnterpriseDeploymentService.getInstance()` |
| `deploymentValidator` | `DeploymentValidatorService` | V5 | `DeploymentValidatorService.getInstance()` |
| `applicationManager` | `ApplicationManagerService` | V6 | `ApplicationManagerService.getInstance()` |
| `appIntelligence` | `AppIntelligenceService` | V6 | `AppIntelligenceService.getInstance()` |
| `analytics` | `AnalyticsService` | V7 | `AnalyticsService.getInstance()` |
| `metrics` | `MetricsService` | V7 | `MetricsService.getInstance()` |
| `securityAnalyst` | `SecurityAnalyst` | V8 | `SecurityAnalyst.getInstance()` |
| `auth` | `AuthService` | V8 | `AuthService.getInstance()` |
| `rbac` | `RBACService` | V8 | `RBACService.getInstance()` |
| `encryption` | `EncryptionService` | V8 | `EncryptionService.getInstance()` |
| `trust` | `TrustService` | V8 | `TrustService.getInstance()` |
| `cache` | `CacheService` | V9 | `CacheService.getInstance()` |
| `logging` | `LoggingService` | V9 | `LoggingService.getInstance()` |
| `backup` | `BackupService` | V9 | `BackupService.getInstance()` |
| `recovery` | `RecoveryService` | V9 | `RecoveryService.getInstance()` |
| `performance` | `PerformanceService` | V9 | `PerformanceService.getInstance()` |
| `config` | `ConfigService` | V9 | `ConfigService.getInstance()` |
| `platformHealth` | `PlatformHealthService` | V9 | `PlatformHealthService.getInstance()` |

---

## Graceful Shutdown Sequence
During SIGTERM or SIGINT process termination:
1. Stop inbound traffic acceptance via API Gateway.
2. Flush `CacheService` and pending `LoggingService` queues.
3. Trigger final state snapshot via `BackupService`.
4. Publish `SYSTEM_SHUTDOWN` event to `AppEventBus`.
5. Transition all services to `STOPPED` state.
6. Exit node process cleanly with code 0.
