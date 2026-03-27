import { useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';

const benefits = [
  'Track reports, comments, and solutions from one secure account.',
  'Use Firebase sign-in for email/password or Google access.',
  'Jump back into posting and moderation tools without a second login.',
];

const highlights = [
  { label: 'Verified reports', value: '842' },
  { label: 'Community supporters', value: '12.8k' },
  { label: 'Cities active today', value: '26' },
];

function AuthPage({ error, isSubmitting, logo, onBack, onEmailAuth, onGoogleAuth }) {
  const [mode, setMode] = useState('login');
  const [formState, setFormState] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setLocalError('');
  };

  const handleChange = (field) => (event) => {
    setLocalError('');
    setFormState((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (mode === 'signup' && formState.password !== formState.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    await onEmailAuth({
      mode,
      displayName: formState.displayName.trim(),
      email: formState.email.trim(),
      password: formState.password,
    });
  };

  const visibleError = localError || error;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_32%),linear-gradient(135deg,_#eff6ff_0%,_#f8fafc_55%,_#fff7ed_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col overflow-hidden rounded-[40px] border border-white/70 bg-white/75 shadow-[0_32px_100px_-42px_rgba(15,23,42,0.4)] backdrop-blur-xl lg:flex-row">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 px-6 py-8 text-white sm:px-8 lg:w-[46%] lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.32),_transparent_26%)]" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-blue-100 backdrop-blur">
                Firebase Auth
              </span>
            </div>

            <div className="mt-10">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
                <img src={logo} alt="Public Policy Hub" className="h-10 w-auto" />
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-blue-100">Public Policy Hub</p>
                  <p className="text-sm text-white/70">Civic reporting that feels current, fast, and credible.</p>
                </div>
              </div>

              <h1 className="mt-8 max-w-lg font-display text-4xl font-bold leading-tight sm:text-5xl">
                Sign in or create an account from a page built for the job.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-blue-100">
                Your reporting, profile, and posting access now start from a dedicated auth screen instead of an inline card buried in the feed.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-[28px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">{item.label}</p>
                  <p className="mt-3 font-display text-3xl font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              {benefits.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
                  <p className="text-sm leading-6 text-white/85">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/75">Auth note</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/80">
                  Email/password signup requires the Firebase Email/Password provider to be enabled in your Firebase project settings.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl rounded-[36px] border border-slate-200/80 bg-white px-6 py-7 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.28)] sm:px-8 sm:py-9">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Account access</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {mode === 'login'
                    ? 'Use your Firebase credentials to get back into posting and profile tools.'
                    : 'Create a new Firebase-backed account to report issues and save your reputation profile.'}
                </p>
              </div>
              <div className="hidden rounded-[28px] bg-slate-100 px-4 py-3 text-right sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Secure session</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Email, password, or Google</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-2 rounded-[22px] bg-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                  mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                  mode === 'signup' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Display name</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formState.displayName}
                      onChange={handleChange('displayName')}
                      className="form-input pl-11"
                      placeholder="How your profile should appear"
                      autoComplete="name"
                      required
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={formState.email}
                    onChange={handleChange('email')}
                    className="form-input pl-11"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={formState.password}
                    onChange={handleChange('password')}
                    className="form-input pl-11"
                    placeholder={mode === 'login' ? 'Enter your password' : 'At least 6 characters'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                </div>
              </label>

              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={formState.confirmPassword}
                      onChange={handleChange('confirmPassword')}
                      className="form-input pl-11"
                      placeholder="Repeat the same password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </label>
              )}

              {visibleError && (
                <div className="rounded-[22px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {visibleError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Working...' : mode === 'login' ? 'Login with Firebase' : 'Create account with Firebase'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Or continue with</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={onGoogleAuth}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-5 py-3.5 text-[15px] font-semibold text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Continue with Google
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
