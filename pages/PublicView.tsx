import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { mockService } from '../services/mockService';
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

  // Modals
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [infoFile, setInfoFile] = useState<VaultFile | null>(null);

  // Download States
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      mockService.getVaultById(id).then(v => {
        if (v) {
          setVault(v);
          checkAccess(v);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  const checkAccess = (v: Vault) => {
    // 1. If public, grant access
    if (!v.accessLevel || v.accessLevel === AccessLevel.PUBLIC) {
      setHasAccess(true);
      return;
    }

    // 2. If restricted, check email in requests
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

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !vault) return;

    setRequesting(true);
    // Save email locally to identify this user
    localStorage.setItem('qrvault_viewer_email', emailInput);
    setViewerEmail(emailInput);

    try {
      await mockService.requestAccess(vault.id, emailInput);
      // Refresh vault to get status
      const v = await mockService.getVaultById(vault.id);
      if (v) {
        setVault(v);
        checkAccess(v);
        // Manually set status to PENDING if logic didn't catch it immediately (e.g. sync issue)
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

  const getGoogleDriveDownloadUrl = (file: VaultFile) => {
    if (!file.url.includes('drive.google.com')) return null;
    // Extract file ID from /d/ID/ or ?id=ID
    const match = file.url.match(/\/d\/([^/|?]+)/) || file.url.match(/[?&]id=([^&]+)/);
    if (match && match[1]) {
      // Use absolute origin to ensure we hit the API correctly regardless of routing
      const base = window.location.origin;
      return `${base}/api/drive-proxy?id=${match[1]}&name=${encodeURIComponent(file.name)}`;
    }
    return null;
  };

  const handleSingleDownload = async (file: VaultFile, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (downloadingFileId) return;

    const gDriveProxyUrl = getGoogleDriveDownloadUrl(file);
    if (gDriveProxyUrl) {
      // Use the server-side proxy to bypass CORS and virus scan confirmation.
      // We trigger a direct browser download.
      const a = document.createElement('a');
      a.href = gDriveProxyUrl;
      a.download = file.name;
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
      // Use vault name for folder or root
      const folderName = vault.name.replace(/[^a-z0-9]/gi, '_') || 'vault';
      const folder = zip.folder(folderName);

      // Download all files in vault (ignoring filtered tab view) that are not links
      const downloadableFiles = vault.files.filter(f => f.type !== FileType.LINK);

      if (downloadableFiles.length === 0) {
        alert("No files to download.");
        setIsDownloadingAll(false);
        return;
      }

      // Fetch all files
      await Promise.all(downloadableFiles.map(async (file) => {
        try {
          const gDriveProxyUrl = getGoogleDriveDownloadUrl(file);
          const fetchUrl = gDriveProxyUrl || file.url;
          
          const response = await fetch(fetchUrl);
          const blob = await response.blob();
          folder?.file(file.name, blob);
        } catch (e) {
          console.error(`Failed to download ${file.name}`, e);
        }
      }));

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
      alert("Failed to create zip file.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-600 w-8 h-8" /></div>;

  if (!vault) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Vault Not Found</h1>
        <p className="text-gray-500 mt-2 mb-6">This vault may have been deleted, the link is incorrect, or you don't have permission to view it.</p>
      </div>
    </div>
  );

  // --- RESTRICTED ACCESS SCREEN ---
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full relative z-10">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restricted Access</h1>
          <p className="text-gray-500 mb-8">This vault is protected by the owner. You need to request access to view the files.</p>

          {requestStatus === RequestStatus.PENDING ? (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
              <Clock className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">Request Pending</h3>
              <p className="text-sm text-gray-600 mt-1">We've sent your request to the owner. Please check back later.</p>
              <p className="text-xs text-gray-400 mt-4">Logged in as: {viewerEmail}</p>
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
                <label className="block text-left text-sm font-medium text-gray-700 mb-1">Your Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={requesting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
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

  // --- CONTENT VIEW ---

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
      <div className="bg-gray-100 p-3 rounded-xl mb-4 text-gray-400">
        <Zap className="w-8 h-8" />
      </div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Advertisement</p>
      <p className="text-xs text-gray-500 mt-2 max-w-[160px]">Support QR Vault by upgrading your plan today!</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Assets</h1>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <ShieldCheck className="w-3 h-3" /> Secure Access
              </div>
            </div>

            {/* Download All Button */}
            {vault.files.some(f => f.type !== FileType.LINK) && (
              <button
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                onClick={handleBulkDownload}
                disabled={isDownloadingAll}
              >
                {isDownloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="hidden sm:inline">{isDownloadingAll ? 'Zipping...' : 'Download All'}</span>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              tab.count > 0 || tab.id === 'ALL' ? (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                    ${activeTab === tab.id
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {tab.label} <span className={`ml-1 text-xs opacity-70 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}>({tab.count})</span>
                </button>
              ) : null
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        {currentFiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Box className="text-gray-400 w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No files found</h3>
            <p className="text-gray-500">There are no files in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentFiles.map(file => (
              <div key={file.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group relative">
                {/* ... (existing file card content) */}

                {/* File Preview Area */}
                <div
                  className="aspect-video bg-gray-100 relative flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => file.type === FileType.IMAGE && setPreviewFile(file)}
                >
                  {file.type === FileType.IMAGE ? (
                    <>
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye className="text-white w-8 h-8 drop-shadow-md" />
                      </div>
                    </>
                  ) : file.type === FileType.PDF ? (
                    <FileText className="w-12 h-12 text-red-400" />
                  ) : file.type === FileType.LINK ? (
                    <LinkIcon className="w-12 h-12 text-blue-400" />
                  ) : (
                    <Box className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* Info Button - Absolute Positioned */}
                <button
                  onClick={(e) => { e.stopPropagation(); setInfoFile(file); }}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm text-gray-500 hover:text-primary-600 transition-colors z-10 opacity-0 group-hover:opacity-100"
                  title="File Info"
                >
                  <Info className="w-4 h-4" />
                </button>

                {/* File Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 truncate flex-1" title={file.name}>{file.name}</h3>
                    {file.type !== FileType.LINK && <span className="text-xs text-gray-400 whitespace-nowrap">{formatBytes(file.size)}</span>}
                  </div>

                  {file.type === FileType.LINK ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Open Link <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleSingleDownload(file, e)}
                        disabled={downloadingFileId === file.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        {downloadingFileId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Download
                      </button>
                      {file.type === FileType.PDF && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
                          title="Preview PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Ad Placeholders for Free/Plus owners */}
            {(vault.userPlan === PlanType.FREE || vault.userPlan === PlanType.STARTER) && (
              <>
                <AdPlaceholder key="ad-1" />
                {currentFiles.length > 2 && <AdPlaceholder key="ad-2" />}
              </>
            )}
          </div>
        )}
      </div>

      <div className="py-6 text-center border-t border-gray-200 mt-auto bg-white">
        <p className="text-xs text-gray-400">Securely shared via <span className="font-semibold text-gray-600">QR Vault</span></p>
      </div>

      {/* Image Preview Modal */}
      {
        previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setPreviewFile(null)}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setPreviewFile(null)}>
              <X className="w-8 h-8" />
            </button>
            <img
              src={previewFile.url}
              alt={previewFile.name}
              className="max-w-full max-h-screen object-contain rounded-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <button
                onClick={(e) => handleSingleDownload(previewFile, e)}
                className="pointer-events-auto inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
              >
                <Download className="w-5 h-5" /> Download Original
              </button>
            </div>
          </div>
        )
      }

      {/* Info Modal */}
      {
        infoFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setInfoFile(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">File Details</h3>
                <button onClick={() => setInfoFile(null)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                  {infoFile.type === FileType.IMAGE ? <ImageIcon className="w-8 h-8" /> :
                    infoFile.type === FileType.PDF ? <FileText className="w-8 h-8" /> :
                      infoFile.type === FileType.LINK ? <LinkIcon className="w-8 h-8" /> : <File className="w-8 h-8" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-gray-900 truncate" title={infoFile.name}>{infoFile.name}</p>
                  <p className="text-sm text-gray-500">{infoFile.type}</p>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Size</span>
                  <span className="font-medium text-gray-900">{formatBytes(infoFile.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">MIME Type</span>
                  <span className="font-medium text-gray-900 truncate max-w-[150px]" title={infoFile.mimeType}>{infoFile.mimeType}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {infoFile.type !== FileType.LINK && (
                  <button
                    onClick={(e) => { handleSingleDownload(infoFile, e); setInfoFile(null); }}
                    className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                )}
                {infoFile.type === FileType.LINK && (
                  <a
                    href={infoFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Link
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
};