const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
for (let i = 1090; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  balance += opens - closes;
}
console.log(`Final balance from line 1091: ${balance}`);

// Now check full file
balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  balance += opens - closes;
}
console.log(`Full file div balance: ${balance}`);
