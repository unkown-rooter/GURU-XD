import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  GitBranch, 
  GitCommit, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Play, 
  Terminal, 
  ChevronRight, 
  ShieldCheck, 
  RefreshCw, 
  Box, 
  Layers, 
  Cpu, 
  Server, 
  Container, 
  Code, 
  Activity, 
  Radio, 
  FileCode, 
  ArrowRight,
  Filter,
  Eye,
  EyeOff,
  Zap,
  Check,
  Lock,
  Globe,
  Sliders,
  Plus,
  Trash2,
  Key,
  Shield,
  ExternalLink,
  Copy,
  AlertTriangle,
  FileText,
  Search,
  Download,
  Gauge,
  HeartPulse,
  HardDrive,
  TrendingUp,
  Sparkles,
  BarChart3,
  ServerCrash,
  RadioTower,
  SlidersHorizontal,
  Database,
  History,
  LifeBuoy,
  Split,
  Workflow,
  CheckSquare,
  ShieldAlert,
  Bell,
  Package,
  Globe2
} from 'lucide-react';
import EnterpriseDeploymentV5 from './EnterpriseDeploymentV5';
import DeploymentValidatorPanel from './DeploymentValidatorPanel';
import {
  PipelineConfig,
  PipelineRunRecord,
  SecurityAuditReport,
  NotificationChannelConfig,
  NotificationLogRecord,
  AppReleaseRecord,
  EnvironmentStateRecord,
  EnvironmentPromotionRecord,
  EnvironmentType
} from '../../server/services/enterpriseDeploymentService';
import { DeploymentValidationReport } from '../../server/services/deploymentValidatorService';

export interface Deployment {
  id: string;
  appName: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  status: 'Deployed' | 'Building' | 'Failed' | 'Rolled back' | 'Active' | 'Scanning' | 'Deploying' | 'HealthCheck' | 'RolledBack';
  author: string;
  createdAt: string;
  duration: string;
  logs: string[];
  stages?: Array<{ id: string; name: string; status: string; details: string }>;
  targetType?: string;
  resourceType?: string;
  manifests?: {
    dockerfile: string;
    dockerCompose: string;
    k8sDeployment: string;
    k8sService: string;
    k8sIngress: string;
    k8sConfigMap: string;
  };
}

export interface DeployableResourceItem {
  id: string;
  name: string;
  resourceType: 'application' | 'instance' | 'agent' | 'api' | 'website' | 'worker' | 'plugin';
  sourceRepo?: string;
  version: string;
  status: string;
  targetId: string;
  cpuLimit?: string;
  memoryLimit?: string;
  replicas?: number;
}

export interface DeploymentTargetItem {
  id: string;
  name: string;
  type: 'docker-container' | 'kubernetes-cluster' | 'serverless-function' | 'bare-metal';
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

export interface EnvVariableItem {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  environment: 'development' | 'testing' | 'staging' | 'production';
  resourceId?: string;
  resourceName?: string;
  scope: 'global' | 'profile' | 'deployment';
  comment?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface EnvironmentTemplate {
  id: string;
  name: string;
  description: string;
  targetResourceType: string;
  defaultVariables: Array<{
    key: string;
    defaultValue: string;
    isSecret: boolean;
    required: boolean;
    comment: string;
  }>;
}

export interface SslCertificate {
  id: string;
  domainName: string;
  sans: string[];
  issuer: string;
  status: 'Active' | 'Expiring Soon' | 'Renewing' | 'Expired';
  validFrom: string;
  validTo: string;
  daysUntilExpiration: number;
  autoRenew: boolean;
  keyType: string;
  sha256Fingerprint: string;
  healthStatus: 'Healthy' | 'Degraded' | 'Critical';
  lastCheckedAt: string;
}

export interface CustomDomain {
  id: string;
  domainName: string;
  subdomain?: string;
  fullDomain: string;
  resourceId: string;
  resourceName: string;
  environment: 'development' | 'testing' | 'staging' | 'production';
  status: 'Verified' | 'Pending DNS' | 'Verification Failed';
  dnsRecordType: 'CNAME' | 'A' | 'TXT';
  expectedValue: string;
  actualValue?: string;
  sslCertificateId?: string;
  sslEnabled: boolean;
  healthStatus: 'Healthy' | 'Degraded' | 'DNS Misconfigured';
  lastVerifiedAt: string;
  createdAt: string;
}

export interface StructuredLogEntry {
  id: string;
  timestamp: string;
  deploymentId?: string;
  resourceId: string;
  resourceName: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'build' | 'runtime' | 'event' | 'deployment' | 'security' | 'system';
  message: string;
  sourceModule: string;
}

export interface HealthCheckProbe {
  id: string;
  resourceId: string;
  resourceName: string;
  endpoint: string;
  livenessStatus: 'healthy' | 'degraded' | 'unhealthy';
  readinessStatus: 'ready' | 'not_ready';
  responseTimeMs: number;
  statusCode: number;
  lastCheckedAt: string;
  uptimePercentage: number;
  consecutiveFailures: number;
}

export interface ResourceMetricSnapshot {
  resourceId: string;
  resourceName: string;
  timestamp: string;
  cpuUsagePercent: number;
  cpuLimitCores: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  storageUsageMb: number;
  storageLimitMb: number;
  networkRxKbps: number;
  networkTxKbps: number;
  activeConnections: number;
}

export interface PerformanceBottleneck {
  id: string;
  resourceId: string;
  resourceName: string;
  severity: 'high' | 'medium' | 'low';
  type: 'CPU_THROTTLING' | 'HIGH_MEMORY_PRESSURE' | 'NETWORK_LATENCY' | 'UNDERUTILIZED_RESOURCES' | 'RESTART_LOOP';
  description: string;
  recommendation: string;
  estimatedImpact: string;
  aiCopilotContextPrompt?: string;
  createdAt: string;
}

// Version 4.0 Reliability Interfaces
export interface StorageProviderConfig {
  id: string;
  name: string;
  type: 'local_disk' | 's3_bucket' | 'gcs_bucket' | 'azure_blob';
  endpointUrl?: string;
  bucketName?: string;
  region?: string;
  isDefault: boolean;
  status: 'online' | 'degraded' | 'offline';
}

export interface BackupRetentionPolicy {
  id: string;
  name: string;
  maxDaysRetention: number;
  maxBackupCount: number;
  autoPrune: boolean;
  scheduleCron: string;
  enabled: boolean;
}

export interface BackupRecord {
  id: string;
  resourceId: string;
  resourceName: string;
  type: 'full' | 'incremental';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'verified';
  sizeBytes: number;
  checksumSha256: string;
  storageProviderId: string;
  storagePath: string;
  metadata: {
    environment: string;
    version: string;
    includedComponents: string[];
    dbSnapshotIncluded: boolean;
    configSnapshotIncluded: boolean;
  };
  integrityStatus: 'valid' | 'corrupted' | 'unverified';
  createdAt: string;
  completedAt?: string;
  verifiedAt?: string;
  createdBy: string;
}

export interface RecoveryExecutionRecord {
  id: string;
  resourceId: string;
  resourceName: string;
  type: 'deployment_rollback' | 'version_rollback' | 'configuration_rollback' | 'full_state_recovery';
  status: 'initiated' | 'validating' | 'recovering' | 'completed' | 'failed';
  targetDeploymentId?: string;
  targetVersion?: string;
  targetBackupId?: string;
  preRecoveryIntegrityCheck: boolean;
  postRecoveryHealthCheck: boolean;
  rollbackValidationPassed: boolean;
  revertedConfigKeys: string[];
  reportSummary: string;
  logs: string[];
  createdAt: string;
  completedAt?: string;
  initiatedBy: string;
}

export interface StrategyConfig {
  resourceId: string;
  resourceName: string;
  activeStrategy: 'rolling' | 'blue_green' | 'canary';
  canaryStepPercent: number;
  canaryIntervalSeconds: number;
  maxSurgePercent: number;
  maxUnavailablePercent: number;
  autoRollbackOnFailure: boolean;
  healthGateTimeoutSec: number;
}

export interface TransitionHistoryRecord {
  id: string;
  resourceId: string;
  resourceName: string;
  strategy: 'rolling' | 'blue_green' | 'canary';
  phase: string;
  activeVersion: string;
  targetVersion: string;
  currentTrafficSplitPercent: {
    active: number;
    target: number;
  };
  readinessPassed: boolean;
  availabilityScore: number;
  startedAt: string;
  completedAt?: string;
  initiatedBy: string;
  logs: string[];
}

interface DeploymentsViewProps {
  deployments: Deployment[];
  onTriggerDeploy: (appName: string, branch: string) => void;
  onRollback: (deploymentId: string) => void;
}

export default function DeploymentsView({
  deployments: propDeployments,
  onTriggerDeploy,
  onRollback
}: DeploymentsViewProps) {
  // Navigation Tabs (V1.0, V2.0, V3.0, V4.0, V5.0, Validator)
  const [activeTab, setActiveTab] = useState<'validator' | 'pipelines' | 'environments' | 'ssl' | 'domains' | 'monitoring' | 'central_logs' | 'health' | 'performance' | 'backups' | 'recovery' | 'strategy' | 'cicd' | 'security_audit' | 'notifications' | 'releases' | 'multi_env'>('validator');

  // V1.0 Pipelines State
  const [activeDeployments, setActiveDeployments] = useState<Deployment[]>(propDeployments);
  const [resources, setResources] = useState<DeployableResourceItem[]>([]);
  const [targets, setTargets] = useState<DeploymentTargetItem[]>([]);
  const [selectedDeploy, setSelectedDeploy] = useState<Deployment | null>(null);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [targetEngineFilter, setTargetEngineFilter] = useState<string>('all');

  // V2.0 Production Configuration State
  const [envVariables, setEnvVariables] = useState<EnvVariableItem[]>([]);
  const [selectedEnvProfile, setSelectedEnvProfile] = useState<'all' | 'development' | 'testing' | 'staging' | 'production'>('production');
  const [revealSecrets, setRevealSecrets] = useState<boolean>(false);
  const [envSearch, setEnvSearch] = useState<string>('');
  const [templates, setTemplates] = useState<EnvironmentTemplate[]>([]);
  const [certificates, setCertificates] = useState<SslCertificate[]>([]);
  const [domains, setDomains] = useState<CustomDomain[]>([]);

  // V3.0 Operations Center State
  const [monitoringStats, setMonitoringStats] = useState<any>(null);
  const [centralizedLogs, setCentralizedLogs] = useState<StructuredLogEntry[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [healthProbes, setHealthProbes] = useState<HealthCheckProbe[]>([]);
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [latestMetrics, setLatestMetrics] = useState<ResourceMetricSnapshot[]>([]);
  const [bottlenecks, setBottlenecks] = useState<PerformanceBottleneck[]>([]);

  // V4.0 Reliability Engine State
  const [storageProviders, setStorageProviders] = useState<StorageProviderConfig[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<BackupRetentionPolicy[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [recoveries, setRecoveries] = useState<RecoveryExecutionRecord[]>([]);
  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig | null>(null);
  const [transitions, setTransitions] = useState<TransitionHistoryRecord[]>([]);

  // V5.0 Enterprise Deployment State
  const [pipelines5, setPipelines5] = useState<PipelineConfig[]>([]);
  const [pipelineRuns5, setPipelineRuns5] = useState<PipelineRunRecord[]>([]);
  const [securityAudit5, setSecurityAudit5] = useState<SecurityAuditReport | null>(null);
  const [channels5, setChannels5] = useState<NotificationChannelConfig[]>([]);
  const [notificationLogs5, setNotificationLogs5] = useState<NotificationLogRecord[]>([]);
  const [releases5, setReleases5] = useState<AppReleaseRecord[]>([]);
  const [environments5, setEnvironments5] = useState<EnvironmentStateRecord[]>([]);
  const [promotions5, setPromotions5] = useState<EnvironmentPromotionRecord[]>([]);

  // Deployment Validator State
  const [validationHistory, setValidationHistory] = useState<DeploymentValidationReport[]>([]);
  const [currentValidationReport, setCurrentValidationReport] = useState<DeploymentValidationReport | null>(null);

  // Modals
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [selectedManifestTab, setSelectedManifestTab] = useState<'dockerfile' | 'dockerCompose' | 'k8sDeployment' | 'k8sService' | 'k8sIngress' | 'k8sConfigMap'>('k8sDeployment');

  const [showEnvVarModal, setShowEnvVarModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);
  const [showDnsGuideModal, setShowDnsGuideModal] = useState<CustomDomain | null>(null);

  // V4.0 Modals
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  // V4.0 Forms
  const [backupForm, setBackupForm] = useState<{
    resourceId: string;
    type: 'full' | 'incremental';
    storageProviderId: string;
  }>({
    resourceId: 'res-app-1',
    type: 'full',
    storageProviderId: 'sp-local-01'
  });

  const [recoveryForm, setRecoveryForm] = useState<{
    resourceId: string;
    type: 'deployment_rollback' | 'version_rollback' | 'configuration_rollback' | 'full_state_recovery';
    targetVersion: string;
  }>({
    resourceId: 'res-app-1',
    type: 'deployment_rollback',
    targetVersion: 'v2.4.0'
  });

  const [strategyForm, setStrategyForm] = useState<StrategyConfig>({
    resourceId: 'res-app-1',
    resourceName: 'guru-whatsapp-master',
    activeStrategy: 'canary',
    canaryStepPercent: 25,
    canaryIntervalSeconds: 300,
    maxSurgePercent: 25,
    maxUnavailablePercent: 0,
    autoRollbackOnFailure: true,
    healthGateTimeoutSec: 60
  });

  // V2.0 Forms
  const [envVarForm, setEnvVarForm] = useState<{
    id?: string;
    key: string;
    value: string;
    isSecret: boolean;
    environment: 'development' | 'testing' | 'staging' | 'production';
    scope: 'global' | 'profile' | 'deployment';
    resourceId?: string;
    comment: string;
  }>({
    key: '',
    value: '',
    isSecret: false,
    environment: 'production',
    scope: 'profile',
    comment: ''
  });

  const [domainForm, setDomainForm] = useState<{
    domainName: string;
    subdomain: string;
    resourceId: string;
    environment: 'development' | 'testing' | 'staging' | 'production';
    dnsRecordType: 'CNAME' | 'A' | 'TXT';
  }>({
    domainName: 'guru-xd.com',
    subdomain: 'bot',
    resourceId: 'res-app-1',
    environment: 'production',
    dnsRecordType: 'CNAME'
  });

  // Trigger Form
  const [triggerResourceName, setTriggerResourceName] = useState('guru-whatsapp-master');
  const [triggerResourceType, setTriggerResourceType] = useState<'application' | 'instance' | 'agent' | 'api' | 'website' | 'worker' | 'plugin'>('instance');
  const [triggerTargetType, setTriggerTargetType] = useState<'docker-container' | 'kubernetes-cluster' | 'serverless-function' | 'bare-metal'>('docker-container');
  const [triggerBranch, setTriggerBranch] = useState('main');

  // Sync Data Across All Endpoints (V1.0 - V5.0)
  const fetchBackendData = async () => {
    try {
      const [
        depRes, resRes, tgtRes, envRes, tmplRes, certRes, domRes, statRes, logRes, hlthRes, perfRes,
        provRes, bkpRes, recRes, stratRes, transRes,
        v5Pipes, v5Runs, v5Audit, v5Chans, v5NotifLogs, v5Rels, v5Envs, v5Proms
      ] = await Promise.all([
        fetch('/api/deployments').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/resources').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/targets').then(r => r.ok ? r.json() : null),
        fetch(`/api/deployments/config/env?reveal=${revealSecrets}`).then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/config/templates').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/ssl/certificates').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/domains').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/operations/stats').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/operations/logs').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/operations/health').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/operations/performance').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/reliability/storage-providers').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/reliability/backups').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/reliability/recovery/history').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/reliability/strategy/config').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/reliability/strategy/transitions').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/enterprise/pipelines').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/enterprise/pipelines/runs').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/enterprise/security/audit').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/enterprise/notifications/channels').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/enterprise/notifications/logs').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/enterprise/releases').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/enterprise/environments').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/enterprise/environments/promotions').then(r => r.ok ? r.json() : null),
        fetch('/api/deployments/validator/history').then(r => r.ok ? r.json() : null)
      ]);

      if (depRes?.success && Array.isArray(depRes.deployments)) {
        const mappedBackend: Deployment[] = depRes.deployments.map((d: any) => ({
          id: d.id,
          appName: d.resourceName || d.appName || 'Resource',
          branch: d.branch || 'main',
          commitHash: d.commitHash || 'a8f93e2',
          commitMessage: d.commitMessage || 'deployment update',
          status: d.status || 'Active',
          author: d.author || 'operator',
          createdAt: d.createdAt ? new Date(d.createdAt).toLocaleTimeString() : 'Just now',
          duration: d.duration || '30s',
          logs: d.logs || [],
          stages: d.stages || [],
          targetType: d.targetType,
          resourceType: d.resourceType,
          manifests: d.manifests
        }));

        const merged = [...mappedBackend];
        propDeployments.forEach(pd => {
          if (!merged.some(m => m.id === pd.id)) merged.push(pd);
        });
        setActiveDeployments(merged);
        if (!selectedDeploy && merged.length > 0) setSelectedDeploy(merged[0]);
      }

      if (resRes?.success && Array.isArray(resRes.resources)) setResources(resRes.resources);
      if (tgtRes?.success && Array.isArray(tgtRes.targets)) setTargets(tgtRes.targets);
      if (envRes?.success && Array.isArray(envRes.variables)) setEnvVariables(envRes.variables);
      if (tmplRes?.success && Array.isArray(tmplRes.templates)) setTemplates(tmplRes.templates);
      if (certRes?.success && Array.isArray(certRes.certificates)) setCertificates(certRes.certificates);
      if (domRes?.success && Array.isArray(domRes.domains)) setDomains(domRes.domains);

      if (statRes?.success) setMonitoringStats(statRes.stats);
      if (logRes?.success && Array.isArray(logRes.logs)) setCentralizedLogs(logRes.logs);
      if (hlthRes?.success) {
        setHealthProbes(hlthRes.probes || []);
        setHealthSummary(hlthRes.summary || null);
      }
      if (perfRes?.success) {
        setLatestMetrics(perfRes.metrics || []);
        setBottlenecks(perfRes.bottlenecks || []);
      }

      // V4.0 Data
      if (provRes?.success) {
        setStorageProviders(provRes.providers || []);
        setRetentionPolicies(provRes.policies || []);
      }
      if (bkpRes?.success && Array.isArray(bkpRes.backups)) setBackups(bkpRes.backups);
      if (recRes?.success && Array.isArray(recRes.history)) setRecoveries(recRes.history);
      if (stratRes?.success && stratRes.config) {
        setStrategyConfig(stratRes.config);
        setStrategyForm(stratRes.config);
      }
      if (transRes?.success && Array.isArray(transRes.history)) setTransitions(transRes.history);

      // V5.0 Data
      if (v5Pipes?.success) setPipelines5(v5Pipes.pipelines || []);
      if (v5Runs?.success) setPipelineRuns5(v5Runs.runs || []);
      if (v5Audit?.success) setSecurityAudit5(v5Audit.report || null);
      if (v5Chans?.success) setChannels5(v5Chans.channels || []);
      if (v5NotifLogs?.success) setNotificationLogs5(v5NotifLogs.logs || []);
      if (v5Rels?.success) setReleases5(v5Rels.releases || []);
      if (v5Envs?.success) setEnvironments5(v5Envs.environments || []);
      if (v5Proms?.success) setPromotions5(v5Proms.history || []);

      // Validator Data
      const valHistRes = arguments[arguments.length - 1];
      if (valHistRes?.success && Array.isArray(valHistRes.history)) {
        setValidationHistory(valHistRes.history);
        if (valHistRes.history.length > 0 && !currentValidationReport) {
          setCurrentValidationReport(valHistRes.history[0]);
        }
      }

    } catch (err) {
      console.warn('Deployment Operations sync notice:', err);
    }
  };

  // Deployment Validator Handlers
  const handleRunValidationPipeline = async () => {
    try {
      const res = await fetch('/api/deployments/validator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: 'res-app-1',
          resourceName: triggerResourceName || 'guru-whatsapp-master',
          deploymentType: 'docker-container',
          environment: 'production',
          targetBranch: triggerBranch || 'main'
        })
      });
      const data = await res.json();
      if (data?.success && data?.report) {
        setCurrentValidationReport(data.report);
        fetchBackendData();
      }
    } catch (err) {
      console.error('Validation pipeline execution failed:', err);
    }
  };

  // V5.0 Handlers
  const handleExecutePipelineV5 = async (pipelineId: string) => {
    try {
      const res = await fetch(`/api/deployments/enterprise/pipelines/${pipelineId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerSource: 'manual_console' })
      });
      if (res.ok) fetchBackendData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunSecurityAuditV5 = async () => {
    try {
      const res = await fetch('/api/deployments/enterprise/security/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: 'res-app-1', environment: 'production' })
      });
      if (res.ok) fetchBackendData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatchNotificationV5 = async (eventType: string, messagePayload: string) => {
    try {
      const res = await fetch('/api/deployments/enterprise/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, messagePayload })
      });
      if (res.ok) fetchBackendData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveReleaseV5 = async (releaseId: string) => {
    try {
      const res = await fetch(`/api/deployments/enterprise/releases/${releaseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'lead-devops-admin', comment: 'Approved via Enterprise Console' })
      });
      if (res.ok) fetchBackendData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromoteReleaseV5 = async (releaseId: string, versionTag: string, sourceEnv: EnvironmentType, targetEnv: EnvironmentType) => {
    try {
      const res = await fetch('/api/deployments/enterprise/environments/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: 'res-app-1',
          resourceName: 'guru-whatsapp-master',
          releaseId,
          versionTag,
          sourceEnvironment: sourceEnv,
          targetEnvironment: targetEnv,
          promotedBy: 'lead-devops-admin'
        })
      });
      if (res.ok) fetchBackendData();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 3000);
    return () => clearInterval(interval);
  }, [revealSecrets]);

  useEffect(() => {
    if (propDeployments.length > 0 && activeDeployments.length === 0) {
      setActiveDeployments(propDeployments);
      setSelectedDeploy(propDeployments[0]);
    }
  }, [propDeployments]);

  // V4.0 Handlers
  const handleTriggerBackupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedRes = resources.find(r => r.id === backupForm.resourceId);
      const res = await fetch('/api/deployments/reliability/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...backupForm,
          resourceName: selectedRes ? selectedRes.name : 'guru-whatsapp-master',
          createdBy: 'administrator'
        })
      });
      if (res.ok) {
        fetchBackendData();
        setShowBackupModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleValidateBackupIntegrity = async (backupId: string) => {
    try {
      const res = await fetch(`/api/deployments/reliability/backups/${backupId}/validate`, { method: 'POST' });
      if (res.ok) fetchBackendData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedRes = resources.find(r => r.id === recoveryForm.resourceId);
      const res = await fetch('/api/deployments/reliability/recovery/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recoveryForm,
          resourceName: selectedRes ? selectedRes.name : 'guru-whatsapp-master',
          initiatedBy: 'administrator'
        })
      });
      if (res.ok) {
        fetchBackendData();
        setShowRecoveryModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStrategyConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/deployments/reliability/strategy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategyForm)
      });
      if (res.ok) {
        fetchBackendData();
        setShowStrategyModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteTransition = async () => {
    try {
      const res = await fetch('/api/deployments/reliability/strategy/transitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: strategyConfig?.resourceId || 'res-app-1',
          resourceName: strategyConfig?.resourceName || 'guru-whatsapp-master',
          strategy: strategyConfig?.activeStrategy || 'canary',
          targetVersion: 'v2.4.1',
          initiatedBy: 'administrator'
        })
      });
      if (res.ok) fetchBackendData();
    } catch (err) {
      console.error(err);
    }
  };

  // V1.0 & V2.0 Handlers
  const handleTriggerBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/deployments/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceName: triggerResourceName,
          resourceType: triggerResourceType,
          targetType: triggerTargetType,
          branch: triggerBranch,
          author: 'administrator'
        })
      });
      if (res.ok) fetchBackendData();
    } catch (err) {
      console.error(err);
    }
    onTriggerDeploy(triggerResourceName, triggerBranch);
    setShowTriggerModal(false);
  };

  const handleRollbackClick = async (depId: string) => {
    try {
      const res = await fetch(`/api/deployments/${depId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) fetchBackendData();
    } catch (err) {
      console.error(err);
    }
    onRollback(depId);
  };

  const handleExportLogs = (format: 'json' | 'csv') => {
    window.open(`/api/deployments/operations/logs/export?format=${format}`, '_blank');
  };

  // Filtered Lists
  const filteredCentralLogs = centralizedLogs.filter(l => {
    if (logLevelFilter !== 'all' && l.level !== logLevelFilter) return false;
    if (logCategoryFilter !== 'all' && l.category !== logCategoryFilter) return false;
    if (logSearchQuery) {
      const q = logSearchQuery.toLowerCase();
      return l.message.toLowerCase().includes(q) || l.resourceName.toLowerCase().includes(q) || l.sourceModule.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredDeploys = activeDeployments.filter(d => {
    if (resourceTypeFilter !== 'all' && d.resourceType && d.resourceType !== resourceTypeFilter) return false;
    if (targetEngineFilter !== 'all' && d.targetType && d.targetType !== targetEngineFilter) return false;
    return true;
  });

  const filteredEnvs = envVariables.filter(v => {
    if (selectedEnvProfile !== 'all' && v.environment !== selectedEnvProfile && v.scope !== 'global') return false;
    if (envSearch && !v.key.toLowerCase().includes(envSearch.toLowerCase()) && !v.comment?.toLowerCase().includes(envSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Sub-Navigation Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-950/90 border border-slate-850 p-5 rounded-3xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Rocket className="w-6 h-6 text-blue-500" />
              <span>Enterprise Deployment Platform</span>
            </h1>
            <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">
              VERSION 5.0 ENTERPRISE PLATFORM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end CI/CD automation, production security auditing, multi-channel alerting, semantic releases, and multi-environment management.
          </p>
        </div>

        {/* Complete Module Sub-Navigation (V1.0, V2.0, V3.0, V4.0, V5.0) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl">
          {/* V5.0 Enterprise Tabs */}
          <button
            onClick={() => setActiveTab('validator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'validator'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Validator</span>
          </button>

          <button
            onClick={() => setActiveTab('cicd')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'cicd'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-blue-400" />
            <span>CI/CD Pipelines</span>
          </button>

          <button
            onClick={() => setActiveTab('security_audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'security_audit'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Security Hardening</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Alerting</span>
          </button>

          <button
            onClick={() => setActiveTab('releases')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'releases'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-purple-400" />
            <span>Releases</span>
          </button>

          <button
            onClick={() => setActiveTab('multi_env')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'multi_env'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Multi-Env</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />
          {/* V4.0 Reliability Tabs */}
          <button
            onClick={() => setActiveTab('backups')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'backups'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Backups</span>
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'recovery'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rollback & Recovery</span>
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'strategy'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero-Downtime</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* V3.0 Operations Tabs */}
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'monitoring'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Monitoring</span>
          </button>

          <button
            onClick={() => setActiveTab('central_logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'central_logs'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Central Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'health'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
            <span>Health & Uptime</span>
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'performance'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Performance</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* V1.0 & V2.0 Core Tabs */}
          <button
            onClick={() => setActiveTab('pipelines')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'pipelines'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipelines</span>
          </button>

          <button
            onClick={() => setActiveTab('environments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'environments'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Env & Secrets</span>
          </button>

          <button
            onClick={() => setActiveTab('ssl')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'ssl'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>SSL</span>
          </button>

          <button
            onClick={() => setActiveTab('domains')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'domains'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Domains</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB: DEPLOYMENT VALIDATOR SYSTEM                                          */}
      {/* ========================================================================= */}
      {activeTab === 'validator' && (
        <DeploymentValidatorPanel
          currentReport={currentValidationReport}
          validationHistory={validationHistory}
          onRunValidation={handleRunValidationPipeline}
          onRefreshData={fetchBackendData}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: ENTERPRISE DEPLOYMENT PLATFORM (VERSION 5.0 FEATURE)                */}
      {/* ========================================================================= */}
      {['cicd', 'security_audit', 'notifications', 'releases', 'multi_env'].includes(activeTab) && (
        <EnterpriseDeploymentV5
          activeSubTab={activeTab as any}
          pipelines={pipelines5}
          pipelineRuns={pipelineRuns5}
          securityAudit={securityAudit5}
          channels={channels5}
          notificationLogs={notificationLogs5}
          releases={releases5}
          environments={environments5}
          promotions={promotions5}
          onExecutePipeline={handleExecutePipelineV5}
          onRunSecurityAudit={handleRunSecurityAuditV5}
          onDispatchNotification={handleDispatchNotificationV5}
          onApproveRelease={handleApproveReleaseV5}
          onPromoteRelease={handlePromoteReleaseV5}
          onRefreshData={fetchBackendData}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: AUTOMATED BACKUPS (VERSION 4.0 FEATURE)                             */}
      {/* ========================================================================= */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Automated Backup Management & Storage Providers</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full and incremental snapshot preparation, SHA-256 integrity validation, and retention policies.
              </p>
            </div>

            <button
              onClick={() => setShowBackupModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Manual Backup</span>
            </button>
          </div>

          {/* Storage Providers & Retention Policies Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>Configured Storage Providers</span>
              </span>
              <div className="space-y-2">
                {storageProviders.map((sp) => (
                  <div key={sp.id} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between font-mono text-xs">
                    <div>
                      <span className="text-slate-100 font-bold block">{sp.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{sp.type} • {sp.endpointUrl || sp.bucketName}</span>
                    </div>
                    {sp.isDefault && (
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                        DEFAULT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Active Retention & Pruning Policies</span>
              </span>
              <div className="space-y-2">
                {retentionPolicies.map((pol) => (
                  <div key={pol.id} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between font-mono text-xs">
                    <div>
                      <span className="text-slate-100 font-bold block">{pol.name}</span>
                      <span className="text-[10px] text-slate-400">Cron: {pol.scheduleCron} • Max {pol.maxDaysRetention} Days ({pol.maxBackupCount} Copies)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Backup Records List */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>Snapshot Backup Records & Integrity History</span>
            </span>

            <div className="space-y-3">
              {backups.map((bkp) => (
                <div key={bkp.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <span className="font-bold text-xs text-slate-100">{bkp.resourceName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">ID: {bkp.id} • Path: {bkp.storagePath}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        bkp.type === 'full' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {bkp.type} BACKUP
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        {bkp.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 block">Snapshot Size:</span>
                      <span className="font-bold text-slate-200">{(bkp.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">SHA-256 Checksum Integrity:</span>
                      <span className="text-[10px] text-emerald-400 font-bold block truncate">{bkp.checksumSha256}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 block">Created At:</span>
                        <span className="text-slate-400">{new Date(bkp.createdAt).toLocaleTimeString()}</span>
                      </div>

                      <button
                        onClick={() => handleValidateBackupIntegrity(bkp.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-mono cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Validate Checksum</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ROLLBACK & RECOVERY (VERSION 4.0 FEATURE)                             */}
      {/* ========================================================================= */}
      {activeTab === 'recovery' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>Deployment Recovery & Safe Rollback System</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated pre-recovery integrity verification, configuration state reversal, and post-recovery health probes.
              </p>
            </div>

            <button
              onClick={() => setShowRecoveryModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer self-start sm:self-auto"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Trigger Safe Recovery</span>
            </button>
          </div>

          {/* Recovery History & Audit Trail */}
          <div className="space-y-4">
            {recoveries.map((rec) => (
              <div key={rec.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <span>{rec.resourceName}</span>
                        <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase">
                          {rec.type.replace('_', ' ')}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Target Version: <strong className="text-emerald-400">{rec.targetVersion}</strong></p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                    STATUS: {rec.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 font-mono bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                  <p><strong>Report Summary:</strong> {rec.reportSummary}</p>
                  <p className="text-indigo-400"><strong>Reverted Configuration Keys:</strong> {rec.revertedConfigKeys.join(', ')}</p>
                </div>

                {/* Execution Logs */}
                <div className="bg-slate-900/90 p-3 rounded-xl font-mono text-[11px] text-slate-400 space-y-1">
                  <span className="text-slate-500 block font-bold mb-1">Execution Audit Trail:</span>
                  {rec.logs.map((logLine, idx) => (
                    <div key={idx} className="text-slate-300">{logLine}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ZERO-DOWNTIME STRATEGY (VERSION 4.0 FEATURE)                        */}
      {/* ========================================================================= */}
      {activeTab === 'strategy' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Split className="w-4 h-4 text-amber-400" />
                <span>Zero-Downtime Deployment Strategy & Traffic Switching</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Canary progressive traffic splitting, Blue-Green instant cutovers, and Rolling pod replacements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStrategyModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure Strategy</span>
              </button>

              <button
                onClick={handleExecuteTransition}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-amber-600/20 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Execute Strategy Cutover</span>
              </button>
            </div>
          </div>

          {/* Active Strategy Configuration Overview Card */}
          {strategyConfig && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>{strategyConfig.resourceName}</span>
                    <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
                      ACTIVE STRATEGY: {strategyConfig.activeStrategy.toUpperCase()}
                    </span>
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Auto-Rollback on Health Gate Fail: <strong>ENABLED</strong></span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl font-mono text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block">Canary Step Split:</span>
                  <span className="text-amber-400 font-bold">{strategyConfig.canaryStepPercent}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Canary Interval:</span>
                  <span className="text-slate-200 font-bold">{strategyConfig.canaryIntervalSeconds}s</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Max Surge:</span>
                  <span className="text-slate-200 font-bold">{strategyConfig.maxSurgePercent}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Health Gate Timeout:</span>
                  <span className="text-slate-200 font-bold">{strategyConfig.healthGateTimeoutSec}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Transition History */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Workflow className="w-4 h-4 text-blue-400" />
              <span>Zero-Downtime Transition History & Availability Logs</span>
            </span>

            <div className="space-y-3">
              {transitions.map((trans) => (
                <div key={trans.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Split className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="font-bold text-xs text-slate-100">{trans.resourceName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">Active: {trans.activeVersion} → Target: {trans.targetVersion}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      PHASE: {trans.phase}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Traffic Cutover Progress:</span>
                      <span>Target Version Traffic: <strong>{trans.currentTrafficSplitPercent.target}%</strong></span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex">
                      <div className="bg-slate-700 h-full transition-all" style={{ width: `${trans.currentTrafficSplitPercent.active}%` }} />
                      <div className="bg-amber-500 h-full transition-all" style={{ width: `${trans.currentTrafficSplitPercent.target}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[11px] text-slate-400 space-y-1">
                    {trans.logs.map((logLine, idx) => (
                      <div key={idx} className="text-slate-300">• {logLine}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OTHER TABS (V1.0 PIPELINES, V2.0 ENV, V3.0 MONITORING, LOGS, HEALTH, ETC.)  */}
      {/* ========================================================================= */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                <span>Active Deployments</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 font-mono">
                {monitoringStats?.activeDeployments || 12} <span className="text-xs text-slate-500 font-normal">Workloads</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Runtime Success Rate: {monitoringStats?.runtimeSuccessRate || 99.2}%</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                <span>Avg Build Duration</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 font-mono">
                {monitoringStats?.averageBuildDurationSec || 28.4}s
              </div>
              <span className="text-[10px] text-blue-400 font-mono">Builds Executed Today: {monitoringStats?.totalBuildsToday || 38}</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                <span>Cluster Load Index</span>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 font-mono">
                {monitoringStats?.systemLoadIndex || 0.38} <span className="text-xs text-slate-500 font-normal">/ 1.00</span>
              </div>
              <span className="text-[10px] text-indigo-400 font-mono">Optimal Execution State</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                <span>Failed Deployments</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 font-mono text-rose-400">
                {monitoringStats?.failedDeployments || 1}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Pending Pipeline Queues: {monitoringStats?.pendingDeployments || 0}</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-400" />
                <span>Live Monitored Workloads & Resources</span>
              </span>
              <span className="text-xs font-mono text-slate-400">Auto-refreshing every 3s</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {latestMetrics.map((m) => (
                <div key={m.resourceId} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-100 flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-blue-400" />
                      <span>{m.resourceName}</span>
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                      HEALTHY
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block">CPU Usage:</span>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${m.cpuUsagePercent}%` }} />
                      </div>
                      <span className="text-slate-200 font-bold block mt-0.5">{m.cpuUsagePercent}%</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Memory:</span>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(m.memoryUsageMb / m.memoryLimitMb) * 100}%` }} />
                      </div>
                      <span className="text-slate-200 font-bold block mt-0.5">{m.memoryUsageMb} / {m.memoryLimitMb} MB</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Network Traffic:</span>
                      <span className="text-slate-200 font-bold block mt-2">↓ {m.networkRxKbps} / ↑ {m.networkTxKbps} KB/s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'central_logs' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search logs across deployments..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-2 rounded-xl font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={logLevelFilter}
                onChange={(e) => setLogLevelFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl font-mono focus:outline-none cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="info">INFO</option>
                <option value="warn">WARN</option>
                <option value="error">ERROR</option>
                <option value="debug">DEBUG</option>
              </select>

              <select
                value={logCategoryFilter}
                onChange={(e) => setLogCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl font-mono focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="deployment">Deployment</option>
                <option value="runtime">Runtime</option>
                <option value="build">Build</option>
                <option value="security">Security</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                onClick={() => handleExportLogs('json')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => handleExportLogs('csv')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-slate-200">Centralized System & Pipeline Stream</span>
              </div>
              <span>Showing {filteredCentralLogs.length} events</span>
            </div>

            <div className="p-4 space-y-2 max-h-[520px] overflow-y-auto font-mono text-xs scrollbar-thin">
              {filteredCentralLogs.map((log) => {
                const isError = log.level === 'error';
                const isWarn = log.level === 'warn';
                return (
                  <div key={log.id} className="p-2.5 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl border border-slate-850 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 transition-colors">
                    <div className="flex items-start md:items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isError ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        isWarn ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {log.level}
                      </span>

                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                        {log.category}
                      </span>

                      <span className="font-bold text-slate-200">{log.resourceName}</span>
                      <span className="text-slate-500">[{log.sourceModule}]</span>
                      <span className="text-slate-300">{log.message}</span>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0 self-end md:self-auto">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                <span>Global Health Score</span>
                <HeartPulse className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-slate-100 font-mono">
                {healthSummary?.overallHealthScore || 98.5}%
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Uptime Availability: {healthSummary?.globalUptime || 99.94}%</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                <span>Avg Probe Latency</span>
                <Radio className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-slate-100 font-mono">
                {healthSummary?.averageResponseTimeMs || 48} ms
              </div>
              <span className="text-[10px] text-blue-400 font-mono">Liveness & Readiness Probes Healthy</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                <span>Service Readiness</span>
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xs font-mono text-slate-300">
                Healthy: <strong className="text-emerald-400">{healthSummary?.healthyCount || 3}</strong> | Degraded: <strong className="text-amber-400">{healthSummary?.degradedCount || 1}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {healthProbes.map((probe) => (
              <div key={probe.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <span>{probe.resourceName}</span>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {probe.endpoint}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Uptime Availability: <strong className="text-emerald-400">{probe.uptimePercentage}%</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                      probe.livenessStatus === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      Liveness: {probe.livenessStatus.toUpperCase()}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Readiness: {probe.readinessStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl font-mono text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Response Latency:</span>
                    <span className="text-blue-400 font-bold">{probe.responseTimeMs} ms (HTTP {probe.statusCode})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Consecutive Failures:</span>
                    <span className={probe.consecutiveFailures > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {probe.consecutiveFailures}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Last Verification:</span>
                    <span className="text-slate-400">{new Date(probe.lastCheckedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>AI-Grounded Performance Optimization & Bottleneck Insights</span>
            </span>

            <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Copilot Ready</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {bottlenecks.map((btn) => (
              <div key={btn.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <span>{btn.resourceName}</span>
                        <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold uppercase">
                          {btn.severity} SEVERITY
                        </span>
                      </h3>
                      <p className="text-xs text-amber-300 font-mono mt-0.5">{btn.type}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 font-mono bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                  <p><strong>Bottleneck Description:</strong> {btn.description}</p>
                  <p className="text-emerald-400"><strong>Recommendation:</strong> {btn.recommendation}</p>
                  <p className="text-slate-400"><strong>Estimated Efficiency Gain:</strong> {btn.estimatedImpact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pipelines' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {targets.map((tgt) => {
              const isK8s = tgt.type === 'kubernetes-cluster';
              const isDocker = tgt.type === 'docker-container';
              return (
                <div key={tgt.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl border ${isDocker ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : isK8s ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                        {isDocker && <Container className="w-4 h-4" />}
                        {isK8s && <Layers className="w-4 h-4" />}
                        {!isDocker && !isK8s && <Server className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{tgt.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 block">{tgt.dockerVersion || tgt.k8sVersion || tgt.type}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                      {tgt.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Workloads:</span>
                      <span className="text-slate-200 font-bold">{tgt.activeWorkloads} active</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Memory:</span>
                      <span className="text-slate-200">{tgt.usedMemoryGb} / {tgt.totalMemoryGb} GB</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pr-2">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                <span>Resource Filter:</span>
              </span>
              {['all', 'application', 'instance', 'agent', 'api', 'worker', 'plugin'].map((type) => (
                <button
                  key={type}
                  onClick={() => setResourceTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer capitalize border ${
                    resourceTypeFilter === type
                      ? 'bg-blue-600 text-white border-blue-500 font-semibold shadow-md shadow-blue-600/20'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {type === 'instance' ? 'Bots' : type}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTriggerModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Trigger Deployment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-850 pb-2">
                Deployments List ({filteredDeploys.length})
              </span>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredDeploys.map((dep) => {
                  const isSelected = selectedDeploy?.id === dep.id;
                  return (
                    <div
                      key={dep.id}
                      onClick={() => setSelectedDeploy(dep)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-blue-500/50 shadow-md shadow-blue-500/10'
                          : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/80 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-blue-400" />
                          <span>{dep.appName}</span>
                        </span>
                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                          {dep.status}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                        <p>Commit: {dep.commitHash} • {dep.branch}</p>
                        <p className="text-slate-500">{dep.createdAt} ({dep.duration})</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-2xl">
              {selectedDeploy ? (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <span>{selectedDeploy.appName}</span>
                        <span className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-normal">
                          {selectedDeploy.branch}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Deployment ID: {selectedDeploy.id}</p>
                    </div>

                    <button
                      onClick={() => handleRollbackClick(selectedDeploy.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Pipeline Logs</span>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-[350px] overflow-y-auto space-y-1.5">
                      {selectedDeploy.logs.map((line, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">Select a deployment to view detailed execution stages and logs.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* V4.0 MODALS                                                               */}
      {/* ========================================================================= */}
      {/* Create Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Create Deployment Backup</span>
            </h3>

            <form onSubmit={handleTriggerBackupSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Target Resource</label>
                <select
                  value={backupForm.resourceId}
                  onChange={(e) => setBackupForm({ ...backupForm, resourceId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                >
                  <option value="res-app-1">guru-whatsapp-master</option>
                  <option value="res-app-4">express-auth-microservice</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Backup Snapshot Type</label>
                <select
                  value={backupForm.type}
                  onChange={(e) => setBackupForm({ ...backupForm, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                >
                  <option value="full">Full Backup (DB + Config + State)</option>
                  <option value="incremental">Incremental Backup (Delta State)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Storage Provider Destination</label>
                <select
                  value={backupForm.storageProviderId}
                  onChange={(e) => setBackupForm({ ...backupForm, storageProviderId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                >
                  {storageProviders.map((sp) => (
                    <option key={sp.id} value={sp.id}>{sp.name} ({sp.type})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBackupModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Start Backup Execution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trigger Safe Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Safe Deployment Recovery Workflow</span>
            </h3>

            <form onSubmit={handleTriggerRecoverySubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Target Resource</label>
                <select
                  value={recoveryForm.resourceId}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, resourceId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                >
                  <option value="res-app-1">guru-whatsapp-master</option>
                  <option value="res-app-4">express-auth-microservice</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Recovery Operation Type</label>
                <select
                  value={recoveryForm.type}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                >
                  <option value="deployment_rollback">Deployment Rollback</option>
                  <option value="version_rollback">Version Rollback</option>
                  <option value="configuration_rollback">Configuration Reversal</option>
                  <option value="full_state_recovery">Full State Snapshot Recovery</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Version Tag</label>
                <input
                  type="text"
                  value={recoveryForm.targetVersion}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, targetVersion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                  placeholder="e.g. v2.4.0"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px]">
                Safe recovery automatically verifies snapshot SHA-256 integrity and executes post-recovery HTTP health probes before completing.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Initiate Safe Recovery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Strategy Modal */}
      {showStrategyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Split className="w-4 h-4 text-amber-400" />
              <span>Configure Deployment Strategy</span>
            </h3>

            <form onSubmit={handleUpdateStrategyConfigSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Active Deployment Strategy</label>
                <select
                  value={strategyForm.activeStrategy}
                  onChange={(e) => setStrategyForm({ ...strategyForm, activeStrategy: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                >
                  <option value="canary">Canary Deployment (Progressive Split)</option>
                  <option value="blue_green">Blue-Green Deployment (Instant Cutover)</option>
                  <option value="rolling">Rolling Deployment (Sequential Pod Shift)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Canary Traffic Step (%)</label>
                <input
                  type="number"
                  value={strategyForm.canaryStepPercent}
                  onChange={(e) => setStrategyForm({ ...strategyForm, canaryStepPercent: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Canary Step Interval (Seconds)</label>
                <input
                  type="number"
                  value={strategyForm.canaryIntervalSeconds}
                  onChange={(e) => setStrategyForm({ ...strategyForm, canaryIntervalSeconds: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStrategyModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* V1.0 Trigger Deployment Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-400 fill-current" />
              <span>Trigger Pipeline Build</span>
            </h3>

            <form onSubmit={handleTriggerBuild} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Resource Name</label>
                <input
                  type="text"
                  value={triggerResourceName}
                  onChange={(e) => setTriggerResourceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Engine</label>
                <select
                  value={triggerTargetType}
                  onChange={(e) => setTriggerTargetType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                >
                  <option value="docker-container">Docker Container Engine</option>
                  <option value="kubernetes-cluster">Kubernetes Cluster</option>
                  <option value="serverless-function">Serverless Function</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Start Build
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
