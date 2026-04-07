import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { supabase } from '../services/supabaseClient';
import { Vault, FileType, VaultFile, AccessLevel, RequestStatus, PlanType } from '../types';
import { Download, ExternalLink, FileText, Image as ImageIcon, Box, Loader2, ShieldCheck, AlertCircle, Eye, Link as LinkIcon, Info, X, File, Lock, Send, Clock, Zap } from 'lucide-react';
import JSZip from 'jszip';

type Tab = 'ALL' | 'PHOTOS' | 'DOCS' | 'LINKS';

export const PublicView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');

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
  const [infoFile, setInfoFile] = useState<VaultFile | null>(null);

  // Download States
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const [isExpired, setIsExpired] = useState(false);
  const [expiredVaultName, setExpiredVaultName] = useState<string | null>(null);

  // Reporting State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReasonVirus, setReportReasonVirus] = useState(false);
  const [reportReasonContent, setReportReasonContent] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportFileIds, setReportFileIds] = useState<string[]>([]);
  const [isReporting, setIsReporting] = useState(false);

  const checkAccess = (v: Vault) => {
    const storedPassword = localStorage.getItem(`qrvault_pass_${v.id}`);
    if (v.password && storedPassword === v.password) {
      setIsPasswordVerified(true);
    } else if (!v.password) {
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

  useEffect(() => {
    if (id) {
      mockService.getVaultById(id).then(async (v) => {
        if (v) {
          setVault(v);
          checkAccess(v);
        } else {
          // Check if it was recently deleted
          try {
            const { data: log } = await supabase
              .from('deleted_vault_logs')
              .select('vault_name')
              .eq('original_vault_id', id)
              .single();
            
            if (log) {
              setIsExpired(true);
              setExpiredVaultName(log.vault_name);
            }
          } catch (err) {
            console.warn("Not found in deletion logs either");
          }
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (vault && passwordInput === vault.password) {
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
      alert("Could not download file. Please try again.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleBulkDownload = async () => {
    if (!vault || isDownloadingAll) return;
    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      const folderName = vault.name.replace(/[^a-z0-9]/gi, '_') || 'vault';
      const folder = zip.folder(folderName);
      const downloadableFiles = vault.files.filter(f => f.type !== FileType.LINK);

      if (downloadableFiles.length === 0) {
        alert("No files to download.");
        setIsDownloadingAll(false);
        return;
      }

      let successCount = 0;
      await Promise.all(downloadableFiles.map(async (file) => {
        try {
          const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(file.url)}&filename=${encodeURIComponent(file.name)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error(`Fetch failed`);
          const blob = await response.blob();
          if (blob.size > 0) {
            folder?.file(file.name, blob);
            successCount++;
          }
        } catch (e: any) {
          console.error(`Failed to download ${file.name}`);
        }
      }));

      if (successCount === 0) {
        alert("Failed to download files.");
        setIsDownloadingAll(false);
        return;
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Zip error", error);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vault || isReporting) return;

    if (!reportReasonVirus && !reportReasonContent && !reportMessage.trim()) {
      alert("Please provide a reason or a message.");
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

      const { error: updateError } = await supabase.from('vaults')
        .update({ report_count: (vault.reportCount || 0) + 1 })
        .eq('id', vault.id);

      if (updateError) throw updateError;

      alert("Thank you for your report. Our system will review this vault.");
      setIsReportModalOpen(false);
      setReportReasonVirus(false);
      setReportReasonContent(false);
      setReportMessage('');
      setReportFileIds([]);
    } catch (err: any) {
      console.error("Report error:", err.message);
      alert("Failed to send report.");
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-600 w-8 h-8" /></div>;

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 relative overflow-hidden">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full relative z-10">
        <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vault Expired</h1>
        <p className="font-semibold text-primary-600 mb-6 truncate px-4">&#8220;{expiredVaultName}&#8221;</p>
        <div className="bg-amber-50 text-amber-800 p-5 rounded-2xl text-sm mb-8 border border-amber-100 leading-relaxed font-medium">
          This vault has been automatically deleted based on our security and storage policy.
        </div>
        <div className="space-y-4">
          <Link to="/" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            Create Your Own Vault
          </Link>
          <p className="text-xs text-gray-400">
            Want to keep files forever? <Link to="/pricing" className="text-primary-600 font-bold hover:underline">Check Pro Plans</Link>
          </p>
        </div>
      </div>
    </div>
  );

  if (!vault) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Vault Not Found</h1>
        <p className="text-gray-500 mt-2 mb-6">This vault may have been deleted, the link is incorrect, or you don't have permission to view it.</p>
      </div>
    </div>
  );

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 relative overflow-hidden">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full relative z-10">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restricted Access</h1>
          <p className="text-gray-500 mb-8 font-medium">This vault is protected by the owner. You need to request access to view the files.</p>
          {requestStatus === RequestStatus.PENDING ? (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
              <Clock className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">Request Pending</h3>
              <p className="text-sm text-gray-600 mt-1">We've sent your request to the owner. Please check back later.</p>
              <p className="text-xs text-gray-400 mt-4 underline decoration-orange-200">Logged in as: {viewerEmail}</p>
            </div>
          ) : requestStatus === RequestStatus.REJECTED ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-6">
              <X className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">Access Denied</h3>
              <p className="text-sm text-gray-600 mt-1">The owner has denied your request to access this vault.</p>
            </div>
          ) : (
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label className="block text-left text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Your Email Address</label>
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 relative overflow-hidden">
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
    switch (tab) {
      case 'PHOTOS': return vault.files.filter(f => f.type === FileType.IMAGE);
      case 'DOCS': return vault.files.filter(f => f.type === FileType.PDF || f.type === FileType.ZIP || f.type === FileType.OTHER);
      case 'LINKS': return vault.files.filter(f => f.type === FileType.LINK);
      default: return vault.files;
    }
  };

  const currentFiles = filterFiles(activeTab);
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Files', count: vault.files.length },
    { id: 'PHOTOS', label: 'Photos', count: vault.files.filter(f => f.type === FileType.IMAGE).length },
    { id: 'DOCS', label: 'Documents', count: vault.files.filter(f => f.type === FileType.PDF || f.type === FileType.ZIP || f.type === FileType.OTHER).length },
  ];

  const AdPlaceholder = () => (
    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[240px] animate-pulse">
      <div className="bg-gray-100 p-3 rounded-xl mb-4 text-gray-400"><Zap className="w-8 h-8" /></div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Advertisement</p>
      <p className="text-xs text-gray-500 mt-2 max-w-[160px]">Support QR Vault by upgrading your plan today!</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                {vault.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 w-fit uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" /> Encrypted Vault
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="group/report flex items-center bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm overflow-hidden"
                title="Report Vault"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="max-w-0 opacity-0 group-hover/report:max-w-[4rem] group-hover/report:opacity-100 group-hover/report:ml-2 transition-all duration-300 pointer-events-none text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  Report
                </span>
              </button>

              {vault.files.some(f => f.type !== FileType.LINK) && (
                <button
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
                  onClick={handleBulkDownload}
                  disabled={isDownloadingAll}
                >
                  {isDownloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{isDownloadingAll ? 'Zipping...' : 'Download All'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex space-x-1 overflow-x-auto no-scrollbar py-1">
            {tabs.map(tab => (
              (tab.count > 0 || tab.id === 'ALL') && (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-100'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }
                  `}
                >
                  {tab.label} <span className="ml-1.5 opacity-50 font-medium">({tab.count})</span>
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {currentFiles.length === 0 ? (
          <div className="text-center py-32 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <Box className="text-gray-200 w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No files found</h3>
            <p className="text-gray-500 text-sm">There are no files in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentFiles.map(file => (
              <div key={file.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-gray-100 transition-all group relative border-b-4 border-b-gray-50">
                <div
                  className="aspect-video bg-gray-50 relative flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => file.type === FileType.IMAGE && setPreviewFile(file)}
                >
                  {file.type === FileType.IMAGE ? (
                    <>
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye className="text-white w-10 h-10 drop-shadow-lg" />
                      </div>
                    </>
                  ) : file.type === FileType.PDF ? (
                    <FileText className="w-12 h-12 text-red-500" />
                  ) : file.type === FileType.LINK ? (
                    <LinkIcon className="w-12 h-12 text-primary-500" />
                  ) : (
                    <Box className="w-12 h-12 text-gray-300" />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <h3 className="font-bold text-gray-900 truncate flex-1 text-sm">{file.name}</h3>
                    {file.type !== FileType.LINK && <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded uppercase">{formatBytes(file.size)}</span>}
                  </div>

                  {file.type === FileType.LINK ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-primary-50 text-primary-700 rounded-xl text-xs font-black hover:bg-primary-100 transition-all active:scale-95"
                    >
                      VISIT LINK <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleSingleDownload(file, e)}
                        disabled={downloadingFileId === file.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {downloadingFileId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        DOWNLOAD
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setInfoFile(file); }}
                        className="px-4 py-3 bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                        title="File Details"
                      >
                        <Info className="w-4 h-4" />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsReportModalOpen(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl p-10 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-2xl text-red-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Report Violation</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Community Moderation System</p>
                </div>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleReportSubmit} className="flex-1 flex flex-col md:flex-row gap-10 overflow-hidden">
              {/* Left Column: Reasons & Files */}
              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pr-2 no-scrollbar">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Select Reason(s)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <label className="flex items-center gap-4 p-4 border-2 border-gray-50 rounded-2xl hover:border-red-100 hover:bg-red-50/20 transition-all cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-red-600 rounded-lg border-gray-200 focus:ring-red-500" checked={reportReasonVirus} onChange={(e) => setReportReasonVirus(e.target.checked)} />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Malware</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Dangerous files</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 border-2 border-gray-50 rounded-2xl hover:border-red-100 hover:bg-red-50/20 transition-all cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-red-600 rounded-lg border-gray-200 focus:ring-red-500" checked={reportReasonContent} onChange={(e) => setReportReasonContent(e.target.checked)} />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Illegal</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Policy violations</span>
                    </div>
                  </label>
                </div>

                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Affected Files</p>
                <div className="flex-1 max-h-[300px] overflow-y-auto space-y-2 pr-2 no-scrollbar border-y-2 border-gray-50/50 py-4">
                  {vault.files.map(file => {
                    const isChecked = reportFileIds.includes(file.id);
                    return (
                      <label key={file.id} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${isChecked ? 'border-red-500 bg-red-50/30' : 'border-gray-50 hover:bg-gray-50'}`}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-red-600 rounded" 
                          checked={isChecked} 
                          onChange={(e) => {
                            if (e.target.checked) setReportFileIds([...reportFileIds, file.id]);
                            else setReportFileIds(reportFileIds.filter(id => id !== file.id));
                          }} 
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-gray-900 truncate">{file.name}</span>
                          <span className="text-[9px] text-gray-400 font-black uppercase tracking-tight">{file.type}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Custom Message & Submission */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex-1 flex flex-col mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Additional Details</p>
                  <textarea 
                    className="flex-1 w-full p-6 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-red-200 transition-all outline-none text-sm font-medium resize-none" 
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6" onClick={() => setPreviewFile(null)}>
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors" onClick={() => setPreviewFile(null)}><X className="w-10 h-10" /></button>
          <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {infoFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setInfoFile(null)}>
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Asset Info</h3>
              <button onClick={() => setInfoFile(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-6 h-6" /></button>
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
    </div>
  );
};