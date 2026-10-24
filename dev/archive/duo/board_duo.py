# board_duo.py: the duo outcome under "### Seltas Queen + Seltas duo form" on the task board (never committed).
# Binary-safe (the board holds a NUL byte elsewhere); keeps the file's own line endings.
P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read()
s = b.decode('utf-8', 'surrogateescape')
nl = '\r\n' if '\r\n' in s[:5000] else '\n'
assert 'DUO REVIEW 2026-10-17' not in s
head = s.index('### Seltas Queen + Seltas duo form')
end = s.index('- [x] 2026-09-14 -- **Armor Viewer: Eye Color', head)
item = '''- [ ] 2026-10-17 (feature, READ + BUILT, uncommitted) **DUO REVIEW 2026-10-17 -- every clip of hers, his clip under it, his form.**
      Raven: *"Review all Seltas Queen and Seltas combined animations"*, *"Ensure we do not allow them to be combined when
      they are not meant to be combined"*, *"ensure Seltas is in the correct form (mainly his claws)"*, *"some animations
      where Seltas is grabbed by the Queen ... But not all"*, *"the animations where she grabs him to smash him to death,
      he freezes up currently"*, *"We need to ensure their animations are sync'd up more."* Spec: dev/em069-duo-spec.md;
      map: rom-map "Seltas Queen + Seltas -- the duo".
      - **His clip is her REQUEST.** Her vt+0x204 (0xf89228) writes k into [+0xcac0]+0x18, her 0xf8ae90 waits for the action
        k names, he runs his em076_00_cmdtbl g7 stream k (2 -> M6, 3 -> M9 / M5, 5 -> M7, 6 -> M16, 7 -> jump off,
        8 -> M14 / M3 / M4, 9 -> M3, 0xb -> M71 / M73, 0xc -> M35 / M79 / freeze, 0xd -> M48, 0xe -> M45). No request: his
        ride, L4 M35 (1:0). The 2026-09-14 same-number list-4 rule is gone (it froze him on her M46 / M47).
      - **Classes of her 158 clips**: combined 25 (mounted even with the row Off), solo 3 (L0 M16 the eat of a dead male,
        L4 M29 he never came), release 5 (L4 M68 she shakes him off; L3 M12 / M18 / M35 / M36 death clips: request 7, he
        leaves at frame 0), both 112 (the row decides), unresolved 13 (L0 M21..M26, L4 M12, M21, M35, M74, M75, M89 -- no
        action plays them at variant 0; treated as both). The row is locked (with the reason) on the first three.
      - **Claws: part 10 under every clip of hers** -- his vt+0x204 zeroes the claw stage at every action start (0xfc4808);
        only his own riding attacks M31 (f30..134) / M32 (f22..190) and his solo L2 attacks grow it. REPLACES the part 103
        of 2026-09-14 (Raven's look, not a ROM read). Glow part 9 on while linked. Wings: the ROM puts them out (+0x49 = 2)
        in several answers (M7, M16, M4, M5, M3, M46 / M47, M27); the viewer keeps Wings Away (his rule).
      - **Grabs**: joint 200 animates in exactly L4 M27, M28, M76..M79, M96, L3 M12 / M18 (scan of all 158; the board's
        list -- nothing new carries him). Newly found: L4 M8 is the LANDING combine (his 1:0x2, link at start), L4 M68 the
        shake-off; he is LINKED from his 1:0x1a start (M27), not only from 13:1. The tail-tip relink correction holds
        (only her variant-1 7:0x49 / 7:0x50 ask for it; positive control 7:0x4d reached).
      - **Kill grab**: the ROM's "smash" is M76..M79 (attack 0x2b at M78 f0 / 84 / 156); after it her table eats a DEAD male
        (g1 s52 -> s46 -> 1:0x1c L0 M16). Nothing in either class kills him (every call on the partner censused) -- the
        hit of 0x2b on him is the shared hit system's, NOT READ. **His freeze in M78 / M79 is the ROM's** (his 1:0x21 sets
        motion speed 0, 0xb07b4 at 0xfc99fc) and is kept; the freeze on M46 / M47 was the viewer's and is fixed.
      - **Sync**: one clock (his time set from hers every step; composed picks are her clip's whole frames), his clip
        continues across her two-clip actions (M17 from 137, M24 from 49, M15 from 37, M26 from 39, L3 M24 from 181),
        setMotion blends modelled in joined clips (her M77 / M79 b4, his M79 b4, M3 b20 / b40, M9 b4, M45 b10). The
        enemy update order is NOT READ (spawn slot order); the M78 / M79 hold frame (4) is the same either way.
      - Check: dev/checks/em069_00.mjs duo block, 32 / 32 (the file's 1 FAIL, "13 event ... 2 ragePuff" -> 35 event,
        fails at HEAD too: not this change).
      - [ ] (question, Raven) Seltas' list 4 is nearly all duo clips (M3..M9, M14, M16, M27, M28, M31..M35, M43, M45..M48,
        M71, M73, M77..M79 are his answers / riding attacks / combine). Solo Seltas still offers them -- keep, or hide on
        solo? Nothing removed.
      - [ ] (question, Raven) Claws: the ROM shows the retracted claw (part 10) on her back; the massive claw only during
        his own riding attacks M31 / M32. And solo Seltas DOES grow them in his L2 attacks (0xfd1650.., 0xfd43dc..),
        against "Seltas as a solo monster does not use the massive claw model" -- show the stage on solo Seltas too?
      - [ ] (question, Raven) Wings on the mounted Seltas: keep Away, or show the ROM's out / flapping in the answers that
        set them?
      - [ ] (later) his riding attacks (7:0x32 / 0x33 M31 / M32 with claws, 7:0x34 / 0x39 M33) are chosen by his own
        table while she does anything: offer them as Special entries over her ride clip? And her 7:0x4d -> 7:0x4e (L0 M65)
        -> 7:0x4f (L4 M42 from f90) with his 7:0x3f (M33 x up to 3) is not fully read (spec §10).
'''.replace('\n', nl)
s = s[:end] + item + s[end:]
open(P, 'wb').write(s.encode('utf-8', 'surrogateescape'))
print('ok', nl == '\r\n')
