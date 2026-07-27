import React, { useState, useEffect, useRef } from 'react';
import logoUrl from '../assets/images/guru_xd_logo_1784332841454.jpg';
import { 
  Key, 
  Lock, 
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Mail, 
  User, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  ServerCrash,
  Clock,
  X,
  Smartphone,
  Shield,
  RefreshCw,
  Copy,
  Check,
  CheckCheck,
  Laptop
} from 'lucide-react';
import { PortalUser } from '../types';
import FooterModals from './FooterModals';

interface AuthPageProps {
  onLoginSuccess: (user: PortalUser, token?: string) => void;
  isFirebaseConfigured: boolean;
  onGoogleSignIn: () => Promise<void>;
}

export default function AuthPage({ onLoginSuccess, isFirebaseConfigured, onGoogleSignIn }: AuthPageProps) {
  // Mode toggles
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Form Inputs
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Register Inputs
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'Administrator' | 'Developer' | 'Viewer'>('Developer');

  // Forgot Password Inputs
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  // --- Phase 2: 2FA Verification State ---
  const [pending2FA, setPending2FA] = useState<{
    tempToken: string;
    preferredMethod: 'email' | 'sms' | 'authenticator' | 'authy' | 'microsoft';
    email: string;
    demoCode?: string;
  } | null>(null);

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [selected2FAMethod, setSelected2FAMethod] = useState<'email' | 'sms' | 'authenticator' | 'authy' | 'microsoft'>('email');
  const [trustDevice, setTrustDevice] = useState(true);
  const [useRecoveryCodeMode, setUseRecoveryCodeMode] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes (300s)
  const [isResendingOTP, setIsResendingOTP] = useState(false);
  const [resendSuccessMsg, setResendSuccessMsg] = useState('');

  // UX Authentication Progression States
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStepMessage, setAuthStepMessage] = useState<'Authenticating...' | 'Verifying Account...' | 'Loading Workspace...' | ''>('');
  const [authProgress, setAuthProgress] = useState(0);

  // Error States
  const [authError, setAuthError] = useState('');
  const [authErrorType, setAuthErrorType] = useState<
    'INVALID_CREDENTIALS' | 'ACCOUNT_DISABLED' | 'TOO_MANY_ATTEMPTS' | 'SESSION_EXPIRED' | 'SERVER_UNAVAILABLE' | 'INVALID_OTP' | ''
  >('');

  // Footer Modal State
  const [activeFooterModal, setActiveFooterModal] = useState<'privacy' | 'terms' | 'status' | null>(null);

  // Refs for 6-digit OTP input auto-focus
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // 5-minute countdown timer effect
  useEffect(() => {
    if (!pending2FA || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [pending2FA, timerSeconds]);

  // Sync selected method with backend recommendation
  useEffect(() => {
    if (pending2FA?.preferredMethod) {
      setSelected2FAMethod(pending2FA.preferredMethod);
    }
  }, [pending2FA]);

  // Format timer as MM:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Live Password Strength Calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-800 border-slate-700', textColor: 'text-slate-500' };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 15;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;

    if (score <= 30) return { score, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-400' };
    if (score <= 60) return { score, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-400' };
    if (score <= 80) return { score, label: 'Strong', color: 'bg-cyan-500', textColor: 'text-cyan-400' };
    return { score: 100, label: 'Enterprise Grade', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
  };

  const activePassword = isRegisterMode ? regPassword : password;
  const strengthInfo = getPasswordStrength(activePassword);

  // --- Handlers ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      setAuthErrorType('INVALID_CREDENTIALS');
      setAuthError('Please enter your email or username and password.');
      return;
    }

    setAuthError('');
    setAuthErrorType('');
    setIsAuthenticating(true);

    setAuthStepMessage('Authenticating...');
    setAuthProgress(33);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: emailOrUsername.trim(), password, rememberMe })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsAuthenticating(false);
        setAuthStepMessage('');
        setAuthProgress(0);

        if (res.status === 429 || data.errorType === 'TOO_MANY_ATTEMPTS') {
          setAuthErrorType('TOO_MANY_ATTEMPTS');
          setAuthError(data.error || 'Too many login attempts. Account locked for 15 minutes.');
        } else if (res.status === 403 || data.errorType === 'ACCOUNT_DISABLED') {
          setAuthErrorType('ACCOUNT_DISABLED');
          setAuthError(data.error || 'Account disabled. Access suspended by system administrator.');
        } else if (res.status >= 500) {
          setAuthErrorType('SERVER_UNAVAILABLE');
          setAuthError('Server unavailable. Unable to connect to the GURU-XD cluster.');
        } else {
          setAuthErrorType('INVALID_CREDENTIALS');
          setAuthError(data.error || 'Invalid email or password.');
        }
        return;
      }

      // Check if 2FA verification is required
      if (data.require2FA) {
        setIsAuthenticating(false);
        setAuthStepMessage('');
        setAuthProgress(0);
        setTimerSeconds(300);
        setPending2FA({
          tempToken: data.tempToken,
          preferredMethod: data.preferredMethod || 'email',
          email: data.email || emailOrUsername,
          demoCode: data.demoCode
        });
        return;
      }

      // Step 2 & 3 Completion
      setAuthStepMessage('Verifying Account...');
      setAuthProgress(66);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setAuthStepMessage('Loading Workspace...');
      setAuthProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (data.token) {
        if (rememberMe) {
          localStorage.setItem('guru_jwt_token', data.token);
        } else {
          sessionStorage.setItem('guru_jwt_token', data.token);
        }
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setIsAuthenticating(false);
      setAuthStepMessage('');
      setAuthProgress(0);
      setAuthErrorType('SERVER_UNAVAILABLE');
      setAuthError('Server unavailable. Unable to connect to the GURU-XD hypervisor cluster.');
    }
  };

  // --- Phase 2: Handle OTP Submit ---
  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pending2FA) return;

    const fullCode = useRecoveryCodeMode ? recoveryCodeInput.trim() : otpDigits.join('');

    if (!fullCode || (useRecoveryCodeMode ? fullCode.length < 8 : fullCode.length < 6)) {
      setAuthErrorType('INVALID_OTP');
      setAuthError(useRecoveryCodeMode ? 'Please enter a valid 8-character recovery code.' : 'Please enter the complete 6-digit verification code.');
      return;
    }

    setAuthError('');
    setAuthErrorType('');
    setIsAuthenticating(true);

    setAuthStepMessage('Authenticating...');
    setAuthProgress(33);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: pending2FA.tempToken,
          code: fullCode,
          trustDevice,
          method: selected2FAMethod,
          deviceName: 'Chrome Browser / OS Desktop'
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsAuthenticating(false);
        setAuthStepMessage('');
        setAuthProgress(0);
        setAuthErrorType('INVALID_OTP');
        setAuthError(data.error || 'Invalid verification code or recovery code.');
        return;
      }

      setAuthStepMessage('Verifying Account...');
      setAuthProgress(66);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setAuthStepMessage('Loading Workspace...');
      setAuthProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (data.token) {
        if (rememberMe) {
          localStorage.setItem('guru_jwt_token', data.token);
        } else {
          sessionStorage.setItem('guru_jwt_token', data.token);
        }
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setIsAuthenticating(false);
      setAuthStepMessage('');
      setAuthProgress(0);
      setAuthErrorType('SERVER_UNAVAILABLE');
      setAuthError('Server error during 2FA verification.');
    }
  };

  // OTP Input Keyboard/Paste Navigation
  const handleOtpDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');

    // Handle full paste (e.g. 6 digits)
    if (cleaned.length >= 6) {
      const parts = cleaned.slice(0, 6).split('');
      setOtpDigits(parts);
      inputRefs[5].current?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = cleaned.slice(-1);
    setOtpDigits(next);

    // Auto focus next field
    if (cleaned && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Resend 2FA Code Handler
  const handleResendOTP = async () => {
    if (!pending2FA || isResendingOTP) return;
    setIsResendingOTP(true);
    setResendSuccessMsg('');

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: pending2FA.tempToken,
          method: selected2FAMethod
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTimerSeconds(300);
        setOtpDigits(['', '', '', '', '', '']);
        setResendSuccessMsg(data.message || 'New verification code sent successfully.');
        if (data.demoCode) {
          setPending2FA(prev => prev ? { ...prev, demoCode: data.demoCode } : null);
        }
      } else {
        setAuthError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setAuthError('Failed to dispatch code.');
    } finally {
      setIsResendingOTP(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setAuthErrorType('INVALID_CREDENTIALS');
      setAuthError('Please fill in all registration fields.');
      return;
    }

    if (regPassword.length < 6) {
      setAuthErrorType('INVALID_CREDENTIALS');
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setAuthError('');
    setAuthErrorType('');
    setIsAuthenticating(true);

    setAuthStepMessage('Authenticating...');
    setAuthProgress(33);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          role: regRole
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsAuthenticating(false);
        setAuthStepMessage('');
        setAuthProgress(0);
        setAuthErrorType('INVALID_CREDENTIALS');
        setAuthError(data.error || 'An account with this email or username already exists.');
        return;
      }

      setAuthStepMessage('Verifying Account...');
      setAuthProgress(66);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setAuthStepMessage('Loading Workspace...');
      setAuthProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (data.token) {
        localStorage.setItem('guru_jwt_token', data.token);
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setIsAuthenticating(false);
      setAuthStepMessage('');
      setAuthProgress(0);
      setAuthErrorType('SERVER_UNAVAILABLE');
      setAuthError('Server unavailable. Unable to connect to the GURU-XD cluster.');
    }
  };

  const handleOAuthLogin = async (provider: 'github' | 'google' | 'microsoft') => {
    setAuthError('');
    setAuthErrorType('');
    setIsAuthenticating(true);

    setAuthStepMessage('Authenticating...');
    setAuthProgress(33);

    try {
      const endpoint = `/api/auth/${provider}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUsername: provider === 'github' ? 'enterprise_dev' : undefined,
          email: `user@${provider}.com`,
          name: `${provider.toUpperCase()} Developer`
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsAuthenticating(false);
        setAuthStepMessage('');
        setAuthProgress(0);
        setAuthErrorType('SERVER_UNAVAILABLE');
        setAuthError(`${provider.toUpperCase()} authentication failed.`);
        return;
      }

      setAuthStepMessage('Verifying Account...');
      setAuthProgress(66);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setAuthStepMessage('Loading Workspace...');
      setAuthProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (data.token) {
        localStorage.setItem('guru_jwt_token', data.token);
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setIsAuthenticating(false);
      setAuthStepMessage('');
      setAuthProgress(0);
      setAuthErrorType('SERVER_UNAVAILABLE');
      setAuthError(`Server error during ${provider} authentication.`);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setIsSendingForgot(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setForgotSuccess(data.message);
      } else {
        setForgotError(data.error || 'No account found with this email address.');
      }
    } catch (err) {
      setForgotError('Server unavailable. Unable to connect to the cluster.');
    } finally {
      setIsSendingForgot(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden select-none font-sans text-slate-100">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Authentication Container */}
      <div className="w-full max-w-md my-auto relative z-10 pt-4 pb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-2xl shadow-2xl shadow-slate-950/90 relative overflow-hidden">
          
          {/* Top Brand Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <img 
                src={logoUrl} 
                alt="GURU-XD Enterprise Logo" 
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-2xl shadow-blue-500/20 group-hover:scale-105 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-950 font-bold shadow-md">
                ✓
              </div>
            </div>

            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-white flex items-center justify-center gap-1.5">
                GURU<span className="text-blue-500 font-extrabold">-XD</span>
              </h1>
              <p className="text-xs font-medium text-slate-400 mt-1">
                {pending2FA 
                  ? 'Two-Factor Authentication (2FA)' 
                  : isRegisterMode 
                    ? 'Enterprise Workspace Registration' 
                    : 'Secure Enterprise Operating System'}
              </p>
            </div>
          </div>

          {/* Multi-Stage Loading UX Overlay */}
          {isAuthenticating && (
            <div className="p-5 bg-slate-950/90 border border-blue-500/30 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs font-mono text-blue-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <strong className="font-semibold">{authStepMessage}</strong>
                </span>
                <span>{authProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm shadow-blue-500/50"
                  style={{ width: `${authProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-slate-500 text-center pt-1">
                <span className={authProgress >= 33 ? "text-blue-400 font-bold" : ""}>1. Auth</span>
                <span className={authProgress >= 66 ? "text-blue-400 font-bold" : ""}>2. Verify</span>
                <span className={authProgress >= 100 ? "text-blue-400 font-bold" : ""}>3. Workspace</span>
              </div>
            </div>
          )}

          {/* Elegant Error Cards */}
          {authError && !isAuthenticating && (
            <div className="p-4 rounded-xl text-xs font-sans animate-in fade-in slide-in-from-top-2 duration-200 border shadow-lg space-y-1 bg-rose-950/40 border-rose-500/30 text-rose-300">
              <div className="flex items-center gap-2.5 font-semibold text-rose-200">
                {authErrorType === 'ACCOUNT_DISABLED' && <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />}
                {authErrorType === 'TOO_MANY_ATTEMPTS' && <Clock className="w-4 h-4 shrink-0 text-amber-400" />}
                {authErrorType === 'SERVER_UNAVAILABLE' && <ServerCrash className="w-4 h-4 shrink-0 text-rose-400" />}
                {(authErrorType === 'INVALID_CREDENTIALS' || authErrorType === 'INVALID_OTP') && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                {!authErrorType && <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
                
                <span>
                  {authErrorType === 'ACCOUNT_DISABLED' && 'Account Disabled'}
                  {authErrorType === 'TOO_MANY_ATTEMPTS' && 'Rate Limit Exceeded'}
                  {authErrorType === 'SERVER_UNAVAILABLE' && 'Server Unavailable'}
                  {authErrorType === 'INVALID_CREDENTIALS' && 'Authentication Error'}
                  {authErrorType === 'INVALID_OTP' && '2FA Verification Error'}
                  {!authErrorType && 'Security Alert'}
                </span>
              </div>
              <p className="text-[11px] text-rose-300/90 leading-relaxed pl-6">
                {authError}
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 2: TWO-FACTOR AUTHENTICATION CHALLENGE VIEW          */}
          {/* ========================================================= */}
          {pending2FA ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-medium text-slate-400">
                <button
                  type="button"
                  onClick={() => setSelected2FAMethod('email')}
                  className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    selected2FAMethod === 'email' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3 h-3" />
                  <span>Email OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelected2FAMethod('authenticator')}
                  className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    selected2FAMethod === 'authenticator' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>App Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelected2FAMethod('sms')}
                  className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    selected2FAMethod === 'sms' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>SMS OTP</span>
                </button>
              </div>

              {/* Demo Hint Banner for Easy Testing */}
              {pending2FA.demoCode && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Demo 2FA Code: <strong className="text-white text-sm tracking-widest">{pending2FA.demoCode}</strong></span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (pending2FA.demoCode) {
                        setOtpDigits(pending2FA.demoCode.split(''));
                      }
                    }}
                    className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-md cursor-pointer transition-colors font-semibold"
                  >
                    Auto Fill
                  </button>
                </div>
              )}

              {/* OTP Form or Recovery Code Form */}
              {!useRecoveryCodeMode ? (
                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-slate-300">
                      Enter the 6-digit security code sent via <strong className="text-blue-400 uppercase font-mono">{selected2FAMethod}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Code expires in <span className="font-mono text-amber-400 font-bold">{formatTimer(timerSeconds)}</span>
                    </p>
                  </div>

                  {/* 6 Individual Digit Box Inputs */}
                  <div className="flex items-center justify-center gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={inputRefs[idx]}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 text-center text-lg font-mono font-bold bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl text-white focus:outline-none transition-all"
                      />
                    ))}
                  </div>

                  {/* Resend Code Action */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isResendingOTP || timerSeconds > 240}
                      className="text-blue-400 hover:text-blue-300 disabled:text-slate-600 font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResendingOTP ? 'animate-spin' : ''}`} />
                      <span>{isResendingOTP ? 'Resending...' : 'Resend Code'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUseRecoveryCodeMode(true)}
                      className="text-slate-400 hover:text-slate-200 transition-colors text-[11px] font-medium underline cursor-pointer"
                    >
                      Use Backup Recovery Code
                    </button>
                  </div>

                  {resendSuccessMsg && (
                    <p className="text-[11px] text-emerald-400 text-center font-medium bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      ✓ {resendSuccessMsg}
                    </p>
                  )}

                  {/* Trust Device Option */}
                  <label className="flex items-center gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={trustDevice}
                      onChange={(e) => setTrustDevice(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block group-hover:text-blue-400 transition-colors">
                        Trust this device for 30 days
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Skip 2FA verification on this browser for 30 days
                      </span>
                    </div>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isAuthenticating || otpDigits.some(d => !d)}
                    className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPending2FA(null)}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer pt-1"
                  >
                    ← Back to Sign In
                  </button>
                </form>
              ) : (
                /* Recovery Code Input Form */
                <form onSubmit={handleVerifyOTP} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                      Single-Use Recovery Code
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        required
                        value={recoveryCodeInput}
                        onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. 8F3K-92A1"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 pl-10 pr-3 text-xs font-mono tracking-widest text-white uppercase focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating || recoveryCodeInput.length < 8}
                    className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-800 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>Verify Recovery Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUseRecoveryCodeMode(false)}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer pt-1"
                  >
                    ← Use 6-Digit OTP Code
                  </button>
                </form>
              )}
            </div>
          ) : !isRegisterMode ? (
            /* --- SIGN IN FORM --- */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                  Email or Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="name@company.com or username"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 pl-10 pr-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                    Password
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium cursor-pointer hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 pl-10 pr-10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="pt-2 space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Strength:</span>
                      <span className={`font-bold ${strengthInfo.textColor}`}>{strengthInfo.label}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${strengthInfo.color}`}
                        style={{ width: `${strengthInfo.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                    Remember Me
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-800/80 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 cursor-pointer flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>Sign In</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase font-mono font-semibold tracking-wider">Or OAuth Single Sign-On</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Enterprise OAuth Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isAuthenticating}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-200 font-medium text-[11px] py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={isAuthenticating}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-200 font-medium text-[11px] py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current shrink-0 text-slate-300" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>GitHub</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('microsoft')}
                  disabled={isAuthenticating}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-200 font-medium text-[11px] py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  <span>Microsoft</span>
                </button>
              </div>

              <div className="text-center pt-3 border-t border-slate-800/80">
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setAuthError('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                >
                  <span>Don't have an account?</span>
                  <span className="text-blue-400 font-semibold">Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
            </form>
          ) : (
            /* --- CREATE ACCOUNT FORM --- */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Choose username"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 pl-10 pr-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="email" 
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 pl-10 pr-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 pl-10 pr-10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {regPassword.length > 0 && (
                  <div className="pt-2 space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Strength:</span>
                      <span className={`font-bold ${strengthInfo.textColor}`}>{strengthInfo.label}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${strengthInfo.color}`}
                        style={{ width: `${strengthInfo.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                  Access Scope (Role)
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Administrator">Administrator (Full Write & Deploy)</option>
                  <option value="Developer">Developer (Read/Write Code)</option>
                  <option value="Viewer">Viewer (Read-Only Terminal)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-800/80 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Account</span>
              </button>

              <div className="text-center pt-3 border-t border-slate-800/80">
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setAuthError('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium hover:underline cursor-pointer"
                >
                  Already have an account? <span className="text-blue-400 font-semibold">Sign In</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-100">Reset Password</h3>
                  <p className="text-[11px] text-slate-400">Receive password reset instructions via email</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotSuccess('');
                  setForgotError('');
                }}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instructions Sent</span>
                </div>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed">{forgotSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                {forgotError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter registered email address"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingForgot}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-blue-600/20"
                  >
                    {isSendingForgot ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Production Footer */}
      <footer className="w-full max-w-5xl mx-auto border-t border-slate-900 pt-6 pb-4 px-4 text-center space-y-3 relative z-10 text-slate-500 text-xs font-sans">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-2 font-display font-bold text-sm text-slate-200">
            <span>GURU-XD</span>
            <span className="text-[10px] font-mono font-normal text-slate-500 border border-slate-800 px-2 py-0.5 rounded-full uppercase bg-slate-900">
              Enterprise Bot Hosting Platform
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span>Version 1.0.0</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-900/60 text-[11px]">
          <p>© 2026 GURU-XD. All Rights Reserved.</p>

          <div className="flex items-center gap-4 text-slate-400">
            <button 
              onClick={() => setActiveFooterModal('privacy')}
              className="hover:text-blue-400 transition-colors cursor-pointer hover:underline"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              onClick={() => setActiveFooterModal('terms')}
              className="hover:text-blue-400 transition-colors cursor-pointer hover:underline"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button 
              onClick={() => setActiveFooterModal('status')}
              className="hover:text-emerald-400 transition-colors cursor-pointer hover:underline flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Status</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Render Footer Modals */}
      <FooterModals 
        activeModal={activeFooterModal} 
        onClose={() => setActiveFooterModal(null)} 
      />
    </div>
  );
}
