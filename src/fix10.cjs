const fs = require('fs');
let text = fs.readFileSync('src/App.jsx', 'utf8');

// The targeted regex spans any whitespace using \\s*
let badRegex = /\{contact\.lastMessage\?\.createdAt && \(\\s*\{contact\.unreadCount > 0 \? \(/;
text = text.replace(badRegex, '{contact.unreadCount > 0 ? (');

let badTail = /<span className=\{\`hidden xl:inline ml-2 text-\[10px\] font-semibold \$\{isActive \? 'text-blue-700' : 'text-slate-400'\}\`\}>\s*\{formatTimestamp\(contact\.lastMessage\.createdAt\)\}\s*<\/span>\s*\)\}\}/g;

let fixedTail = `<span className={\`hidden xl:inline ml-2 text-[10px] font-semibold \${isActive ? 'text-blue-700' : 'text-slate-400'}\`}>
                            {formatTimestamp(contact.lastMessage.createdAt)}
                          </span>
                        )}`;

text = text.replace(badTail, fixedTail);

fs.writeFileSync('src/App.jsx', text, 'utf8');
console.log('Regex successfully processed!');
