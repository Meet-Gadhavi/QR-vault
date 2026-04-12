const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Meet\\Music\\qr-vault\\pages\\Dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The corruption is between line 2859 and 3054.
// We want to delete the redundant and broken block.

const lines = content.split('\n');

// Find the first "selectedFileForSettings && (" after line 2850
let firstModalStart = -1;
for (let i = 2850; i < lines.length; i++) {
    if (lines[i].includes('selectedFileForSettings && (')) {
        firstModalStart = i;
        break;
    }
}

// Find the SECOND "selectedFileForSettings && (" after firstModalStart
let secondModalStart = -1;
if (firstModalStart !== -1) {
    for (let i = firstModalStart + 1; i < lines.length; i++) {
        if (lines[i].includes('selectedFileForSettings && (')) {
            secondModalStart = i;
            break;
        }
    }
}

console.log('firstModalStart:', firstModalStart);
console.log('secondModalStart:', secondModalStart);

if (firstModalStart !== -1 && secondModalStart !== -1) {
    // We want to delete from firstModalStart-1 (the comment) up to just before secondModalStart
    const deleteRangeStart = firstModalStart - 1; 
    const deleteRangeEnd = secondModalStart - 1; 
    
    console.log(`Deleting lines ${deleteRangeStart + 1} to ${deleteRangeEnd + 1}`);
    
    lines.splice(deleteRangeStart, deleteRangeEnd - deleteRangeStart);
    
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully removed corrupted block and consolidated modals');
} else {
    console.error('Could not find modal markers for deletion');
    process.exit(1);
}
