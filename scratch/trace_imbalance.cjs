const fs = require('fs');

const filePath = 'c:\\Users\\Meet\\Music\\qr-vault\\pages\\Dashboard.tsx';
const content = fs.readFileSync(filePath, 'utf8');

let braceCount = 0;
let parenCount = 0;
let tagStack = [];

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Simple bracket counting (doesn't handle strings/comments perfectly but good for broad trace)
    for (let char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
    }
    
    // Simple tag counting
    const tags = line.match(/<[a-zA-Z]+| <\/[a-zA-Z]+>/g);
    if (tags) {
        for (let tag of tags) {
            if (tag.startsWith('</')) {
                const tagName = tag.substring(2, tag.length - 1).trim();
                if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
                    tagStack.pop();
                } else {
                    // console.log(`Potential tag mismatch at line ${i + 1}: ${tag}`);
                }
            } else {
                const tagName = tag.substring(1).trim();
                // Avoid self-closing or component tags without children
                if (!line.includes('/>') && !['input', 'img', 'br', 'hr'].includes(tagName.toLowerCase())) {
                    tagStack.push(tagName);
                }
            }
        }
    }

    if (braceCount < 0) {
        console.log(`CRITICAL: Brace count went negative at line ${i + 1}`);
        braceCount = 0; // reset to continue trace
    }
    if (parenCount < 0) {
        console.log(`CRITICAL: Parenthesis count went negative at line ${i + 1}`);
        parenCount = 0; // reset to continue trace
    }
}

console.log('Final Brace Count:', braceCount);
console.log('Final Paren Count:', parenCount);
console.log('Final Tag Stack Size:', tagStack.length);
if (tagStack.length > 0) {
    console.log('Open Tags:', tagStack.join(', '));
}
