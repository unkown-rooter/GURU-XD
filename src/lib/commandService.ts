export interface TerminalCommandItem {
  id: string;
  group: string;
  action: string;
  description: string;
  requiredRole: 'Viewer' | 'Operator' | 'Administrator';
  category: string;
  usage?: string;
  aliases?: string[];
}

export interface BatchCommandUpdate {
  id?: string;
  group?: string;
  action?: string;
  description?: string;
  requiredRole?: 'Viewer' | 'Operator' | 'Administrator';
  aliases?: string[];
  category?: string;
  usage?: string;
}

export interface BatchUpdateResponse {
  success: boolean;
  data?: {
    updatedCount: number;
    commands: TerminalCommandItem[];
  };
  message?: string;
  error?: string;
}

/**
 * Fetch all registered system terminal commands
 */
export async function fetchAllTerminalCommands(): Promise<TerminalCommandItem[]> {
  try {
    const res = await fetch('/api/v1/terminal/commands');
    if (!res.ok) {
      throw new Error(`Failed to fetch commands: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data?.commands || json.commands || [];
  } catch (err) {
    console.error('[commandService] fetchAllTerminalCommands error:', err);
    return [];
  }
}

/**
 * Perform a single batch update to multiple commands simultaneously
 */
export async function batchUpdateTerminalCommands(
  updates: BatchCommandUpdate[]
): Promise<BatchUpdateResponse> {
  try {
    const res = await fetch('/api/v1/terminal/commands/batch-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.message || json.error || 'Failed to perform batch update'
      };
    }

    return {
      success: true,
      data: json.data,
      message: json.message
    };
  } catch (err: any) {
    console.error('[commandService] batchUpdateTerminalCommands error:', err);
    return {
      success: false,
      error: err.message || 'Network error performing batch command update'
    };
  }
}

/**
 * Execute a terminal command via SystemCommandEngine
 */
export async function executeTerminalCommand(
  command: string,
  sessionId = 'sess-main',
  userId = 'usr-admin'
) {
  try {
    const res = await fetch('/api/v1/terminal/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command, sessionId, userId })
    });

    return await res.json();
  } catch (err: any) {
    console.error('[commandService] executeTerminalCommand error:', err);
    return {
      success: false,
      error: err.message || 'Failed to execute command'
    };
  }
}
