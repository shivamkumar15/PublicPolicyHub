import fs from 'fs';
let lines = fs.readFileSync('src/App.jsx', 'utf8').split(/\\r?\\n/);

for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('<div className=\"flex shrink-0 flex-col items-end gap-2\">')) {
    lines[i] = '                      <div className=\"flex shrink-0 items-center justify-end\">';
    if (lines[i+1].includes('{contact.lastMessage?.createdAt && (')) {
       lines.splice(i+1, 1);
       if (lines[i+1].includes('{contact.unreadCount > 0 ? (')) {
         lines[i+1] = '                        {contact.unreadCount > 0 ? (';
       }
    }
  }
  if (lines[i] && lines[i].trim() === '}}') {
       lines[i] = '                        )}';
  }
}

fs.writeFileSync('src/App.jsx', lines.join('\\n'), 'utf8');
console.log('Fixed lines directly!');
