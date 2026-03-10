import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockService } from '../services/mockService';
import { Vault, User, PlanType, VaultFile, FileType, PLAN_LIMITS, AccessLevel, AccessRequest, RequestStatus, Invoice } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import QRCode from 'react-qr-code';
import { UploadCloud, File as FileIcon, Link as LinkIcon, Trash2, ExternalLink, Plus, X, Loader2, Eye, HardDrive, QrCode, Copy, Check, MoreVertical, Edit2, Search, Filter, ArrowUpDown, Download, Zap, ChevronDown, Lock, Users, Shield, UserCheck, UserX, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type SortOption = 'date-newest' | 'date-oldest' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';
type FilterTime = 'all' | '10-days' | '30-days';

const GoogleDriveImg = ({ className }: { className?: string }) => (
  <img src="/GD.png" alt="Google Drive" className={className} />
);

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

  const [existingFiles, setExistingFiles] = useState<VaultFile[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI State
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [viewQrVault, setViewQrVault] = useState<Vault | null>(null);
  const [copied, setCopied] = useState(false);

  // Google Drive State
  const [googleTokens, setGoogleTokens] = useState<any>(null);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<any[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [driveStorageUsed, setDriveStorageUsed] = useState(0);
  const [driveQuota, setDriveQuota] = useState<{ usage: number, limit: number } | null>(null);

  // New Free Limit Modal
  const [isFreeLimitModalOpen, setIsFreeLimitModalOpen] = useState(false);

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
    const invoiceHtml = `<!DOCTYPE html><html><head><title>Invoice - ${inv.id}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;padding:40px;color:#333;background:#fff}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;border-bottom:3px solid #7c3aed;padding-bottom:20px}.logo{font-size:28px;font-weight:800;color:#7c3aed}.logo span{color:#333}.invoice-info{text-align:right}.invoice-info h2{font-size:22px;color:#333;margin-bottom:4px}.invoice-info p{font-size:13px;color:#888}.details{display:flex;justify-content:space-between;margin-bottom:40px}.details .col h4{font-size:11px;text-transform:uppercase;color:#999;letter-spacing:1px;margin-bottom:8px}.details .col p{font-size:14px;color:#333;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:30px}th{background:#f5f3ff;color:#7c3aed;text-align:left;padding:12px 16px;font-size:12px;text-transform:uppercase;letter-spacing:.5px}td{padding:14px 16px;border-bottom:1px solid #eee;font-size:14px}.total-row td{font-weight:700;font-size:16px;border-top:2px solid #7c3aed;border-bottom:none}.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:12px}.paid-stamp{display:inline-block;border:3px solid #22c55e;color:#22c55e;padding:4px 20px;border-radius:8px;font-size:18px;font-weight:800;text-transform:uppercase;transform:rotate(-5deg);margin-left:20px}</style></head><body><div class="header"><div><div class="logo"><span>QR</span> Vault</div><p style="font-size:13px;color:#888;margin-top:4px">Secure File Storage & Sharing</p></div><div class="invoice-info"><h2>INVOICE</h2><p>${inv.id}</p><p>${inv.date}</p></div></div><div class="details"><div class="col"><h4>Billed To</h4><p>${appUser?.email || 'N/A'}</p></div><div class="col" style="text-align:right"><h4>Plan Details</h4><p>${inv.plan} Plan - Monthly</p><p>Valid until: ${inv.expiry}</p></div></div><table><thead><tr><th>Description</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody><tr><td>${inv.plan} Plan — Monthly Subscription</td><td>1</td><td style="text-align:right">₹${inv.amount}.00</td></tr><tr class="total-row"><td colspan="2">Total</td><td style="text-align:right">₹${inv.amount}.00</td></tr></tbody></table><div style="margin-bottom:30px"><span class="paid-stamp">✓ PAID</span></div><div class="footer"><p>Thank you for your purchase! This is a computer-generated invoice.</p><p style="margin-top:4px">QR Vault — Created by Mazelabs</p></div></body></html>`;
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

  const uploadFileToDrive = async (file: File, folderId: string) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tokens', JSON.stringify(googleTokens));
    formData.append('folderId', folderId);

    const res = await fetch(`${apiBase}/api/google-drive/upload-file`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload file to Drive');
    return data; // { id, name, webViewLink, size }
  };

  const handleSubmit = async () => {
    if (!vaultName || !appUser) return;
    if (modalMode === 'CREATE' && selectedFiles.length === 0 && links.length === 0) return;
    if (isOverLimit) {
      handleActionBlocked();
      return;
    }

    setIsSubmitting(true);
    let success = false;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    try {
      let finalFiles: (File | any)[] = [...selectedFiles];

      // If Plus/Pro and Drive connected, use Drive as primary storage
      if (googleTokens && (appUser.plan === PlanType.PRO || appUser.plan === PlanType.STARTER)) {
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

        // 3. Upload each new file to Drive
        const driveFiles = [];
        for (const file of selectedFiles) {
          const driveFile = await uploadFileToDrive(file, vaultFolderId);
          driveFiles.push({
            name: driveFile.name,
            size: driveFile.size || file.size,
            type: file.type.startsWith('image/') ? FileType.IMAGE : (file.type === 'application/pdf' ? FileType.PDF : FileType.OTHER),
            mimeType: file.type,
            url: driveFile.webViewLink
          });
        }
        finalFiles = driveFiles;
      }

      if (modalMode === 'CREATE') {
        await mockService.createVault(appUser.id, vaultName, finalFiles, links, accessLevel, appUser.email);
      } else if (modalMode === 'EDIT' && editingVaultId) {
        await mockService.updateVault(appUser.id, editingVaultId, vaultName, finalFiles, links, deletedFileIds, accessLevel, appUser.email);
      }
      success = true;
      setIsModalOpen(false);
    } catch (e: any) {
      console.error(e);
      alert(`Note: ${e.message}`);
    } finally {
      await loadData(appUser.id);
      setIsSubmitting(false);

      // Auto-save metadata (and QR) to Google Drive if connected
      if (success && googleTokens) {
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
    }
  };

  const handleDeleteVault = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (!appUser) return;

    if (isOverLimit) {
      handleActionBlocked();
      return;
    }

    if (confirm('Are you sure? This will delete the QR code and all files permanently.')) {
      try {
        await mockService.deleteVault(appUser.id, id);
      } catch (error: any) {
        alert(error.message || "Could not delete vault. Please try again.");
      } finally {
        await loadData(appUser.id);
      }
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
  const COLORS = isOverLimit ? ['#ef4444', '#fee2e2'] : ['#7c3aed', '#e5e7eb'];

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-600 w-10 h-10" /></div>;
  if (!isAuthenticated && !isLoading) return null; // Wait for redirect
  if (!appUser) return null; // Wait for load

  return (
    <div className="bg-gray-50 min-h-screen pb-12 relative">

      {/* Mazelabs Sticky Bar */}
      <a
        href="https://webhub-63.netlify.app/"
        target="_blank"
        rel="noreferrer"
        className="bg-black hover:bg-gray-900 transition-colors w-full py-2.5 flex items-center justify-center gap-2 sticky top-16 z-50 text-sm shadow-lg border-b border-gray-800"
      >
        <span className="text-gray-400 font-medium">Created By</span>
        <span className="text-white font-bold tracking-wide flex items-center">Maze<span className="text-yellow-400">labs</span></span>
        <ExternalLink className="w-3 h-3 text-gray-500" />
      </a>

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
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {appUser.name}</h1>
                <p className="text-gray-500 mt-1">Manage your vaults and storage.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${appUser.plan === PlanType.PRO ? 'bg-purple-100 text-purple-700' : appUser.plan === PlanType.STARTER ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                  {appUser.plan === PlanType.STARTER ? 'Plus' : appUser.plan} Plan
                </span>
                {timeLeft && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
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
                      className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium shadow-md transition-all bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <GoogleDriveImg className="w-5 h-5" />
                      Connect Google Drive
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-gray-900 font-semibold mb-2">
              {isPaidPlan && googleTokens ? (
                <GoogleDriveImg className="w-5 h-5" />
              ) : (
                <HardDrive className={`w-5 h-5 ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`} />
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
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <GoogleDriveImg className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Google Drive</h2>
                  <p className="text-xs text-gray-500">Folders synced from your connected Drive</p>
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
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Fetching folders...</p>
              </div>
            ) : googleDriveFiles.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-500">No folders found. Create a vault to auto-sync to Drive.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {googleDriveFiles.map(file => (
                  <a
                    key={file.id}
                    href={file.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="group p-4 bg-gray-50 hover:bg-amber-50 hover:shadow-md border border-transparent hover:border-amber-200 rounded-xl transition-all duration-200 flex flex-col items-center text-center cursor-pointer"
                  >
                    <svg className="w-12 h-12 mb-3 text-amber-400 group-hover:text-amber-500 transition-colors drop-shadow-sm" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 10C4 7.79086 5.79086 6 8 6H18.3431C19.404 6 20.4214 6.42143 21.1716 7.17157L23 9H40C42.2091 9 44 10.7909 44 13V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V10Z" fill="currentColor" />
                      <path d="M4 14H44V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V14Z" fill="currentColor" opacity="0.85" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate w-full">{file.name}</span>
                    <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Folder</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tools Bar (Search & Filter) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors w-5 h-5" />
            <input
              type="text"
              placeholder="Search vaults..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl text-sm outline-none transition-all duration-200"
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
                      ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-md shadow-primary-100 ring-2 ring-primary-200'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-primary-200 hover:bg-gray-50 shadow-sm hover:shadow-md'
                      }`}
                  >
                    <Filter className={`w-4 h-4 transition-colors ${menuOpenId === 'filter-time' ? 'text-primary-500' : 'text-gray-400'}`} />
                    <div className={`w-2 h-2 rounded-full ${selectedFilter.dot}`} />
                    <span className="flex-1 text-left">{selectedFilter.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-all duration-200 ${menuOpenId === 'filter-time' ? 'rotate-180 text-primary-500' : 'text-gray-400'}`} />
                  </button>
                  {menuOpenId === 'filter-time' && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-1.5">
                        {filterOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => { e.stopPropagation(); setFilterTime(option.value); setMenuOpenId(null); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${filterTime === option.value
                              ? 'bg-primary-50 text-primary-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50 font-medium'
                              }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${option.dot} ${filterTime === option.value ? 'ring-2 ring-offset-1 ring-primary-300' : ''}`} />
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

        {/* Vaults List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Vaults ({filteredVaults.length})</h2>

          {filteredVaults.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <UploadCloud className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No vaults found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
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
                <div key={vault.id} className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">

                  {/* Card Header & 3-Dot Menu */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      <div className="bg-primary-50 p-2 rounded-lg">
                        <QrCode className="w-6 h-6 text-primary-600" />
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
                        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${menuOpenId === vault.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {/* Dropdown Menu */}
                      {menuOpenId === vault.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                          <button
                            onClick={(e) => openEditModal(vault, e)}
                            disabled={isOverLimit}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 ${isOverLimit ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {isOverLimit ? <Lock className="w-4 h-4" /> : <Edit2 className="w-4 h-4 text-gray-500" />} Edit Vault
                          </button>
                          <button
                            onClick={(e) => openManageAccess(vault, e)}
                            className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 text-gray-700 hover:bg-gray-50"
                          >
                            <Users className="w-4 h-4 text-gray-500" /> Manage Access
                          </button>
                          <div className="h-px bg-gray-100"></div>
                          <button
                            onClick={(e) => handleDeleteVault(vault.id, e)}
                            disabled={isOverLimit}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 ${isOverLimit ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-red-600 hover:bg-red-50'}`}
                          >
                            {isOverLimit ? <Lock className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />} Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 truncate pr-8">{vault.name}</h3>
                  <div className="text-sm text-gray-500 mt-1 mb-4">
                    <div className="flex items-center gap-2">
                      <span>{new Date(vault.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      {vault.accessLevel === AccessLevel.RESTRICTED ?
                        <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-xs font-medium"><Shield className="w-3 h-3" /> Restricted</span>
                        :
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-xs font-medium"><Users className="w-3 h-3" /> Public</span>
                      }
                    </div>
                    <div className="mt-1 text-xs text-gray-400 flex items-center gap-2">
                      <span>{vault.files.length} files • {formatBytes(vault.files.reduce((acc, f) => acc + f.size, 0))}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {vault.views}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                    <button
                      onClick={() => setViewQrVault(vault)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-100 transition-all border border-primary-100 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" /> View QR
                    </button>
                    <Link
                      to={`/v/${vault.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-md active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" /> Open
                    </Link>
                  </div>
                </div>
              ))}

              {/* Ad Placeholders for Free/Plus users */}
              {(appUser.plan === PlanType.FREE || appUser.plan === PlanType.STARTER) && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[220px] group hover:border-primary-200 transition-colors">
                  <div className="bg-white p-3 rounded-2xl shadow-sm mb-4 text-primary-600 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Advertisement</p>
                  <p className="text-xs text-gray-500 mt-2 max-w-[160px]">Upgrade to <span className="text-primary-600 font-bold">PRO</span> to remove advertisements and unlock 20GB storage!</p>
                  <Link to="/pricing" className="mt-4 text-xs font-bold text-primary-600 hover:underline">Upgrade Now</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* ... keeping Modals ... */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'CREATE' ? 'Create New Vault' : 'Edit Vault'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="text-gray-500 w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vault Name</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="e.g. Project Assets, Event Photos"
                  value={vaultName}
                  onChange={(e) => setVaultName(e.target.value)}
                />
              </div>

              {/* Access Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Control</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setAccessLevel(AccessLevel.PUBLIC)}
                    className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${accessLevel === AccessLevel.PUBLIC ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className={`w-5 h-5 ${accessLevel === AccessLevel.PUBLIC ? 'text-primary-600' : 'text-gray-400'}`} />
                      <span className={`font-bold ${accessLevel === AccessLevel.PUBLIC ? 'text-primary-900' : 'text-gray-700'}`}>Public</span>
                    </div>
                    <p className="text-xs text-gray-500">Anyone with the link or QR code can view and download.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessLevel(AccessLevel.RESTRICTED)}
                    className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${accessLevel === AccessLevel.RESTRICTED ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className={`w-5 h-5 ${accessLevel === AccessLevel.RESTRICTED ? 'text-orange-600' : 'text-gray-400'}`} />
                      <span className={`font-bold ${accessLevel === AccessLevel.RESTRICTED ? 'text-orange-900' : 'text-gray-700'}`}>Restricted</span>
                    </div>
                    <p className="text-xs text-gray-500">Users must request access. You approve who can view.</p>
                  </button>
                </div>
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
                        <button
                          onClick={() => handleMarkFileDeleted(file.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                        <span className="truncate flex items-center gap-2"><FileIcon className="w-4 h-4 text-blue-500" /> {f.name}</span>
                        <button onClick={() => removeSelectedFile(i)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
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

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                {isSubmitting ? 'Saving...' : (modalMode === 'CREATE' ? 'Create Vault' : 'Save Changes')}
              </button>
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
                  {managingVault.requests.map((req) => (
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

    </div>
  );
};