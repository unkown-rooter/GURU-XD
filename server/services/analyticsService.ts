import { AppEventBus, AppEvent } from './eventBus';
import { AppObservation } from '../../src/types/appIntelligence';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private observations: AppObservation[] = [];
  private eventBus = AppEventBus.getInstance();

  private constructor() {
    this.listenToEvents();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private listenToEvents() {
    this.eventBus.subscribe('*', (event: AppEvent) => {
      if (event.type === 'OBSERVATION_RECORDED' && event.payload) {
        this.recordObservation(event.payload);
      }
    });
  }

  public recordObservation(obs: AppObservation): AppObservation {
    const formattedObs = {
      ...obs,
      id: obs.id || `obs-${Date.now()}`,
      timestamp: obs.timestamp || new Date().toISOString()
    };
    this.observations.unshift(formattedObs);
    if (this.observations.length > 500) {
      this.observations.pop();
    }
    return formattedObs;
  }

  public getObservations(appId?: string, limit: number = 20): AppObservation[] {
    let list = this.observations;
    if (appId) {
      list = list.filter(o => o.appId === appId);
    }
    return list.slice(0, limit);
  }

  public setObservations(observations: AppObservation[]): void {
    this.observations = observations;
  }
}
