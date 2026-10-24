# board_batch.py: the task board (C:\Coding Repos\MHGU-TASKS.md; NUL bytes, CRLF) -- byte replace, os.replace of a .tmp
import os
P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read()
NL = b'\r\n'
def rep(old, new):
    global b
    assert b.count(old) == 1, (old[:60], b.count(old))
    b = b.replace(old, new)
rep(b"      - [ ] Akantor: his burrow tell (the bulge before he bursts out, L0 Motion[2]) is built but the clip menu offers no copy that" + NL +
    b"        plays it -- needs a copy entry for (6, 3) (asked).",
    b"      - [x] 2026-10-20 -- Akantor: his burrow tell (the bulge before he bursts out) plays from the clip menu as L0 Motion[2]_loop C" + NL +
    b"        (a new copy for (6, 3); its label is a working copy letter).")
rep(b"        picks one side's three; the next action start fires them). Open: the maker's point query 0xb3ca0 (likely the arena's own" + NL +
    b"        launch points), its tail, base59. And sp_00 (type 14, object-gated), the 8 run-time event lists in bss.",
    b"        picks one side's three; the next action start fires them). 2026-10-20: the launch points are READ -- his own data (his" + NL +
    b"        arc's area_patrol file, map 27 area 1), six fixed points in his arena's own coordinates, three each side; the maker is" + NL +
    b"        read whole (a random pick per rocket); base59's init is read (the rocket model em087_00_rocket). Open: base59's move and" + NL +
    b"        the class's three overrides; and where to put arena coordinates in a viewer with no arena (question for Raven: anchor" + NL +
    b"        them on him, or leave them absolute 40-50 m out). Also sp_00 (type 14, object-gated), the 8 run-time event lists in bss.")
anchor = b"      - [x] 2026-10-20 -- YIAN GARUGA and DEADEYE:"
i = b.find(anchor); assert i > 0
add = (b"      - [x] 2026-10-20 -- TIGREX / GRIMCLAW on the Ground setting: his rocks follow the floor under him -- Ground E throws the second" + NL +
       b"        set, Grounds A and F the third (which shows nothing: the game has no effect for it), the rest the first. The fourth" + NL +
       b"        set needs a ground type the page does not offer yet. Checked on the page." + NL +
       b"      - [x] 2026-10-20 -- Shagaru's ground lines (L4 Motion[15]) end where the game ends them, 105 m out; the end effect is there." + NL +
       b"      - [ ] (pending) Shell records for Gravios, Tigrex, Grimclaw, Akantor, Barioth, Seregios, Barroth, Uragaan, Crystalbeard," + NL +
       b"        Glavenus, Hellblade, Kut-Ku, Gypceros, Iodrome, Giadrome, Garuga, Deadeye and Diablos: exported and being recorded" + NL +
       b"        2026-10-20; lift, soak and the draw meter follow." + NL)
b = b[:i] + add + b[i:]
open(P + '.tmp', 'wb').write(b)
os.replace(P + '.tmp', P)
print('board updated')
