const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'pages', 'Dashboard.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// 1. Remove the duplicated StatGrid part (the old manual code)
// The StatGrid component is at index 1147 (line 1148)
// The duplicated manual code starts around line 1162
const firstDupStart = 1161; // zero-indexed
const firstDupEnd = 1287;   // zero-indexed
lines.splice(firstDupStart, firstDupEnd - firstDupStart + 1);

// 2. Remove the duplicated AnalyticsPanel part
// We need to re-find the indices because we spliced the array
let newContent = lines.join('\n');
const secondDupRegex = /\) : activeTab === 'analytics' \? \([\s\S]+?<AnalyticsPanel[\s\S]+?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\n\n\s+<\/>\s+\)\s+\)\s+:\s+\(/;
// That's too complex. Let's find the exact lines 1400+ (now shifted)

lines = newContent.split('\n');
// Search for the start of the duplicated analytics section
let analyticsDupStart = -1;
let analyticsDupEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("<AnalyticsPanel") && analyticsDupStart === -1) {
    // Found the component usage, skip it
  } else if (lines[i].includes("<AnalyticsPanel") && analyticsDupStart !== -1) {
      // This might be the start of the dup? No, AnalyticsPanel is the component.
  }
}

// Actually, I'll just use a very specific string match for the repeated block.
// The repeated block starts with "<>" after "<AnalyticsPanel ... /> ) : ("
const dupStartMarker = ") : activeTab === 'analytics' ? (";
const dupNextMarker = ") : (";

// Wait, I see the file in view_file:
// 1522:         ) : activeTab === 'analytics' ? (
// 1523:           <AnalyticsPanel
// 1524:             ...
// 1528:           />
// 1529:         ) : (
// 1530:               <>
// 1531:                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

// Ah! line 1529 is the problem. It should be " ) : (" but it seems it's continuing into a new block?
// Wait, 1529 is actually part of the ternary.
// activeTab === 'vaults' ? (...) : activeTab === 'analytics' ? (...) : (...)

// So line 1530 starts the ELSE case (which is likely 'deleted' tab or just a fallback).
// BUT 1531 looks like Analytics overview!
// "Vault Ecosystem Performance" is part of Analytics!
// So AnalyticsPanel was added, but the OLD analytics code (now at 1531) was NOT removed.

// I'll delete lines 1529-1650 (approx) and fix the ternary.

analyticsDupStart = 1395; // Approximate new index after first splice.
// I'll just search for the strings.

newContent = lines.join('\n');
// Fix the ternary for deleted logs
// OLD: ... ) : <AnalyticsPanel /> ) : ( <> OLD ANALYTICS CODE </> ) : ( DELETED LOGS CODE )
// NEW: ... ) : activeTab === 'analytics' ? <AnalyticsPanel /> : ( DELETED LOGS CODE )

const oldPattern = /\) : activeTab === 'analytics' \? \([\s\S]+?<AnalyticsPanel[\s\S]+?\/>\s+\) : \([\s\S]+?<>\s+<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">[\s\S]+?<\/div>\s+<\/div>\s+<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">[\s\S]+?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\n\s+<\/>\s+\)\s+:\s+\(/;

// Okay, that regex is insane. I'll use a safer approach:
// Identify the markers and splice the array again.

const finalLines = [];
let state = 'NORMAL';
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (state === 'NORMAL') {
      if (line.includes("<AnalyticsPanel") && lines[i-1].includes("activeTab === 'analytics'")) {
          state = 'FOUND_ANALYTICS';
          finalLines.push(line);
      } else {
          finalLines.push(line);
      }
  } else if (state === 'FOUND_ANALYTICS') {
      if (line.includes("/>")) {
          finalLines.push(line);
          state = 'SKIP_UNTIL_DELETED';
      } else {
          finalLines.push(line);
      }
  } else if (state === 'SKIP_UNTIL_DELETED') {
      if (line.includes("/* Recently Deleted Logs Tab */")) {
          // We found the start of the DELETED tab.
          // We need to fix the preceding line which is likely " ) : ("
          finalLines.push("        ) : (");
          finalLines.push(line);
          state = 'NORMAL';
      }
      // skip everything else
  }
}

// 3. Fix Micro-text (text-[8px], text-[9px], text-[10px], text-[11px])
const contentWithSkeleton = finalLines.join('\n')
  .replace(/text-\[8px\]/g, 'text-xs')
  .replace(/text-\[9px\]/g, 'text-xs')
  .replace(/text-\[10px\]/g, 'text-xs')
  .replace(/text-\[11px\]/g, 'text-xs');

fs.writeFileSync(filePath, contentWithSkeleton);
console.log('Successfully cleaned up Dashboard.tsx and fixed micro-text');
