import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
    Users,
    Shield,
    Trash2,
    UploadCloud,
    File as FileIcon,
    Link as LinkIcon,
    X,
    Check,
    Copy,
    Download,
    Loader2,
    Lock,
    UserCheck,
    UserX,
    Send,
    Inbox,
    Info
} from 'lucide-react';
import { AccessLevel, RequestStatus, Vault, VaultFile, FileType, VaultType, ReceivingConfig } from '../types';
import { ReceivingConfigBuilder } from './Submissions/ReceivingConfigBuilder';

interface VaultModalsProps {
    isModalOpen: boolean;
    setIsModalOpen: (val: boolean) => void;
    modalMode: 'CREATE' | 'EDIT';
    vaultName: string;
    setVaultName: (val: string) => void;
    accessLevel: AccessLevel;
    setAccessLevel: (val: AccessLevel) => void;
    selectedFiles: File[];
    removeSelectedFile: (idx: number) => void;
    links: string[];
    removeLink: (idx: number) => void;
    tempLink: string;
    setTempLink: (val: string) => void;
    addLink: () => void;
    existingFiles: VaultFile[];
    handleMarkFileDeleted: (id: string) => void;
    isSubmitting: boolean;
    handleSubmit: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    isDragging: boolean;
    isAccessModalOpen: boolean;
    setIsAccessModalOpen: (val: boolean) => void;
    managingVault: Vault | null;
    handleAccessResolution: (vaultId: string, reqId: string, status: RequestStatus) => void;
    viewQrVault: Vault | null;
    setViewQrVault: (v: Vault | null) => void;
    getQrUrl: (v: Vault) => string;
    downloadQrCode: () => void;
    copyToClipboard: (text: string) => void;
    copied: boolean;
    isLimitModalOpen: boolean;
    setIsLimitModalOpen: (val: boolean) => void;
    vaultType: VaultType;
    setVaultType: (val: VaultType) => void;
    receivingConfig: ReceivingConfig;
    setReceivingConfig: (val: ReceivingConfig) => void;
}

export const VaultModals: React.FC<VaultModalsProps> = ({
    isModalOpen,
    setIsModalOpen,
    modalMode,
    vaultName,
    setVaultName,
    accessLevel,
    setAccessLevel,
    selectedFiles,
    removeSelectedFile,
    links,
    removeLink,
    tempLink,
    setTempLink,
    addLink,
    existingFiles,
    handleMarkFileDeleted,
    isSubmitting,
    handleSubmit,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging,
    isAccessModalOpen,
    setIsAccessModalOpen,
    managingVault,
    handleAccessResolution,
    viewQrVault,
    setViewQrVault,
    getQrUrl,
    downloadQrCode,
    copyToClipboard,
    copied,
    isLimitModalOpen,
    setIsLimitModalOpen,
    vaultType,
    setVaultType,
    receivingConfig,
    setReceivingConfig,
}) => {
    // Scroll Lock Logic
    useEffect(() => {
        const isAnyModalOpen = isModalOpen || isAccessModalOpen || !!viewQrVault || isLimitModalOpen;
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isModalOpen, isAccessModalOpen, viewQrVault, isLimitModalOpen]);

    return (
        <>
            {/* Create / Edit Vault Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-white/10">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {modalMode === 'CREATE' ? 'Create New Vault' : 'Edit Vault'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" aria-label="Close modal"><X className="text-gray-500 dark:text-gray-400 w-5 h-5" aria-hidden="true" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Vault Mode Selector */}
                            <div className="flex bg-gray-100/80 dark:bg-[#0a0a0a] rounded-2xl border border-gray-200/50 dark:border-white/5 p-1.5 relative shadow-inner">
                                <div 
                                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 transition-transform duration-500 ease-out pointer-events-none z-0 ${vaultType === VaultType.RECEIVING ? 'translate-x-[calc(100%+0.375rem)]' : 'translate-x-0'}`} 
                                />
                                <button
                                    type="button"
                                    onClick={() => setVaultType(VaultType.SENDING)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors duration-300 z-10 ${vaultType === VaultType.SENDING ? 'text-primary-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    <Send className="w-4 h-4" /> Sharing Mode
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVaultType(VaultType.RECEIVING)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors duration-300 z-10 ${vaultType === VaultType.RECEIVING ? 'text-primary-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    <Inbox className="w-4 h-4" /> Collection Mode
                                </button>
                            </div>

                            <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/20">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-primary-600 shrink-0" />
                                    <p className="text-xs text-primary-900 dark:text-primary-300 leading-relaxed font-medium">
                                        {vaultType === VaultType.SENDING 
                                            ? "Sharing Mode allows you to upload files and links for others to view and download. Perfect for portfolios, event photos, or project assets."
                                            : "Collection Mode (Drobox-style) allows visitors to upload files directly into your vault. Perfect for assignments, client documents, or mass photo collection."}
                                    </p>
                                </div>
                            </div>

                            {/* Standard Fields (Always visible) */}

                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vault Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="e.g. Project Assets, Event Photos"
                                    value={vaultName}
                                    onChange={(e) => setVaultName(e.target.value)}
                                />
                            </div>

                            {/* Access Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Control</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setAccessLevel(AccessLevel.PUBLIC)}
                                        className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${accessLevel === AccessLevel.PUBLIC ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:bg-gray-800'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Users className={`w-5 h-5 ${accessLevel === AccessLevel.PUBLIC ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                                            <span className={`font-bold ${accessLevel === AccessLevel.PUBLIC ? 'text-primary-900 dark:text-primary-100' : 'text-gray-700 dark:text-gray-300'}`}>Public</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Anyone with the link or QR code can view and download.</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAccessLevel(AccessLevel.RESTRICTED)}
                                        className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${accessLevel === AccessLevel.RESTRICTED ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:bg-gray-800'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Shield className={`w-5 h-5 ${accessLevel === AccessLevel.RESTRICTED ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`} />
                                            <span className={`font-bold ${accessLevel === AccessLevel.RESTRICTED ? 'text-orange-900 dark:text-orange-100' : 'text-gray-700 dark:text-gray-300'}`}>Restricted</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Users must request access. You approve who can view.</p>
                                    </button>
                                </div>
                            </div>

                            {vaultType === VaultType.SENDING ? (
                                <>
                                    {/* Existing Files List (Edit Mode Only) */}
                            {modalMode === 'EDIT' && existingFiles.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing Files</label>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 max-h-40 overflow-y-auto">
                                        {existingFiles.map((file) => (
                                            <div key={file.id} className="p-3 flex items-center justify-between text-sm group hover:bg-white dark:hover:bg-gray-700 transition-colors">
                                                <div className="flex items-center gap-2 truncate">
                                                    {file.type === FileType.LINK ? <LinkIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" /> : <FileIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                                                    <span className="text-gray-700 dark:text-gray-200 truncate max-w-[200px]">{file.name}</span>
                                                </div>
                                                    <button
                                                        onClick={() => handleMarkFileDeleted(file.id)}
                                                        className="text-gray-400 hover:text-red-500 p-1"
                                                        aria-label={`Delete ${file.name}`}
                                                        title="Delete File"
                                                    >
                                                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                                                    </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {modalMode === 'EDIT' ? 'Add More Files' : 'Upload Files'}
                                </label>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all relative group cursor-pointer ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 scale-[1.02]' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef as React.LegacyRef<HTMLInputElement>}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    <div className="pointer-events-none">
                                        <UploadCloud className={`w-10 h-10 mx-auto mb-2 transition-colors ${isDragging ? 'text-primary-600 dark:text-primary-400' : 'text-primary-500 dark:text-primary-500'}`} />
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                                            {isDragging ? 'Drop files here' : 'Click to upload files'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">or drag and drop here</p>
                                    </div>
                                </div>
                                {selectedFiles.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {selectedFiles.map((f, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-2 rounded-lg">
                                                <span className="truncate flex items-center gap-2"><FileIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" /> <span className="dark:text-blue-100">{f.name}</span></span>
                                                <button onClick={() => removeSelectedFile(i)} className="text-gray-400 hover:text-red-500" aria-label={`Remove ${f.name}`}><X className="w-4 h-4" aria-hidden="true" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Links Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {modalMode === 'EDIT' ? 'Add More Links' : 'Add Links (Optional)'}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        className="flex-1 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                                        placeholder="https://..."
                                        value={tempLink}
                                        onChange={(e) => setTempLink(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addLink()}
                                    />
                                    <button onClick={addLink} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 rounded-lg font-medium text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-700">Add</button>
                                </div>
                                {links.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {links.map((l, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                                                <span className="flex items-center gap-2 truncate"><LinkIcon className="w-3 h-3" /> {l}</span>
                                                <button onClick={() => removeLink(i)} className="text-gray-400 hover:text-red-500" aria-label={`Remove link ${l}`}><X className="w-3 h-3" aria-hidden="true" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                                </>
                            ) : (
                                <ReceivingConfigBuilder 
                                    config={receivingConfig}
                                    onChange={setReceivingConfig}
                                />
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
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
            {isLimitModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-white/10">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-gray-900 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vault Limit Reached</h2>
                            <button onClick={() => setIsLimitModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" aria-label="Close limit modal"><X className="text-gray-500 dark:text-gray-400 w-5 h-5" aria-hidden="true" /></button>
                        </div>
                        <div className="p-6 text-center">
                            <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-500/20">
                                <Lock className="w-8 h-8" />
                            </div>
                            <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">Free subscription only can make 2 vaults</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium max-w-[240px] mx-auto">for more go for Plus/Pro plans</p>
                            <div className="flex flex-col gap-3">
                                <Link to="/pricing" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95" onClick={() => setIsLimitModalOpen(false)}>
                                    Go to Plans
                                </Link>
                                <button onClick={() => setIsLimitModalOpen(false)} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-bold py-2.5 rounded-xl transition-all">
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
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-white/10">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-gray-900 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access Requests</h2>
                            <button onClick={() => setIsAccessModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" aria-label="Close access requests"><X className="text-gray-500 dark:text-gray-400 w-5 h-5" aria-hidden="true" /></button>
                        </div>
                        <div className="p-6">
                            {!managingVault.requests || managingVault.requests.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                    <p>No access requests yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                                    {managingVault.requests.map((req) => (
                                        <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                            <div className="overflow-hidden">
                                                <p className="font-semibold text-gray-900 dark:text-white truncate" title={req.email}>{req.email}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(req.requestedAt).toLocaleDateString()}</p>
                                                <span className={`text-xs font-bold uppercase ${req.status === RequestStatus.APPROVED ? 'text-green-600 dark:text-green-400' :
                                                    req.status === RequestStatus.REJECTED ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            {req.status === RequestStatus.PENDING && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAccessResolution(managingVault.id, req.id, RequestStatus.APPROVED)}
                                                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                        aria-label="Approve request"
                                                        title="Approve">
                                                        <UserCheck className="w-4 h-4" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAccessResolution(managingVault.id, req.id, RequestStatus.REJECTED)}
                                                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                        aria-label="Reject request"
                                                        title="Reject">
                                                        <UserX className="w-4 h-4" aria-hidden="true" />
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
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full text-center relative shadow-2xl border border-transparent dark:border-white/10">
                        <button onClick={() => setViewQrVault(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" aria-label="Close QR modal"><X className="w-5 h-5" aria-hidden="true" /></button>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-tight">{viewQrVault.name}</h3>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 inline-block shadow-inner mb-6 relative group">
                            <QRCode id="qr-code-svg" value={getQrUrl(viewQrVault)} size={200} />
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={downloadQrCode}
                                className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Download QR
                            </button>

                            <div className="flex gap-2">
                                <a
                                    href={getQrUrl(viewQrVault)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-bold text-sm hover:bg-primary-700 transition-colors shadow-sm flex items-center justify-center"
                                >
                                    Open Link
                                </a>
                                <button
                                    onClick={() => copyToClipboard(getQrUrl(viewQrVault))}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-transparent dark:border-gray-700 font-bold"
                                    aria-label="Copy vault link"
                                    title="Copy Link"
                                >
                                    {copied ? <Check className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
                                </button>
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 break-all font-medium mt-4">
                                {getQrUrl(viewQrVault)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
