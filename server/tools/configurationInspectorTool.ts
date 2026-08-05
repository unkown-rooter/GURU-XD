import { toolRegistry, ToolExecutionContext } from '../services/toolRegistry';
import { DatabaseService } from '../db';

export interface ConfigurationInspectorParams {
  category?: 'env' | 'retention' | 'maintenance' | 'all';
}

export interface ConfigurationInspectorResult {
  timestamp: string;
  environment: {
    nodeEnv: string;
    port: string;
    featuresConfigured: string[];
    maskedEnvVars: Record<string, string>;
  };
  retentionPolicy?: {
    autoClear7Days?: boolean;
    autoPurgeAuditLogs30Days?: boolean;
    maxLogEntries?: number;
  };
  maintenanceMode?: boolean;
}

const SENSITIVE_VAR_SUBSTRINGS = ['SECRET', 'KEY', 'TOKEN', 'AUTH', 'PASSWORD', 'PRIVATE'];

export async function executeConfigurationInspectorTool(
  params: ConfigurationInspectorParams,
  context?: ToolExecutionContext
): Promise<ConfigurationInspectorResult> {
  const { category = 'all' } = params;
  const timestamp = new Date().toISOString();

  const envKeys = Object.keys(process.env);
  const maskedEnvVars: Record<string, string> = {};
  const featuresConfigured: string[] = [];

  envKeys.forEach(k => {
    const isSensitive = SENSITIVE_VAR_SUBSTRINGS.some(s => k.toUpperCase().includes(s));
    maskedEnvVars[k] = isSensitive ? '[CONFIGURED_SECRET]' : (process.env[k] || '');
    if (!isSensitive) {
      featuresConfigured.push(k);
    }
  });

  const dbData = DatabaseService.getInstance().read();

  return {
    timestamp,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '3000',
      featuresConfigured,
      maskedEnvVars
    },
    retentionPolicy: dbData.retentionPolicy || {
      autoClear7Days: true,
      autoPurgeAuditLogs30Days: true,
      maxLogEntries: 5000
    },
    maintenanceMode: dbData.maintenanceMode || false
  };
}

// Register Tool 9: Configuration Inspector Tool
toolRegistry.registerTool({
  toolId: 'tool-configuration-inspector',
  toolName: 'Configuration Inspector Tool',
  version: '1.0.0',
  description: 'Environment, system config, feature flags, and retention policy validator.',
  permissions: ['CONFIG_INSPECT'],
  capabilities: ['ConfigValidation', 'EnvInspection', 'RetentionPolicyCheck'],
  dependencies: ['dbService'],
  owner: 'GURU-XD AI Core',
  executor: executeConfigurationInspectorTool
});
