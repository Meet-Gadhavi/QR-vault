const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
let stack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line || line.trim().startsWith('{/*')) continue;
  
  const openMatches = line.match(/<div(?![^>]*\/>)/g) || [];
  const closeMatches = line.match(/<\/div>/g) || [];

  openMatches.forEach(_ => {
    balance++;
    stack.push(i + 1);
  });
  
  closeMatches.forEach(_ => {
    balance--;
    const idx = stack.pop();
    if (balance < 0) {
       console.log(`EXTRA CLOSING DIV at line ${i+1}`);
       balance = 0;
    }
  });
}
console.log(`Final balance: ${balance}`);
console.log(`Unclosed stack: ${stack.join(', ')}`);
