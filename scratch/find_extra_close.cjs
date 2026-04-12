const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
for (let i = 1090; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  const prev = balance;
  balance += opens - closes;
  if (balance < 0) {
    console.log(`Balance went negative at line ${i+1}: ${prev} -> ${balance}`);
    console.log(`  -> ${line.trim().substring(0,120)}`);
    balance = 0; // reset to continue tracking
  }
}
console.log(`Final balance: ${balance}`);
