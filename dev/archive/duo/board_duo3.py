# board_duo3.py: the grabs / couplings / his own loop follow-up under the DUO REVIEW item (binary-safe; never committed)
P = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(P, 'rb').read().decode('utf-8', 'surrogateescape')
assert 'GRABS, COUPLINGS, HIS OWN LOGIC 2026-10-17' not in s
i = s.index('DUO REVIEW 2026-10-17')
j = s.index('- [ ] (question, Raven) Seltas\' list 4 is nearly all duo clips', i)
item = '''- **GRABS, COUPLINGS, HIS OWN LOGIC 2026-10-17** (Raven: "some animations the queen is literally grabbing him, we can
        sync such animations", "anytime they sync up we need to sync them up", "Where he is mounted but free to make
        choices, we let Seltas follow his logic", "L4, M79 Seltas is not only stiff, but the pose is also odd looking").
        Spec §11..§13. **Grabs by geometry** (her pincers 160 / 161 to his root, all 158 clips): she holds him in L4 M27 loop
        (1.80..2.00), M28 (to ~f220), M77, M78, M79 (to ~f128) -- max gaps 2.00 / 1.96 / 1.66 / 1.20 / 1.10, asserted;
        M96 is a reach (2.58 at best), L3 M12 / M18 not a hold (he has left). **M79 pose**: the viewer's held frame equals
        his M79 frame 4 played solo (0.006 rad); M79 is a struggle loop, so the ROM freezes a mid-struggle instant (joint 5
        81 degrees off his ride pose) -- the ROM's, nothing wrong in the viewer (frame 4 +-1 by an unread "ended" bit).
        **Couplings**: 17 rows (requests 2..0x10, the tail grab, both combines, the landing, the shake-off, his separation,
        the flinch cut, her waits) with her frame / his frame / address; new: her 7:0x4d..0x4f + his 7:0x3f (his M33 to 105
        -> her M42 from 90; his M35 to 40; M33 from 100) on "Seltas (combined)". **His own logic** under her plain clips:
        ride M35 to frame 180, then his table's draw (20 M31 / 70 M32 / 10 ride) with the game's xorshift128, seeded by her
        clip -- reproducible on a scrub, varying across her loop passes. Check 51 / 51.
        - [ ] (question, Raven) the one INFERRED switch in his draw (op 0x77 taken as case 0; cases 1 / 2 would add his M33
          attacks) -- read 0x8e088 through if his M33 should appear under her plain clips.
'''
s = s[:j] + item + '      ' + s[j:]
open(P, 'wb').write(s.encode('utf-8', 'surrogateescape'))
print('ok')
