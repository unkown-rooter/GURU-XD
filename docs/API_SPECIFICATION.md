# GURU-XD API Specification Summary

## Overview
All endpoints are available under `/api/v1/*` (versioned standard) and `/api/*` (backward compatibility alias). Authorization is enforced via `x-api-key` header or `apiKey` query parameter.

---

## Core Endpoint Directory

### Core System & Diagnostics
- `GET /api/v1/status` - System health ping and process uptime.
- `GET /api/v1/metrics` - Real-time API route latency, execution count, and error telemetry.
- `GET /api/v1/credentials` - Admin API key and env secrets status check.
- `GET /api/v1/data` - Telemetry fluctuation and JSON database state.

### Maintenance & Retention
- `GET /api/v1/retention` / `POST /api/v1/retention` - View/Update log retention policy.
- `GET /api/v1/maintenance` / `POST /api/v1/maintenance` - Toggle global system maintenance mode.

### Production Services (V9)
- `GET /api/v1/deployments/operations/health` - Platform Health 8-subsystem report.
- `GET /api/v1/deployments/operations/logs` - Query structured log entries.
- `GET /api/v1/deployments/reliability/backups` - List snapshot backups.
- `POST /api/v1/deployments/reliability/backups` - Trigger on-demand backup.
- `POST /api/v1/deployments/reliability/recovery/trigger` - Trigger point-in-time state restore.

### AI Copilot & Brain (V3/V4)
- `POST /api/v1/copilot/chat` - Natural language terminal execution with Gemini AI.
- `GET /api/v1/copilot/memory` / `POST /api/v1/copilot/memory` - View/Save AI memory context.
- `GET /api/v1/applications/intelligence/overview` - AI Brain 7-stage cognitive state.

### Deployment & Pipeline (V5)
- `GET /api/v1/deployments` - List deployment history.
- `POST /api/v1/deployments/trigger` - Trigger deployment.
- `POST /api/v1/deployments/:id/rollback` - Execute automated rollback.

### Security & User Management (V8)
- `POST /api/v1/auth/login` - Authenticate user credentials.
- `POST /api/v1/auth/verify-otp` - Verify TOTP 2FA code.
- `GET /api/v1/security-analyst/incidents` - List active security incidents.
