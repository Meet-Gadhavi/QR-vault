import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, Zap, Lock, Plus, HardDrive, Download, 
  ShieldCheck, Loader2 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { User, PlanType, Invoice } from '../../types';

interface StatGridProps {
  appUser: User;
  storageUsedDisplay: number;
  isOverLimit: boolean;
  timeLeft: string;
  googleTokens: any;
  needsDriveConnection: boolean;
  handleConnectGoogleDrive: () => void;
  openCreateModal: () => void;
  invoices: Invoice[];
  downloadInvoice: (inv: Invoice) => void;
  formatBytes: (bytes: number) => string;
  colors: string[];
}

const GoogleDriveImg = ({ className }: { className?: string }) => (
  <img src="/GD.png" alt="Google Drive" className={className} />
);

export const StatGrid: React.FC<StatGridProps> = ({
  appUser,
  storageUsedDisplay,
  isOverLimit,
  timeLeft,
  googleTokens,
  needsDriveConnection,
  handleConnectGoogleDrive,
  openCreateModal,
  invoices,
  downloadInvoice,
  formatBytes,
  colors
}) => {
  const data = [
    { name: 'Used', value: storageUsedDisplay },
    { name: 'Free', value: Math.max(0, appUser.storageLimit - storageUsedDisplay) },
  ];

  const isPaidPlan = appUser.plan === PlanType.STARTER || appUser.plan === PlanType.PRO;

  return (
    <div className="space-y-8 mb-8">
      {/* Welcome & Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                Welcome back, <span className="text-primary-600 dark:text-primary-400">{appUser.name}</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-widest opacity-80">
                Vault Management Protocol Active
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-4 py-1.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm ${
                appUser.plan === PlanType.PRO 
                  ? 'bg-purple-600 text-white' 
                  : appUser.plan === PlanType.STARTER 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}>
                {appUser.plan === PlanType.STARTER ? 'Plus' : appUser.plan} Plan
              </span>
              {timeLeft && (
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-2xl border border-gray-100 dark:border-white/5" title="Time remaining on plan">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" /> {timeLeft}
                </div>
              )}
              {googleTokens && (
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                  <GoogleDriveImg className="w-3.5 h-3.5" />
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Synced
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 relative z-10">
            {appUser.plan !== PlanType.PRO && (
              <Link
                to={`/pricing`}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-300 bg-[length:200%_auto] animate-shine border border-amber-300 text-amber-900 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                aria-label={`Upgrade to ${appUser.plan === PlanType.FREE ? 'Plus' : 'Pro'} plan`}
              >
                <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
                Upgrade to {appUser.plan === PlanType.FREE ? 'Plus' : 'Pro'}
              </Link>
            )}

            {needsDriveConnection ? (
              <button
                onClick={handleConnectGoogleDrive}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 active:scale-95"
                aria-label="Link Google Drive Workspace"
              >
                <GoogleDriveImg className="w-5 h-5" />
                Link Workspace
              </button>
            ) : (
              <>
                <button
                  onClick={openCreateModal}
                  disabled={isOverLimit}
                  className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all ${
                    isOverLimit 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                      : 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-lg shadow-primary-500/20'
                  }`}
                  aria-label={isOverLimit ? 'Vault limit reached' : 'Create new vault'}
                >
                  {isOverLimit ? <Lock className="w-4 h-4" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
                  {isOverLimit ? 'Vault Locked' : 'Create Vault'}
                </button>

                {!googleTokens && isPaidPlan && (
                  <button
                    onClick={handleConnectGoogleDrive}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95"
                    aria-label="Sync with Google Drive Cloud"
                  >
                    <GoogleDriveImg className="w-5 h-5" />
                    Sync Cloud
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mb-2">
            {isPaidPlan && googleTokens ? (
              <GoogleDriveImg className="w-5 h-5" />
            ) : (
              <HardDrive className={`w-5 h-5 ${isOverLimit ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`} aria-hidden="true" />
            )}
            {isPaidPlan && googleTokens ? 'Drive Storage' : 'Storage Usage'}
          </div>
          <div className="flex items-center h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="text-right">
              <div className={`text-2xl font-bold ${isOverLimit ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {formatBytes(storageUsedDisplay)}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">of {formatBytes(appUser.storageLimit)} used</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
            <ShieldCheck className="w-5 h-5 text-primary-500" />
            Invoice History
          </div>
          <span className="text-xs text-gray-400">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <Download className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No invoices yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Invoices will appear here after you purchase a plan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv, i) => (
              <div key={inv.id || i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-50 dark:bg-primary-900/30 p-2 rounded-lg">
                    <Download className="w-4 h-4 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{inv.plan} Plan</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{inv.id} • {inv.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">₹{inv.amount}</span>
                  <button
                    onClick={() => downloadInvoice(inv)}
                    className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all cursor-pointer"
                    aria-label="Download Invoice"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
