const fs = require('fs');
const file = 'c:/Users/Shivam Kumar/Downloads/PublicPolicyHub/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

let fixRegex = /<div className=\"flex shrink-0 flex-col items-end gap-2\">\\s*\\{contact\\.lastMessage\\?\\.createdAt && \\(\\s*\\{contact\\.unreadCount > 0 \\? \\(\\s*<div className=\"h-2\\.5 w-2\\.5 rounded-full bg-blue-500 xl:inline-flex xl:min-w-\\[1\\.4rem\\] xl:h-auto xl:w-auto xl:items-center xl:justify-center xl:rounded-full xl:bg-blue-600 xl:px-1\\.5 xl:py-0\\.5 xl:text-\\[10px\\] xl:font-bold xl:leading-none xl:text-white\">\\s*<span className=\"hidden xl:inline\">\\{contact\\.unreadCount > 99 \\? '99\\+' : contact\\.unreadCount\\}<\\/span>\\s*<\\/div>\\s*\\) : \\(\\s*<div className=\"xl:hidden opacity-30 flex items-center justify-center\">\\s*<svg className=\"h-\\[20px\\] w-\\[20px\\] text-\\[#a3a3a3\\]\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\\s*<path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\\{1\\} d=\"M3\\.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2\\.945M8 3\\.935V5\\.5A2\\.5 2\\.5 0 0010\\.5 8h\\.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1\\.064M15 20\\.488V18a2 2 0 012-2h3\\.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" \\/>\\s*<\\/svg>\\s*<\\/div>\\s*\\)\\}\\s*\\{contact\\.lastMessage\\?\\.createdAt && \\(\\s*<span className=\\{\\`hidden xl:inline ml-2 text-\\[10px\\] font-semibold \\$\\{isActive \\? 'text-blue-700' : 'text-slate-400'\\}\\`\\}>\\s*\\{formatTimestamp\\(contact\\.lastMessage\\.createdAt\\)\\}\\s*<\\/span>\\s*\\)\\}\\}\\s*<\\/div>/m;

const replacement = `<div className=\"flex shrink-0 items-center justify-end\">
                        {contact.unreadCount > 0 ? (
                          <div className=\"h-2.5 w-2.5 rounded-full bg-blue-500 xl:inline-flex xl:min-w-[1.4rem] xl:h-auto xl:w-auto xl:items-center xl:justify-center xl:rounded-full xl:bg-blue-600 xl:px-1.5 xl:py-0.5 xl:text-[10px] xl:font-bold xl:leading-none xl:text-white\">
                            <span className=\"hidden xl:inline\">{contact.unreadCount > 99 ? '99+' : contact.unreadCount}</span>
                          </div>
                        ) : (
                          <div className=\"xl:hidden opacity-30 flex items-center justify-center\">
                            <svg className=\"h-[20px] w-[20px] text-[#a3a3a3]\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">
                                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={1} d=\"M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />
                            </svg>
                          </div>
                        )}
                        {contact.lastMessage?.createdAt && (
                          <span className={\`hidden xl:inline ml-2 text-[10px] font-semibold \${isActive ? 'text-blue-700' : 'text-slate-400'}\`}>
                            {formatTimestamp(contact.lastMessage.createdAt)}
                          </span>
                        )}
                       </div>`;

if(content.match(fixRegex)) {
  content = content.replace(fixRegex, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully fixed syntax error in App.jsx');
} else {
  // Let's do string replacement instead
  const searchStr = \`                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {contact.lastMessage?.createdAt && (
                          {contact.unreadCount > 0 ? (\`;
  if(content.includes(searchStr)) {
    let startIdx = content.indexOf(searchStr);
    let endIdx = content.indexOf('</div>', startIdx) + 6;
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully fixed syntax error in App.jsx (via string slice)');
  } else {
    // Attempt broader match
    let startIdx = content.indexOf('<div className="flex shrink-0 flex-col items-end gap-2">\\n                        {contact.lastMessage?.createdAt && (');
    if(startIdx > -1) {
       let endIdx = content.indexOf('</div>', startIdx) + 6;
       content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
       fs.writeFileSync(file, content, 'utf8');
       console.log('Successfully fixed syntax error in App.jsx (via string slice alternative)\\n');
    } else {
      console.log('Failed to find syntax error pattern');
    }
  }
}
