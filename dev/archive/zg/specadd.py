# specadd.py <spec.md> <text.txt>: append bullets to the spec's '## Open items read (2026-10-19)' section (made at the end if missing)
import sys, io
p = sys.argv[1]; t = io.open(p, encoding='utf8', newline='').read(); nl = '\r\n' if '\r\n' in t else '\n'
add = io.open(sys.argv[2], encoding='utf8').read().strip('\n').replace('\n', nl)
H = '## Open items read (2026-10-19)'
if H not in t:
    t = t.rstrip('\r\n') + nl + nl + H + nl + nl + '(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep\'s reads".)' + nl + nl + add + nl
else:
    t = t.rstrip('\r\n') + nl + add + nl
io.open(p, 'w', encoding='utf8', newline='').write(t); print('ok', p)
