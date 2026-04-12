const fs = require('fs');
const content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
let stack = [];
for (let i = 1873; i <= 2537; i++) {
  const line = lines[i];
  if (!line) continue;
  const matches = line.match(/<(div)|(<\/div>)/g) || [];
  matches.forEach(match => {
    if (match === '<div') {
      balance++;
      stack.push({tag: 'div', line: i + 1});
    } else if (match === '</div>') {
      balance--;
      stack.pop();
    }
  });
}
console.log(`Balance at 2538: ${balance}`);
stack.forEach(s => console.log(`Unclosed ${s.tag} from line ${s.line}`));
