import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AdminAuthProps {
  onAuthenticated: (password: string) => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2008') {
      onAuthenticated(password);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4 border border-primary-100">
            <ShieldCheck className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Secret Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-2">Enter the master password to gain access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`w-full px-4 py-3 bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-center text-lg tracking-widest`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-xs mt-2 text-center animate-shake">Incorrect password. Please try again.</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2 group"
          >
            <Lock size={18} className="group-hover:rotate-12 transition-transform" />
            Unlock Dashboard
          </button>
        </form>
        
        <div className="mt-8 text-center">
            <button 
              onClick={() => window.location.href = '/'}
              className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            >
              Back to Home
            </button>
        </div>
      </div>
    </div>
  );
};
