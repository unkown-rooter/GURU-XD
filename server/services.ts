import { CopilotEngine } from "./copilotEngine";
import { DatabaseService } from "./db";

/**
 * Service to interface with Google Gemini AI models and CopilotEngine
 */
export class CopilotService {
  /**
   * Generates response from Gemini based on user prompt
   */
  public static async generateCopilotResponse(prompt: string, agentId: string = "guru-core"): Promise<string> {
    const res = await CopilotEngine.generateCopilotResponse(prompt, agentId);
    return res.response;
  }
}

/**
 * Bot Daemon Service to mimic active event listener loops and trigger live container logs
 */
export class BotDaemonService {
  /**
   * Generates some random simulated activities to write in the database logs periodically
   */
  public static generateSimulatedActivity() {
    const dbService = DatabaseService.getInstance();
    const db = dbService.read();
    
    const activeBots = db.bots.filter(b => b.status === "running");
    if (activeBots.length === 0) return;

    // Pick a random bot
    const bot = activeBots[Math.floor(Math.random() * activeBots.length)];
    
    const events = [
      { type: "info", tag: "GATEWAY", msg: "Successfully synchronized socket handshake with chat provider server." },
      { type: "success", tag: "HANDLER", msg: "Handled message update trigger [.alive] successfully in 45ms." },
      { type: "info", tag: "DB_STREAM", msg: "Flushed transient user message schemas into local storage." },
      { type: "warning", tag: "CONNECTION", msg: "Network jitter detected. Re-establishing secure duplex tunnel..." },
      { type: "success", tag: "GATEWAY", msg: "Socket tunnel connection stabilized. Retrying queued messages buffer." },
      { type: "info", tag: "COMPILER", msg: "Reloaded custom user scripts successfully without core service interruption." }
    ];

    const chosen = events[Math.floor(Math.random() * events.length)];
    dbService.addLog(chosen.type as any, `${bot.name.toUpperCase().replace(/\s+/g, "_")}/${chosen.tag}`, chosen.msg);
  }
}
