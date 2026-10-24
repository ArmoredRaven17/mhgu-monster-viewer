import sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
APPLY = '--apply' in sys.argv
T = ' [doc audit 2026-10-24]'
def tail(s, add):
    # append to the last cell (before the closing pipe)
    s2 = s.rstrip()
    assert s2.endswith('|'), s2[-40:]
    return s2[:-1].rstrip() + add + ' |'
# (line, must-contain, fn)
E = [
 (274, '| holder members |', lambda s: s.replace('| R / I | em005-shells-spec §2 |', '| R (+0x10 `_hit`: read through `0x4a23f4`, row `0x4a23f4..0x4a246c`, gapO) / I | em005-shells-spec §2 |')),
 (1405, '`0x108a330` / `0x108b2e8` | second generation', lambda s: tail(s, ' -- **`0x108a330` UPGRADED 2026-10-20 (modes 2..4): see "Nakarkos -- the rank pair" below**' + T)),
 (2614, "Neset's rocket gate and its handles", lambda s: tail(s, " [WITHDRAWN 2026-10-21 (gapJ): six handles, not nine; the switch is vt+0x204's `0x10a74fc`, READ -- Withdrawn table, row `0x10a7bac`]" + T)),
 (2635, '`0x4340fc` / `0x4342ac` (base58)', lambda s: tail(s, ' [WITHDRAWN 2026-10-22 (gapN): +0x158c is the entry count; the capsules are the table +0x1594, the hunter-pass shapes of j0 1010 -- rows `0x3fc1c8` / `0x4340fc` in "Shell infrastructure"]' + T)),
 (2826, '`0x16acf0` (the hit manager', lambda s: tail(s, ' -- **`0x16940c` is the named-target filter, not a shape test (Withdrawn table, gapM 2026-10-22)**' + T)),
 (2847, 'her linked vs unlinked streams', lambda s: tail(s, ' [the "22 clips solo" reading is WITHDRAWN: Withdrawn table, duo census first pass; final classes spec §14.5 / `<archive>\\duo\\table3.md`]' + T)),
 (2860, '| VIEWER (implemented) | ROM_PARTNER_BODY.em069_00 `classes` (re-read solos)', lambda s: s.replace('`classes` (re-read solos)', '`classes` (final §14 classes; was "re-read solos")', 1)),
 (2988, '`0x105fd94(e)`', lambda s: tail(s, '; EMC reach: em083_00 reaches 0, 1, 5, 6, 0x5a..0x5d (not 0x32 / 0x70 / 0x71; ships no list 9); em083_04 reaches 5, 6, 0x5b, 0x5d, 0x70, 0x71 (`<archive>\\gapG\\RESULT.md`)' + T)),
 (3147, '| em027_00 L1 M7 f70 (c 30) |', lambda s: tail(s, ' -- status note: the list-1 -> em024_00_1.lmt file resolution is INFERRED in gapI (the engine\'s list-1 resolution not traced); the viewer clip is 61.0 frames = numFrames, one longer than the game\'s 60 (not investigated) (`<archive>\\gapI\\RESULT.md` §a)' + T)),
 (3192, 'VIEWER: monsterFloorY on em025_00 L2 M45', lambda s: s.replace('proposed FLOOR_AT_UNIT_CLIPS', 'FLOOR_AT_UNIT_CLIPS (applied: docs/index.html, seen 2026-10-24)', 1)),
 (3376, 'Ahtal-Ka anchor releases', lambda s: tail(s, ' (`0x4380e4` / `0x43a374` are NOT releases: they set sub-state 2 (re-aim / orbit-on); the releases are `0x438204` / `0x43a39c` -- gapE)' + T)),
 (3418, "Kushala's c 29 / 30 / 32..35", lambda s: s.replace('| uEm024_00 shells | open (makers) |', '| uEm024_00 shells | R (closed 2026-10-20, gapF) |', 1)),
]
raw = open(P, 'rb').read(); L = raw.decode('utf-8').split('\n')
for n, key, fn in E:
    s = L[n - 1]
    assert key in s, (n, key, s[:120])
    new = fn(s)
    assert new != s, ('nochange', n)
    L[n - 1] = new
    if not APPLY: print(n, '...', new[-220:])
if APPLY:
    assert open(P, 'rb').read() == raw
    open(P, 'wb').write('\n'.join(L).encode('utf-8'))
    print('applied', len(E))
