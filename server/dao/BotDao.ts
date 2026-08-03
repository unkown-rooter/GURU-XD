import { BaseDao } from "./BaseDao";
import { Bot } from "../db";
import { PaginationOptions, PaginatedResult } from "./types";
import { BotSchema, validateWithSchema, validatePartialWithSchema } from "./schemas";

export class BotDao extends BaseDao<Bot> {
  constructor() {
    super("bots", "Bot");
  }

  protected override validateItem(bot: Partial<Bot>, isUpdate: boolean = false): any {
    super.validateItem(bot, isUpdate);
    if (isUpdate) {
      return validatePartialWithSchema(BotSchema, bot, "Bot");
    } else {
      return validateWithSchema(BotSchema, bot, "Bot");
    }
  }

  /**
   * Filter bots by messaging platform (WhatsApp or Telegram)
   */
  public findByPlatform(platform: "WhatsApp" | "Telegram"): Bot[] {
    return this.getCollection().filter((bot) => bot.platform === platform);
  }

  /**
   * Get all active/running bots
   */
  public findActiveBots(): Bot[] {
    return this.getCollection().filter((bot) => bot.status === "running");
  }

  /**
   * Search bots by name, platform, or version
   */
  public searchBots(query: string, pagination?: PaginationOptions): PaginatedResult<Bot> {
    return this.findAll(
      {
        search: query,
        searchFields: ["name", "platform", "version", "prefix"]
      },
      pagination
    );
  }

  /**
   * Update real-time bot performance metrics safely
   */
  public updateMetrics(
    botId: string,
    metrics: { cpu?: number; memory?: string; ping?: number; messagesToday?: number }
  ): Bot | null {
    const bot = this.findById(botId);
    if (!bot) return null;

    const updated = {
      ...bot,
      cpu: metrics.cpu !== undefined ? metrics.cpu : bot.cpu,
      memory: metrics.memory !== undefined ? metrics.memory : bot.memory,
      ping: metrics.ping !== undefined ? metrics.ping : bot.ping,
      messagesToday: metrics.messagesToday !== undefined ? metrics.messagesToday : bot.messagesToday
    };

    return this.update(botId, updated, "METRICS_ENGINE");
  }

  /**
   * Get total cluster summary metrics across all bot instances
   */
  public getClusterOverview() {
    const bots = this.getCollection();
    const totalBots = bots.length;
    const runningBots = bots.filter((b) => b.status === "running").length;
    const totalCommands = bots.reduce((acc, b) => acc + (b.commandsCount || 0), 0);
    const totalMessages = bots.reduce((acc, b) => acc + (b.messagesToday || 0), 0);

    return {
      totalBots,
      runningBots,
      stoppedBots: totalBots - runningBots,
      totalCommandsExecuted: totalCommands,
      totalMessagesToday: totalMessages,
      healthRatio: totalBots > 0 ? (runningBots / totalBots) * 100 : 0
    };
  }
}
