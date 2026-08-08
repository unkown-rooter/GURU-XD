import { DatabaseService } from '../db';

export interface ActiveWorkspaceState {
  workspaceId: string;
  projectId: string;
  activeConversationId: string;
  activeProvider: string;
  activeAgent: string;
  draftPrompt: string;
  openPanels: {
    showLeftPanel: boolean;
    showRightPanel: boolean;
    rightTab: 'editor' | 'security' | 'history' | 'drafts';
    displayMode: 'embedded' | 'expanded' | 'floating';
  };
  contextWindow: {
    summary: string;
    pinnedItems: string[];
  };
  recentActivity: {
    timestamp: string;
    action: string;
    details: string;
  }[];
  conversationHistory: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    agent?: string;
    provider?: string;
    attachments?: any[];
  }[];
  lastSavedAt: string;
}

export class WorkspacePersistenceService {
  private static instance: WorkspacePersistenceService;
  private dbService = DatabaseService.getInstance();

  private constructor() {}

  public static getInstance(): WorkspacePersistenceService {
    if (!WorkspacePersistenceService.instance) {
      WorkspacePersistenceService.instance = new WorkspacePersistenceService();
    }
    return WorkspacePersistenceService.instance;
  }

  /**
   * Retrieves current active workspace session from database store
   */
  public getWorkspaceSession(userId: string = 'default-user'): ActiveWorkspaceState {
    const db = this.dbService.read() as any;
    
    if (db.copilotActiveWorkspace && db.copilotActiveWorkspace[userId]) {
      return db.copilotActiveWorkspace[userId];
    }

    // Default persistent workspace structure if none exists
    const defaultState: ActiveWorkspaceState = {
      workspaceId: 'ws-main-guru-xd',
      projectId: 'proj-gx-core-01',
      activeConversationId: `conv-${Date.now()}`,
      activeProvider: 'gemini',
      activeAgent: 'copilot',
      draftPrompt: '',
      openPanels: {
        showLeftPanel: true,
        showRightPanel: true,
        rightTab: 'editor',
        displayMode: 'embedded'
      },
      contextWindow: {
        summary: 'Active GX-010 Engineering Workspace Session',
        pinnedItems: ['/server/copilotEngine.ts', '/src/App.tsx']
      },
      recentActivity: [
        {
          timestamp: new Date().toISOString(),
          action: 'WORKSPACE_INITIALIZED',
          details: 'Persistent workspace foundation initialized successfully.'
        }
      ],
      conversationHistory: [
        {
          id: 'msg-welcome-01',
          role: 'assistant',
          content: 'Welcome to GX-010 AI Copilot Workspace. Session state is now persistently preserved across navigation, tab changes, and background updates.',
          timestamp: new Date().toISOString(),
          agent: 'copilot',
          provider: 'gemini'
        }
      ],
      lastSavedAt: new Date().toISOString()
    };

    return defaultState;
  }

  /**
   * Saves updated workspace session state to database store
   */
  public saveWorkspaceSession(
    sessionData: Partial<ActiveWorkspaceState>,
    userId: string = 'default-user'
  ): ActiveWorkspaceState {
    const db = this.dbService.read() as any;
    if (!db.copilotActiveWorkspace) {
      db.copilotActiveWorkspace = {};
    }

    const current = this.getWorkspaceSession(userId);
    const updated: ActiveWorkspaceState = {
      ...current,
      ...sessionData,
      openPanels: {
        ...current.openPanels,
        ...(sessionData.openPanels || {})
      },
      contextWindow: {
        ...current.contextWindow,
        ...(sessionData.contextWindow || {})
      },
      lastSavedAt: new Date().toISOString()
    };

    db.copilotActiveWorkspace[userId] = updated;
    this.dbService.write(db);

    return updated;
  }

  /**
   * Autosaves draft prompt without disturbing active conversation flow
   */
  public autosaveDraft(
    draftText: string,
    conversationId?: string,
    userId: string = 'default-user'
  ): { success: boolean; lastSavedAt: string } {
    const db = this.dbService.read() as any;
    if (!db.copilotActiveWorkspace) {
      db.copilotActiveWorkspace = {};
    }

    const current = this.getWorkspaceSession(userId);
    current.draftPrompt = draftText;
    if (conversationId) {
      current.activeConversationId = conversationId;
    }
    current.lastSavedAt = new Date().toISOString();

    db.copilotActiveWorkspace[userId] = current;
    this.dbService.write(db);

    return {
      success: true,
      lastSavedAt: current.lastSavedAt
    };
  }

  /**
   * Recovers full workspace session on load or after crash/refresh
   */
  public recoverWorkspaceSession(userId: string = 'default-user'): {
    success: boolean;
    session: ActiveWorkspaceState;
    restoredAt: string;
    message: string;
  } {
    const session = this.getWorkspaceSession(userId);
    
    // Add recovery activity log
    session.recentActivity.unshift({
      timestamp: new Date().toISOString(),
      action: 'WORKSPACE_RECOVERED',
      details: `Recovered conversation [${session.activeConversationId}] with ${session.conversationHistory.length} messages.`
    });

    // Keep top 20 recent activity logs
    if (session.recentActivity.length > 20) {
      session.recentActivity = session.recentActivity.slice(0, 20);
    }

    this.saveWorkspaceSession(session, userId);

    return {
      success: true,
      session,
      restoredAt: new Date().toISOString(),
      message: 'Workspace session and conversation state recovered seamlessly.'
    };
  }
}

export const workspacePersistenceService = WorkspacePersistenceService.getInstance();
