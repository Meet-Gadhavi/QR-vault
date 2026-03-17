import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { PinInput } from '../components/base/pin-input/pin-input';

interface AdminAuthProps {
  onAuthenticated: (password: string) => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated }) => {
  const [error, setError] = useState(false);

  const handleComplete = (value: string) => {
    if (value === '2008') {
      onAuthenticated(value);
    } else {
      setError(true);
      // Reset after a delay
      setTimeout(() => {
        setError(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-10 animate-fade-in-up relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-100 rounded-full blur-3xl opacity-50"></div>

        <div className="flex flex-col items-center mb-10 relative z-10">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary-200 border-4 border-white">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Vault</h1>
          <p className="text-gray-500 text-sm mt-3 font-medium">Enter your 4-digit master security PIN</p>
        </div>

        <div className="flex flex-col items-center gap-8 relative z-10">
          <PinInput 
            size="lg" 
            className={error ? 'animate-shake' : ''}
          >
            <PinInput.Group 
              containerClassName="gap-4" 
              maxLength={4} 
              onComplete={handleComplete}
            >
              {[0, 1, 2, 3].map((i) => (
                <PinInput.Slot 
                  key={i} 
                  index={i} 
                  className={`border-2 transition-all duration-300 ${
                    error 
                      ? 'border-red-200 bg-red-50 text-red-600' 
                      : 'border-gray-100 bg-gray-50 focus:border-primary-500 focus:bg-white text-gray-900'
                  }`}
                />
              ))}
            </PinInput.Group>
          </PinInput>

          {error && (
            <p className="text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
              Invalid Security PIN
            </p>
          )}

          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent my-2"></div>

          <button
            onClick={() => window.location.href = '/'}
            className="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-widest transition-all hover:tracking-[0.2em]"
          >
            ← Cancel Access
          </button>
        </div>
      </div>
    </div>
  );
};
