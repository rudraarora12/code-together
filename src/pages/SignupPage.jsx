import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, ArrowRight, User, Mail, Lock, Briefcase } from 'lucide-react';
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
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Fullstack Developer');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    signup({
      name,
      email,
      role,
      avatar: selectedAvatar
    });

    showToast(`Welcome aboard, ${name}!`);
    navigate('/dashboard');
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
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#121422] border border-gray-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl space-y-6">
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  placeholder="elena@company.com"
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
                  className="block w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
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
              className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-600/25 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 focus:outline-none transition-all"
            >
              <span>Create Account & Start Coding</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
