import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b'## Monsters (`MHGU-Monster-Viewer`, built 2026-09-04, deployed as TEST)\n'
assert b.count(anchor) == 1, b.count(anchor)
nl = b'\r\n' if (anchor.rstrip(b'\n') + b'\r\n') in b else b'\n'
lines = [
 "- [ ] (animation review) **Seltas Queen + Seltas: open considerations for Raven's animation review** (Raven, 2026-10-17:",
 "      \"Make notes of these considerations, these are less effects and how we will handle animations, so I will handle",
 "      them in the review for those\"). Everything ROM-read is built (uncommitted at the time of writing); these are the",
 "      animation-handling choices and unread animation logic left for the review. Detail: dev/em069-duo-spec.md.",
 "      - [ ] **The dead-male eat.** Her L0 M16 runs only when he is dead (EMC selector 4, 0xf89d48); her attacks cannot",
 "            hit him while linked (0x168f20 excludes a linked partner) and neither class kills him -- in game a HUNTER",
 "            kills him (e.g. while frozen on her back for 1200 frames after the tail grab). Option: a combined-list entry",
 "            of him dead on the ground (his death clip) + her walking to him and eating (L0 M16), his death standing in",
 "            for the hunter's kill. Raven remembers the smash killing him and leaving him on the ground; the ROM does not.",
 "      - [ ] **The tail-grab freeze.** He struggles (his M79 loop) through her M77 and freezes at frame 6 from her M78",
 "            frame 0 (0xfc9890), carried rigid back onto her back by M79, alive, then drops after 1200 frames (1:0x22).",
 "            Raven recalls him struggling during the smash; the ROM freezes him there. Looks stiff / odd by nature.",
 "      - [ ] **Wings row vs the ROM.** The ROM's flight state (0xfc66f8): out = part 4, flapping = part 2 / parts 1,3,4",
 "            alternating every 2 frames. The Wings row's Out is part 1 and its Flapping a fixed 2,3,4. The ROM overrides",
 "            the row on flying clips; elsewhere the row applies (default Away). Match the row's options to the ROM?",
 "      - [ ] **His wander after unlinking.** After a dismount he holds the idle the ROM picks (hover L1 M1 / ground L0 M1);",
 "            his next step is op 97's wander over the stage's navigation data (0x8b1fc), which the viewer has no stage for.",
 "      - [ ] **His riding-attack picks.** Under her plain clips he follows his own seeded draw (xorshift128 0x7c9234):",
 "            band 0 only (M31 20 / M32 70 / ride 10) -- the bands are his distance to the hunter (op 0x77), thresholds",
 "            unread; farther bands add M33 / M34. His M33 / M34 also fire on solo Seltas in the viewer though the game",
 "            only issues them linked.",
 "      - [ ] **Paired-action picks.** His L2 M17 / M57 attacks each have a silent twin ((7,0x0d) / (7,0x0c)) playing",
 "            the same clip; the AI's choice is unread, so the viewer alternates and half the plays throw nothing.",
 "      - [ ] **Turns not shown.** His +/-11 / +/-22 degree turns in his 7:0x3f answer, and the turns / facing changes in",
 "            both monsters' shell attacks; the viewer aims at its stand-in target point, not a hunter.",
 "      - [ ] **Her clips he answers with 'his ride'.** Under her 'both' clips with no request he plays his ride (L4 M35,",
 "            near-still) until his own pick at frame 180 -- the ROM's, but it reads as frozen on screen.",
 "      - [ ] **Raw lists alone, one combined list.** Her lists 0 / 3 / 4 play her alone; \"Combined (with Seltas)\" (153",
 "            entries) holds every duo animation, his-ride 'free' entries included. Naming, ordering and size are open.",
 "      - [ ] **Unread engine timing:** the enemy update order (spawn slot), the ROM's motion-blend curve (the viewer",
 "            blends linearly), what selects her event groups 12 / 18, what enters her 7:0x3e at variant 0 (L4 M74 / M75).",
]
block = nl.join(l.encode('utf-8') for l in lines) + nl
anchor_full = anchor.rstrip(b'\n') + nl
i = b.index(anchor_full) + len(anchor_full)
b = b[:i] + block + b[i:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok', nl)
