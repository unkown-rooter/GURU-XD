import { AppEventBus, AppEvent } from './eventBus';
import { MetricsService } from './metricsService';
import { NotificationService } from './notificationService';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertState = 'firing' | 'acknowledged' | 'resolved';

export interface AlertRule {
  id: string;
  name: string;
  metricName: string;
  category: string;
  threshold: number;
  condition: '>' | '<' | '>=' | '<=' | '==';
  severity: AlertSeverity;
  enabled: boolean;
  durationSeconds: number;
  description: string;
}

export interface ActiveAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  appId?: string;
  severity: AlertSeverity;
  state: AlertState;
  currentValue: number;
  threshold: number;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  message: string;
}

export interface ServiceDependencyStatus {
  serviceId: string;
  serviceName: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  lastCheck: string;
  dependencies: string[];
}

export interface MonitoringReport {
  timestamp: string;
  activeAlertsCount: number;
  firingAlerts: ActiveAlert[];
  monitoredServicesCount: number;
  overallTopologyHealth: 'healthy' | 'degraded' | 'critical';
  serviceStatuses: ServiceDependencyStatus[];
}

export class MonitoringService {
  private static instance: MonitoringService;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, ActiveAlert> = new Map();
  private alertHistory: ActiveAlert[] = [];
  private serviceStatuses: Map<string, ServiceDependencyStatus> = new Map();

  private eventBus = AppEventBus.getInstance();
  private metricsService = MetricsService.getInstance();
  private notificationService = NotificationService.getInstance();

  private constructor() {
    this.registerDefaultRules();
    this.registerDefaultServices();
    this.subscribeToEvents();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private registerDefaultRules() {
    const defaultRules: AlertRule[] = [
      {
        id: 'rule-high-cpu',
        name: 'High CPU Utilization',
        metricName: 'system.cpu.usage_pct',
        category: 'cpu',
        threshold: 85,
        condition: '>=',
        severity: 'critical',
        enabled: true,
        durationSeconds: 60,
        description: 'CPU usage exceeds critical threshold of 85%'
      },
      {
        id: 'rule-high-memory',
        name: 'High Memory Allocation',
        metricName: 'system.memory.used_mb',
        category: 'memory',
        threshold: 450,
        condition: '>=',
        severity: 'warning',
        enabled: true,
        durationSeconds: 120,
        description: 'Heap memory usage exceeds 450 MB limit'
      },
      {
        id: 'rule-high-error-rate',
        name: 'Elevated API Error Rate',
        metricName: 'system.api.error_rate_pct',
        category: 'api',
        threshold: 5.0,
        condition: '>=',
        severity: 'critical',
        enabled: true,
        durationSeconds: 30,
        description: 'API HTTP 5xx error rate exceeds 5.0%'
      }
    ];

    defaultRules.forEach(r => this.alertRules.set(r.id, r));
  }

  private registerDefaultServices() {
    const services: ServiceDependencyStatus[] = [
      {
        serviceId: 'srv-api-gateway',
        serviceName: 'API Gateway Engine',
        status: 'healthy',
        latencyMs: 8,
        lastCheck: new Date().toISOString(),
        dependencies: ['srv-auth', 'srv-app-manager']
      },
      {
        serviceId: 'srv-app-manager',
        serviceName: 'Application Management Engine',
        status: 'healthy',
        latencyMs: 12,
        lastCheck: new Date().toISOString(),
        dependencies: ['srv-database']
      },
      {
        serviceId: 'srv-ai-brain',
        serviceName: 'AI Intelligence Brain',
        status: 'healthy',
        latencyMs: 140,
        lastCheck: new Date().toISOString(),
        dependencies: ['srv-gemini-api']
      },
      {
        serviceId: 'srv-database',
        serviceName: 'Internal Relational Database',
        status: 'healthy',
        latencyMs: 4,
        lastCheck: new Date().toISOString(),
        dependencies: []
      }
    ];

    services.forEach(s => this.serviceStatuses.set(s.serviceId, s));
  }

  private subscribeToEvents() {
    this.eventBus.subscribe('*', (evt: AppEvent) => {
      this.evaluateEventForMonitoring(evt);
    });
  }

  private evaluateEventForMonitoring(evt: AppEvent) {
    if (evt.type === 'DEPLOYMENT_FAILED' || evt.type === 'SECURITY_ALERT_GENERATED') {
      this.triggerAlertDirect({
        ruleId: `event-${evt.type.toLowerCase()}`,
        ruleName: `Critical System Event: ${evt.type}`,
        appId: evt.appId,
        severity: 'critical',
        currentValue: 1,
        threshold: 0,
        message: `Monitored Event Triggered: ${evt.type} on source [${evt.source}]. Details: ${JSON.stringify(evt.payload || {})}`
      });
    }
  }

  public evaluateRules(): ActiveAlert[] {
    const newlyTriggered: ActiveAlert[] = [];
    const snapshot = this.metricsService.getSystemMetricsSnapshot();

    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      let value = 0;
      if (rule.category === 'cpu') value = snapshot.cpu.usagePercent;
      else if (rule.category === 'memory') value = snapshot.memory.heapUsedMb;
      else if (rule.category === 'api') value = snapshot.api.errorRatePct;

      const isViolated = this.checkCondition(value, rule.threshold, rule.condition);

      const existingAlert = this.activeAlerts.get(rule.id);

      if (isViolated) {
        if (!existingAlert) {
          const alert = this.triggerAlertDirect({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            currentValue: value,
            threshold: rule.threshold,
            message: rule.description
          });
          newlyTriggered.push(alert);
        }
      } else if (existingAlert && existingAlert.state === 'firing') {
        this.resolveAlert(existingAlert.id);
      }
    });

    return newlyTriggered;
  }

  private checkCondition(val: number, threshold: number, condition: AlertRule['condition']): boolean {
    switch (condition) {
      case '>': return val > threshold;
      case '<': return val < threshold;
      case '>=': return val >= threshold;
      case '<=': return val <= threshold;
      case '==': return val === threshold;
      default: return false;
    }
  }

  public triggerAlertDirect(params: {
    ruleId: string;
    ruleName: string;
    appId?: string;
    severity: AlertSeverity;
    currentValue: number;
    threshold: number;
    message: string;
  }): ActiveAlert {
    const alertId = `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const alert: ActiveAlert = {
      id: alertId,
      ruleId: params.ruleId,
      ruleName: params.ruleName,
      appId: params.appId,
      severity: params.severity,
      state: 'firing',
      currentValue: params.currentValue,
      threshold: params.threshold,
      triggeredAt: new Date().toISOString(),
      message: params.message
    };

    this.activeAlerts.set(alertId, alert);
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > 500) {
      this.alertHistory.pop();
    }

    // Publish to EventBus and NotificationService
    this.eventBus.publish('SECURITY_ALERT_GENERATED', { alert }, params.appId, 'MonitoringService');
    this.notificationService.notify({
      id: `notif-${alertId}`,
      timestamp: alert.triggeredAt,
      appId: alert.appId,
      severity: alert.severity === 'critical' ? 'critical' : 'warning',
      title: alert.ruleName,
      message: alert.message,
      read: false
    });

    return alert;
  }

  public acknowledgeAlert(alertId: string, user: string = 'operator'): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.state = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = user;
    return true;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.state = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    this.activeAlerts.delete(alertId);
    return true;
  }

  public getActiveAlerts(appId?: string): ActiveAlert[] {
    const list = Array.from(this.activeAlerts.values());
    if (appId) {
      return list.filter(a => a.appId === appId);
    }
    return list;
  }

  public getAlertHistory(limit: number = 50): ActiveAlert[] {
    return this.alertHistory.slice(0, limit);
  }

  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  public getMonitoringReport(): MonitoringReport {
    this.evaluateRules();
    const active = this.getActiveAlerts();
    const firing = active.filter(a => a.state === 'firing');
    const services = Array.from(this.serviceStatuses.values());

    const hasCritical = firing.some(a => a.severity === 'critical');
    const hasWarning = firing.some(a => a.severity === 'warning');

    let overallTopologyHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (hasCritical) overallTopologyHealth = 'critical';
    else if (hasWarning) overallTopologyHealth = 'degraded';

    return {
      timestamp: new Date().toISOString(),
      activeAlertsCount: active.length,
      firingAlerts: firing,
      monitoredServicesCount: services.length,
      overallTopologyHealth,
      serviceStatuses: services
    };
  }
}
