p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape', newline='').read()
nl = '\r\n' if '\r\n' in s[:5000] else '\n'
def rep(a, b):
    global s
    a = a.replace('\n', nl); b = b.replace('\n', nl)
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
rep("""      - [ ] (open) Congalala u 200 (the dung, L2 M12) still refuses live: "call to 0xa60744, which is not translated (from 0xa5fee0)" --
        a particle branch the recorder never takes (shell plans for 7:0x0a / 0x0b / 0x49 and rec_lod.py's _lodmid / _lodfar sets all miss
        it; 0xa76eb8 before it is now lifted). 0xa60744 / 0xaea528 / 0xaf42b0 / 0xaf9aac are on the lifted-added line waiting for a set
        that reaches them. Read what 0xa5f088 / 0xa5fdf0 test (the particle's [+4] bit 0x4000) before recording again.""",
"""      - [x] 2026-10-18 -- Congalala u 200 (the dung, L2 M12) no longer refuses (soak em021_00 56 / 0 refused; page check 18 / 18, the
        L2 M16 gas breath included). THE TEST, read: the particle update 0xa5fdf0 switches on the generator's type -- gen+0x40 bits 20..23,
        the efl row's word [row+0xc] & 0xf (written by 0xa55fe0) -- when gen+0x10 bit 2 is set and a particle is live (gen+0xb0); type 6
        -> 0xa60744, which runs 0xa63efc per live particle (0xa607e8). em021_00_004 row 10 (u 200's UNIQUE) carries type-6 generators.
        WHY NO SET REACHED IT: vecdrawsched.py records only the routines on lift-effects.sh's lift lines, and the recordings so far were
        of the clip (SEQUENCE u 200), not the shell's UNIQUE record. Fix: 0xa60744 and 0xa63efc's static callee closure on the
        lifted-added line, then standalone UNIQUE recordings (scratchpad fb/rec_shellrec.py: add_em021_00_shellrec_u200 / _u0, plain and
        _near), lifted from a copy. (The closure's 0xa7719c / 0xa74884 / 0xa75290 / 0xa75434 / 0xa74d18 / 0xa70678 / 0xaf8b40 /
        0xaf873c / 0xaf85b8 / 0xa66224 have no recorded blocks: not reached by these records; a refusal names one if it ever is.)""")
rep("""      - [ ] (next) Duramboros / Rustrum (em061): census done (scratchpad fb/cen2_em061_v0 / _v4.txt, ids are fields +0xcac8..+0xcad8);
        needs sp_00 (26 modes), sp_19 = NEW base19 (over base03), sp_24 = NEW base24 (Rustrum's L9), sp_13 (own init). Then em065, em083.""",
"""      - [x] 2026-10-18 -- Duramboros (em061_00): the rocks (L2 M28 / M22 / M21 / M23, 0x46..0x4f / 0x96 / 0xe6..), the L2 M56 lumps
        (sp_00 4..6 -> sp_01 at a contact) and THE BALL -- base19 over base03 (L2 M46 f94, L2 M56 f110): grows, rides the ground (base03's
        follow WITHOUT the slope step: 0x3fe740 tests +0x1664 bit 1, which Khezu's reader sets and Duramboros's never does), rolls, u 12 at
        its end. Check 18 / 18 (dev/shells-duramboros-check.mjs; the mode-7 shell (7, 0xe6) makes in the ROM starts nothing and dies on its
        first move: counted, not built). Records u 0 / 1 / 2 / 10 / 11 / 12 / 13 exported.
      - [ ] (next) Rustrum (em061_04): ids 0x108..0x10c (sp_00 / sp_01 / sp_13 / sp_19 / sp_24). sp_24 = NEW base24 (ctor 0x40da80 over the
        plain shell, not base00): L9 M3 (7, 0xed / 0xee / 0xf5) phase 0 PLACES one on the ground ahead (+0x12 = 1 -> 0x40e6f0); L9 M2 f85 /
        L9 M10 f104 THROW one (mode 0 / 1); it is held at e+0xcadc, sits until its life, and the next L9 M3 phase 1 rolls it as sp_19 2 / 7 /
        8 (0xf34a20), L9 M10's (7, 0xe5) phase 1 turns it into sp_13 (0xf34b4c). Harness runs: scratchpad fb/r24cases.py (convert option).
        Then em065, em083.
      - [x] 2026-10-18 -- Rajang L2 M8's pick rotation carries g1 s35's direct (7, 0x3e) (no beam, no shell; the word lights it): six
        actions, bits 15-17 on 3 plays in 6 (dev/checks/em023_00.mjs / em023_05.mjs updated). EMC walk per variant (scratchpad
        fb/emc023.py): g1 s35 reached from g0 s3 / s14 / s17 with no op 0x92 around it, at variants 0 and 5 alike.""")
open(p, 'w', encoding='utf8', errors='surrogateescape', newline='').write(s)
print('ok')
