const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
let log = [];
for (let i = 1873; i <= 2540; i++) {
  const line = lines[i];
  if (!line) continue;
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  const delta = opens - closes;
  if (delta !== 0) {
    balance += delta;
    log.push(`Line ${i+1}: balance=${balance} -> ${line.trim().substring(0,100)}`);
  }
}
log.forEach(l => console.log(l));
console.log(`\nFinal balance: ${balance}`);
