const fs = require('fs');

try {
  let content = fs.readFileSync('src/App.jsx', 'utf8');

  // We are going to replace exactly what we saw
  const target1 = '                      <div className=\"flex shrink-0 items-center justify-end\">\\n                        {contact.lastMessage?.createdAt && (\\n                          {contact.unreadCount > 0 ? (\\n                          <div className=\"h-2.5 w-2.5 rounded-full bg-blue-500 xl:inline-flex xl:min-w-[1.4rem] xl:h-auto xl:w-auto xl:items-center xl:justify-center xl:rounded-full xl:bg-blue-600 xl:px-1.5 xl:py-0.5 xl:text-[10px] xl:font-bold xl:leading-none xl:text-white\">';

  const replace1 = '                      <div className=\"flex shrink-0 items-center justify-end\">\\n                        {contact.unreadCount > 0 ? (\\n                          <div className=\"h-2.5 w-2.5 rounded-full bg-blue-500 xl:inline-flex xl:min-w-[1.4rem] xl:h-auto xl:w-auto xl:items-center xl:justify-center xl:rounded-full xl:bg-blue-600 xl:px-1.5 xl:py-0.5 xl:text-[10px] xl:font-bold xl:leading-none xl:text-white\">';

  const target2 = '                      <div className=\"flex shrink-0 items-center justify-end\">\\r\\n                        {contact.lastMessage?.createdAt && (\\r\\n                          {contact.unreadCount > 0 ? (\\r\\n                          <div className=\"h-2.5 w-2.5 rounded-full bg-blue-500 xl:inline-flex xl:min-w-[1.4rem] xl:h-auto xl:w-auto xl:items-center xl:justify-center xl:rounded-full xl:bg-blue-600 xl:px-1.5 xl:py-0.5 xl:text-[10px] xl:font-bold xl:leading-none xl:text-white\">';

  const replace2 = '                      <div className=\"flex shrink-0 items-center justify-end\">\\r\\n                        {contact.unreadCount > 0 ? (\\r\\n                          <div className=\"h-2.5 w-2.5 rounded-full bg-blue-500 xl:inline-flex xl:min-w-[1.4rem] xl:h-auto xl:w-auto xl:items-center xl:justify-center xl:rounded-full xl:bg-blue-600 xl:px-1.5 xl:py-0.5 xl:text-[10px] xl:font-bold xl:leading-none xl:text-white\">';

  let fixed = false;
  
  if (content.indexOf(target1) > -1) {
     content = content.replace(target1, replace1);
     fixed = true;
  } else if (content.indexOf(target2) > -1) {
     content = content.replace(target2, replace2);
     fixed = true;
  } else {
     console.log('Could not find block 1');
  }

  const endTarget1 = '                        {contact.lastMessage?.createdAt && (\\n                          <span className={`hidden xl:inline ml-2 text-[10px] font-semibold ${isActive ? \\'text-blue-700\\' : \\'text-slate-400\\'}`}>\\n                            {formatTimestamp(contact.lastMessage.createdAt)}\\n                          </span>\\n                        )}}\\n                       </div>';
  const endReplace1 = '                        {contact.lastMessage?.createdAt && (\\n                          <span className={`hidden xl:inline ml-2 text-[10px] font-semibold ${isActive ? \\'text-blue-700\\' : \\'text-slate-400\\'}`}>\\n                            {formatTimestamp(contact.lastMessage.createdAt)}\\n                          </span>\\n                        )}\\n                       </div>';

  const endTarget2 = '                        {contact.lastMessage?.createdAt && (\\r\\n                          <span className={`hidden xl:inline ml-2 text-[10px] font-semibold ${isActive ? \\'text-blue-700\\' : \\'text-slate-400\\'}`}>\\r\\n                            {formatTimestamp(contact.lastMessage.createdAt)}\\r\\n                          </span>\\r\\n                        )}}\\r\\n                       </div>';
  const endReplace2 = '                        {contact.lastMessage?.createdAt && (\\r\\n                          <span className={`hidden xl:inline ml-2 text-[10px] font-semibold ${isActive ? \\'text-blue-700\\' : \\'text-slate-400\\'}`}>\\r\\n                            {formatTimestamp(contact.lastMessage.createdAt)}\\r\\n                          </span>\\r\\n                        )}\\r\\n                       </div>';

  if (content.indexOf(endTarget1) > -1) {
    content = content.replace(endTarget1, endReplace1);
  } else if (content.indexOf(endTarget2) > -1) {
    content = content.replace(endTarget2, endReplace2);
  } else {
    console.log('Could not find block 2');
  }

  if(fixed) {
    fs.writeFileSync('src/App.jsx', content, 'utf8');
    console.log('Successfully fixed syntax via pure strings');
  }

} catch(e) {
  console.log(e);
}
