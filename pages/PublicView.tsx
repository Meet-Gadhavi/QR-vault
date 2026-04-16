import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { supabase } from '../services/supabaseClient';
import { Vault, FileType, VaultFile, AccessLevel, RequestStatus, PlanType } from '../types';
import { Download, ExternalLink, FileText, Image as ImageIcon, Box, Loader2, ShieldCheck, AlertCircle, Eye, Link as LinkIcon, Info, X, File, Lock, Send, Clock, Zap, RefreshCw, Sun, Moon, Search, Play, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import JSZip from 'jszip';
import { SubmissionPublicForm } from '../components/Submissions/SubmissionPublicForm';
import { VaultType } from '../types';
import { toast } from 'sonner';
import { PublicViewSkeleton } from '../components/SkeletonLoaders';



type Tab = 'ALL' | 'PHOTOS' | 'DOCS' | 'LINKS';

export const PublicView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const { theme, toggleTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  // Gatekeeper State
  const [viewerEmail, setViewerEmail] = useState<string>(() => localStorage.getItem('qrvault_viewer_email') || '');
  const [hasAccess, setHasAccess] = useState(false);
  const [requestStatus, setRequestStatus] = useState<RequestStatus | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Modals
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [previewPdf, setPreviewPdf] = useState<VaultFile | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VaultFile | null>(null);
  const [infoFile, setInfoFile] = useState<VaultFile | null>(null);

  // Download States
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{current: number, total: number} | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'PREPARING' | 'DOWNLOADING' | 'ZIPPING' | 'COMPLETE'>('PREPARING');
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const [isExpired, setIsExpired] = useState(false);
  const [expiredVaultName, setExpiredVaultName] = useState<string | null>(null);

  // Reporting State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReasonVirus, setReportReasonVirus] = useState(false);
  const [reportReasonContent, setReportReasonContent] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportFileIds, setReportFileIds] = useState<string[]>([]);
  const [isReporting, setIsReporting] = useState(false);

  // Destruct Warning
  const [warningFile, setWarningFile] = useState<VaultFile | null>(null);
  const [acknowledgedFiles, setAcknowledgedFiles] = useState<Set<string>>(new Set());

  const checkAccess = async (v: Vault) => {
    if (v.hasPassword) {
      const storedPassword = localStorage.getItem(`qrvault_pass_${v.id}`);
      if (storedPassword) {
        const isValid = await mockService.verifyVaultPassword(v.id, storedPassword);
        if (isValid) {
          setIsPasswordVerified(true);
        }
      }
    } else {
      setIsPasswordVerified(true);
    }

    if (!v.accessLevel || v.accessLevel === AccessLevel.PUBLIC) {
      setHasAccess(true);
      return;
    }

    const storedEmail = localStorage.getItem('qrvault_viewer_email');
    if (storedEmail) {
      setEmailInput(storedEmail);
      const req = (v.requests || []).find(r => r.email === storedEmail);

      if (req) {
        setRequestStatus(req.status);
        if (req.status === RequestStatus.APPROVED) {
          setHasAccess(true);
        }
      }
    }
  };

  const fetchVault = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setIsRefreshing(true);
    try {
      const v = await mockService.getVaultById(id);
      if (v) {
        setVault(v);
        await checkAccess(v);
      } else {
        // Check if it was recently deleted
        const { data: log } = await supabase
          .from('deleted_vault_logs')
          .select('vault_name')
          .eq('original_vault_id', id)
          .single();
        
        if (log) {
          setIsExpired(true);
          setExpiredVaultName(log.vault_name);
        }
      }
    } catch (err) {
      console.warn("Fetch failed or not found", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, [id]);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault) return;
    
    const isValid = await mockService.verifyVaultPassword(vault.id, passwordInput);
    if (isValid) {
      setIsPasswordVerified(true);
      setPasswordError(false);
      localStorage.setItem(`qrvault_pass_${vault.id}`, passwordInput);
    } else {
      setPasswordError(true);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !vault) return;

    setRequesting(true);
    localStorage.setItem('qrvault_viewer_email', emailInput);
    setViewerEmail(emailInput);

    try {
      await mockService.requestAccess(vault.id, emailInput);
      const v = await mockService.getVaultById(vault.id);
      if (v) {
        setVault(v);
        checkAccess(v);
        if (!hasAccess) setRequestStatus(RequestStatus.PENDING);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRequesting(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const getGoogleDriveDownloadUrl = (url: string) => {
    if (!url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/([^/|?]+)/) || url.match(/[?&]id=([^&]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    return null;
  };

  const handleSingleDownload = async (file: VaultFile, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (downloadingFileId) return;

    const gDriveUrl = getGoogleDriveDownloadUrl(file.url);
    if (gDriveUrl) {
      const a = document.createElement('a');
      a.href = gDriveUrl;
      a.target = "_blank";
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    setDownloadingFileId(file.id);
    try {
      // Increment download count for self-destruct logic
      await mockService.incrementFileDownload(file.id);
      
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error", err);
      toast.error("Could not download file. Please try again.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleBulkDownload = async () => {
    if (!vault || isDownloadingAll) return;
    setIsDownloadingAll(true);
    setDownloadStatus('PREPARING');
    setCurrentFileName(null);

    const downloadableFiles = vault.files.filter(f => f.type !== FileType.LINK);
    if (downloadableFiles.length === 0) {
      toast.error('No files to download.');
      setIsDownloadingAll(false);
      return;
    }

    setDownloadProgress({ current: 0, total: downloadableFiles.length });
    setDownloadStatus('DOWNLOADING');

    const zip = new JSZip();
    const folderName = vault.name.replace(/[^a-z0-9]/gi, '_') || 'vault';
    const skippedFiles: string[] = [];
    let successCount = 0;

    for (let i = 0; i < downloadableFiles.length; i++) {
      const file = downloadableFiles[i];
      setCurrentFileName(file.name);
      setDownloadProgress({ current: i + 1, total: downloadableFiles.length });

      try {
        let blob: Blob | null = null;

        // --- Strategy 1: Try the server proxy (handles CORS + GDrive auth) ---
        const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(file.url)}&filename=${encodeURIComponent(file.name)}`;
        try {
          const proxyRes = await fetch(proxyUrl);
          if (proxyRes.ok) {
            const ct = proxyRes.headers.get('content-type') || '';
            // Reject HTML responses (GDrive error pages, login walls)
            if (!ct.includes('text/html')) {
              blob = await proxyRes.blob();
              if (blob.size === 0) blob = null;
            }
          }
        } catch (_) { /* proxy failed, fall through */ }

        // --- Strategy 2: Direct fetch (works for public Supabase URLs) ---
        if (!blob) {
          try {
            const directRes = await fetch(file.url, { mode: 'cors' });
            if (directRes.ok) {
              blob = await directRes.blob();
              if (blob.size === 0) blob = null;
            }
          } catch (_) { /* direct fetch failed */ }
        }

        if (blob && blob.size > 0) {
          zip.file(file.name, blob);
          successCount++;
          mockService.incrementFileDownload(file.id).catch(console.error);
        } else {
          skippedFiles.push(file.name);
        }
      } catch (e: any) {
        console.error(`[Bulk] Failed: ${file.name}`, e);
        skippedFiles.push(file.name);
      }
    }

    if (successCount === 0) {
      toast.error('Could not download any files. They may be private or require authentication.');
      setIsDownloadingAll(false);
      setDownloadProgress(null);
      setCurrentFileName(null);
      return;
    }

    setDownloadStatus('ZIPPING');
    setCurrentFileName(folderName + '.zip');

    try {
      const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } });

      setDownloadStatus('COMPLETE');
      setCurrentFileName(null);

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (skippedFiles.length > 0) {
        setTimeout(() => toast.warning(`${skippedFiles.length} file(s) could not be included`, {
          description: skippedFiles.join(', ')
        }), 500);
      }

      setTimeout(() => {
        setIsDownloadingAll(false);
        setDownloadProgress(null);
      }, 1500);
    } catch (zipErr: any) {
      console.error('[Bulk] ZIP generation failed:', zipErr);
      toast.error('Failed to create ZIP. ' + zipErr.message);
      setIsDownloadingAll(false);
      setDownloadProgress(null);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault || isReporting) return;

    // Rate limiting: check cooldown in localStorage
    const lastReportTime = localStorage.getItem(`qrvault_report_cooldown_${vault.id}`);
    const COOLDOWN_MS = 60 * 1000; // 1 minute cooldown per vault
    if (lastReportTime && Date.now() - parseInt(lastReportTime) < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - parseInt(lastReportTime))) / 1000);
      toast.warning(`Rate Limited`, {
        description: `Please wait ${remaining} seconds before reporting again.`
      });
      return;
    }

    if (!reportReasonVirus && !reportReasonContent && !reportMessage.trim()) {
      toast.error("Please provide a reason or a message.");
      return;
    }

    setIsReporting(true);
    try {
      // Set report expiry to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: logError } = await supabase.from('reports').insert({
        vault_id: vault.id,
        file_ids: reportFileIds,                             // CHANGED: array of file IDs
        reason_virus: reportReasonVirus,
        reason_content: reportReasonContent,
        custom_message: reportMessage,
        expires_at: expiresAt.toISOString()
      });

      if (logError) throw logError;

      // Atomic increment via RPC (Issue 4)
      const { error: rpcError } = await (supabase as any).rpc('increment_report_count', { v_id: vault.id });
      if (rpcError) {
        // Fallback if RPC fails/not setup yet
        await supabase.from('vaults')
          .update({ report_count: (vault.reportCount || 0) + 1 })
          .eq('id', vault.id);
      }

      toast.success("Thank you for your report", {
        description: "Our system will review this vault."
      });
      localStorage.setItem(`qrvault_report_cooldown_${vault.id}`, Date.now().toString());
      setIsReportModalOpen(false);
      setReportReasonVirus(false);
      setReportReasonContent(false);
      setReportMessage('');
      setReportFileIds([]);
    } catch (err: any) {
      console.error("Report error:", err.message);
      toast.error("Failed to send report");
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) return <PublicViewSkeleton />;

  const isLocked = vault && vault.lockedUntil && new Date(vault.lockedUntil) > new Date();

  if (isLocked) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-100 max-w-md w-full">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vault Temporarily Locked</h1>
        <p className="text-gray-500 mb-6 font-medium">This vault has been blocked due to multiple community reports. Access will be restored once the review period ends.</p>
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 border border-red-100 font-bold uppercase tracking-tight">
          Locked until: {new Date(vault.lockedUntil!).toLocaleString()}
        </div>
        <Link to="/" className="text-primary-600 font-bold hover:underline">Back to Home</Link>
      </div>
    </div>
  );

  if (isExpired) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-gray-50 dark:bg-[#0a0a0a] relative overflow-x-hidden transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-3xl sm:rounded-[3rem] shadow-2xl border border-gray-100 dark:border-white/5 max-w-lg w-full relative z-10">
        <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Trash2 className="w-12 h-12 text-red-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 leading-tight">Vault Offline</h1>
        <p className="font-black text-primary-600 dark:text-primary-400 mb-6 uppercase tracking-widest text-xs italic bg-primary-50 dark:bg-primary-900/20 py-2 rounded-xl whitespace-nowrap overflow-hidden text-ellipsis px-4 mx-auto max-w-xs">&#8220;{expiredVaultName}&#8221;</p>
        <div className="bg-red-50 dark:bg-red-500/5 text-red-800 dark:text-red-400 p-6 rounded-[1.5rem] text-[13px] mb-8 border border-red-100 dark:border-red-900/20 leading-relaxed font-black uppercase tracking-widest">
          This vault is Blocked Due to certain reasons, please connect with owner of vault
        </div>
        <div className="space-y-4">
          <Link to="/" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-primary-500/20 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-[0.2em] active:scale-95">
            Create Your Own Vault
          </Link>
          <div className="pt-2">
             <Link to="/pricing" className="text-[10px] text-gray-400 dark:text-gray-500 font-bold hover:text-primary-600 uppercase tracking-widest transition-colors">Enterprise Data Protection Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (!vault) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-white/5 max-w-lg w-full">
        <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
          <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Vault Unavailable</h1>
        <div className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 p-6 rounded-[1.5rem] text-[13px] mb-8 border border-gray-100 dark:border-white/5 leading-relaxed font-black uppercase tracking-widest">
          This vault is Blocked Due to certain reasons, please connect with owner of vault
        </div>
        <Link to="/" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-primary-500/20 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-[0.2em] active:scale-95">
          Return to Hub
        </Link>
      </div>
    </div>
  );

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 relative overflow-x-hidden">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full relative z-10">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Restricted Access</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">This vault is protected by the owner. You need to request access to view the files.</p>
          {requestStatus === RequestStatus.PENDING ? (
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-6">
              <Clock className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white">Request Pending</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">We've sent your request to the owner. Please check back later.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 underline decoration-orange-200">Logged in as: {viewerEmail}</p>
            </div>
          ) : requestStatus === RequestStatus.REJECTED ? (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-6">
              <X className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white">Access Denied</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">The owner has denied your request to access this vault.</p>
            </div>
          ) : (
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label className="block text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 ml-1">Your Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium"
                  placeholder="name@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={requesting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-primary-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Request Access
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!isPasswordVerified && vault.password) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 relative overflow-x-hidden">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full relative z-10">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Protected</h1>
          <p className="text-gray-500 mb-8 font-medium">This vault requires a password to view its contents.</p>
          
          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <label className="block text-left text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Enter Vault Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium ${passwordError ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50 focus:bg-white'}`}
                placeholder="••••••••"
              />
              {passwordError && (
                <p className="text-left text-xs text-red-500 mt-2 font-bold flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3 h-3" /> Incorrect password. Please try again.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              Unlock Vault
            </button>
          </form>
          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> End-to-End Encrypted
          </div>
        </div>
      </div>
    );
  }

  const filterFiles = (tab: Tab) => {
    let files = vault.files;
    
    // First filter by tab
    switch (tab) {
      case 'PHOTOS': files = files.filter(f => f.type === FileType.IMAGE || f.type === FileType.VIDEO); break;
      case 'DOCS': files = files.filter(f => f.type === FileType.PDF || f.type === FileType.ZIP || f.type === FileType.OTHER); break;
      case 'LINKS': files = files.filter(f => f.type === FileType.LINK); break;
    }

    // Then filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      files = files.filter(f => f.name.toLowerCase().includes(term));
    }

    return files;
  };

  const currentFiles = filterFiles(activeTab);
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Files', count: vault.files.length },
    { id: 'PHOTOS', label: 'Media', count: vault.files.filter(f => f.type === FileType.IMAGE || f.type === FileType.VIDEO).length },
    { id: 'DOCS', label: 'Documents', count: vault.files.filter(f => f.type === FileType.PDF || f.type === FileType.ZIP || f.type === FileType.OTHER).length },
  ];

  const AdPlaceholder = () => (
    <div className="bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[240px] animate-pulse">
      <div className="bg-gray-100 dark:bg-white/10 p-3 rounded-xl mb-4 text-gray-400 dark:text-gray-500"><Zap className="w-8 h-8" /></div>
      <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Advertisement</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-[160px]">Support QR Vault by upgrading your plan today!</p>
    </div>
  );

  const handleOpenPreview = (file: VaultFile) => {
    // Record view for self-destruct timing
    if (file.deleteAfterMinutes) {
        mockService.recordFileView(file.id).catch(console.error);
    }

    // Show warning if destruct is active and not yet acknowledged
    if ((file.maxDownloads || file.deleteAfterMinutes || file.expiresAt) && !acknowledgedFiles.has(file.id)) {
        setWarningFile(file);
        return;
    }

    if (file.type === FileType.IMAGE) setPreviewFile(file);
    else if (file.type === FileType.PDF) setPreviewPdf(file);
    else if (file.type === FileType.VIDEO) setPreviewVideo(file);
    else handleSingleDownload(file, { stopPropagation: () => {} } as any);
  };

  const FileCardTimer: React.FC<{ file: VaultFile }> = ({ file }) => {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    useEffect(() => {
      if (!file.deleteAfterMinutes || !file.firstViewedAt) return;

      const timer = setInterval(() => {
        const now = new Date().getTime();
        const viewsAt = new Date(file.firstViewedAt!).getTime();
        const expiry = viewsAt + file.deleteAfterMinutes! * 60000;
        const distance = expiry - now;

        if (distance < 0) {
          setTimeLeft('EXPIRED');
          clearInterval(timer);
          
          // Trigger Google Drive deletion if applicable
          if (file.url.includes('drive.google.com') && typeof (mockService as any).deleteFileFromDrive === 'function') {
              (mockService as any).deleteFileFromDrive(file.url).catch(console.error);
          }

          // Refresh vault to hide expired file
          fetchVault();
          return;
        }

        const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }, 1000);

      return () => clearInterval(timer);
    }, [file]);

    if (!timeLeft) return null;

    return (
      <div className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse shadow-xl border border-white/20 z-10">
        <Clock className="w-2.5 h-2.5" />
        Vanish: {timeLeft}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#050505] flex flex-col relative overflow-x-hidden transition-colors duration-500">

      {/* Dynamic Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="bg-white/40 dark:bg-[#0a0a0a]/40 backdrop-blur-2xl sticky top-0 z-10 border-b border-white/20 dark:border-white/5 shadow-sm transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                {vault.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 rounded-full mt-1 w-fit uppercase tracking-widest transition-all">
                <ShieldCheck className="w-3 h-3" /> SECURE LINK
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="group/theme flex items-center bg-gray-100/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2.5 rounded-xl transition-all active:scale-95 border border-white/20 dark:border-white/5 shadow-sm overflow-hidden"
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 flex-shrink-0" aria-hidden="true" /> : <Moon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />}
                <span className="max-w-0 opacity-0 group-hover/theme:max-w-[4rem] group-hover/theme:opacity-100 group-hover/theme:ml-2 transition-all duration-300 pointer-events-none text-xs font-black uppercase tracking-widest whitespace-nowrap">
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </span>
              </button>
              
              {/* Refresh Button */}
              <button
                onClick={fetchVault}
                disabled={isRefreshing}
                className="group/refresh flex items-center bg-gray-100/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2.5 rounded-xl transition-all active:scale-95 border border-white/20 dark:border-white/5 shadow-sm disabled:opacity-50 overflow-hidden"
                aria-label="Refresh vault content"
                title="Refresh Vault Content"
              >
                <RefreshCw className={`w-5 h-5 flex-shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span className="max-w-0 opacity-0 group-hover/refresh:max-w-[4rem] group-hover/refresh:opacity-100 group-hover/refresh:ml-2 transition-all duration-300 pointer-events-none text-xs font-black uppercase tracking-widest whitespace-nowrap">
                  Refresh
                </span>
              </button>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="group/report flex items-center bg-red-50 dark:bg-red-500/10 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm border border-red-100 dark:border-red-500/20 overflow-hidden"
                aria-label="Report this vault"
                title="Report Vault"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="max-w-0 opacity-0 group-hover/report:max-w-[4rem] group-hover/report:opacity-100 group-hover/report:ml-2 transition-all duration-300 pointer-events-none text-xs font-black uppercase tracking-widest whitespace-nowrap">
                  Report
                </span>
              </button>

              {vault.files.some(f => f.type !== FileType.LINK) && (
                <button
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black shadow-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 border border-transparent"
                  onClick={handleBulkDownload}
                  disabled={isDownloadingAll}
                  aria-label="Download all files as ZIP"
                >
                  {isDownloadingAll ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Download className="w-4 h-4" aria-hidden="true" />}
                  <span className="hidden sm:inline">
                    {isDownloadingAll 
                      ? (downloadProgress 
                          ? `Downloading ${downloadProgress.current}/${downloadProgress.total}...` 
                          : 'Finalizing ZIP...') 
                      : 'Download All'}
                  </span>
                  <span className="sm:hidden font-black">ZIP ALL</span>
                </button>
              )}

            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex space-x-1 overflow-x-auto no-scrollbar py-1 flex-grow">
              {tabs.map(tab => (
                (tab.count > 0 || tab.id === 'ALL') && (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border
                      ${activeTab === tab.id
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10 dark:shadow-none border-primary-500'
                        : 'bg-white/50 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 border-gray-100 dark:border-gray-800'
                      }
                    `}
                  >
                    {tab.label} <span className={`ml-1 font-bold ${activeTab === tab.id ? 'opacity-60' : 'opacity-40'}`}>[{tab.count}]</span>
                  </button>
                )
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors w-4 h-4" />
              <input
                type="text"
                placeholder="Search files..."
                aria-label="Search files"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-transparent hover:bg-white dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/10 focus:bg-white dark:focus:bg-white/10 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl text-xs font-medium dark:text-white outline-none transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {currentFiles.length === 0 ? (
          <div className="text-center py-32 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
            <Box className="text-gray-200 w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No files found</h3>
            <p className="text-gray-500 text-sm">There are no files in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-[1]">
            {currentFiles.map(file => (
              <div key={file.id} className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white dark:border-white/5 shadow-xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all group border-b-4 border-b-gray-100/50 dark:border-b-white/5 relative">
                <FileCardTimer file={file} />
                <div
                  className="aspect-video bg-gray-100/50 dark:bg-white/5 relative flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => handleOpenPreview(file)}
                >
                  {file.type === FileType.IMAGE ? (
                    <>
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          <Eye className="text-white w-8 h-8 drop-shadow-lg" />
                        </div>
                      </div>
                    </>
                  ) : file.type === FileType.VIDEO ? (
                    <div className="flex flex-col items-center gap-3">
                       <div className="relative group/vid p-6 bg-primary-100/50 dark:bg-primary-900/30 rounded-3xl transition-all group-hover:scale-110 shadow-lg shadow-primary-500/10">
                          <Play className="w-10 h-10 text-primary-600 dark:text-primary-400 fill-current" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] leading-none mb-1">Secure Stream</span>
                          <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">End-to-End Encrypted</span>
                       </div>
                    </div>
                  ) : file.type === FileType.PDF ? (
                    <div className="flex flex-col items-center gap-3">
                       <FileText className="w-16 h-16 text-red-500 transform group-hover:-translate-y-2 transition-transform" />
                       <div className="bg-white/50 dark:bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-[10px] font-bold dark:text-gray-300">PREVIEW PDF</div>
                    </div>
                  ) : file.type === FileType.LINK ? (
                    <LinkIcon className="w-16 h-16 text-primary-500 transform group-hover:rotate-12 transition-transform" />
                  ) : (
                    <Box className="w-16 h-16 text-gray-300" />
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <h3 className="font-extrabold text-gray-900 dark:text-white truncate flex-1 text-sm">{file.name}</h3>
                    {file.type !== FileType.LINK && <span className="text-[10px] font-black text-gray-400 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-2 py-0.5 rounded uppercase">{formatBytes(file.size)}</span>}
                  </div>

                  {file.type === FileType.LINK ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-4 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-all active:scale-95"
                    >
                      VISIT LINK <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleOpenPreview(file)}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                        aria-label={file.type === FileType.IMAGE || file.type === FileType.VIDEO || file.type === FileType.PDF ? `Preview ${file.name}` : `Download ${file.name}`}
                      >
                        {file.type === FileType.IMAGE || file.type === FileType.VIDEO || file.type === FileType.PDF ? 'PREVIEW' : 'DOWNLOAD'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setInfoFile(file); }}
                        className="px-5 py-4 bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-all active:scale-95 flex items-center justify-center border border-gray-100 dark:border-white/5"
                        aria-label={`View details for ${file.name}`}
                        title="File Details"
                      >
                        <Info className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(vault.userPlan === PlanType.FREE || vault.userPlan === PlanType.STARTER) && (
              <>
                <AdPlaceholder key="ad-1" />
                {currentFiles.length > 2 && <AdPlaceholder key="ad-2" />}
              </>
            )}
          </div>
        )}
      </div>

      <div className="py-8 text-center border-t border-gray-100 mt-auto bg-gray-50/30">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Securely shared via <span className="text-primary-600">QR Vault</span></p>
      </div>

      {isReportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsReportModalOpen(false)}>
          <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] w-full max-w-4xl p-10 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh] border border-gray-100 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl text-red-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">Report Violation</h3>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Community Moderation System</p>
                </div>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-400" aria-label="Close report modal"><X className="w-6 h-6" aria-hidden="true" /></button>
            </div>

            <form onSubmit={handleReportSubmit} className="flex-1 flex flex-col md:flex-row gap-10 overflow-hidden">
              {/* Left Column: Reasons & Files */}
              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pr-2 no-scrollbar">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 ml-1">Select Reason(s)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <label className="flex items-center gap-4 p-4 border-2 border-gray-50 dark:border-white/5 rounded-2xl hover:border-red-100 dark:hover:border-red-500/30 hover:bg-red-50/20 transition-all cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-red-600 rounded-lg border-gray-200 dark:border-gray-700 focus:ring-red-500 bg-transparent" checked={reportReasonVirus} onChange={(e) => setReportReasonVirus(e.target.checked)} />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Malware</span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Dangerous files</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 border-2 border-gray-50 dark:border-white/5 rounded-2xl hover:border-red-100 dark:hover:border-red-500/30 hover:bg-red-50/20 transition-all cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-red-600 rounded-lg border-gray-200 dark:border-gray-700 focus:ring-red-500 bg-transparent" checked={reportReasonContent} onChange={(e) => setReportReasonContent(e.target.checked)} />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Illegal</span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Policy violations</span>
                    </div>
                  </label>
                </div>

                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 ml-1">Affected Files</p>
                <div className="flex-1 max-h-[300px] overflow-y-auto space-y-2 pr-2 no-scrollbar border-y-2 border-gray-50/50 dark:border-white/5 py-4">
                  {vault.files.map(file => {
                    const isChecked = reportFileIds.includes(file.id);
                    return (
                      <label key={file.id} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${isChecked ? 'border-red-500 bg-red-50/30 dark:bg-red-900/20' : 'border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10'}`}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-red-600 rounded border-gray-300 dark:border-gray-600 bg-transparent" 
                          checked={isChecked} 
                          onChange={(e) => {
                            if (e.target.checked) setReportFileIds([...reportFileIds, file.id]);
                            else setReportFileIds(reportFileIds.filter(id => id !== file.id));
                          }} 
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{file.name}</span>
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-tight">{file.type}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Custom Message & Submission */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex-1 flex flex-col mb-6">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 ml-1">Additional Details</p>
                  <textarea 
                    className="flex-1 w-full p-6 bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-[2rem] focus:bg-white dark:focus:bg-gray-900 focus:border-red-200 dark:focus:border-red-900/50 transition-all outline-none text-sm font-medium resize-none dark:text-white" 
                    placeholder="Provide more information about the violation..." 
                    value={reportMessage} 
                    onChange={(e) => setReportMessage(e.target.value)} 
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-gray-400 font-medium px-2 leading-relaxed">
                    Reports are private and help us maintain a safe community. Repeated false reports may lead to your IP being restricted.
                  </p>
                  <button type="submit" disabled={isReporting} className="w-full py-5 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-[1.5rem] shadow-xl shadow-red-100 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest">
                    {isReporting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Report'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/90 backdrop-blur-3xl p-6 animate-in fade-in" onClick={() => setPreviewFile(null)} role="dialog" aria-modal="true">
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2" onClick={() => setPreviewFile(null)} aria-label="Close preview"><X className="w-10 h-10" aria-hidden="true" /></button>
          <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border border-white/10 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/90 backdrop-blur-3xl p-6 animate-in fade-in" onClick={() => setPreviewVideo(null)}>
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2" onClick={() => setPreviewVideo(null)}><X className="w-10 h-10" /></button>
          <div className="w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <video 
              src={previewVideo.url} 
              className="w-full h-full" 
              controls 
              autoPlay 
              playsInline 
            />
          </div>
        </div>
      )}

      {previewPdf && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 dark:bg-black/90 backdrop-blur-3xl p-4 md:p-8 animate-in fade-in" onClick={() => setPreviewPdf(null)}>
          <div className="w-full max-w-5xl h-full flex flex-col bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 relative" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-8 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-red-500" />
                <h3 className="font-black text-gray-900 dark:text-white tracking-tight">{previewPdf.name}</h3>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => handleSingleDownload(previewPdf!, { stopPropagation: () => {} } as any)} className="bg-primary-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-lg shadow-primary-100 transition-all flex items-center gap-2">
                    <Download className="w-3 h-3" /> Download
                 </button>
                 <button onClick={() => setPreviewPdf(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"><X className="w-6 h-6 dark:text-gray-400" /></button>
              </div>
            </div>
            <iframe 
              src={`${previewPdf.url}#toolbar=0&navpanes=0&scrollbar=0`} 
              className="flex-1 w-full border-none"
              title="PDF Preview"
            />
          </div>
        </div>
      )}

      {infoFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setInfoFile(null)}>
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Asset Info</h3>
              <button onClick={() => setInfoFile(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-900 mb-4 shadow-inner">
                {infoFile.type === FileType.IMAGE ? <ImageIcon className="w-10 h-10" /> : infoFile.type === FileType.PDF ? <FileText className="w-10 h-10" /> : infoFile.type === FileType.LINK ? <LinkIcon className="w-10 h-10" /> : <File className="w-10 h-10" />}
              </div>
              <p className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight mb-1">{infoFile.name}</p>
              <p className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase tracking-widest">{infoFile.type}</p>
            </div>
            <div className="space-y-4 bg-gray-50/50 p-6 rounded-[1.5rem] border border-gray-100 mb-8">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider"><span className="text-gray-400">Total Size</span><span className="text-gray-900">{formatBytes(infoFile.size)}</span></div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider"><span className="text-gray-400">Format</span><span className="text-gray-900 truncate max-w-[120px]">{infoFile.mimeType}</span></div>
            </div>
            {infoFile.type !== FileType.LINK ? (
              <button onClick={(e) => { handleSingleDownload(infoFile!, e); setInfoFile(null); }} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download</button>
            ) : (
              <a href={infoFile.url} target="_blank" rel="noreferrer" className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-100 hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" /> Open Link</a>
            )}
          </div>
        </div>
      )}
      {/* Download Manager Modal */}
      {isDownloadingAll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-black w-full max-w-2xl mx-4 rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-primary-600 dark:bg-primary-700 px-6 py-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {downloadStatus === 'COMPLETE' ? (
                  <ShieldCheck className="w-5 h-5 text-white" />
                ) : (
                  <Download className="w-5 h-5 text-white animate-bounce" />
                )}
              </div>
              <div>
                <h2 className="text-white font-black text-lg tracking-tight">
                  {downloadStatus === 'PREPARING' && 'Preparing Archive'}
                  {downloadStatus === 'DOWNLOADING' && 'Downloading Files'}
                  {downloadStatus === 'ZIPPING' && 'Creating ZIP'}
                  {downloadStatus === 'COMPLETE' && 'Download Ready!'}
                </h2>
                <p className="text-white/70 text-xs font-medium">
                  {downloadProgress ? `${downloadProgress.current} of ${downloadProgress.total} files` : 'Starting...'}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">

              {/* Current File Being Processed */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 border border-gray-100 dark:border-white/10">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                  {downloadStatus === 'DOWNLOADING' ? 'Currently Downloading' : downloadStatus === 'ZIPPING' ? 'Compressing' : downloadStatus === 'COMPLETE' ? 'Completed' : 'Initialising'}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {downloadStatus === 'PREPARING' && 'Scanning vault files...'}
                  {downloadStatus === 'DOWNLOADING' && (currentFileName || 'Fetching...')}
                  {downloadStatus === 'ZIPPING' && vault?.name + '.zip'}
                  {downloadStatus === 'COMPLETE' && '✓ All files packaged'}
                </p>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {downloadStatus === 'COMPLETE' ? 'Done' : 'Progress'}
                  </span>
                  <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                    {downloadStatus === 'PREPARING' && '5%'}
                    {downloadStatus === 'DOWNLOADING' && `${Math.round(((downloadProgress?.current || 0) / (downloadProgress?.total || 1)) * 90)}%`}
                    {downloadStatus === 'ZIPPING' && '95%'}
                    {downloadStatus === 'COMPLETE' && '100%'}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 dark:bg-primary-500 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: downloadStatus === 'PREPARING' ? '5%' :
                             downloadStatus === 'DOWNLOADING' ? `${Math.round(((downloadProgress?.current || 0) / (downloadProgress?.total || 1)) * 90)}%` :
                             downloadStatus === 'ZIPPING' ? '95%' : '100%'
                    }}
                  />
                </div>
              </div>

              {/* File List */}
              {downloadProgress && vault && (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {vault.files.filter(f => f.type !== FileType.LINK).map((file, idx) => {
                    const done = idx < (downloadProgress.current);
                    const active = idx === (downloadProgress.current - 1) && downloadStatus === 'DOWNLOADING';
                    return (
                      <div key={file.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                        done ? 'text-gray-400 dark:text-gray-600' :
                        active ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-bold' :
                        'text-gray-300 dark:text-gray-700'
                      }`}>
                        <span className="flex-shrink-0">
                          {done ? '✓' : active ? '⟳' : '○'}
                        </span>
                        <span className="truncate">{file.name}</span>
                        {active && <span className="ml-auto text-[10px] font-black text-primary-500 animate-pulse">NOW</span>}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Auto-Destruct Warning Modal */}
      {warningFile && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/95 backdrop-blur-xl z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0f1115] rounded-[2.5rem] w-full max-w-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-500 border border-white/20 dark:border-white/5 overflow-hidden relative flex flex-col md:flex-row">
            
            {/* Left Brand Strip (Visible on Desktop) */}
            <div className="hidden md:flex w-1/3 bg-primary-600 p-12 flex-col justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-400/20 rounded-full -ml-12 -mb-12 blur-xl"></div>
               
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                    <ShieldCheck className="w-6 h-6 text-white" />
                 </div>
                 <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">
                    Secure<br/>Destruction<br/>Activated
                 </h2>
               </div>
               
               <div className="relative z-10">
                  <p className="text-primary-100/80 text-[10px] font-black uppercase tracking-[0.2em]">QR Vault Security</p>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 md:p-12 relative">
               <button 
                 onClick={() => setWarningFile(null)}
                 className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
               >
                 <X className="w-5 h-5" />
               </button>

               <div className="flex items-center gap-3 mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Safety Protocol Alert</span>
               </div>

               <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 leading-none">
                  THIS FILE WILL <span className="text-primary-600">EVAPORATE</span>
               </h3>

               <div className="space-y-4 mb-10">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    You are accessing a self-destructing resource. Once the conditions below are met, this link will permanently expire and the file will be wiped from our secure chain.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Trigger 01</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                           {warningFile.maxDownloads ? `${warningFile.maxDownloads} Downloads` : 'Unlimited'}
                        </p>
                     </div>
                     <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Trigger 02</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                           {warningFile.deleteAfterMinutes ? `${warningFile.deleteAfterMinutes} Minutes` : 'No Timer'}
                        </p>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setAcknowledgedFiles(prev => {
                        const next = new Set(Array.from(prev));
                        next.add(warningFile.id);
                        return next;
                      });
                      const fileToPreview = warningFile;
                      setWarningFile(null);
                      if (fileToPreview.type === FileType.IMAGE) setPreviewFile(fileToPreview);
                      else if (fileToPreview.type === FileType.PDF) setPreviewPdf(fileToPreview);
                      else if (fileToPreview.type === FileType.VIDEO) setPreviewVideo(fileToPreview);
                      else handleSingleDownload(fileToPreview, { stopPropagation: () => {} } as any);
                    }}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary-500/20 dark:shadow-none transition-all active:scale-[0.98] uppercase text-xs tracking-widest flex items-center justify-center gap-2 group"
                  >
                    Enter Vault Access <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-bold uppercase tracking-tight">
                    By proceeding, you acknowledge the temporary nature of this link.
                  </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};