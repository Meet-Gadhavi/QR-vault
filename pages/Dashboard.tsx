import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { supabase } from '../services/supabaseClient';
import { Vault, User, PlanType, VaultFile, FileType, PLAN_LIMITS, AccessLevel, AccessRequest, RequestStatus, Invoice } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import QRCode from 'react-qr-code';
import { UploadCloud, File as FileIcon, Link as LinkIcon, Trash2, ExternalLink, Plus, X, Loader2, Eye, HardDrive, QrCode, Copy, Check, MoreVertical, Edit2, Search, Filter, ArrowUpDown, Download, Zap, ChevronDown, Lock, Users, Shield, UserCheck, UserX, Clock, ShieldCheck, AlertTriangle, AlertCircle, RotateCcw, FileText, Shuffle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type SortOption = 'date-newest' | 'date-oldest' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';
type FilterTime = 'all' | '10-days' | '30-days';

const GoogleDriveImg = ({ className }: { className?: string }) => (
  <img src="/GD.png" alt="Google Drive" className={className} />
);

type DeletedVaultLog = {
  id: string;
  vault_name: string;
  created_at: string;
  deleted_at: string;
  views?: number;
  deletion_reason?: string;
};

const VaultTimer: React.FC<{ 
  createdAt: string; 
  expiresAt?: string; 
  views: number; 
  maxViews?: number;
  lockedUntil?: string;
}> = ({ createdAt, expiresAt, views, maxViews, lockedUntil }) => {
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
    <div className="bg-red-600 py-2.5 px-4 flex items-center justify-between text-white font-black uppercase text-[10px] tracking-widest animate-pulse border-t border-red-700">
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
      <span className="text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-wider">Vault Expired</span>
    </div>
  );

  return (
    <div className="bg-amber-50/60 dark:bg-amber-900/10 py-2.5 px-4 border-t border-amber-100/50 dark:border-amber-900/30 flex items-center justify-center gap-2 group/timer transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20">
      <Clock className="w-3.5 h-3.5 text-amber-500 group-hover/timer:animate-spin-slow" />
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest">Valid for:</span>
        <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-500 tabular-nums">{timeLeft}</span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userEmail, userId } = useAuth();

  const [appUser, setAppUser] = useState<User | null>(null);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-newest');
  const [filterTime, setFilterTime] = useState<FilterTime>('all');

  // Modal State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingVaultId, setEditingVaultId] = useState<string | null>(null);

  // Manage Access Modal
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [managingVault, setManagingVault] = useState<Vault | null>(null);

  // Form State
  const [vaultName, setVaultName] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(AccessLevel.PUBLIC);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [tempLink, setTempLink] = useState('');
  const [expiryHours, setExpiryHours] = useState<number | 'never'>(24);
  const [maxViews, setMaxViews] = useState<number | 'custom' | null>(null);
  const [customMaxViews, setCustomMaxViews] = useState<string>('');

  const [existingFiles, setExistingFiles] = useState<VaultFile[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Delete Confirm Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [uploadTask, setUploadTask] = useState<0 | 1 | 2 | 3>(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState<number>(0);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI State
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [viewQrVault, setViewQrVault] = useState<Vault | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFileForSettings, setSelectedFileForSettings] = useState<{ type: 'NEW' | 'EXISTING', index: number } | null>(null);
  const [fileSettings, setFileSettings] = useState<Record<string, any>>({}); // key is index for NEW, id for EXISTING

  // Google Drive State
  const [googleTokens, setGoogleTokens] = useState<any>(null);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<any[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [driveStorageUsed, setDriveStorageUsed] = useState(0);
  const [driveQuota, setDriveQuota] = useState<{ usage: number, limit: number } | null>(null);

  const [isFreeLimitModalOpen, setIsFreeLimitModalOpen] = useState(false);
  const [deletedLogs, setDeletedLogs] = useState<DeletedVaultLog[]>([]);
  const [activeTab, setActiveTab] = useState<'vaults' | 'deleted'>('vaults');

  // Reporting State
  const [reportVault, setReportVault] = useState<Vault | null>(null);
  const [vaultReports, setVaultReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (reportVault) {
      setLoadingReports(true);
      supabase.from('reports')
        .select('*')
        .eq('vault_id', reportVault.id)
        .order('created_at', { ascending: false })
        .then(({ data }: { data: any[] | null }) => {
          setVaultReports(data || []);
          setLoadingReports(false);
        });
    }
  }, [reportVault]);

  useEffect(() => {
    // Immediate redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load data if authenticated
    if (userId) {
      loadData(userId);
    } else {
      setIsLoading(false);
    }

    // Load Google Tokens from local storage if available
    const savedTokens = localStorage.getItem('google_drive_tokens');
    if (savedTokens) {
      try {
        const tokens = JSON.parse(savedTokens);
        setGoogleTokens(tokens);
        fetchGoogleDriveFiles(tokens);
        fetchDriveStorageUsage(tokens);
      } catch (e) {
        console.error("Failed to parse saved google tokens");
      }
    }

    const handleMessage = (event: MessageEvent) => {
      // Be more permissible for cross-domain auth if the message type is explicitly our auth success message.
      // Netlify frontend domain might be receiving message from Render backend domain.
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const tokens = event.data.tokens;
        setGoogleTokens(tokens);
        localStorage.setItem('google_drive_tokens', JSON.stringify(tokens));
        fetchGoogleDriveFiles(tokens);
      }
    };
    window.addEventListener('message', handleMessage);

    // If this window is a popup (opened by window.open), close it after auth
    if (window.opener && window.location.hash.includes('access_token=')) {
      // Supabase sets the session in hash after redirect
      // The parent window will detect the session change via onAuthStateChange
      window.close();
    }

    const handleClickOutside = () => setMenuOpenId(null);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isAuthenticated, userId, navigate, userEmail]);

  useEffect(() => {
    if (appUser?.subscriptionExpiryDate) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(appUser.subscriptionExpiryDate!).getTime();
        const distance = expiry - now;

        if (distance < 0) {
          setTimeLeft('Expired');
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const months = Math.floor(days / 30);

        if (months > 0) {
          setTimeLeft(`${months} months, ${days % 30} days left`);
        } else if (days > 0) {
          setTimeLeft(`${days} days left`);
        } else {
          setTimeLeft(`${hours}h ${minutes}m left`);
        }
      };

      updateTimer(); // Initial call
      const timer = setInterval(updateTimer, 60000); // Update every minute
      return () => clearInterval(timer);
    }
  }, [appUser]);

  const downloadInvoice = (inv: Invoice) => {
    const invoiceHtml = `<!DOCTYPE html><html><head><title>Invoice - ${inv.id}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;padding:40px;color:#333;background:#fff}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;border-bottom:3px solid #7c3aed;padding-bottom:20px}.logo{font-size:28px;font-weight:800;color:#7c3aed}.logo span{color:#333}.invoice-info{text-align:right}.invoice-info h2{font-size:22px;color:#333;margin-bottom:4px}.invoice-info p{font-size:13px;color:#888}.details{display:flex;justify-content:space-between;margin-bottom:40px}.details .col h4{font-size:11px;text-transform:uppercase;color:#999;letter-spacing:1px;margin-bottom:8px}.details .col p{font-size:14px;color:#333;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:30px}th{background:#f5f3ff;color:#7c3aed;text-align:left;padding:12px 16px;font-size:12px;text-transform:uppercase;letter-spacing:.5px}td{padding:14px 16px;border-bottom:1px solid #eee;font-size:14px}.total-row td{font-weight:700;font-size:16px;border-top:2px solid #7c3aed;border-bottom:none}.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:12px}.paid-stamp{display:inline-block;border:3px solid #22c55e;color:#22c55e;padding:4px 20px;border-radius:8px;font-size:18px;font-weight:800;text-transform:uppercase;transform:rotate(-5deg);margin-left:20px}</style></head><body><div class="header"><div><div class="logo"><span>QR</span> Vault</div><p style="font-size:13px;color:#888;margin-top:4px">Secure File Storage & Sharing</p></div><div class="invoice-info"><h2>INVOICE</h2><p>${inv.id}</p><p>${inv.date}</p></div></div><div class="details"><div class="col"><h4>Billed To</h4><p>${appUser?.email || 'N/A'}</p></div><div class="col" style="text-align:right"><h4>Plan Details</h4><p>${inv.plan} Plan - Monthly</p><p>Valid until: ${inv.expiry}</p></div></div><table><thead><tr><th>Description</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody><tr><td>${inv.plan} Plan — Monthly Subscription</td><td>1</td><td style="text-align:right">₹${inv.amount}.00</td></tr><tr class="total-row"><td colspan="2">Total</td><td style="text-align:right">₹${inv.amount}.00</td></tr></tbody></table><div style="margin-bottom:30px"><span class="paid-stamp">✓ PAID</span></div><div class="footer"><p>Thank you for your purchase! This is a computer-generated invoice.</p><p style="margin-top:4px">QR Vault — Secure File Storage & Sharing</p></div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(invoiceHtml); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const loadData = async (uid: string) => {
    try {
      const v = await mockService.getVaults(uid);
      setVaults(v);

      // Fetch User from Service, passing current email to ensure correct profile
      try {
        const u = await mockService.getUser(uid, userEmail || undefined);
        setAppUser(u);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }

      // Fetch Invoices independently to prevent blocking dashboard on table missing errors
      try {
        const invs = await mockService.getUserInvoices(uid);
        setInvoices(invs);
      } catch (err) {
        console.warn("Failed to fetch invoices (table might be missing)", err);
      }
      // Fetch Deleted Logs
      try {
        const { data: logs, error: logsError } = await supabase
          .from('deleted_vault_logs')
          .select('*')
          .eq('user_id', uid)
          .order('deleted_at', { ascending: false })
          .limit(5);

        if (!logsError && logs) {
          setDeletedLogs(logs as DeletedVaultLog[]);
        }
      } catch (err) {
        console.warn("Failed to fetch deleted logs", err);
      }
    } catch (e) {
      console.error("Critical failure in loadData", e);
    } finally {
      setIsLoading(false);
    }
  };

  const isPaidPlan = appUser ? (appUser.plan === PlanType.STARTER || appUser.plan === PlanType.PRO) : false;
  const needsDriveConnection = isPaidPlan && !googleTokens;

  const isOverLimit = useMemo(() => {
    if (!appUser) return false;
    if (isPaidPlan && googleTokens) {
      // For paid plans, check Drive storage against plan limit
      return driveStorageUsed >= appUser.storageLimit;
    }
    return appUser.storageUsed >= appUser.storageLimit;
  }, [appUser, isPaidPlan, googleTokens, driveStorageUsed]);

  // --- Search & Filter Logic ---
  const filteredVaults = useMemo(() => {
    let result = [...vaults];

    if (searchTerm) {
      result = result.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    const now = new Date();
    if (filterTime === '10-days') {
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - 10);
      result = result.filter(v => new Date(v.createdAt) >= cutoff);
    } else if (filterTime === '30-days') {
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - 30);
      result = result.filter(v => new Date(v.createdAt) >= cutoff);
    }

    const getVaultSize = (v: Vault) => v.files.reduce((acc, f) => acc + f.size, 0);

    result.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'size-desc': return getVaultSize(b) - getVaultSize(a);
        case 'size-asc': return getVaultSize(a) - getVaultSize(b);
        case 'date-oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-newest':
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [vaults, searchTerm, filterTime, sortOption]);


  // --- Actions ---

  const handleActionBlocked = () => {
    alert("Account limit reached. Your data is secure, but you must upgrade to add or remove files.");
  };

  const openCreateModal = () => {
    // Check Free Plan Limit
    if (appUser?.plan === PlanType.FREE && vaults.length >= 2) {
      setIsFreeLimitModalOpen(true);
      return;
    }

    // Check Drive Quota Limit
    if (googleTokens && driveQuota && driveQuota.limit > 0) {
      if (driveQuota.usage >= driveQuota.limit * 0.99) {
        alert("Please clear unwanted data from your google drive to make new vaults.");
        return;
      }
    }

    if (isOverLimit) {
      handleActionBlocked();
      return;
    }
    setModalMode('CREATE');
    setEditingVaultId(null);
    setVaultName('');
    setAccessLevel(AccessLevel.PUBLIC);
    setSelectedFiles([]);
    setLinks([]);
    setExistingFiles([]);
    setDeletedFileIds([]);
    setExpiryHours(appUser?.plan === PlanType.FREE ? 24 : 24); // DEFAULT 24
    setMaxViews(appUser?.plan === PlanType.PRO ? null : 25);
    setCustomMaxViews('');
    setVaultPassword('');
    setIsModalOpen(true);
  };

  const openEditModal = (vault: Vault, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (isOverLimit) {
      handleActionBlocked();
      return;
    }

    setModalMode('EDIT');
    setEditingVaultId(vault.id);
    setVaultName(vault.name);
    setAccessLevel(vault.accessLevel || AccessLevel.PUBLIC);
    setSelectedFiles([]);
    setLinks([]);
    setExistingFiles(vault.files);
    setDeletedFileIds([]);
    
    // In edit mode, try to infer expiryHours if possible or just set it
    if (vault.expiresAt) {
        const diff = new Date(vault.expiresAt).getTime() - new Date(vault.createdAt).getTime();
        const hours = Math.round(diff / (1000 * 60 * 60));
        setExpiryHours(hours as any);
    } else {
        setExpiryHours('never');
    }

    if (vault.maxViews) {
        setMaxViews(vault.maxViews);
        setCustomMaxViews(vault.maxViews.toString());
    } else {
        setMaxViews(null);
        setCustomMaxViews('');
    }

    setIsModalOpen(true);
  };

  const openManageAccess = (vault: Vault, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setManagingVault(vault);
    setIsAccessModalOpen(true);
  };

  const handleAccessResolution = async (vaultId: string, requestId: string, status: RequestStatus) => {
    if (!appUser) return;
    await mockService.manageAccessRequest(appUser.id, vaultId, requestId, status);
    // Refresh local data for modal
    const updatedVaults = await mockService.getVaults(appUser.id);
    setVaults(updatedVaults);
    const updatedVault = updatedVaults.find(v => v.id === vaultId);
    if (updatedVault) setManagingVault(updatedVault);
  };

  const uploadFileToDrive = (file: File, folderId: string, onProgress?: (loaded: number) => void) => {
    return new Promise<any>((resolve, reject) => {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tokens', JSON.stringify(googleTokens));
      formData.append('folderId', folderId);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${apiBase}/api/google-drive/upload-file`, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(e.loaded);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Invalid server response'));
          }
        } else {
          let errorMsg = 'Failed to upload file to Drive';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            errorMsg = `Server error (${xhr.status})`;
          }
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  };

  const handleSubmit = async () => {
    if (!vaultName || !appUser) return;
    if (modalMode === 'CREATE' && selectedFiles.length === 0 && links.length === 0) return;
    if (isOverLimit) {
      handleActionBlocked();
      return;
    }

    const totalNewSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    const projectedStorage = (googleTokens ? driveStorageUsed : appUser.storageUsed) + totalNewSize;
    
    if (projectedStorage > appUser.storageLimit) {
      alert(`Upload failed: This vault exceeds your total ${formatBytes(appUser.storageLimit, 0)} storage plan limit. Please delete files or upgrade your plan.`);
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadTask(1); // Security scan / Initializing
    let success = false;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Calculate Expires At
    let expiresAt: string | undefined = undefined;
    if (expiryHours !== 'never') {
        const now = new Date();
        now.setHours(now.getHours() + Number(expiryHours));
        expiresAt = now.toISOString();
    }

    let finalMaxViews: number | undefined = undefined;
    if (maxViews === 'custom') {
        finalMaxViews = parseInt(customMaxViews) || undefined;
    } else if (maxViews !== null) {
        finalMaxViews = Number(maxViews);
    }

    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    const fileProgresses = new Array(selectedFiles.length).fill(0);
    const startTime = Date.now();
    let lastBytesLoaded = 0;
    let lastUpdateTime = Date.now();
    let smoothedSpeed = 0;

    try {
      let finalFiles: (File | any)[] = [...selectedFiles];

      // If Drive is connected, use Drive as primary storage to bypass direct Supabase API limits
      if (googleTokens) {
        // 1. Ensure QRVM folder
        const ensureRes = await fetch(`${apiBase}/api/google-drive/ensure-folder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: googleTokens }),
        });
        const folderData = await ensureRes.json();
        if (!ensureRes.ok) throw new Error(folderData.error || 'Failed to ensure QRVM folder');

        // 2. Create/Find Vault folder
        const saveRes = await fetch(`${apiBase}/api/google-drive/save-vault`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: googleTokens,
            folderId: folderData.folderId,
            vault: { name: vaultName, id: editingVaultId || 'temp', files: [] },
            qrSvg: null, // Don't need QR yet
          }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData.error || 'Failed to create vault folder on Drive');
        const vaultFolderId = saveData.vaultFolderId;

        // 3. Parallel Upload to Drive
        const uploadPromises = selectedFiles.map((file, index) => {
          return uploadFileToDrive(file, vaultFolderId, (loaded) => {
            fileProgresses[index] = loaded;
            const totalLoaded = fileProgresses.reduce((a, b) => a + b, 0);
            
            // Progress Calculation (0-98%)
            const percent = totalSize > 0 ? Math.min(Math.round((totalLoaded / totalSize) * 98), 98) : 50;
            setUploadProgress(percent);

            // Smoothed Time Estimation (Rolling Average)
            const now = Date.now();
            const timeDiff = (now - lastUpdateTime) / 1000;
            if (timeDiff >= 0.5) { // Update speed every 0.5s for smoothness
              const bytesSinceLast = totalLoaded - lastBytesLoaded;
              const currentSpeed = bytesSinceLast / timeDiff;
              
              // Exponential Moving Average (EMA) to prevent jumps
              if (smoothedSpeed === 0) smoothedSpeed = currentSpeed;
              else smoothedSpeed = (smoothedSpeed * 0.8) + (currentSpeed * 0.2);
              
              lastBytesLoaded = totalLoaded;
              lastUpdateTime = now;

              if (smoothedSpeed > 0) {
                const remainingBytes = totalSize - totalLoaded;
                const remainingSec = Math.max(1, Math.ceil(remainingBytes / smoothedSpeed));
                setEstimatedSeconds(remainingSec);
              }
            }

            // Task Pipeline UI
            if (percent > 10 && percent <= 60) setUploadTask(2); // Encryption processing
            if (percent > 60) setUploadTask(3); // Finalizing server distribution
          });
        });

        const driveResults = await Promise.all(uploadPromises);
        finalFiles = driveResults.map((driveFile, i) => ({
          name: driveFile.name,
          size: driveFile.size || selectedFiles[i].size,
          type: selectedFiles[i].type.startsWith('image/') 
            ? FileType.IMAGE 
            : (selectedFiles[i].type.startsWith('video/') 
              ? FileType.VIDEO 
              : (selectedFiles[i].type === 'application/pdf' ? FileType.PDF : FileType.OTHER)),
          mimeType: selectedFiles[i].type,
          url: driveFile.webViewLink,
          settings: fileSettings[i]
        }));
      } else {
        // Supabase only: attach settings directly to file objects
        finalFiles = selectedFiles.map((f, i) => {
          (f as any).settings = fileSettings[i];
          return f;
        });
      }

      // Update existing files settings for EDIT mode
      if (modalMode === 'EDIT') {
        setExistingFiles(prev => prev.map(f => {
          const settings = fileSettings[f.id];
          if (settings) {
            return {
              ...f,
              maxDownloads: settings.maxDownloads,
              expiresAt: settings.expiresAt,
              deleteAfterMinutes: settings.deleteAfterMinutes
            };
          }
          return f;
        }));
      }

      setUploadTask(3); // Finalizing
      if (modalMode === 'CREATE') {
        await mockService.createVault(appUser.id, vaultName, finalFiles, links, accessLevel, appUser.email, expiresAt, finalMaxViews, vaultPassword);
      } else if (modalMode === 'EDIT' && editingVaultId) {
        await mockService.updateVault(appUser.id, editingVaultId, vaultName, finalFiles, links, deletedFileIds, accessLevel, appUser.email, expiresAt, finalMaxViews, vaultPassword);
      }
      
      success = true;

      // Auto-save metadata (and QR) to Google Drive if connected
      if (googleTokens) {
        try {
          const updatedVaults = await mockService.getVaults(appUser.id);
          const latestVault = updatedVaults.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          if (latestVault) {
            await saveVaultToDrive(latestVault);
            // Refresh Drive storage usage after saving
            await fetchDriveStorageUsage(googleTokens);
          }
        } catch (driveErr) {
          console.error('Auto-sync to Drive failed:', driveErr);
        }
      }

      setUploadProgress(100);
      setEstimatedSeconds(0);
      await new Promise(r => setTimeout(r, 800)); // show 100% briefly
      setIsModalOpen(false);
    } catch (e: any) {
      console.error(e);
      setUploadProgress(0);
      setUploadTask(0);
      alert(`Upload failed: ${e.message}`);
    } finally {
      await loadData(appUser.id);
      setIsSubmitting(false);
      setUploadTask(0);
      setEstimatedSeconds(0);
    }
  };

  const handleRecoverVault = async (log: DeletedVaultLog) => {
    if (!appUser) return;
    if (appUser.plan === PlanType.FREE) {
        alert("Vault recovery is only available for Plus and Pro members. Please upgrade to recover your data.");
        return;
    }

    if (!googleTokens) {
        alert("Please connect your Google Drive to recover vaults stored there.");
        return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    setIsSubmitting(true);

    try {
        // 1. Get Folder ID
        const ensureRes = await fetch(`${apiBase}/api/google-drive/ensure-folder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokens: googleTokens }),
        });
        const folderData = await ensureRes.json();
        if (!ensureRes.ok) throw new Error("Failed to access Google Drive root folder.");

        // 2. Search and list files
        const listRes = await fetch(`${apiBase}/api/google-drive/list-vault-files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tokens: googleTokens,
                folderId: folderData.folderId,
                vaultName: log.vault_name
            }),
        });
        
        const listData = await listRes.json();
        if (!listRes.ok) {
            throw new Error(listData.error || "your data is not still in google data not found yet !!");
        }

        // 3. Recover in Supabase
        await mockService.recoverVault(appUser.id, log.vault_name, listData.files);
        
        alert(`Successfully recovered "${log.vault_name}"!`);
        await loadData(appUser.id);
    } catch (err: any) {
        alert(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteVault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (!appUser) return;

    if (isOverLimit) {
      handleActionBlocked();
      return;
    }

    const vaultToDelete = vaults.find(v => v.id === id);
    if (!vaultToDelete) return;

    // Show custom confirm dialog instead of browser confirm()
    setDeleteConfirmId(id);
  };

  const confirmDeleteVault = async () => {
    if (!appUser || !deleteConfirmId) return;
    const id = deleteConfirmId;
    const vaultToDelete = vaults.find(v => v.id === id);
    if (!vaultToDelete) { setDeleteConfirmId(null); return; }

    setIsDeleting(true);
    try {
      // 1. If Google Drive is connected, delete the folder from Drive
      if (googleTokens) {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        // First, get the QRVM folder ID
        const ensureRes = await fetch(`${apiBase}/api/google-drive/ensure-folder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: googleTokens }),
        });
        const folderData = await ensureRes.json();
        
        if (ensureRes.ok && folderData.folderId) {
          await fetch(`${apiBase}/api/google-drive/delete-vault`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokens: googleTokens,
              folderId: folderData.folderId,
              vaultName: vaultToDelete.name
            }),
          });
        }
      }

      // 2. Delete from Supabase (handled inside deleteVault) and DB
      await mockService.deleteVault(appUser.id, id);

      // 3. Refresh Drive storage usage if connected
      if (googleTokens) {
        await fetchDriveStorageUsage(googleTokens);
      }
    } catch (error: any) {
      alert(error.message || "Could not delete vault. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
      await loadData(appUser.id);
    }
  };

  const handleMarkFileDeleted = (fileId: string) => {
    if (isOverLimit) {
      handleActionBlocked();
      return;
    }
    setDeletedFileIds([...deletedFileIds, fileId]);
    setExistingFiles(existingFiles.filter(f => f.id !== fileId));
  };

  const downloadQrCode = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${viewQrVault?.name.replace(/[^a-z0-9]/gi, '_')}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Form Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
      e.dataTransfer.clearData();
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (tempLink) {
      setLinks([...links, tempLink]);
      setTempLink('');
    }
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  // --- Utils ---
  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const getQrUrl = (vault: Vault) => {
    // Robust URL generation: Origin + Path
    const origin = window.location.origin;
    return `${origin}/v/${vault.id}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectGoogleDrive = async () => {
    try {
      console.log('Connecting to Google Drive...');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      console.log('apiBase:', apiBase);
      const response = await fetch(`${apiBase}/api/google/auth`);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', text);
        throw new Error(`Server returned an invalid response (not JSON). Status: ${response.status}. Body: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok || !data.authUrl) {
        throw new Error(data.error || data.details || 'Failed to get auth URL');
      }

      console.log('Opening auth popup...');
      const authWindow = window.open(
        data.authUrl,
        'google_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your Google Drive.');
      }
    } catch (error: any) {
      console.error('Failed to get Google Auth URL', error);
      alert(`Failed to initialize Google connection: ${error.message}`);
    }
  };

  const fetchGoogleDriveFiles = async (tokens: any) => {
    setIsFetchingDrive(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBase}/api/google-drive/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens }),
      });

      if (response.status === 401 || response.status === 500) {
        // If the server returns an error, it might be due to invalid tokens
        console.error('Failed to fetch Drive files, disconnecting...');
        disconnectGoogleDrive();
        return;
      }

      const data = await response.json();
      setGoogleDriveFiles(data.files || []);
    } catch (error) {
      console.error('Failed to fetch Drive files', error);
    } finally {
      setIsFetchingDrive(false);
    }
  };

  const disconnectGoogleDrive = () => {
    setGoogleTokens(null);
    setGoogleDriveFiles([]);
    setDriveStorageUsed(0);
    localStorage.removeItem('google_drive_tokens');
  };

  const fetchDriveStorageUsage = async (tokens: any) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiBase}/api/google-drive/storage-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens }),
      });
      if (res.ok) {
        const data = await res.json();
        setDriveStorageUsed(data.totalBytes || 0);
        if (data.driveQuota) {
          setDriveQuota(data.driveQuota);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Drive storage usage', err);
    }
  };

  const saveVaultToDrive = async (vault: Vault) => {
    if (!googleTokens) return;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    try {
      console.log('[Drive Sync] Ensuring QRVM folder...');
      const folderRes = await fetch(`${apiBase}/api/google-drive/ensure-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: googleTokens }),
      });
      const folderData = await folderRes.json();
      if (!folderRes.ok) throw new Error(folderData.error || 'Failed to ensure folder');

      // Generate QR SVG string
      const qrUrl = `${window.location.origin}/v/${vault.id}`;
      const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="white" width="200" height="200"/><text x="100" y="90" text-anchor="middle" font-size="12" fill="#333">QR for: ${vault.name}</text><text x="100" y="115" text-anchor="middle" font-size="10" fill="#7c3aed">${qrUrl}</text></svg>`;

      console.log('[Drive Sync] Saving vault data...');
      const saveRes = await fetch(`${apiBase}/api/google-drive/save-vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: googleTokens,
          folderId: folderData.folderId,
          vault,
          qrSvg,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || 'Failed to save vault');

      console.log('[Drive Sync] Vault saved to Drive successfully!');
    } catch (error) {
      console.error('[Drive Sync] Error saving to Drive:', error);
    }
  };

  const getPendingRequestCount = (vault: Vault) => {
    return (vault.requests || []).filter(r => r.status === RequestStatus.PENDING).length;
  };

  const storageUsedDisplay = (isPaidPlan && googleTokens) ? driveStorageUsed : (appUser?.storageUsed || 0);

  const data = appUser ? [
    { name: 'Used', value: storageUsedDisplay },
    { name: 'Free', value: Math.max(0, appUser.storageLimit - storageUsedDisplay) },
  ] : [];
  
  // Use current theme to set pie colors
  const { theme } = useTheme();
  const COLORS = isOverLimit 
    ? ['#ef4444', theme === 'dark' ? '#450a0a' : '#fee2e2'] 
    : ['#7c3aed', theme === 'dark' ? '#1e1b4b' : '#f5f3ff'];

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-600 w-10 h-10" /></div>;
  if (!isAuthenticated && !isLoading) return null; // Wait for redirect
  if (!appUser) return null; // Wait for load

  return (
    <div className="bg-gray-50 dark:bg-[#0a0a0a] min-h-screen pb-12 relative transition-colors duration-300">



      {/* Over Limit Banner */}
      {isOverLimit && (
        <div className="bg-red-50 border-b border-red-200 sticky top-26 z-40 animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-red-700">
              <Lock className="w-5 h-5" />
              <span className="font-medium">Storage Limit Reached.</span>
              <span className="text-sm">Your data is secure just explore and buy subscription to continue. You cannot add or delete files.</span>
            </div>
            <Link to="/pricing" className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors">
              Upgrade Now
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome & Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {appUser.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your vaults and storage.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${appUser.plan === PlanType.PRO ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : appUser.plan === PlanType.STARTER ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  {appUser.plan === PlanType.STARTER ? 'Plus' : appUser.plan} Plan
                </span>
                {timeLeft && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" /> {timeLeft}
                  </div>
                )}
                {googleTokens && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                      <GoogleDriveImg className="w-3 h-3" />
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Drive Synced
                    </div>
                    <button
                      onClick={disconnectGoogleDrive}
                      className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Disconnect Google Drive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex gap-4 relative z-10">
              {appUser.plan !== PlanType.PRO && (
                <Link
                  to={`/pricing`}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-300 bg-[length:200%_auto] animate-shine border border-amber-300 text-amber-900 px-5 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:scale-105"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  Upgrade to {appUser.plan === PlanType.FREE ? 'Plus' : 'Pro'}
                </Link>
              )}

              {needsDriveConnection ? (
                <button
                  onClick={handleConnectGoogleDrive}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium shadow-md transition-all bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 animate-pulse"
                >
                  <GoogleDriveImg className="w-5 h-5" />
                  Connect Drive to Start
                </button>
              ) : (
                <>
                  <button
                    onClick={openCreateModal}
                    disabled={isOverLimit}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium shadow-md transition-all ${isOverLimit ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-lg'}`}
                  >
                    {isOverLimit ? <Lock className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {isOverLimit ? 'Storage Full' : 'Create New Vault'}
                  </button>

                  {!googleTokens && isPaidPlan && (
                    <button
                      onClick={handleConnectGoogleDrive}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium shadow-md transition-all bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <GoogleDriveImg className="w-5 h-5" />
                      Connect Google Drive
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
                <HardDrive className={`w-5 h-5 ${isOverLimit ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="text-right">
                <div className={`text-2xl font-bold ${isOverLimit ? 'text-red-600' : 'text-gray-900'}`}>{formatBytes(storageUsedDisplay)}</div>
                <div className="text-xs text-gray-400">of {formatBytes(appUser.storageLimit)} used</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice History */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-900 font-semibold">
              <ShieldCheck className="w-5 h-5 text-primary-500" />
              Invoice History
            </div>
            <span className="text-xs text-gray-400">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Download className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No invoices yet</p>
              <p className="text-xs text-gray-400 mt-1">Invoices will appear here after you purchase a plan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv, i) => (
                <div key={inv.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-50 p-2 rounded-lg">
                      <Download className="w-4 h-4 text-primary-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.plan} Plan</p>
                      <p className="text-xs text-gray-400">{inv.id} • {inv.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">₹{inv.amount}</span>
                    <button
                      onClick={() => downloadInvoice(inv)}
                      className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors cursor-pointer"
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Google Drive Folders Section (if connected) */}
        {googleTokens && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl">
                  <GoogleDriveImg className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Google Drive</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Folders synced from your connected Drive</p>
                </div>
              </div>
              <button
                onClick={() => fetchGoogleDriveFiles(googleTokens)}
                disabled={isFetchingDrive}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
              >
                {isFetchingDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpDown className="w-4 h-4" />}
                Refresh
              </button>
            </div>

            {isFetchingDrive ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Fetching folders...</p>
              </div>
            ) : googleDriveFiles.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">No folders found. Create a vault to auto-sync to Drive.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {googleDriveFiles.map(file => (
                  <a
                    key={file.id}
                    href={file.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="group p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:shadow-md border border-transparent hover:border-amber-200 dark:hover:border-amber-900/40 rounded-xl transition-all duration-200 flex flex-col items-center text-center cursor-pointer"
                  >
                    <svg className="w-12 h-12 mb-3 text-amber-400 group-hover:text-amber-500 transition-colors drop-shadow-sm" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 10C4 7.79086 5.79086 6 8 6H18.3431C19.404 6 20.4214 6.42143 21.1716 7.17157L23 9H40C42.2091 9 44 10.7909 44 13V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V10Z" fill="currentColor" />
                      <path d="M4 14H44V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V14Z" fill="currentColor" opacity="0.85" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white truncate w-full">{file.name}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">Folder</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tools Bar (Search & Filter) */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors w-5 h-5" />
            <input
              type="text"
              placeholder="Search vaults..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/50 border border-transparent hover:bg-white dark:hover:bg-black hover:border-gray-200 dark:hover:border-gray-800 focus:bg-white dark:focus:bg-black focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl text-sm dark:text-white outline-none transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex w-full md:w-auto gap-3 flex-wrap md:flex-nowrap">
            {/* Time Filter - Custom Dropdown */}
            {(() => {
              const filterOptions: { value: FilterTime; label: string; dot: string }[] = [
                { value: 'all', label: 'All Time', dot: 'bg-emerald-400' },
                { value: '10-days', label: 'Past 10 Days', dot: 'bg-amber-400' },
                { value: '30-days', label: 'Past 30 Days', dot: 'bg-blue-400' },
              ];
              const selectedFilter = filterOptions.find(o => o.value === filterTime)!;
              return (
                <div className="relative w-full md:w-auto md:min-w-[170px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === 'filter-time' ? null : 'filter-time'); }}
                    className={`w-full flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 border ${menuOpenId === 'filter-time'
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-800 text-primary-700 dark:text-primary-400 shadow-md shadow-primary-100 dark:shadow-none ring-2 ring-primary-200 dark:ring-primary-900/30'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm hover:shadow-md'
                      }`}
                  >
                    <Filter className={`w-4 h-4 transition-colors ${menuOpenId === 'filter-time' ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'}`} />
                    <div className={`w-2 h-2 rounded-full ${selectedFilter.dot}`} />
                    <span className="flex-1 text-left">{selectedFilter.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-all duration-200 ${menuOpenId === 'filter-time' ? 'rotate-180 text-primary-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                  {menuOpenId === 'filter-time' && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-1.5">
                        {filterOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => { e.stopPropagation(); setFilterTime(option.value); setMenuOpenId(null); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${filterTime === option.value
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium'
                              }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${option.dot} ${filterTime === option.value ? 'ring-2 ring-offset-1 ring-primary-300 dark:ring-primary-900' : ''}`} />
                            <span className="flex-1 text-left">{option.label}</span>
                            {filterTime === option.value && <Check className="w-4 h-4 text-primary-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Sort Filter - Custom Dropdown */}
            {(() => {
              const sortOptions: { value: SortOption; label: string }[] = [
                { value: 'date-newest', label: 'Newest First' },
                { value: 'date-oldest', label: 'Oldest First' },
                { value: 'name-asc', label: 'Name (A-Z)' },
                { value: 'name-desc', label: 'Name (Z-A)' },
                { value: 'size-desc', label: 'Largest Files' },
                { value: 'size-asc', label: 'Smallest Files' },
              ];
              const selectedSort = sortOptions.find(o => o.value === sortOption)!;
              return (
                <div className="relative w-full md:w-auto md:min-w-[190px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === 'filter-sort' ? null : 'filter-sort'); }}
                    className={`w-full flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 border ${menuOpenId === 'filter-sort'
                      ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-md shadow-primary-100 ring-2 ring-primary-200'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-primary-200 hover:bg-gray-50 shadow-sm hover:shadow-md'
                      }`}
                  >
                    <ArrowUpDown className={`w-4 h-4 transition-colors ${menuOpenId === 'filter-sort' ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className="flex-1 text-left">{selectedSort.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-all duration-200 ${menuOpenId === 'filter-sort' ? 'rotate-180 text-primary-500' : 'text-gray-400'}`} />
                  </button>
                  {menuOpenId === 'filter-sort' && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-1.5">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => { e.stopPropagation(); setSortOption(option.value); setMenuOpenId(null); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${sortOption === option.value
                              ? 'bg-primary-50 text-primary-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50 font-medium'
                              }`}
                          >
                            <span className="flex-1 text-left">{option.label}</span>
                            {sortOption === option.value && <Check className="w-4 h-4 text-primary-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('vaults')}
            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'vaults' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Active Vaults
            {activeTab === 'vaults' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('deleted')}
            className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'deleted' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Recently Deleted
            {deletedLogs.length > 0 && <span className="bg-primary-100 text-primary-600 text-[10px] px-1.5 py-0.5 rounded-full">{deletedLogs.length}</span>}
            {activeTab === 'deleted' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full" />}
          </button>
        </div>

        {/* Vaults List */}
        {activeTab === 'vaults' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Vaults ({filteredVaults.length})</h2>

            {filteredVaults.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                <UploadCloud className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No vaults found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search terms.</p>
                {vaults.length === 0 && (
                  <button
                    onClick={openCreateModal}
                    className={`font-medium hover:underline ${isOverLimit ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600'}`}
                    disabled={isOverLimit}
                  >
                    Create Vault
                  </button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVaults.map(vault => (
                  <div key={vault.id} className="relative z-10 w-full h-full perspective-[1000px]">
                    <div 
                      onClick={(e) => toggleMenu(e, vault.id)} 
                      className={`cursor-pointer relative w-full h-full flex flex-col rounded-xl border-2 transition-all duration-500 shadow-sm hover:shadow-md transform-gpu ${vault.reportCount && vault.reportCount > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 shadow-lg shadow-red-50/40 dark:shadow-red-900/20 scale-[1.01]' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}
                      style={{ transformStyle: 'preserve-3d', transform: menuOpenId === vault.id ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
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
                                className={`p-2 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${menuOpenId === vault.id ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
                                title="Click Card or Menu to Flip"
                              >
                                <Shuffle className="w-5 h-5" />
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
                                <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tight"><Shield className="w-3 h-3" /> Restricted</span>
                              ) : (
                                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tight"><Users className="w-3 h-3" /> Public</span>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-gray-400 flex items-center gap-2">
                              <span>{vault.files.length} files • {formatBytes(vault.files.reduce((acc, f) => acc + f.size, 0))}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {vault.views}</span>
                            </div>
                            {appUser.plan === PlanType.FREE && (
                              <Link 
                                to="/pricing" 
                                onClick={(e) => e.stopPropagation()}
                                className="mt-3 inline-flex items-center cursor-pointer gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-lg transition-colors border border-primary-100 w-fit"
                              >
                                <Zap className="w-3 h-3" /> 
                                Upgrade to Keep Permanent
                              </Link>
                            )}
                          </div>

                          <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-800 flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewQrVault(vault); }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all border border-primary-100 dark:border-primary-800 cursor-pointer"
                            >
                              <QrCode className="w-4 h-4" /> View QR
                            </button>
                            <Link
                              to={`/v/${vault.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 flex items-center justify-center cursor-pointer gap-2 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-md active:scale-95"
                            >
                              <ExternalLink className="w-4 h-4" /> Open
                            </Link>
                          </div>
                        </div>
                        {/* Deletion Timer */}
                        <VaultTimer 
                          createdAt={vault.createdAt} 
                          expiresAt={vault.expiresAt} 
                          views={vault.views} 
                          maxViews={vault.maxViews} 
                          lockedUntil={vault.lockedUntil} 
                        />
                      </div>

                      {/* BACK FACE */}
                      <div className="absolute inset-0 w-full h-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-xl flex flex-col justify-center items-center text-gray-900 dark:text-white p-6 shadow-xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                           <button onClick={(e) => toggleMenu(e, vault.id)} className="absolute top-4 right-4 bg-gray-100 dark:bg-gray-800 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-750 p-2 rounded-full transition-colors"><Shuffle className="w-4 h-4"/></button>
                           <h3 className="text-lg font-black tracking-tight mb-4 text-gray-900 dark:text-white truncate w-full text-center pr-8">{vault.name}</h3>
                           
                           <div className="w-full space-y-2.5">
                               <button disabled={isOverLimit} onClick={(e) => openEditModal(vault, e)} className={`w-full py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest cursor-pointer font-black flex items-center justify-center gap-2 transition-all shadow-md ${isOverLimit ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20 active:scale-95'}`}><Edit2 className="w-4 h-4"/> Edit Vault</button>
                               <button onClick={(e) => openManageAccess(vault, e)} className="w-full bg-gray-50 dark:bg-gray-800 border cursor-pointer border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 active:scale-95 text-gray-700 dark:text-gray-300 py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest font-black flex items-center justify-center gap-2 transition-all"><Users className="w-4 h-4"/> Manage Access</button>
                               <button onClick={(e) => { e.stopPropagation(); setReportVault(vault); setMenuOpenId(null); }} className="w-full bg-red-50 dark:bg-red-900/10 border cursor-pointer border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20 active:scale-95 text-red-600 dark:text-red-400 py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest font-black flex items-center justify-center gap-2 transition-all"><AlertTriangle className="w-4 h-4"/> View Reports {vault.reportCount || 0 > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] ml-1">{vault.reportCount}</span>}</button>
                           </div>
                           
                           <button disabled={isOverLimit} onClick={(e) => handleDeleteVault(vault.id, e)} className={`w-full mt-auto py-3 px-4 rounded-xl text-[10px] cursor-pointer font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isOverLimit ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95'}`}><Trash2 className="w-3.5 h-3.5"/> Delete Vault</button>
                      </div>

                    </div>
                  </div>
                ))}

                {/* Ad Placeholders for Free/Plus users */}
                {(appUser.plan === PlanType.FREE || appUser.plan === PlanType.STARTER) && (
                  <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[220px] group hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm mb-4 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Advertisement</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-[160px]">Upgrade to <span className="text-primary-600 dark:text-primary-400 font-bold">PRO</span> to remove advertisements and unlock 20GB storage!</p>
                    <Link to="/pricing" className="mt-4 text-xs font-bold text-primary-600 hover:underline">Upgrade Now</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Recently Deleted Logs Tab */
          <div className="animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Deletion History</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Vaults auto-removed after {appUser?.plan === PlanType.STARTER ? '72 hours (Plus limit)' : '24 hours (Free limit)'}.
                  </p>
                </div>
                <Link to="/pricing" className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1 uppercase tracking-wider">
                  Stop Auto-Deletion <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {deletedLogs.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="bg-gray-50 dark:bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="text-gray-300 dark:text-gray-600 w-6 h-6" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No vaults have been auto-deleted yet.</p>
                  </div>
                ) : (
                  deletedLogs.map((log) => (
                    <div key={log.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-500 dark:text-red-400 font-bold">
                          #
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{log.vault_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter italic">
                              <Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleDateString()}
                            </div>
                            <span className="text-gray-200 dark:text-gray-800">|</span>
                            <div className="flex items-center gap-1 text-[10px] font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full border border-primary-100 dark:border-primary-800">
                              <Eye className="w-3 h-3" /> {log.views || 0} TOTAL SCANS
                            </div>
                            {log.deletion_reason && (
                              <span className="text-[9px] bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded font-black border border-amber-100 dark:border-amber-900/30 uppercase tracking-tighter whitespace-nowrap">
                                {log.deletion_reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <div>
                          <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Auto-Deleted</p>
                          <p className="text-[10px] text-gray-400">{new Date(log.deleted_at).toLocaleDateString()}</p>
                        </div>
                        {(appUser?.plan === PlanType.STARTER || appUser?.plan === PlanType.PRO) && (
                          <button
                            onClick={() => handleRecoverVault(log)}
                            disabled={isSubmitting}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                          >
                            <RotateCcw className="w-3 h-3" /> Recover
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {deletedLogs.length > 0 && (
                <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    {appUser?.plan === PlanType.STARTER 
                      ? "Your Plus vaults are automatically removed after 72 hours or once their scan limit is reached." 
                      : "Free vaults are automatically deleted after 24 hours to save server space."}
                    {appUser?.plan !== PlanType.PRO && (
                      <Link to="/pricing" className="ml-1 underline font-bold">Upgrade to Pro</Link>
                    )} for permanent storage.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* ... keeping Modals ... */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {modalMode === 'CREATE' ? 'Create New Vault' : 'Edit Vault'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X className="text-gray-500 dark:text-gray-400 w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vault Name</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white"
                  value={vaultName}
                  onChange={(e) => setVaultName(e.target.value)}
                  placeholder="e.g. Project Assets"
                />
              </div>

              {/* Security Section (NEW: Password) */}
              <div className="bg-gray-50 dark:bg-black/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-gray-900 dark:text-white" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">Security & Privacy</h3>
                  </div>
                  {appUser.plan !== PlanType.PRO && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-amber-100 uppercase tracking-widest animate-pulse">
                      <Zap className="w-3 h-3 fill-current" /> Pro Feature
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <input
                    type="password"
                    disabled={appUser.plan !== PlanType.PRO}
                    value={vaultPassword}
                    onChange={(e) => setVaultPassword(e.target.value)}
                    placeholder={appUser.plan === PlanType.PRO ? "Set a vault password (optional)" : "Upgrade to Pro to set passwords"}
                    className={`w-full p-4 pl-12 border rounded-xl transition-all font-medium ${
                      appUser.plan === PlanType.PRO 
                        ? 'bg-white dark:bg-black border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 hover:border-primary-200 dark:text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-400 dark:text-gray-500'
                    }`}
                  />
                  <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${appUser.plan === PlanType.PRO ? 'text-primary-500' : 'text-gray-300 dark:text-gray-600'}`} />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1.5 px-1 font-medium">
                  {appUser.plan === PlanType.PRO 
                    ? "Visitors must enter this password to view files." 
                    : "Password protection is only available for professional users."}
                </p>
              </div>

              {/* Access Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Control</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setAccessLevel(AccessLevel.PUBLIC)}
                    className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${accessLevel === AccessLevel.PUBLIC ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className={`w-5 h-5 ${accessLevel === AccessLevel.PUBLIC ? 'text-primary-600' : 'text-gray-400'}`} />
                      <span className={`font-bold ${accessLevel === AccessLevel.PUBLIC ? 'text-primary-900 dark:text-white' : 'text-gray-700 dark:text-gray-400'}`}>Public</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Anyone with the link or QR code can view and download.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessLevel(AccessLevel.RESTRICTED)}
                    className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${accessLevel === AccessLevel.RESTRICTED ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className={`w-5 h-5 ${accessLevel === AccessLevel.RESTRICTED ? 'text-orange-600' : 'text-gray-400'}`} />
                      <span className={`font-bold ${accessLevel === AccessLevel.RESTRICTED ? 'text-orange-900 dark:text-white' : 'text-gray-700 dark:text-gray-400'}`}>Restricted</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Users must request access. You approve who can view.</p>
                  </button>
                </div>
              </div>

              {/* Expiry Selection (Custom Dropdown) */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vault Expiry</label>
                {(() => {
                    const expiryOptions = [
                        { value: 24, label: '24 Hours (Default)', disabled: false },
                        { value: 48, label: '48 Hours', disabled: appUser?.plan === PlanType.FREE },
                        { value: 72, label: '72 Hours', disabled: appUser?.plan === PlanType.FREE },
                        { value: 'never', label: `Permanent Storage (Never Expire) ${appUser?.plan === PlanType.STARTER ? '(PRO Only)' : ''}`, disabled: appUser?.plan !== PlanType.PRO },
                    ];
                    const selected = expiryOptions.find(o => o.value === expiryHours) || expiryOptions[0];
                    const isOpen = menuOpenId === 'modal-expiry';

                    return (
                        <>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(isOpen ? null : 'modal-expiry'); }}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                                    isOpen 
                                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-800 text-primary-700 dark:text-primary-400 shadow-lg shadow-primary-100 dark:shadow-none ring-2 ring-primary-200 dark:ring-primary-900/30' 
                                    : 'bg-white dark:bg-black border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-800 hover:shadow-md'
                                } ${appUser?.plan === PlanType.FREE ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                disabled={appUser?.plan === PlanType.FREE}
                            >
                                <Clock className={`w-5 h-5 transition-colors ${isOpen ? 'text-primary-500' : 'text-gray-400'}`} />
                                <span className="flex-1 text-left">{selected.label}</span>
                                <ChevronDown className={`w-4 h-4 transition-all duration-200 ${isOpen ? 'rotate-180 text-primary-500' : 'text-gray-400'}`} />
                            </button>

                            {isOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-950 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
                                    <div className="p-1.5">
                                        {expiryOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                disabled={opt.disabled}
                                                onClick={() => { setExpiryHours(opt.value as any); setMenuOpenId(null); }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm text-left transition-all ${
                                                    expiryHours === opt.value 
                                                    ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 font-bold' 
                                                    : opt.disabled ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                                                }`}
                                            >
                                                {expiryHours === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                                                <span className={expiryHours === opt.value ? 'ml-0' : 'ml-4'}>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
                
                {appUser?.plan === PlanType.STARTER && expiryHours !== 'never' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                            <strong>Notice:</strong> This vault will be deleted after <strong>{expiryHours} hours</strong> because of the auto-expiry limits of your Plus account.
                        </p>
                    </div>
                )}
                
                {appUser?.plan === PlanType.FREE && (
                    <p className="mt-2 text-[10px] text-gray-400 italic">Free plan vaults are removed after 24 hours. Upgrade for up to 72 hours.</p>
                )}
              </div>

              {/* Scan Count Limit (Custom Dropdown) */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Scan Count Limit</label>
                {(() => {
                    const scanOptions = [
                        { value: 'none', label: 'Unlimited Scans', disabled: appUser?.plan !== PlanType.PRO, proOnly: appUser?.plan !== PlanType.PRO },
                        { value: 25, label: '25 Scans', disabled: false },
                        { value: 45, label: '45 Scans', disabled: false },
                        { value: 65, label: '65 Scans', disabled: appUser?.plan === PlanType.FREE, plusOnly: appUser?.plan === PlanType.FREE },
                        { value: 85, label: '85 Scans', disabled: appUser?.plan === PlanType.FREE, plusOnly: appUser?.plan === PlanType.FREE },
                        { value: 105, label: '105 Scans', disabled: appUser?.plan !== PlanType.PRO, proOnly: appUser?.plan !== PlanType.PRO },
                        { value: 125, label: '125 Scans', disabled: appUser?.plan !== PlanType.PRO, proOnly: appUser?.plan !== PlanType.PRO },
                        { value: 'custom', label: 'Custom Limit', disabled: appUser?.plan !== PlanType.PRO, proOnly: appUser?.plan !== PlanType.PRO },
                    ];
                    
                    const currentValue = maxViews === null ? 'none' : maxViews;
                    const selected = scanOptions.find(o => o.value === currentValue) || scanOptions[1];
                    const isOpen = menuOpenId === 'modal-scans';

                    return (
                        <>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(isOpen ? null : 'modal-scans'); }}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                                    isOpen 
                                    ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-lg shadow-primary-100 ring-2 ring-primary-200' 
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:shadow-md'
                                } cursor-pointer`}
                            >
                                <Eye className={`w-5 h-5 transition-colors ${isOpen ? 'text-primary-500' : 'text-gray-400'}`} />
                                <span className="flex-1 text-left">
                                    {selected.value === 'custom' && customMaxViews ? `${customMaxViews} Scans (Custom)` : selected.label}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-all duration-200 ${isOpen ? 'rotate-180 text-primary-500' : 'text-gray-400'}`} />
                            </button>

                            {isOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
                                    <div className="p-1.5 max-h-60 overflow-y-auto">
                                        {scanOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                disabled={opt.disabled}
                                                onClick={() => { 
                                                    setMaxViews(opt.value === 'none' ? null : (opt.value === 'custom' ? 'custom' : Number(opt.value))); 
                                                    setMenuOpenId(null); 
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all ${
                                                    currentValue === opt.value 
                                                    ? 'bg-primary-50 text-primary-700 font-bold' 
                                                    : opt.disabled ? 'text-gray-300 cursor-not-allowed opacity-60' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {currentValue === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                                                <span className={`${currentValue === opt.value ? 'ml-0' : 'ml-4'} flex-1`}>
                                                    {opt.label}
                                                </span>
                                                {opt.proOnly && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">PRO</span>}
                                                {opt.plusOnly && <span className="text-[10px] bg-primary-50 px-1.5 py-0.5 rounded text-primary-400">PLUS</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}

                {maxViews === 'custom' && appUser?.plan === PlanType.PRO && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="relative group">
                            <input
                                type="number"
                                min="1"
                                placeholder="Enter custom scan limit"
                                value={customMaxViews}
                                onChange={(e) => setCustomMaxViews(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl text-sm outline-none transition-all duration-200"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">Scans</div>
                        </div>
                        <p className="mt-2 text-[10px] text-primary-600 font-medium italic pl-1">Vault will auto-deactivate after reaching this many views.</p>
                    </div>
                )}
              </div>

              {/* Existing Files List (Edit Mode Only) */}
              {modalMode === 'EDIT' && existingFiles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Existing Files</label>
                  <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-40 overflow-y-auto">
                    {existingFiles.map(file => (
                      <div key={file.id} className="p-3 flex items-center justify-between text-sm group hover:bg-white">
                        <div className="flex items-center gap-2 truncate">
                          {file.type === FileType.LINK ? <LinkIcon className="w-4 h-4 text-blue-500" /> : <FileIcon className="w-4 h-4 text-gray-500" />}
                          <span className="text-gray-700 truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedFileForSettings({ type: 'EXISTING', index: file.id as any })}
                            className="text-gray-400 hover:text-primary-600 p-1"
                            title="File Settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMarkFileDeleted(file.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modalMode === 'EDIT' ? 'Add More Files' : 'Upload Files'}
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all relative group cursor-pointer ${isDragging ? 'border-primary-500 bg-primary-50 scale-[1.02]' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="pointer-events-none">
                    <UploadCloud className={`w-10 h-10 mx-auto mb-2 transition-colors ${isDragging ? 'text-primary-600' : 'text-primary-500'}`} />
                    <p className="text-sm text-gray-900 font-medium">
                      {isDragging ? 'Drop files here' : 'Click to upload files'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">or drag and drop here</p>
                  </div>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-blue-50 border border-blue-100 p-2 rounded-lg">
                        <span className="truncate flex items-center gap-2">
                          <FileIcon className="w-4 h-4 text-blue-500" /> {f.name}
                          {fileSettings[i] && (
                            <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter animate-pulse">Destruct Active</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedFileForSettings({ type: 'NEW', index: i }); }}
                            className="text-gray-400 hover:text-primary-600 p-1"
                            title="File Settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); removeSelectedFile(i); }} className="text-gray-400 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modalMode === 'EDIT' ? 'Add More Links' : 'Add Links (Optional)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://..."
                    value={tempLink}
                    onChange={(e) => setTempLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addLink()}
                  />
                  <button onClick={addLink} className="bg-gray-100 hover:bg-gray-200 px-4 rounded-lg font-medium text-gray-700">Add</button>
                </div>
                {links.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {links.map((l, i) => (
                      <div key={i} className="flex items-center justify-between text-sm text-blue-600 bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="flex items-center gap-2 truncate"><LinkIcon className="w-3 h-3" /> {l}</span>
                        <button onClick={() => removeLink(i)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>


            <div className="border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              {/* Upload Progress Bar - always visible in footer */}
              {isSubmitting && (
                <div className="px-6 pt-4 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-primary-600 flex items-center gap-1.5">
                      <Loader2 className="animate-spin w-3 h-3" />
                      {uploadProgress < 100 ? `Uploading... (~${estimatedSeconds}s)` : 'Finalizing...'}
                    </span>
                    <span className="text-xs font-bold text-primary-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 transition-all duration-200 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Please don't close this window.</p>

                  {/* Task Checklist (NEW) */}
                  <div className="mt-6 space-y-3 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-primary-100/50">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processing Pipeline</span>
                       <span className="text-[10px] font-black text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">{Math.min(uploadTask, 3)}/3 Tasks</span>
                    </div>
                    {[
                      { id: 1, label: 'Security scan for threats', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                      { id: 2, label: 'Encryption chain processing', icon: <Shield className="w-3.5 h-3.5" /> },
                      { id: 3, label: 'Finalizing server distribution', icon: <Zap className="w-3.5 h-3.5" /> }
                    ].map(task => {
                      const isDone = uploadTask > task.id || (uploadTask === 3 && uploadProgress === 100);
                      const isActive = uploadTask === task.id;
                      return (
                        <div key={task.id} className={`flex items-center gap-3 transition-opacity duration-300 ${isDone || isActive ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                           <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isDone ? 'bg-green-500 text-white shadow-lg shadow-green-100' : isActive ? 'bg-primary-600 text-white shadow-lg animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                              {isDone ? <Check className="w-3.5 h-3.5" /> : task.icon}
                           </div>
                           <span className={`text-[11px] font-bold uppercase tracking-tight ${isDone ? 'text-green-600' : isActive ? 'text-primary-700' : 'text-gray-400'}`}>
                              {task.label}
                              {isActive && <span className="ml-1 inline-block animate-bounce">...</span>}
                           </span>
                           {isDone && <Check className="w-3 h-3 text-green-500 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="p-6 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting
                    ? <><Loader2 className="animate-spin w-4 h-4" /> Uploading...</>
                    : (modalMode === 'CREATE' ? 'Create Vault' : 'Save Changes')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free Plan Limit Modal */}
      {isFreeLimitModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Vault Limit Reached</h2>
              <button onClick={() => setIsFreeLimitModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="text-gray-500 w-5 h-5" /></button>
            </div>
            <div className="p-6 text-center">
              <div className="bg-amber-100 text-amber-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <p className="text-gray-700 font-medium mb-2">Free subscription only can make 2 vaults</p>
              <p className="text-sm text-gray-500 mb-6 font-medium max-w-[240px] mx-auto">for more go for Plus/Pro plans</p>
              <div className="flex flex-col gap-3">
                <Link to="/pricing" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95" onClick={() => setIsFreeLimitModalOpen(false)}>
                  Go to Plans
                </Link>
                <button onClick={() => setIsFreeLimitModalOpen(false)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition-all">
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Access Management Modal */}
      {isAccessModalOpen && managingVault && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Access Requests</h2>
              <button onClick={() => setIsAccessModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="text-gray-500 w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {!managingVault.requests || managingVault.requests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No access requests yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {managingVault?.requests?.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <div className="overflow-hidden">
                        <p className="font-semibold text-gray-900 truncate" title={req.email}>{req.email}</p>
                        <p className="text-xs text-gray-500">{new Date(req.requestedAt).toLocaleDateString()}</p>
                        <span className={`text-xs font-bold uppercase ${req.status === RequestStatus.APPROVED ? 'text-green-600' :
                          req.status === RequestStatus.REJECTED ? 'text-red-600' : 'text-orange-600'
                          }`}>
                          {req.status}
                        </span>
                      </div>
                      {req.status === RequestStatus.PENDING && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccessResolution(managingVault.id, req.id, RequestStatus.APPROVED)}
                            className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Approve">
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAccessResolution(managingVault.id, req.id, RequestStatus.REJECTED)}
                            className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Reject">
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {viewQrVault && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center relative shadow-2xl">
            <button onClick={() => setViewQrVault(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
            <h3 className="text-xl font-bold text-gray-900 mb-6">{viewQrVault.name}</h3>

            <div className="bg-white p-4 rounded-xl border border-gray-200 inline-block shadow-inner mb-6 relative group">
              <QRCode id="qr-code-svg" value={getQrUrl(viewQrVault)} size={200} />
            </div>

            <div className="space-y-3">
              <button
                onClick={downloadQrCode}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download QR
              </button>

              <div className="flex gap-2">
                <a
                  href={getQrUrl(viewQrVault)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm"
                >
                  Open Link
                </a>
                <button
                  onClick={() => copyToClipboard(getQrUrl(viewQrVault))}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-xs text-gray-400 break-all">
                {getQrUrl(viewQrVault)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (() => {
        const vaultToDelete = vaults.find(v => v.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Vault?</h2>
                <p className="text-gray-500 text-sm mb-1">
                  Are you sure you want to delete
                </p>
                <p className="font-semibold text-gray-900 mb-4 truncate max-w-full">&#8220;{vaultToDelete?.name}&#8221;</p>
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-6">
                  This will permanently delete the QR code and all files. This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteVault}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isDeleting ? <Loader2 className="animate-spin w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Reports History Modal */}
      {reportVault && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setReportVault(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-2xl text-red-500">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Reports History</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{reportVault.name}</p>
                </div>
              </div>
              <button onClick={() => setReportVault(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
              {loadingReports ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                   <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Scanning History...</span>
                 </div>
              ) : vaultReports.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                  <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <p className="text-sm font-black text-gray-900 uppercase">Vault Clean</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">No community reports received for this vault.</p>
                </div>
              ) : (
                vaultReports.map((report) => (
                  <div key={report.id} className="p-5 bg-white border-2 border-gray-50 rounded-3xl hover:border-red-50 transition-all hover:shadow-lg hover:shadow-red-50/20 group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2">
                        {report.reason_virus && <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase ring-1 ring-red-100">Virus/Malware</span>}
                        {report.reason_content && <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase ring-1 ring-orange-100">Illegal Content</span>}
                        {!report.reason_virus && !report.reason_content && <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-lg text-[9px] font-black uppercase ring-1 ring-gray-100">Other Violation</span>}
                      </div>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">{new Date(report.created_at).toLocaleString()}</span>
                    </div>
                    {report.fileIds && report.fileIds.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50/50 rounded-xl border border-red-100/50 w-fit">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-tight">Reported Content:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {report.fileIds.map((fid: string) => {
                            const file = reportVault?.files?.find((f: any) => f.id === fid);
                            return (
                              <div key={fid} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                <FileText className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-700 truncate">
                                  {file?.name || "Unknown File"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {report.custom_message && (
                      <div className="bg-gray-50/50 p-4 rounded-2xl italic text-gray-600 text-xs font-medium border-l-4 border-l-red-100 mt-3">
                        "{report.custom_message}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
               <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
               <div>
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight mb-1">Owner Warning</p>
                  <p className="text-[11px] text-amber-700/80 font-medium leading-relaxed">
                    Accumulating 4 reports will result in a 10-day lock. 10 reports will trigger automatic permanent deletion for community safety.
                  </p>
               </div>
            </div>
          </div>
        </div>
      {/* File-Specific Setting Modal (Self-Destruct) */}
      {selectedFileForSettings && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-white/20 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"></div>
            
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">File Destruct</h3>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Advanced Security Protocol</p>
                </div>
                <button onClick={() => setSelectedFileForSettings(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X className="text-gray-400 w-6 h-6" /></button>
              </div>

              <div className="space-y-6">
                {/* 1. Max Downloads */}
                <div className="bg-gray-50 dark:bg-black/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 relative group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-tight">Download Limit</span>
                    </div>
                    {appUser?.plan === PlanType.FREE && (
                      <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Plus+</span>
                    )}
                  </div>
                  <input 
                    type="number"
                    disabled={appUser?.plan === PlanType.FREE}
                    placeholder="Unlimited"
                    value={fileSettings[selectedFileForSettings.type === 'NEW' ? selectedFileForSettings.index : selectedFileForSettings.index as any]?.maxDownloads || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                      const key = selectedFileForSettings.type === 'NEW' ? selectedFileForSettings.index : selectedFileForSettings.index as any;
                      setFileSettings({ ...fileSettings, [key]: { ...fileSettings[key], maxDownloads: val } });
                    }}
                    className={`w-full bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold ${appUser?.plan === PlanType.FREE ? 'opacity-50 cursor-not-allowed' : 'dark:text-white'}`}
                  />
                  <p className="text-[9px] text-gray-400 mt-2 font-medium">Auto-delete after reaching this many successful downloads.</p>
                </div>

                {/* 2. Vanishing Timer */}
                <div className="bg-gray-50 dark:bg-black/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 relative group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-tight">Vanishing Timer</span>
                    </div>
                    {appUser?.plan === PlanType.FREE && (
                      <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Plus+</span>
                    )}
                  </div>
                  <select
                    disabled={appUser?.plan === PlanType.FREE}
                    value={fileSettings[selectedFileForSettings.type === 'NEW' ? selectedFileForSettings.index : selectedFileForSettings.index as any]?.deleteAfterMinutes || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                      const key = selectedFileForSettings.type === 'NEW' ? selectedFileForSettings.index : selectedFileForSettings.index as any;
                      setFileSettings({ ...fileSettings, [key]: { ...fileSettings[key], deleteAfterMinutes: val } });
                    }}
                    className={`w-full bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold ${appUser?.plan === PlanType.FREE ? 'opacity-50 cursor-not-allowed' : 'dark:text-white'}`}
                  >
                    <option value="">Never vanish</option>
                    <option value="1">1 Minute after opening</option>
                    <option value="5">5 Minutes after opening</option>
                    <option value="60">1 Hour after opening</option>
                    <option value="1440">24 Hours after opening</option>
                  </select>
                  <p className="text-[9px] text-gray-400 mt-2 font-medium">Countdown begins once the visitor first previews or downloads this file.</p>
                </div>

                {/* 3. Fixed Expiry */}
                <div className="bg-gray-50 dark:bg-black/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 relative group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-tight">Hard Expiry</span>
                    </div>
                    {appUser?.plan === PlanType.FREE && (
                      <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Plus+</span>
                    )}
                  </div>
                  <input 
                    type="datetime-local"
                    disabled={appUser?.plan === PlanType.FREE}
                    value={fileSettings[selectedFileForSettings.type === 'NEW' ? selectedFileForSettings.index : selectedFileForSettings.index as any]?.expiresAt || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const key = selectedFileForSettings.type === 'NEW' ? selectedFileForSettings.index : selectedFileForSettings.index as any;
                      setFileSettings({ ...fileSettings, [key]: { ...fileSettings[key], expiresAt: val } });
                    }}
                    className={`w-full bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 transition-all font-bold ${appUser?.plan === PlanType.FREE ? 'opacity-50 cursor-not-allowed' : 'dark:text-white'}`}
                  />
                  <p className="text-[9px] text-gray-400 mt-2 font-medium">File will vanish on this specific date regardless of views.</p>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                 {appUser?.plan === PlanType.FREE ? (
                  <Link to="/pricing" onClick={() => setSelectedFileForSettings(null)} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2">
                    <Zap className="w-4 h-4 fill-current" /> Upgrade to Plus
                  </Link>
                 ) : (
                  <button onClick={() => setSelectedFileForSettings(null)} className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-95 transition-all">
                    Apply Protocol
                  </button>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};