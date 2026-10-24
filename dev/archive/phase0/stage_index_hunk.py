import subprocess, os
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
head = subprocess.run(['git', '-C', R, 'show', 'HEAD:docs/index.html'], capture_output=True, check=True).stdout
work = open(os.path.join(R, 'docs', 'index.html'), 'rb').read()
nl = b'\r\n' if b'\r\n' in head[:5000] else b'\n'
old = b"import { initAssets, loadJson } from './render/assets.js';" + nl + b"import { allMats, setWire, setBiasUnitsPerStep } from './render/material.js';" + nl
assert head.count(old) == 1, head.count(old)
# the block exactly as it stands in the working tree
wnl = b'\r\n' if b'\r\n' in work[:5000] else b'\n'
ws = work.index(b"import { initAssets, loadJson, setNoMipmap } from './render/assets.js';")
we = work.index(b']);' + wnl, ws) + len(b']);' + wnl)
block = work[ws:we].replace(wnl, nl)
assert block.count(b'setNoMipmap') == 2, block
new = head.replace(old, block)
p = os.path.join(R, '.git', 'phase0_index.tmp')
open(p, 'wb').write(new)
blob = subprocess.run(['git', '-C', R, 'hash-object', '-w', '--no-filters', p], capture_output=True, check=True, text=True).stdout.strip()
os.remove(p)
subprocess.run(['git', '-C', R, 'update-index', '--cacheinfo', '100644,%s,docs/index.html' % blob], check=True)
print('staged index.html blob', blob, 'added bytes', len(new) - len(head))
