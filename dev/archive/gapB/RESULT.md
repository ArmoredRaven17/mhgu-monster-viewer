# gapB -- em037_00c:30, shell01 mode 1 (the ground impact), Nargacuga + Silverwind (2026-10-20)

**Verdict: BUILT (in a patched copy; nothing in the repo touched).** Both reasons given in shells.js / em037_04-shells-spec for
not building it were wrong:
* "L1 M2's gate 0x6fe88 is unread": `0x6fe88` was already READ in rom-map (line 716, "the current-action test":
  `e+0x73e0 == group && e+0x73e1 == index`). The gate is `0x6fe88(e, 3, 5) != 0 -> skip`: no impact on L1 M2 while the action is
  (3, 5). Emulated with 0x6fe88 running native (positive control below).
* "its life rests on the hit slots": that is the shared device every timer-0 base01 shell already uses (`input.hitLife`,
  `slotsOf011` / `slotStep`; Seregios's c 30 -- the same `cm200_040` -- Tigrex's c 32, Malfestio's, Gravios's). The viewer's
  schedule passes `hitLife: true` (docs/render/rom/effect/schedule.js:444). The only missing data were the shell's own hit index
  and hitdata, now read from the arc: mode 1 = hit record **1** = **(14, 10)** -> the shell ends at move 14 + 10 + 2 = **26**.
  The one open item under it (who steps the slots: `0x168d30`'s caller and its step) is the shared NOT READ already in the
  shells.js header and applies equally to every built base01 timer-0 shell -- not specific to this one.

Work files (all in `scratchpad\gapB\`): `e47b0c.txt` (disassembly), `jt37.py` (jump tables / GOT), `probe37.py` + `probe37.out`
(the handler under trgen, gate control), `pf_em037_00.txt` / `pf_em037_04.txt` (pfgen census), `hitd37.py` (hitdata), `act35.py`
(what (3, 5) plays), `emu37n.py` (ROM run of the shell), `patch37.py` (the exact edits), `shells.patched.js` (patched copy),
`replay37.mjs` (the replay / check, 28 / 28), `regress\` (four existing checks on original vs patched: identical output).

---

## (a) READ facts

### The frame handler `0xe47b0c` (uEm037_00 vt+0x208, vtable 0x17bc47c) -- READ whole
* **Extent `0xe47b0c..0xe48578`** (last `pop {..,pc}` at `0xe48578`; every branch target lies inside; tail calls out `b 0xc241c`
  `0xe4821c`, `b 0x48b884` `0xe483c4`); literal pool `0xe4857c..0xe485cc`; next function `0xe485d0` (its own prologue -- the
  handler's FIRST call, `bl 0xe485d0` at `0xe47b18`).
* Dispatch on the motion id `0xb0944`: `id - 2 <= 0x20` -> PIC table `0xe47b4c`; `id > 0x200`: `id - 0x201 <= 0x14` -> table
  `0xe47c20`; else `0x101` -> `0xe482e4`, `0x102` -> `0xe47c98`, else return `0xe48574`. Tables (jt37.py): list 0: 2 / 6 ->
  `0xe47d64`, 7 -> `0xe47d94`, 0x19 -> `0xe47dc4`, 0x1a -> `0xe47e28`, **0x1c -> `0xe47e58`**, 0x1f..0x22 -> `0xe47bd0`, rest
  default; list 2: 0x201 / 0x202 / 0x203 / 0x205 / 0x206 / 0x20a / 0x20e / 0x211 / 0x212 / 0x213-4 / 0x215 to their arms; 0x207 /
  0x208 default (agrees with shells-em037.md 9's "sends 0x207 / 0x208 to its default").
* **Three create arms, shell01 MODE 1** (each `0xb0968(e, r1 0, r2 0, s0 F, s1 0.0)` = `0x72714` mode 0 on channel 0 = the
  viewer's `pass001`):
  | site | motion | F | gate |
  |---|---|---|---|
  | `0xe47e58` | L0 M28 (0x1c) | 20.0 (`vmov #20`) | none |
  | `0xe482e4` | L1 M1 (0x101) | 60.0 (pool `0xe48584`) | none |
  | `0xe47c98` | L1 M2 (0x102) | 2.0 (`vmov #2`) | `0x6fe88(e, 3, 5)` != 0 -> return (`0xe47ca4..0xe47cac`) |
* The request (`0x3fa2bc(0x40)`, identical in the three arms, tail `0xe48394..0xe483c4`): +0 `[GOT 0x1835c6c]` + 8 = 0x174e640;
  +4 `[e+0xcc98]` (0xc9 Nargacuga / 0xcb Silverwind, the loader 0xe47320's); **+8 1**; +0xc e; **+0x10.. (e+0x40, e+0x10f0,
  e+0x48)** (the UNIT's +0x40 / +0x48 -- probe poked e+0x40 vs P+0x40 apart); +0x1c 0; +0x20.. three words of `[GOT 0x1831a78]`
  = 0x19176b0; +0x2c 0; **+0x30.. `[GOT 0x18321b0]` = 0x1620e60, the zero vector** (NOT his words e+0xfe8.., unlike Tigrex /
  Malfestio / Gravios); +0x3c 0xffff; `0x48b884([GOT 0x1831ccc] = 0x188b3b0, setup, 0, 0)`.
* **No height test in the handler** (Tigrex's 0xe21294 has one); none of the three arms reads the variant byte, rage or tired.
  The handler's other arms: hit records `0x7db70` and `0xc241c` (camera), the variant-4 tests at `0xe47fbc` / `0xe4826c` feed hit
  records only.
* Emulation (probe37.py, trgen model, `0x6fe88` native): each arm creates exactly one (id, mode 1) with the setup above at its
  literal alone and none at F-1; action (3, 5) suppresses L1 M2 only, (3, 4) / (7, 5) / (7, 0x35) / (0, 0) do not; variant 4
  creates 0xcb the same. **Census** (fb/pfgen.py, every overridden slot +0x190..+0x240 x every shipped motion, rage 0/1, both
  variants): these three sites and no other create (positive control = the census finds them).
* `0xe485d0` (called first): not read as text; it ran natively in the census (inside the class band) and made no shell.
  INFERRED not a shell maker on that basis only.

### The gate
* `0x6fe88` = the current-action test, **already READ** (rom-map 716). Here `(e, 3, 5)`.
* What (3, 5) is (act35.py, INFERRED meaning): (3, 4) and (3, 5) reach the same body `0xe4f000` (phase 0 `setMotionL 0x107`
  = L1 M7 at `0xe4f05c`; phase 1 waits for block +0x44 >= the ground (block +0x1d4 or `0x496d8([e+0x1054])`) + s0, then
  vt+0x3e0) -- a fall. So the gate stops the L1 M2 impact while the fall action is still current. The viewer's tables have no
  (3, 5) row, so in the app the gate is open (as Tigrex's identical gate `0xe214d0`).

### The shell (base01, uShellEm037_sp_01; reader `0xe597e4` = shells.js params037s01, already READ)
* Files (fb/shl_em037_00.txt, gapB/hitd37.py): em037_00_01 mode 1 sh ints [0, -1, -1, 0] -> **flags 0x1080**, float 0 = 0.0 (timer),
  vec 0 (0, 0, 0), **hit int 1** (_hit001), ef (0, 30); mode 0 hit int 0. **em037_00_01_hitdata (HDS v0x20160209, 2 records): (0, 30),
  (14, 10)**; Silverwind's em037_04_01_hitdata identical (matches shells.js), Tigrex's (14, 10) (matches) -- reader controls.
  Silverwind mode 1: ef (1, 30) (his .shl list 1 = em037_00c), hit 1.
* Init (base01 `0x3fa498`, flag-0x80 arm, already transcribed in init011): position = (block x, block +0x5b4 ground, block z) +
  the zero vec turned by the yaw; deleted when block +0x44 - ground >= 900; **the setup's +0x10 is not read on this arm**; c 30
  started at the position. ROM runs (emu37n.py, whole executable; and the existing efx narga-spike-reference.json S01 runs):
  flags 0x1080, point (x, ground, z) whatever e+0x10f0 holds, c 30 from list 0 (Nargacuga) / list 1 (Silverwind), +0x15d8 = 1,
  deleted at 900 above / kept at 899.9, ends at move 1 with no hit registration (graceful stop flag 0).
* Life: timer 0 -> lives while slot 1 is on: (14, 10) -> end at move 26 (viewer device, hitLife).

## (b) The JS

Exact edits = `patch37.py` (eight exact-text replacements, each must match once; run `python patch37.py <shells.js> <out> --live`
to apply to a file without the import rewrite; it keeps CRLF). Summary with anchors (line numbers of the current repo file):

1. **~117-119** header NOT MODELLED "spikes" entry: "shell01 mode 1 ... not built -- its lifetime rests on the hit slots and L1
   M2's condition 0x6fe88 is not read" -> "IS built (perFrame037, 2026-10-20): ... 0x6fe88(e, 3, 5) is the current-action test
   (rom-map), and its life is hit slot 1, (14, 10), as every timer-0 base01 shell's (input.hitLife; ... 0x168d30's caller ...)".
2. **~490-500** `SHELL_DATA.em037_00.shells.shell01`: comment replaced; add **`reader: 0xe597e4`** (without it make001 falls back
   to Rathian's params011, which reads ints [0,-1,-1,0] as flags 0x5 (bits 0 / 2) with joint -1: the block point snapped to the stage, not the 0x80 ground arm -- wrong); `hit: [0]` on mode 0, **`hit: [1]`** on
   mode 1; **`hitdata: [[0, 30], [14, 10]]`**. (Not `stepped`: mode 0 stays the event it is -- dropShell01 unchanged.)
3. **after the (7, 0x84) row, end of SHELL_DATA.em037_00 (~552)**:
   ```js
       perFrame037: [
         { ids: [0x01c], frames: [20.0], mode: 1, site: 0xe47e58 },                           // L0 M28
         { ids: [0x101], frames: [60.0], mode: 1, site: 0xe482e4 },                           // L1 M1
         { ids: [0x102], frames: [2.0], mode: 1, noAction: [[3, 5]], site: 0xe47c98 },        // L1 M2
       ],
   ```
4. **~3526-3529** Silverwind's shell01 comment ("Mode 1 ... is not built") -> lives while hit slot 1 is on; and **after
   `spawner: SHELL_DATA.em037_00.spawner,` (~3570)**: `perFrame037: SHELL_DATA.em037_00.perFrame037,`
5. **after `perFrame079` (before "---- SELTAS QUEEN", ~9455)** the handler (with its READ comment, see patch37.py):
   ```js
   function perFrame037(state, D, ctx, input, out, fresh, a){
     const mid = motionIdOf(input.list, input.clip);
     if (mid == null || fresh || !state.hist) return;
     const row = D.perFrame037.find(r => r.ids.includes(mid));
     if (!row) return;
     const acts = a ? [a.action].concat(a.also || []) : [];
     if (row.noAction && acts.some(x => row.noAction.some(n => n[0] === x[0] && n[1] === x[1]))) return;
     for (const F of row.frames){
       if (!pass001(state, f(F))) continue;
       const own = ctx.own001, why = missing001(own, { pos: true, ground: true });
       if (why){ out.refused.push({ perFrame: mid, shell: 'shell01', mode: row.mode, why }); continue; }
       const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: row.mode, position: own.ownerPos.slice(), angles: [0, 0, 0], frame: F },
                         own, state.prevJoints, ctx, null);
       if (S){ S.perFrame = mid; state.shells.push(S); out.spawned.push(S); }
     }
   }
   ```
   It is perFrame079's shape with two ROM differences: **angles [0, 0, 0]** (the 0x1620e60 words) and **no facing required** (the
   0x80 arm turns a zero vec by it; a missing facing changes nothing). The 900 deletion is init011's (make001 returns null).
6. **dispatch, after `if (D.perFrame079) ...` (~25189)**:
   `if (D.perFrame037) perFrame037(state, D, ctx, input, out, fresh, a);   // Nargacuga's / Silverwind's frame handler 0xe47b0c (shell01 mode 1), line 4`

c 30 is already exported `when: shell` (em037_00c UNIQUE 0, files/cm200_040.efl) in both docs/effects/em037_00.json and
em037_04.json -- no export / record / lift needed for the data; whether the recorder set for it exists is the effects lane's call.

Text the shells agent should also update (not edited): dev/em037_04-shells-spec.md lines 21, 30, 110, 205 ("mode 1: c 30, not
built", "0x6fe88 NR"); dev/shells-spike-check.mjs line ~230 message "data only, mode 1 is not built" (the check still passes);
decode note shells-em037.md 6 / 9.5 / 11 (`0x6fe88(e, 3, 5)` NOT READ; "how long shell01 lives" -- now hit slot 1 (14, 10)).

## (c) rom-map rows

For the Silverwind section ("Silverwind Nargacuga (em037_04) -- his shells ...", table `| addr | what | class | st | detail |`), or
a new sub-heading "Nargacuga / Silverwind -- shell01 mode 1, the frame handler's ground impact (gapB helper for the shells agent,
2026-10-20)":

```
| `0xe47b0c` (uEm037_00 vt+0x208) | the frame handler, READ whole: extent `..0xe48578` (pool `..0xe485cc`; `0xe485d0` is the next function, its first call); motion id `0xb0944` -> table `0xe47b4c` (id - 2 <= 0x20) / `0xe47c20` (id - 0x201 <= 0x14) / 0x101 / 0x102. **shell01 `[e+0xcc98]` (0xc9 / Silverwind 0xcb) MODE 1** on **L0 M28 (0x1c) f20** (`0xe47e58`), **L1 M1 (0x101) f60** (`0xe482e4`), **L1 M2 (0x102) f2 unless `0x6fe88(e, 3, 5)`** (`0xe47c98`) -- `0xb0968(e, 0, 0, F, 0.0)` (mode 0, channel 0); no height / variant / rage / tired test in these arms; the rest: hit records (`0x7db70`), `0xc241c` | uEm037_00 | R + E (gapB probe37.py, 0x6fe88 native; pfgen census: these three only, both variants) | shells.js perFrame037 / SHELL_DATA.em037_00.perFrame037 |
| `0xe48394..0xe483c4` (the three arms' request) | `0x3fa2bc(0x40)`: +4 `[e+0xcc98]`, +8 1, +0xc e, +0x10.. **(e+0x40, e+0x10f0, e+0x48)** (the unit's own, not `[e+0x1428]+0x40`), +0x1c 0, +0x20.. `[GOT 0x1831a78]` (0x19176b0), +0x2c 0, **+0x30.. `[GOT 0x18321b0]` = 0x1620e60 the ZERO vector (not his words)**, +0x3c 0xffff -> `0x48b884` | uEm037_00 | R + E | perFrame037 (angles [0, 0, 0]) |
| `0xe47c98..0xe47cac` | the L1 M2 gate: `0x6fe88(e, 3, 5)` (the current-action test, row 716) != 0 -> return. (3, 4) / (3, 5) share the body `0xe4f000`: L1 M7 (0x107) `0xafef0`, phase 1 to block +0x44 >= ground + s0 -> vt+0x3e0 -- a fall (meaning INFERRED); no (3, 5) row in the viewer, so the gate is open there (as Tigrex's `0xe214d0`) | uEm037_00 | R (gate) / E (the body's motion) / I (its name) | perFrame037 `noAction: [[3, 5]]` |
| em037_00_01 / em037_04_01 mode 1 + `_hitdata` | mode 1: ints [0, -1, -1, 0] -> flags 0x1080 (reader `0xe597e4`), timer 0.0, **hit int 1**, ef (0, 30) / Silverwind (1, 30) (list 1 = em037_00c); HDS 2 records **(0, 30), (14, 10)** both arcs -> lives while slot 1 is on: end at move 14 + 10 + 2 = 26 (input.hitLife) | uEm037_sp_01 | R (files) | SHELL_DATA.em037_00 / em037_04 shell01 hitdata |
| shell01 mode 1 on the ROM | base01 `0x3fa498` 0x80 arm from the handler's setup: (block x, ground +0x5b4, block z), e+0x10f0 / setup +0x10 unread; c 30 at it; deleted at >= 900 above (kept 899.9); ends at move 1 without hit registration, stop flag 0 -- JS = ROM, 9 runs (narga-spike-reference S01 x 3, emu37n x 6 incl. Silverwind) | uEm037_sp_01 | R + E | gapB replay37.mjs |
```

Tooling table:

```
| tooling: `<scratchpad>\gapB\` (gapB helper, 2026-10-20) | `probe37.py` (vt+0x208 `0xe47b0c` under trgen by motion id x action bytes e+0x73e0/1 x variant: the frame tests' r1 / r2 / s0 / s1 and the raw 0x40 setups), `jt37.py` (its PIC tables, GOT literals), `act35.py` (an action's setMotions), `emu37n.py` (emu37's whole-executable machine: shell01 mode 1 of em037_00 / em037_04 from the handler's setup), `replay37.mjs` (a patched shells.js copy vs both) | control: the gate's (3, 4) / (7, 5) still create, F-1 alone does not; emu37n's point moves with the block / ground; the unpatched module makes none | `0x6fe88` must run native (trgen's NATIVE set has it; emu_fb stubs it -- trap 105) |
```

WITHDRAWN table:

```
| shells.js header (NOT MODELLED, "spikes"), the em037_00 shell01 comment, Silverwind's shell01 comment, dev/em037_04-shells-spec.md 1 / 6 / 10, decode note shells-em037.md 6 / 11: "shell01 mode 1 is not built -- its lifetime rests on the hit slots and L1 M2's condition `0x6fe88(e, 3, 5)` is NOT READ" | `0x6fe88` was already READ (row 716, the current-action test); and the hit-slot life is the shared device (`input.hitLife`, `slotsOf011`) every built timer-0 base01 shell uses -- only this shell's hit index and hitdata were unread, and they are files | built 2026-10-20 (perFrame037): gate = "not while the action is (3, 5)"; life = hit slot 1 (14, 10), the end at move 26. Trap 18 again (open the row the grep would have found) |
```

Optional numbered trap (if the shells agent wants one): "A shell's per-frame request may carry the ZERO vector as its words
(Nargacuga's 0xe47b0c: [GOT 0x18321b0] = 0x1620e60) where a sibling class's carries the owner's (Tigrex 0xe21294, Malfestio,
Gravios): reusing perFrame079 / perFrame032 as-is would hand the owner's words. Read the +0x30 load, do not copy the shape."

## (d) Replay

`node scratchpad\gapB\replay37.mjs` -> **28 passed, 0 failed** (imports `gapB/shells.patched.js`, made by `python patch37.py`):
* spawn table, both monsters: L0 M28 -> step 21, L1 M1 -> step 61, L1 M2 -> step 3 (F + 1, the action code's pair), one shell01
  mode 1 each, id 0xc9 / 0xcb, flags 0x1080, c 30 (list c; listId 0 / 1 -> em037_00c) at (x, ground, z), words 0,0,0; no mode-1
  shell on L0 M27 / L1 M3 / L1 M7 / L2 M8 / L0 M1.
* ROM bit for bit: the three reference S01 runs and six emu37n runs (Nargacuga and Silverwind; size / base / facing / e+0x10f0
  varied; 899.9 kept, 900 and 1500 deleted): flags, init point, start (listId, key, point), end move 1, stop flag 0.
* life with hitLife: end at move 26, then c 30's graceful stop, both monsters.
* gate: L1 M2 under (3, 5) none; (3, 4) / (7, 5) one; L0 M28 under (3, 5) still one.
* refusals: no ground -> refused by name once; no facing -> still made.
* control: the unpatched repo module makes none on the three clips.

Regression (`gapB\regress\`): dev/shells-spike-check, shells-silverwind-check, shells-tigrex-check, shells-seregios-check run
against the original and the patched module -- output identical (257 / 38 / 18 / 32 pass as before; their pre-existing "FAIL"
lines are the controls' PASS lines).

Not done (out of scope / not mine): no viewer, browser or soak run; Raven verifies on screen. The effects lane may want a shell
record set for em037_00c c 30 if the draw meter shows none (it is the same cm200_040 as Seregios's c 30).
