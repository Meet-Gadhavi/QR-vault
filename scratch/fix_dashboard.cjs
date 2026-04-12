const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Meet\\Music\\qr-vault\\pages\\Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The problematic block in Lifecycle tab
// We need to fix the grid and the bracket balance
// We'll replace the entire Lifecycle tab content (from line ~2163 to ~2292)

const lifecycleStart = "{activeModalTab === 'lifecycle' && (";
const nextTabStart = "{activeModalTab === 'security' && (";

const startIdx = content.indexOf(lifecycleStart);
const nextIdx = content.indexOf(nextTabStart);

if (startIdx === -1 || nextIdx === -1) {
    console.error('Could not find lifecycle or security tab markers');
    process.exit(1);
}

// Find the last ")}" before "security" tab
let endIdx = content.lastIndexOf(')}', nextIdx);
if (endIdx === -1 || endIdx <= startIdx) {
     console.error('Could not find closing brackets for lifecycle tab');
     process.exit(1);
}
endIdx += 2; // Include ")}"

const originalLifecycle = content.substring(startIdx, endIdx);

// The new, clean structure for lifecycle tab
const newLifecycle = `{activeModalTab === 'lifecycle' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4">
                    {/* Expiry Lifetime */}
                    <div className="bg-white/50 dark:bg-white/[0.02] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-primary-500" />
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Vault Lifetime</span>
                      </div>
                      {(() => {
                        const expiryOptions = [
                          { value: 24, label: '24 Hours', disabled: false },
                          { value: 48, label: '48 Hours', disabled: appUser?.plan === PlanType.FREE },
                          { value: 72, label: '72 Hours', disabled: appUser?.plan === PlanType.FREE },
                          { value: 'never', label: \`Permanent\`, disabled: appUser?.plan !== PlanType.PRO },
                        ];
                        const selected = expiryOptions.find(o => o.value === expiryHours) || expiryOptions[0];
                        const isOpen = menuOpenId === 'modal-expiry';

                        return (
                          <div className="relative space-y-3">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setMenuOpenId(isOpen ? null : 'modal-expiry'); }}
                              className="w-full flex items-center justify-between px-6 py-5 rounded-2xl text-[11px] font-black transition-all bg-white dark:bg-black border border-gray-200 dark:border-gray-800 dark:text-white uppercase tracking-widest shadow-inner hover:border-primary-300"
                            >
                              {expiryHours === 'custom' ? 'Custom Hours' : selected.label}
                              <ChevronDown className={\`w-4 h-4 transition-transform duration-300 \${isOpen ? 'rotate-180 text-primary-500' : 'text-gray-400'}\`} />
                            </button>
                            {isOpen && (
                              <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {expiryOptions.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    disabled={opt.disabled}
                                    onClick={() => { setExpiryHours(opt.value); setMenuOpenId(null); }}
                                    className={\`w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors \${expiryHours === opt.value ? 'bg-primary-600 text-white' : 'hover:bg-primary-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 disabled:opacity-30'}\`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => { setExpiryHours('custom'); setMenuOpenId(null); }}
                                  className={\`w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors \${expiryHours === 'custom' ? 'bg-primary-600 text-white' : 'hover:bg-primary-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400'}\`}
                                >
                                  Custom Range
                                </button>
                              </div>
                            )}
                            {expiryHours === 'custom' && (
                              <div className="animate-in slide-in-from-top-2 duration-300">
                                <input
                                  type="number"
                                  placeholder="HOURS..."
                                  className="w-full px-6 py-5 bg-white dark:bg-black border border-primary-500/30 rounded-2xl font-black text-[11px] text-primary-600 dark:text-primary-400 outline-none shadow-inner text-center focus:ring-4 focus:ring-primary-500/10"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Scan Capacity */}
                    <div className="bg-white/50 dark:bg-white/[0.02] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-5 h-5 text-primary-500" />
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Scan Capacity</span>
                      </div>
                      {(() => {
                        const scanOptions = [
                          { value: 'none', label: 'Unlimited', disabled: appUser?.plan !== PlanType.PRO },
                          { value: 25, label: '25 Scans', disabled: false },
                          { value: 65, label: '65 Scans', disabled: appUser?.plan === PlanType.FREE },
                          { value: 125, label: '125 Scans', disabled: appUser?.plan !== PlanType.PRO },
                        ];
                        const currentValue = maxViews === null ? 'none' : maxViews;
                        const selected = scanOptions.find(o => o.value === currentValue) || scanOptions[1];
                        const isOpen = menuOpenId === 'modal-scans';

                        return (
                          <div className="relative space-y-3">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setMenuOpenId(isOpen ? null : 'modal-scans'); }}
                              className="w-full flex items-center justify-between px-6 py-5 rounded-2xl text-[11px] font-black transition-all bg-white dark:bg-black border border-gray-200 dark:border-gray-800 dark:text-white uppercase tracking-widest shadow-inner hover:border-primary-300"
                            >
                              {maxViews === 'custom' ? 'Custom Limit' : selected.label}
                              <ChevronDown className={\`w-4 h-4 transition-transform duration-300 \${isOpen ? 'rotate-180 text-primary-500' : 'text-gray-400'}\`} />
                            </button>
                            {isOpen && (
                              <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {scanOptions.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    disabled={opt.disabled}
                                    onClick={() => { setMaxViews(opt.value === 'none' ? null : Number(opt.value)); setMenuOpenId(null); }}
                                    className={\`w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors \${currentValue === opt.value ? 'bg-primary-600 text-white' : 'hover:bg-primary-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 disabled:opacity-30'}\`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  disabled={appUser?.plan !== PlanType.PRO && appUser?.plan !== PlanType.PLUS}
                                  onClick={() => { setMaxViews('custom'); setMenuOpenId(null); }}
                                  className={\`w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors \${maxViews === 'custom' ? 'bg-primary-600 text-white' : 'hover:bg-primary-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 disabled:opacity-30'}\`}
                                >
                                  Custom Limit {appUser?.plan !== PlanType.PRO && appUser?.plan !== PlanType.PLUS && ' (PLUS/PRO)'}
                                </button>
                              </div>
                            )}
                            {maxViews === 'custom' && (
                              <div className="animate-in slide-in-from-top-2 duration-300">
                                <input
                                  type="number"
                                  value={customMaxViews}
                                  onChange={(e) => setCustomMaxViews(e.target.value)}
                                  placeholder="MAX SCANS..."
                                  className="w-full px-6 py-5 bg-white dark:bg-black border border-primary-500/30 rounded-2xl font-black text-[11px] text-primary-600 dark:text-primary-400 outline-none shadow-inner text-center focus:ring-4 focus:ring-primary-500/10"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}`;

const newContent = content.replace(originalLifecycle, newLifecycle);
fs.writeFileSync(filePath, newContent);
console.log('Successfully fixed Lifecycle tab structure');
