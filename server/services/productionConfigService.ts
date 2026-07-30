import { AppEventBus } from './eventBus';
import { AuditService } from './auditService';
import { NotificationService } from './notificationService';

export type EnvironmentProfileType = 'development' | 'testing' | 'staging' | 'production';

export interface EnvVariableItem {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  environment: EnvironmentProfileType;
  resourceId?: string; // Optional: deployment-specific override
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
  issuer: 'Let\'s Encrypt CA' | 'DigiCert TLS RSA' | 'ZeroSSL' | 'Internal Enterprise CA';
  status: 'Active' | 'Expiring Soon' | 'Renewing' | 'Expired';
  validFrom: string;
  validTo: string;
  daysUntilExpiration: number;
  autoRenew: boolean;
  keyType: '2048-bit RSA' | '4096-bit RSA' | 'ECDSA P-256';
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
  environment: EnvironmentProfileType;
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

export class ProductionConfigService {
  private static instance: ProductionConfigService;
  private eventBus = AppEventBus.getInstance();
  private auditService = AuditService.getInstance();
  private notificationService = NotificationService.getInstance();

  private envVariables: Map<string, EnvVariableItem> = new Map();
  private templates: Map<string, EnvironmentTemplate> = new Map();
  private sslCertificates: Map<string, SslCertificate> = new Map();
  private customDomains: Map<string, CustomDomain> = new Map();

  private constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): ProductionConfigService {
    if (!ProductionConfigService.instance) {
      ProductionConfigService.instance = new ProductionConfigService();
    }
    return ProductionConfigService.instance;
  }

  private seedDefaultData() {
    // 1. Seed Environment Templates
    const defaultTemplates: EnvironmentTemplate[] = [
      {
        id: 'tmpl-whatsapp-bot',
        name: 'WhatsApp Master Bot Profile',
        description: 'Standard runtime environment config for Baileys/WhatsApp automation daemons',
        targetResourceType: 'instance',
        defaultVariables: [
          { key: 'SESSION_ID', defaultValue: 'guru_wa_default_sess', isSecret: true, required: true, comment: 'Session authentication payload' },
          { key: 'PREFIX', defaultValue: '.', isSecret: false, required: true, comment: 'Command prefix character' },
          { key: 'AUTO_READ', defaultValue: 'true', isSecret: false, required: false, comment: 'Automatically mark messages as read' },
          { key: 'WORKERS_COUNT', defaultValue: '4', isSecret: false, required: false, comment: 'Parallel message dispatch worker count' }
        ]
      },
      {
        id: 'tmpl-microservice-api',
        name: 'Express Node.js Microservice',
        description: 'Hardened backend REST API template with JWT and database credentials',
        targetResourceType: 'api',
        defaultVariables: [
          { key: 'PORT', defaultValue: '3000', isSecret: false, required: true, comment: 'HTTP listener port' },
          { key: 'JWT_SECRET', defaultValue: 'guru_super_jwt_secret_key_2026', isSecret: true, required: true, comment: 'JWT signature signing key' },
          { key: 'DATABASE_URL', defaultValue: 'postgres://guru_user:secret@k8s-pg-cluster:5432/guru_db', isSecret: true, required: true, comment: 'PostgreSQL connection string' },
          { key: 'NODE_ENV', defaultValue: 'production', isSecret: false, required: true, comment: 'Node execution environment' }
        ]
      },
      {
        id: 'tmpl-ai-agent',
        name: 'AI Agent Service Profile',
        description: 'Gemini & Vector DB credentials for autonomous AI Copilot microservices',
        targetResourceType: 'agent',
        defaultVariables: [
          { key: 'GEMINI_API_KEY', defaultValue: 'AIzaSyA8x9...003q8L', isSecret: true, required: true, comment: 'Google Gemini API Key' },
          { key: 'MODEL_NAME', defaultValue: 'gemini-3.5-flash', isSecret: false, required: true, comment: 'Primary reasoning model' },
          { key: 'VECTOR_DB_URL', defaultValue: 'https://qdrant.guru-xd.internal:6333', isSecret: true, required: false, comment: 'Vector storage endpoint' }
        ]
      }
    ];
    defaultTemplates.forEach(t => this.templates.set(t.id, t));

    // 2. Seed Environment & Secrets Variables
    const defaultEnvs: EnvVariableItem[] = [
      {
        id: 'env-01',
        key: 'NODE_ENV',
        value: 'production',
        isSecret: false,
        environment: 'production',
        scope: 'global',
        comment: 'Default runtime target profile',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'root-admin'
      },
      {
        id: 'env-02',
        key: 'GURU_ENCRYPTION_KEY',
        value: 'enc_sec_99381029384710293847120398',
        isSecret: true,
        environment: 'production',
        scope: 'global',
        comment: 'Master AES-256 payload encryption key',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'security-admin'
      },
      {
        id: 'env-03',
        key: 'SESSION_ID',
        value: 'guru_wa_master_production_token_88329',
        isSecret: true,
        environment: 'production',
        resourceId: 'res-app-1',
        resourceName: 'guru-whatsapp-master',
        scope: 'deployment',
        comment: 'WhatsApp Bot Session Auth Secret',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'operator'
      },
      {
        id: 'env-04',
        key: 'GEMINI_API_KEY',
        value: 'AIzaSyC29837492837498273948273948',
        isSecret: true,
        environment: 'production',
        resourceId: 'res-app-3',
        resourceName: 'ai-copilot-agent-service',
        scope: 'deployment',
        comment: 'Gemini API key for AI Copilot',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'ai-sys-admin'
      },
      {
        id: 'env-05',
        key: 'STAGING_DEBUG_MODE',
        value: 'verbose',
        isSecret: false,
        environment: 'staging',
        scope: 'profile',
        comment: 'Staging environment trace level',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'qa-lead'
      }
    ];
    defaultEnvs.forEach(e => this.envVariables.set(e.id, e));

    // 3. Seed SSL Certificates
    const now = new Date();
    const cert1ValTo = new Date(now.getTime() + 82 * 86400000);
    const cert2ValTo = new Date(now.getTime() + 14 * 86400000); // Expiring soon

    const defaultCerts: SslCertificate[] = [
      {
        id: 'cert-01',
        domainName: 'guru-xd.com',
        sans: ['*.guru-xd.com', 'api.guru-xd.com', 'wa.guru-xd.com'],
        issuer: 'Let\'s Encrypt CA',
        status: 'Active',
        validFrom: new Date(now.getTime() - 8 * 86400000).toISOString(),
        validTo: cert1ValTo.toISOString(),
        daysUntilExpiration: 82,
        autoRenew: true,
        keyType: '2048-bit RSA',
        sha256Fingerprint: 'A3:89:C4:12:F0:88:8C:3B:11:42:09:DE:7B:3A:C1:E2:00:88:22:11',
        healthStatus: 'Healthy',
        lastCheckedAt: new Date().toISOString()
      },
      {
        id: 'cert-02',
        domainName: 'bots.guru-xd.internal',
        sans: ['wa-master.guru-xd.internal', 'tg-sentinel.guru-xd.internal'],
        issuer: 'Internal Enterprise CA',
        status: 'Expiring Soon',
        validFrom: new Date(now.getTime() - 76 * 86400000).toISOString(),
        validTo: cert2ValTo.toISOString(),
        daysUntilExpiration: 14,
        autoRenew: true,
        keyType: '4096-bit RSA',
        sha256Fingerprint: 'B1:99:88:77:66:55:44:33:22:11:00:AA:BB:CC:DD:EE:FF:00:11:22',
        healthStatus: 'Degraded',
        lastCheckedAt: new Date().toISOString()
      }
    ];
    defaultCerts.forEach(c => this.sslCertificates.set(c.id, c));

    // 4. Seed Custom Domains & DNS Mappings
    const defaultDomains: CustomDomain[] = [
      {
        id: 'dom-01',
        domainName: 'guru-xd.com',
        subdomain: 'wa',
        fullDomain: 'wa.guru-xd.com',
        resourceId: 'res-app-1',
        resourceName: 'guru-whatsapp-master',
        environment: 'production',
        status: 'Verified',
        dnsRecordType: 'CNAME',
        expectedValue: 'target-docker-01.guru-xd.internal',
        actualValue: 'target-docker-01.guru-xd.internal',
        sslCertificateId: 'cert-01',
        sslEnabled: true,
        healthStatus: 'Healthy',
        lastVerifiedAt: new Date().toISOString(),
        createdAt: new Date(now.getTime() - 86400000 * 10).toISOString()
      },
      {
        id: 'dom-02',
        domainName: 'guru-xd.com',
        subdomain: 'ai-copilot',
        fullDomain: 'ai-copilot.guru-xd.com',
        resourceId: 'res-app-3',
        resourceName: 'ai-copilot-agent-service',
        environment: 'production',
        status: 'Verified',
        dnsRecordType: 'CNAME',
        expectedValue: 'k8s-ingress.guru-xd.internal',
        actualValue: 'k8s-ingress.guru-xd.internal',
        sslCertificateId: 'cert-01',
        sslEnabled: true,
        healthStatus: 'Healthy',
        lastVerifiedAt: new Date().toISOString(),
        createdAt: new Date(now.getTime() - 86400000 * 5).toISOString()
      },
      {
        id: 'dom-03',
        domainName: 'custom-client-gateway.io',
        subdomain: 'api',
        fullDomain: 'api.custom-client-gateway.io',
        resourceId: 'res-app-4',
        resourceName: 'express-auth-microservice',
        environment: 'production',
        status: 'Pending DNS',
        dnsRecordType: 'A',
        expectedValue: '35.224.120.44',
        sslEnabled: false,
        healthStatus: 'DNS Misconfigured',
        lastVerifiedAt: new Date().toISOString(),
        createdAt: new Date(now.getTime() - 3600000 * 2).toISOString()
      }
    ];
    defaultDomains.forEach(d => this.customDomains.set(d.id, d));
  }

  // --- Secret Masking Utility ---
  public maskSecretValue(val: string): string {
    if (!val) return '';
    if (val.length <= 8) return '••••••••';
    return `${val.substring(0, 3)}••••••••${val.substring(val.length - 4)}`;
  }

  // --- Environment & Secrets API ---
  public getEnvVariables(envProfile?: EnvironmentProfileType, resourceId?: string, includeUnmaskedSecret: boolean = false): EnvVariableItem[] {
    let list = Array.from(this.envVariables.values());

    if (envProfile) {
      list = list.filter(e => e.environment === envProfile || e.scope === 'global');
    }

    if (resourceId) {
      list = list.filter(e => e.scope !== 'deployment' || e.resourceId === resourceId);
    }

    return list.map(item => {
      if (item.isSecret && !includeUnmaskedSecret) {
        return {
          ...item,
          value: this.maskSecretValue(item.value)
        };
      }
      return item;
    });
  }

  public upsertEnvVariable(payload: {
    id?: string;
    key: string;
    value: string;
    isSecret?: boolean;
    environment?: EnvironmentProfileType;
    resourceId?: string;
    resourceName?: string;
    scope?: 'global' | 'profile' | 'deployment';
    comment?: string;
    updatedBy?: string;
  }): EnvVariableItem {
    const id = payload.id || `env-${Date.now()}`;
    const existing = this.envVariables.get(id);

    // If payload value is masked (e.g. contains '••••'), retain previous secret value if existing
    let finalValue = payload.value;
    if (existing && existing.isSecret && payload.value.includes('••••')) {
      finalValue = existing.value;
    }

    const item: EnvVariableItem = {
      id,
      key: payload.key.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
      value: finalValue,
      isSecret: payload.isSecret ?? false,
      environment: payload.environment || 'production',
      resourceId: payload.resourceId,
      resourceName: payload.resourceName,
      scope: payload.scope || (payload.resourceId ? 'deployment' : 'profile'),
      comment: payload.comment || '',
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: payload.updatedBy || 'operator'
    };

    this.envVariables.set(id, item);

    // Event Bus Notification
    if (item.isSecret) {
      this.eventBus.publish('SECRET_UPDATED', { id, key: item.key, env: item.environment, scope: item.scope }, item.resourceId, 'ProductionConfigService');
    } else {
      this.eventBus.publish('ENVIRONMENT_CONFIG_CHANGED', { id, key: item.key, env: item.environment }, item.resourceId, 'ProductionConfigService');
    }

    this.auditService.recordAudit({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: item.isSecret ? 'SECRET_UPDATED' : 'ENVIRONMENT_VAR_UPDATED',
      actor: item.updatedBy,
      appId: item.resourceId,
      target: `${item.environment}:${item.key}`,
      details: { key: item.key, scope: item.scope, isSecret: item.isSecret },
      status: 'success'
    });

    return item.isSecret ? { ...item, value: this.maskSecretValue(item.value) } : item;
  }

  public deleteEnvVariable(id: string): boolean {
    const existing = this.envVariables.get(id);
    if (!existing) return false;

    this.envVariables.delete(id);
    this.eventBus.publish('ENVIRONMENT_CONFIG_CHANGED', { id, key: existing.key, action: 'deleted' }, existing.resourceId, 'ProductionConfigService');
    return true;
  }

  public getEnvironmentTemplates(): EnvironmentTemplate[] {
    return Array.from(this.templates.values());
  }

  // --- HTTPS & SSL Management API ---
  public getSslCertificates(): SslCertificate[] {
    return Array.from(this.sslCertificates.values());
  }

  public renewSslCertificate(certId: string): { success: boolean; certificate?: SslCertificate; message: string } {
    const cert = this.sslCertificates.get(certId);
    if (!cert) {
      return { success: false, message: `SSL certificate ${certId} not found.` };
    }

    const now = new Date();
    const renewedTo = new Date(now.getTime() + 90 * 86400000); // 90 days Let's Encrypt renewal
    cert.status = 'Active';
    cert.healthStatus = 'Healthy';
    cert.validFrom = now.toISOString();
    cert.validTo = renewedTo.toISOString();
    cert.daysUntilExpiration = 90;
    cert.lastCheckedAt = now.toISOString();
    cert.sha256Fingerprint = Array.from({ length: 20 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':');

    this.sslCertificates.set(certId, cert);

    this.eventBus.publish('SSL_CERT_RENEWED', { certId, domain: cert.domainName, validTo: cert.validTo }, undefined, 'ProductionConfigService');
    this.notificationService.notify({
      id: `notif-ssl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      title: 'SSL Certificate Renewed',
      message: `TLS certificate for ${cert.domainName} was renewed successfully. Valid through ${renewedTo.toLocaleDateString()}.`,
      read: false
    });

    return { success: true, certificate: cert, message: `Successfully renewed SSL certificate for ${cert.domainName}` };
  }

  // --- Domain Management API ---
  public getCustomDomains(): CustomDomain[] {
    return Array.from(this.customDomains.values());
  }

  public registerCustomDomain(payload: {
    domainName: string;
    subdomain?: string;
    resourceId: string;
    resourceName: string;
    environment?: EnvironmentProfileType;
    dnsRecordType?: 'CNAME' | 'A' | 'TXT';
  }): CustomDomain {
    const id = `dom-${Date.now().toString().slice(-5)}`;
    const fullDomain = payload.subdomain ? `${payload.subdomain}.${payload.domainName}` : payload.domainName;
    const dnsType = payload.dnsRecordType || 'CNAME';
    const expected = dnsType === 'CNAME' ? `${payload.resourceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.guru-xd.internal` : '35.224.120.44';

    const domain: CustomDomain = {
      id,
      domainName: payload.domainName,
      subdomain: payload.subdomain,
      fullDomain,
      resourceId: payload.resourceId,
      resourceName: payload.resourceName,
      environment: payload.environment || 'production',
      status: 'Pending DNS',
      dnsRecordType: dnsType,
      expectedValue: expected,
      sslEnabled: true,
      sslCertificateId: 'cert-01',
      healthStatus: 'Degraded',
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.customDomains.set(id, domain);

    this.eventBus.publish('DOMAIN_VERIFIED', { id, fullDomain, status: domain.status }, payload.resourceId, 'ProductionConfigService');
    return domain;
  }

  public verifyCustomDomain(id: string): { success: boolean; domain?: CustomDomain; message: string } {
    const dom = this.customDomains.get(id);
    if (!dom) {
      return { success: false, message: `Custom domain ${id} not found.` };
    }

    // Simulate DNS lookup verification
    dom.status = 'Verified';
    dom.actualValue = dom.expectedValue;
    dom.healthStatus = 'Healthy';
    dom.lastVerifiedAt = new Date().toISOString();

    this.customDomains.set(id, dom);

    this.eventBus.publish('DOMAIN_VERIFIED', { id, fullDomain: dom.fullDomain, status: 'Verified' }, dom.resourceId, 'ProductionConfigService');
    this.auditService.recordAudit({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DOMAIN_VERIFIED',
      actor: 'system-dns-checker',
      appId: dom.resourceId,
      target: dom.fullDomain,
      details: { domainId: id, recordType: dom.dnsRecordType, value: dom.expectedValue },
      status: 'success'
    });

    return { success: true, domain: dom, message: `DNS verification passed for ${dom.fullDomain}` };
  }
}
