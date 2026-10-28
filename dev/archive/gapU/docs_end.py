import os
ARC = '<archive>' + chr(92) + 'gapU' + chr(92)
def patch(p, reps):
    raw = open(p, 'rb').read().decode('utf-8')
    for a, b, mode in reps:
        lines = raw.split('\n')
        idx = [i for i, l in enumerate(lines) if l.rstrip('\r').startswith(a)]
        assert len(idx) == 1, (p, a[:70], len(idx))
        i = idx[0]; end = '\r' if lines[i].endswith('\r') else ''
        if mode == 'after': lines[i + 1:i + 1] = [x + end for x in b.split('\n')]
        elif mode == 'append': lines[i] = lines[i].rstrip('\r') + b + end
        raw = '\n'.join(lines)
    open(p + '.tmp', 'wb').write(raw.encode('utf-8')); os.replace(p + '.tmp', p); print('ok', p)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
d = open(R, 'rb').read().decode('utf-8')
last = max(int(l.split('.')[0]) for l in d.split('\n') if l[:1].isdigit() and '. **' in l[:8])
row = ("| SHELLS OUTLIVE A ONE-SHOT CLIP -- built 2026-10-26 (shells lane; lane B3: Nakarkos's L0 M63 rock frozen at y 5991, clip held at f651) | "
       "the units are not the monster's motion: the move line steps every unit each frame (`0xc03670` / `0xc044c4`, the unit update order row), so "
       "a shell in flight lands and its effects run on after the motion ends. The viewer stepped its effect runtime on the clip's time only "
       "(index.html animAdvance), which stops at a one-shot clip's end -- three.js marks the finished LoopOnce action `paused` (r169 "
       "clampWhenFinished), the flag the Play button and the scrubber set. Now the viewer marks ITS holds (`act.userHeld`: Play-to-pause, seekTo) "
       "and animAdvance hands an ENDED one-shot, not held by the user, the wall clock (null; as the held-pose rule above it); the clip's frame "
       "stays at its end, so no clip row fires again. Pause / scrub still freeze (0). Metered, one play each, 300-500 effect steps after the end "
       "(" + ARC + "endmeter.mjs, end_after2.out): **Nakarkos L0 M63** (651): 3 shells alive at the end, the rocks fall on and land (shell00 y 2031 "
       "-> shell01), u 3 st 3 draws; **Brachydios L2 M28** (173): the pool (alive at the end) explodes 199 steps after it, u 0 / u 1 draw; Savage "
       "L2 M24, Lao-Shan L2 M3: nothing alive at the end (unchanged); Alatreon L2 M21: 3 shell41 alive at y -537 and still alive 300 steps on "
       "(their own life, under the stand-in floor: not this change's). Each with the scrubber hold at the end: 0 steps, every shell frozen | "
       "viewer | built | trap " + str(last + 1) + " |")
patch(R, [("| `0x4a23f4..0x4a246c` | **HitParam int(i), read whole**", row, 'before')]) if False else None
lines = d.split('\n')
i = [k for k, l in enumerate(lines) if l.startswith('| `0x4a23f4..0x4a246c` | **HitParam int(i), read whole**')]
assert len(i) == 1
lines.insert(i[0], row)
t = [k for k, l in enumerate(lines) if l.startswith(str(last) + '. **')]
assert len(t) == 1
lines.insert(t[0] + 1, str(last + 1) + ". **The viewer's clip is not the game's world clock (2026-10-26, shells lane).** A one-shot clip that ends stops the "
             "animation time, and an effect runtime stepped on that time freezes every unit with it -- a rock mid-air, a pool's timer. The game's "
             "move line steps units whatever the motion does. Tell the viewer's own holds (pause, scrub) from a clip's natural end "
             "(three.js marks both `paused`) before freezing anything (" + ARC + "endmeter.mjs).")
open(R + '.tmp', 'wb').write('\n'.join(lines).encode('utf-8')); os.replace(R + '.tmp', R); print('ok rom-map trap', last + 1)
E = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\effect-runtime-engine.md'
patch(E, [("- **Clip frame vs action frame** (2026-10-26):",
           "- **After the motion ends** (2026-10-26): shells and effects run on -- they are units on the move line, stepped every frame whatever\n"
           "  the monster's motion (`0xc044c4`). A viewer that drives its effects from the clip's time must keep stepping them, on the wall clock,\n"
           "  once a play-once clip has finished, and freeze them only for the user's pause or scrub (index.html animAdvance, `act.userHeld`).", 'before')]) if False else None
raw = open(E, 'rb').read().decode('utf-8'); ls = raw.split('\n')
k = [j for j, l in enumerate(ls) if l.rstrip('\r').startswith('- **Clip frame vs action frame** (2026-10-26):')]
assert len(k) == 1
endc = '\r' if ls[k[0]].endswith('\r') else ''
ins = ["- **After the motion ends** (2026-10-26): shells and effects run on -- they are units on the move line, stepped every frame whatever",
       "  the monster's motion (`0xc044c4`). A viewer that drives its effects from the clip's time must keep stepping them, on the wall clock,",
       "  once a play-once clip has finished, and freeze them only for the user's pause or scrub (index.html animAdvance, `act.userHeld`)."]
ls[k[0]:k[0]] = [x + endc for x in ins]
open(E + '.tmp', 'wb').write('\n'.join(ls).encode('utf-8')); os.replace(E + '.tmp', E); print('ok engine')
