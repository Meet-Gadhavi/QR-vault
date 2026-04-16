import React from 'react';
import { 
  TrendingUp, Zap, Box, Eye, QrCode, AlertTriangle 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Vault } from '../../types';

interface AnalyticsPanelProps {
  vaults: Vault[];
  openCreateModal: () => void;
  setSelectedAnalyticsVault: (vault: Vault) => void;
  formatBytes: (bytes: number) => string;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  vaults,
  openCreateModal,
  setSelectedAnalyticsVault,
  formatBytes
}) => {
  if (vaults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#0a0a0b] border border-gray-100 dark:border-white/5 rounded-[3rem] shadow-xl animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6" aria-hidden="true">
          <TrendingUp className="w-10 h-10 text-gray-300 dark:text-gray-700" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">No Data to showcase !</h2>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-2">Create your first vault to unlock global intelligence</p>
        <button 
          onClick={openCreateModal}
          className="mt-8 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-500/20 active:scale-95"
          aria-label="Create your first vault"
        >
          Launch First Vault
        </button>
      </div>
    );
  }

  const globalStats = [
    { label: 'Network Reach', val: vaults.reduce((a, b) => a + b.views, 0), icon: Eye, unit: 'Views', color: 'primary' },
    { label: 'Scan Volume', val: vaults.reduce((a, b) => a + (b.analytics?.totalScans || 0), 0), icon: QrCode, unit: 'Scans', color: 'emerald' },
    { label: 'Data Protected', val: formatBytes(vaults.reduce((a, b) => a + b.files.reduce((fa, fb) => fa + fb.size, 0), 0)), icon: Box, unit: 'Storage', color: 'blue' },
    { label: 'Active Reports', val: vaults.reduce((a, b) => a + (b.reportCount || 0), 0), icon: AlertTriangle, unit: 'Flags', color: 'red' }
  ];

  const topVaults = [...vaults].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Overview Stat */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0d0f14] p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-black/[0.02]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic">Vault Ecosystem Performance</h2>
              <p className="text-xs font-black text-primary-500 uppercase tracking-[0.3em] mt-1">Global Engagement Matrix</p>
            </div>
            <div className="hidden md:flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/5">
              {vaults.slice(0, 3).map((v, i) => (
                <div key={v.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary-500' : i === 1 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-[9px] font-bold text-gray-500 uppercase truncate max-w-[60px]">{v.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(() => {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                return days.map(day => {
                  const entry: any = { day };
                  vaults.forEach((v, idx) => {
                    if (idx < 5) entry[v.name] = Math.floor(Math.random() * (v.views + 1) * 0.8) + (v.views / 7);
                  });
                  return entry;
                });
              })()}>
                <defs>
                  {vaults.slice(0, 5).map((v, i) => (
                    <linearGradient key={v.id} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={i === 0 ? '#8b5cf6' : i === 1 ? '#10b981' : i === 2 ? '#f59e0b' : i === 3 ? '#3b82f6' : '#ec4899'} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={i === 0 ? '#8b5cf6' : i === 1 ? '#10b981' : i === 2 ? '#f59e0b' : i === 3 ? '#3b82f6' : '#ec4899'} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                  labelStyle={{ color: '#888', marginBottom: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 900, padding: '2px 0' }}
                />
                {vaults.slice(0, 5).map((v, i) => (
                  <Area
                    key={v.id}
                    type="monotone"
                    dataKey={v.name}
                    stroke={i === 0 ? '#8b5cf6' : i === 1 ? '#10b981' : i === 2 ? '#f59e0b' : i === 3 ? '#3b82f6' : '#ec4899'}
                    strokeWidth={4}
                    fillOpacity={1}
                    fill={`url(#color${i})`}
                    animationDuration={1500 + (i * 300)}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white dark:bg-[#0d0f14] p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden relative group">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-500/20" aria-hidden="true">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Hall of Fame</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Highest Scan Assets</p>
            </div>
          </div>

          <div className="space-y-6">
            {topVaults.map((v, idx) => (
              <div key={v.id} className="flex items-center justify-between group/v">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-gray-200 dark:text-white/10 italic w-6">#{idx + 1}</span>
                  <div>
                    <div className="text-sm font-black text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{v.name}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{v.files.length} Security Objects</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-primary-600 tabular-nums">{v.views}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">TOTAL SCANS</div>
                </div>
              </div>
            ))}
          </div>

          <button 
            className="w-full mt-10 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-primary-500 hover:text-white transition-all shadow-sm"
            aria-label="Expand Full Report"
          >
            Expand Full Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {globalStats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#0d0f14] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 hover:shadow-2xl transition-all group shadow-sm">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
              stat.color === 'primary' ? 'bg-primary-500' : 
              stat.color === 'emerald' ? 'bg-emerald-500' : 
              stat.color === 'blue' ? 'bg-blue-500' : 'bg-red-500'
            } text-white shadow-xl ${
              stat.color === 'primary' ? 'shadow-primary-500/20' : 
              stat.color === 'emerald' ? 'shadow-emerald-500/20' : 
              stat.color === 'blue' ? 'shadow-blue-500/20' : 'shadow-red-500/20'
            }`}>
              <stat.icon className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-gray-900 dark:text-white italic">{stat.val}</div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
