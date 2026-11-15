import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, ArrowRight, Lock, Mail, Sparkles, UserCheck } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export default function LoginPage() {
  const { login, quickLoginAs } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('alex@codetogether.dev');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    login(email, password);
    showToast('Signed in successfully');
    navigate('/dashboard');
  };

  const handleQuickLogin = (demoUser) => {
    quickLoginAs(demoUser);
    showToast(`Signed in as ${demoUser.name}`);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0b0d17] text-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-600/30 selection:text-cyan-200 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#121524] rounded-[11px] flex items-center justify-center">
              <Code2 className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CodeTogether</span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">
          Sign in to your workspace
        </h2>
        <p className="mt-2 text-xs text-gray-400">
          Or{' '}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
            create a new developer account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#121422] border border-gray-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300">Email Address</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  placeholder="alex@codetogether.dev"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300">Password</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/25 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-all"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick 1-Click Demo Profiles */}
          <div className="pt-4 border-t border-gray-800/80">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quick 1-Click Demo Logins</span>
            </div>

            <div className="space-y-2">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => handleQuickLogin(demo)}
                  className="w-full p-2 rounded-xl bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-indigo-500/50 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={demo.avatar}
                      alt={demo.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-cyan-500/30"
                    />
                    <div>
                      <p className="text-xs font-medium text-white group-hover:text-cyan-300 transition-colors">
                        {demo.name}
                      </p>
                      <p className="text-[10px] text-gray-500">{demo.role}</p>
                    </div>
                  </div>
                  <UserCheck className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
