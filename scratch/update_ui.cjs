const fs = require('fs');

// 1. Dashboard.tsx
let dashboard = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

// Add settings button to existingFiles
dashboard = dashboard.replace(
  /<button onClick=\{\(e\) => \{ e\.stopPropagation\(\); handleMarkFileDeleted\(f\.id\); \}\} className="p-2\.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900\/30 rounded-xl transition-all"><X className="w-4 h-4" \/><\/button>/g,
  '<button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedFileForSettings({ type: \'EXISTING\', index: (f as any).id }); }} className="p-2.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all"><Settings2 className="w-4 h-4" /></button>\n                                    $&'
);

// Add settings button to selectedFiles
dashboard = dashboard.replace(
  /<button onClick=\{\(e\) => \{ e\.stopPropagation\(\); removeSelectedFile\(i\); \}\} className="p-2\.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900\/30 rounded-xl transition-all"><X className="w-4 h-4" \/><\/button>/g,
  '<button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedFileForSettings({ type: \'NEW\', index: i }); }} className="p-2.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all"><Settings2 className="w-4 h-4" /></button>\n                                    $&'
);

// Premium Vault selector - Dashboard
dashboard = dashboard.replace(
  /<div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mx-8 sm:mx-10 mt-6 mb-2">\s*<button\s*type="button"\s*onClick=\{\(\) => setVaultType\(VaultType\.SENDING\)\}\s*className=\{`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-\[10px\] font-black uppercase tracking-widest transition-all \$\{vaultType === VaultType\.SENDING \? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'\}`\}\s*>\s*<Send className="w-4 h-4" \/> Sharing Mode\s*<\/button>\s*<button\s*type="button"\s*onClick=\{\(\) => setVaultType\(VaultType\.RECEIVING\)\}\s*className=\{`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-\[10px\] font-black uppercase tracking-widest transition-all \$\{vaultType === VaultType\.RECEIVING \? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'\}`\}\s*>\s*<Inbox className="w-4 h-4" \/> Collection Mode\s*<\/button>\s*<\/div>/g,
  `{/* Premium Vault Mode Selector */}
              <div className="flex bg-gray-100/80 dark:bg-[#0a0a0a] rounded-2xl border border-gray-200/50 dark:border-white/5 mx-8 sm:mx-10 mt-6 mb-2 p-1.5 relative shadow-inner">
                {/* Animated Background Pill */}
                <div 
                  className={\`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 transition-transform duration-500 ease-out pointer-events-none z-0 \${vaultType === VaultType.RECEIVING ? 'translate-x-[calc(100%+0.375rem)]' : 'translate-x-0'}\`} 
                />
                
                <button
                  type="button"
                  onClick={() => setVaultType(VaultType.SENDING)}
                  className={\`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-300 z-10 \${vaultType === VaultType.SENDING ? 'text-primary-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}\`}
                >
                  <Send className="w-4 h-4" /> Sharing Mode
                </button>
                <button
                  type="button"
                  onClick={() => setVaultType(VaultType.RECEIVING)}
                  className={\`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-300 z-10 \${vaultType === VaultType.RECEIVING ? 'text-primary-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}\`}
                >
                  <Inbox className="w-4 h-4" /> Collective Mode
                </button>
              </div>`
);

// Dashboard select replacement
dashboard = dashboard.replace(
  /<select\s*disabled=\{appUser\?\.plan === PlanType\.FREE\}\s*value=\{fileSettings\[selectedFileForSettings\.type === 'NEW' \? selectedFileForSettings\.index : selectedFileForSettings\.index as any\]\?\.deleteAfterMinutes \|\| ''\}\s*onChange=\{\(e\) => \{\s*const val = e\.target\.value === '' \? undefined : parseInt\(e\.target\.value\);\s*const key = selectedFileForSettings\.type === 'NEW' \? selectedFileForSettings\.index : selectedFileForSettings\.index as any;\s*setFileSettings\(\{ \.\.\.fileSettings, \[key\]: \{ \.\.\.fileSettings\[key\], deleteAfterMinutes: val \} \}\);\s*\}\}\s*className=\{`w-full bg-white dark:bg-black\/60 dark:text-white border border-gray-200 dark:border-white\/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-sm appearance-none \$\{appUser\?\.plan === PlanType\.FREE \? 'opacity-50 cursor-not-allowed' : ''\}`\}\s*>\s*<option className="dark:bg-gray-900" value="">Never vanish<\/option>\s*<option className="dark:bg-gray-900" value="1">1 Minute after opening<\/option>\s*<option className="dark:bg-gray-900" value="5">5 Minutes after opening<\/option>\s*<option className="dark:bg-gray-900" value="60">1 Hour after opening<\/option>\s*<option className="dark:bg-gray-900" value="1440">24 Hours after opening<\/option>\s*<\/select>/g,
  `<div className="relative">
                        <select
                          disabled={appUser?.plan === PlanType.FREE}
                          value={fileSettings[selectedFileForSettings.type === 'NEW' ? selectedFileForSettings.index : selectedFileForSettings.index as any]?.deleteAfterMinutes || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                            const key = selectedFileForSettings.type === 'NEW' ? selectedFileForSettings.index : selectedFileForSettings.index as any;
                            setFileSettings({ ...fileSettings, [key]: { ...fileSettings[key], deleteAfterMinutes: val } });
                          }}
                          className={\`w-full bg-white dark:bg-black/80 dark:text-white border border-gray-200 dark:border-white/10 rounded-2xl pl-5 pr-12 py-4 outline-none focus:ring-4 focus:ring-primary-500/20 transition-all font-bold text-sm appearance-none shadow-sm hover:border-gray-300 dark:hover:border-white/20 \${appUser?.plan === PlanType.FREE ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}\`}
                        >
                          <option className="dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="">Never vanish</option>
                          <option className="dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="1">1 Minute after opening</option>
                          <option className="dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="5">5 Minutes after opening</option>
                          <option className="dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="60">1 Hour after opening</option>
                          <option className="dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="1440">24 Hours after opening</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>`
);

fs.writeFileSync('pages/Dashboard.tsx', dashboard);

// 2. ReceivingConfigBuilder.tsx fixes
let rcb = fs.readFileSync('components/Submissions/ReceivingConfigBuilder.tsx', 'utf8');

// The field type dropdown
rcb = rcb.replace(
  /<select\s*className="bg-transparent text-\[10px\] font-black uppercase text-gray-400 border-none outline-none focus:text-primary-500"\s*value=\{field\.type\}\s*onChange=\{\(e\) => updateField\(idx, \{ type: e\.target\.value as any \}\)\}\s*>\s*<option value="text">Short Text<\/option>\s*<option value="email">Email<\/option>\s*<option value="tel">Phone<\/option>\s*<option value="number">Number<\/option>\s*<\/select>/g,
  `<div className="relative ml-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
                                        <select
                                            className="bg-transparent text-[10px] font-black uppercase text-gray-500 border-none outline-none focus:text-primary-600 dark:focus:text-primary-400 appearance-none pl-3 pr-7 py-1 cursor-pointer focus:ring-2 focus:ring-primary-500/20 rounded-md"
                                            value={field.type}
                                            onChange={(e) => updateField(idx, { type: e.target.value as any })}
                                        >
                                            <option value="text">Short Text</option>
                                            <option value="email">Email</option>
                                            <option value="tel">Phone</option>
                                            <option value="number">Number</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-gray-400" />
                                    </div>`
);

// The file request type dropdown
rcb = rcb.replace(
  /<select\s*className="bg-transparent text-\[10px\] font-black uppercase text-gray-400 border-none outline-none focus:text-emerald-500"\s*value=\{req\.fileType\}\s*onChange=\{\(e\) => updateFileRequest\(idx, \{ fileType: e\.target\.value \}\)\}\s*>\s*<option value="PDF">PDF Document<\/option>\s*<option value="ZIP">ZIP Archive<\/option>\s*<option value="IMAGE">Image<\/option>\s*<option value="ANY">Any File<\/option>\s*<\/select>/g,
  `<div className="relative ml-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-0.5 border border-emerald-100 dark:border-emerald-900/30">
                                        <select
                                            className="bg-transparent text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 border-none outline-none appearance-none pl-3 pr-7 py-1 cursor-pointer rounded-md focus:ring-2 focus:ring-emerald-500/20"
                                            value={req.fileType}
                                            onChange={(e) => updateFileRequest(idx, { fileType: e.target.value })}
                                        >
                                            <option value="PDF">PDF Document</option>
                                            <option value="ZIP">ZIP Archive</option>
                                            <option value="IMAGE">Image</option>
                                            <option value="ANY">Any File</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-emerald-500/50" />
                                    </div>`
);

fs.writeFileSync('components/Submissions/ReceivingConfigBuilder.tsx', rcb);

// 3. VaultModals.tsx fixes
let vaultModals = fs.readFileSync('components/VaultModals.tsx', 'utf8');

// Premium Vault selector - VaultModals
vaultModals = vaultModals.replace(
  /<div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">\s*<button\s*type="button"\s*onClick=\{\(\) => setVaultType\(VaultType\.SENDING\)\}\s*className=\{`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all \$\{vaultType === VaultType\.SENDING \? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'\}`\}\s*>\s*<Send className="w-4 h-4" \/> Sharing Mode\s*<\/button>\s*<button\s*type="button"\s*onClick=\{\(\) => setVaultType\(VaultType\.RECEIVING\)\}\s*className=\{`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all \$\{vaultType === VaultType\.RECEIVING \? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'\}`\}\s*>\s*<Inbox className="w-4 h-4" \/> Collection Mode\s*<\/button>\s*<\/div>/g,
  `<div className="flex bg-gray-100/80 dark:bg-[#0a0a0a] rounded-2xl border border-gray-200/50 dark:border-white/5 p-1.5 relative shadow-inner">
                                <div 
                                    className={\`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 transition-transform duration-500 ease-out pointer-events-none z-0 \${vaultType === VaultType.RECEIVING ? 'translate-x-[calc(100%+0.375rem)]' : 'translate-x-0'}\`} 
                                />
                                <button
                                    type="button"
                                    onClick={() => setVaultType(VaultType.SENDING)}
                                    className={\`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors duration-300 z-10 \${vaultType === VaultType.SENDING ? 'text-primary-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}\`}
                                >
                                    <Send className="w-4 h-4" /> Sharing Mode
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVaultType(VaultType.RECEIVING)}
                                    className={\`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors duration-300 z-10 \${vaultType === VaultType.RECEIVING ? 'text-primary-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}\`}
                                >
                                    <Inbox className="w-4 h-4" /> Collection Mode
                                </button>
                            </div>`
);

fs.writeFileSync('components/VaultModals.tsx', vaultModals);

console.log("Finished modifications.");
