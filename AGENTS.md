# AGENTS.MD - GURU-XD AI AGENT GOVERNANCE INSTRUCTIONS

All AI Coding Agents working on this repository MUST strictly adhere to the **GURU-XD Production Governance v1.0** codified in `GOVERNANCE.md`.

## Mandatory Agent Guidelines

1. **Preserve Stability & Working Systems**:
   - Never rewrite stable modules or controllers.
   - Only apply additive, backwards-compatible extensions.
   - Protect existing database schemas, API routes, and user session state.

2. **Verification & Testing**:
   - Run `lint_applet` and `compile_applet` before completing any turn.
   - Ensure 0 type errors or compilation breaks.

3. **Architecture Protection**:
   - Audit module dependencies before modifications.
   - Maintain clear separation between services (`/server/services`), controllers (`/server/controllers.ts`), routes (`/server/routes.ts`), and client UI components (`/src/components`).

4. **Security & Observability**:
   - Never expose API keys or credentials to client bundles.
   - Use verified platform state (`aiContextEngine`, `backgroundTaskManager`, `toolRegistry`) instead of assumptions or mock data.
