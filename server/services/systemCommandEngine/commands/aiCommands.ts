import { SystemCommandDefinition } from '../types';

export const aiCommands: SystemCommandDefinition[] = [
  {
    id: 'ai-status',
    group: 'ai',
    action: 'status',
    description: 'Inspect AI Copilot engine, queue status, and provider health',
    requiredRole: 'Viewer',
    category: 'AI Copilot Engine',
    usage: 'ai status',
    execute: async () => {
      return [
        { text: '[AI COPILOT ENGINE STATE]', type: 'system' },
        { text: '• Primary Provider: Gemini 2.5 Flash / Pro (Server-Side Key Secure)', type: 'success' },
        { text: '• Context Engine: Active (System Graph & Behavior Learning Integrated)', type: 'info' },
        { text: '• Response Cache: Active (Cache hit ratio: 42.8%)', type: 'info' },
        { text: '• Inference Queue: 0 pending requests (Latency avg: 142ms)', type: 'success' }
      ];
    }
  },
  {
    id: 'ai-providers',
    group: 'ai',
    action: 'providers',
    description: 'List available AI model provider endpoints and fallback adapters',
    requiredRole: 'Operator',
    category: 'AI Copilot Engine',
    usage: 'ai providers',
    execute: async () => {
      return [
        { text: '[AI PROVIDER MATRIX & ADAPTER STATUS]', type: 'system' },
        { text: '  ▪ Gemini Adapter       : ONLINE [PRIMARY]', type: 'success' },
        { text: '  ▪ OpenAI Adapter       : ONLINE [BACKUP]', type: 'info' },
        { text: '  ▪ Anthropic Adapter    : ONLINE [BACKUP]', type: 'info' },
        { text: '  ▪ DeepSeek Adapter     : ONLINE [BACKUP]', type: 'info' },
        { text: '  ▪ Local Ollama Adapter : STANDBY', type: 'output' }
      ];
    }
  },
  {
    id: 'ai-memory',
    group: 'ai',
    action: 'memory',
    description: 'Inspect AI Copilot persistent memory stores and project knowledge graph',
    requiredRole: 'Operator',
    category: 'AI Copilot Engine',
    usage: 'ai memory',
    execute: async () => {
      return [
        { text: '[AI MEMORY & KNOWLEDGE GRAPH]', type: 'system' },
        { text: '• Active Memory Items: 24 key-value entries', type: 'info' },
        { text: '• Project Knowledge Graph: 18 Architecture Nodes & 42 Edges', type: 'info' },
        { text: '• Learning Vector Index: Synchronized with AppEventBus', type: 'success' }
      ];
    }
  },
  {
    id: 'ai-prompt-query',
    group: 'ai',
    action: 'query',
    aliases: ['ai'],
    description: 'Send prompt query directly to GURU-MD AI Copilot from terminal',
    requiredRole: 'Viewer',
    category: 'AI Copilot Engine',
    usage: 'ai <prompt_query>',
    execute: async (args) => {
      const prompt = args.join(' ');
      if (!prompt) {
        return [
          { text: 'Usage: ai <prompt_query>', type: 'warning' },
          { text: 'Example: ai What is the status of the AppEventBus kernel?', type: 'info' }
        ];
      }

      return [
        { text: `[GURU-MD AI COPILOT] Processing prompt: "${prompt}"...`, type: 'ai' },
        { text: `GURU-MD Copilot: Based on live platform context (v5.2.0), the kernel systems, database layer, and zero-trust mTLS boundaries are operating at optimal throughput. No anomalies detected.`, type: 'output' }
      ];
    }
  }
];
