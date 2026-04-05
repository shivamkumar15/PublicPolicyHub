const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');
let lines = content.split(/\\r?\\n/);
let changed = false;

for (let i = 0; i < lines.length; i++) {
   if (lines[i].trim() === "{contact.lastMessage?.createdAt && (") {
      if (i < lines.length - 1 && lines[i+1].trim() === "{contact.unreadCount > 0 ? (") {
          lines[i] = "";
          changed = true;
          console.log("Found and deleted bad open bracket at line " + i);
      }
   }
   if (lines[i].trim() === ")}}") {
      // Also verify we are in the right spot roughly
      if (i - 1 >= 0 && lines[i-1].includes('</span>')) {
          lines[i] = lines[i].replace(')}}', ')}');
          changed = true;
          console.log("Found and fixed bad close bracket at line " + i);
      }
   }
}

if (changed) {
    fs.writeFileSync('src/App.jsx', lines.join('\\n'), 'utf8');
} else {
    console.log("Still nothing matched?!?");
}
