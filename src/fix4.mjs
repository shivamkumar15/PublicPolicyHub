import fs from 'fs';
let lines = fs.readFileSync('src/App.jsx', 'utf8').split(/\\r?\\n/);

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{contact.lastMessage?.createdAt && (')) {
    // If the next line is the unread count check, this is the bad line!
    if (i + 1 < lines.length && lines[i+1].includes('{contact.unreadCount > 0 ? (')) {
      // Just clear this line!
      lines[i] = '';
    }
  }

  // The trailing }} is also a syntax error
  if (lines[i].includes('}}')) {
    if (lines[i].trim() === '}}') {
      // Is this the one right after the span?
      if (i - 1 >= 0 && lines[i-1].includes('</span>')) {
        lines[i] = '                        )}';
      }
    }
  }
}

fs.writeFileSync('src/App.jsx', lines.join('\\n'), 'utf8');
console.log('App.jsx fixed 4!');
