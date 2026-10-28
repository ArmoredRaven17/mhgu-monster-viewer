import os
def patch(p, reps, crlf):
    d = open(p, 'rb').read().decode('utf-8')
    N = '\r\n' if crlf else '\n'
    for a, b in reps:
        a = a.replace('\n', N); b = b.replace('\n', N)
        assert d.count(a) == 1, (p, a[:80])
        d = d.replace(a, b)
    open(p + '.tmp', 'wb').write(d.encode('utf-8'))
    os.replace(p + '.tmp', p)
    print('ok', p)

ARC = '<archive>' + chr(92) + 'gapR' + chr(92)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
row_old = "| uEm043_00 v5 shells | R (files) | for the shells lane |"
row_new = ("| uEm043_00 v5 shells | R (files) | for the shells lane -> **ANSWERED 2026-10-25 (shells lane): ROM GIVES NOTHING** -- no maker makes those modes; the row below |\n"
  "| `0xe7b1d4` status-7 switch -> `bl 0xe78e34` at `0xe7c084` (its ONLY caller; `0xe78fec` only from `0xe78f5c`) | the 96 rock cases, emulated one per number (" + ARC + "sw7.py, every case reaching the call with no helper call before it): (r1 = number & 3 order, index, kind, sub) = **0x08 / 0x09 / 0x13 / 0x14** idx 0 kind 0; **0x15..0x1c** idx 1..2 kind 0; **0x22..0x25** idx 3 kind 0; **0x3e..0x4d** kind 1 idx 0..3; **0x4e..0x5d** kind 2 sub 0 idx 0..3; **0x5e..0x6d** kind 3 sub 0; **0x6e..0x7d** kind 2 sub 1; **0x7e..0x8d** kind 3 sub 1 -> shell00 modes 0..3 / 4..7 / 8..11 / 12..15, shell54 0..3 / 4..7. The variant byte is not read (one switch for Deviljho and Savage) | uEm043_00 | R (emulated) | supersedes the hand reading of shells-em043.md 6 / 9.1 (it agrees) |\n"
  "| which rock cases are ISSUED (Deviljho and Savage: em043_00_cmdtbl.emc, one md5 in both arcs) | only **0x08 / 0x09 / 0x13 / 0x14** (g1 s36), **0x4e..0x51** (g1 s56), **0x5e..0x61** (g1 s57): shell00 modes **0** and **8**, shell54 mode **0**. None of the other 84 rock numbers in ANY of the 155 streams (op 0x00 7 n, reached or not, " + ARC + "rawrock.py; the parse ends every stream on 0xff, no unknown op), nor in the op-0x14 walk (issued043.py, 46 actions), nor as a literal or vt+0x3d0 change in the class band 0xe72738..0xe83434 (issuers.py: (7, 0x26 / 0x30 / 0x34 / 0x96) only; its two computed sites are vt+0x3dc and a script start) or in the shared layer 0x40000..0xc9000 (no literal status 7). So shell00 modes 1..7 / 9..15 and shell54 1..7 are never made: **ROM GIVES NOTHING** for the records only they name -- Savage u 1..3 / 11..13 / 41..43 / 51..53 (and u 40 / 50 / 100, already refused), Deviljho u 1..3 / 11..13 / 31..33 / 41..43 (and u 30 / 40 / 50). All exist in UNIQUE; none exported. CONTROL: the same three scans find exactly the twelve issued rock numbers, whose modes draw on the page (u 0 / 10 / 20, dev/shells-draw-table.md) | uEm043_00 | R (negative, controlled) | spec em043_00 6 |\n")
traps_anchor = None
d = open(R, 'rb').read().decode('utf-8')
t146 = [l for l in d.split('\r\n') if l.startswith('146. ')]
assert len(t146) == 1
trap = ("148. **A shell file's modes are not the class's repertoire (2026-10-25, Savage u 51).** A .shl names an ef for every mode it holds -- "
        "Savage's shell00 has sixteen, shell54 eight -- but the maker picks a mode from the action's own arguments, and the AI issues three of "
        "the 96 rock actions' groups. Read which actions reach the maker and which the command table issues (" + ARC + "sw7.py + rawrock.py) "
        "before calling a named record missing work.")
patch(R, [(row_old, row_new), (t146[0], t146[0] + '\n' + trap)], True)

S = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em043_00-effects-spec.md'
sec = ("## 6. The rocks' unmade modes (shells lane, 2026-10-25; " + ARC + ")\n\n"
       "The shell files name an effect for every mode they hold (shell00 0..15, shell54 0..7). Savage's modes 12..15 / 4..7 name u 40..43 /\n"
       "50..53 / 100, Deviljho's u 30..33 / 40..43 / 50, and modes 1..3 / 5..7 / 9..11 name u 1..3 / 11..13 in both. **None of those modes is\n"
       "made.** The maker 0xe78e34 has one caller, the status-7 switch's tail at 0xe7c084; each of the 96 rock action numbers sets its own\n"
       "(r1, index, kind, sub) (emulated, sw7.py), and the command table (one file for both monsters) issues only twelve of them -- (7, 0x08 /\n"
       "0x09 / 0x13 / 0x14), (7, 0x4e..0x51), (7, 0x5e..0x61) -- which give shell00 mode 0, shell00 mode 8 and shell54 mode 0, the three the\n"
       "viewer plays and the meter shows drawing. No stream (all 155, reached or not), no class chain and no shared-layer change issues any\n"
       "other rock number. So: **ROM GIVES NOTHING** for Savage u 1..3 / 11..13 / 41..43 / 51..53 (with u 40 / 50 / 100) and Deviljho u 1..3 /\n"
       "11..13 / 31..33 / 41..43 (with u 30 / 40 / 50). The records exist in UNIQUE and are not exported. rom-map: the rows under \"Savage u 51\".\n\n")
patch(S, [("## Open items read (2026-10-19)", sec + "## Open items read (2026-10-19)")], False)
