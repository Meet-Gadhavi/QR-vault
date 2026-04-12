const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
let stack = [];

for (let i = 1090; i < lines.length; i++) {
  const line = lines[i];
  if (!line || line.trim().startsWith('{/*')) continue;
  
  // Find all <div> starts NOT ending in />
  const openMatches = line.match(/<div(?![^>]*\/>)/g) || [];
  // Find all </div>
  const closeMatches = line.match(/<\/div>/g) || [];

  openMatches.forEach(_ => {
    balance++;
    stack.push(i + 1);
  });
  
  closeMatches.forEach(_ => {
    balance--;
    stack.pop();
  });

  if (balance < 0) {
     console.log(`Balance negative at line ${i+1}`);
     balance = 0;
  }
}
console.log(`Final balance: ${balance}`);
console.log(`Open at: ${stack.join(', ')}`);
