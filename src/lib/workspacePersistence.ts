import { ActiveWorkspaceState } from '../../server/services/workspacePersistenceService';

export const LOCAL_STORAGE_KEY = 'gx_copilot_workspace_session_v1';
export const INDEXEDDB_NAME = 'GURU_XD_Workspace_DB';
export const INDEXEDDB_STORE = 'workspace_sessions';
export const INDEXEDDB_VERSION = 1;

export class ClientWorkspacePersistenceEngine {
  private static instance: ClientWorkspacePersistenceEngine;
  private currentState: ActiveWorkspaceState | null = null;
  private syncTimer: any = null;
  private listeners: Array<(state: ActiveWorkspaceState) => void> = [];
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  protected constructor() {
    this.initIndexedDB();
    this.loadFromLocalStorage();
  }

  public static getInstance(): ClientWorkspacePersistenceEngine {
    if (!ClientWorkspacePersistenceEngine.instance) {
      ClientWorkspacePersistenceEngine.instance = new ClientWorkspacePersistenceEngine();
    }
    return ClientWorkspacePersistenceEngine.instance;
  }

  private initIndexedDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      this.dbPromise = Promise.resolve(null);
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(INDEXEDDB_STORE)) {
            db.createObjectStore(INDEXEDDB_STORE, { keyPath: 'workspaceId' });
          }
        };
        request.onsuccess = (event: any) => resolve(event.target.result);
        request.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  private async saveToIndexedDB(state: ActiveWorkspaceState) {
    try {
      const db = await this.initIndexedDB();
      if (!db) return;
      const tx = db.transaction(INDEXEDDB_STORE, 'readwrite');
      const store = tx.objectStore(INDEXEDDB_STORE);
      store.put(state);
    } catch (e) {
      // Fallback silently if IndexedDB is disabled or restricted
    }
  }

  private async loadFromIndexedDB(): Promise<ActiveWorkspaceState | null> {
    try {
      const db = await this.initIndexedDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(INDEXEDDB_STORE, 'readonly');
        const store = tx.objectStore(INDEXEDDB_STORE);
        const req = store.get(this.currentState?.workspaceId || 'ws-main-guru-xd');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  public subscribe(listener: (state: ActiveWorkspaceState) => void): () => void {
    this.listeners.push(listener);
    if (this.currentState) {
      listener(this.currentState);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    if (this.currentState) {
      this.listeners.forEach(listener => listener(this.currentState!));
    }
  }

  /**
   * Load session from localStorage synchronously on boot for instant zero-flicker render
   */
  public loadFromLocalStorage(): ActiveWorkspaceState {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        this.currentState = JSON.parse(saved);
        return this.currentState!;
      }
    } catch (e) {
      console.warn('Failed to parse workspace session from localStorage:', e);
    }

    // Default state if nothing saved
    this.currentState = {
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
          action: 'CLIENT_WORKSPACE_INITIALIZED',
          details: 'Persistent workspace state loaded on client.'
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

    this.saveToLocalStorage();
    return this.currentState;
  }

  /**
   * Save session state to localStorage immediately and trigger IndexedDB + server sync
   */
  public updateState(partialState: Partial<ActiveWorkspaceState>): ActiveWorkspaceState {
    if (!this.currentState) {
      this.loadFromLocalStorage();
    }

    this.currentState = {
      ...this.currentState!,
      ...partialState,
      openPanels: {
        ...this.currentState!.openPanels,
        ...(partialState.openPanels || {})
      },
      lastSavedAt: new Date().toISOString()
    };

    this.saveToLocalStorage();
    this.saveToIndexedDB(this.currentState);
    this.notifyListeners();
    this.scheduleServerSync();

    return this.currentState;
  }

  private saveToLocalStorage() {
    try {
      if (this.currentState) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.currentState));
      }
    } catch (e) {
      console.warn('Failed to write workspace session to localStorage:', e);
    }
  }

  /**
   * Debounced silent server sync
   */
  private scheduleServerSync() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(async () => {
      try {
        if (!this.currentState) return;
        await fetch('/api/v1/copilot/workspace/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionData: this.currentState })
        });
      } catch (e) {
        // Silently handle background network issues
      }
    }, 1500);
  }

  /**
   * Fetch latest state from server / IndexedDB and hydrate
   */
  public async fetchAndHydrateFromServer(): Promise<ActiveWorkspaceState> {
    try {
      const idbState = await this.loadFromIndexedDB();
      if (idbState && idbState.lastSavedAt && this.currentState) {
        if (new Date(idbState.lastSavedAt).getTime() > new Date(this.currentState.lastSavedAt || 0).getTime()) {
          this.currentState = idbState;
          this.saveToLocalStorage();
          this.notifyListeners();
        }
      }

      const res = await fetch('/api/v1/copilot/workspace/session');
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          this.currentState = data.session;
          this.saveToLocalStorage();
          this.saveToIndexedDB(this.currentState);
          this.notifyListeners();
          return this.currentState!;
        }
      }
    } catch (e) {
      console.warn('Network offline or server unreachable, relying on local session:', e);
    }
    return this.loadFromLocalStorage();
  }

  /**
   * Autosave draft prompt
   */
  public autosaveDraft(draftText: string) {
    this.updateState({ draftPrompt: draftText });
    fetch('/api/v1/copilot/workspace/autosave-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftText, conversationId: this.currentState?.activeConversationId })
    }).catch(() => {});
  }

  public getCurrentState(): ActiveWorkspaceState {
    if (!this.currentState) {
      return this.loadFromLocalStorage();
    }
    return this.currentState;
  }
}

export class WorkspacePersistenceEngine extends ClientWorkspacePersistenceEngine {
  private static instanceEngine: WorkspacePersistenceEngine;

  public static getInstance(): WorkspacePersistenceEngine {
    if (!WorkspacePersistenceEngine.instanceEngine) {
      WorkspacePersistenceEngine.instanceEngine = new WorkspacePersistenceEngine();
    }
    return WorkspacePersistenceEngine.instanceEngine;
  }
}

export const workspacePersistenceEngine = WorkspacePersistenceEngine.getInstance();
export const clientWorkspacePersistenceEngine = workspacePersistenceEngine;

