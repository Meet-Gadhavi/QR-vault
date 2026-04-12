const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
let log = [];

for (let i = 2918; i <= 3125; i++) {
  const line = lines[i];
  if (!line) continue;
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  const delta = opens - closes;
  if (delta !== 0) {
    balance += delta;
    log.push(`Line ${i+1}: balance=${balance} -> ${line.trim().substring(0,120)}`);
  }
}
log.forEach(l => console.log(l));
console.log(`\nAnalytics modal balance: ${balance}`);
