const fs = require('fs');
let lines = fs.readFileSync('src/App.jsx', 'utf8').split(/\\r?\\n/);

for (let i = 0; i < lines.length; i++) {
  // If we find the end tag we remove the extra bracket directly!
  if (lines[i].includes('}}') && !lines[i].includes('{{')) {
    if (lines[i].trim() === ')}}') {
      lines[i] = lines[i].replace(')}}', ')}');
    }
  }

  // If we find the erroneous open statement
  if (lines[i].includes('{contact.lastMessage?.createdAt && (')) {
     if (i + 1 < lines.length && lines[i+1].includes('{contact.unreadCount > 0 ? (')) {
        // Clear this line
        lines[i] = '';
     }
  }
}

fs.writeFileSync('src/App.jsx', lines.join('\\r\\n'), 'utf8');
console.log('Fixed syntaxes forcefully!');
