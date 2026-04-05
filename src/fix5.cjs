const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// The faulty start
const badStart = /\\{contact\\.lastMessage\\?\\.createdAt && \\(\\s*\\{contact\\.unreadCount > 0 \\? \\(/;
if(content.match(badStart)) {
   content = content.replace(badStart, '{contact.unreadCount > 0 ? (');
}

// The faulty end 
const badEnd = /<span className=\{\`hidden xl:inline ml-2 text-\\[10px\\] font-semibold \\$\\{isActive \\? 'text-blue-700' : 'text-slate-400'\\}\\`\}>\\s*\\{formatTimestamp\\(contact\\.lastMessage\\.createdAt\\)\\}\\s*<\\/span>\\s*\\)\\}\\}/g;

const goodEnd = `<span className={\`hidden xl:inline ml-2 text-[10px] font-semibold \${isActive ? 'text-blue-700' : 'text-slate-400'}\`}>
                            {formatTimestamp(contact.lastMessage.createdAt)}
                          </span>
                        )}`;

if(content.match(badEnd)) {
   content = content.replace(badEnd, goodEnd);
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Done cleaning syntax errors.');
