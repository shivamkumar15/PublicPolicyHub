import fs from 'fs';
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Make it lenient for newlines
let lenientPattern = /\{contacts\.length === 0 && !isThreadsLoading && \(\s*<div className=\"px-2 py-8 motion-fade-up hidden xl:block\">\s*<EmptyProfilePanel\s*icon=\{<MessageCircle className=\"h-6 w-6 text-teal-500\" \/>\}\s*title=\"No chats yet\"\s*description=\"Follow people, open profiles, and start a secure discussion\.\"\s*\/>\s*<\/div>\s*<div className=\"xl:hidden px-4 py-8 text-center motion-fade-up\">\s*<p className=\"text-\[14px\] text-\[#a3a3a3\]\">No chats found\.\s*<\/p>\s*<\/div>\s*\)\}/g;

let fixedStr = `{contacts.length === 0 && !isThreadsLoading && (
              <>
              <div className="px-2 py-8 motion-fade-up hidden xl:block">
                  <EmptyProfilePanel
                    icon={<MessageCircle className="h-6 w-6 text-teal-500" />}
                    title="No chats yet"
                    description="Follow people, open profiles, and start a secure discussion."
                  />
                </div>
                <div className="xl:hidden px-4 py-8 text-center motion-fade-up">
                  <p className="text-[14px] text-[#a3a3a3]">No chats found.</p>
                </div>
              </>
            )}`;

code = code.replace(lenientPattern, fixedStr);
fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('App.jsx fixed JSX fragments!');
