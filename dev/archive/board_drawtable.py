# board_drawtable.py: the draw table's open items under the Monsters section, its done line at the top of Done (byte edit, CRLF,
# .tmp + os.replace; the board carries NUL bytes and is never committed)
import os
P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read()
NL = b'\r\n'
head = b'## Monsters (`MHGU-Monster-Viewer`, built 2026-09-04, deployed as TEST)'
i = b.index(head); j = b.index(b'\n', i) + 1
items = [
 "- [ ] (idea) **Congalala: a charge-count control** (shells agent, 2026-10-21; for Raven). His breath's last charge (charges ctl[2] < 2, the remap",
 "      vt+0x1fc 0xdcee10) plays modes 5..8 -- u 300 / 310 / 320 / 330 -- and the page has no control for the count (input.gas021Last, the",
 "      stand-in \"2+\"). A Gas Charges toggle (2+ / last) would draw them. dev/shells-draw-table.md (em021_00).",
 "- [ ] (bug) **A base01 shell's SECOND init start never reaches the page** (shells agent, 2026-10-21). Kushala's pulse sp_01 1 / 2 / 3 (c 33 /",
 "      34 / 35) and Teostra's sp_01 1 (c 34): base01's init starts ef 0 and ef 1, the node replay reports both (startEf2 -> out.started),",
 "      the page meter records ef 0 only. Find where schedule.js drops a same-step second start. dev/shells-draw-table.md.",
 "- [ ] (bug) **Seven records start in the node replay but not on the page under the same input** (shells agent, 2026-10-21): Kushala u 80 /",
 "      162 (Wind Aura 3, L2 M9 (7, 0x2d)), Alatreon u 182 (rage, L2 M9 (7, 0x40)), Thunderlord u 180 (Charged, L9 M4), Chaotic Gore u 90 / 91",
 "      (Gauge 20000, L2 M25 (7, 0x2f)), em002_04 u 23 (Quest Level 0, L4 M38). The page probe died on a socket;",
 "      read the page's inputs on one of these plays. dev/shells-draw-table.md (OPEN (PAGE)).",
 "- [ ] **Ahtal-Ka's sp_57 20..26 are Neset's requests** (shells agent, 2026-10-21): u 320 / 321 come from uEm087_00's b2 request 0x10ac3c8",
 "      (mode k + 0x14; 24..26 INFERRED his b6 0x10ac1c8) -- not transcribed; a Neset row that makes an Ahtal-Ka shell.",
 "- [ ] **Nakarkos input.parts084** (shells agent, 2026-10-21): the record table's 65 / 66 test parts 2 / 3's break levels; the input is",
 "      optional (absent = unbroken) and index.html does not wire it yet -- the parts' levels as shown would.",
]
ins = NL.join(x.encode('utf8') for x in items) + NL
b = b[:j] + ins + b[j:]
d = b.index(b'\n## Done') + 1; d = b.index(b'\n', d) + 1
done = ("- [x] 2026-10-21 -- Monster Viewer: **the full shell DRAW table** (shells agent): every 'shell' record of every SHELL_DATA monster (946 on 86)"
        " metered on the page through seven rounds -- 798 draw; 77 need a wall / hunter, 37 the ROM never draws, 11 ROM conditions, 8 inputs the"
        " viewer has no control for, 1 stand-in, 2 not built (Neset's requests), 1 unread, 11 open (page). dev/shells-draw-table.md. Built for it:"
        " Kirin's status-2 strikes, Old Fatalis (7, 0x49) and the storm, Nargacuga / Silverwind 0xe47b0c, the Nakarkos rank pair / fall / record"
        " table, Valstrax (7, 0x33) and (3, 4), Ahtal-Ka's anchor sub-states 2 / 3, Soulseer's base12 deferred init, Kushala's frame handler, the"
        " Gammoth / Elderfrost leg snow; fixed index.html unitGamePos (the unit's in-pass travel) and slam060's attributed ground.")
b = b[:d] + done.encode('utf8') + NL + b[d:]
open(P + '.tmp', 'wb').write(b)
os.replace(P + '.tmp', P)
print('ok', b.count(b'\x00'))
