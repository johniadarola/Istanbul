# Regenerates the offline file list inside sw.js. Run after adding art: python3 tools-precache.py VERSION
import os,sys,re
v=sys.argv[1]
files=['./','index.html','style.css','game.js','themes/istanbul.js','themes/riverfair.js','manifest-riverfair.webmanifest','manifest-istanbul.webmanifest']
for root,_,fs in os.walk('art'):
    for f in sorted(fs):
        if f.endswith(('.webp','.png')):files.append(os.path.join(root,f))
s=open('sw.js').read()
s=re.sub(r"const VERSION='[^']*';","const VERSION='%s';"%v,s)
s=re.sub(r"const CORE=\[[^\]]*\];","const CORE=%s;"%repr(files).replace("'",'"'),s)
open('sw.js','w').write(s)
print(len(files),'files')
