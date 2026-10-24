## 5. Mizutsune / Soulseer (em082_00 / em082_04) -- DONE

Checks: dev/shells-mizutsune-check.mjs 38 / 38, dev/shells-soulseer-check.mjs 49 / 49 (ROM cases with every child, contract, controls
FAIL), pages 29 / 29 and 32 / 32, dev/checks/em082_00 142 / 0, both soaks clean. Records: em082_00u 0..2, 10..12, .., 50..52, 60, 61,
80, 81, 100, 101; em082_04u the same plus 150. NOT exported: em082_04u 200 / 201 / 210 -- only the soul-flame bubbles (modes 174..190)
carry them, and the viewer shows the flame unlit (below).

Classes: 0x158 / 0x15c sp_12 (the bubbles, NEW base12), 0x159 / 0x15d sp_01 (the puddles, base01), 0x15a / 0x15e sp_02 (the beam:
render/beam-spawns.js), 0x15b / 0x15f sp_13 (the thrown bubbles, base13), 0x160 04_26 (Soulseer's ghost flames, base26 -- 1d).

### 5a. The ids, the census

The ids are FIELDS (`0x1035040`, by e+0xb5f5): e+0xcac0 sp_01, +0xcac4 sp_02, +0xcac8 sp_12, +0xcacc sp_13, +0xcad0 04_26 (variant 4).
The full census: scratchpad `fb/cen12_em082_00.txt` / `_04.txt` (all 16 statuses; the id fields and the .dtp filled -- cengen10's
FB_POKE). The zero-.dtp census (`cen11_*`) had lost L2 M21's k 9 / 11: the head-break predicate read a zero threshold (rom-map trap 85).
Two spawns are TIMED and no census shows them: Lagiacrus's sp_25 (1c) and Soulseer's rest flames (5e).

### 5b. The bubbles (sp_12, base12)

- base12 READ whole: ctor `0x4033e0`; init `0x403854` (+0x15e0 bit 1 defers the real init to the first move -- no mode of his sets
  it: refused by name); the real init `0x4038cc` (the joint's row 3, the offset through its 3x3 when +0x15dc is -1; the words X =
  setup +0x10 + the block's X + u16(degX), Y = the block's Y + u16(degY), Z 0; the velocity (0, 0, float 2) turned X then Y; the drift
  +0x1020 = (0, float 3 x sin dX, -0.3 x float 3 x cos dX) turned by Y, dX the degree offset's own word; ef 0 -> +0x1604; slot 0);
  move `0x40350c` (0xfe: the wait, 1800, both handles); the step `0x40362c` (anchor, stepFlight `0x539224`; in the life's last third
  the drift = -velocity / (life / 3), re-taken each move; the life counted down; base00's collide query -> +0x150); end `0x403e88`
  (ef 0 stopped gracefully, vt+0x154, 0xfe, 1800).
- sp_12's reader `0x104f15c` (ef 0 / 1, hit 0, slot 1 not a slot, the joint, +0x15dc, the two flag bits, degX / degY, the velocity's
  z, the drift's speed, the life, &vec 0); its +0x150 `0x104f2e8` ends it on any contact but type 1; its +0x154 `0x104f318` starts ef 1
  (the pop) at its point; +0x15c / +0x160 the hit side.
- THE CHOOSER `0x104b540(e, k, r2)` (READ; run natively for every k, `fb/chooser082.py`): -1 while tired for k in 0x22243495, with
  the head broken (`0x1036e24`: `0x9d36c(e, 0)` against .dtp row 1 (Mizutsune, 3 / 3) or row 0 (Soulseer, 2 / 2)) for k 9 / 11, with
  the tail severed (`0x103780c` = vt+0x370(e, 1)) for k 3 / 19 / 22 / 24 / 28; else by the action number: the 18 of table A, (7, 0x10
  / 0x12) x = u16((r2 + k) x 0x17 + e+0x73e8 + 0x9c4) % 100 < 10 ? B : C, (7, 0x5d / 0x5e) B, any other 0. The maker `0x104a298`
  (k' -> mode, + 100 for Soulseer; the 0x14 setup, +0x10 the X tilt from e+0xcb9c); the second maker `0x104a840` (literal modes;
  none while tired for 160 / 162 / 165 / 168 / 171 -- the bits of 0x925 over mode - 0xa0).
- e+0xcb9c: written only by (7, 9)'s phase 0 (`0x1041af8`): the upward pitch to the target over 50 degrees, clamped to 1; kept.
- The rows (both monsters; Soulseer + 100 and his own frames): L2 M42 (7, 0); L2 M3 (7, 1); L2 M20 (7, 9) with the tilt, (7, 0xc /
  0x2e); L2 M64 (7, 0xa / 0x73), (7, 0x7d) the second maker's 159..161 (not in Mizutsune's file: refused by name); L2 M21 (7, 0xd /
  0x30) five; L2 M89 (7, 0x2a / 0x31); L2 M26 (7, 0x5e) Mizutsune only; status 2: L2 M39 (2, 6 / 0x14 / 0x15 / 0x34) and L2 M10 (2, 7
  / 0x16 / 0x17 / 0x35) -- Mizutsune k 12 / 13, Soulseer the second maker's 162..164 / 165..167; Soulseer's `0x104d410` (L2 M72 /
  M71 / M74 / M73, (7, 0x64..0x69)) 168..173 at f110.
- THE TRAILS (`0x104cd48` / `0x104cdb4`): (7, 0x10) L2 M24 to its frame 22 and (7, 0x12) L2 M25 (its end test `0x78b78(e, 0, 0x40)`
  NOT READ -- the clip's length here): a bubble each time the block's travel uses up the spacing (tune 0x48, 550), the chooser's k 17
  with r2 = the count. The viewer's block is the clip root's position (index.html unitGamePos), so root motion drives it.
- Soulseer's actions turn the block before some spawns (the owner's own turn `0x783fc`); the checks stub it -- the viewer's facing is
  its input.

### 5c. The throws (sp_13, base13) and their puddles (sp_01)

- The status-2 actions (`0x103bce8`'s table: n -> the action function and its SET 0..3) run six helpers (`0x104a90c` / `0x104adbc` /
  `0x104bb60` / `0x104bedc` inline, `0x104b138` / `0x104b314` through `0x104ac84`), three throws each at f10 / 20 / 30, k = 3 x the
  helper + 0..2: -1 with the tail severed for k in {0, 3, .., 15}, while tired for k - 2 in that set, with the head broken for k 18;
  x = u16((e+0x73e8 + 0x17 k - 0x9c4) % 100) against 90 / 100 on n in 4 / 5 / 8 / 9 / 0x11 / 0x13 / 0x19 / 0x1b / 0x1e..0x2d / 0x32 /
  0x33: mode 2 in [90, 100), else 0 (+10 Soulseer). The maker `0x104a634` (m <= 5; Soulseer only with the flame out): +0x20 the
  throw's vector [set][e+0x73e8 % 3][k], a table the static initialisers fill (0x2130890, read out of the initialised image).
- sp_13's reader `0x104f494` (joint 18; speed, the arc's height, life, far / near); base13's init on flags 0 (Kecha Wacha's path, the
  thrown point with the setup's vector, the launch with the arc-height arm); its landing `0x104f614`: type 1 -> sp_01 [`0x16a24d0`][mode]
  (2..7) at the contact. sp_01's reader `0x104ec34` (ef 0 at the init, ef 1 at the END: +0x15d4; flags 4 / 8; timer 300).

### 5d. Soulseer's ghost flames (04_26, base26)

- The reader `0x104e7c4` (ef 0 / 1, hits 0 / 1, the joint (20 or 0), the orbit's floats, the rate's clamp +0x1608 with +0x1618 bit 1
  = int 1); base26's init on a joint: the block's Y word and the joint's world point as the centre; the step's clamps (READ: a limit
  below 0 caps from above, at or above from below); its +0x150 `0x104e9ec` -- the collide query each live move, any type but 1 ends it
  (+0x158 `0x104eadc`); its end's +0x154 `0x104eb0c` ef 1 at its point.
- The maker `0x104a744(e, m)` (none with the soul flame lit; none while tired for m 1 / 4 / 11): L2 M69 (7, 0x26 / 0x71 / 0x7b) f78 1 /
  3 / 5, f98 0 / 2 / 4; L2 M38 (7, 0x13) f30 10..12, f110 13; (2, 0x36) L0 M4 14 / 15 at tune 0x98 / 0x99 = 0 (a frame-0 test: made on
  phase 1's first call, the step after the motion is set -- INFERRED from 0x72714's window, whose compare is prev < F <= cur with prev
  +0x500 less the step).
- 5e. THE REST (1, 0x16) `0x103b874`: phase 0 plays L0 M14 and sets the counters e+0xcb34..+0xcb40 = tune 0x7f..0x82 (500 / 800 /
  600 / 900); phase 2 (L0 M15) counts each down by the step (`0x7206c`) and, at or below 0, reloads it and makes 04_26 6 / 7 / 8 / 9 --
  on through the rest. The harness stubs 0x7206c; the check runs it natively (emu_fb `unstub`).

### 5f. Named, not built

- THE SOUL FLAME (P+0x1bb bit 1): the effects lane shows it unlit (dev/em082-effects-spec.md 3), so its arms are not taken -- the
  literal bubbles 174..190 (L2 M20, M21, M39, M55, M58), the second maker's flame rows, and every 04_26 / sp_13 the maker refuses with
  the flame lit. A toggle for it is Raven's call; it would also bring u 200 / 201 / 210.
- THE EFFECT POOL (for the effects lane): the viewer LOOPS one-shot actions, so L2 M55 / M58 / M61 / M62 make a volley every pass,
  and some twenty 300-frame puddles (u 2) at once -- or Soulseer's six L2 M69 flames each pass -- fill the runtime's slot pool; its
  full path `0x418d4` (render/rom/effect/lifted-request.js L_4187c) is unlifted and the runtime stops. The page checks play one pass.
- e+0x73e8 (the action setter's draw) is the stand-in 0 throughout; the chooser's B / C pick and the throws' modes and vectors read it.
