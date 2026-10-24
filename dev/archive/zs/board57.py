p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"(7:0x0d / 0x0c), as the AI's choice is not read; his L4 M33 / M34 (linked-only in the game) also fire on solo Seltas.\n"
assert b.count(anchor) == 1, b.count(anchor)
assert b'ZINOGRE / THUNDERLORD SHELLS 2026-10-17' not in b
note = """      - **ZINOGRE / THUNDERLORD SHELLS 2026-10-17** (the Fanged Wyvern effects agent found them unread). READ + BUILT, uncommitted:
        one class (uEm057_00); ids are fields (0xf7 / 0xf8 Zinogre, 0xf9 / 0xfb / 0xfa Thunderlord; Zinogre has no sp_11). sp_18 is a
        NEW base, base18 (the thunderbug's sine weave). Shown: the thunderbug leaps (L2 M31 f88 / M32 f58, picks 7:0x20 / 0x69 / 0x3d
        / 0x7a; two or three bugs charged), Zinogre's G-rank escort bugs (L2 M15 / M18 / M24 / M26 / M30 / M37 / M38), the L0 M20
        (7, 0x71) twelve strikes (u 60 -> u 61; Thunderlord's at the target, charged faster), the L2 M60 / M1 / M2 ground rays,
        Thunderlord's L2 M30 tail bolt (enraged + charged), L2 M15 / M18 charged trio, L9 M1 / M4 / M5 slam shells and the charged
        rays' trailing strike lines (shell11). Charged = the Charge State rung. Checked bit for bit against the ROM run
        (dev/shells-zinogre-check.mjs 43 / 43; page 6 / 6); soaks em057_00 87 / 0 refused, em057_04 92 / 0; dev/checks/em057_00.mjs
        169 / 169. 22 records exported (probe 22 / 22); u 2 / u 12 (Thunderlord's bug bursts) recorded + lifted. Spec
        dev/em057-shells-spec.md.
      - [ ] (question, Raven) the leap's bug heading is the yaw at the clip's start; for Thunderlord's charged L2 M15 / M18 trio and
        the M32-only plays the game uses the LAST leap's heading, which the viewer does not keep (stand-in, spec 5).
      - [ ] (later) Zinogre's L2 M1 / M2 ground ray (mode 12) is never shown: at G his (7, 0xfb / 0xfc) never happen (the remap),
        so CLIP_ACTIONS plays (7, 0xe9 / 0xea). Below G it would fire -- only if a rank control is ever added.
"""
b = b.replace(anchor, anchor + note.encode('utf8'))
open(p, 'wb').write(b)
print('ok')
