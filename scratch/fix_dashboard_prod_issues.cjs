const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// 1. Fix Drive Storage PieChart Alignment
const pieTarget = `            <div className="flex items-center h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie`;

const pieReplacement = `            <div className="flex items-center justify-between gap-4 h-32">
              <div className="h-full w-24 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie`;

content = content.replace(pieTarget, pieReplacement);

const pieEndTarget = `              </ResponsiveContainer>
              <div className="text-right">`;
const pieEndReplacement = `                </ResponsiveContainer>
              </div>
              <div className="text-right">`;

content = content.replace(pieEndTarget, pieEndReplacement);


// 2. Fix the File-Specific Settings Modal structure in Dashboard.tsx
// Move the Premium Vault Mode Selector OUT of the Tab Navigation flex container
// and fix sticky top
const headerSectionPattern = `<div className="flex px-8 sm:px-10 pt-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 gap-6 sm:gap-8 overflow-x-auto no-scrollbar sticky top-[73px] z-10">
              {/* Vault Mode Selector */}
              {/* Premium Vault Mode Selector */}
              <div className="flex bg-gray-100/80 dark:bg-[#0a0a0a] rounded-2xl border border-gray-200/50 dark:border-white/5 mx-8 sm:mx-10 mt-6 mb-2 p-1.5 relative shadow-inner">`;

const tabNavReplacement = `              {/* Vault Mode Selector */}
              <div className="flex bg-gray-100/80 dark:bg-[#0a0a0a] rounded-2xl border border-gray-200/50 dark:border-white/5 mx-8 sm:mx-10 mt-2 p-1.5 relative shadow-inner shrink-0">`;

// We need to replace the entire blob. Let's do it cleanly via regex or searching.
content = content.replace(
`<div className="flex px-8 sm:px-10 pt-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 gap-6 sm:gap-8 overflow-x-auto no-scrollbar sticky top-[73px] z-10">
              {/* Vault Mode Selector */}
              {/* Premium Vault Mode Selector */}
              <div className="flex bg-gray-100/80 dark:bg-[#0a0a0a] rounded-2xl border border-gray-200/50 dark:border-white/5 mx-8 sm:mx-10 mt-6 mb-2 p-1.5 relative shadow-inner">`,
`<div className="sticky top-0 bg-white dark:bg-[#0a0a0b] z-20 pb-0 shadow-sm border-b border-gray-100 dark:border-gray-800">
              {/* Premium Vault Mode Selector */}
              <div className="flex bg-gray-100/80 dark:bg-[#0a0a0a] rounded-2xl border border-gray-200/50 dark:border-white/5 mx-8 sm:mx-10 mt-2 mb-4 p-1.5 relative shadow-inner">`
);

content = content.replace(
`                  <Inbox className="w-4 h-4" /> Collective Mode
                </button>
              </div>

              {[`,
`                  <Inbox className="w-4 h-4" /> Collective Mode
                </button>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex px-8 sm:px-10 pt-2 gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
              {[`
);

content = content.replace(
`                  {activeModalTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full shadow-[0_-4px_12px_rgba(124,58,237,0.4)]" />
                  )}
                </button>
              ))}
            </div>`,
`                  {activeModalTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full shadow-[0_-4px_12px_rgba(124,58,237,0.4)]" />
                  )}
                </button>
              ))}
              </div>
            </div>`
);

fs.writeFileSync(dashboardPath, content, 'utf8');
console.log("Applied Dashboard structural fixes.");
