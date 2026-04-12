import React, { useState, useRef } from 'react';
import { 
    UploadCloud, 
    CheckCircle2, 
    AlertCircle, 
    FileText, 
    Plus, 
    X, 
    Loader2,
    Send,
    ArrowRight
} from 'lucide-react';
import { ReceivingConfig, FormField, FileRequest, Vault } from '../../types';
import { mockService } from '../../services/mockService';

interface SubmissionPublicFormProps {
    vault: Vault;
}

export const SubmissionPublicForm: React.FC<SubmissionPublicFormProps> = ({ vault }) => {
    const config = vault.receivingConfig!;
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (selectedFiles.length + files.length > config.maxFiles) {
            setError(`Max ${config.maxFiles} files allowed.`);
            return;
        }

        // Validate extensions
        const invalid = files.find(f => {
            const ext = f.name.split('.').pop()?.toLowerCase();
            return ext && !config.allowedFileTypes.includes(ext);
        });

        if (invalid) {
            setError(`Invalid file type: ${invalid.name}. Allowed: ${config.allowedFileTypes.join(', ')}`);
            return;
        }

        setSelectedFiles(prev => [...prev, ...files]);
        setError(null);
    };

    const removeFile = (idx: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (selectedFiles.length < config.minFiles) {
            setError(`Please upload at least ${config.minFiles} files.`);
            return;
        }

        for (const field of config.formFields) {
            if (field.required && !formData[field.label]) {
                setError(`${field.label} is required.`);
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await mockService.submitToVault(vault.id, formData, selectedFiles);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-6 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">Submission Received</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed max-w-md mx-auto">
                    {config.thankYouMessage || "Your files and information have been securely delivered."}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 inline-block">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Encrypted for</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{vault.name}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-6">
            <div className="mb-12 text-center">
                <div className="inline-block px-4 py-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    Data Collection Node
                </div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">{vault.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Securely submit requested data and assets below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-6">
                    {config.formFields.map((field, idx) => (
                        <div key={idx} className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type={field.type}
                                required={field.required}
                                className="w-full px-6 py-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-black text-sm dark:text-white shadow-inner"
                                placeholder={`Enter ${field.label}...`}
                                value={formData[field.label] || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, [field.label]: e.target.value }))}
                            />
                        </div>
                    ))}
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                        Assets for Transmission ({selectedFiles.length}/{config.maxFiles})
                    </label>
                    <div
                        className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-12 text-center group hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner">
                            <UploadCloud className="w-10 h-10 text-primary-500" />
                        </div>
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Select or Drop Assets</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-bold uppercase tracking-widest">
                            Allowed: {config.allowedFileTypes.map(e => `.${e}`).join(', ')}
                        </p>

                        {/* Progress Pulse */}
                        {isSubmitting && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-300">
                                <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Transmitting Link...</p>
                            </div>
                        )}
                    </div>

                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            {selectedFiles.map((file, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 animate-in shake duration-300">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-xs font-black uppercase tracking-tight">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-primary-600 hover:text-white transition-all active:scale-[0.98] group disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Establishing Quantum Link...
                        </>
                    ) : (
                        <>
                            Commit Submission
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <footer className="mt-20 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Version 4.0 Secure</span>
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em]">End-to-End Encrypted Pipeline</p>
            </footer>
        </div>
    );
};
