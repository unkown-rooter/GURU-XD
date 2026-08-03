# Security, Trust & Governance Specification

## Overview
GURU-XD implements a zero-trust defense-in-depth framework featuring API key authentication, Role-Based Access Control (RBAC), multi-factor authentication (2FA), AES-256 CBC/GCM encryption, rate limiting, and real-time security analyst monitoring.

---

## Defense-in-Depth Security Matrix

### 1. Authentication & Session Management (`AuthService`, `UserController`)
- **API Key Guard (`apiGuard`)**: Checks `x-api-key` header or query parameter against `ADMIN_API_KEY`.
- **OTP & 2FA**: Multi-factor authentication with 6-digit TOTP verification and backup recovery codes.
- **Session Tracking**: Active user session indexing with remote revocation (`logoutAll`).

### 2. Role-Based Access Control (`RBACService`, `PermissionService`)
- **Roles**: `SuperAdmin`, `Admin`, `Operator`, `Viewer`.
- **Granular Permissions**:
  - `READ_METRICS`, `WRITE_CONFIG`, `EXECUTE_DEPLOYMENT`, `MANAGE_USERS`, `TRIGGER_RECOVERY`.

### 3. Payload Encryption & Secret Management (`EncryptionService`, `ConfigService`)
- **Encryption Standard**: AES-256 CBC with SHA-256 key derivation.
- **Secret Masking**: Automatically masks configuration keys tagged as `isSecret: true` in API output (`******`).

### 4. Behavioral Security Analyst (`SecurityAnalyst`)
- **Automated Anomaly Detection**: Detects brute-force login attempts, unauthorized API key scans, and unexpected payload spikes.
- **Auto-Mitigation**: Automatically locks compromised user accounts or blocks offending IP addresses.

### 5. Audit Logging & Compliance (`AuditSecurityService`, `LoggingService`)
- **Structured Audit Stream**: Every administrative action, configuration change, deployment trigger, and user state modification generates a persistent, tamper-evident audit record.
