import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, User, UserCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('analyst');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      toast.error('All registration inputs are required.');
      return;
    }

    setIsLoading(true);
    const res = await register(username, email, password, role);
    setIsLoading(false);

    if (res.success) {
      toast.success('Registration successful. You can now log in!');
      navigate('/login');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.03),transparent_60%)] pointer-events-none" />
      
      <div className="w-full max-w-md bg-brand-sidebar border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-brand-primary/10 rounded-xl border border-brand-primary/30 mb-3">
            <ShieldAlert className="w-8 h-8 text-brand-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-wider text-white">Create Credentials</h2>
          <p className="text-xs text-gray-500 font-mono tracking-widest uppercase mt-2">Provision new Analyst Role Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 block">Operator Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username"
                className="w-full bg-brand-bg border border-gray-800 hover:border-gray-700/80 focus:border-brand-primary focus:outline-none pl-10 pr-4 py-2 rounded-lg text-xs text-gray-200 transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 block">Secure Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@defenderai.local"
                className="w-full bg-brand-bg border border-gray-800 hover:border-gray-700/80 focus:border-brand-primary focus:outline-none pl-10 pr-4 py-2 rounded-lg text-xs text-gray-200 transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 block">Access Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose password"
                className="w-full bg-brand-bg border border-gray-800 hover:border-gray-700/80 focus:border-brand-primary focus:outline-none pl-10 pr-4 py-2 rounded-lg text-xs text-gray-200 transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Role selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 block">Security Clearance level</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <UserCheck className="w-4 h-4" />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-brand-bg border border-gray-800 hover:border-gray-700/80 focus:border-brand-primary focus:outline-none pl-10 pr-4 py-2 rounded-lg text-xs text-gray-200 transition-colors cursor-pointer appearance-none"
                disabled={isLoading}
              >
                <option value="analyst">Analyst (Upload logs, write investigations)</option>
                <option value="admin">Administrator (Full control settings & deletions)</option>
                <option value="viewer">Viewer (Read-only operational metrics)</option>
              </select>
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-brand-primary text-black font-bold text-xs tracking-wider uppercase hover:bg-cyan-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_4px_20px_rgba(0,229,255,0.15)] hover:shadow-[0_4px_25px_rgba(0,229,255,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Provisioning Account...</span>
              </>
            ) : (
              <span>Provision Security Role</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-800/80 pt-4">
          <p className="text-xs text-gray-500">
            Already have an active console key?{' '}
            <Link to="/login" className="text-brand-primary hover:underline font-semibold transition-colors">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
