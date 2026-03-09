import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockService } from './services/mockService';
import { Vault, User, PlanType, VaultFile, FileType, PLAN_LIMITS, AccessLevel, AccessRequest, RequestStatus, Invoice } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import QRCode from 'react-qr-code';
import { UploadCloud, File as FileIcon, Link as LinkIcon, Trash2, ExternalLink, Plus, X, Loader2, Eye, HardDrive, QrCode, Copy, Check, MoreVertical, Edit2, Search, Filter, ArrowUpDown, Download, Zap, ChevronDown, Lock, Users, Shield, UserCheck, UserX, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { VaultModals } from './components/VaultModals';

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
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  // Google Drive State
  const [googleTokens, setGoogleTokens] = useState<any>(null);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<any[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [driveStorageUsed, setDriveStorageUsed] = useState(0);

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
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
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
    const h = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${inv.id}</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box }
            body { font-family:sans-serif; padding:40px; color:#333; background:#fff }
            .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; border-bottom:3px solid #7c3aed; padding-bottom:20px }
            .logo { font-size:28px; font-weight:800; color:#7c3aed }
            .logo span { color:#333 }
            .invoice-info { text-align:right; font-size:13px; color:#888 }
            .invoice-info h2 { font-size:22px; color:#333; margin-bottom:4px }
            .details { display:flex; justify-content:space-between; margin-bottom:40px }
            .details .col h4 { font-size:11px; text-transform:uppercase; color:#999; letter-spacing:1px; margin-bottom:8px }
            .details .col p { font-size:14px; color:#333; margin-bottom:4px }
            table { width:100%; border-collapse:collapse; margin-bottom:30px }
            th { background:#f5f3ff; color:#7c3aed; text-align:left; padding:12px 16px; font-size:12px; text-transform:uppercase; letter-spacing:.5px }
            td { padding:14px 16px; border-bottom:1px solid #eee; font-size:14px }
            .total-row td { font-weight:700; font-size:16px; border-top:2px solid #7c3aed; border-bottom:none }
            .footer { text-align:center; margin-top:40px; padding-top:20px; border-top:1px solid #eee; color:#999; font-size:12px }
            .paid-stamp { display:inline-block; border:3px solid #22c55e; color:#22c55e; padding:4px 20px; border-radius:8px; font-size:18px; font-weight:800; text-transform:uppercase; transform:rotate(-5deg); margin-left:20px }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo"><span>QR</span> Vault</div>
              <p style="font-size:13px;color:#888;margin-top:4px">Secure File Storage & Sharing</p>
            </div>
            <div class="invoice-info">
              <h2>INVOICE</h2>
              <p>${inv.id}</p>
              <p>${inv.date}</p>
            </div>
          </div>
          <div class="details">
            <div class="col">
              <h4>Billed To</h4>
              <p>${appUser?.email || 'N/A'}</p>
            </div>
            <div class="col" style="text-align:right">
              <h4>Plan Details</h4>
              <p>${inv.plan} Plan - Monthly</p>
              <p>Valid until: ${inv.expiry}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th style="text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${inv.plan} Plan — Monthly Subscription</td>
                <td>1</td>
                <td style="text-align:right">₹${inv.amount}.00</td>
              </tr>
              <tr class="total-row">
                <td colspan="2">Total</td>
                <td style="text-align:right">₹${inv.amount}.00</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-bottom:30px">
            <span class="paid-stamp">✓ PAID</span>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p style="margin-top:4px">QR Vault — Created by Mazelabs</p>
          </div>
        </body>
      </html>
    `;
    const w = window.open('', '_blank');
    if (w) { w.document.write(h); w.document.close(); setTimeout(() => w.print(), 500); }
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

  // --- Actions ---
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

    const getVaultSize = (v: Vault) => v.files.reduce((acc: number, f: VaultFile) => acc + f.size, 0);

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
    if (appUser?.plan === PlanType.FREE && vaults.length >= 2) {
      setIsLimitModalOpen(true);
      return;
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
    const updatedVault = updatedVaults.find((v: Vault) => v.id === vaultId);
    if (updatedVault) setManagingVault(updatedVault);
  };

  const uploadFileToDrive = async (file: File, folderId: string) => {
    const isDev = window.location.hostname === 'localhost';
    const apiBaseUrlFallback = isDev ? 'http://localhost:3000' : 'https://qr-vault-2008.onrender.com';
    const apiBase = import.meta.env.VITE_API_URL || apiBaseUrlFallback;
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
    const isDev = window.location.hostname === 'localhost';
    const apiBaseUrlFallback = isDev ? 'http://localhost:3000' : 'https://qr-vault-2008.onrender.com';
    const apiBase = import.meta.env.VITE_API_URL || apiBaseUrlFallback;

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
      if (googleTokens && (appUser.plan === PlanType.PRO || appUser.plan === PlanType.STARTER)) {
        alert("Please clean your google drive to make more vaults");
      } else {
        alert(`Note: ${e.message}`);
      }
    } finally {
      await loadData(appUser.id);
      setIsSubmitting(false);

      // Auto-save metadata (and QR) to Google Drive if connected
      if (success && googleTokens) {
        try {
          const updatedVaults = await mockService.getVaults(appUser.id);
          const latestVault = updatedVaults.sort((a: Vault, b: Vault) =>
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

  // --- Form ---
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
      const isDev = window.location.hostname === 'localhost';
      const apiBaseUrlFallback = isDev ? 'http://localhost:3000' : 'https://qr-vault-2008.onrender.com';
      const apiBase = import.meta.env.VITE_API_URL || apiBaseUrlFallback;
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
      const isDev = window.location.hostname === 'localhost';
      const apiBaseUrlFallback = isDev ? 'http://localhost:3000' : 'https://qr-vault-2008.onrender.com';
      const apiBase = import.meta.env.VITE_API_URL || apiBaseUrlFallback;
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
      const isDev = window.location.hostname === 'localhost';
      const apiBaseUrlFallback = isDev ? 'http://localhost:3000' : 'https://qr-vault-2008.onrender.com';
      const apiBase = import.meta.env.VITE_API_URL || apiBaseUrlFallback;
      const res = await fetch(`${apiBase}/api/google-drive/storage-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens }),
      });
      if (res.ok) {
        const data = await res.json();
        setDriveStorageUsed(data.totalBytes || 0);
      }
    } catch (err) {
      console.error('Failed to fetch Drive storage usage', err);
    }
  };

  const saveVaultToDrive = async (vault: Vault) => {
    if (!googleTokens) return;
    const isDev = window.location.hostname === 'localhost';
    const apiBaseUrlFallback = isDev ? 'http://localhost:3000' : 'https://qr-vault-2008.onrender.com';
    const apiBase = import.meta.env.VITE_API_URL || apiBaseUrlFallback;

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
    return (vault.requests || []).filter((r: AccessRequest) => r.status === RequestStatus.PENDING).length;
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
                      title="Disconnect Drive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 relative z-10">
              <button
                onClick={openCreateModal}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-200 transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-5 h-5" /> Create New Vault
              </button>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{vaults.length}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Vaults</p>
                </div>
                <div className="w-px h-10 bg-gray-100" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{vaults.reduce((acc, v) => acc + v.views, 0)}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Views</p>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary-50 rounded-full opacity-50 blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -top-12 w-48 h-48 bg-blue-50 rounded-full opacity-50 blur-3xl pointer-events-none" />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Storage Status</h3>
            <div className="h-40 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold text-gray-900">{Math.round((storageUsedDisplay / appUser.storageLimit) * 100)}%</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Used</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Capacity</span>
                <span className="font-bold text-gray-900">{formatBytes(appUser.storageLimit)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Used Space</span>
                <span className={`font-bold ${isOverLimit ? 'text-red-600' : 'text-primary-600'}`}>{formatBytes(storageUsedDisplay)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Invoices Tab */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search vaults by name..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              <button
                onClick={() => setFilterTime('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTime === 'all' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterTime('10-days')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTime === '10-days' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Recent
              </button>
            </div>

            <div className="relative group/sort">
              <select
                className="appearance-none bg-white pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none shadow-sm cursor-pointer"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
              >
                <option value="date-newest">Date (Newest)</option>
                <option value="date-oldest">Date (Oldest)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="size-desc">Size (Large)</option>
                <option value="size-asc">Size (Small)</option>
              </select>
              <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Vaults Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVaults.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 bg-white py-20 rounded-3xl border-2 border-dashed border-gray-200 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <HardDrive className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No Vaults Found</h3>
              <p className="text-gray-500 mt-2">Start by creating your first secure vault.</p>
              <button onClick={openCreateModal} className="mt-6 text-primary-600 font-bold hover:underline flex items-center gap-2 mx-auto">
                <Plus className="w-5 h-5" /> Create Now
              </button>
            </div>
          ) : (
            <>
              {filteredVaults.map((vault) => (
                <div
                  key={vault.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all group overflow-hidden"
                  onClick={() => navigate(`/v/${vault.id}`)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex h-12 w-12 bg-primary-50 rounded-xl items-center justify-center group-hover:bg-primary-600 transition-colors">
                        <HardDrive className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => toggleMenu(e, vault.id)}
                          className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${menuOpenId === vault.id ? 'bg-gray-100' : ''}`}
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                        {menuOpenId === vault.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <button onClick={(e) => openEditModal(vault, e)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <Edit2 className="w-4 h-4" /> Edit Vault
                            </button>
                            {vault.accessLevel === AccessLevel.RESTRICTED && (
                              <button onClick={(e) => openManageAccess(vault, e)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                <div className="relative">
                                  <Users className="w-4 h-4" />
                                  {getPendingRequestCount(vault) > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
                                  )}
                                </div>
                                Manage Access
                                {getPendingRequestCount(vault) > 0 && (
                                  <span className="ml-auto bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {getPendingRequestCount(vault)}
                                  </span>
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setViewQrVault(vault); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <QrCode className="w-4 h-4" /> View QR Code
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={(e) => handleDeleteVault(vault.id, e)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                              <Trash2 className="w-4 h-4" /> Delete Vault
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-primary-600 transition-colors truncate">{vault.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <span>{vault.files.length} Files</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>{formatBytes(vault.files.reduce((acc: number, f: VaultFile) => acc + f.size, 0))}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-700">{vault.views} <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Views</span></span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider ${vault.accessLevel === AccessLevel.RESTRICTED ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                        {vault.accessLevel || AccessLevel.PUBLIC}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Ad Placeholders for Free/Plus users */}
              {(appUser.plan === PlanType.FREE || appUser.plan === PlanType.STARTER) && (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">Upgrade to PRO</h3>
                    <p className="text-xs text-indigo-100 opacity-80 leading-relaxed mb-6">Unleash the full power of QR Vault.</p>
                    <Link to="/pricing" className="block w-full text-center py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                      Learn More
                    </Link>
                    <p className="text-xs text-gray-500 mt-2 max-w-[160px]">Upgrade to <span className="text-primary-600 font-bold">PRO</span> to remove advertisements and unlock 20GB storage!</p>
                  </div>
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Invoice Section Tab */}
        {invoices.length > 0 && (
          <div className="mt-16 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Billing History</h2>
                <p className="text-sm text-gray-500">Your recent subscription invoices.</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-primary-500 opacity-20" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Invoice ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{inv.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{inv.date}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{inv.plan}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">₹{inv.amount}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => downloadInvoice(inv)} className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Global Modals */}
      <VaultModals
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalMode={modalMode}
        vaultName={vaultName}
        setVaultName={setVaultName}
        accessLevel={accessLevel}
        setAccessLevel={setAccessLevel}
        selectedFiles={selectedFiles}
        removeSelectedFile={removeSelectedFile}
        links={links}
        removeLink={removeLink}
        tempLink={tempLink}
        setTempLink={setTempLink}
        addLink={addLink}
        existingFiles={existingFiles}
        handleMarkFileDeleted={handleMarkFileDeleted}
        isSubmitting={isSubmitting}
        handleSubmit={handleSubmit}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        isDragging={isDragging}
        isAccessModalOpen={isAccessModalOpen}
        setIsAccessModalOpen={setIsAccessModalOpen}
        managingVault={managingVault}
        handleAccessResolution={handleAccessResolution}
        viewQrVault={viewQrVault}
        setViewQrVault={setViewQrVault}
        getQrUrl={getQrUrl}
        downloadQrCode={downloadQrCode}
        copyToClipboard={copyToClipboard}
        copied={copied}
        isLimitModalOpen={isLimitModalOpen}
        setIsLimitModalOpen={setIsLimitModalOpen}
      />

    </div>
  );
};
