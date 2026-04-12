const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
let stack = [];

for (let i = 1872; i < 2530; i++) {
  const line = lines[i];
  if (!line || line.trim().startsWith('{/*')) continue;
  
  const openMatches = line.match(/<div(?![^>]*\/>)/g) || [];
  const closeMatches = line.match(/<\/div>/g) || [];

  openMatches.forEach(_ => {
    balance++;
    stack.push({ line: i + 1, text: line.trim().substring(0, 50) });
  });
  
  closeMatches.forEach(_ => {
    balance--;
    const last = stack.pop();
    // console.log(`Line ${i+1} closes line ${last ? last.line : 'unknown'}`);
  });
}
console.log(`Final balance: ${balance}`);
console.log(`Open tags:`);
stack.forEach(s => console.log(`  Line ${s.line}: ${s.text}`));
