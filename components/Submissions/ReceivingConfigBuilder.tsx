import React, { useState } from 'react';
import { 
    Plus, 
    Trash2, 
    Type, 
    Mail, 
    Hash, 
    Phone, 
    Check, 
    FileText, 
    Settings2, 
    Info, 
    AlertCircle,
    ChevronDown,
    Shield
} from 'lucide-react';
import { ReceivingConfig, FormField, FileRequest } from '../../types';

interface ReceivingConfigBuilderProps {
    config: ReceivingConfig;
    onChange: (newConfig: ReceivingConfig) => void;
}

const COMMON_EXTENSIONS = ['pdf', 'zip', 'jpg', 'png', 'docx', 'xlsx', 'txt', 'exe', 'pptx'];

export const ReceivingConfigBuilder: React.FC<ReceivingConfigBuilderProps> = ({ config, onChange }) => {
    const [extInput, setExtInput] = useState('');

    const addExtension = (ext: string) => {
        const clean = ext.toLowerCase().trim().replace('.', '');
        if (clean && !config.allowedFileTypes.includes(clean)) {
            onChange({ ...config, allowedFileTypes: [...config.allowedFileTypes, clean] });
        }
        setExtInput('');
    };

    const removeExtension = (ext: string) => {
        onChange({ ...config, allowedFileTypes: config.allowedFileTypes.filter(e => e !== ext) });
    };

    const addField = () => {
        const newField: FormField = { label: 'New Field', type: 'text', required: true };
        onChange({ ...config, formFields: [...config.formFields, newField] });
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const newFields = [...config.formFields];
        newFields[index] = { ...newFields[index], ...updates };
        onChange({ ...config, formFields: newFields });
    };

    const removeField = (index: number) => {
        onChange({ ...config, formFields: config.formFields.filter((_, i) => i !== index) });
    };

    const addFileRequest = () => {
        const newReq: FileRequest = { label: 'Requested File', fileType: 'PDF', required: true };
        onChange({ ...config, fileRequests: [...config.fileRequests, newReq] });
    };

    const updateFileRequest = (index: number, updates: Partial<FileRequest>) => {
        const newReqs = [...config.fileRequests];
        newReqs[index] = { ...newReqs[index], ...updates };
        onChange({ ...config, fileRequests: newReqs });
    };

    const removeFileRequest = (index: number) => {
        onChange({ ...config, fileRequests: config.fileRequests.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Allowed File Types */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600">
                        <Settings2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">File Restrictions</h4>
                        <p className="text-xs text-gray-500">Specify exactly what visitors can upload</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Allowed Extensions</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {config.allowedFileTypes.map(ext => (
                                <span key={ext} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-bold text-primary-600">
                                    .{ext}
                                    <button onClick={() => removeExtension(ext)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="e.g. pdf, zip"
                                className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2 text-sm focus:border-primary-500 outline-none transition-all"
                                value={extInput}
                                onChange={(e) => setExtInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addExtension(extInput)}
                            />
                            <button onClick={() => addExtension(extInput)} className="bg-primary-600 text-white px-4 rounded-xl font-bold text-sm"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase mr-2 mt-1">Quick Add:</span>
                            {COMMON_EXTENSIONS.filter(e => !config.allowedFileTypes.includes(e)).slice(0, 6).map(ext => (
                                <button key={ext} onClick={() => addExtension(ext)} className="text-[10px] font-black text-gray-500 hover:text-primary-600 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">.{ext}</button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Min Files</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2 text-sm"
                                value={config.minFiles}
                                onChange={(e) => onChange({ ...config, minFiles: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Max Files</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2 text-sm"
                                value={config.maxFiles}
                                onChange={(e) => onChange({ ...config, maxFiles: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                            <Type className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Information Fields</h4>
                            <p className="text-xs text-gray-500">Details visitors must provide</p>
                        </div>
                    </div>
                    <button onClick={addField} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-primary-600 hover:text-white transition-all">
                        <Plus className="w-3 h-3" /> Add Field
                    </button>
                </div>

                <div className="space-y-3">
                    {config.formFields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 animate-in slide-in-from-left-2 duration-200">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    className="w-full bg-transparent font-bold text-sm outline-none text-gray-900 dark:text-white"
                                    value={field.label}
                                    onChange={(e) => updateField(idx, { label: e.target.value })}
                                />
                                <div className="flex items-center gap-3 mt-1">
                                    <select
                                        className="bg-transparent text-[10px] font-black uppercase text-gray-400 border-none outline-none focus:text-primary-500"
                                        value={field.type}
                                        onChange={(e) => updateField(idx, { type: e.target.value as any })}
                                    >
                                        <option value="text">Short Text</option>
                                        <option value="email">Email</option>
                                        <option value="tel">Phone</option>
                                        <option value="number">Number</option>
                                    </select>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-3 h-3 rounded text-primary-600 focus:ring-0"
                                            checked={field.required}
                                            onChange={(e) => updateField(idx, { required: e.target.checked })}
                                        />
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Required</span>
                                    </label>
                                </div>
                            </div>
                            <button onClick={() => removeField(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {config.formFields.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No fields added</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Specific File Requests */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Requested Objects</h4>
                            <p className="text-xs text-gray-500">Specific items like "Assignment 1 PDF"</p>
                        </div>
                    </div>
                    <button onClick={addFileRequest} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-emerald-600 hover:text-white transition-all">
                        <Plus className="w-3 h-3" /> Add Request
                    </button>
                </div>

                <div className="space-y-3">
                    {config.fileRequests.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 animate-in slide-in-from-left-2 duration-200">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    className="w-full bg-transparent font-bold text-sm outline-none text-gray-900 dark:text-white"
                                    value={req.label}
                                    onChange={(e) => updateFileRequest(idx, { label: e.target.value })}
                                />
                                <div className="flex items-center gap-3 mt-1">
                                    <select
                                        className="bg-transparent text-[10px] font-black uppercase text-gray-400 border-none outline-none focus:text-emerald-500"
                                        value={req.fileType}
                                        onChange={(e) => updateFileRequest(idx, { fileType: e.target.value })}
                                    >
                                        <option value="PDF">PDF Document</option>
                                        <option value="ZIP">ZIP Archive</option>
                                        <option value="IMAGE">Image</option>
                                        <option value="ANY">Any File</option>
                                    </select>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-3 h-3 rounded text-emerald-600 focus:ring-0"
                                            checked={req.required}
                                            onChange={(e) => updateFileRequest(idx, { required: e.target.checked })}
                                        />
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Required</span>
                                    </label>
                                </div>
                            </div>
                            <button onClick={() => removeFileRequest(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {config.fileRequests.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No specific file requests</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Post-Submission */}
            <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Shield className="w-5 h-5 text-primary-400" />
                    </div>
                    <h4 className="font-bold">Post-Submission Experience</h4>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Thank You Message</label>
                    <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm ring-primary-500 focus:ring-2 outline-none transition-all placeholder:text-gray-600"
                        rows={3}
                        placeholder="e.g. Thank you for submitting your assignment!"
                        value={config.thankYouMessage}
                        onChange={(e) => onChange({ ...config, thankYouMessage: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
};
