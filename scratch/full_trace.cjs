const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
let stack = [];

// Check the full return statement block
for (let i = 1060; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  const matches = line.match(/<div|<\/div>/g) || [];
  matches.forEach(match => {
    if (match === '<div') {
      balance++;
      stack.push({line: i + 1, balance});
    } else if (match === '</div>') {
      balance--;
      if (balance < 0) {
        console.log(`Surplus close-div at line ${i + 1}, balance went to ${balance}`);
        balance = 0;
      } else {
        stack.pop();
      }
    }
  });
}
console.log(`Final balance: ${balance}`);
stack.forEach(s => console.log(`Unclosed div from line ${s.line}`));
