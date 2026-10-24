# The board (never committed): the re-walk block after the Elder Dragon walk's, in place.
import sys
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
NL = b'\r\n' if b.count(b'\r\n') > b.count(b'\n') / 2 else b'\n'
anchor = b"part-review.json, so it is named, not wired."
assert b.count(anchor) == 1
i = b.index(anchor) + len(anchor)
i = b.index(NL, i) + len(NL)
TEXT = sys.argv[1] if len(sys.argv) > 1 else open(sys.argv[0].replace('board_note.py', 'board_note.txt'), encoding='utf8').read()
if b'FLYING / BRUTE / BIRD RE-WALK 2026-10-18' in b: raise SystemExit('already there')
add = NL.join(l.encode('utf8') for l in TEXT.rstrip('\n').split('\n')) + NL
open(p, 'wb').write(b[:i] + add + b[i:])
print('ok', NL)
