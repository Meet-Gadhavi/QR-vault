const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;

console.log("Tracing isModalOpen block (1874-2537)");
for (let i = 1873; i < 2537; i++) {
  const line = lines[i];
  if (!line || line.trim().startsWith('{/*')) continue;
  
  const openMatches = line.match(/<div(?![^>]*\/>)/g) || [];
  const closeMatches = line.match(/<\/div>/g) || [];

  openMatches.forEach(_ => balance++);
  closeMatches.forEach(_ => balance--);

  if (openMatches.length > 0 || closeMatches.length > 0) {
    // console.log(`Line ${i+1}: balance=${balance} -> ${line.trim().substring(0, 100)}`);
  }
}
console.log(`Final balance in block: ${balance}`);
