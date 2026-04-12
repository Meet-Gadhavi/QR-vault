const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
for (let i = 1873; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  balance += opens - closes;
}
console.log(`Overall div balance in return block: ${balance}`);

// Also check modal specifically
let modalBalance = 0;
for (let i = 1873; i <= 2542; i++) {
  const line = lines[i];
  if (!line) continue;
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  modalBalance += opens - closes;
}
console.log(`Modal block balance through line 2543: ${modalBalance}`);
