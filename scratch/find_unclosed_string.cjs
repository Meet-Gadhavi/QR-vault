const fs = require('fs');

const filePath = 'c:\\Users\\Meet\\Music\\qr-vault\\pages\\Dashboard.tsx';
const content = fs.readFileSync(filePath, 'utf8');

let inString = false;
let stringChar = '';
let lastStringToggleLine = -1;

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (!inString) {
            if (char === '"' || char === "'" || char === "`") {
                inString = true;
                stringChar = char;
                lastStringToggleLine = i + 1;
            }
        } else {
            if (char === stringChar && line[j-1] !== '\\') {
                inString = false;
                lastStringToggleLine = i + 1;
            }
        }
    }
}

if (inString) {
    console.log('UNCLOSED STRING detected! Started at line: ' + lastStringToggleLine + ' with char: ' + stringChar);
} else {
    console.log('No unclosed string detected.');
}
