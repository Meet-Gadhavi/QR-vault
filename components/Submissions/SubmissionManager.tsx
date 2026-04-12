import React, { useState, useEffect } from 'react';
import { 
    Download, 
    FileText, 
    User, 
    Calendar, 
    ExternalLink, 
    ChevronRight, 
    ChevronDown,
    Loader2,
    Inbox,
    Trash2,
    Share2,
    Info
} from 'lucide-react';
import { Submission, Vault } from '../../types';
import { mockService } from '../../services/mockService';

interface SubmissionManagerProps {
    vault: Vault;
}

export const SubmissionManager: React.FC<SubmissionManagerProps> = ({ vault }) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const data = await mockService.getSubmissions(vault.id);
                setSubmissions(data);
            } catch (err) {
                console.error("Failed to fetch submissions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [vault.id]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessing Submissions...</p>
            </div>
        );
    }

    if (submissions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600">
                    <Inbox className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">No Submissions Yet</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Share the vault link or QR code to start receiving files.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar px-1">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-[#0a0a0b] py-2 z-10 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">{submissions.length} Total Entries</span>
                <button className="text-[10px] font-black text-gray-400 hover:text-primary-500 uppercase flex items-center gap-1 transition-colors">
                    <Download className="w-3 h-3" /> Export All
                </button>
            </div>

            {submissions.map((sub, idx) => (
                <div key={sub.id} className="group animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div 
                        onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${expandedId === sub.id ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-500/30' : 'bg-white dark:bg-black/40 border-gray-100 dark:border-white/5 hover:border-primary-500/20 shadow-sm'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary-500 transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                        {sub.senderData['Full Name'] || sub.senderData['Name'] || `Submission #${submissions.length - idx}`}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                            {new Date(sub.createdAt).toLocaleDateString()} at {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-tighter">{(sub as any).files?.length || sub.fileIds.length} Assets</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{formatBytes((sub as any).files?.reduce((acc: number, f: any) => acc + f.size, 0) || 0)}</p>
                                </div>
                                {expandedId === sub.id ? <ChevronDown className="w-4 h-4 text-primary-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            </div>
                        </div>

                        {expandedId === sub.id && (
                            <div className="mt-6 pt-6 border-t border-primary-500/10 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Metadata grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(sub.senderData).map(([key, val]) => (
                                        <div key={key}>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{key}</p>
                                            <p className="text-[10px] font-bold text-gray-900 dark:text-white bg-white dark:bg-black/40 border border-gray-100 dark:border-white/5 p-2 rounded-lg truncate">{val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Files linked to submission */}
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black text-primary-500 uppercase tracking-widest mb-2">Transmitted Assets</p>
                                    {(sub as any).files?.map((file: any) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl group/file hover:border-primary-500/30 transition-all">
                                            <div className="flex items-center gap-3 truncate">
                                                <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-400">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase truncate">{file.name}</p>
                                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{formatBytes(file.size)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a 
                                                    href={file.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded-lg transition-all"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                     <button className="flex-1 bg-primary-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
                                         <Download className="w-3 h-3" /> Get ZIP Archive
                                     </button>
                                     <button className="p-3 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl hover:text-red-500 transition-colors">
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
