import React from 'react';
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
    UserX
} from 'lucide-react';
import { AccessLevel, RequestStatus, Vault, VaultFile, FileType } from '../types';

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
}) => {
    return (
        <>
            {/* Create / Edit Vault Modal */}
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
                                        {existingFiles.map((file) => (
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
                                        ref={fileInputRef as React.LegacyRef<HTMLInputElement>}
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
            {isLimitModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-900">Vault Limit Reached</h2>
                            <button onClick={() => setIsLimitModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="text-gray-500 w-5 h-5" /></button>
                        </div>
                        <div className="p-6 text-center">
                            <div className="bg-amber-100 text-amber-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8" />
                            </div>
                            <p className="text-gray-700 font-medium mb-2">Free subscription only can make 2 vaults</p>
                            <p className="text-sm text-gray-500 mb-6 font-medium max-w-[240px] mx-auto">for more go for Plus/Pro plans</p>
                            <div className="flex flex-col gap-3">
                                <Link to="/pricing" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95" onClick={() => setIsLimitModalOpen(false)}>
                                    Go to Plans
                                </Link>
                                <button onClick={() => setIsLimitModalOpen(false)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition-all">
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
        </>
    );
};
