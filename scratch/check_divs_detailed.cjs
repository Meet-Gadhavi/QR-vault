const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
let stack = [];
for (let i = 1873; i <= 2537; i++) {
  const line = lines[i];
  const divMatches = line.match(/<div|<\/div>/g) || [];
  divMatches.forEach(tag => {
    if (tag === '<div') {
      balance++;
      stack.push(i + 1);
    } else {
      balance--;
      stack.pop();
    }
  });
}
console.log(`Final balance: ${balance}`);
console.log(`Unclosed tags started at lines: ${stack.join(', ')}`);
