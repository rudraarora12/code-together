import React, { useState } from 'react';
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
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'
];

export default function SignupPage() {
  const { signup, loginWithGoogle, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Fullstack Developer');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await signup({
        name,
        email,
        password,
        role,
        avatar: selectedAvatar
      });

      showToast(`Welcome to CodeTogether, ${name}!`, 'success');
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
    <div className="min-h-screen bg-[#0b0d17] text-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-600/30 selection:text-cyan-200 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-600/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#121524] rounded-[11px] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CodeTogether</span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">
          Create your developer profile
        </h2>
        <p className="mt-2 text-xs text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Sign in
          </Link>
        </p>

        {/* Live Firebase badge */}
        <div className="mt-3 flex justify-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
            isFirebaseConfigured
              ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
              : 'bg-gray-900 text-gray-400 border-gray-800'
          }`}>
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>{isFirebaseConfigured ? 'Firebase Authentication Connected' : 'Demo Auth Active'}</span>
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#121422] border border-gray-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl space-y-5">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start gap-2.5 text-xs text-red-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Google Sign In (if Firebase configured) */}
          {isFirebaseConfigured && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 border border-gray-700/80 hover:border-gray-600 rounded-xl text-xs font-semibold text-white transition-all shadow-sm disabled:opacity-50"
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Choose Avatar */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">Choose Avatar</label>
              <div className="flex items-center space-x-3">
                {AVATAR_OPTIONS.map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt={`Avatar option ${i}`}
                    onClick={() => setSelectedAvatar(imgUrl)}
                    className={`w-10 h-10 rounded-full object-cover cursor-pointer transition-all ${
                      selectedAvatar === imgUrl
                        ? 'ring-2 ring-cyan-400 scale-110'
                        : 'opacity-60 hover:opacity-100 ring-1 ring-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300">Full Name</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Elena Rostova"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300">Email Address</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="elena@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300">Password (min 6 characters)</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300">Primary Role</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Briefcase className="w-4 h-4" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Fullstack Developer">Fullstack Developer</option>
                  <option value="Frontend Specialist">Frontend Specialist</option>
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Lead Software Architect">Lead Software Architect</option>
                  <option value="Computer Science Student">Computer Science Student</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-500/20 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 focus:outline-none transition-all disabled:opacity-60"
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
        </div>
      </div>
    </div>
  );
}
