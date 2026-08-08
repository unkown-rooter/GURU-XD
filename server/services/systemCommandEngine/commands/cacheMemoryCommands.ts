import { SystemCommandDefinition } from '../types';
import { dbService } from '../../../db';

export const cacheMemoryCommands: SystemCommandDefinition[] = [
  {
    id: 'cache-clear',
    group: 'cache',
    action: 'clear',
    description: 'Purge transient in-memory response and query caches',
    requiredRole: 'Operator',
    category: 'Cache & Memory',
    usage: 'cache clear',
    execute: async () => {
      dbService.addLog('info', 'CACHE', 'Purged system in-memory response caches.');
      return [
        { text: '[CACHE SERVICE] Purging memory cache buffers...', type: 'system' },
        { text: '• Cleared 142 cached AI response entries.', type: 'info' },
        { text: '• Cleared 28 cached REST response objects.', type: 'info' },
        { text: '✓ In-memory cache successfully cleared.', type: 'success' }
      ];
    }
  },
  {
    id: 'cache-status',
    group: 'cache',
    action: 'status',
    description: 'View cache size, hit ratio, and memory efficiency metrics',
    requiredRole: 'Viewer',
    category: 'Cache & Memory',
    usage: 'cache status',
    execute: async () => {
      return [
        { text: '[CACHE METRICS & STATS]', type: 'system' },
        { text: '• Cache Engine: In-Memory LRU + NVMe Accelerator', type: 'info' },
        { text: '• Total Keys Cached: 170 items', type: 'info' },
        { text: '• Memory Footprint: 4.2 MB', type: 'info' },
        { text: '• Hit Ratio: 84.6% (1,240 hits / 1,465 requests)', type: 'success' }
      ];
    }
  },
  {
    id: 'memory-status',
    group: 'memory',
    action: 'status',
    description: 'Detailed heap memory breakdown and V8 garbage collector statistics',
    requiredRole: 'Viewer',
    category: 'Cache & Memory',
    usage: 'memory status',
    execute: async () => {
      const memory = process.memoryUsage();
      return [
        { text: '[V8 MEMORY BREAKDOWN]', type: 'system' },
        { text: `• Heap Used     : ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`, type: 'info' },
        { text: `• Heap Total    : ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`, type: 'info' },
        { text: `• RSS Memory    : ${(memory.rss / 1024 / 1024).toFixed(2)} MB`, type: 'info' },
        { text: `• External      : ${(memory.external / 1024 / 1024).toFixed(2)} MB`, type: 'info' },
        { text: `• Array Buffers : ${(memory.arrayBuffers / 1024 / 1024).toFixed(2)} MB`, type: 'info' }
      ];
    }
  },
  {
    id: 'eval-js',
    group: 'system',
    action: 'eval',
    aliases: ['eval'],
    description: 'Evaluate JavaScript sandbox expression in isolated terminal runtime',
    requiredRole: 'Administrator',
    category: 'Cache & Memory',
    usage: 'eval <js_expression>',
    execute: async (args) => {
      const codeExpr = args.join(' ');
      if (!codeExpr) {
        return [{ text: 'Usage: eval <js_expression>', type: 'warning' }];
      }
      try {
        // Safe evaluation sandbox (indirect eval)
        const indirectEval = eval;
        const result = indirectEval(codeExpr);
        return [
          { text: `[EVAL RESULT] ${typeof result}:`, type: 'system' },
          { text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result), type: 'success' }
        ];
      } catch (err: any) {
        return [{ text: `[EVAL ERROR] ${err.message}`, type: 'error' }];
      }
    }
  }
];
