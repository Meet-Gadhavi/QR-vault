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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Main Vault Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col items-center">
          
          <div className="relative mb-10">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/20 rotate-3 flex-shrink-0">
               <ShieldCheck className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-12 border-2 border-primary-50">
               <Lock size={20} className="text-primary-600" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Central Command</h1>
            <p className="text-gray-400 text-sm font-medium">Authentication required to access the vault</p>
          </div>

          <div className="w-full space-y-8 flex flex-col items-center">
            <div className="flex flex-col items-center gap-6">
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
                      className={`border-2 transition-all duration-300 w-16 h-20 rounded-2xl text-2xl font-black !shadow-none ${
                        error 
                          ? 'border-red-500/50 bg-red-500/10 text-red-500' 
                          : 'border-white/10 bg-white/5 focus:border-primary-500 focus:bg-white/10 text-white'
                      }`}
                    />
                  ))}
                </PinInput.Group>
              </PinInput>

              {error && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                  Invalid Access Code
                </p>
              )}
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2"></div>

            <button
              onClick={() => window.location.href = '/'}
              className="group flex items-center gap-2 text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Base
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
