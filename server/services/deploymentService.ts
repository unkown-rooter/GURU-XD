import { AppEventBus, AppEvent } from './eventBus';
import { AuditService } from './auditService';
import { NotificationService } from './notificationService';

export type DeployableResourceType = 'application' | 'instance' | 'agent' | 'api' | 'website' | 'worker' | 'plugin';
export type DeploymentTargetType = 'docker-container' | 'kubernetes-cluster' | 'serverless-function' | 'bare-metal';
export type DeploymentStatus = 'Queued' | 'Building' | 'Scanning' | 'Deploying' | 'HealthCheck' | 'Active' | 'Failed' | 'RolledBack';

export interface DeployableResource {
  id: string;
  name: string;
  resourceType: DeployableResourceType;
  sourceRepo?: string;
  version: string;
  status: 'active' | 'stopped' | 'deploying' | 'failed';
  targetId: string;
  envVars?: Record<string, string>;
  cpuLimit?: string;
  memoryLimit?: string;
  replicas?: number;
  updatedAt: string;
}

export interface DeploymentTarget {
  id: string;
  name: string;
  type: DeploymentTargetType;
  status: 'healthy' | 'degraded' | 'maintenance';
  clusterName?: string;
  dockerVersion?: string;
  k8sVersion?: string;
  activeWorkloads: number;
  totalMemoryGb: number;
  usedMemoryGb: number;
  totalCpuCores: number;
  usedCpuCores: number;
  endpointUrl: string;
}

export interface DeploymentStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  details: string;
}

export interface DeploymentRecord {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: DeployableResourceType;
  targetId: string;
  targetType: DeploymentTargetType;
  branch: string;
  commitHash: string;
  commitMessage: string;
  status: DeploymentStatus;
  author: string;
  createdAt: string;
  duration: string;
  logs: string[];
  stages: DeploymentStage[];
  containerImage: string;
  kubernetesNamespace?: string;
  rollbackVersion?: string;
  manifests?: {
    dockerfile: string;
    dockerCompose: string;
    k8sDeployment: string;
    k8sService: string;
    k8sIngress: string;
    k8sConfigMap: string;
  };
}

export class DeploymentService {
  private static instance: DeploymentService;
  private eventBus = AppEventBus.getInstance();
  private auditService = AuditService.getInstance();
  private notificationService = NotificationService.getInstance();

  private resources: Map<string, DeployableResource> = new Map();
  private targets: Map<string, DeploymentTarget> = new Map();
  private deployments: Map<string, DeploymentRecord> = new Map();

  private constructor() {
    this.seedDefaultTargetsAndResources();
    this.listenToEventBus();
  }

  public static getInstance(): DeploymentService {
    if (!DeploymentService.instance) {
      DeploymentService.instance = new DeploymentService();
    }
    return DeploymentService.instance;
  }

  private seedDefaultTargetsAndResources() {
    // 1. Production Deployment Targets
    const dockerTarget: DeploymentTarget = {
      id: 'target-docker-01',
      name: 'GURU-XD Primary Docker Engine',
      type: 'docker-container',
      status: 'healthy',
      dockerVersion: 'Docker Engine v26.1.4',
      activeWorkloads: 6,
      totalMemoryGb: 32,
      usedMemoryGb: 12.4,
      totalCpuCores: 16,
      usedCpuCores: 3.8,
      endpointUrl: 'unix:///var/run/docker.sock'
    };

    const k8sTarget: DeploymentTarget = {
      id: 'target-k8s-01',
      name: 'GURU-XD Production Kubernetes Cluster',
      type: 'kubernetes-cluster',
      status: 'healthy',
      clusterName: 'guru-k8s-prod-us-east1',
      k8sVersion: 'v1.30.2+k3s1',
      activeWorkloads: 12,
      totalMemoryGb: 128,
      usedMemoryGb: 48.2,
      totalCpuCores: 64,
      usedCpuCores: 18.5,
      endpointUrl: 'https://k8s-api.guru-xd.internal:6443'
    };

    const serverlessTarget: DeploymentTarget = {
      id: 'target-serverless-01',
      name: 'GURU-XD Cloud Run Serverless Mesh',
      type: 'serverless-function',
      status: 'healthy',
      activeWorkloads: 8,
      totalMemoryGb: 64,
      usedMemoryGb: 8.1,
      totalCpuCores: 32,
      usedCpuCores: 2.2,
      endpointUrl: 'https://serverless.guru-xd.internal'
    };

    const baremetalTarget: DeploymentTarget = {
      id: 'target-baremetal-01',
      name: 'GURU-XD Bare-Metal Daemon Host',
      type: 'bare-metal',
      status: 'healthy',
      activeWorkloads: 2,
      totalMemoryGb: 16,
      usedMemoryGb: 4.0,
      totalCpuCores: 8,
      usedCpuCores: 1.1,
      endpointUrl: 'systemd://localhost'
    };

    this.targets.set(dockerTarget.id, dockerTarget);
    this.targets.set(k8sTarget.id, k8sTarget);
    this.targets.set(serverlessTarget.id, serverlessTarget);
    this.targets.set(baremetalTarget.id, baremetalTarget);

    // 2. Default Deployable Resources across Applications, Bots, Agents, APIs, Plugins, Workers
    const defaultResources: DeployableResource[] = [
      {
        id: 'res-app-1',
        name: 'guru-whatsapp-master',
        resourceType: 'instance',
        sourceRepo: 'github.com/guru-xd/whatsapp-bot-master',
        version: 'v2.4.1',
        status: 'active',
        targetId: dockerTarget.id,
        envVars: { SESSION_ID: 'guru_wa_88329', PREFIX: '.' },
        cpuLimit: '500m',
        memoryLimit: '512Mi',
        replicas: 1,
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'res-app-2',
        name: 'guru-telegram-sentinel',
        resourceType: 'instance',
        sourceRepo: 'github.com/guru-xd/telegram-sentinel',
        version: 'v1.8.0',
        status: 'active',
        targetId: dockerTarget.id,
        envVars: { BOT_TOKEN: '778392019:AAFx...', DEBUG: 'false' },
        cpuLimit: '250m',
        memoryLimit: '256Mi',
        replicas: 1,
        updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'res-app-3',
        name: 'ai-copilot-agent-service',
        resourceType: 'agent',
        sourceRepo: 'github.com/guru-xd/ai-agent-service',
        version: 'v3.1.0',
        status: 'active',
        targetId: k8sTarget.id,
        envVars: { MODEL: 'gemini-3.5-flash', MAX_TOKENS: '4096' },
        cpuLimit: '1000m',
        memoryLimit: '2048Mi',
        replicas: 2,
        updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'res-app-4',
        name: 'express-auth-microservice',
        resourceType: 'api',
        sourceRepo: 'github.com/guru-xd/express-auth',
        version: 'v1.2.4',
        status: 'active',
        targetId: k8sTarget.id,
        envVars: { JWT_SECRET: 'guru_super_secret_key_2026' },
        cpuLimit: '500m',
        memoryLimit: '512Mi',
        replicas: 3,
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'res-app-5',
        name: 'guru-analytics-worker',
        resourceType: 'worker',
        sourceRepo: 'github.com/guru-xd/analytics-worker',
        version: 'v1.0.2',
        status: 'active',
        targetId: serverlessTarget.id,
        envVars: { BATCH_SIZE: '100' },
        cpuLimit: '250m',
        memoryLimit: '256Mi',
        replicas: 1,
        updatedAt: new Date(Date.now() - 3600000 * 48).toISOString()
      },
      {
        id: 'res-app-6',
        name: 'security-audit-plugin',
        resourceType: 'plugin',
        sourceRepo: 'github.com/guru-xd/plugins-security',
        version: 'v1.1.0',
        status: 'active',
        targetId: dockerTarget.id,
        envVars: { STRICT_MODE: 'true' },
        cpuLimit: '100m',
        memoryLimit: '128Mi',
        replicas: 1,
        updatedAt: new Date(Date.now() - 3600000 * 72).toISOString()
      }
    ];

    defaultResources.forEach(res => this.resources.set(res.id, res));

    // 3. Initial Seed Deployment History Records
    const seedDeployments: DeploymentRecord[] = [
      {
        id: 'dep-101',
        resourceId: 'res-app-1',
        resourceName: 'guru-whatsapp-master',
        resourceType: 'instance',
        targetId: dockerTarget.id,
        targetType: 'docker-container',
        branch: 'main',
        commitHash: 'a8f93e2',
        commitMessage: 'feat(wa): upgrade baileys socket engine to v6.5',
        status: 'Active',
        author: 'root-admin',
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        duration: '42s',
        containerImage: 'registry.guru-xd.internal/guru-whatsapp-master:a8f93e2',
        logs: [
          '[06:24:01] [SOURCE] Fetched branch main @ commit a8f93e2',
          '[06:24:05] [DOCKER] Building Dockerfile container image tag registry.guru-xd.internal/guru-whatsapp-master:a8f93e2',
          '[06:24:20] [SCAN] Vulnerability scan: 0 Critical, 0 High vulnerabilities detected',
          '[06:24:28] [DOCKER] Container container-wa-master started successfully on daemon target-docker-01',
          '[06:24:35] [HEALTH] Liveness check passed (HTTP 200 /health)',
          '[06:24:42] [TRAFFIC] Active traffic handoff complete. Deployment dep-101 is LIVE.'
        ],
        stages: this.generateDefaultStages('completed'),
        manifests: this.generateManifests('guru-whatsapp-master', 'instance', '500m', '512Mi', 1)
      },
      {
        id: 'dep-100',
        resourceId: 'res-app-3',
        resourceName: 'ai-copilot-agent-service',
        resourceType: 'agent',
        targetId: k8sTarget.id,
        targetType: 'kubernetes-cluster',
        branch: 'production',
        commitHash: '7c42b10',
        commitMessage: 'fix(copilot): optimize vector store caching layer',
        status: 'Active',
        author: 'ai-sys-bot',
        createdAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
        duration: '1m 14s',
        containerImage: 'registry.guru-xd.internal/ai-copilot-agent-service:7c42b10',
        kubernetesNamespace: 'guru-ai-prod',
        logs: [
          '[04:30:00] [K8S] Syncing Kubernetes manifests to cluster guru-k8s-prod-us-east1',
          '[04:30:15] [K8S] Applied Deployment/ai-copilot-agent-service, Service/ai-copilot-agent-service in namespace guru-ai-prod',
          '[04:30:40] [K8S] Pod rollout status: 2/2 ready',
          '[04:31:14] [HEALTH] Readiness probe verified 2 replicas responding'
        ],
        stages: this.generateDefaultStages('completed'),
        manifests: this.generateManifests('ai-copilot-agent-service', 'agent', '1000m', '2048Mi', 2)
      },
      {
        id: 'dep-099',
        resourceId: 'res-app-4',
        resourceName: 'express-auth-microservice',
        resourceType: 'api',
        targetId: k8sTarget.id,
        targetType: 'kubernetes-cluster',
        branch: 'main',
        commitHash: '9d20f44',
        commitMessage: 'sec(auth): enforce strict rate limits on OAuth token endpoint',
        status: 'Active',
        author: 'dev-lead',
        createdAt: new Date(Date.now() - 1000 * 3600 * 6).toISOString(),
        duration: '58s',
        containerImage: 'registry.guru-xd.internal/express-auth-microservice:9d20f44',
        kubernetesNamespace: 'guru-auth-prod',
        logs: [
          '[00:15:02] [BUILD] Container built using esbuild + node Alpine base image',
          '[00:15:30] [K8S] Rolling update strategy triggered: 3/3 pods replaced',
          '[00:16:00] [HEALTH] Health check succeeded'
        ],
        stages: this.generateDefaultStages('completed'),
        manifests: this.generateManifests('express-auth-microservice', 'api', '500m', '512Mi', 3)
      }
    ];

    seedDeployments.forEach(d => this.deployments.set(d.id, d));
  }

  private listenToEventBus() {
    this.eventBus.subscribe('*', (evt: AppEvent) => {
      if (evt.type === 'APP_CREATED' && evt.payload) {
        this.registerDeployableResource({
          id: `res-${evt.appId || Date.now()}`,
          name: evt.payload.name || 'unnamed-resource',
          resourceType: evt.payload.type?.toLowerCase().includes('bot') ? 'instance' : 'application',
          sourceRepo: evt.payload.repository,
          version: 'v1.0.0',
          status: 'active',
          targetId: 'target-docker-01',
          cpuLimit: '500m',
          memoryLimit: '512Mi',
          replicas: evt.payload.replicaCount || 1,
          updatedAt: new Date().toISOString()
        });
      } else if (evt.type === 'DEPLOYMENT_REQUESTED' && evt.payload) {
        this.triggerDeployment(evt.payload);
      }
    });
  }

  public registerDeployableResource(res: Partial<DeployableResource> & { name: string }): DeployableResource {
    const id = res.id || `res-${Date.now()}`;
    const resource: DeployableResource = {
      id,
      name: res.name,
      resourceType: res.resourceType || 'application',
      sourceRepo: res.sourceRepo || `github.com/guru-xd/${res.name}`,
      version: res.version || 'v1.0.0',
      status: 'active',
      targetId: res.targetId || 'target-docker-01',
      envVars: res.envVars || { NODE_ENV: 'production' },
      cpuLimit: res.cpuLimit || '500m',
      memoryLimit: res.memoryLimit || '512Mi',
      replicas: res.replicas || 1,
      updatedAt: new Date().toISOString()
    };
    this.resources.set(id, resource);
    return resource;
  }

  public getDeployableResources(typeFilter?: string): DeployableResource[] {
    let list = Array.from(this.resources.values());
    if (typeFilter && typeFilter !== 'all') {
      list = list.filter(r => r.resourceType === typeFilter);
    }
    return list;
  }

  public getDeploymentTargets(): DeploymentTarget[] {
    return Array.from(this.targets.values());
  }

  public getDeployments(resourceIdFilter?: string): DeploymentRecord[] {
    let list = Array.from(this.deployments.values());
    if (resourceIdFilter && resourceIdFilter !== 'all') {
      list = list.filter(d => d.resourceId === resourceIdFilter || d.resourceName === resourceIdFilter);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getDeploymentById(id: string): DeploymentRecord | undefined {
    return this.deployments.get(id);
  }

  public triggerDeployment(params: {
    resourceName: string;
    branch?: string;
    resourceType?: DeployableResourceType;
    targetType?: DeploymentTargetType;
    author?: string;
  }): DeploymentRecord {
    const resourceName = params.resourceName || 'GURU-XD App';
    const branch = params.branch || 'main';
    const author = params.author || 'operator';
    const targetType = params.targetType || 'docker-container';
    const resourceType = params.resourceType || 'application';

    // Find or create matching resource
    let res = Array.from(this.resources.values()).find(r => r.name === resourceName);
    if (!res) {
      res = this.registerDeployableResource({
        name: resourceName,
        resourceType,
        targetId: targetType === 'kubernetes-cluster' ? 'target-k8s-01' : 'target-docker-01'
      });
    }

    const deployId = `dep-${Date.now().toString().slice(-5)}`;
    const commitHash = Math.random().toString(16).substring(2, 9);
    const containerTag = `registry.guru-xd.internal/${resourceName.toLowerCase().replace(/\s+/g, '-')}:${commitHash}`;

    const stages: DeploymentStage[] = [
      { id: 'stg-1', name: '1. Source Code Fetch & Verification', status: 'running', startedAt: new Date().toISOString(), details: `Fetching branch ${branch} from ${res.sourceRepo}` },
      { id: 'stg-2', name: '2. Container Image Build & Tagging', status: 'pending', details: 'Building Docker container image' },
      { id: 'stg-3', name: '3. Vulnerability & Policy Security Audit', status: 'pending', details: 'Scanning image layer dependencies' },
      { id: 'stg-4', name: '4. Target Runtime Orchestration', status: 'pending', details: `Deploying container image to ${targetType}` },
      { id: 'stg-5', name: '5. Health Probe & Smoke Test', status: 'pending', details: 'Executing HTTP readiness checks' },
      { id: 'stg-6', name: '6. Live Traffic Handover', status: 'pending', details: 'Routing live production traffic' }
    ];

    const initialLogs = [
      `[${new Date().toLocaleTimeString()}] [PIPELINE] Initialized deployment ${deployId} for ${resourceName} (${resourceType}) on target ${targetType}`,
      `[${new Date().toLocaleTimeString()}] [SOURCE] Git repository: ${res.sourceRepo} (branch: ${branch})`,
      `[${new Date().toLocaleTimeString()}] [BUILD] Target image artifact: ${containerTag}`
    ];

    const manifests = this.generateManifests(resourceName, resourceType, res.cpuLimit || '500m', res.memoryLimit || '512Mi', res.replicas || 1);

    const record: DeploymentRecord = {
      id: deployId,
      resourceId: res.id,
      resourceName,
      resourceType: res.resourceType,
      targetId: res.targetId,
      targetType,
      branch,
      commitHash,
      commitMessage: `manual deployment trigger via GURU-XD console`,
      status: 'Building',
      author,
      createdAt: new Date().toISOString(),
      duration: 'In progress...',
      logs: initialLogs,
      stages,
      containerImage: containerTag,
      kubernetesNamespace: `guru-${resourceName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      manifests
    };

    this.deployments.set(deployId, record);
    this.eventBus.publish('DEPLOYMENT_STARTED', record, res.id, 'DeploymentService');

    // Simulate lifecycle progression asynchronously
    this.runDeploymentLifecycle(deployId);

    return record;
  }

  private runDeploymentLifecycle(deployId: string) {
    let currentStageIndex = 0;

    const interval = setInterval(() => {
      const record = this.deployments.get(deployId);
      if (!record) {
        clearInterval(interval);
        return;
      }

      if (currentStageIndex < record.stages.length) {
        // Complete current stage
        record.stages[currentStageIndex].status = 'completed';
        record.stages[currentStageIndex].completedAt = new Date().toISOString();

        currentStageIndex++;

        if (currentStageIndex < record.stages.length) {
          // Start next stage
          record.stages[currentStageIndex].status = 'running';
          record.stages[currentStageIndex].startedAt = new Date().toISOString();

          // Add log
          record.logs.push(
            `[${new Date().toLocaleTimeString()}] [STAGE] Executing ${record.stages[currentStageIndex].name}: ${record.stages[currentStageIndex].details}`
          );

          if (currentStageIndex === 1) record.status = 'Building';
          if (currentStageIndex === 2) record.status = 'Scanning';
          if (currentStageIndex === 3) record.status = 'Deploying';
          if (currentStageIndex === 4) record.status = 'HealthCheck';
        }
      } else {
        // All stages finished
        clearInterval(interval);
        record.status = 'Active';
        record.duration = '32s';
        record.logs.push(
          `[${new Date().toLocaleTimeString()}] [SUCCESS] Deployment ${deployId} successfully activated on target ${record.targetType}. Traffic switch completed with 0 downtime.`
        );

        this.eventBus.publish('DEPLOYMENT_COMPLETED', record, record.resourceId, 'DeploymentService');
        this.auditService.recordAudit({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'DEPLOYMENT_COMPLETED',
          actor: record.author,
          appId: record.resourceId,
          target: record.resourceName,
          details: { deployId, status: 'Active', containerImage: record.containerImage },
          status: 'success'
        });
      }

      this.deployments.set(deployId, record);
    }, 1200);
  }

  public rollbackDeployment(deployId: string): { success: boolean; message: string; record?: DeploymentRecord } {
    const record = this.deployments.get(deployId);
    if (!record) {
      return { success: false, message: `Deployment ${deployId} not found.` };
    }

    const rollbackId = `dep-rollback-${Date.now().toString().slice(-4)}`;
    const rollbackRecord: DeploymentRecord = {
      ...record,
      id: rollbackId,
      status: 'RolledBack',
      createdAt: new Date().toISOString(),
      duration: '12s (Atomic Rollback)',
      logs: [
        `[${new Date().toLocaleTimeString()}] [ROLLBACK] Triggered 1-click atomic rollback for ${record.resourceName} to baseline build ${record.commitHash}`,
        `[${new Date().toLocaleTimeString()}] [TRAFFIC] Diverted loadbalancer traffic to previous healthy container tag: ${record.containerImage}`,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] Atomic rollback completed successfully.`
      ],
      stages: this.generateDefaultStages('completed')
    };

    record.status = 'RolledBack';
    this.deployments.set(deployId, record);
    this.deployments.set(rollbackId, rollbackRecord);

    this.eventBus.publish('DEPLOYMENT_ROLLED_BACK', { originalDeployId: deployId, rollbackId }, record.resourceId, 'DeploymentService');
    this.notificationService.notify({
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      appId: record.resourceId,
      severity: 'info',
      title: 'Atomic Rollback Executed',
      message: `Deployment ${record.resourceName} was restored to stable release ${record.commitHash}.`,
      read: false
    });

    return { success: true, message: `Successfully rolled back ${record.resourceName} to build ${record.commitHash}`, record: rollbackRecord };
  }

  private generateDefaultStages(status: 'completed' | 'pending'): DeploymentStage[] {
    return [
      { id: 'stg-1', name: '1. Source Code Fetch & Verification', status, details: 'Source code pulled and commit verified' },
      { id: 'stg-2', name: '2. Container Image Build & Tagging', status, details: 'Container build completed via Docker Engine' },
      { id: 'stg-3', name: '3. Vulnerability & Policy Security Audit', status, details: 'Dependency vulnerability audit passed' },
      { id: 'stg-4', name: '4. Target Runtime Orchestration', status, details: 'Container pods/instances scheduled' },
      { id: 'stg-5', name: '5. Health Probe & Smoke Test', status, details: 'HTTP Liveness & Readiness probes passed' },
      { id: 'stg-6', name: '6. Live Traffic Handover', status, details: 'Zero-downtime active traffic switch complete' }
    ];
  }

  private generateManifests(name: string, type: string, cpu: string, memory: string, replicas: number) {
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return {
      dockerfile: `# Dockerfile for ${name} (${type})
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build || true

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]`,

      dockerCompose: `version: '3.8'
services:
  ${safeName}:
    image: registry.guru-xd.internal/${safeName}:latest
    container_name: ${safeName}-service
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    deploy:
      resources:
        limits:
          cpus: '${cpu.replace('m', '') === cpu ? cpu : (parseInt(cpu) / 1000).toFixed(1)}'
          memory: ${memory}`,

      k8sDeployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${safeName}-deployment
  namespace: guru-${safeName}
  labels:
    app.kubernetes.io/name: ${safeName}
    app.kubernetes.io/part-of: guru-xd-platform
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${safeName}
  template:
    metadata:
      labels:
        app: ${safeName}
    spec:
      containers:
      - name: ${safeName}
        image: registry.guru-xd.internal/${safeName}:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: ${cpu}
            memory: ${memory}
          limits:
            cpu: ${cpu}
            memory: ${memory}
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 15`,

      k8sService: `apiVersion: v1
kind: Service
metadata:
  name: ${safeName}-service
  namespace: guru-${safeName}
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  selector:
    app: ${safeName}`,

      k8sIngress: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${safeName}-ingress
  namespace: guru-${safeName}
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  rules:
  - host: ${safeName}.guru-xd.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${safeName}-service
            port:
              number: 80`,

      k8sConfigMap: `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${safeName}-config
  namespace: guru-${safeName}
data:
  NODE_ENV: "production"
  PORT: "3000"
  GURU_RESOURCE_TYPE: "${type}"`
    };
  }
}
