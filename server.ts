import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import router from "./server/routes";
import { requestLogger, errorHandler, securityHeadersMiddleware, correlationIdMiddleware } from "./server/middleware";
import { BotDaemonService } from "./server/services";
import { bootstrapModuleSystem } from "./server/modules";
import { initializeGURUXDToolInfrastructure } from "./server/tools";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Bootstrap production-grade Module Registration & AI Discovery System
  await bootstrapModuleSystem().catch(err => {
    console.error("[MODULE REGISTRY] Failed to bootstrap module system:", err);
  });

  // Initialize Tooling Infrastructure
  initializeGURUXDToolInfrastructure();

  // Security Headers, CORS & Correlation Tracing
  app.use(securityHeadersMiddleware);
  app.use(correlationIdMiddleware);

  // JSON Body Parser
  app.use(express.json());

  // Terminal request logging middleware
  app.use(requestLogger);

  // Mount API router
  app.use(router);

  // Background activity daemon to periodically generate telemetry chatter for active bots
  const activityInterval = setInterval(() => {
    BotDaemonService.generateSimulatedActivity();
  }, 20000); // every 20 seconds

  // Vite integration / Static production assets serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Fallback global error interceptor
  app.use(errorHandler);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\x1b[35m[HYPERVISOR CORES READY]\x1b[0m GURU-XD Server listening on: http://localhost:${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log("\x1b[33mShutdown signal received. Cleansing daemon queues...\x1b[0m");
    clearInterval(activityInterval);
    server.close(() => {
      console.log("\x1b[32mProcess terminated safely.\x1b[0m");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();
