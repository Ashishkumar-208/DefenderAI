import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, Shield, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('All authentication parameters required.');
      return;
    }

    setIsLoading(true);
    const res = await login(username, password);
    setIsLoading(false);

    if (res.success) {
      toast.success(`Access granted. Welcome back, ${username}!`);
      navigate('/dashboard');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Visual cyber backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.03),transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent pointer-events-none animate-pulse" />

      {/* Main card */}
      <div className="w-full max-w-md bg-brand-sidebar border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-primary/10 rounded-xl border border-brand-primary/30 mb-3 animate-pulse">
            <Shield className="w-8 h-8 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-wider text-white">
            DEFENDER<span className="text-brand-primary">AI</span>
          </h2>

          <p className="text-xs text-gray-500 font-mono tracking-widest uppercase mt-2">SECURE SOC ACCESS TERMINAL</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="Enter username"
                className="w-full bg-brand-bg border border-gray-800 hover:border-gray-700/80 focus:border-brand-primary focus:outline-none pl-10 pr-4 py-2.5 rounded-lg text-xs text-gray-200 transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 block">Access Key</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-brand-bg border border-gray-800 hover:border-gray-700/80 focus:border-brand-primary focus:outline-none pl-10 pr-4 py-2.5 rounded-lg text-xs text-gray-200 transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-brand-primary text-black font-bold text-xs tracking-wider uppercase hover:bg-cyan-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_4px_20px_rgba(0,229,255,0.15)] hover:shadow-[0_4px_25px_rgba(0,229,255,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Authenticating Key...</span>
              </>
            ) : (
              <span>Initiate Connection</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-800/80 pt-6">
          <p className="text-xs text-gray-500">
            Authorized analysts only. Need credentials?{' '}
            <Link to="/register" className="text-brand-primary hover:underline font-semibold transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
