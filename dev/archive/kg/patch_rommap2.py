# Two Withdrawn rows (research agent, 2026-10-16), inserted under the Withdrawn table's header; nothing deleted.
import io, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
head = '### Withdrawn — kept so they are not rediscovered' + nl + nl + '| claim | why wrong | correction |' + nl + '|---|---|---|' + nl
if s.count(head) != 1: sys.exit('withdrawn header not found once')
ROWS = [
 '| rom-map `0xd22e8c..0xd22fac` row and dev/beams/em005_00.md "The head bit" (**agent A, 2026-09-30**): ctl+0x24 "bits 1 / 2 pick late hit records only" (`0x7db70` at f300 / f350 / f410) | the PSL enable word\'s em-5 tail reads the same byte (`0xd2e42c..0xd2e450`, R 2026-10-16) | bit 2 (the back broken) -> bits 29-31, else bit 1 (the belly\'s second stage) -> bits 23-25 on L2 M24 / L2 M33 / L4 M59 under (7, 0x11 / 0xe / 0x34): u 260 / 261 / 270 / 380 / 390 vents (dev/em005_00-effects-spec.md 1); the beam-mode reading of bit 0 stands |',
 '| states-em003_00.md §1 vtable table (**Khezu decode agent, 2026-09-23**): `+0x13c` `0xd0f728` among "attack hit groups, shell ids, ..." | the slot is the PSL enable word (the "hit groups" naming withdrawn for every class, rows above) | `0xd0f728` makes bits 9-11 follow the action and ORs L2 M37 / M38 bits 15-20 (dev/em003_00-effects-spec.md 1) |',
]
i = s.index(head) + len(head)
s = s[:i] + nl.join(ROWS) + nl + s[i:]
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok')
