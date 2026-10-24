import io, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
src = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in src else '\n'
L = src.split(nl)
h = [i for i, l in enumerate(L) if l.startswith('| uEm001_00 (Rath line) | `0x1793c28` | `0xd09054` |')]
assert len(h) == 1
l = L[h[0]]
head = '| uEm001_00 (Rath line) | `0x1793c28` | `0xd09054` | R (slot) / override UNREAD | dev/flying-wyverns-effects-survey.md '
assert l.startswith(head) and l.endswith(' | dev/em001-effects-spec.md |'), l[:200]
br = l[len(head):-len(' | dev/em001-effects-spec.md |')]
assert br.startswith('[**') and br.endswith(']')
L[h[0]] = '| uEm001_00 (Rath line) | `0x1793c28` | `0xd09054` | R (slot) / override UNREAD ' + br + ' | dev/flying-wyverns-effects-survey.md; dev/em001-effects-spec.md |'
io.open(P, 'w', encoding='utf-8', newline='').write(nl.join(L))
print(L[h[0]].count(' | '), L[h[0]][:160])
