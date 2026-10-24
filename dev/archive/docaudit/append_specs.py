import os
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
ADD = {
'em024_00-effects-spec.md': '''
## 8. Read since, indexed in rom-map (doc audit 2026-10-24)

* **His aura effect** (gapF, READ, NOT BUILT -- the effects lane's): in vt+0x208, `0xdf0514..0xdf0608`. e+0xcac4 holds id 1000 + L
  (L 1..3) -> vt+0x1d0 `0xdfd42c` -> `0x6feb8(e, 2, [0x169d3b8][id - 1000])` = **u 1 / u 0 / u 10**; a wrong key (+0x1b4) is stopped and
  re-requested; any other L stops it. ctl+0x24 -> P+0x5cfc |= 1 (|= 2 with e+0xb5f5 == 1). rom-map row `0xdf0514..0xdf0608`;
  `<archive>\\gapF\\RESULT.md` a3.5.
* **The pulse clock's writers** (ctl+0x1c): ctor `0xdeeebc`, vt+0x1d8 `0xdef070`, the pulse reset `0xdf08a4`, the add `0x7264c` at
  `0xdf0880`. rom-map row "ctl+0x1c (Kushala's pulse clock) -- writers"; `<archive>\\gapF\\RESULT.md` a3.6.
* Which sp_01 modes the page never makes: closed 2026-10-20 (all the frame handler's; rom-map row "Kushala's c 29 / 30 / 32..35").
''',
'ahtal-neset-shells-spec.md': '''
## 7. Read since (gapJ 2026-10-21, gapL 2026-10-22), indexed in rom-map (doc audit 2026-10-24)

The detail is in `<archive>\\gapJ\\RESULT.md` and `<archive>\\gapL\\RESULT.md`. The rows are in rom-map "Ahtal-Ka -- his shells read
and built" (moved there 2026-10-24 from the Withdrawn table) and "Shared enemy / command layer". In short:

* **The lift and the drop** (gapJ): B6 `0x10ac10c(e, k)`, the lift request (shell57 mode k + 0x18, placement 2, behaviour 6, delay
  60.0). B2 `0x10ac1ec(e, k)`, the drop request (joint 0x82 + k's point). base57 b6 (init `0x42f864`, move `0x4320a4`) is the lift.
  e+0xccc1 + 12k is "holds object k" (`0x10aa368` sets it, B2 clears it, `0x10abf00` is the "may pick" test). The models are rModel
  0x8679..0x867b (e+0xccb0..+0xccb8). G's spots before anything moves come from static init `0x10ae0e0` (`0x21328b0` / `0x21328e0`).
* **The status-1 switch** vt+0x204 `0x10a6e58` -> `0x10a74fc` (n - 8): (1, 8) G+0x32 = 4; (1, 0xf) = 3; (1, 0x15) = 2; (1, 0x11 / 0x12)
  -> `0x10a7bac(e, 0 / 1)`. The mains: (1, 8) `0x10afc44`, (1, 0x15) `0x10b029c` (clip side in rom-map). `0x10a7bac` kills rockets
  **0..5** (six handles, not nine: the earlier "nine" is in the Withdrawn table).
* **The HP stages** (gapL): code 0x1a fires when P+0x380 >= HP / max, P+0x3a8 bit 16 is set and bit 15 is clear (`0x99238..0x99288`).
  P+0x3a8 is the dtbase flag word `[[e+0x75e8]+0x6c]` (`0x9cd50`), file +0x1d (loader `0x53800`). Bit 16 is set only in em087_00 and
  em058_00. Code 0x1a -> `0x9abe8` -> (10, 0x8e) for every class. Neset's vt+0x1fc `0x6d63c` is `bx lr` (no remap).
* **Neset's P+0x380 writers**: spawn 0.65 (`0x10a4aec`, tune 0x16); `0x10a7d50` 0.05 (tune 0x17); `0x10a7e34` -1.0 (dead path). So
  (10, 0x8e) comes first at HP 65 % and again at HP 5 %. The HP floor is `0x98a7c..0x98a98`: P+0x370 = max(P+0x370, int(max x P+0x380)).
* Trap 144 (rom-map): tune_emu.Loader's "fault ... 3885957120" at the end of every dtbase run is the harness's return, not a loader failure.
''',
'attack-hitshapes.md': '''
## 6. Read since, indexed in rom-map (doc audit 2026-10-24)

The hit system's own pieces are read in gapM / gapN. Rows are in rom-map "Shell infrastructure"; the engine summary is in
`dev/effect-runtime-engine.md` "The shells' hunter contact". This note did not carry them:

* **The beam segment table** (gapN): the enemy-shell ctor clears +0x158a / +0x158c / +0x1590 / +0x1594 (`0x4a0bf0..`). The hit line
  (base02 `0x3fc1c8..0x3fc374`, base58 `0x4340fc..0x4342a8`) fills n = +0x158c entries of the table +0x1594, from the second call on
  (+0x1590 >= 2). A j0 1010 hitsize record makes a type-2 capsule of entry j1 (`0x16dd2c..0x16ddcc`). The count is `0x4a14d8`: the j0 1010
  records in the hit's group, 3 for every class that uses it.
* **Kinds a standing hunter never takes**: 8 / 9 / 0x34 / 0x45 never hit hunters; 0xc / 0xd / 0x1e need `0x2f5bf0` (a hunter in action
  group 0x80); 0x41 marks the player (`0x2a6640`), skips the +0x31e0 once-a-frame test, and leaves the shell alone.
* **The shape chain**: `0x169290` -> `0x16d970` (descriptor from the HTS record) -> `0x16da04` -> `0x17023c`. The HTS layout and the
  294-folder census are in rom-map; `0x16b4b4` is a serial slot id, not a random draw (Withdrawn table).
* Details: `<archive>\\gapM\\RESULT.md`, `<archive>\\gapN\\RESULT.md`.
''',
'air-height.md': '''
## 6. Kecha Wacha's hang, read since (gapK, 2026-10-22; indexed in rom-map, doc audit 2026-10-24)

* The hang is **posture 1 held by v = 0** at 585 S above the ground, with no ceiling or wall pick. Posture 6 is never set. L2 M115 /
  M116 / M117 / M118 / M126 are set only at `0xf520e8` / `0xf52318` / `0xf523ac` / `0xf527c4` / `0xf5224c` + `0xf5265c`, in his band
  `0xf48e20..0xf57cd0`. The control finds every phase site. His EMC scripts are NOT checked. rom-map Fanged Beasts row "uEm065_00 L2 M115
  ... set sites".
* **The unit integrator** `0x7a820` (`0x7a994..0x7aa98`): pos += dt R v + dt^2 R a / 2; v += dt a. R turns by X / Z only in postures
  {1, 2, 4, 5, 6} (mask 0x76). rom-map "Shared enemy / command layer". So section 1's "what moves P+0x44" adds the integrator's own terms.
* **Authored heights**: em065_00 `.dtb` +0x22 FlyOfs / +0x2e TenjoOfs are 0.0 / 0.0. P+0x92c has no store in his band (control:
  Seregios `0xfe31b0`). The `reference` Y of L2 M126 / M117 / M115 is a constant 584.5 / 400.2 / 255.4 (the authored unit height).
  These rows moved 2026-10-24 from the PSL table to rom-map "Fanged Beasts". viewer: motion-states.js AIR_HEIGHT.em065_00.
* The withdrawn chain "M114 -> M115 -> M116 -> M117" is in the Withdrawn table; the drop path is M114 -> M115 -> M126 -> M117 -> M118.
  Details: `<archive>\\gapK\\RESULT.md`.
''',
}
for f, txt in ADD.items():
    p = os.path.join(D, f); raw = open(p, 'rb').read(); t = raw.decode('utf-8')
    nl = '\r\n' if '\r\n' in t else '\n'
    add = txt.replace('\n', nl)
    if not t.endswith(nl): add = nl + add
    open(p, 'wb').write((t + add.lstrip(nl) if t.endswith(nl + nl) else t + add).encode('utf-8'))
    print('ok', f)
