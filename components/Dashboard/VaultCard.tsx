import React from 'react';
import { Link } from 'react-router-dom';
import { 
  QrCode, Eye, Clock, Shield, Users, TrendingUp, ArrowUp, 
  Shuffle, ExternalLink, Settings2, Edit2, ChevronRight, 
  AlertTriangle, Inbox, Trash2, FileText 
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Vault, PlanType, VaultType, RequestStatus, AccessLevel } from '../../types';
import { VaultTimer } from './VaultTimer';

interface VaultCardProps {
  vault: Vault;
  menuOpenId: string | null;
  toggleMenu: (e: React.MouseEvent, id: string) => void;
  isOverLimit: boolean;
  openEditModal: (vault: Vault, e: React.MouseEvent) => void;
  openManageAccess: (vault: Vault, e: React.MouseEvent) => void;
  handleDeleteVault: (id: string, e: React.MouseEvent) => void;
  setViewQrVault: (vault: Vault) => void;
  setReportVault: (vault: Vault) => void;
  setSubmittingVault: (vault: Vault) => void;
  setSelectedAnalyticsVault: (vault: Vault) => void;
  formatBytes: (bytes: number) => string;
}

const generateTrendData = (vaultId: string, level: 'high' | 'medium' | 'low') => {
  const seed = vaultId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const data = [];
  const baseValue = level === 'high' ? 60 : level === 'medium' ? 35 : 15;
  for (let i = 0; i < 10; i++) {
    const variance = Math.sin(seed + i * 0.8) * 25;
    data.push({ value: Math.max(5, baseValue + variance + (i * 2)) });
  }
  return data;
};

export const VaultCard: React.FC<VaultCardProps> = ({
  vault,
  menuOpenId,
  toggleMenu,
  isOverLimit,
  openEditModal,
  openManageAccess,
  handleDeleteVault,
  setViewQrVault,
  setReportVault,
  setSubmittingVault,
  setSelectedAnalyticsVault,
  formatBytes
}) => {
  const getPendingRequestCount = (v: Vault) => {
    return (v.requests || []).filter(r => r.status === RequestStatus.PENDING).length;
  };

  return (
    <div className="relative z-10 w-full min-h-[460px] md:min-h-[500px] perspective-[1000px]">
      <div
        onClick={(e) => toggleMenu(e, vault.id)}
        className={`cursor-pointer relative w-full h-full min-h-[460px] md:min-h-[500px] flex flex-col rounded-2xl border-2 transition-all duration-700 shadow-sm hover:shadow-xl transform-gpu ${
          vault.reportCount && vault.reportCount > 0 
            ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' 
            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
        }`}
        style={{ 
          transformStyle: 'preserve-3d', 
          transform: menuOpenId === vault.id ? 'rotateY(180deg)' : 'rotateY(0deg)' 
        }}
      >
        {/* FRONT FACE */}
        <div className="flex-1 flex flex-col w-full h-full rounded-xl overflow-hidden relative" style={{ backfaceVisibility: 'hidden' }}>
          <div className="p-5 flex-1 flex flex-col">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-2">
                <div className="bg-primary-50 dark:bg-primary-900/30 p-2 rounded-lg">
                  <QrCode className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                {getPendingRequestCount(vault) > 0 && (
                  <button
                    onClick={(e) => openManageAccess(vault, e)}
                    className="bg-red-100 text-red-600 px-2 rounded-lg text-xs font-bold flex items-center animate-pulse"
                    title="Pending Access Requests"
                  >
                    {getPendingRequestCount(vault)} Requests
                  </button>
                )}
              </div>

              <div className="relative">
                  <button
                  onClick={(e) => toggleMenu(e, vault.id)}
                  className={`p-2 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    menuOpenId === vault.id 
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                  aria-label={menuOpenId === vault.id ? "Show front of card" : "Show back of card"}
                  title={menuOpenId === vault.id ? "Flip to details" : "Flip to management"}
                >
                  <Shuffle className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-gray-900 dark:text-white truncate pr-8">{vault.name}</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(vault.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="text-gray-200">|</span>
                <div className="flex items-center gap-1.5 text-primary-600 font-bold whitespace-nowrap">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{vault.views}/{vault.maxViews || (vault.userPlan === PlanType.FREE ? 85 : 500)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {vault.accessLevel === AccessLevel.RESTRICTED ? (
                  <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded text-xs font-black uppercase tracking-tight">
                    <Shield className="w-3 h-3" /> Restricted
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-black uppercase tracking-tight">
                    <Users className="w-3 h-3" /> Public
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400 font-bold flex items-center gap-2">
              <span>{vault.files.length} objects</span>
              <span className="opacity-30">•</span>
              <span>{formatBytes(vault.files.reduce((acc, f) => acc + f.size, 0))} Protected</span>
              <span className="opacity-30">•</span>
              <span className="flex items-center gap-1 text-primary-500/80"><Eye className="w-3 h-3" /> {vault.views}</span>
            </div>

            {/* Engagement Indicator Box - Compact Dynamic Graph */}
            <div className={`w-full mt-4 rounded-[1.5rem] border relative transition-all duration-500 group/engage hover:scale-[1.01] shadow-sm overflow-hidden ${
              vault.views > 80
                ? 'bg-emerald-500/[0.02] border-emerald-500/10 text-emerald-500'
                : vault.views > 30
                  ? 'bg-primary-500/[0.02] border-primary-500/10 text-primary-500'
                  : 'bg-red-500/[0.02] border-red-500/10 text-red-500'
            }`} style={{ minHeight: '9rem' }}>
              { /* Action Arrow - Inclined only, no background square */}
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedAnalyticsVault(vault); }}
                className="absolute top-3 right-3 z-20 group/arrow cursor-pointer transition-all active:scale-90"
                aria-label="View Detailed Analytics"
                title="View Detailed Analytics"
              >
                <ArrowUp className="w-5 h-5 rotate-45 text-primary-500/60 group-hover/arrow:text-primary-500 group-hover/arrow:scale-125 transition-all drop-shadow-sm" aria-hidden="true" />
              </button>

              {vault.views === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-gray-200 dark:text-gray-800 mb-2 opacity-50" />
                  <span className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest italic px-8 text-center leading-relaxed">
                    NO Data to showcase !
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full opacity-30 dark:opacity-50 -mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateTrendData(vault.id, vault.views > 80 ? 'high' : vault.views > 30 ? 'medium' : 'low')}>
                      <defs>
                        <linearGradient id={`grad-${vault.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="currentColor"
                        strokeWidth={3}
                        fill={`url(#grad-${vault.id})`}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-800 flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setViewQrVault(vault); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all border border-primary-100 dark:border-primary-800 cursor-pointer"
                  aria-label="View QR Code"
                >
                  <QrCode className="w-4 h-4" aria-hidden="true" /> View QR
                </button>
                <Link
                  to={`/v/${vault.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center cursor-pointer gap-2 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-md active:scale-95"
                  aria-label={`Open vault ${vault.name}`}
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" /> Open
                </Link>
              </div>
            </div>
          </div>
          <VaultTimer
            createdAt={vault.createdAt}
            expiresAt={vault.expiresAt}
            views={vault.views}
            maxViews={vault.maxViews}
            lockedUntil={vault.lockedUntil}
          />
        </div>

        {/* BACK FACE */}
        <div 
          className="absolute inset-0 w-full h-full bg-white dark:bg-[#0a0a0b] border-2 border-primary-500/20 dark:border-primary-500/10 rounded-2xl flex flex-col justify-start items-center text-gray-900 dark:text-white p-5 md:p-8 shadow-2xl overflow-hidden" 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none"></div>

          <button 
            onClick={(e) => toggleMenu(e, vault.id)} 
            className="absolute top-5 right-5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md cursor-pointer text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 p-2.5 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
            aria-label="Flip back to front"
          >
            <Shuffle className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="w-full mb-8 text-center px-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400 shadow-inner">
              <Settings2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white truncate uppercase">{vault.name}</h3>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mt-1">Management Console</p>
          </div>

          <div className="w-full space-y-3 relative z-10">
            <button 
              disabled={isOverLimit} 
              onClick={(e) => openEditModal(vault, e)} 
              className={`group w-full py-4 px-6 rounded-2xl text-xs uppercase tracking-widest cursor-pointer font-black flex items-center justify-between transition-all shadow-lg active:scale-95 ${
                isOverLimit 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:shadow-primary-500/10'
              }`}
            >
              <span className="flex items-center gap-3"><Edit2 className="w-4 h-4" /> Edit Vault</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>

            <button 
              onClick={(e) => openManageAccess(vault, e)} 
              className="group w-full bg-white dark:bg-gray-900 border cursor-pointer border-gray-200 dark:border-gray-800 hover:border-primary-500/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 active:scale-95 text-gray-700 dark:text-gray-300 py-4 px-6 rounded-2xl text-xs uppercase tracking-widest font-black flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-3"><Users className="w-4 h-4" /> Security & Access</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); setReportVault(vault); toggleMenu(e, vault.id); }} 
              className="group w-full bg-white dark:bg-gray-900 border cursor-pointer border-gray-200 dark:border-gray-800 hover:border-red-500/50 hover:bg-red-50/30 dark:hover:bg-red-900/10 active:scale-95 text-gray-700 dark:text-gray-300 py-4 px-6 rounded-2xl text-xs uppercase tracking-widest font-black flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-3 flex-1 text-left">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Activity Intelligence 
                {(vault.reportCount || 0) > 0 && (
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] ml-2 animate-pulse">{vault.reportCount}</span>
                )}
              </span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>

            {vault.vaultType === VaultType.RECEIVING && (
               <button 
                onClick={(e) => { e.stopPropagation(); setSubmittingVault(vault); toggleMenu(e, vault.id); }} 
                className="group w-full bg-primary-600 text-white border-none cursor-pointer hover:bg-primary-700 active:scale-95 py-4 px-6 rounded-2xl text-xs uppercase tracking-widest font-black flex items-center justify-between transition-all shadow-lg shadow-primary-500/20"
              >
                 <span className="flex items-center gap-3"><Inbox className="w-4 h-4" /> Manage Submissions</span>
                 <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
               </button>
            )}

            <div className="pt-2">
              <button 
                onClick={(e) => handleDeleteVault(vault.id, e)} 
                className="w-full bg-red-600 hover:bg-red-700 text-white cursor-pointer py-4 px-6 rounded-2xl text-xs uppercase tracking-widest font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/20 dark:shadow-none active:scale-95"
              >
                <Trash2 className="w-4 h-4" /> Self Destruct Protocol
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
