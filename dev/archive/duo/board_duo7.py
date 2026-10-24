P = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(P, 'rb').read().decode('utf-8', 'surrogateescape')
assert 'WINGS 2026-10-17' not in s
i = s.index('DUO REVIEW 2026-10-17')
j = s.index("- [ ] (question, Raven) Seltas' list 4 is nearly all duo clips", i)
item = """- **WINGS 2026-10-17** (Raven: "Seltas wing parts are not being toggled during flying sections"). READ + BUILT, solo and
        on her: his wing pass 0xfc66f8 (emulated) by [+0xcac0]+0x49 -- 0 folded (no card), 1 out (part 4), 2 flapping (part 2
        / parts 1, 3, 4 every 2 frames, period 4). Value per motion from the census (94 motions). The ROM wins where it flies
        (1 / 2); the Wings row applies on folded / unlisted clips. Spec §16; new check dev/checks/em076_00.mjs 9 / 9; duo
        block wing cases pass.
      - **SMASH RE-OPENED 2026-10-17** (Raven: stuck pose, struggling, left on the ground to be eaten). READ: he struggles
        through her M77 and freezes at her M78 (his 1:0x20 tests her 1:0x23, control 1:0x1f / 1:0x22); she writes nothing to
        him in M78 / M79; he stays linked and alive 1200 frames, then drops (1:0x22). Her eat (g1 s46 selector 4) needs him
        dead (status 11 / 14); whether her attack 0x2b can damage him is the shared hit system's -- NOT READ. Spec §17.
      - [ ] (read) his UNLINKED logic (Raven: "once delinked Seltas follows his normal logic"): decode the EMC ops his
        unlinked root stream uses (0x61, 0x9e, 0x3f, 0x54, 0x0c, 0x68, 0x0a, 0x24, 0x39) for "no hunter", then build the
        dismounts with their code movement (1:0x13 offset, 1:0x22 fall / turn / landing, read in spec §17) and his picks after.
      - [ ] (read) the shared hit system: can a monster's attack record hit its partner (her 0x2b on the male)?
      """
s = s[:j] + item + s[j:]
open(P, 'wb').write(s.encode('utf-8', 'surrogateescape'))
print('ok')
