import fs from 'fs';

const content = fs.readFileSync('src/App.jsx', 'utf8');

const badBlock = `                      <div className="flex shrink-0 items-center justify-end">\\r\\n                        {contact.lastMessage?.createdAt && (\\r\\n                          {contact.unreadCount > 0 ? (\\r\\n                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 xl:inline-flex xl:min-w-[1.4rem] xl:h-auto xl:w-auto xl:items-center xl:justify-center xl:rounded-full xl:bg-blue-600 xl:px-1.5 xl:py-0.5 xl:text-[10px] xl:font-bold xl:leading-none xl:text-white">\\r\\n                            <span className="hidden xl:inline">{contact.unreadCount > 99 ? '99+' : contact.unreadCount}</span>\\r\\n                          </div>\\r\\n                        ) : (\\r\\n                          <div className="xl:hidden opacity-30 flex items-center justify-center">\\r\\n                            <svg className="h-[20px] w-[20px] text-[#a3a3a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">\\r\\n                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />\\r\\n                            </svg>\\r\\n                          </div>\\r\\n                        )}\\r\\n                        {contact.lastMessage?.createdAt && (\\r\\n                          <span className={\`hidden xl:inline ml-2 text-[10px] font-semibold \${isActive ? 'text-blue-700' : 'text-slate-400'}\`}>\\r\\n                            {formatTimestamp(contact.lastMessage.createdAt)}\\r\\n                          </span>\\r\\n                        )}}\\r\\n                       </div>`;

const goodBlock = `                      <div className="flex shrink-0 items-center justify-end">\\r\\n                        {contact.unreadCount > 0 ? (\\r\\n                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 xl:inline-flex xl:min-w-[1.4rem] xl:h-auto xl:w-auto xl:items-center xl:justify-center xl:rounded-full xl:bg-blue-600 xl:px-1.5 xl:py-0.5 xl:text-[10px] xl:font-bold xl:leading-none xl:text-white">\\r\\n                            <span className="hidden xl:inline">{contact.unreadCount > 99 ? '99+' : contact.unreadCount}</span>\\r\\n                          </div>\\r\\n                        ) : (\\r\\n                          <div className="xl:hidden opacity-30 flex items-center justify-center">\\r\\n                            <svg className="h-[20px] w-[20px] text-[#a3a3a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">\\r\\n                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />\\r\\n                            </svg>\\r\\n                          </div>\\r\\n                        )}\\r\\n                        {contact.lastMessage?.createdAt && (\\r\\n                          <span className={\`hidden xl:inline ml-2 text-[10px] font-semibold \${isActive ? 'text-blue-700' : 'text-slate-400'}\`}>\\r\\n                            {formatTimestamp(contact.lastMessage.createdAt)}\\r\\n                          </span>\\r\\n                        )}\\r\\n                       </div>`;

const badBlockN = badBlock.replace(/\\r\\n/g, '\\n');
const goodBlockN = goodBlock.replace(/\\r\\n/g, '\\n');

if (content.includes(badBlock)) {
    fs.writeFileSync('src/App.jsx', content.replace(badBlock, goodBlock), 'utf8');
    console.log('Fixed with \\r\\n matched perfectly.');
} else if (content.includes(badBlockN)) {
    fs.writeFileSync('src/App.jsx', content.replace(badBlockN, goodBlockN), 'utf8');
    console.log('Fixed with \\n matched perfectly.');
} else {
    // try removing just the exact lines from array string
    let lines = content.split(/\\r?\\n/);
    let changed = false;
    for(let i=0; i<lines.length; i++) {
        if(lines[i] === "                        {contact.lastMessage?.createdAt && (") {
             if (i<lines.length-1 && lines[i+1] === "                          {contact.unreadCount > 0 ? (") {
                 lines[i] = ""; // Delete it
                 changed = true;
             }
        }
        if(lines[i] === "                        )}}") {
             lines[i] = "                        )}";
             changed = true;
        }
    }
    
    if (changed) {
        fs.writeFileSync('src/App.jsx', lines.join('\\n'), 'utf8');
        console.log('Fixed using array line matcher.');
    } else {
        console.log('NOTHING MATCHED!');
    }
}
