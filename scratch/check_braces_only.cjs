const fs = require('fs');

const filePath = 'c:\\Users\\Meet\\Music\\qr-vault\\pages\\Dashboard.tsx';
const content = fs.readFileSync(filePath, 'utf8');

let braceCount = 0;
let parenCount = 0;
let inString = false;
let stringChar = '';

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (!inString) {
            if (char === '"' || char === "'" || char === "`") {
                inString = true;
                stringChar = char;
            } else if (char === '{') braceCount++;
            else if (char === '}') braceCount--;
            else if (char === '(') parenCount++;
            else if (char === ')') parenCount--;
        } else {
            if (char === stringChar && line[j-1] !== '\\') {
                inString = false;
            }
        }
    }
    if (braceCount < 0 || parenCount < 0) {
        // console.log(`Imbalance at line ${i+1}: brace=${braceCount}, paren=${parenCount}`);
    }
}

console.log('Final counts: brace=' + braceCount + ', paren=' + parenCount + ', inString=' + inString);
