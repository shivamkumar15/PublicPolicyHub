const fs = require('fs');
let lines = fs.readFileSync('src/App.jsx', 'utf8').split(/\\r?\\n/);
let inBadBlock = false;
let foundBlock = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('flex shrink-0 items-center justify-end')) {
     inBadBlock = true;
  }
  
  if (inBadBlock && lines[i].includes('{contact.lastMessage?.createdAt && (')) {
     if (i+1 < lines.length && lines[i+1].includes('{contact.unreadCount > 0 ? (')) {
         lines[i] = ''; // erase it
         foundBlock = true;
     }
  }

  if (inBadBlock && lines[i].includes('}}')) {
     if (lines[i].trim() === ')}}') {
         lines[i] = lines[i].replace(')}}', ')}');
         inBadBlock = false; // block closed
     }
  }
}

fs.writeFileSync('src/App.jsx', lines.join('\\r\\n'), 'utf8');
console.log('Fixed block: ' + foundBlock);
