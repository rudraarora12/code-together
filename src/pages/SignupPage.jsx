import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Code2, 
  ArrowRight, 
  User, 
  Mail, 
  Lock, 
  Briefcase, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Sparkles,
  Zap,
  Terminal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

const AVATAR_OPTIONS = [
  {
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    label: 'Alex'
  },
  {
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    label: 'Sarah'
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    label: 'Marcus'
  },
  {
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    label: 'Dev'
  },
  {
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    label: 'Architect'
  }
];

export default function SignupPage() {
  const { signup, loginWithGoogle, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('Fullstack Developer');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].url);
  const [agreedTerms, setAgreedTerms] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live password validation criteria
  const passwordCriteria = useMemo(() => {
    return {
      hasMinLen: password.length >= 6,
      hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumberOrSymbol: /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password),
      hasStrongLen: password.length >= 10
    };
  }, [password]);

  // Live strength score (0 to 4)
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (passwordCriteria.hasMinLen) score++;
    if (passwordCriteria.hasUpperLower) score++;
    if (passwordCriteria.hasNumberOrSymbol) score++;
    if (passwordCriteria.hasStrongLen) score++;
    return score;
  }, [password, passwordCriteria]);

  const strengthConfig = [
    { label: 'Very Weak', color: 'bg-red-500', text: 'text-red-400' },
    { label: 'Weak', color: 'bg-red-400', text: 'text-red-400' },
    { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-400' },
    { label: 'Good', color: 'bg-blue-400', text: 'text-blue-400' },
    { label: 'Strong', color: 'bg-emerald-400', text: 'text-emerald-400' }
  ][passwordStrength];

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (!agreedTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        avatar: selectedAvatar
      });

      showToast(`Welcome to CodeTogether, ${name.trim()}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      showToast('Signed in with Google successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google registration failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d17] text-gray-200 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-indigo-600/30 selection:text-cyan-200 relative overflow-hidden">
      {/* Background glow ambient effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center relative z-10">
        <Link to="/" className="inline-flex items-center space-x-2.5 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-[1px] shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-all">
            <div className="w-full h-full bg-[#121524] rounded-[11px] flex items-center justify-center">
              <Code2 className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">CodeTogether</span>
        </Link>

        <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Create your developer profile
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 decoration-cyan-500/30 hover:decoration-cyan-400 transition-colors">
            Sign in here
          </Link>
        </p>

        {/* Live Firebase badge */}
        <div className="mt-3 flex justify-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border shadow-sm ${
            isFirebaseConfigured
              ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
              : 'bg-gray-900/90 text-gray-400 border-gray-800'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{isFirebaseConfigured ? 'Firebase Authentication Connected' : 'Demo Auth Active'}</span>
          </span>
        </div>
      </div>

      {/* Registration Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-[#121422]/90 backdrop-blur-xl border border-gray-800/80 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl shadow-black/50 space-y-5">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-red-950/50 border border-red-800/60 rounded-xl flex items-start gap-3 text-xs text-red-300 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed space-y-1">
                <p className="font-medium text-red-200">{error}</p>
                {error.includes('Email/Password provider') && (
                  <p className="text-[11px] text-red-400/90">
                    💡 Tip: Go to Firebase Console → Authentication → Sign-in method, click "Email/Password" and enable it.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Google Sign Up Button (if Firebase is active) */}
          {isFirebaseConfigured && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-gray-900 hover:bg-gray-800/90 border border-gray-700/80 hover:border-gray-600 rounded-xl text-xs font-semibold text-white transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Sign up with Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink mx-3 text-[11px] text-gray-500 uppercase tracking-wider font-mono">or register with email</span>
                <div className="flex-grow border-t border-gray-800"></div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Choose Avatar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-300">Choose Developer Avatar</label>
                <span className="text-[11px] text-gray-500">Pick your visual persona</span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-950/70 border border-gray-800/80 rounded-xl">
                {AVATAR_OPTIONS.map((item, idx) => {
                  const isSelected = selectedAvatar === item.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(item.url)}
                      className={`relative rounded-full transition-all group focus:outline-none ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#121422] scale-105'
                          : 'opacity-65 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black rounded-full p-0.5 shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-300">Full Name</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  className="block w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="e.g. Alex Rivera"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-300">Email Address</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="block w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="alex@company.com"
                />
              </div>
            </div>

            {/* Primary Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-300">Primary Developer Role</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Briefcase className="w-4 h-4" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full pl-9 pr-8 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                >
                  <option value="Fullstack Developer">Fullstack Developer</option>
                  <option value="Frontend Specialist">Frontend Specialist</option>
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Lead Software Architect">Lead Software Architect</option>
                  <option value="DevOps / Cloud Engineer">DevOps / Cloud Engineer</option>
                  <option value="Computer Science Student">Computer Science Student</option>
                  <option value="AI / Machine Learning Engineer">AI / Machine Learning Engineer</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-300">Password</label>
                {password.length > 0 && (
                  <span className={`text-[11px] font-medium ${strengthConfig.text}`}>
                    {strengthConfig.label}
                  </span>
                )}
              </div>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="block w-full pl-9 pr-10 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="Create password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-4 gap-1.5 h-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full rounded-full transition-all duration-300 ${
                          passwordStrength >= step ? strengthConfig.color : 'bg-gray-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
                    <span className={`flex items-center gap-1 ${passwordCriteria.hasMinLen ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <Check className="w-3 h-3" /> 6+ chars
                    </span>
                    <span className={`flex items-center gap-1 ${passwordCriteria.hasUpperLower ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <Check className="w-3 h-3" /> Uppercase & lowercase
                    </span>
                    <span className={`flex items-center gap-1 ${passwordCriteria.hasNumberOrSymbol ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <Check className="w-3 h-3" /> Number or symbol
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-300">Confirm Password</label>
                {passwordsMatch && (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </span>
                )}
                {passwordsMismatch && (
                  <span className="text-[11px] text-red-400 font-medium">
                    Passwords do not match
                  </span>
                )}
              </div>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`block w-full pl-9 pr-10 py-2.5 bg-gray-950 border rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none transition-colors ${
                    passwordsMismatch
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : passwordsMatch
                      ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      : 'border-gray-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions Agreement */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-700 bg-gray-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900 cursor-pointer"
                />
                <span className="text-[11px] leading-tight text-gray-400">
                  I agree to CodeTogether's{' '}
                  <span className="text-gray-300 hover:underline">Terms of Service</span> and{' '}
                  <span className="text-gray-300 hover:underline">Privacy Policy</span>.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || passwordsMismatch}
              className="w-full mt-2 flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-500/20 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#121422] transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Feature Trust Pills */}
          <div className="pt-4 border-t border-gray-800/80 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-gray-950/50 border border-gray-800/40">
              <Zap className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-medium">Real-Time Sync</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-950/50 border border-gray-800/40">
              <Terminal className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-medium">Code Sandbox</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-950/50 border border-gray-800/40">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-medium">Yjs CRDTs</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
