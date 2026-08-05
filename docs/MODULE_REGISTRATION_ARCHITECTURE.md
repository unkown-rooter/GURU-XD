# GURU-XD Production-Grade Module Registration & AI Discovery System Architecture Specification

## GURU-XD AI Core Orchestrator Engineering Directive
> **CRITICAL ARCHITECTURAL PRINCIPLE**:
> Throughout this specification and system implementation, the term **AI** refers exclusively to the **GURU-XD AI Core Orchestrator** — the platform's central intelligence.
>
> - It does **NOT** refer to external LLM providers (e.g., OpenAI, Gemini, Claude, Grok, DeepSeek, Ollama).
> - External providers are execution engines that may be consulted for language generation or code synthesis, but they are **not** responsible for understanding or managing the platform.
> - The sole responsibility for discovering, registering, understanding, monitoring, auditing, reasoning about, and orchestrating modules, services, APIs, routes, permissions, and dependencies belongs to the **GURU-XD AI Core Orchestrator**.

## Executive Summary
This document specifies the architectural design and production implementation of the **GURU-XD Module Registration & AI Discovery System** (Specification Version 2.5.0).

The system eliminates hardcoded module definitions across the platform, enabling every module (e.g. Dashboard, Analytics, Deployment Pipeline, Bot Manager, AI Security Sentinel) to register itself dynamically during application startup, publish standard manifests, expose reusable services, advertise fine-grained capabilities, emit typed pub/sub events, and automatically update the platform's internal Knowledge Graph and AI Core memory.

---

## Architectural Objectives & Component Mapping

| Objective | Component | Implementation File | Status |
|---|---|---|---|
| **1. Module Registry** | `ModuleRegistry` | `/server/modules/moduleRegistry.ts` | Production Ready |
| **2. Module Manifest** | `ModuleManifest` Schema & `ManifestValidator` | `/server/modules/manifestValidator.ts` | Production Ready |
| **3. Standard Module API** | `StandardGuruModule` Abstract Class | `/server/modules/standardModule.ts` | Production Ready |
| **4. Service Registry** | `ServiceRegistryEngine` | `/server/modules/serviceRegistryEngine.ts` | Production Ready |
| **5. Capability Registry** | `CapabilityRegistry` | `/server/modules/capabilityRegistry.ts` | Production Ready |
| **6. Event Registry** | `EventRegistryEngine` | `/server/modules/eventRegistryEngine.ts` | Production Ready |
| **7. AI Discovery Engine** | `AIDiscoveryEngine` | `/server/modules/aiDiscoveryEngine.ts` | Production Ready |
| **8. Knowledge Graph** | `KnowledgeGraphBuilder` | `/server/modules/knowledgeGraph.ts` | Production Ready |
| **9. Automated Audits** | `AuditEngine` | `/server/modules/auditEngine.ts` | Production Ready |
| **10. Security Validation** | `SecurityValidator` | `/server/modules/securityValidator.ts` | Production Ready |
| **11. Version Compatibility** | `VersionChecker` | `/server/modules/versionChecker.ts` | Production Ready |
| **12. AI Learning Pipeline** | `AIModuleLearningPipeline` | `/server/modules/aiLearningPipeline.ts` | Production Ready |
| **13. API & Visual UI** | REST Endpoints + `ModuleRegistrationArchitectureView` | `/server/routes.ts`, `/src/components/ModuleRegistrationArchitectureView.tsx` | Production Ready |

---

## 1. System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  GURU-XD AI CORE                                  |
|                                                                                   |
|    +------------------------+             +----------------------------------+    |
|    |  AIDiscoveryEngine     |<----------->|    ModuleKnowledgeGraph          |    |
|    |  (Zero-Hardcode Query) |             |  (Nodes: Modules/Services/Events)|    |
|    +-----------+------------+             +-----------------+----------------+    |
|                |                                            |                     |
+----------------|--------------------------------------------|---------------------+
                 |                                            |
                 v                                            v
+-----------------------------------------------------------------------------------+
|                              CENTRAL REGISTRY LAYER                               |
|                                                                                   |
|  +---------------------+   +-----------------------+   +-----------------------+  |
|  |   ModuleRegistry    |   | ServiceRegistryEngine |   |  CapabilityRegistry   |  |
|  | (Live Inventory)    |   | (Dynamic Invocation)  |   |  (Reasoning Engine)   |  |
|  +----------+----------+   +-----------+-----------+   +-----------+-----------+  |
|             |                          |                           |              |
|             +--------------------------+---------------------------+              |
|                                        |                                          |
|  +---------------------+   +-----------v-----------+   +-----------------------+  |
|  | EventRegistryEngine |   |      AuditEngine      |   |   SecurityValidator   |  |
|  | (Pub/Sub Event Bus) |   | (Continuous Health)   |   |   & VersionChecker    |  |
|  +---------------------+   +-----------------------+   +-----------------------+  |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                            REGISTERED MODULE INSTANCES                            |
|                                                                                   |
|  +-------------------+  +--------------------+  +-------------------+             |
|  |  DashboardModule  |  |  DeploymentModule  |  | BotManagerModule  |  ...etc     |
|  | (StandardGuruMod) |  | (StandardGuruMod)  |  | (StandardGuruMod) |             |
|  +-------------------+  +--------------------+  +-------------------+             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Standard Module Manifest Contract (`ModuleManifest`)

Every module includes a standard manifest JSON or TypeScript definition matching `ModuleManifest`:

```json
{
  "id": "mod-deployment-pipeline",
  "name": "Deployment Orchestrator",
  "version": "2.4.0",
  "description": "Multi-cloud container orchestration, zero-downtime deployment, and instant rollback.",
  "author": { "name": "GURU-XD DevOps Team" },
  "dependencies": [],
  "permissions": [
    { "id": "perm-deploy", "name": "Deploy Applications", "description": "Trigger container rollout", "level": "write" },
    { "id": "perm-rollback", "name": "Rollback Deployments", "description": "Revert to prior revision", "level": "admin" }
  ],
  "capabilities": [
    { "id": "cap-deploy", "name": "Deploy", "description": "Triggers multi-stage cloud deployment", "category": "Deployment" },
    { "id": "cap-rollback", "name": "Rollback", "description": "Reverts application to prior stable version", "category": "Deployment" }
  ],
  "services": [
    { "serviceKey": "deployment.deploy", "name": "Deploy Version", "description": "Deploys target release version." },
    { "serviceKey": "deployment.rollback", "name": "Rollback Release", "description": "Triggers emergency release rollback." }
  ],
  "events": [
    { "eventType": "deployment.started", "description": "Emitted when deployment pipeline initializes." },
    { "eventType": "deployment.completed", "description": "Emitted upon successful rollout." }
  ],
  "routes": [
    { "path": "/api/v1/deployment/deploy", "method": "POST", "description": "Trigger new deployment", "protected": true }
  ],
  "configuration": { "targetCloud": "gcp", "maxReplicas": 5 }
}
```

---

## 3. Standard Module Lifecycle Flow

Every module inherits from `StandardGuruModule` and executes the mandatory 8-stage lifecycle:

1. **`initialize()`**: Loads environment variables, validates local configuration, and prepares local memory structures.
2. **`register()`**: Submits the `ModuleManifest` to the central `ModuleRegistry`, `ServiceRegistryEngine`, `CapabilityRegistry`, and `EventRegistryEngine`.
3. **`start()`**: Spawns active background workers, socket listeners, or telemetry timers.
4. **`stop()`**: Pauses background execution without flushing state.
5. **`restart()`**: Performs sequential stop and start procedures.
6. **`health()`**: Returns real-time health score (0-100), execution metrics, and status (`HEALTHY` | `DEGRADED` | `UNHEALTHY`).
7. **`reload()`**: Hot-reloads configuration without container restart.
8. **`shutdown()`**: Performs resource teardown and unregisters services.

---

## 4. REST API Endpoint Specification

All endpoints are exposed under `/api/v1/modules/*`:

- `GET /api/v1/modules` — Retrieve live inventory of all registered modules and metadata.
- `GET /api/v1/modules/:id` — Retrieve metadata and live health report for a specific module.
- `GET /api/v1/modules/services` — Retrieve all registered reusable services across all modules.
- `POST /api/v1/modules/services/invoke` — Invoke a registered service by `serviceKey` with dynamic parameters.
- `GET /api/v1/modules/capabilities` — List all advertised platform capabilities.
- `GET /api/v1/modules/events` — Retrieve pub/sub event definitions and recent telemetry event logs.
- `GET /api/v1/modules/knowledge-graph` — Retrieve the generated Knowledge Graph (nodes & relationship edges).
- `POST /api/v1/modules/audit` — Execute an automated health, security, semver, and contract audit scan.
- `POST /api/v1/modules/ai-query` — Query the `AIDiscoveryEngine` (e.g., natural language reasoning queries).
- `POST /api/v1/modules/security-check` — Validate a candidate module manifest against security policies.

---

## 5. Security & Isolation Strategy

1. **Manifest Validation**: Evaluates module IDs for alphanumeric syntax, enforces semantic versioning, and validates service schemas.
2. **Permission Guarding**: Flags elevated `system` level permissions for mandatory administrative review.
3. **Route & Event Collision Prevention**: Audit Engine catches duplicate REST routes or conflicting event definitions during startup.
4. **Circular Dependency Detection**: Rejects self-referencing or cyclic module dependency links prior to execution.
5. **Zero-Hardcode Decoupling**: AI Core invokes services via `ServiceRegistryEngine.invokeService(key, params)` without raw static file imports.

---

## 6. Verification & Compliance
- **Backward Compatibility**: Fully backward compatible with existing GURU-XD services, `ServiceRegistry`, `routes.ts`, and frontend components.
- **Production Build**: Verified using `lint_applet` and `compile_applet`.
