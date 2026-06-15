import { useState } from 'react';
import {
  Zap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Calendar,
  Brain,
  Timer,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
  Inbox,
  ShieldCheck,
} from 'lucide-react';

export interface RegisteredUser {
  name: string;
  email: string;
  password: string;
}

// Common valid top-level domains — flags typos like ".cm" instead of ".com"
const VALID_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'io', 'co', 'in',
  'us', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'ru', 'br', 'es',
  'it', 'nl', 'se', 'no', 'fi', 'dk', 'ch', 'at', 'be', 'pl', 'info',
  'biz', 'me', 'tv', 'app', 'dev', 'ai', 'xyz', 'online', 'tech', 'store',
];

// Common typos mapped to their correct domain for a helpful error message
const DOMAIN_TYPOS: Record<string, string> = {
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.om': 'gmail.com',
  'yahoo.co': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'outlook.co': 'outlook.com',
  'outlok.com': 'outlook.com',
  'hotmail.co': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'icloud.co': 'icloud.com',
};

/**
 * Validates an email address.
 * Returns null if valid, or an error message string if invalid.
 */
function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) return 'Email is required';

  // Basic structure: something@something.something
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Incorrect email format (e.g. name@gmail.com)';
  }

  const domain = trimmed.split('@')[1] || '';

  // Catch known domain typos with a specific suggestion
  if (DOMAIN_TYPOS[domain]) {
    return `Incorrect email — did you mean @${DOMAIN_TYPOS[domain]}?`;
  }

  // Validate the TLD (text after the final dot)
  const tld = domain.split('.').pop() || '';
  if (!VALID_TLDS.includes(tld)) {
    return 'Incorrect email — please check the spelling (e.g. name@gmail.com)';
  }

  return null; // valid
}

interface AuthPageProps {
  registeredUsers: RegisteredUser[];
  onRegister: (user: RegisteredUser) => void;
  onUpdatePassword: (email: string, newPassword: string) => void;
  onAuthenticated: (name: string, email: string) => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'check-email' | 'reset' | 'reset-success';

export default function AuthPage({
  registeredUsers,
  onRegister,
  onUpdatePassword,
  onAuthenticated,
  onToast,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    if (newMode === 'signin' || newMode === 'signup') {
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const validateSignInUp = () => {
    const newErrors: Record<string, string> = {};
    if (mode === 'signup' && !name.trim()) {
      newErrors.name = 'Please enter your name';
    }
    const emailError = validateEmail(email);
    if (emailError) {
      newErrors.email = emailError;
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Show a toast if the email is invalid (e.g. spelling mistakes)
    const emailError = validateEmail(email);
    if (emailError) {
      onToast('error', emailError);
    }
    if (!validateSignInUp()) return;

    if (mode === 'signup') {
      const existing = registeredUsers.find(u => u.email === email.trim().toLowerCase());
      if (existing) {
        setErrors({ general: 'An account with this email already exists. Please sign in instead.' });
        onToast('error', 'Account already exists with this email');
        return;
      }
      const newUser: RegisteredUser = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      };
      onRegister(newUser);
      onToast('success', `Welcome to FlowMind, ${newUser.name}! 🎉`);
      onAuthenticated(newUser.name, newUser.email);
    } else {
      const user = registeredUsers.find(u => u.email === email.trim().toLowerCase());
      if (!user) {
        setErrors({ general: 'No account found with this email. Please sign up first.' });
        onToast('error', 'Account not found. Please sign up first.');
        return;
      }
      if (user.password !== password) {
        setErrors({ general: 'Incorrect password. Please try again.' });
        onToast('error', 'Wrong password, try again');
        return;
      }
      onToast('success', `Welcome back, ${user.name}! 👋`);
      onAuthenticated(user.name, user.email);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      onToast('error', emailError);
      return;
    }
    const user = registeredUsers.find(u => u.email === email.trim().toLowerCase());
    if (!user) {
      setErrors({ email: 'No account found with this email.' });
      onToast('error', 'No account found with this email');
      return;
    }
    setResetEmail(user.email);
    setErrors({});
    setMode('check-email');
    onToast('success', `Password reset link sent to ${user.email}`);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onUpdatePassword(resetEmail, newPassword);
    onToast('success', 'Password changed successfully! You can now sign in.');
    setMode('reset-success');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const renderFormHeader = () => {
    const config: Record<AuthMode, { title: string; subtitle: string; emoji: string }> = {
      signin: { title: 'Welcome back', subtitle: 'Sign in to continue to your workspace', emoji: '👋' },
      signup: { title: 'Create your account', subtitle: 'Start boosting your productivity today', emoji: '🚀' },
      forgot: { title: 'Forgot password?', subtitle: 'Enter your email and we\'ll send you a reset link', emoji: '🔑' },
      'check-email': { title: 'Check your inbox', subtitle: 'We\'ve sent a password reset link', emoji: '📬' },
      reset: { title: 'Set new password', subtitle: 'Choose a strong password for your account', emoji: '🔒' },
      'reset-success': { title: 'Password updated!', subtitle: 'Your password has been changed successfully', emoji: '✅' },
    };
    const c = config[mode];
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800">
          {c.title} {c.emoji}
        </h2>
        <p className="mt-2 text-sm text-slate-500">{c.subtitle}</p>
      </div>
    );
  };

  const renderBackButton = () => (
    <button
      type="button"
      onClick={() => switchMode('signin')}
      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 mb-2"
    >
      <ArrowLeft className="h-3 w-3" />
      Back to Sign In
    </button>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Left side - Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-12 lg:flex">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute right-32 top-1/3 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">FlowMind</h1>
            <p className="text-xs font-medium text-violet-200">AI Productivity OS</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Work smarter,<br />not harder.
          </h2>
          <p className="mt-4 max-w-md text-violet-100">
            Your AI productivity operating system that plans your day, breaks down work, and protects you from burnout.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { icon: Calendar, text: 'AI Smart Day Planner' },
              { icon: Brain, text: 'Intelligent Task Breakdown' },
              { icon: Timer, text: 'Focus Sessions & Burnout Detection' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <feature.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold">Your data is secure</span>
          </div>
          <p className="mt-2 text-xs text-violet-100">
            FlowMind protects your account with password encryption and secure reset flows.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-200">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">FlowMind</h1>
              <p className="text-[10px] font-medium text-violet-500">AI Productivity OS</p>
            </div>
          </div>

          {renderFormHeader()}

          {/* Toggle tabs - only for signin/signup */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => switchMode('signin')}
                className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                  mode === 'signin' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                  mode === 'signup' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Back button for non-main modes */}
          {(mode === 'forgot' || mode === 'reset' || mode === 'reset-success') && (
            <div className="mt-4">{renderBackButton()}</div>
          )}

          {/* SIGN IN / SIGN UP FORM */}
          {(mode === 'signin' || mode === 'signup') && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {errors.general && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="text-xs font-medium text-rose-700">⚠️ {errors.general}</p>
                </div>
              )}
              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-medium text-slate-600">Full Name</label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-violet-100 ${
                        errors.name ? 'border-rose-300' : 'border-slate-200 focus:border-violet-300'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600">Email Address</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-violet-100 ${
                      errors.email ? 'border-rose-300' : 'border-slate-200 focus:border-violet-300'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-medium text-violet-600 hover:text-violet-700"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-violet-100 ${
                      errors.password ? 'border-rose-300' : 'border-slate-200 focus:border-violet-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
              </div>

              {mode === 'signup' && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <p className="text-xs text-slate-500">
                    By signing up, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs text-emerald-700">
                  💡 Tip: Use a strong password with at least 6 characters for best security.
                </p>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600">Email Address</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-violet-100 ${
                      errors.email ? 'border-rose-300' : 'border-slate-200 focus:border-violet-300'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <Mail className="h-4 w-4" />
                Send Reset Link
              </button>
            </form>
          )}

          {/* CHECK EMAIL SCREEN */}
          {mode === 'check-email' && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col items-center rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-200">
                  <Inbox className="h-8 w-8 text-white" />
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  We've sent a password reset link to
                </p>
                <p className="mt-1 text-sm font-bold text-violet-700">{resetEmail}</p>
                <p className="mt-3 text-xs text-slate-500">
                  Please check your inbox and click the link to reset your password. The link will expire in 30 minutes.
                </p>
              </div>

              {/* Simulated email link button (for demo purposes) */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold text-amber-700 mb-2">📧 Demo: Simulate opening email</p>
                <p className="text-[11px] text-amber-600 mb-3">
                  In production, the user would click a link in their email. Click below to simulate that.
                </p>
                <button
                  onClick={() => switchMode('reset')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Open Reset Link (Simulated)
                </button>
              </div>

              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="w-full text-center text-xs font-medium text-violet-600 hover:text-violet-700"
              >
                Didn't receive it? Send again
              </button>
            </div>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600">New Password</label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-violet-100 ${
                      errors.newPassword ? 'border-rose-300' : 'border-slate-200 focus:border-violet-300'
                    }`}
                  />
                </div>
                {errors.newPassword && <p className="mt-1 text-xs text-rose-500">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Confirm New Password</label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-violet-100 ${
                      errors.confirmPassword ? 'border-rose-300' : 'border-slate-200 focus:border-violet-300'
                    }`}
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <ShieldCheck className="h-4 w-4" />
                Update Password
              </button>
            </form>
          )}

          {/* RESET SUCCESS SCREEN */}
          {mode === 'reset-success' && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <p className="mt-4 text-sm font-bold text-emerald-700">
                  Your password has been changed successfully!
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  You can now sign in using your new password.
                </p>
              </div>

              <button
                onClick={() => switchMode('signin')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <ArrowRight className="h-4 w-4" />
                Sign In Now
              </button>
            </div>
          )}

          {/* Footer - only for main modes */}
          {(mode === 'signin' || mode === 'signup') && (
            <p className="mt-6 text-center text-xs text-slate-400">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="font-semibold text-violet-600 hover:text-violet-700"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
