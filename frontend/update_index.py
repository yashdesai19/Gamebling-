
import os

file_path = r'e:\ipl2\frontend\src\pages\Index.tsx'
# Try reading with utf-8, fallback to latin-1
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()

target = '''              <div className="absolute bottom-4 right-12 opacity-10 transform rotate-12">
                   <Trophy className="w-56 h-56 text-primary" />
              </div>'''

replacement = '''              <div className="absolute bottom-[-20%] right-[-5%] opacity-20 transform rotate-12 select-none animate-float hidden sm:block">
                   <div className="w-80 h-80 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-black text-[12rem] shadow-2xl border-8 border-white/20" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    9X
                   </div>
              </div>'''

if target in content:
    new_content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('SUCCESS')
else:
    print('TARGET NOT FOUND')
    # Let's print a slice of content to see why it didn't match
    if '<Trophy className="w-56 h-56 text-primary" />' in content:
        print('Partial match found, but exact block failed. Check whitespace.')
