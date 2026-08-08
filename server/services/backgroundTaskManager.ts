import { DatabaseService } from '../db';

export interface BackgroundTask {
  id: string;
  name: string;
  description: string;
  type: 'INDEXING' | 'SCANNING' | 'DEPENDENCY_AUDIT' | 'AI_CONTEXT_UPDATE' | 'WORKSPACE_SYNC';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progressPercentage: number;
  startTime: string;
  finishTime?: string;
  logs: string[];
}

export class BackgroundTaskManager {
  private static instance: BackgroundTaskManager;
  private dbService = DatabaseService.getInstance();

  private constructor() {
    this.ensureDefaultTasks();
  }

  public static getInstance(): BackgroundTaskManager {
    if (!BackgroundTaskManager.instance) {
      BackgroundTaskManager.instance = new BackgroundTaskManager();
    }
    return BackgroundTaskManager.instance;
  }

  private ensureDefaultTasks() {
    const db = this.dbService.read() as any;
    if (!db.copilotBackgroundTasks || db.copilotBackgroundTasks.length === 0) {
      const initialTasks: BackgroundTask[] = [
        {
          id: 'task-idx-01',
          name: 'Workspace Source Indexing',
          description: 'AST indexing of TypeScript files and dependency trees for rapid Copilot context retrieval',
          type: 'INDEXING',
          status: 'completed',
          progressPercentage: 100,
          startTime: new Date(Date.now() - 3600000).toISOString(),
          finishTime: new Date(Date.now() - 3550000).toISOString(),
          logs: ['Started indexing /app/src', 'Indexed 42 files', 'Completed AST symbol graph extraction']
        },
        {
          id: 'task-sync-02',
          name: 'LowDB Workspace Persistence Sync',
          description: 'Background state synchronization between active memory, conversation session, and disk',
          type: 'WORKSPACE_SYNC',
          status: 'completed',
          progressPercentage: 100,
          startTime: new Date(Date.now() - 1800000).toISOString(),
          finishTime: new Date(Date.now() - 1795000).toISOString(),
          logs: ['Verified session integrity', 'Synced 3 active conversation streams']
        },
        {
          id: 'task-scan-03',
          name: 'Security & Vulnerability Audit',
          description: 'Continuous static analysis for missing permissions, hardcoded credentials, and package CVEs',
          type: 'DEPENDENCY_AUDIT',
          status: 'running',
          progressPercentage: 78,
          startTime: new Date(Date.now() - 300000).toISOString(),
          logs: ['Auditing package.json dependencies', 'Inspected 14 internal controllers', '0 vulnerabilities detected so far']
        }
      ];
      db.copilotBackgroundTasks = initialTasks;
      this.dbService.write(db);
    }
  }

  public getTasks(): BackgroundTask[] {
    const db = this.dbService.read() as any;
    return db.copilotBackgroundTasks || [];
  }

  public launchTask(name: string, description: string, type: BackgroundTask['type']): BackgroundTask {
    const db = this.dbService.read() as any;
    if (!db.copilotBackgroundTasks) db.copilotBackgroundTasks = [];

    const newTask: BackgroundTask = {
      id: `task-${Date.now().toString(36)}`,
      name,
      description,
      type,
      status: 'running',
      progressPercentage: 10,
      startTime: new Date().toISOString(),
      logs: [`[INITIALIZED] Task ${name} launched`]
    };

    db.copilotBackgroundTasks.unshift(newTask);
    this.dbService.write(db);

    // Simulate asynchronous progress
    setTimeout(() => {
      this.updateTaskProgress(newTask.id, 50, `[PROGRESS] ${name} 50% complete`);
    }, 2000);

    setTimeout(() => {
      this.completeTask(newTask.id, `[COMPLETED] ${name} executed successfully`);
    }, 5000);

    return newTask;
  }

  public updateTaskProgress(id: string, progress: number, logMsg: string) {
    const db = this.dbService.read() as any;
    if (!db.copilotBackgroundTasks) return;
    const task = db.copilotBackgroundTasks.find((t: BackgroundTask) => t.id === id);
    if (task) {
      task.progressPercentage = Math.min(100, progress);
      task.logs.push(logMsg);
      this.dbService.write(db);
    }
  }

  public completeTask(id: string, finalLog: string) {
    const db = this.dbService.read() as any;
    if (!db.copilotBackgroundTasks) return;
    const task = db.copilotBackgroundTasks.find((t: BackgroundTask) => t.id === id);
    if (task) {
      task.status = 'completed';
      task.progressPercentage = 100;
      task.finishTime = new Date().toISOString();
      task.logs.push(finalLog);
      this.dbService.write(db);
    }
  }
}

export const backgroundTaskManager = BackgroundTaskManager.getInstance();
