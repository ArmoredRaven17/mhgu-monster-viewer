import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')
p = 'dev/rom-map.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n')
assert '### Nakarkos -- his non-beam shells' not in s
note = open('dev/em084-shells-spec.md', encoding='utf-8').read().replace('\r\n', '\n')
rows = [r for r in note.split('## 11.')[1].split('\n') if r.startswith('| `') or r.startswith('| trap')]
anchor = "### Khezu -- the turn clips' postures"
assert s.count(anchor) == 1
sec = ("### Nakarkos -- his non-beam shells (research agent for the Viewer agent, 2026-10-05; dev/em084-shells-spec.md)\n\n"
       "Census: 22 submits (`0x48b884`) and 31 setup allocations in the band, the shell classes included; control: the same census "
       "finds the beam sites `0x106f73c` / `0x107cb78`. Both arms' shells use ef slot 1 = `em084_00u_r` (the .shl lists), never "
       "`u_l`. No issuer found for arm (7,0x27) / (7,0x28) / (7,0x2d) / (7,0x2e) or the form setters (7,0x1c..0x1f).\n\n"
       "| addr | what | class | st | detail |\n|---|---|---|---|---|\n" + '\n'.join(rows) + "\n\n")
s = s.replace(anchor, sec + anchor)
if crlf: s = s.replace('\n', '\r\n')
open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p); print('ok', len(rows))
