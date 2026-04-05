import fs from 'fs';
let content = fs.readFileSync('src/App.jsx', 'utf8');

// The issue block looks like this:
//                      <div className="flex shrink-0 flex-col items-end gap-2">
//                        {contact.lastMessage?.createdAt && (
//                          {contact.unreadCount > 0 ? (
//                          ...
//                        )}
//                        {contact.lastMessage?.createdAt && (
//                          <span className={`hidden xl:inline ml-2 text-[10px] font-semibold ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
//                            {formatTimestamp(contact.lastMessage.createdAt)}
//                          </span>
//                        )}}
//                       </div>

let searchStr = '<div className=\"flex shrink-0 flex-col items-end gap-2\">\\n                        {contact.lastMessage?.createdAt && (\\n                          {contact.unreadCount > 0 ? (';

let searchStr2 = '<div className=\"flex shrink-0 flex-col items-end gap-2\">\\r\\n                        {contact.lastMessage?.createdAt && (\\r\\n                          {contact.unreadCount > 0 ? (';

let replacementStart = '<div className=\"flex shrink-0 items-center justify-end\">\\n                        {contact.unreadCount > 0 ? (';

if (content.indexOf(searchStr) > -1) {
    content = content.replace(searchStr, replacementStart);
} else if (content.indexOf(searchStr2) > -1) {
    content = content.replace(searchStr2, replacementStart);
} else {
    // try line by line fix
    content = content.replace('<div className=\"flex shrink-0 flex-col items-end gap-2\">', '<div className=\"flex shrink-0 items-center justify-end\">');
    content = content.replace('{contact.lastMessage?.createdAt && (\\n                          {contact.unreadCount > 0 ? (', '{contact.unreadCount > 0 ? (');
    content = content.replace('{contact.lastMessage?.createdAt && (\\r\\n                          {contact.unreadCount > 0 ? (', '{contact.unreadCount > 0 ? (');
}

// Fix the trailing syntax error `}}`
//                        )}}
//                       </div>
let tailStr = '</span>\\n                        )}}';
let tailStr2 = '</span>\\r\\n                        )}}';

if (content.indexOf(tailStr) > -1) {
    content = content.replace(tailStr, '</span>\\n                        )}');
} else if (content.indexOf(tailStr2) > -1) {
    content = content.replace(tailStr2, '</span>\\n                        )}');
} else {
    let tailStr3 = '}}';
    let tailStr3Replace = ')}';
    // just regex the exact spot
    content = content.replace(/(<span className=\{\`hidden xl:inline ml-2 text-\[10px\] font-semibold \$\{isActive \? 'text-blue-700' : 'text-slate-400'\}\`\}>\s*\{formatTimestamp\(contact\.lastMessage\.createdAt\)\}\s*<\/span>\s*)\}\}/g, '$1)}');
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx fixed!');
