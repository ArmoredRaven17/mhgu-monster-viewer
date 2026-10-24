import os, sys
REPO = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
LOST = ' [not archived: gone from the scratchpad before the 2026-10-24 archive]'
LOSTD = ' [folder empty by the 2026-10-24 archive: these scripts are lost]'
P = [
 # (file, line, old, new)
 ('dev/beams/em005_00.md', 98, r'`C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\beamsA\`', r'`<archive>\beamsA\`' + LOSTD),
 ('dev/beams/em020_00.md', 86, 'The scratch harness is `beamsB/harness.py` in the session scratchpad:', 'The scratch harness is `<archive>\\beamsB\\harness.py`' + LOST + ':'),
 ('dev/beams/em058_00.md', 4, r'`%TEMP%\claude\...\scratchpad\beamsD\`', r'`<archive>\beamsD\`' + LOSTD),
 ('dev/beams/em038_00.md', 110, 'Scratch (<archive> `beamsC\\`):', 'Scratch (<archive> `beamsC\\`; only `e615e8.txt` survived to the 2026-10-24 archive, the scripts below are lost):'),
 ('dev/effect-bb43ac-flag8.md', 4, 'unicorn scripts in the session scratchpad', 'unicorn scripts in the session scratchpad, archived as'),
 ('dev/effect-bb43ac-flag8.md', 5, "(`<archive>/bb43ac/`: `probe1.py`..`probe5.py`, `mk_vds.py` -> `vds_prim.py`).", "(`<archive>/bb43ac/`: `probe1.py`..`probe5.py`, `mk_vds.py` -> `vds_prim.py`; the folder was emptied before the 2026-10-24 archive: these scripts are lost)."),
 ('dev/effect-bb43ac-flag8.md', 93, '`<archive>/bb43ac/blk2.py`;', '`<archive>/bb43ac/blk2.py`' + LOST + ';'),
 ('dev/effect-bb43ac-flag8.md', 143, '`<archive>/bb43ac/mk_vds.py` applies', '`<archive>/bb43ac/mk_vds.py`' + LOST + ' applies'),
 ('dev/effect-bb43ac-flag8.md', 186, '## 6. Scratch (session scratchpad, `bb43ac/`)', '## 6. Scratch (session scratchpad, `bb43ac/`; archived path `<archive>/bb43ac/`, but the folder held only an empty `liftset/` by 2026-10-24: everything listed here is lost)'),
 ('dev/em049-heat.md', 12, '`<archive>/em049heat/heatprobe.py`', '`<archive>/em049heat/heatprobe.py`' + LOST),
 ('dev/em084-arm-pairings.md', 4, 'the scratchpad wrapper `naka_shells/dd.py`.', 'the scratchpad wrapper `<archive>/naka_shells/dd.py`' + LOST + ' (a `dd.py` of the same name survives in `<archive>/gapC/`; whether it is the same wrapper is not checked).'),
 ('dev/em084-arm-pairings.md', 5, '(`<archive>/beamsD/drv.py`)', '(`<archive>/beamsD/drv.py`' + LOST + ')'),
 ('dev/em084-shells-spec.md', 4, 'a PIC-resolving wrapper in the scratchpad', 'a PIC-resolving wrapper in'),
 ('dev/em084-shells-spec.md', 5, '`naka_shells/dd.py`); cross-checks under unicorn with the beams lane\'s driver (`<archive>/beamsD/drv.py`,', '`<archive>/naka_shells/dd.py`' + LOST + '); cross-checks under unicorn with the beams lane\'s driver (`<archive>/beamsD/drv.py`' + LOST + ','),
 ('dev/em084-class-effects.md', 6, '(<archive> `e84/h.py`, `run1.py`, `run2.py`).', '(<archive> `e84/h.py`, `run1.py`, `run2.py`' + LOSTD + ').'),
 ('dev/em084-phase2-bases.md', 5, '(`p2bases/uc_check.py`, `p2bases/census.py`).', '(`p2bases/uc_check.py`, `p2bases/census.py`' + LOSTD + ').'),
 ('dev/em084-phase2-bases.md', 439, '| — | — | not in the repo |', '| — | — | not in the repo;' + LOSTD + ' |'),
 ('dev/em084-c131.md', 5, 'Unicorn cross-check in scratchpad', 'Unicorn cross-check in'),
 ('dev/em084-c131.md', 6, '`c131/emu.py`.', '`<archive>/c131/emu.py`' + LOST + '.'),
 ('dev/monster-review.md', 1206, '`<archive>/mpm.py`', '`<archive>/mpm.py`' + LOST),
 ('dev/monster-review.md', 2609, '`<archive>/seams.py`', '`<archive>/seams.py`' + LOST),
 ('dev/effect-runtime-engine.md', 15, '(all in the effects scratchpad or efx/)', '(all in the effects scratchpad, now archived at `<archive>` -- see rom-map "2. Tooling" -- or in efx/)'),
 ('dev/elder-dragon-shells-spec.md', 524, "decode helpers' scratchpad gapA / gapD)", "decode helpers' <archive> gapA / gapD)"),
 ('dev/em057-shells-spec.md', 8, 'Scratchpad: `zs/`', '<archive>: `zs/`'),
 ('dev/em081-shells-spec.md', 10, 'Scratch (not in the repo): `C:' + chr(92).join(['', 'Users','humph','AppData','Local','Temp','claude','C--MHGU-Extract-MHGU-Monster-Viewer','']), 'Scratch (not in the repo; archived 2026-10-24):'),
 ('dev/em081-shells-spec.md', 11, r'bbae25d7-...\scratchpad\bolt\`', r'`<archive>\bolt\`'),
 ('dev/em083-shells-spec.md', 115, 'with the gate held open (scratchpad', 'with the gate held open (<archive>'),
 ('dev/gu-lessons-for-3u-4u.md', 103, "(script in this session's scratchpad,", "(script in <archive>,"),
 ('dev/rom-map.md', 1555, 'scratchpad, not in the repo)', '<archive>, not in the repo;' + LOSTD + ')'),
 ('dev/rom-map.md', 1273, '<archive> beamsB/run_em020_sweep.py', '<archive> beamsB/run_em020_sweep.py' + LOST),
 ('dev/rom-map.md', 1274, 'run_em019_control.py', 'run_em019_control.py' + LOST),
 ('dev/rom-map.md', 1526, 'via <archive> naka_shells/dd.py)', 'via <archive> naka_shells/dd.py' + LOST + ')'),
 ('dev/rom-map.md', 1574, '<archive> `p2bases/census.py`', '<archive> `p2bases/census.py`' + LOSTD),
 ('dev/rom-map.md', 1839, '<archive> hz049/hzprobe2.out', '<archive> hz049/hzprobe2.out' + LOST),
 ('dev/rom-map.md', 1841, '<archive> hz049/ (', '<archive> hz049/' + LOSTD + ' ('),
 ('dev/rom-map.md', 1917, '<archive> `trace-soak.mjs`', '<archive> `fw/trace-soak.mjs`'),
 ('dev/rom-map.md', 3820, '`<archive>/basshell.py` (this session)', '`<archive>/basshell.py` (this session)' + LOST),
 ('dev/rom-map.md', 3827, '(`<archive>/beamsA/*_runs.txt`)', '(`<archive>/beamsA/*_runs.txt`' + LOST + ')'),
 ('docs/render/shells.js', 2566, '(<archive> naka_shells/arcmodes.json', '(<archive> naka_shells/arcmodes.json' + LOST),
 ('docs/render/shells.js', 3134, 'all three tiers 0 / 2: scratchpad', 'all three tiers 0 / 2: <archive>'),
 ('docs/render/shells.js', 7247, '(scratchpad bolt15:', '(<archive> bolt15:'),
 ('docs/render/shells.js', 15047, 'Checked against the ROM run on unicorn (scratchpad', 'Checked against the ROM run on unicorn (<archive>'),
]
APPLY = '--apply' in sys.argv
byfile = {}
for f, ln, old, new in P: byfile.setdefault(f, []).append((ln, old, new))
bad = 0
for f, edits in byfile.items():
    path = os.path.join(REPO, f)
    raw = open(path, 'rb').read(); lines = raw.decode('utf-8').split('\n')
    for ln, old, new in edits:
        L = lines[ln - 1]
        if L.count(old) != 1:
            print('NOMATCH', f, ln, repr(old)[:80], '|', L[:200]); bad += 1; continue
        lines[ln - 1] = L.replace(old, new)
        if not APPLY: print(f, ln, '->', lines[ln - 1][:300])
    if APPLY and not bad:
        if open(path, 'rb').read() != raw: print('CHANGED UNDER US', f); continue
        open(path, 'wb').write('\n'.join(lines).encode('utf-8'))
print('bad', bad)
