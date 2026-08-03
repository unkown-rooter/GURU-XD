import React, { useState, useEffect, useRef } from 'react';
import logoUrl from './assets/images/guru_xd_logo_1784332841454.jpg';
import { 
  Bot, 
  Command, 
  BotFile, 
  Plugin, 
  Session, 
  PortalUser, 
  LogLine,
  Subscription
} from './types';
import { 
  INITIAL_BOTS, 
  INITIAL_COMMANDS, 
  INITIAL_FILES, 
  INITIAL_PLUGINS, 
  INITIAL_SESSIONS, 
  INITIAL_USERS, 
  INITIAL_LOGS 
} from './data';

// Import Modular Page Views
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import BotsView from './components/BotsView';
import CommandsView from './components/CommandsView';
import FilesView from './components/FilesView';
import PluginsView from './components/PluginsView';
import SessionsView from './components/SessionsView';
import LogsView from './components/LogsView';
import AnalyticsView from './components/AnalyticsView';
import UsersView from './components/UsersView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import CopilotView from './components/CopilotView';
import DatabaseView from './components/DatabaseView';
import AuthPage from './components/AuthPage';
import SecurityHubView from './components/SecurityHubView';
import BehaviorLearningEngineView from './components/BehaviorLearningEngineView';
import AISecurityAnalystView from './components/AISecurityAnalystView';
import IntelligenceCenterView from './components/IntelligenceCenterView';

import ApplicationsView, { Application } from './components/ApplicationsView';
import DeploymentsView, { Deployment } from './components/DeploymentsView';
import ApiKeysView, { ApiKeyItem } from './components/ApiKeysView';
import WorkspacesView, { WorkspaceItem } from './components/WorkspacesView';
import StorageView from './components/StorageView';
import NotificationsView from './components/NotificationsView';
import BillingView from './components/BillingView';
import HelpView from './components/HelpView';
import EnvConfigManagerView from './components/EnvConfigManagerView';
import GuruArchitectureVersionsView from './components/GuruArchitectureVersionsView';

import { Sparkles, Key, Lock, AlertCircle, AlertTriangle, Bolt, Terminal, LayoutDashboard, ScrollText, Menu, Bot as BotIcon, ShieldAlert, Clock, Pause } from 'lucide-react';

// Import Firebase Client-Side modules
import { 
  auth, 
  db, 
  googleProvider, 
  isFirebaseConfigured, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // --- Auth States ---
  const [user, setUser] = useState<PortalUser | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // --- Firebase Auth & Cloud Sync States ---
  const [isUsingFirebase, setIsUsingFirebase] = useState(false);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);
  
  // --- Registration States ---

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'Administrator' | 'Developer' | 'Viewer'>('Viewer');
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState('');

  // --- Core Application States ---
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bots, setBots] = useState<Bot[]>(INITIAL_BOTS);
  const [commands, setCommands] = useState<Command[]>(INITIAL_COMMANDS);
  const [files, setFiles] = useState<BotFile[]>(INITIAL_FILES);
  const [plugins, setPlugins] = useState<Plugin[]>(INITIAL_PLUGINS);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [users, setUsers] = useState<PortalUser[]>(INITIAL_USERS);
  const [logs, setLogs] = useState<LogLine[]>(INITIAL_LOGS);

  // --- Extended SaaS States ---
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([
    { id: 'ws-1', name: 'Personal Sandbox', type: 'Personal', memberCount: 1, instanceCount: 4, isOwner: true },
    { id: 'ws-2', name: 'GURU Enterprise Corp', type: 'Business', memberCount: 12, instanceCount: 18, isOwner: true },
    { id: 'ws-3', name: 'Developer Guild', type: 'Team', memberCount: 5, instanceCount: 6, isOwner: false }
  ]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceItem>(workspaces[0]);

  const [applications, setApplications] = useState<Application[]>([
    {
      id: 'app-1',
      name: 'guru-whatsapp-master',
      type: 'WhatsApp Bot',
      status: 'running',
      uptime: '14d 6h',
      memory: '312 MB / 1024 MB',
      cpu: 12.4,
      url: 'https://wa.me/guru-xd-bot',
      repository: 'github.com/guru-xd/whatsapp-bot-master',
      envVars: { 'SESSION_ID': 'guru_wa_88329', 'PREFIX': '.' },
      replicaCount: 1,
      region: 'us-east-1 (N. Virginia)'
    },
    {
      id: 'app-2',
      name: 'guru-telegram-sentinel',
      type: 'Telegram Bot',
      status: 'running',
      uptime: '28d 12h',
      memory: '185 MB / 512 MB',
      cpu: 4.8,
      url: 'https://t.me/guru_xd_sentinel_bot',
      repository: 'github.com/guru-xd/telegram-sentinel',
      envVars: { 'BOT_TOKEN': '778392019:AAFx...', 'DEBUG': 'false' },
      replicaCount: 1,
      region: 'eu-west-2 (London)'
    },
    {
      id: 'app-3',
      name: 'ai-copilot-agent-service',
      type: 'AI Agent',
      status: 'running',
      uptime: '5d 2h',
      memory: '512 MB / 2048 MB',
      cpu: 18.2,
      url: 'https://api.guru-xd.com/v1/copilot',
      repository: 'github.com/guru-xd/ai-agent-service',
      envVars: { 'MODEL': 'gemini-3.5-flash', 'MAX_TOKENS': '4096' },
      replicaCount: 2,
      region: 'us-east-1 (N. Virginia)'
    },
    {
      id: 'app-4',
      name: 'express-auth-microservice',
      type: 'Express API',
      status: 'running',
      uptime: '40d 18h',
      memory: '210 MB / 512 MB',
      cpu: 2.1,
      url: 'https://auth.guru-xd.com',
      repository: 'github.com/guru-xd/express-auth',
      envVars: { 'JWT_SECRET': 'guru_super_secret_key_2026' },
      replicaCount: 3,
      region: 'ap-south-1 (Mumbai)'
    }
  ]);

  const [deployments, setDeployments] = useState<Deployment[]>([
    {
      id: 'dep-101',
      appName: 'guru-whatsapp-master',
      branch: 'main',
      commitHash: 'a8f93e2',
      commitMessage: 'feat(wa): upgrade baileys socket engine to v6.5',
      status: 'Deployed',
      author: 'root-admin',
      createdAt: '12 mins ago',
      duration: '42s',
      logs: [
        'Preparing build context for Docker cluster...',
        'Pulling node:20-alpine base image...',
        'Running npm install --production...',
        'Compiling TypeScript bundle -> dist/server.cjs...',
        'SUCCESS: Image guru-whatsapp-master:a8f93e2 built and tagged.',
        'Health check passed: HTTP 200 on /api/health.'
      ]
    },
    {
      id: 'dep-102',
      appName: 'ai-copilot-agent-service',
      branch: 'feature/gemini-flash',
      commitHash: 'c74b121',
      commitMessage: 'refactor(ai): integrate Gemini 3.5 Flash streaming pipeline',
      status: 'Deployed',
      author: 'devops-lead',
      createdAt: '2 hours ago',
      duration: '1m 05s',
      logs: [
        'Fetching submodules and dependencies...',
        'Initializing Google GenAI SDK context...',
        'Container listening on 0.0.0.0:3000.',
        'SUCCESS: Active deployment complete.'
      ]
    }
  ]);

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'k-1',
      name: 'GitHub Actions Deployment Pipeline',
      keySecret: 'guru_live_77382910482930192847291',
      prefix: 'guru_live_7738...',
      createdAt: '2026-06-15',
      expiresAt: '2027-06-15',
      scope: 'Full Admin',
      lastUsed: '10 mins ago'
    },
    {
      id: 'k-2',
      name: 'Prometheus Telemetry Scraper',
      keySecret: 'guru_live_99201827364519283746192',
      prefix: 'guru_live_9920...',
      createdAt: '2026-07-01',
      expiresAt: '2026-10-01',
      scope: 'Read-Only Telemetry',
      lastUsed: '1 min ago'
    }
  ]);
  const [subscription, setSubscription] = useState<Subscription>({
    tier: "PREMIUM VIP",
    hostedLimit: "20 Instances",
    renewalDate: "2027-02-15",
    storageLimit: "100 GB SSD",
    price: "$29/mo",
    isUpgraded: false
  });

  // --- Session Timeout States ---
  const SESSION_DURATION = 300; // 5 minutes standard session duration
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(SESSION_DURATION);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isExitingLogoutConfirm, setIsExitingLogoutConfirm] = useState<boolean>(false);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  // --- Telemetry Refresh Simulators ---
  const [systemMetrics, setSystemMetrics] = useState({ cpu: 42.8, ram: '1.2 GB / 2.0 GB' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Sync telemetry data ---
  const triggerSync = () => {
    setIsRefreshing(true);
    loadBackendData();
    
    // Append syslog that a sync was initiated
    const syncTime = new Date().toLocaleTimeString();
    addManualLog({
      type: 'info',
      source: 'SYSTEM',
      message: 'Telemetry metrics synced across hypervisor clusters.'
    });

    setTimeout(() => {
      setSystemMetrics({
        cpu: 15 + Math.random() * 80,
        ram: `${(1.0 + Math.random() * 0.9).toFixed(1)} GB / 2.0 GB`
      });
      setIsRefreshing(false);
    }, 1000);
  };

  // Run initial sync or interval shifts to simulate active environments
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setSystemMetrics(prev => {
        const nextCpu = Math.max(10, Math.min(98, prev.cpu + (Math.random() * 16 - 8)));
        let prevUsed = 1.2;
        const parts = prev.ram.split('/');
        if (parts.length === 2) {
          prevUsed = parseFloat(parts[0]) || 1.2;
        }
        const nextUsed = Math.max(0.4, Math.min(1.95, prevUsed + (Math.random() * 0.4 - 0.2)));
        return {
          cpu: nextCpu,
          ram: `${nextUsed.toFixed(1)} GB / 2.0 GB`
        };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // --- Firestore Data Synchronizers ---
  const syncStateToFirestore = async (updatedFields: {
    bots?: Bot[];
    commands?: Command[];
    files?: BotFile[];
    plugins?: Plugin[];
    sessions?: Session[];
    logs?: LogLine[];
    subscription?: Subscription;
    maintenanceMode?: boolean;
  }) => {
    if (!isUsingFirebase || !auth?.currentUser || !db) return;
    try {
      const stateDocRef = doc(db, `users/${auth.currentUser.uid}/data/state`);
      await setDoc(stateDocRef, updatedFields, { merge: true });
    } catch (err) {
      console.error("Failed to sync changes to Firestore:", err);
    }
  };

  const loadUserDataFromFirestore = async (uid: string, portalUser: PortalUser) => {
    if (!db) return;
    setIsFirebaseSyncing(true);
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      
      const stateDocRef = doc(db, `users/${uid}/data/state`);
      const stateDocSnap = await getDoc(stateDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          username: portalUser.username,
          email: portalUser.email,
          role: portalUser.role,
          status: portalUser.status,
          avatar: portalUser.avatar,
          createdAt: new Date().toISOString()
        });
      }

      if (stateDocSnap.exists()) {
        const data = stateDocSnap.data();
        if (data.bots) setBots(data.bots);
        if (data.commands) setCommands(data.commands);
        if (data.files) setFiles(data.files);
        if (data.plugins) setPlugins(data.plugins);
        if (data.sessions) setSessions(data.sessions);
        if (data.logs) setLogs(data.logs);
        if (data.subscription) setSubscription(data.subscription);
        if (data.maintenanceMode !== undefined) setMaintenanceMode(data.maintenanceMode);
      } else {
        const initialState = {
          bots: INITIAL_BOTS,
          commands: INITIAL_COMMANDS,
          files: INITIAL_FILES,
          plugins: INITIAL_PLUGINS,
          sessions: INITIAL_SESSIONS,
          logs: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              type: 'success' as const,
              source: 'FIREBASE',
              message: `Firestore persistent container database initialized for Google user: "${portalUser.username}".`
            },
            ...INITIAL_LOGS
          ] as LogLine[],
          subscription: {
            tier: "PREMIUM VIP",
            hostedLimit: "20 Instances",
            renewalDate: "2027-02-15",
            storageLimit: "100 GB SSD",
            price: "$29/mo",
            isUpgraded: false
          },
          maintenanceMode: false
        };
        await setDoc(stateDocRef, initialState);
        setBots(initialState.bots);
        setCommands(initialState.commands);
        setFiles(initialState.files);
        setPlugins(initialState.plugins);
        setSessions(initialState.sessions);
        setLogs(initialState.logs);
        setSubscription(initialState.subscription);
        setMaintenanceMode(initialState.maintenanceMode);
      }
    } catch (err) {
      console.error("Firestore loading error:", err);
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  // --- Firebase Auth state observer ---
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsUsingFirebase(true);
        const portalUser: PortalUser = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'member',
          email: firebaseUser.email || '',
          role: 'Administrator',
          status: 'active',
          avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
        };
        setUser(portalUser);
        await loadUserDataFromFirestore(firebaseUser.uid, portalUser);
      } else {
        setIsUsingFirebase(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Google Sign-in action handler ---
  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setAuthError("Firebase is not fully configured in your environment. Provide config keys in .env!");
      return;
    }
    setAuthError('');
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google login failed:", err);
      if (err.code === 'auth/popup-blocked' || err.message?.includes('iframe')) {
        setAuthError("Popup blocked. If you are inside an iframe, please click the link to open the app in a new tab to authorize!");
      } else {
        setAuthError(err.message || "Google authentication failed.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Load and poll data from full-stack backend
  const loadBackendData = async () => {
    if (isUsingFirebase) return; // Skip Express backend polling in Firebase mode
    try {
      const res = await fetch('/api/data');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setBots(data.bots || []);
        setCommands(data.commands || []);
        setFiles(data.files || []);
        setPlugins(data.plugins || []);
        setSessions(data.sessions || []);
        setUsers(data.users || []);
        setLogs(data.logs || []);
        if (data.subscription) {
          setSubscription(data.subscription);
        }
        if (data.maintenanceMode !== undefined) {
          setMaintenanceMode(data.maintenanceMode);
        }
      }
    } catch (err) {
      // Quietly handle transient network/server initialization states during polling
    }
  };

  // Check existing production JWT session on mount
  useEffect(() => {
    const token = localStorage.getItem('guru_jwt_token') || sessionStorage.getItem('guru_jwt_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((res) => {
          const contentType = res.headers.get('content-type');
          if (res.ok && contentType && contentType.includes('application/json')) {
            return res.json();
          }
          return null;
        })
        .then((data) => {
          if (data && data.success && data.user) {
            setUser(data.user);
          } else if (data && !data.success) {
            localStorage.removeItem('guru_jwt_token');
            sessionStorage.removeItem('guru_jwt_token');
          }
        })
        .catch((err) => console.error("Session verification offline:", err));
    }
  }, []);

  useEffect(() => {
    loadBackendData();
    const poll = setInterval(loadBackendData, 5000);
    return () => clearInterval(poll);
  }, []);

  const handleUpgradeSubscription = async (plan: 'enterprise' | 'ultimate' | 'premium') => {
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSubscription(data.subscription);
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error("Upgrade subscription failed:", err);
    }
  };

  // --- Auth Handlers ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setRegisterSuccessMessage('');
    setIsAuthenticating(true);

    setTimeout(() => {
      // Authenticate matching legacy admin/admin123 or general registered portal users
      const match = users.find(u => u.username.toLowerCase() === usernameInput.toLowerCase() || u.email.toLowerCase() === usernameInput.toLowerCase());
      if (match) {
        if (match.status === 'suspended') {
          setAuthError('Your administrative access has been suspended.');
          setIsAuthenticating(false);
        } else {
          const expectedPassword = (match as any).password || (match.username === 'admin' ? 'admin123' : 'member123');
          if (passwordInput === expectedPassword) {
            setUser(match);
            setIsAuthenticating(false);
            loadBackendData(); // Sync immediately on login
          } else {
            setAuthError('Invalid portal key credentials.');
            setIsAuthenticating(false);
          }
        }
      } else {
        setAuthError('Invalid portal key credentials.');
        setIsAuthenticating(false);
      }
    }, 1000);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setRegisterSuccessMessage('');
    
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setAuthError('Please fill in all registration fields.');
      return;
    }

    // Check if user already exists
    const exists = users.some(u => u.username.toLowerCase() === regUsername.trim().toLowerCase() || u.email.toLowerCase() === regEmail.trim().toLowerCase());
    if (exists) {
      setAuthError('A user with this username or email already exists.');
      return;
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      username: regUsername.trim(),
      email: regEmail.trim(),
      role: regRole,
      status: 'active' as const,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      password: regPassword
    };

    setIsAuthenticating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setLogs(data.logs);
        setRegisterSuccessMessage(`Core credentials provisioned for "${regUsername.trim()}". Authenticate below.`);
        setUsernameInput(regUsername.trim());
        setPasswordInput(regPassword);
        setIsRegisterMode(false);
        // Reset inputs
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
        setRegRole('Viewer');
      } else {
        setAuthError('Failed to register member to cluster db.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Connection error during authentication setup.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    if (isUsingFirebase && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error("Firebase signOut failed:", err);
      }
    }
    setUser(null);
    setUsernameInput('admin');
    setPasswordInput('admin123');
    setRegisterSuccessMessage('');
  };

  // --- Core Mutation Actions ---
  
  // Bot triggers
  const handleStartBot = async (id: string) => {
    if (isUsingFirebase) {
      if (maintenanceMode) return;
      const target = bots.find(b => b.id === id);
      const updatedBots = bots.map(b => b.id === id ? { ...b, status: 'running' as const, uptime: '0d 0h 1m', cpu: 1.5 } : b);
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success',
        source: 'ORCHESTRATOR',
        message: `Thread activated for bot instance: "${target?.name || 'Bot Instance'}"`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setBots(updatedBots);
      setLogs(updatedLogs);
      await syncStateToFirestore({ bots: updatedBots, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch(`/api/bots/${id}/start`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopBot = async (id: string) => {
    if (isUsingFirebase) {
      if (maintenanceMode) return;
      const target = bots.find(b => b.id === id);
      const updatedBots = bots.map(b => b.id === id ? { ...b, status: 'stopped' as const, uptime: '0h 0m', cpu: 0 } : b);
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        source: 'ORCHESTRATOR',
        message: `Thread terminated for bot instance: "${target?.name || 'Bot Instance'}"`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setBots(updatedBots);
      setLogs(updatedLogs);
      await syncStateToFirestore({ bots: updatedBots, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch(`/api/bots/${id}/stop`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestartBot = async (id: string) => {
    if (isUsingFirebase) {
      if (maintenanceMode) return;
      const target = bots.find(b => b.id === id);
      const updatedBots = bots.map(b => b.id === id ? { ...b, status: 'running' as const, uptime: '0d 0h 1m', cpu: 0.5 } : b);
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        source: 'ORCHESTRATOR',
        message: `Rebooting docker thread for bot instance: "${target?.name || 'Bot Instance'}"...`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setBots(updatedBots);
      setLogs(updatedLogs);
      await syncStateToFirestore({ bots: updatedBots, logs: updatedLogs });
      
      setTimeout(async () => {
        const afterLog: LogLine = {
          id: `log-${Date.now() + 1}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'success',
          source: 'ORCHESTRATOR',
          message: `Instance "${target?.name || 'Bot Instance'}" successfully recalibrated after reboot.`
        };
        setLogs(prev => {
          const next = [afterLog, ...prev].slice(0, 150);
          syncStateToFirestore({ logs: next });
          return next;
        });
      }, 1000);
      return;
    }
    try {
      const res = await fetch(`/api/bots/${id}/restart`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeployBot = async (newBot: Omit<Bot, 'id' | 'uptime' | 'memory' | 'cpu' | 'commandsCount' | 'version'>) => {
    if (isUsingFirebase) {
      const newId = `bot-${Date.now()}`;
      const deployed: Bot = {
        ...newBot,
        id: newId,
        uptime: "0h 0m",
        memory: `0 MB / ${newBot.memoryLimit || 256} MB`,
        cpu: 0,
        commandsCount: 15,
        version: "v1.0.0",
        qrCode: `GURU_QR_PAIR_${newId.toUpperCase()}`
      } as any;
      const updatedBots = [...bots, deployed];
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success',
        source: 'SYSTEM',
        message: `Successfully containerized new microservice instance: "${deployed.name}"`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setBots(updatedBots);
      setLogs(updatedLogs);
      await syncStateToFirestore({ bots: updatedBots, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBot)
      });
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBot = async (id: string, updates: Partial<Bot>) => {
    if (isUsingFirebase) {
      const updatedBots = bots.map(b => b.id === id ? { ...b, ...updates } : b);
      setBots(updatedBots);
      await syncStateToFirestore({ bots: updatedBots });
      return;
    }
    try {
      const res = await fetch(`/api/bots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBot = async (id: string) => {
    if (isUsingFirebase) {
      const target = bots.find(b => b.id === id);
      const updatedBots = bots.filter(b => b.id !== id);
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        source: 'ORCHESTRATOR',
        message: `Permanently decommissioned and deleted bot instance container: "${target?.name || 'Bot Instance'}"`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setBots(updatedBots);
      setLogs(updatedLogs);
      await syncStateToFirestore({ bots: updatedBots, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch(`/api/bots/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };


  // Commands triggers
  const handleToggleCommand = async (id: string) => {
    if (isUsingFirebase) {
      const updatedCommands = commands.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
      const target = commands.find(c => c.id === id);
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'info' as const,
        source: 'CORE',
        message: `Command /${target?.trigger || 'command'} ${!target?.isActive ? 'ACTIVATED' : 'DEACTIVATED'} in main cluster router.`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setCommands(updatedCommands);
      setLogs(updatedLogs);
      await syncStateToFirestore({ commands: updatedCommands, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch(`/api/commands/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        setCommands(data.commands);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCommand = async (id: string, updated: Partial<Command>) => {
    if (isUsingFirebase) {
      const updatedCommands = commands.map(c => c.id === id ? { ...c, ...updated } : c);
      const target = commands.find(c => c.id === id);
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success' as const,
        source: 'CORE',
        message: `Reconfigured trigger/response template rules for execution endpoint: "/${target?.trigger || 'command'}"`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setCommands(updatedCommands);
      setLogs(updatedLogs);
      await syncStateToFirestore({ commands: updatedCommands, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch(`/api/commands/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setCommands(data.commands);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCommand = async (newCmd: Omit<Command, 'id'>) => {
    if (isUsingFirebase) {
      const created: Command = {
        ...newCmd,
        id: `cmd-${Date.now()}`
      };
      const updatedCommands = [...commands, created];
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success' as const,
        source: 'CORE',
        message: `Registered custom expression trigger routing: "/${created.trigger}"`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setCommands(updatedCommands);
      setLogs(updatedLogs);
      await syncStateToFirestore({ commands: updatedCommands, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCmd)
      });
      if (res.ok) {
        const data = await res.json();
        setCommands(data.commands);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Files triggers
  const handleCreateFile = async (newFile: BotFile) => {
    if (isUsingFirebase) {
      const updatedFiles = [...files, newFile];
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success',
        source: 'STORAGE',
        message: `Allocated sector and synchronized script artifact: "${newFile.path}" (${newFile.size})`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setFiles(updatedFiles);
      setLogs(updatedLogs);
      await syncStateToFirestore({ files: updatedFiles, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFile)
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateFile = async (filePath: string, content: string) => {
    if (isUsingFirebase) {
      const updatedFiles = files.map(f => f.path === filePath ? { ...f, content, size: `${(content.length / 1024).toFixed(2)} KB` } : f);
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        source: 'STORAGE',
        message: `Modified code blocks inside script descriptor: "${filePath}"`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setFiles(updatedFiles);
      setLogs(updatedLogs);
      await syncStateToFirestore({ files: updatedFiles, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    if (isUsingFirebase) {
      const updatedFiles = files.filter(f => f.path !== filePath);
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        source: 'STORAGE',
        message: `Unlinked code blocks. Deleted script: "${filePath}"`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setFiles(updatedFiles);
      setLogs(updatedLogs);
      await syncStateToFirestore({ files: updatedFiles, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Plugins triggers
  const handleInstallPlugin = async (id: string) => {
    if (isUsingFirebase) {
      const updatedPlugins = plugins.map(p => p.id === id ? { ...p, installed: true, downloads: p.downloads + 1 } : p);
      const target = plugins.find(p => p.id === id);
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success',
        source: 'HYPERVISOR',
        message: `Hot-patched and mounted kernel plugin extension module: "${target?.name || 'plugin'}"`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setPlugins(updatedPlugins);
      setLogs(updatedLogs);
      await syncStateToFirestore({ plugins: updatedPlugins, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch(`/api/plugins/${id}/install`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ install: true })
      });
      if (res.ok) {
        const data = await res.json();
        setPlugins(data.plugins);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUninstallPlugin = async (id: string) => {
    if (isUsingFirebase) {
      const updatedPlugins = plugins.map(p => p.id === id ? { ...p, installed: false } : p);
      const target = plugins.find(p => p.id === id);
      const newLog: LogLine = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        source: 'HYPERVISOR',
        message: `Unmounted kernel plugin extension module: "${target?.name || 'plugin'}"`
      };
      const updatedLogs = [newLog, ...logs].slice(0, 150);
      setPlugins(updatedPlugins);
      setLogs(updatedLogs);
      await syncStateToFirestore({ plugins: updatedPlugins, logs: updatedLogs });
      return;
    }
    try {
      const res = await fetch(`/api/plugins/${id}/install`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ install: false })
      });
      if (res.ok) {
        const data = await res.json();
        setPlugins(data.plugins);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePlugin = async (newPlg: Omit<Plugin, 'id' | 'rating' | 'downloads' | 'installed' | 'customSettings'>) => {
    try {
      const res = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlg)
      });
      if (res.ok) {
        const data = await res.json();
        setPlugins(data.plugins);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlugin = async (id: string) => {
    try {
      const res = await fetch(`/api/plugins/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setPlugins(data.plugins);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePlugin = async (id: string, updates: Partial<Plugin>) => {
    try {
      const res = await fetch(`/api/plugins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setPlugins(data.plugins);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Session triggers
  const handleDisconnectSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/disconnect`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Users triggers
  const handleAddUser = async (newUser: PortalUser) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Logs triggers
  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Batch actions
  const handleStartAllBots = async () => {
    try {
      const res = await fetch('/api/bots/start-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopAllBots = async () => {
    try {
      const res = await fetch('/api/bots/stop-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addManualLog = async (newLog: Omit<LogLine, 'id' | 'timestamp'>) => {
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset the session timer whenever user logs in or out
  useEffect(() => {
    if (user) {
      setSessionTimeLeft(SESSION_DURATION);
      setShowTimeoutWarning(false);
    }
  }, [user]);

  // Handle countdown
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleLogout();
          
          // Log user logout
          addManualLog({
            type: 'error',
            source: 'SECURITY',
            message: 'Administrative session lease expired. Access key revoked.'
          });
          
          return 0;
        }

        const nextTime = prev - 1;
        if (nextTime <= 60) {
          setShowTimeoutWarning(true);
        } else {
          setShowTimeoutWarning(false);
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleExtendSession = () => {
    setSessionTimeLeft(SESSION_DURATION);
    setShowTimeoutWarning(false);
    addManualLog({
      type: 'success',
      source: 'SECURITY',
      message: 'Administrative session lease renewed by user request.'
    });
  };

  const handlePauseLogoutCountdown = () => {
    setSessionTimeLeft(prev => prev + 60);
    addManualLog({
      type: 'info',
      source: 'SECURITY',
      message: 'Logout countdown paused and extended by +60s for administrative review.'
    });
  };

  // --- Subtle Browser Audio Alert for Final 10-Second Warning State ---
  const playWarningBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Soft dual-frequency alert chime (A5 880Hz -> C6 1046.5Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.01, now);
      gain1.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.16);
      gain2.gain.setValueAtTime(0.01, now + 0.16);
      gain2.gain.linearRampToValueAtTime(0.08, now + 0.19);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.35);
    } catch {
      // Browsers may block audio autoplay without prior gesture; fails gracefully
    }
  };

  const prevSessionTimeLeftRef = useRef<number>(sessionTimeLeft);
  useEffect(() => {
    if (prevSessionTimeLeftRef.current > 10 && sessionTimeLeft <= 10 && sessionTimeLeft > 0) {
      playWarningBeep();
      addManualLog({
        type: 'warning',
        source: 'SECURITY',
        message: 'Audible warning tone dispatched for final 10-second session termination window.'
      });
    }
    prevSessionTimeLeftRef.current = sessionTimeLeft;
  }, [sessionTimeLeft]);

  // --- Render Page Selector ---
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView 
            bots={bots} 
            logs={logs}
            systemMetrics={systemMetrics}
            onBotClick={(bot) => {
              setSelectedBotForDetails(bot);
              setCurrentTab('bots');
            }}
            onDeployClick={() => setCurrentTab('bots')}
            onRefresh={triggerSync}
          />
        );
      case 'copilot':
        return (
          <CopilotView 
            logs={logs}
            commands={commands}
            onCreateCommand={handleCreateCommand}
            onAddLog={addManualLog}
          />
        );
      case 'bots':
        return (
          <BotsView 
            bots={bots}
            plugins={plugins}
            onStartBot={handleStartBot}
            onStopBot={handleStopBot}
            onRestartBot={handleRestartBot}
            onDeployBot={handleDeployBot}
            onUpdatePrefix={(id, prefix) => handleUpdateBot(id, { prefix })}
            onUpdateBot={handleUpdateBot}
            onDeleteBot={handleDeleteBot}
            maintenanceMode={maintenanceMode}
          />
        );
      case 'commands':
        return (
          <CommandsView 
            commands={commands}
            onToggleCommand={handleToggleCommand}
            onUpdateCommand={handleUpdateCommand}
            onCreateCommand={handleCreateCommand}
          />
        );
      case 'files':
        return (
          <FilesView 
            files={files}
            onCreateFile={handleCreateFile}
            onUpdateFile={handleUpdateFile}
            onDeleteFile={handleDeleteFile}
          />
        );
      case 'plugins':
        return (
          <PluginsView 
            plugins={plugins}
            onInstallPlugin={handleInstallPlugin}
            onUninstallPlugin={handleUninstallPlugin}
            onCreatePlugin={handleCreatePlugin}
            onDeletePlugin={handleDeletePlugin}
            onUpdatePlugin={handleUpdatePlugin}
          />
        );
      case 'sessions':
      case 'security':
        return <SecurityHubView />;
      case 'logs':
        return (
          <LogsView 
            logs={logs}
            commands={commands}
            onClearLogs={handleClearLogs}
            onAddLog={addManualLog}
          />
        );
      case 'analytics':
        return <AnalyticsView bots={bots} />;
      case 'intelligence-center':
        return <IntelligenceCenterView />;
      case 'behavior':
        return <BehaviorLearningEngineView />;
      case 'security-analyst':
        return <AISecurityAnalystView />;
      case 'database':
        return <DatabaseView onRefreshLogs={triggerSync} />;
      case 'users':
        return (
          <UsersView 
            users={users}
            onAddUser={handleAddUser}
            onToggleUserStatus={handleToggleUserStatus}
            onDeleteUser={handleDeleteUser}
          />
        );
      case 'profile':
        return (
          <ProfileView 
            subscription={subscription}
            onUpgradeSubscription={handleUpgradeSubscription}
          />
        );
      case 'applications':
        return (
          <ApplicationsView 
            applications={applications}
            onCreateApp={(newApp) => {
              const createdApp: Application = {
                ...newApp,
                id: `app-${Date.now()}`,
                status: 'running',
                uptime: '1m',
                memory: '128 MB / 512 MB',
                cpu: 1.5,
                url: `https://${newApp.name}.guru-xd.com`
              };
              setApplications(prev => [createdApp, ...prev]);
            }}
            onToggleStatus={(id) => {
              setApplications(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'running' ? 'stopped' : 'running' } : a));
            }}
            onRestartApp={(id) => {
              addManualLog({
                type: 'info',
                source: 'CONTAINER',
                message: `Application container [${id}] restart triggered.`
              });
            }}
            onDeleteApp={(id) => {
              setApplications(prev => prev.filter(a => a.id !== id));
            }}
          />
        );
      case 'deployments':
        return (
          <DeploymentsView 
            deployments={deployments}
            onTriggerDeploy={(appName, branch) => {
              const newDep: Deployment = {
                id: `dep-${Date.now().toString().slice(-4)}`,
                appName,
                branch,
                commitHash: 'e49a120',
                commitMessage: 'manual trigger from GURU-XD console',
                status: 'Building',
                author: user?.username || 'admin',
                createdAt: 'Just now',
                duration: 'Building...',
                logs: [
                  'Starting docker build pipeline...',
                  'Compiling typescript source files...',
                  'Container image built successfully.'
                ]
              };
              setDeployments(prev => [newDep, ...prev]);
              setTimeout(() => {
                setDeployments(prev => prev.map(d => d.id === newDep.id ? { ...d, status: 'Deployed', duration: '28s' } : d));
              }, 3000);
            }}
            onRollback={(depId) => {
              addManualLog({
                type: 'info',
                source: 'DEPLOYMENT',
                message: `Rollback initiated for deployment [${depId}].`
              });
            }}
          />
        );
      case 'terminal':
        return (
          <LogsView 
            logs={logs}
            commands={commands}
            onClearLogs={handleClearLogs}
            onAddLog={addManualLog}
          />
        );
      case 'apikeys':
        return (
          <ApiKeysView 
            apiKeys={apiKeys}
            onCreateKey={(keyObj) => {
              const newKey: ApiKeyItem = {
                ...keyObj,
                id: `k-${Date.now()}`,
                createdAt: new Date().toISOString().split('T')[0],
                lastUsed: 'Never'
              };
              setApiKeys(prev => [newKey, ...prev]);
            }}
            onRevokeKey={(id) => setApiKeys(prev => prev.filter(k => k.id !== id))}
          />
        );
      case 'teams':
        return (
          <WorkspacesView 
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            onSwitchWorkspace={setCurrentWorkspace}
            onCreateWorkspace={(name, type) => {
              const newWs: WorkspaceItem = {
                id: `ws-${Date.now()}`,
                name,
                type,
                memberCount: 1,
                instanceCount: 0,
                isOwner: true
              };
              setWorkspaces(prev => [...prev, newWs]);
              setCurrentWorkspace(newWs);
            }}
          />
        );
      case 'storage':
        return <StorageView />;
      case 'notifications':
        return <NotificationsView />;
      case 'billing':
        return (
          <BillingView 
            subscription={subscription}
            onUpgradeTier={(tierName, price) => {
              setSubscription(prev => ({
                ...prev,
                tier: tierName,
                price
              }));
              addManualLog({
                type: 'success',
                source: 'BILLING',
                message: `Plan upgraded to ${tierName} (${price}).`
              });
            }}
          />
        );
      case 'help':
      case 'sdk':
        return <HelpView />;
      case 'env-config':
        return <EnvConfigManagerView />;
      case 'architecture-versions':
        return <GuruArchitectureVersionsView />;
      default:
        return <DashboardView bots={bots} logs={logs} systemMetrics={systemMetrics} onBotClick={() => {}} onDeployClick={() => {}} onRefresh={triggerSync} />;
    }
  };

  // Helper placeholder for quick transition
  const [selectedBotForDetails, setSelectedBotForDetails] = useState<Bot | null>(null);

  // --- Auth Login Layout ---
  if (!user) {
    return (
      <AuthPage 
        onLoginSuccess={(userData, token) => {
          setUser(userData);
          loadBackendData();
        }}
        isFirebaseConfigured={isFirebaseConfigured}
        onGoogleSignIn={handleGoogleSignIn}
      />
    );
  }

  // --- Signed-In Cluster Panel Layout ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex relative font-sans selection:bg-blue-600 selection:text-white pb-16 lg:pb-0">
      {/* Sidebar navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onLogout={handleLogout}
        user={user}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        sessionTimeLeft={sessionTimeLeft}
        botsCount={bots.length}
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onSwitchWorkspace={(ws) => setCurrentWorkspace(ws)}
        onSimulateTimeout={() => {
          setSessionTimeLeft(65);
          addManualLog({
            type: 'info',
            source: 'SECURITY',
            message: 'Session expiration simulation requested. Lease set to 65s.'
          });
        }}
      />

      {/* Main console content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <Navbar 
          onRefresh={triggerSync} 
          isRefreshing={isRefreshing}
          systemMetrics={systemMetrics}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onStartAllBots={handleStartAllBots}
          onStopAllBots={handleStopAllBots}
          onClearLogs={handleClearLogs}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          maintenanceMode={maintenanceMode}
          user={user}
          onLogout={handleLogout}
          currentWorkspace={currentWorkspace}
        />

        {/* Global Maintenance Mode Banner */}
        {maintenanceMode && (
          <div id="maintenance-banner" className="bg-rose-500/10 border-b border-rose-500/20 px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs text-rose-400 font-mono animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
              <span>
                <strong className="text-rose-300 font-sans font-bold">SYSTEM LOCK ACTIVE:</strong> Global Maintenance Mode is enabled. Bot starts, stops, and hot-reboots are temporarily frozen.
              </span>
            </div>
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-[9px] uppercase tracking-wider text-rose-300 font-sans font-semibold animate-pulse">
              Locked
            </span>
          </div>
        )}

        {/* Content canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderTabContent()}
        </main>
      </div>

      {/* Mobile Floating Bottom Dock Navigation */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-slate-900/90 backdrop-blur-lg border border-slate-850 rounded-2xl flex items-center justify-around px-2 z-40 shadow-2xl shadow-slate-950/80">
        <button
          onClick={() => {
            setCurrentTab('dashboard');
            setIsMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-colors cursor-pointer ${
            currentTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 active:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1">Console</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('copilot');
            setIsMobileMenuOpen(false);
          }}
          className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-colors cursor-pointer ${
            currentTab === 'copilot' ? 'text-blue-400 font-bold' : 'text-slate-400 active:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-[9px] font-medium mt-1">AI Chat</span>
          <span className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
        </button>

        <button
          onClick={() => {
            setCurrentTab('bots');
            setIsMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-colors cursor-pointer ${
            currentTab === 'bots' ? 'text-blue-400 font-bold' : 'text-slate-400 active:text-slate-200'
          }`}
        >
          <BotIcon className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1">Instances</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('logs');
            setIsMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-colors cursor-pointer ${
            currentTab === 'logs' ? 'text-blue-400 font-bold' : 'text-slate-400 active:text-slate-200'
          }`}
        >
          <ScrollText className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1">Logs</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full rounded-xl text-slate-400 active:text-slate-200 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-1">More</span>
        </button>
      </div>

      {/* Session Timeout Warning Modal */}
      {showTimeoutWarning && (
        <div id="session-timeout-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-6 shadow-2xl shadow-amber-500/10 animate-in zoom-in-95 duration-200 text-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center shrink-0 animate-pulse">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-lg text-slate-100">Session Expiring Soon</h3>
                <p className="text-xs text-slate-400">Your administrative key access is expiring due to inactivity.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">Auto-logout in</span>
              <div className="text-4xl font-mono font-bold text-amber-400 animate-pulse">
                {sessionTimeLeft}s
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-amber-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(sessionTimeLeft / 60) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="btn-logout-now"
                onClick={() => setShowLogoutConfirm(true)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all text-center font-mono ${
                  sessionTimeLeft <= 10
                    ? 'bg-rose-950/40 border border-rose-500/80 text-rose-300 hover:bg-rose-900/50 hover:text-rose-100 animate-pulse shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Logout Now
              </button>
              <button
                id="btn-extend-session"
                onClick={handleExtendSession}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-lg shadow-blue-600/20 text-center flex items-center justify-center gap-2 font-mono"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extend Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div 
          id="logout-confirmation-modal" 
          className={`fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[10000] transition-all duration-300 ease-in-out ${
            isExitingLogoutConfirm ? 'opacity-0 pointer-events-none' : 'animate-in fade-in duration-200'
          }`}
        >
          <div 
            className={`w-full max-w-sm bg-slate-950 border border-rose-500/30 rounded-2xl p-6 space-y-5 shadow-2xl shadow-rose-500/10 text-slate-200 transition-all duration-300 transform ease-in-out ${
              isExitingLogoutConfirm 
                ? 'scale-90 opacity-0 -translate-y-2' 
                : 'animate-in zoom-in-95 duration-150'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-sans font-bold text-base text-slate-100">Are you sure?</h4>
                <p className="text-xs text-slate-400">Confirm session termination</p>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center justify-between bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Session Time Remaining:</span>
              </span>
              <span className={`font-bold ${sessionTimeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                {sessionTimeLeft}s
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-850">
              Are you sure you want to log out now? Any unsaved administrative progress or active socket connections will be disconnected to ensure session security.
            </p>

            <button
              id="btn-pause-logout-countdown"
              onClick={handlePauseLogoutCountdown}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2 font-mono shadow-sm"
            >
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Pause Logout Countdown (+60s)</span>
            </button>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                id="btn-confirm-logout"
                onClick={() => {
                  setIsExitingLogoutConfirm(true);
                  setTimeout(() => {
                    setShowLogoutConfirm(false);
                    setIsExitingLogoutConfirm(false);
                    setShowTimeoutWarning(false);
                    handleLogout();
                  }, 250);
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold cursor-pointer transition-colors shadow-lg shadow-rose-600/20 text-center flex items-center justify-center gap-2 relative"
              >
                {/* Circular progress indicator mapping final 10s */}
                <div className="relative flex items-center justify-center shrink-0 w-5 h-5">
                  <svg className="w-5 h-5 -rotate-90 transform" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      className="stroke-rose-900/60"
                      strokeWidth="2"
                      fill="transparent"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      className={`transition-all duration-300 ease-linear ${
                        sessionTimeLeft <= 10 ? 'stroke-white' : 'stroke-rose-200/50'
                      }`}
                      strokeWidth="2.5"
                      strokeDasharray={2 * Math.PI * 9}
                      strokeDashoffset={
                        (2 * Math.PI * 9) * (1 - Math.min(10, Math.max(0, sessionTimeLeft)) / 10)
                      }
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  {sessionTimeLeft <= 10 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold leading-none text-white">
                      {sessionTimeLeft}
                    </span>
                  )}
                </div>
                <span>Confirm Logout</span>
              </button>
              <button
                id="btn-cancel-logout"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setIsExitingLogoutConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer transition-colors border border-slate-800 text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
