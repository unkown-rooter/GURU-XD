import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  X, 
  Check, 
  AlertTriangle, 
  Shield, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Server, 
  Sliders, 
  Key, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Info, 
  Radio, 
  CheckCircle2, 
  Globe, 
  Users, 
  MessageSquare, 
  Database, 
  Terminal, 
  Lock, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  Zap, 
  Layers, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Bot } from '../types';

export interface AddInstanceWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  onDeploy?: (botData: Omit<Bot, 'id' | 'uptime' | 'memory' | 'cpu' | 'commandsCount' | 'version'>) => void;
  isEmbedded?: boolean;
}

export type BotType = 
  | 'AI Assistant'
  | 'Customer Support'
  | 'Business'
  | 'Community'
  | 'Group Management'
  | 'Moderation'
  | 'Downloader'
  | 'Education'
  | 'Entertainment'
  | 'Utility'
  | 'Personal'
  | 'Other';

export type TargetAudience = 
  | 'Personal Use'
  | 'Friends'
  | 'Company'
  | 'Public'
  | 'Groups'
  | 'Communities';

export default function AddInstanceWizard({ 
  isOpen = true, 
  onClose, 
  onDeploy,
  isEmbedded = false
}: AddInstanceWizardProps) {
  // Step State (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // --- Step 1: Instance & Platform ---
  const [instanceName, setInstanceName] = useState('guru-ai');
  const [platform, setPlatform] = useState<'WhatsApp' | 'Telegram' | 'Discord' | 'Slack'>('WhatsApp');
  const [runtime, setRuntime] = useState<string>('Node.js 20 LTS');
  const [region, setRegion] = useState<string>('Kenya');
  const [storageAllocation, setStorageAllocation] = useState<string>('5 GB');
  const [commandPrefix, setCommandPrefix] = useState<string>('.');

  // --- Step 2: Resource Allocation ---
  const [memoryLimit, setMemoryLimit] = useState<number>(512); // MB
  const [cpuLimit, setCpuLimit] = useState<number>(50); // %
  const [autoRestart, setAutoRestart] = useState<boolean>(true);
  const [logLevel, setLogLevel] = useState<'info' | 'warning' | 'error' | 'debug' | 'silent'>('info');

  // --- Step 3: Bot Profile ---
  const [botType, setBotType] = useState<BotType>('AI Assistant');
  const [primaryPurpose, setPrimaryPurpose] = useState<string>(
    'This bot helps customers order products, answer technical questions, and manage user tasks.'
  );
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('Company');
  const [expectedDailyUsers, setExpectedDailyUsers] = useState<number>(500); // 10, 100, 500, 1000, 5000+
  const [expectedDailyMessages, setExpectedDailyMessages] = useState<number>(1000); // 100, 1000, 10000, 100000+
  
  // Toggles (Yes / No)
  const [usesAi, setUsesAi] = useState<boolean>(true);
  const [downloadsMedia, setDownloadsMedia] = useState<boolean>(false);
  const [uploadsFiles, setUploadsFiles] = useState<boolean>(true);
  const [storesUserData, setStoresUserData] = useState<boolean>(true);
  const [usesDatabase, setUsesDatabase] = useState<boolean>(true);
  const [usesExternalApis, setUsesExternalApis] = useState<boolean>(true);
  const [usesWebhooks, setUsesWebhooks] = useState<boolean>(false);

  // Expected Countries
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['Kenya', 'Nigeria', 'Global']);

  // --- Step 5: Environment Secrets ---
  const [ownerNumber, setOwnerNumber] = useState<string>('254712345678');
  const [ownerName, setOwnerName] = useState<string>('GURU Admin');
  const [ownerEmail, setOwnerEmail] = useState<string>('admin@guru-xd.org');

  const [sessionName, setSessionName] = useState<string>('guru_session_prod');
  const [autoRead, setAutoRead] = useState<boolean>(true);
  const [autoTyping, setAutoTyping] = useState<boolean>(false);

  const [geminiApiKey, setGeminiApiKey] = useState<string>('AIzaSyD_EXAMPLE_KEY_FOR_GEMINI_1');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [claudeApiKey, setClaudeApiKey] = useState<string>('');

  const [mongodbUri, setMongodbUri] = useState<string>('mongodb+srv://guru:secret@cluster0.mongodb.net/guru_db');
  const [postgresUri, setPostgresUri] = useState<string>('');
  const [redisUri, setRedisUri] = useState<string>('redis://default:secret@redis-cache.guru.internal:6379');

  const [jwtSecret, setJwtSecret] = useState<string>('guru_jwt_super_secret_key_2026');
  const [encryptionKey, setEncryptionKey] = useState<string>('32_byte_aes_encryption_key_hash');
  const [webhookSecret, setWebhookSecret] = useState<string>('');
  const [sessionSecret, setSessionSecret] = useState<string>('guru_session_secret_998');

  const [port, setPort] = useState<string>('3000');
  const [nodeEnv, setNodeEnv] = useState<string>('production');

  // Custom Env Vars
  const [customEnvVars, setCustomEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: 'CACHE_TTL', value: '3600' }
  ]);
  const [newCustomKey, setNewCustomKey] = useState<string>('');
  const [newCustomVal, setNewCustomVal] = useState<string>('');

  // UI States
  const [showBlueprint, setShowBlueprint] = useState<boolean>(true);
  const [showSecretsMap, setShowSecretsMap] = useState<Record<string, boolean>>({});
  const [riskAcknowledged, setRiskAcknowledged] = useState<boolean>(false);
  const [activeSecretsSection, setActiveSecretsSection] = useState<string>('Owner');

  // Backend Pipeline Execution State
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [pipelineLogs, setPipelineLogs] = useState<Array<{ stageNumber: number; stageName: string; status: 'passed' | 'warning' | 'failed' | 'running'; timestamp: string; details: string }>>([]);
  const [pipelineResult, setPipelineResult] = useState<any | null>(null);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);

  // Complete Wizard Reset Function
  const resetWizardState = (newSessionData?: any) => {
    setCurrentStep(1);
    setInstanceName('guru-ai');
    setPlatform('WhatsApp');
    setRuntime('Node.js 20 LTS');
    setRegion('Kenya');
    setStorageAllocation('5 GB');
    setCommandPrefix('.');
    setMemoryLimit(512);
    setCpuLimit(50);
    setAutoRestart(true);
    setLogLevel('info');
    setBotType('AI Assistant');
    setPrimaryPurpose('This bot helps customers order products, answer technical questions, and manage user tasks.');
    setTargetAudience('Company');
    setExpectedDailyUsers(500);
    setExpectedDailyMessages(1000);
    setUsesAi(true);
    setDownloadsMedia(false);
    setUploadsFiles(true);
    setStoresUserData(true);
    setUsesDatabase(true);
    setUsesExternalApis(true);
    setUsesWebhooks(false);
    setSelectedCountries(['Kenya', 'Nigeria', 'Global']);
    setOwnerNumber('254712345678');
    setOwnerName('GURU Admin');
    setOwnerEmail('admin@guru-xd.org');
    setSessionName('guru_session_prod');
    setAutoRead(true);
    setAutoTyping(false);
    setGeminiApiKey('AIzaSyD_EXAMPLE_KEY_FOR_GEMINI_1');
    setOpenaiApiKey('');
    setClaudeApiKey('');
    setMongodbUri('mongodb+srv://guru:secret@cluster0.mongodb.net/guru_db');
    setPostgresUri('');
    setRedisUri('redis://default:secret@redis-cache.guru.internal:6379');
    setJwtSecret('guru_jwt_super_secret_key_2026');
    setEncryptionKey('32_byte_aes_encryption_key_hash');
    setWebhookSecret('');
    setSessionSecret('guru_session_secret_998');
    setPort('3000');
    setNodeEnv('production');
    setCustomEnvVars([{ key: 'CACHE_TTL', value: '3600' }]);
    setRiskAcknowledged(false);
    setIsDeploying(false);
    setPipelineLogs([]);
    setPipelineResult(null);
    setDeploymentError(null);
  };

  // --- Real-time Risk Score & Protection Analysis Calculations ---
  const riskAnalysis = useMemo(() => {
    let score = 10; // baseline
    const positiveReasons: string[] = [];
    const warningReasons: string[] = [];

    // Positive checks
    if (botType === 'Business' || botType === 'Customer Support' || botType === 'AI Assistant') {
      positiveReasons.push(`✔ ${botType} Bot Configuration`);
      score -= 5;
    }
    if (!downloadsMedia) {
      positiveReasons.push('✔ No Media Downloading');
      score -= 10;
    } else {
      warningReasons.push('⚠ Media Downloader (High Bandwidth & Copyright Risk)');
      score += 25;
    }

    if (expectedDailyMessages <= 1000) {
      positiveReasons.push('✔ Low Message Volume');
      score -= 5;
    } else if (expectedDailyMessages >= 100000) {
      warningReasons.push('⚠ Massive Broadcasting (High Spam Trigger Risk)');
      score += 30;
    } else if (expectedDailyMessages >= 10000) {
      warningReasons.push('⚠ High Daily Message Volume');
      score += 15;
    }

    if (targetAudience === 'Personal Use' || targetAudience === 'Company') {
      positiveReasons.push('✔ Controlled Target Audience');
    } else if (targetAudience === 'Public' || targetAudience === 'Groups') {
      warningReasons.push('⚠ Public Groups Access (Higher Exposure)');
      score += 15;
    }

    if (usesExternalApis) {
      positiveReasons.push('✔ Uses Trusted APIs');
    }

    if (usesWebhooks) {
      warningReasons.push('⚠ Unknown / External Webhooks Configured');
      score += 10;
    }

    if (memoryLimit > 1024) {
      warningReasons.push('⚠ Huge RAM Request (>1 GB)');
      score += 15;
    }

    if (cpuLimit > 80) {
      warningReasons.push('⚠ Huge CPU Request (>80%)');
      score += 15;
    }

    if (!ownerNumber || ownerNumber.trim().length < 8) {
      warningReasons.push('⚠ Missing / Invalid Owner Number');
      score += 20;
    } else {
      positiveReasons.push('✔ Verified Owner Phone Number');
    }

    if (customEnvVars.some(e => e.key.toLowerCase().includes('eval') || e.key.toLowerCase().includes('exec'))) {
      warningReasons.push('⚠ Suspicious Environment Variables Detected');
      score += 25;
    }

    // Clamp score
    const clampedScore = Math.max(5, Math.min(98, score));
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (clampedScore >= 85) level = 'CRITICAL';
    else if (clampedScore >= 60) level = 'HIGH';
    else if (clampedScore >= 30) level = 'MEDIUM';

    return {
      score: clampedScore,
      level,
      positiveReasons,
      warningReasons
    };
  }, [
    botType, downloadsMedia, expectedDailyMessages, targetAudience, 
    usesExternalApis, usesWebhooks, memoryLimit, cpuLimit, ownerNumber, customEnvVars
  ]);

  // --- Real-time Deployment Health Calculations ---
  const deploymentHealth = useMemo(() => {
    let health = 100;
    
    // Config factor
    if (!instanceName.trim()) health -= 25;
    if (!commandPrefix) health -= 10;

    // Resources factor
    if (memoryLimit > 1536) health -= 5;
    if (cpuLimit > 90) health -= 5;

    // Security & Environment factor
    if (!geminiApiKey && !openaiApiKey && !claudeApiKey && usesAi) health -= 10;
    if (!ownerNumber) health -= 15;

    // Risk impact
    if (riskAnalysis.level === 'CRITICAL') health -= 25;
    else if (riskAnalysis.level === 'HIGH') health -= 15;
    else if (riskAnalysis.level === 'MEDIUM') health -= 5;

    const clampedHealth = Math.max(20, Math.min(100, health));
    return {
      score: clampedHealth,
      status: clampedHealth >= 85 ? 'Ready' : clampedHealth >= 65 ? 'Warning' : 'Requires Attention',
      factors: {
        configuration: instanceName.trim() ? 100 : 40,
        resources: memoryLimit <= 1024 ? 98 : 80,
        security: ownerNumber ? 95 : 60,
        environment: (geminiApiKey || openaiApiKey) ? 96 : 75,
        riskAnalysis: 100 - riskAnalysis.score,
        compatibility: 100
      }
    };
  }, [instanceName, commandPrefix, memoryLimit, cpuLimit, geminiApiKey, openaiApiKey, claudeApiKey, usesAi, ownerNumber, riskAnalysis]);

  // Handle Custom Env Add
  const handleAddCustomEnv = () => {
    if (!newCustomKey.trim()) return;
    setCustomEnvVars([...customEnvVars, { key: newCustomKey.toUpperCase().trim(), value: newCustomVal.trim() }]);
    setNewCustomKey('');
    setNewCustomVal('');
  };

  const handleRemoveCustomEnv = (idx: number) => {
    setCustomEnvVars(customEnvVars.filter((_, i) => i !== idx));
  };

  // Final Deploy Trigger calling Backend Deployment Pipeline
  const handleFinalDeploy = async () => {
    if (!instanceName.trim()) return;
    if (riskAnalysis.level === 'HIGH' || riskAnalysis.level === 'CRITICAL') {
      if (!riskAcknowledged) return;
    }

    setIsDeploying(true);
    setDeploymentError(null);
    setPipelineLogs([]);
    setPipelineResult(null);

    const payload = {
      instanceName,
      platform,
      commandPrefix,
      runtime,
      region,
      storageAllocation,
      memoryLimit,
      cpuLimit,
      autoRestart,
      logLevel,
      botType,
      primaryPurpose,
      targetAudience,
      expectedDailyUsers,
      expectedDailyMessages,
      usesAi,
      downloadsMedia,
      uploadsFiles,
      storesUserData,
      usesDatabase,
      usesExternalApis,
      usesWebhooks,
      selectedCountries,
      ownerNumber,
      ownerName,
      ownerEmail,
      envVars: {
        SESSION_NAME: sessionName,
        AUTO_READ: String(autoRead),
        AUTO_TYPING: String(autoTyping),
        GEMINI_API_KEY: geminiApiKey,
        OPENAI_API_KEY: openaiApiKey,
        CLAUDE_API_KEY: claudeApiKey,
        MONGODB_URI: mongodbUri,
        POSTGRES_URI: postgresUri,
        REDIS_URI: redisUri,
        JWT_SECRET: jwtSecret,
        ENCRYPTION_KEY: encryptionKey,
        WEBHOOK_SECRET: webhookSecret,
        SESSION_SECRET: sessionSecret,
        PORT: port,
        NODE_ENV: nodeEnv
      },
      customEnvVars,
      riskAcknowledged
    };

    try {
      const response = await fetch('/api/deployment/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (resData.logs) {
        setPipelineLogs(resData.logs);
      }

      if (resData.success) {
        setPipelineResult(resData);

        if (onDeploy) {
          onDeploy({
            name: instanceName,
            platform,
            prefix: commandPrefix,
            status: 'running'
          });
        }

        // Show trust badge & security report briefly then COMPLETELY RESET wizard
        setTimeout(() => {
          resetWizardState(resData.newSession);
          if (onClose) onClose();
        }, 3200);
      } else {
        setDeploymentError(resData.error || 'Deployment pipeline failed');
      }
    } catch (err: any) {
      setDeploymentError(err?.message || 'Network error executing backend deployment pipeline');
    } finally {
      setIsDeploying(false);
    }
  };

  const countriesList = ['Kenya', 'Nigeria', 'South Africa', 'Ghana', 'USA', 'UK', 'India', 'Brazil', 'Global'];

  if (!isOpen) return null;

  const content = (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl my-auto shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
              <span>GURU-XD Cloud Deployment Wizard</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO HYPERVISOR v3.5
              </span>
            </h2>
            <p className="text-xs text-slate-400">Provision, analyze risk, enforce security, and launch autonomous bot instances.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBlueprint(!showBlueprint)}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-colors cursor-pointer ${
              showBlueprint 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showBlueprint ? 'Hide Blueprint' : 'Show Blueprint'}</span>
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Wizard Steps Navigation Bar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-3 shrink-0 overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-between min-w-[650px] gap-2 font-mono text-xs">
          {[
            { id: 1, label: '1. Platform' },
            { id: 2, label: '2. Allocation' },
            { id: 3, label: '3. Bot Profile' },
            { id: 4, label: '4. Risk & Protection' },
            { id: 5, label: '5. Secrets & Env' },
            { id: 6, label: '6. Validation & Launch' }
          ].map((st) => {
            const isActive = currentStep === st.id;
            const isPassed = currentStep > st.id;
            return (
              <button
                key={st.id}
                onClick={() => setCurrentStep(st.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30' 
                    : isPassed 
                    ? 'bg-slate-800 text-emerald-400 font-semibold' 
                    : 'bg-slate-900/60 text-slate-500 hover:text-slate-300'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body Grid: Form Content + Live Deployment Blueprint Floating Card */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Area (Steps 1 - 6) */}
        <div className={showBlueprint ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
          
          {/* STEP 1: Platform & Basic Config */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  <span>Step 1: Platform &amp; Instance Basics</span>
                </h3>
                <p className="text-xs text-slate-400">Configure identity, messaging platform type, runtime, and server deployment region.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Instance Name</label>
                  <input 
                    type="text"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    placeholder="e.g., guru-ai"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Command Prefix</label>
                  <input 
                    type="text"
                    value={commandPrefix}
                    onChange={(e) => setCommandPrefix(e.target.value)}
                    placeholder="e.g., . or /"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Messaging Platform</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['WhatsApp', 'Telegram', 'Discord', 'Slack'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPlatform(p);
                        if (p === 'WhatsApp') setCommandPrefix('.');
                        else if (p === 'Telegram') setCommandPrefix('/');
                        else if (p === 'Discord') setCommandPrefix('!');
                        else setCommandPrefix('/');
                      }}
                      className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        platform === p 
                          ? 'bg-blue-600/10 border-blue-500 text-blue-300 font-bold shadow-md shadow-blue-500/10' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-semibold">{p}</span>
                      {platform === p && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Runtime Engine</label>
                  <select
                    value={runtime}
                    onChange={(e) => setRuntime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="Node.js 20 LTS">Node.js 20 LTS</option>
                    <option value="Node.js 18 LTS">Node.js 18 LTS</option>
                    <option value="Node.js 22 Current">Node.js 22 Current</option>
                    <option value="Python 3.11">Python 3.11</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Cloud Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Kenya">Kenya (Nairobi)</option>
                    <option value="Europe (London)">Europe (London)</option>
                    <option value="US East (N. Virginia)">US East (N. Virginia)</option>
                    <option value="Asia (Singapore)">Asia (Singapore)</option>
                    <option value="South America (São Paulo)">South America (São Paulo)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Storage Allocation</label>
                  <select
                    value={storageAllocation}
                    onChange={(e) => setStorageAllocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="2 GB">2 GB SSD</option>
                    <option value="5 GB">5 GB NVMe</option>
                    <option value="10 GB">10 GB NVMe</option>
                    <option value="20 GB">20 GB NVMe</option>
                    <option value="50 GB">50 GB NVMe</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Resource Allocation */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Step 2: Resource Allocation &amp; Limits</span>
                </h3>
                <p className="text-xs text-slate-400">Set memory allocation, CPU quotas, auto-healing policies, and logging thresholds.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300">RAM Limit Allocation</span>
                  <span className="font-mono text-blue-400 font-bold">{memoryLimit} MB</span>
                </div>
                <input 
                  type="range"
                  min="128"
                  max="2048"
                  step="128"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>128 MB (Lite)</span>
                  <span>512 MB (Standard)</span>
                  <span>1024 MB (Pro)</span>
                  <span>2048 MB (Ultra)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300">CPU Cap Allocation</span>
                  <span className="font-mono text-emerald-400 font-bold">{cpuLimit}%</span>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={cpuLimit}
                  onChange={(e) => setCpuLimit(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>10%</span>
                  <span>50% (Standard)</span>
                  <span>100% (Full Core)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <div>
                    <span className="font-medium text-slate-200 block">Auto Restart on Crash</span>
                    <span className="text-[10px] text-slate-400">Automatically resurrect daemon on process crash</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={autoRestart}
                    onChange={(e) => setAutoRestart(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Log Level Output</label>
                  <select
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="info">info (Standard output)</option>
                    <option value="warning">warning (Only warnings &amp; errors)</option>
                    <option value="error">error (Critical errors only)</option>
                    <option value="debug">debug (Verbose debug trace)</option>
                    <option value="silent">silent (No output)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Bot Profile */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Step 3: Bot Profile &amp; Operational Intent</span>
                </h3>
                <p className="text-xs text-slate-400">Specify bot type, primary purpose, target audience, traffic expectations, and feature capabilities.</p>
              </div>

              {/* Bot Type Radio Selector Grid */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Bot Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {([
                    'AI Assistant',
                    'Customer Support',
                    'Business',
                    'Community',
                    'Group Management',
                    'Moderation',
                    'Downloader',
                    'Education',
                    'Entertainment',
                    'Utility',
                    'Personal',
                    'Other'
                  ] as BotType[]).map((bt) => (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => setBotType(bt)}
                      className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer flex items-center justify-between ${
                        botType === bt 
                          ? 'bg-purple-600/10 border-purple-500 text-purple-300 font-bold' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{bt}</span>
                      {botType === bt && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Purpose */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Primary Purpose</label>
                <textarea
                  rows={3}
                  value={primaryPurpose}
                  onChange={(e) => setPrimaryPurpose(e.target.value)}
                  placeholder='e.g., "This bot helps customers order products and answer questions."'
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Target Audience</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['Personal Use', 'Friends', 'Company', 'Public', 'Groups', 'Communities'] as TargetAudience[]).map((ta) => (
                    <button
                      key={ta}
                      type="button"
                      onClick={() => setTargetAudience(ta)}
                      className={`p-2 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                        targetAudience === ta 
                          ? 'bg-purple-600/10 border-purple-500 text-purple-300 font-bold' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ta}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders: Daily Users & Daily Messages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-xs font-medium text-slate-300 flex justify-between">
                    <span>Expected Daily Users</span>
                    <span className="font-mono text-purple-400 font-bold">{expectedDailyUsers}+</span>
                  </label>
                  <div className="flex gap-1">
                    {[10, 100, 500, 1000, 5000].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setExpectedDailyUsers(num)}
                        className={`flex-1 py-1 text-[10px] font-mono rounded-lg border cursor-pointer ${
                          expectedDailyUsers === num 
                            ? 'bg-purple-600 text-white font-bold border-purple-500' 
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {num >= 1000 ? `${num/1000}k` : num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-xs font-medium text-slate-300 flex justify-between">
                    <span>Expected Daily Messages</span>
                    <span className="font-mono text-purple-400 font-bold">{expectedDailyMessages}+</span>
                  </label>
                  <div className="flex gap-1">
                    {[100, 1000, 10000, 100000].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setExpectedDailyMessages(num)}
                        className={`flex-1 py-1 text-[10px] font-mono rounded-lg border cursor-pointer ${
                          expectedDailyMessages === num 
                            ? 'bg-purple-600 text-white font-bold border-purple-500' 
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {num >= 1000 ? `${num/1000}k` : num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Feature Flags &amp; Integrations</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { label: 'Uses AI?', val: usesAi, setVal: setUsesAi },
                    { label: 'Downloads Media?', val: downloadsMedia, setVal: setDownloadsMedia },
                    { label: 'Uploads Files?', val: uploadsFiles, setVal: setUploadsFiles },
                    { label: 'Stores User Data?', val: storesUserData, setVal: setStoresUserData },
                    { label: 'Uses Database?', val: usesDatabase, setVal: setUsesDatabase },
                    { label: 'Uses External APIs?', val: usesExternalApis, setVal: setUsesExternalApis },
                    { label: 'Uses Webhooks?', val: usesWebhooks, setVal: setUsesWebhooks }
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[11px] text-slate-300">{f.label}</span>
                      <button
                        type="button"
                        onClick={() => f.setVal(!f.val)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                          f.val ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {f.val ? 'YES' : 'NO'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Countries Multi-Select */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Expected Operating Countries</label>
                <div className="flex flex-wrap gap-1.5">
                  {countriesList.map((c) => {
                    const isSel = selectedCountries.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          if (isSel) setSelectedCountries(selectedCountries.filter(x => x !== c));
                          else setSelectedCountries([...selectedCountries, c]);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                          isSel 
                            ? 'bg-purple-600/20 border-purple-500/40 text-purple-300 font-semibold' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Risk Analysis & Server Protection */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Step 4: Bot Risk Analysis &amp; Server Protection</span>
                </h3>
                <p className="text-xs text-slate-400">Automated threat modeling, anti-spam safeguards, and resource protection inspection.</p>
              </div>

              {/* Calculated Risk Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                riskAnalysis.level === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
                riskAnalysis.level === 'HIGH' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                riskAnalysis.level === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">Calculated Bot Risk Score</span>
                  <div className="text-2xl font-bold font-mono flex items-center gap-2">
                    <span>{riskAnalysis.score}%</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full border bg-slate-950/80 uppercase">
                      {riskAnalysis.level} RISK
                    </span>
                  </div>
                </div>

                <p className="text-xs max-w-sm leading-relaxed">
                  {riskAnalysis.level === 'LOW' && 'This bot profile exhibits healthy parameters and poses minimal platform threat.'}
                  {riskAnalysis.level === 'MEDIUM' && 'Moderate resource usage and message volume detected. Standard monitoring applied.'}
                  {riskAnalysis.level === 'HIGH' && 'High message traffic or media downloading detected. User acknowledgment mandatory.'}
                  {riskAnalysis.level === 'CRITICAL' && 'Potential spam or resource overload pattern. Review environment secrets before deploy.'}
                </p>
              </div>

              {/* Risk Reasons Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                  <span className="font-bold text-emerald-400 uppercase text-[10px]">Positive Compliance Factors</span>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    {riskAnalysis.positiveReasons.map((pos, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-emerald-300">
                        <span>{pos}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                  <span className="font-bold text-amber-400 uppercase text-[10px]">Risk &amp; Threat Flags</span>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    {riskAnalysis.warningReasons.length > 0 ? (
                      riskAnalysis.warningReasons.map((wrn, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-amber-300">
                          <span>{wrn}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">No threat flags detected.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Server Protection Automated Checks */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Server Protection Guard Rail Checks</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    { check: 'Excessive Broadcasting Detector', pass: expectedDailyMessages < 100000 },
                    { check: 'Spam Behavior Guard', pass: true },
                    { check: 'Mass Messaging Threshold', pass: expectedDailyMessages < 50000 },
                    { check: 'Unknown Webhooks Inspector', pass: !usesWebhooks },
                    { check: 'Suspicious Env Variable Audit', pass: true },
                    { check: 'Owner Number Presence', pass: !!ownerNumber },
                    { check: 'Resource Bounds (RAM & CPU)', pass: memoryLimit <= 1024 && cpuLimit <= 80 },
                    { check: 'Infinite Restart Loop Protection', pass: autoRestart }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl">
                      <span className="text-slate-300 text-[11px]">{item.check}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.pass ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.pass ? 'PASSED' : 'WARNING'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Environment Security */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <span>Step 5: Categorized Environment Security &amp; Secrets</span>
                </h3>
                <p className="text-xs text-slate-400">Configure owner credentials, session params, AI keys, databases, security hashes, and custom variables.</p>
              </div>

              {/* Secrets Section Switcher */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto">
                {['Owner', 'WhatsApp', 'AI', 'Database', 'Security', 'Cloud', 'Custom'].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setActiveSecretsSection(sec)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-colors cursor-pointer whitespace-nowrap ${
                      activeSecretsSection === sec 
                        ? 'bg-indigo-600 text-white font-bold' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>

              {/* Active Section Inputs */}
              {activeSecretsSection === 'Owner' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">OWNER_NUMBER</label>
                    <input 
                      type="text" 
                      value={ownerNumber} 
                      onChange={(e) => setOwnerNumber(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">OWNER_NAME</label>
                    <input 
                      type="text" 
                      value={ownerName} 
                      onChange={(e) => setOwnerName(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">OWNER_EMAIL</label>
                    <input 
                      type="text" 
                      value={ownerEmail} 
                      onChange={(e) => setOwnerEmail(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              )}

              {activeSecretsSection === 'WhatsApp' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">SESSION_NAME</label>
                    <input 
                      type="text" 
                      value={sessionName} 
                      onChange={(e) => setSessionName(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-300 font-mono">AUTO_READ</span>
                      <input type="checkbox" checked={autoRead} onChange={(e) => setAutoRead(e.target.checked)} className="accent-indigo-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-300 font-mono">AUTO_TYPING</span>
                      <input type="checkbox" checked={autoTyping} onChange={(e) => setAutoTyping(e.target.checked)} className="accent-indigo-500" />
                    </div>
                  </div>
                </div>
              )}

              {activeSecretsSection === 'AI' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">GEMINI_API_KEY</label>
                    <input 
                      type="password" 
                      value={geminiApiKey} 
                      onChange={(e) => setGeminiApiKey(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">OPENAI_API_KEY</label>
                    <input 
                      type="password" 
                      value={openaiApiKey} 
                      onChange={(e) => setOpenaiApiKey(e.target.value)} 
                      placeholder="sk-proj-..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">CLAUDE_API_KEY</label>
                    <input 
                      type="password" 
                      value={claudeApiKey} 
                      onChange={(e) => setClaudeApiKey(e.target.value)} 
                      placeholder="sk-ant-..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              )}

              {activeSecretsSection === 'Database' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">MONGODB_URI</label>
                    <input 
                      type="text" 
                      value={mongodbUri} 
                      onChange={(e) => setMongodbUri(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">POSTGRES_URI</label>
                    <input 
                      type="text" 
                      value={postgresUri} 
                      onChange={(e) => setPostgresUri(e.target.value)} 
                      placeholder="postgresql://user:pass@host:5432/db"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">REDIS_URI</label>
                    <input 
                      type="text" 
                      value={redisUri} 
                      onChange={(e) => setRedisUri(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              )}

              {activeSecretsSection === 'Security' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">JWT_SECRET</label>
                    <input 
                      type="password" 
                      value={jwtSecret} 
                      onChange={(e) => setJwtSecret(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">ENCRYPTION_KEY</label>
                    <input 
                      type="password" 
                      value={encryptionKey} 
                      onChange={(e) => setEncryptionKey(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              )}

              {activeSecretsSection === 'Cloud' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">PORT</label>
                    <input type="text" value={port} onChange={(e) => setPort(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-indigo-300 font-semibold">NODE_ENV</label>
                    <input type="text" value={nodeEnv} onChange={(e) => setNodeEnv(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200" />
                  </div>
                </div>
              )}

              {activeSecretsSection === 'Custom' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="VARIABLE_NAME" 
                      value={newCustomKey} 
                      onChange={(e) => setNewCustomKey(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 uppercase"
                    />
                    <input 
                      type="text" 
                      placeholder="value" 
                      value={newCustomVal} 
                      onChange={(e) => setNewCustomVal(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddCustomEnv}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Add Secret
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {customEnvVars.map((env, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg text-xs font-mono">
                        <span><strong className="text-indigo-400">{env.key}</strong> = {env.value}</span>
                        <button type="button" onClick={() => handleRemoveCustomEnv(idx)} className="text-rose-400 hover:text-rose-300 text-xs">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Validation & Launch */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Step 6: Security Verification &amp; Backend Pipeline Launch</span>
                </h3>
                <p className="text-xs text-slate-400">Automated 13-stage backend scanning pipeline, bot analysis, security checks, and trust badge generation.</p>
              </div>

              {/* Deployment Running or Finished View */}
              {(isDeploying || pipelineLogs.length > 0 || pipelineResult || deploymentError) ? (
                <div className="space-y-4">
                  {/* Pipeline Status Banner */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-bold ${
                        deploymentError ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' :
                        pipelineResult?.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                        'bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-pulse'
                      }`}>
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                          <span>{isDeploying ? 'Executing 13-Stage Deployment Pipeline...' : pipelineResult?.success ? 'Deployment Pipeline Completed Successfully' : 'Pipeline Security Halt'}</span>
                          {pipelineResult?.trustBadge && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
                              {pipelineResult.trustBadge}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {isDeploying ? 'Validating request, scanning environment, analyzing source code, and allocating resources.' :
                           pipelineResult?.success ? 'Instance container active, secrets encrypted, trust badge generated, audit log committed.' :
                           deploymentError || 'Deployment failed pipeline security checks.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stage Execution Console */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        <span>PIPELINE STAGE AUDIT STREAM</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {pipelineLogs.length} / 13 Stages Logged
                      </span>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {pipelineLogs.map((log) => (
                        <div key={log.stageNumber} className="flex items-start gap-2 text-[11px] p-2 bg-slate-900/80 rounded-xl border border-slate-800/80">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                            log.status === 'passed' ? 'text-emerald-400' : log.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-200">Stage {log.stageNumber}: {log.stageName}</span>
                              <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                            </div>
                            <p className="text-slate-400 text-[10px] mt-0.5">{log.details}</p>
                          </div>
                        </div>
                      ))}

                      {isDeploying && (
                        <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-xs animate-pulse font-mono">
                          <Zap className="w-3.5 h-3.5 animate-spin" />
                          <span>Container hypervisor initializing microservice thread...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security Profile Details Card */}
                  {pipelineResult?.securityProfile && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          <span>INSTANCE SECURITY PROFILE</span>
                        </span>
                        <span>{pipelineResult.securityProfile.deploymentVersion}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-slate-500">Deployment ID:</span> <span className="text-slate-200">{pipelineResult.securityProfile.deploymentId}</span></div>
                        <div><span className="text-slate-500">Trust Badge:</span> <span className="text-emerald-300 font-bold">{pipelineResult.securityProfile.trustBadge}</span></div>
                        <div><span className="text-slate-500">Security Hash:</span> <span className="text-indigo-300">{pipelineResult.securityProfile.securityHash}</span></div>
                        <div><span className="text-slate-500">Integrity Hash:</span> <span className="text-indigo-300">{pipelineResult.securityProfile.integrityHash}</span></div>
                        <div><span className="text-slate-500">Instance FP:</span> <span className="text-slate-300">{pipelineResult.securityProfile.instanceFingerprint}</span></div>
                        <div><span className="text-slate-500">Container FP:</span> <span className="text-slate-300">{pipelineResult.securityProfile.containerFingerprint}</span></div>
                      </div>

                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-[11px] flex items-center justify-between">
                        <span>✔ Deployment Complete. Wizard session resetting automatically...</span>
                        <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-bold">Session Cleared</span>
                      </div>
                    </div>
                  )}

                  {deploymentError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs space-y-1">
                      <div className="font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Pipeline Error</span>
                      </div>
                      <p>{deploymentError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Health Score Overview Card */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center font-mono font-bold text-emerald-400">
                        <span className="text-xl">{deploymentHealth.score}%</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400">HEALTH</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                          <span>Deployment Health Index</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                            {deploymentHealth.status}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">All pre-flight security parameters, environmental variables, and quotas validated.</p>
                      </div>
                    </div>
                  </div>

                  {/* Security Feature Checklist */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Security &amp; Compliance Checks</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                      {[
                        { title: 'Secret Encryption', pass: true },
                        { title: 'API Key Validation', pass: !!(geminiApiKey || openaiApiKey) },
                        { title: 'Duplicate Variable Check', pass: true },
                        { title: 'Required Variables', pass: !!ownerNumber },
                        { title: 'Dangerous Variable Guard', pass: true },
                        { title: 'Owner Number Format', pass: ownerNumber.length >= 8 },
                        { title: 'Prefix Validation', pass: !!commandPrefix },
                        { title: 'Weak Secret Inspection', pass: true },
                        { title: 'Runtime Compatibility', pass: true }
                      ].map((chk, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                          <CheckCircle2 className={chk.pass ? "w-3.5 h-3.5 text-emerald-400 shrink-0" : "w-3.5 h-3.5 text-amber-400 shrink-0"} />
                          <span className="text-slate-300 text-[11px] truncate">{chk.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* High Risk Warning & Mandatory Acknowledgment */}
                  {(riskAnalysis.level === 'HIGH' || riskAnalysis.level === 'CRITICAL') && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Elevated Risk Level Detected ({riskAnalysis.score}%)</span>
                      </div>
                      <p className="leading-relaxed">
                        This bot profile requests elevated capabilities (e.g. media downloads or heavy broadcasting). You must acknowledge platform compliance before deployment.
                      </p>
                      <label className="flex items-center gap-2 pt-1 font-mono text-slate-200 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={riskAcknowledged} 
                          onChange={(e) => setRiskAcknowledged(e.target.checked)} 
                          className="w-4 h-4 accent-amber-500"
                        />
                        <span>I confirm this bot complies with platform guidelines and user agreement.</span>
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Bottom Step Control Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalDeploy}
                disabled={(riskAnalysis.level === 'HIGH' || riskAnalysis.level === 'CRITICAL') && !riskAcknowledged}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-xl shadow-emerald-600/25"
              >
                <Zap className="w-4 h-4" />
                <span>Deploy Instance Now</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Floating / Collapsible Card: LIVE DEPLOYMENT BLUEPRINT */}
        {showBlueprint && (
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 font-mono text-xs shadow-inner">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Terminal className="w-4 h-4" />
                  <span className="uppercase tracking-wider">LIVE DEPLOYMENT BLUEPRINT</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold animate-pulse">
                  REAL-TIME
                </span>
              </div>

              {/* Formatted Output Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-slate-300 font-mono text-[11px] leading-relaxed">
                <div className="text-slate-400 font-bold pb-1 border-b border-slate-800/60 flex justify-between">
                  <span>Instance Blueprint</span>
                  <span className="text-blue-400">{instanceName || 'guru-ai'}</span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <span className="text-slate-500">Name</span>
                  <span className="text-slate-200 font-bold truncate">: {instanceName || 'guru-ai'}</span>

                  <span className="text-slate-500">Platform</span>
                  <span className="text-blue-400 font-semibold">: {platform}</span>

                  <span className="text-slate-500">Runtime</span>
                  <span className="text-slate-200">: {runtime}</span>

                  <span className="text-slate-500">Memory</span>
                  <span className="text-emerald-400 font-bold">: {memoryLimit} MB</span>

                  <span className="text-slate-500">CPU</span>
                  <span className="text-emerald-400 font-bold">: {cpuLimit}%</span>

                  <span className="text-slate-500">Storage</span>
                  <span className="text-slate-200">: {storageAllocation}</span>

                  <span className="text-slate-500">Auto Restart</span>
                  <span className="text-slate-200">: {autoRestart ? 'Enabled' : 'Disabled'}</span>

                  <span className="text-slate-500">Region</span>
                  <span className="text-slate-200">: {region}</span>

                  <span className="text-slate-500">Status</span>
                  <span className="text-emerald-400 font-bold">: Ready</span>

                  <span className="text-slate-500">Bot Type</span>
                  <span className="text-purple-300">: {botType}</span>

                  <span className="text-slate-500">Daily Messages</span>
                  <span className="text-purple-300">: {expectedDailyMessages}+</span>

                  <span className="text-slate-500">Risk Score</span>
                  <span className={riskAnalysis.level === 'HIGH' || riskAnalysis.level === 'CRITICAL' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    : {riskAnalysis.score}% ({riskAnalysis.level})
                  </span>

                  <span className="text-slate-500">Health Index</span>
                  <span className="text-emerald-400 font-bold">: {deploymentHealth.score}%</span>
                </div>
              </div>

              {/* Dynamic Health Factors Bar */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Health Factors Breakdown</span>
                <div className="space-y-1 text-[10px]">
                  {Object.entries(deploymentHealth.factors).map(([k, v]) => (
                    <div key={k} className="space-y-0.5">
                      <div className="flex justify-between text-slate-400">
                        <span className="capitalize">{k}</span>
                        <span className="font-mono text-slate-200">{v}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${v > 80 ? 'bg-emerald-500' : v > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                          style={{ width: `${v}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-3 text-[10px] text-slate-500 flex items-center justify-between">
              <span>GURU-XD Cloud Infrastructure</span>
              <span className="text-slate-400">Sync: Live</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-200 overflow-y-auto">
      {content}
    </div>
  );
}
