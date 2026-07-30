import { AppEventBus, AppEvent } from './eventBus';
import { AppStructuredMemory } from '../../src/types/appIntelligence';

export class MemoryService {
  private static instance: MemoryService;
  private memories: Map<string, AppStructuredMemory> = new Map();
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.listenToEvents();
  }

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  private listenToEvents() {
    this.eventBus.subscribe('*', (event: AppEvent) => {
      if (!event.appId) return;
      this.accumulateContext(event.appId, event);
    });
  }

  private accumulateContext(appId: string, event: AppEvent) {
    let memory = this.memories.get(appId);
    if (!memory) {
      memory = {
        appId,
        installationHistory: [],
        updateHistory: [],
        deploymentHistory: [],
        restartHistory: [],
        errorHistory: [],
        crashHistory: [],
        resourceHistory: [],
        uptimeHistory: [],
        configHistory: [],
        userActions: [],
        milestones: []
      };
      this.memories.set(appId, memory);
    }

    if (event.type === 'APP_RESTARTED') {
      memory.restartHistory.unshift({
        id: event.id,
        timestamp: event.timestamp,
        reason: event.payload?.reason || 'User manual restart',
        triggeredBy: event.source
      });
    } else if (event.type === 'USER_INTERACTION_RECORDED') {
      memory.userActions.unshift({
        id: event.id,
        timestamp: event.timestamp,
        action: event.payload?.action || event.type,
        user: event.payload?.user || 'operator'
      });
    } else if (event.type.includes('ALERT') || event.type.includes('FAILED')) {
      memory.errorHistory.unshift({
        id: event.id,
        timestamp: event.timestamp,
        errorMessage: event.payload?.details || 'System event alert',
        severity: 'error',
        resolved: false
      });
    }
  }

  public getMemory(appId: string): AppStructuredMemory | undefined {
    return this.memories.get(appId);
  }

  public setMemory(appId: string, memory: AppStructuredMemory): void {
    this.memories.set(appId, memory);
  }
}
