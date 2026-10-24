p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "        stands at the origin. Show it there (as the ROM), or move the stage / camera to his fortress position per motion?\n"
assert s.count(a) == 1
add = (
"      - [x] 2026-10-18 -- THE FATALIS LINE'S SHELLS (spec dev/elder-dragon-shells-spec.md 3): one class, three monsters -- which actions\n"
"        each plays read from the command table with its variant switch (each makes only its own shells, the control). Fatalis: aimed\n"
"        fireballs and their landing fire, the dust of his landings, and the sweeping blast (a new base, base51). Crimson: the same plus\n"
"        the METEORS (from 7500 up, a ground mark under each until it lands) and his side bursts. Old: the meteors as lightning strikes,\n"
"        his sweeps about a point. Checks 36 / 34 / 30 and pages 9 / 13 / 15; soaks clean.\n"
"      - [ ] (bug) Effects runtime refuses four Fatalis-line shell records (withheld from the exports until lifted, effects lane):\n"
"        em013_00c u30 the dust (0xa5846c), em013_02u u100 / u110 Old's lightning (0xae9d38), u200 / u201 his L4 M7 fireball (0xcace4c).\n"
"      - [ ] (idea) Fatalis line, not built yet: the turning flame (7, 0x28 / 0x29 / 0x2f / 0x30 / 0x34 / 0x35 -- the clip and the fire\n"
"        picked from the hunter's bearing mid-action), Old's (7, 0x49) joint-aimed fireball, the phase-3 landing dust of the flying\n"
"        attacks (its clip unread).\n"
)
s = s.replace(a, a + add)
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')
