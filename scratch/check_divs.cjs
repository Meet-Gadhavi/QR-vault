const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
for (let i = 1873; i <= 2537; i++) {
  const line = lines[i];
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  balance += opens - closes;
  if (balance < 0) {
    console.log(`Balance broke at line ${i + 1}: current balance ${balance}`);
    break;
  }
}
console.log(`Final balance at line 2538: ${balance}`);
