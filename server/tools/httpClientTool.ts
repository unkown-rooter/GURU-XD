import { toolRegistry, ToolExecutionContext } from '../services/toolRegistry';
import { loggingService } from '../services/loggingService';

export interface HttpClientParams {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
}

export interface HttpClientResult {
  url: string;
  method: string;
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  durationMs: number;
}

export async function executeHttpClientTool(
  params: HttpClientParams,
  context?: ToolExecutionContext
): Promise<HttpClientResult> {
  const { method = 'GET', url, headers = {}, body, timeoutMs = 10000 } = params;

  if (!url) {
    throw new Error('HttpClientTool requires a valid url.');
  }

  const startTime = Date.now();
  const correlationId = context?.correlationId || `corr-http-${Date.now()}`;
  const traceId = context?.traceId || `trace-http-${Date.now()}`;

  const requestHeaders: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-correlation-id': correlationId,
    'x-trace-id': traceId,
    ...headers
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: controller.signal
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timer);

    const durationMs = Date.now() - startTime;
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { responseHeaders[k] = v; });

    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    loggingService.logRequest(method, url, response.status, durationMs, {
      correlationId,
      traceId,
      tool: 'HttpClientTool'
    });

    return {
      url,
      method,
      statusCode: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data,
      durationMs
    };
  } catch (err: any) {
    clearTimeout(timer);
    const durationMs = Date.now() - startTime;
    const isAbort = err.name === 'AbortError';
    const errMessage = isAbort ? `HTTP request timed out after ${timeoutMs}ms` : err.message;

    loggingService.error('HTTP', `HTTP Client request failed [${method} ${url}]: ${errMessage}`, {
      url,
      method,
      durationMs,
      error: errMessage
    });

    throw new Error(`HttpClientTool error: ${errMessage}`);
  }
}

// Register Tool 4: HTTP Client Tool
toolRegistry.registerTool({
  toolId: 'tool-http-client',
  toolName: 'HTTP Client Tool',
  version: '1.0.0',
  description: 'Outbound REST/JSON API client tool with distributed tracing context.',
  permissions: ['NET_OUTBOUND'],
  capabilities: ['HttpRequest', 'ApiTracing', 'ExternalIntegration'],
  dependencies: [],
  owner: 'GURU-XD AI Core',
  executor: executeHttpClientTool
});
