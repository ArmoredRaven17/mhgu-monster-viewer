p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "| `<scratchpad>\\duo\\emclink.py`"
assert s.count(anchor) == 1, s.count(anchor)
i = s.index(anchor); j = s.index(nl, i) + len(nl)
row = ("| `<scratchpad>\\fb\\emu_fb.py` (+ `trgen.py`, `cengen.py`, `emc023.py`, `rec_shellrec.py`) (shells agent, Fanged Beasts / em061, 2026-10-17..18) "
       "| a monster's shells on the WHOLE executable (unicorn, after the static initialisers): the class's action main with the action / ids / "
       "window answered, every created shell flown from its own setup, children to depth 2. Case options: `track` (owner motion per frame), "
       "`slot0`, `convert` (the monster's call on a held, landed shell, before the move: Rustrum's 0xf34a20 / 0xf34b4c), `pokes` + "
       "`pokeDepth` (owner bytes before a move), `ownvt54` (owner vt+0x54 = 0xc156c, a joint's world matrix); the ray 0x183664 meets the "
       "floor from below too. `emc023.py <emc> <variant> st,n..`: the issuers of an action with op 0x92 evaluated per variant "
       "| dev/shells-*-check.mjs controls FAIL (a joint, a facing, the floor, the target); emc023: g5 s1 (7, 5) drops out at variant 4 / 5 "
       "| stubs answer 0 outside the hooked set; the stage is a plane |")
s = s[:j] + row + nl + s[j:]
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
