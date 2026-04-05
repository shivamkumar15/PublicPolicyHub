const fs = require('fs');
let lines = fs.readFileSync('src/App.jsx', 'utf8').split(/\\r?\\n/);

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<div className=\"flex shrink-0 items-center justify-end\">') && lines[i+1].includes('{contact.lastMessage?.createdAt && (')) {
    // Delete line i+1
    lines.splice(i+1, 1);
  }
}

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{formatTimestamp(contact.lastMessage.createdAt)}') && lines[i+2].includes(')??') || lines[i+2] && lines[i+2].includes(')}}')) {
    let index = i + 2;
    lines[index] = lines[index].replace(')}}', ')}');
  }
}

fs.writeFileSync('src/App.jsx', lines.join('\\r\\n'), 'utf8');
console.log('App.jsx fixed successfully!');
