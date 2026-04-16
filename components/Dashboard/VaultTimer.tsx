import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, AlertCircle } from 'lucide-react';

interface VaultTimerProps {
  createdAt: string;
  expiresAt?: string;
  views: number;
  maxViews?: number;
  lockedUntil?: string;
}

export const VaultTimer: React.FC<VaultTimerProps> = ({ createdAt, expiresAt, views, maxViews, lockedUntil }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTime = () => {
      let expires: number;
      if (expiresAt) {
        expires = new Date(expiresAt).getTime();
      } else {
        // Fallback for legacy vaults
        expires = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
      }
      const now = new Date().getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [createdAt, expiresAt]);

  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

  if (isLocked) return (
    <div className="bg-red-600 py-2.5 px-4 flex items-center justify-between text-white font-black uppercase text-xs tracking-widest animate-pulse border-t border-red-700">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        <span>Vault Locked</span>
      </div>
      <div className="flex items-center gap-2 opacity-80">
        <Clock className="w-3 h-3" />
        <span>Expires: {new Date(lockedUntil!).toLocaleDateString()}</span>
      </div>
    </div>
  );

  if (timeLeft === 'Expired') return (
    <div className="bg-red-50 dark:bg-red-900/10 py-2 px-4 border-t border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2">
      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
      <span className="text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">Vault Expired</span>
    </div>
  );

  if (!expiresAt) return (
    <div className="bg-primary-50/60 dark:bg-primary-900/10 py-2.5 px-4 border-t border-primary-100/50 dark:border-primary-900/30 flex items-center justify-center gap-2 group/timer transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20">
      <ShieldCheck className="w-3.5 h-3.5 text-primary-500 group-hover/timer:scale-110 transition-transform" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-primary-700 dark:text-primary-400 font-black uppercase tracking-widest">Permanent Store</span>
        <span className="text-xs font-black text-primary-600 dark:text-primary-500 uppercase tracking-tighter bg-primary-100 dark:bg-primary-900/50 px-1.5 py-0.5 rounded">Unlimited</span>
      </div>
    </div>
  );

  return (
    <div className="bg-amber-50/60 dark:bg-amber-900/10 py-2.5 px-4 border-t border-amber-100/50 dark:border-amber-900/30 flex items-center justify-center gap-2 group/timer transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20">
      <Clock className="w-3.5 h-3.5 text-amber-500 group-hover/timer:animate-spin-slow" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest">Valid for:</span>
        <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-500 tabular-nums">{timeLeft}</span>
      </div>
    </div>
  );
};
