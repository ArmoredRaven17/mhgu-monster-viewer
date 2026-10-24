# board_drawtable2.py: the draw table's follow-ups closed (2026-10-21) -- three open items out, a done line in, the Neset item updated
import os, re
P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read()
NL = b'\r\n'
def cut(start):
    i = b.index(start)
    j = b.index(NL + b'- [', i + 1) + len(NL)
    return i, j
out = b
for start in (b"- [ ] (bug) **A base01 shell's SECOND init start never reaches the page**",
              b"- [ ] (bug) **Seven records start in the node replay but not on the page under the same input**",
              b"- [ ] **Nakarkos input.parts084**"):
    i = out.index(start); j = out.index(NL + b'- [', i + 1) + len(NL)
    out = out[:i] + out[j:]
old = b"- [ ] **Ahtal-Ka's sp_57 20..26 are Neset's requests**"
i = out.index(old); j = out.index(NL + b'- [', i + 1) + len(NL)
new = ("- [ ] **Neset's drops (Ahtal-Ka's sp_57 20 / 21, u 321) and the u 320 export** (shells agent, 2026-10-21). His lifts (1, 0x15) / (1, 8)"
       " (0x10ac10c, READ) are BUILT (sp_57 24 / 25: u 320 / u 70; node replay) but Neset's effects export (em087_00.json) carries no"
       " em088_00u record, so the page cannot draw them (effects lane). His drops (0x10ac1ec, READ) come from (10, 0x8e), and what fires"
       " (10, 0x8e) for Neset (the shared reaction 0x1a on his P+0x3a8 bit 16, param data) is NOT READ -- not listed until it is.").encode('utf8') + NL
out = out[:i] + new + out[j:]
d = out.index(b'\n## Done') + 1; d = out.index(b'\n', d) + 1
done = ("- [x] 2026-10-21 -- Monster Viewer: **the draw table's follow-ups** (shells agent): the seven node-vs-page records found -- a split clip's"
        " pick advances only on its _start (the meter now plays _start + _loop pairs: Kushala u 80 / 162, Alatreon u 182), a fresh motion first"
        " seen at frame 1 / 2 lost its frame-1 / 2 rows (shells.js stepShells FIXED: Thunderlord u 180, Chaotic u 90 / 91), a child made 300"
        " frames on (em002_04 u 23: the window); the base01 second init starts are the hunter's range (ROM CONDITION, the effects agent);"
        " Nakarkos input.parts084 WIRED (the part pass 0x106b2d0 READ); Teostra c 30 the ROM never reaches (L1 M7 is 61 frames in the game);"
        " Kecha Wacha's hang height READ and built (AIR_HEIGHT em065_00 `hang`: u 12 draws). Table: 806 of 946 draw. dev/shells-draw-table.md.").encode('utf8')
out = out[:d] + done + NL + out[d:]
open(P + '.tmp', 'wb').write(out)
os.replace(P + '.tmp', P)
print('ok', out.count(b'\x00'))
