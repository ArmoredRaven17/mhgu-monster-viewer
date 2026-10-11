# ROM map — index of established addresses and the tools that found them

**An index, not a notebook.** One line per address; the detail lives in the note named on the line.

**Rule:** before reading an address, grep this file. After establishing one, add the line. Withdrawn
entries stay, marked, with the correction beside them — a wrong address that is silently deleted gets
rediscovered.

**Sections:** EMC lane (this file's first writer), then Effects and Render add their own.

---

## Build — read this before anything else

**This is the SWITCH build.** `C:\MHGU-ROM\exefs` holds `main`, `main.text`, `main.rodata`, `main.data`,
`sdk*`, `subsdk0*`, `main.npdm`, `rtld`; content is under `romfs/nativeNX`.

**There are NO `.cro` files.** The `roEm001.cro` / `roEm004.cro` / `roEm087.cro` naming used throughout the
older notes is **3DS naming, carried over**. It still describes a real *grouping* of classes (e.g. one
group holds `uEm019_00` + `uEm020_00`), and bounding a scan per group is still correct — but there is no
module file to open, no module relocation table to read, and no module-load copy to point at.
**Evidence:** `find /c/MHGU-ROM -iname '*.cro'` returns nothing; the exefs listing above is what exists.
*A hypothesis built on module-load was pursued and withdrawn on 2026-09-30 for exactly this reason.*

Loader note: `armdis` exposes `.text` / `.rodata` / `.data`. It does **not** map `.bss`, so an address past
the end of `.data` reads as nothing there but is mapped (and may be zero) under the emulator.

---

## 1. Addresses

`R` = read from the ROM · `I` = inferred, not directly read · `W` = withdrawn

### Shared enemy / command layer

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x172ae2c` | spawn table: 137 DTI ptrs then 137 name ptrs | — | R | dev/shell-map.md |
| `0x172bc8c` | EMC descriptor table | — | R | dev/notice-marks.md |
| `0x82ec4` | EMC walker | — | R | dev/notice-marks.md |
| `0x836f0` | EMC op jump-table base | — | R | dev/notice-marks.md |
| `0x8456c` | op `00 <status> <number>` handler → `0x754b8` → `0x76098` | — | R | dev/notice-marks.md |
| `0x84624` → `0x85758` | **op `02`: a PERCENTAGE DRAW** — the value is `u16 [sp+0x180] % 100` (`0x8575c..0x85778`), re-drawn by `0x49634` after each use (`0x8579c`); `02 01 NN` cases compared by `0x8e088` kind 2. `02 01 55 / 02 01 0f` = 85 / 15 | — | R | shells.js SHELL_DATA em004_00 shell02 rows (Viewer agent, 2026-09-30) |
| `0x84eb4` | **op `6e`: the stream called BEFORE this one** — value `s16 [enemy+0x73b2]` (`[sp+0xb8]` = r8 + 0x73b2, set at `0x83388`) | — | R | same |
| `0x83e1c` → `0x85628` | op `14 NN` (call stream NN): pushes the return frame at `+0x7350 + k*8` (group, stream, resume), then `+0x73b2 := +0x73b0`, `+0x73b0 := NN` (`0x85628..0x85638`). Init `0xba318`/`0xba320` sets both to `0xffff`; the ctor `0x6da70` zeroes them. So `6e 01 17` = "the previous call was s23" | — | R | same |
| `0x836f0` + 4·op | the op table's entries are OFFSETS from `0x836f0` (`0x836e4..0x836ec`): `02` `0x84624`, `0b` `0x846a4`, `14` `0x83e1c`, `1c` `0x8483c`, `1d` `0x84854`, `24` `0x848c8`, `6a` `0x84e0c`, `6e` `0x84eb4`, `83` `0x850e0` | — | R | — |
| `0x7ea78`, `0x7ee30` | awareness: group 4 for newState 2, group 5 for 1, none for 0 | — | R | dev/notice-marks.md |
| `0x7db70` | arm a hit record `(unit, index, hitId, flags)` | — | R | dev/em004-fireball-actions.md |
| `0x70f40` | hitId → 32-byte attack record; `[unit+0x75d4]` / `[+0x75d8]` | — | R | dev/em004-fireball-actions.md |
| `0x31f6b4` | effect placement gate on `[parent+0xf0]` | — | R | (Effects' lane) |
| `0xbe518` | the monster's size | — | R | em004-shell00-spec §3 |
| `0xc15a4` | joint world matrix by gid | — | R | shells.js |
| `0x4a0f00` / `0x4a0ee4` | the owner / the shell's mode | — | R | em004-shell00-spec |

### Action dispatch and the per-frame trigger (shared enemy layer — read via uEm007_00)

| addr | what | st | detail |
|---|---|---|---|
| `[unit+0x4b4]` | **the current MOTION id**, halfword `(list<<8) \| motion` — NOT the action id. Proof: `0xafe8c` setMotionC calls `0x726cc`, which compares `[+0x4b4]` against setMotion's `r1`, and `r1` is `(list<<8)\|motion`. Written by the motion player (`0x72ca00`, `0x72d264`). Getter `0xb0944`; `0xb0950` compares it against `r1` | R | em007-shells-spec §2a |
| the action pair | `[unit+0x73e0]` = **group/status**, `[unit+0x73e1]` = **index** (Effects, `uEm007_00` group-6 section). `0xd32ce0` switches on the group (PIC table `0xd32d1c`), each arm on the index | R | Effects, rom-map uEm007_00 group 6 |
| `[unit+0x4f4]` | **corrected 2026-10-01 (Withdrawn: "the current frame")**: the frame queries' GATE — `0x72714` loads it first and, while it is > 0, modes 1 / 3 / 4 / 5 / 9 / 11 / 12 return 0 (`0x72824`), modes 2 / 6 / 7 / 8 / 10 take prev = cur = `+0x500` (`0x727b4`), and mode 0 takes a path of its own through `+0x1c` / `+0x4fc` / `+0x50c` (`0x727e4`, r2 = 0; r2 = 1 returns 0) — not read further; the frame the queries test is rebuilt from `+0x500` (below). Layer `+0x44` (`0x94dac4` copies `+0x40` into it): a blend-in timer is INFERRED | R (gate) / I (meaning) | `0x72738..0x72830` |
| `[unit+0x508]` | **corrected 2026-10-01 (Withdrawn: "the frame at the start of this tick")**: layer 0's **LOOP POINT**. The layer update wraps a frame that reached the length `+0x504` to it when length − `+0x508` > 0, else holds at the length (`0x94f374..0x94f424`); `0x72714` wraps its rebuilt frame onto it the same way, only when it is > 0 (`0x72898`) | R | Viewer agent; `0x94f38c`, `0x72898` |
| `0x72714` prologue (`0x72714..0x728cc`) | **READ in full (Viewer agent, 2026-10-01)**: r2 picks the channel — r2 = 0 (`0xb0968` / `0xb0974`): prev = `+0x500`, step `+0x13b8`; r2 = 1 (`0xb09a4` / `0xb09b0`): prev = `+0x13ac`, step `+0x13b4`. cur = prev + step (snapped to the integer within 0.0005); cur ≥ `+0x13bc` (the length): wrapped onto `+0x508` + the overshoot (lr = 1) when `+0x508` > 0, else cur = the length. r3 ≠ 0: `[r3]` = 1.0. Then the arm by r1 (13, table `0x728d0`: 0 `0x7294c`, 1 / 6 `0x72904`, 2 `0x72984`, 3 / 7 `0x7293c`, 4 `0x72990`, 5 `0x729b0`, 8 `0x729c8`, **9 `0x729fc`**, 10 `0x72a24`, 11 `0x72a48`, 12 `0x72a7c`) | R | `0x72714..0x728d0` |
| `0x72904` (mode 1) | **"the frame has reached s0"**: not wrapped → cur ≥ s0 (`0x72b04`); wrapped → prev + step ≥ s0, or cur ≥ s0 | R | Viewer agent 2026-10-01 |
| `0x729fc` (mode 9) | **"this step overlaps [s0, s1]"**, and with r3 the share of the step inside it: `[r3]` = (min(cur, s1) − max(prev, s0)) / (cur − prev), 0 when either is ≤ 0 (`0x72aac..0x72afc`) | R | Viewer agent 2026-10-01; the consumer is `0x76dd0` |
| `0x76dd0(e, angle, f0, f1)` | **the timed turn, READ**: `0xb0968(e, 9, &share, f0, f1)`; when it holds, the yaw word `P+0x54` += s32(step `+0x13b8` × share × angle / (f1 − f0)) — the angle LINEARLY over the motion frames f0..f1, each update's part truncated toward zero. 654 call sites (monster classes); the script turn op uses it too (next row) | R | `0x76dd0..0x76e4c`; render/motion-states.js CLIP_TURN |
| op **0x0a** — the script switch `0x9ef3c` arm 10 → `0x9f58c` | **the script turn, READ**: copies the op block's first frame / last frame / angle to `P+0x56c` / `+0x570` / `+0x574` (first < 0: the angle added to `P+0x54` at once, `0x9f5d0`); `0x9ffac` / `0xa07d4` then call `0x76dd0(e, +0x574, +0x56c, +0x570)` every update while `+0x570` > 0. So CLIP_TURN's linear spread is the ROM's. (Arm 0x26 `0x9f8dc`: the same block with the angle computed by its byte +8 — mode 2 = toward `[P+0x486]` − the yaw; not followed further) | R | Viewer agent 2026-10-01 |
| the motion LAYER update (loop `0x94ecf0..0x94fca0`; layers at `e+0x4b0` + n × 0x140, count `[e+0x4a4]`) | per layer: frame `+0x4fc` → `+0x500` (the previous), `+0x4fc` += the step (`+0x4bc` bit 0x10: frozen); the flags halfword `+0x4b6` loses bits 0 / 2..7 (`& 0xff02`, `0x94ef24`); bit 0 when the NEXT frame reaches the length `+0x504` (`0x94efa0`); **bit 2 — the ended flag `0xb09c8` / `0x94dc04` read — on the update whose frame reaches the length (`0x94f374`), then the wrap onto the loop point `+0x508` (length − loop > 0) or the hold at the length (`0x94f424`)**; hold mode (`+0x4bc` bit 4): clamped with bit 2 (`0x94f354`); playing backwards: bit 2 below frame 0 (`0x94f02c` / `0x94f338`). So **a looping motion "ends" once per pass** | R | Viewer agent 2026-10-01 |
| `0xb09a4` | **frame-crossed gate**, thin wrapper: `r3=r2; r2=1; b 0x72714`. `0xb0968` is the same with `r2=0` | R | em007-shells-spec §2a |
| `0x72714` | generic motion query; `r1` is an **opcode** (final jump table `0x728d0`, 13 arms), `s0`/`s1` the frame args | R | em007-shells-spec §2a |
| `0x7294c` | **the `r1=0` arm** (names corrected 2026-10-01, see Withdrawn): not wrapped → prev < s0 ≤ cur (`0x72b1c`); wrapped → (loop point `+0x508` ≤ s0 ≤ cur) or prev < s0 — "the motion crossed frame `s0` during this tick", loop-aware. **`s1` is unused in this arm** | R | em007-shells-spec §2a; prologue above |
| `0xb09d0` | `[+0x4f4] > 0` (motion has started) | R | em007-shells-spec §2a |

### base00's init and the shell placement branch (read 2026-09-30, from Effects' below-floor capture)

| addr | what | st | detail |
|---|---|---|---|
| `0x48b9cc` | the submit calls the new shell's vtable **`+0x13c`** (the init) with **`r1` = the request, unchanged**. `setup` is NOT a derived struct and `[mgr+0x34]` is not on this path — the manager only does the 144-slot pool scan (`0x48b8ec`, `[mgr+0x6d8c]`) and the id/type checks | R | base00-init-placement §1 |
| request `+0x00` | a **vtable** — the request is polymorphic (slot `+0x14` called at `0x48b930`/`0x48b940`), which is how the 0x30 and 0x40 shapes coexist | R | base00-init-placement §1 |
| `0x3f8b80` | **base00's init.** em004 `sp_00`'s `+0x13c` `0xd304a8` is a one-instruction veneer `b 0x3f8b80`; Tigrex's `sp_00` points here directly | R | base00-init-placement §2 |
| `0x3f8a04` | **base00 s ctor**; `mov r5,#0` at `0x3f8a14`, `str r5,[r4,#0x15e8]` at `0x3f8ab0` — **the flags word starts at ZERO**. The only writer of `+0x15e8` in base00 s band; the other hits there are `tst` reads | R | em004-shell00-spec §3 |
| `0x3fa2f8` | **base01 s ctor**, whose store at `0x3fa308` writes `mvn r4,#0` = −1 to `+0x15e8`. `em004-shell00-spec` §3 cited THIS for base00 and derived `0xFFFFFFFE`/`0xFFFFFFFF` — **withdrawn**; one base s ctor read for another | WITHDRAWN | em004-shell00-spec §3 |
| em004 shell00 flags | **`0x00000000`** on modes 0–3 and 5–10, **`0x00000001`** on mode 4. The reader touches **bit 0 only** and preserves the rest (`mov r3,r1` at `0xd305a8` copies the loaded word). So bit `0x10` is **CLEAR on every mode** | R | em004-shell00-spec §3 |
| em004 shell00 branch | therefore **NOT** the `setup+0x10` base. Falls to the joint test `0x3f8d60`: joint −1 → the **owner s position**, joint ≥ 0 → the joint matrix. `+0x15dc` is `accB(cmn,0)` (`0xd30514`) and its value is the one thing still unread | R | em004-shell00-spec §3 |
| `0x3f8c68` | **bit `0x20`** selects the ANGLE vec `+0xfe8..+0xff0`: set → the request `+0x20` vec3 (`0x3f8c9c`), clear → the owner `[+0x50]`/`[+0x54]` with `+0xfe8` zeroed when bit `0x200` is set. **A different selection from bit `0x10`** — `shells.js` line 3982 models this one correctly | R | em004-shell00-spec §3b |
| `+0x15dc` = −1 | confirmed: `accB` `0x4a2224` returns −1 at `0x4a225c` when `[obj+0x1384]` is null or `0x489ea4` gives 0, and em004_00 ships **no common FUP**. So base = the owner, offset `(0,−50,10)` yaw-rotated, and bit `0x80` clear means **no size scale** | R | em004-shell00-spec §3b |
| clear-arm audit | under a zero word every test takes its clear arm. `shells.js` has clear arms for `0x1`, `0x2`, `0x4`, `0x20`, `0x40`, `0x100`, `0x200`; `0x80` clear = no scale (correct default); `0x8` clear is absent but its sibling refuses by name. **`0x10` has NO clear arm (line 2927 is set-only) — the one missing piece** | R | em004-shell00-spec §3b |
| `0x3f8cb8` | `tst r0,#0x10` on the flags word — **the branch that selects the position base** | R | base00-init-placement §2 |
| `0x3f8d88` | bit `0x10` **SET** → base position = **`setup+0x10/+0x14/+0x18` raw** | R | base00-init-placement §2 |
| `0x3f8e20` | bit `0x10` clear **and joint `+0x15dc` == −1** → base position = **the OWNER's `+0x40/+0x44/+0x48`** (`r8` from `0x4a0f00`: `[shell+0x136c]`→`+0xc`→`+0xc`) | R | base00-init-placement §2 |
| `0x3f8d68` | bit `0x10` clear **and joint >= 0** → base = a joint **matrix** transform via `0xc15a4` (unread) | R | base00-init-placement §2 |
| `0x3f9140` | **in all three cases** a yaw-rotated offset is then ADDED to `+0x40/44/48` (sin/cos `0x13ecc20`/`0x13ecc2c`, scaled by `0xbe518` when flags bit `0x80` is set) | R -- **WITHDRAWN 2026-10-06 (the Withdrawn table): the offset is the base matrix's 3×3 (bit 3 clear) or `rotXYZ` by all three angle words (bit 3 set), not a yaw** | base00-init-placement §2; dev/em084-phase2-bases.md §1b.4 |
| `+0x15dc` | the shell's **joint**; em004 `sp_00`'s reader writes it with `accB(cmn,0)` at `0xd30514` | R | base00-init-placement §2 |
| `0xd3066c` | em004 `sp_00`'s `+0x150` landing, entered `(shell, r1, r2, r3 = contact type)`; `mov r5,r1` at `0xd30670`. Type-1 arm `0xd30694` allocates a **0x40** request and **overwrites both vectors**: `+0x10..18` = **`[r5]` the CONTACT POINT** (`0xd30728`), `+0x30..38` = **the landing shell's own `+0xfe8/+0xfec/+0xff0`** angle words (`0xd30744`). `+0x04` = `[owner+0xcac8]` = shell01's id, `+0x08` = **0** | R | em004-shell00-spec §7a |
| `u 161` placement | = shell01 mode 0 at **the contact point**, carrying the **parent shell's** angles; its mode-0 flags `0x0C` then take base01's ground-snap (`0x3faaf8`, query `0x183490`), so the final y is the floor under that contact. Agrees with Nargacuga's sibling site `0xe593d8`, which also overwrites `+0x10` with the contact | R | em004-shell00-spec §7a |
| `0xd28490` | em004 shell00's spawner: a **0x30-byte** request (`0x3f883c`), `+0x10..+0x18` from slot `0x1831a78` → `0x19176b0`, and **`+0x20..+0x28` from a DIFFERENT slot `0x18321b0` → `0x1620e60`, which is in `.rodata`** — two static sources, not one | R | base00-init-placement §4 |
| `0x4a22e0` | `accVec`'s null path resolves slot `0x1831a78` → `0x19176b0` — **the same address** the spawner's `+0x10` reads. A "return a vec3 when the param is absent" function would not hand back live scratch, which supports the shared-zero reading independently of any writer census | R | base00-init-placement §4 |
| `0x19176b0` writers | **I could not census them.** Two attempts returned 2518 and 1973 sites for this slot and a comparable count for an unrelated one — the PIC-pair resolver matched any register-offset load. Both void; the map's "no writer" row is **unverified by me** | — | base00-init-placement §5 |

### Shell infrastructure

| addr | what | st | detail |
|---|---|---|---|
| `0x175c3e8` | global shell table, 12 B/entry {class DTI, setup DTI, resource}; `0x19d` = unset | R | dev/shell-map.md |
| `0x175c3e8` w1 | **the setup DTI IS the base class** (`cSetupParamEmBaseNN` -> baseNN). 412 entries, 0..411. Validated 4/4 against the vtable-comparison results (sp_00->base00, sp_01->base01, sp_02->base02, sp_13->base13). **Makes the slot-for-slot vtable comparison a check, not the method.** **`efx/agents/narga-shell-scratch/shelltable.json`** already holds all 412 resolved {id, class, setup, res} — 0 unnamed | R | em007-shells-spec §4 -- **NARROWED 2026-10-07 (the Withdrawn table): a derived base (base11 / base14 / base15) keeps its parent's setup DTI; the vtable decides** |
| `dti.json` parentDti | **NOT the base.** `uShellEm004_sp_00` and `_sp_01` share parentDti `0x1885f78` (=`uShellEmBase13`) while behaving as base00 and base01 -- two classes, one parentDti, different bases. It agrees sometimes, which is why it convinced. Use w1. | R | em007-shells-spec §4 |
| `0x48b884` | enqueue a shell request | R | em004-shell00-spec §5 |
| `0x7a75a0` | resource-manager lookup (`ubfx` bits 23–28 into `[0x108adc8]`); **generic, not a consumer** | R | em004-shell00-spec |
| `0x3f883c`, `0x3fa2bc`, `0x3fb7bc` | request allocators | R | em004-shell00-spec |
| `0x3fa2f8` | **base01's ctor, in full** (its `push {r4, lr}`; `0x3fa348` is MID-FUNCTION and hides the registers the stores use). `mvn r4,#0` -> `+0x15e8`/`+0x15e4`/`+0x15e0`/`+0x15dc`/`+0x15d8` = -1; `mov r1,#0` at `0x3fa328` -> `+0x15d4`/`+0x15d0`/`+0x15cc`/`+0x15c8`, the **flags word `+0x15ec`** (`0x3fa374`), **the TIMER `+0x15f0`** (`0x3fa37c`) and `+0x1600` (`0x3fa3a0`) all **ZERO**; `movt lr,#0x43fa` = **500.0** -> `+0x15f4` (`0x3fa384`) and `+0x15f8` (`0x3fa38c`); `+0x15fc` = 1.0 (`0x3fa398`); `movt r3,#0x4461` = **900.0** -> `+0x1604` (`0x3fa3ac`); `+0x1608`/`+0x160c` the shared zero vector. So a base01 reader that does not write `+0x15f0` gives a shell **timer 0**, and `move011`'s `T <= 0` arm ends it on its first move unless a hit slot is on — `params04s01`'s `timer: 0.0` is READ, not assumed | R | `params01k` / `params04s01` in `docs/render/shells.js`; the 500.0 / 900.0 / 1.0 claims in those comments now have their addresses |
| `0x4a2470` | **getInt(i)** on the mode's `.sh` — validated 3/3 vs `params13` | R | em004-shell00-spec §2 |
| `0x4a24f8` | **getFloat(i)** — validated 8/8 vs `params13` | R | em004-shell00-spec §2 |
| `0x4a22f0` | getEffect(i), a different sub-object (getter `0x48a408`) | R | em004-shell00-spec §2 |
| `0x4a2224` | accessor on the **common FUP**; null path `0x4a225c` returns −1 | I | em004-shell00-spec §2 |
| `0x4a23f4` | **HitParam int** getter; `0x4a2584` **vec** — both named in `E:/offline/decode/notes/shells-em043.md` §50, which I had not opened | R | shells-em043.md §50 |
| `0x4a2378` | **SoundParam int** getter — was recorded here as INFERRED with its array unread; `shells-em043.md` §50 names it | R | shells-em043.md §50 |
| em004 shell01 hit | `_hit000`/`_hit001` are FUP type `496f8f22` (the `_sh` schema, so the 920-file control covers them), `nInt=1`, ints `[0]` and `[1]` → `+0x15d8` = the mode number. `_hitdata` `HDS\0` v`0x20160209`, `_hitsize` `HTS\0` v`0x20131015`, both 128 B with word2 = 2 (count **corroborated, serializer unread**). **So the one-move life is not the ROM's** | R | em004-shell01-spec §8/§9; **wired and the refusal retired** — `SHELL_DATA` has `hit: [0]` / `hit: [1]` and `hitdata: [[6, 10], [14, 10]]`, and `slotsOf011` keeps its named refusal for any future base01 mode that names a record with no table. Driven: the child now lives **17 moves** (24 animation frames) instead of 1, and the host is asked for `u 161 [shell]`. **The 17 is the viewer's count with `ctx.dt` as the step** — who runs `0x168d30` and what step it uses are UNREAD, so delay+duration is not a measured lifetime |
| `0x488fd0` | the **HDS loader**: magic checked at `0x489004`, version **`0x20160209`** at `0x48901c`, buffer to `[r4+0x64]`, and `addne r0,r0,#0x10 / strne r0,[r4+0x68]` — **records base = file + 0x10**. A whole-file loader, not a field serializer | R | em004-shell01-spec §9 |
| HDS records | **0x38 bytes from `+0x10`**; **delay = s16 `+0`, duration = s16 `+2`** (from the consumer `0x168a68..0x168a84`, `E:/offline/decode/notes/shells-em001.md` §449, which had this before I read it). em004 shell01: record 0 = **6 / 10**, record 1 = **14 / 10**; length control `0x10 + 2*0x38 = 0x80` exact. **delay+duration as the life is INFERRED** — the tick that runs `0x168d30` is NOT READ | R | em004-shell01-spec §9 |

### base00 (the rock/fireball base)

| addr | what | st | detail |
|---|---|---|---|
| `0x3f8b80` | init. Real extent runs to `0x3f9378` | R | spec §3 |
| `0x3f8878` | base landing (overridden per class via `LANDING[cls]`) | R | spec §7 |
| `0x3f9738` | step | R | spec §2 |
| `0x3f99e0` | point | R | spec §3 |
| `0x3f9ef4` | end | R | spec |
| `0x3f9378` | **X adjust** — the `+0x15ec` degree offset, gated on flags bit 0. Transcribed as `xAdjust37` | R | spec §6, §6b |
| `0x3f9cc4` | **Y fan** — `+0x15f0`, on the bit-`0x02`-clear arm | R | spec §6b |
| `0x3fa2f8` | ctor; writes `+0x15e8 = 0xFFFFFFFF` at `0x3fa348` | R | spec §3 — **WITHDRAWN (see the table): `0x3fa2f8` is BASE01's ctor; base00's is `0x3f8a04`, which writes 0** (EMC, recorded in shells.js `params04r`; the row was left standing until 2026-09-30) |
| `0x3f8c60..0x3f8cb8` | **the init picks the ANGLE WORDS first, then the POSITION, independently**: `+0x15e8 & 0x20` → the setup's `+0x20..+0x28`; clear → the owner's `+0x50` (X; 0 with `0x200`) and `+0x54` (Y), Z 0 → `+0xfe8..+0xff0`. Only then `0x3f8cb8` tests `0x10` for the position base (the request's `+0x10` or the joint / owner). So a class with `0x10` SET and `0x20` CLEAR (Ukanlos's beam children, flags `0x50`) takes the request's POINT and the owner's FACING | R | Viewer agent 2026-09-30. shells.js `init00`'s `0x10` arm took the request's angles whatever `0x20` said — unexercised until now (no class set `0x10`); corrected with the children |
| `0x3f8a04` | **base00's ctor, READ (Viewer agent, 2026-09-30)**: ef params `+0x15c8..+0x15d4` = 0; `+0x15d8` / `+0x15dc` (joint) / `+0x15e0` / `+0x15e4` = −1; `+0x15ec..+0x160f` cleared (`0x13ecbb4`, 0x24 bytes: the degree offsets, vz / vy, the flight, ...); the vec pointers `+0x1610` / `+0x1614` / `+0x1618` / `+0x161c` = slot `0x1831a78` (the shared empty vec3); `+0x1620` = −1; **`+0x15e8` = 0**; `+0x1624..+0x162c` = 0; `+0x1640..+0x1648` = that vec's (0, 0, 0) | R | a reader that leaves a field alone leaves THESE values — Plesioth's beam child reads no speed, offset or gravity |
| flag `0x800` | not among the ten tests above, and a band scan of `0x3f8800..0x3fa2f8` finds none (row in the beam-base section) | I | Plesioth's beam child sets it |
| `0x3f8fb0` | offset added to position; then calls `0x3f9378` | R | spec §3 |
| ten flag tests | `0x3f8c68/74/cb8`, `0x3f8e68`, `0x3f8ec4`, `0x3f8f94`, `0x3f9118`, `0x3f9308`, `0x3f933c`, `0x3f9940` | R | spec §3 |

### base13 (Khezu's orb)

| addr | what | st | detail |
|---|---|---|---|
| `0x174f3e8` | **base13 vtable** (thrown13 at `+0x168`, state-1 at `+0x158`) | R | spec §1 |
| `0x404350` | ctor | R | spec |
| `0x4044d8` / `0x40500c` / `0x405500` / `0x4053e4` / `0x404dc8` | init / move / thrown / aim / launch | R | shells.js |
| `0x40561c` | the near/far clamp — **unguarded** | R | spec |

### uEm004_00 (Basarios **and** Gravios — one class)

| addr | what | st | detail |
|---|---|---|---|
| `0xd222f8`–`0xd319e4` | the class's code extent | R | dev/em004-fireball-actions.md |
| `0xd2c944` | status-7 action table (**offsets**, not pointers); validated 8/8 | R | fireball-actions §1 |
| `0xd2855c` | the shared routine all fireball stubs tail-call; one motion-set, one frame literal | R | fireball-actions §2 |
| `0xd285c4` / `0xd288b4` | setMotion L2 M3 blend 6 / the frame constant 216.0 | R | fireball-actions |
| `0xd2e538` | **shell id assignment**: `cmp [+0xb5f4],#4` → Basarios, `#5` → Gravios | R | em005-shells-spec §1 |
| `0xd283fc` | shell00 spawner, L4 Motion[5], modes 0–3 by the action's arg | R | spec §5 |
| `0xd2ba08` | shell00 spawner, L4 Motion[20], modes 8/9/10 or 5/6/7 | R | spec §5 |
| `0xd299e4` | shell00 mode 4; **sets no motion** | R | spec |
| `0xd288b8` / `0xd28bb4` / `0xd2a714` / `0xd2a8c4` | shell02 spawners (M24 f118 / M27 f142 / M59 f134 / M60) | R | em005-shells-spec §3 |
| `0xd28d6c` | `mov sb,#1` then `cmp [+0xb5f4],#4` — **Basarios's shell02 mode 1 = u 130** | R | em005-shells-spec §3 |
| `0xd2cdf8` / `0xd2ce04` / `0xd2cf78` | beam stubs: (7,0x0d) → `0xd28bb4(e, 0, 0)`, (7,0x0e) → `(e, 1, 0)`, (7,0x32) → `(e, 1, 1)`. (7,0x0c) `0xd2cb88` → `0xd288b8(e, 0)`, (7,0x11) `0xd2cb98` → `(e, 1)` | R | shells.js SHELL_DATA em004_00 shell02 rows (Viewer agent, 2026-09-30) |
| `0xd28d28` | `0xd28bb4` phase 1: `cmp r1,#1 / bne 0xd295bc` — **r1 is the SPAWN GATE**: (7,0x0d) plays the beam clip and never fires | R | same |
| `0xd29100`..`0xd291d4` | **THE BEAM CLIP IS A BLEND**: class 2 → M27 alone (`0xd2917c`); class 0 (target above) → M27 + **M28** (`0x21c`, `0xd29130`); class 1 (below) → M27 + **M29** (`0x21d`, `0xd29198`); `0xb03f8` at `0xd296b4`, blend 4.0, M27 weight `1 − min(\|pitch word\|, 0x31c7) / 12743` (`0xd2927c` = −12743.0; 0x31c7 = 70°) | R | same; viewer `partnerTarget02` (a partner clip = its class, target at 70°) |
| `0xd28f94`..`0xd290fc` | the class (`P+0x1a2`): target (+100, `0xd28c20`) against owner + v0 × size; behind → 2; below by ≤ 330·size, or below and within 700·size → 2; else pitch word ≤ 0x8000 → 1, else 0 | R | shells.js `class02` |
| `0x2123650` | v0 = (0, 330, 0) — `.bss`, read under the emulator | R | shells.js `V0_02` |
| `0xd292ac`..`0xd29540` | the beam's aim (request `+0x20`, class ≤ 1 only; class 2 → 0): target pitch from joint 3 less the head's pitch, clamped −0x38d .. +0x1555 around the head | R | shells.js `aim02` |
| `0xd295bc`.. | phase 2 (motion end, `0xb09c8`): the follow-up motion by r2 and the class (`0xd2960c`: L2 M33 / M34 blend for class 0, r2 0); unread past that | R (partial) | — |
| `0xd28984` / `0xd28a38`..`0xd28a60` | `0xd288b8`: L2 M24 blended with M25 (`0x219`, above) / M26 (`0x21a`, below); shell02 at f118 in mode 3 / 8 (flag bit 0 of `[+0xcac0]+0x24` clear; calm / enraged) or 7 / 9 (set); no em test | R | SHELL_DATA note |
| `0xd2891c`..`0xd28b04` | `0xd288b8` phase 0, **the +0x20 word**: pitch word w from `P+0x40` to the target `P+0x1d0` (no +100 here; dz² then + dx², `atan2(-dy, h)` × 10430.378 + 0.5, truncated, `uxth`); w ≤ 0x8000 → `min(w, 0x31c7)` and partner M26, else `0x10000 − min(0x10000 − w, 0x31c7)` and M25; M24's weight `1 + r5 / −12743.0` (`0xd28bb0`); kept in `ctl+0xc` (`0xd28b04`) and stored `strh` at the f118 spawn (`0xd28aa0`) | R | shells.js `aim005`; dev/beams/em005_00.md (Viewer agent, 2026-09-30) |
| `0xd28d7c`..`0xd29290` | `0xd28bb4`'s **em-5 mode**: `sb = (r2 == 1 ? 2 : 1) \| (ctl+0x24 bit 0) << 2` → (7,0x0e) 1 / 5, (7,0x32) 2 / 6; id `[e+0xcacc]` = 0x6e | R | dev/beams/em005_00.md (agent A) |
| `0xd22e8c`..`0xd22fac` | on-action-start (vt+0x204 `0xd22a14`), em 5: `ctl+0x24` = 0, then **bit 0 = head (part 5) break level ≥ .dtp row 3's** (+0xd, or +0xe at questRank > 4), bit 1 part 6 row 2, bit 2 part 0 row 0 (bits 1 / 2 pick late hit records only) — the viewer reads bit 0 as the broken head mesh shown (part 3, set 4: motion-states.js `SHELL_PARTS`) | R (the part link: the viewer's data) | dev/beams/em005_00.md (agent A) |
| `0xd2a778` / `0xd2a7d0` | `0xd2a714` ((7,0x34), L4 M59): spawn gate **r1 == 0** (the opposite sense); f134; mode `10 \| head bit`; +0x20 = 0 | R | dev/beams/em005_00.md (agent A) |
| `0xd2adbc` / `0xd2ae14` | `0xd2a8c4` (L4 M60): spawn iff `(r1 \| 2) == 2`, f160, mode `4 \| head << 3` — modes 4 / 12 start no effect (ef 999), and (7,0x39) / (7,0x47) are not issued | R | dev/beams/em005_00.md (agent A) |
| — | **BASARIOS'S M24 BEAM DRAWS NOTHING**: his `.shl` ShellInfoList holds mode 1 alone (entries 2..12 null; Gravios's holds ef001..ef012); `0x4a22f0` returns 0 for a null entry (`0x4a2348`), the reader stores that in `+0x1644` (`0xd30aa8`), and the activation `0x3fbaf8` makes no effect when `+0x1644` is null (`0x3fbb30`). Control: mode 1 → u 130 draws. His PSL has no block for L2 M24..M26 | R | SHELL_DATA note |
| em004_00_cmdtbl g1 | beam issues, walked with `efx/agents/basarios-scratch/emc.py` (em005_00's are the same): (7,0x0e) s15..s20, s22, s37, s62; (7,0x32) s23/s24/s68/s69, op 0x24's else; (7,0x0d) s22/s23 as op 0x24's if, and s15/s16/s37 by op 0x02 (85, 82, 40 / 64 %); (7,0x11) / (7,0x0c) s23/s68 under op 0x6e's default; (7,0x34) s40 | R | SHELL_DATA note |
| `0xd304ac` | `sp_00` reader (to its `pop` at `0xd30668`) | R | spec §2 |
| `0xd3066c` | `sp_00` landing, **all three arms**: it switches on `r3` = the HIT TYPE. type 0 -> `r6 = [+0x15cc]` and `0x43ac04(shell, [+0x15e0])`; type 1 -> `r6 = [+0x15d0]`, `0x43ac04(shell, [+0x15e4])` **and** spawns shell01 mode 0 = **u 161**; type 2 -> `r6 = [+0x15d4]`, no shell. All three converge at `0xd307bc`: `0x3f8970(shell, r6, point)` then tail-call `[vtable+0x148]` (the end). So `+0x15cc`/`+0x15d0`/`+0x15d4` hold the ef param index PER HIT TYPE | R | spec §7; transcribed as `landing04` in `docs/render/shells.js`, where **type 1 starts no ef param of its own**. **THE TYPE-1 ARM IS REACHED IN THE VIEWER** (measured 2026-09-30, L4 Motion[5]): shell00 spawns at y 202..206 with the owner at y ~300 and the floor at -1.38, flies +z and crosses the floor 48 steps later (anchor y 10.66 -> position y -1.94), giving type 1 at (74.33, -1.38, 1309.22) on both shells of the clip. So **u 161 is live ROM, not a hypothetical**. **LIFTED AND DRIVEN 2026-09-30**: all four shell00 modes of L4 Motion[5] land type 1 and each creates shell01 mode 0 at its contact (y snapped to the floor -1.38 by base01's 0x3faaf8 arm), `start` = ef param 0 = **u 161**, no failure. **But `u 161` is NOT EXPORTED** — `docs/effects/em004_00.json` carries `u 160` and `u 162` as `when: 'shell'` records and no 161, so `schedule.js` finds no entry and the host is never asked: an EFFECTS-EXPORT gap, not a shells one. **CLOSED** (checked 2026-09-30, Viewer agent): the json now carries u 161 as a `when: 'shell'` record (index 8, `em004_00_005`), and **u 130** (the beam, `em005_00_002_s`) was exported the same way today |
| `0x43addc`..`0x43ae58` | **the hit type**: `attr & 0x22` -> 0; else 1, and 0 once the surface's angle from level reaches `+0x15c4`. (The ROM adds `n.z` twice where `n.z^2` would be, `0x43ae10`/`0x43ae14`) | R | `hitType` in shells.js. `+0x15c4 = 90.0` from the enemy-shell base ctor `0x43a78c`, so **only a vertical surface gives type 0** |
| — | **CONSEQUENCE, measured 2026-09-30:** the viewer's stage makes floors (attr `0x10`, type 1) and walls (attr `0x20`, type 0). On Basarios that is the whole difference between the lingering fire (shell01, u 161) and the burst (**u 162**): with no wall a landing is always type 1, which fires no ef param at all, so **u 162 is unreachable, not merely undriven**. And `docs/index.html:7465` hands the shells `facing: 1` fixed, which `stageQuery` can only satisfy for a shell crossing in **−z** — his fireball flies +z (z 45 -> 5050), so no wall POSITION helps either | R | proven by replaying a real capture with a wall injected at both facings: `+1` is byte-identical to no wall; `−1` hits at frame 56 and fires `u 162`. Reported to Render, whose file that line is |
| — | **AND THE FLOOR IS NOT REACHABLE EITHER, for a different reason.** `stageQuery`'s floor branch needs `B[1] >= floorY && A[1] < floorY` — the shell crossing the plane DOWNWARD. In a real capture (em004_00 L4 Motion[5] 7:0x04) the shell spawns at y ≈ **−50** while the page reports `floorY` ≈ **−1.4**, so it starts BELOW the floor plane and can never cross it. That is why no ground landing happens with or without a wall, and therefore why **u 161** (type 1 -> shell01, `landing04`) is unreachable even now that the wall works | — | R | which of the two y values is wrong is **UNREAD** and is the viewer's side (spawn y vs `monsterFloorY()`), reported to Render. A type-0 wall hit does NOT produce u 161: `landing04` gives type 0 -> ef param 2 (u 162) and type 1 -> shell01 with no ef param of its own |
| — | **A REQUEST THAT FIRES IS NOT AN EFFECT THAT PLAYS.** Once the wall landed, Render's live page still showed "no u 162" and it was read as "no landing entered" — including by me. The page WAS landing (`shellsLive` 2 -> 1, draws 1560 -> 1152 with the wall on: a shell ending early IS the landing). What was missing is that **no recorded vector set covered `em004_00_005`**. A replay through `shellplan --inputs` needs only the plan, because it computes the hit itself; the live page needs the recorded ROM vectors to run the effect, so the request fires into nothing | — | R | so when a live drive reports an effect absent, check `efx/vectors/` for the efl before looking for a logic fault. Costs a live drive otherwise (2026-09-30, Render's) |
| `0xd308dc` | **`sp_01` reader** (Basarios AND Gravios — one class). A shorter Khezu: flags `+0x15ec` bits 2/3/7 from `_sh` ints 0/1/2, `_ef(0)` → `+0x15c8`, `accA(_hit,0)` → `+0x15d8`, returns at `0xd3098c`. **Cannot build `0x800` / `0x1000`** | R | em004-shell01-spec |
| `0xd30a90` | `sp_02` reader | R | Render's spec |
| `0x1799064` | `sp_01` vtable, 92 slots, **`base01`** 89/92; three overrides `+0x004`, `+0x014`, `+0x14c`; **`+0x150` NOT overridden** — base landing | R | em004-shell01-spec §3 |
| **SLOT NUMBERS ARE PER BASE** | `+0x150` is the **landing** in `base00` and the **ending** in shell02's base (Render, `0x3fbdc8`'s `0xfe` branch tail-calls it). A slot number carries no meaning across bases, and `base00`'s names are the ones most likely to be borrowed because they are written up first | R | Render's shell02 spec |
| base flags words | **each base has its own**: `base00` `+0x15e8` · `base01` `+0x15ec` · `base13` `+0x15e0` | R | the three specs |
| `0xd3144c` | **`sp_13` reader (Gravios)** — flags `+0x15e0` bit **0x10** from `ints[0]` at `0xd314f0`; `getFloat(0)` → `+0x15ec` with a conditional ×1.5 (`0xc1044`); uses accessor **`0x4a2378`** (unvalidated) | R | em005-shells-spec §2 |
| `0x4a2378` | **`[holder+0x0c].getInt(i)`** — getter `0x48a458`, type slot `+0x44` (same as `getInt`). The array is the **`_snd###` FUP** | **I** | em005-shells-spec §2 |
| holder members | `+0x08` `_ef` (getter `0x48a408`) · `+0x0c` `_snd` (`0x48a458`) · `+0x10` `_hit` (`0x48a4a8`) · `+0x14` `_sh` (`0x48a4f8`) · `accB`'s is `[obj+0xe4]`, a different object (the common FUP) | R / I | em005-shells-spec §2 |
| type slots | `+0x44` int · `+0x4c` float · `+0x54` vec — the **getter** picks the file, the **slot** picks the type | R | em005-shells-spec §2 |
| `0x1798ee8` / `0x1799064` / `0x17991d4` / `0x1799350` | vtables `sp_00` / `01` / `02` / `13`; extents 95 / 92 / 95 / — slots | R | spec §1 |
| `sp_01` base | **`base01`**, 89/92 vs `em003_00` shell01; 3 overrides `+0x004`, `+0x014`, `+0x14c`. **Landing `+0x150` is the BASE's** — no per-class landing needed, unlike `sp_00` | R | em005-shells-spec §2 |
| `0x162286c` | u16 frame table for shell00 modes 0–3 (76, 74, 90, 80) | R | spec §5 |
| `0x1831a78` → `0x19176b0` | shell00 request `+0x10` slot → buffer. **Zero in the initialised image** | R | shell00-spec §5 |
| `0x1832afc` → `0x19177b0` | **base01's no-joint 4×4 matrix** (`0x3fa8e4`), same `.bss` block | R | shell01-spec §6 |
| `0x1831a78` → `0x19176b0` | **THE ENGINE'S SHARED EMPTY VEC3.** Reached from two unrelated places: `cmn.getVec`'s null path (`0x4a22e0`, Render) and em004's shell00 spawner (`0xd284c4`). In `.bss`, so zero by definition — **zero IS the value**, not an un-run initialiser. 1240 references, three sampled at random all splat it as a vec3 | R | shell00-spec §5 |
| `0x1832afc` → `0x19177b0` | **the engine's shared EMPTY 4×4**, same family. 293 references, three sampled all copy/compute 16 words as a matrix, and **NO site writes it** — both halves control-backed: the PIC-pair scan found its known pair, and the store detector sees a known store and correctly sees none where there are only loads | **R** -- **WITHDRAWN 2026-10-07 (the Withdrawn table): it is the IDENTITY 4×4, written by the static initializer `0x7c4408`** | shell01-spec §6 |
| accessor null paths | `cmn.getInt` `0x4a225c` → **−1** · `cmn.getFloat` `0x4a229c` → **0.0** · `cmn.getVec` `0x4a22e0` → the shared empty vec3 (Render) | R | Render's shell02 spec |
| `0x1917xxx` block | 14 `.data` slots point into it; **zero after main's 2,334 initialisers**; control: Khezu's `ORB_SLOT_POINT` reproduces 18/18. Blocks shell00 placement AND `u 161`. Filler **UNREAD** — not `.init_array`, not a module load (none in this build), and the `.rodata` reference is an `R_ARM_RELATIVE` reloc, not a copy table | **I** | shell01-spec §6 |
| `0x18321b0` → `0x1620e60` | request `+0x20` slot → the zero vector (corroborated by shells.js) | R | spec §5 |
| `0x1518cb8` | `.rodata` **relocation** entry `{0x1831a78, 0x17}` — `R_ARM_RELATIVE`, not a copy table | R | — |

### uEm007_00 (Diablos **and** Bloodbath Diablos — one class, variant byte `+0xb5f5`)

| addr | what | st | detail |
|---|---|---|---|
| `+0xcac4`..`+0xcadc` | **NOT shell slots in this class** — material-anim state: `+0xcac4` material, `+0xcac8`..`+0xcad8` clip handles `Lv1_to_Lv2`/`Lv2_loop`/`Lv2_to_Lv3`/`Lv3_loop`/`Lv3_to_end`, `+0xcadc` current slot (−1) | R | em007-shells-spec §1 |
| `0xd31c54..0xd320b4` | that setup, **Bloodbath only** (gate `0xd31e48` `cmp #4`). Clip names at `0x1580622`+, consumers `0xd37148..0xd373d4` -> `setMatClip` | R | em007-shells-spec §1 |
| `0xd366dc` | **the shell selector** (entry; `0xd366d4` is its float pool — earlier note wrong): arg `r1` 1/2/3 -> mode 11/10/12; id `0x71` on the variant-4 side of `0xd366e4`, `0x70` otherwise | R | em007-shells-spec §2 |
| `0xd35a94` | the shell/effect update for em007. Four tables on `[+0x4b4]` = the current **motion**: list0 `0xd35bb8` (43, M4..M46), list1 `0xd35d2c` (19, M1..M19), list2 `0xd35ad4` (27, M1..M27), list3 `0xd35cb4` (19, M3..M21); plus one on the **action index** `[+0x73e1]-0xe` at `0xd36510` (37, indices 0xe..0x32 — the same `cmp #0x32` Effects read for group 6). Default `0xd364bc` | R | em007-shells-spec §2a |
| **motions** -> modes | `L0 M24`->11 f58; `L0 M33`/`L0 M43`/`L0 M46`->12 f2; `L1 M1`/`L1 M4`->10 f2; `L1 M17`->11 f2; `L1 M19`->11 f2. Keyed on `[+0x4b4]` = the **current motion**, so these are clips, not actions — an earlier row here called them actions and was wrong | R | em007-shells-spec §2a |
| | Attributed by **reachability** from each case entry, not by address order (blocks interleave: `0xd35c90` jumps from one case body into another) | R | em007-shells-spec §2a |
| `0x70` / `0x71` | Diablos / Bloodbath shell01, **base01**, res `0x89c3` / `0x89c4`, one class `uShellEm007_04_01` | R | em007-shells-spec §2 |
| `0x72` | Bloodbath only (`0xd41bb0` gate), **base07**, res `0x89c5`; modes from `[sl+4/0xc/0x14]` **UNREAD** | R | em007-shells-spec §2 -- **CORRECTED 2026-10-08 (Withdrawn): `0xd41bb0` is the rate, modes READ** |
| `0x3fa2bc(0x40)` | a **0x40-byte** request shape, `0xffff` at `+0x3c` — the documented 0x30/`+0x2e` layout is the *other* allocator. Extra fields **UNREAD** | R | em007-shells-spec §2 |
| `0xd30694` setup | em004_00 `sp_00`'s type-1 arm. **RAISED AS UNREAD, NOW READ** — kept so the question is not asked twice: it **overwrites both** of the allocator's vectors, `+0x10..18` with the contact point and `+0x30..38` with the landing shell's own angle words, so neither default applies and `[[enemy+0x1428]+0x40]` never reaches it. Full row at `0xd3066c` above | R | em004-shell00-spec §7a; **lifted** in `landing04` (`docs/render/shells.js`), driven clean |
| `0xd46770` | **the reader for BOTH `0x70` and `0x71`** (`uShellEm007_04_01`, vtable `0x179a978`, base01 89/92 vs `uShellEm004_sp_01` with the same three override slots). Splits internally on the shell id | R | em007-shells-spec §2b |
| `0x4a0ecc` | the shell's **global id** from its param holder: `[obj+0x136c]` then `+4`, else the `0x19d` unset sentinel. This is how one class serves two monsters with different field maps | R | em007-shells-spec §2b |
| `0x70` map | Diablos: `getInt(0)`→bit2, `(1)`→bit11 `0x800`, `(2)`→bit7; `getFloat(0)`→`+0x15f0`; `accVec(0)`→`+0x1608`. No joint (`+0x15e4` keeps ctor −1). Modes 10/11/12 all flags **`0x84`** | R | em007-shells-spec §2b |
| `0x71` map | Bloodbath: `getInt(0)`→`+0x15e4`, `(1)`→bit2, `(2)`→bit3, `(3)`→bit11 `0x800`, `(4)`→bit7; `getFloat(0)`→`+0x15f0`; `accVec(0)`/`(1)`→`+0x1608`/`+0x160c`. Flags per mode: 0→`0x0c`, **3→`0x804`**, 5/6→`0x0c`, 7→`0`, 10/11/12→`0x84` | R | em007-shells-spec §2b |
| base01 `0x800` | **now required.** `em004-shell01-spec` §4 lifted the `init011` `0x800` refusal because em004's data never reached the bit, on condition that a later reader building it would restore the refusal. `0xd46770` builds it on both paths and Bloodbath's mode 3 sets it | R | em007-shells-spec §2b |
| `0x3cb120` | **the FUP serializer** (magic built at `0x3cb140`; the type hash `496f8f22` is not built inline). Writes the magic, version `2`, then `[obj+0x64]`=nInt, `[obj+0x68]`=nFloat, `[obj+0x6c]`=nVec, then the three arrays — ints u32 from `+0x70`, floats f32 from `+0x74`, vecs from `+0x78` at memory stride `0x10` with **three floats each in the file** | R | em007-shells-spec §2b |
| `0x488fd0` | **the HDS loader** (EMC): magic at `0x489004`, version `0x20160209` at `0x48901c`, buffer to `[r4+0x64]`, then `addne r0,r0,#0x10 / strne r0,[r4+0x68]` — **the records base is file + 0x10**. A whole-file loader with an indexed base, not a field-by-field serializer, so there is no field list to read off it; the fields come from the consumer `0x168a68..0x168a84` (s16 +0 delay, s16 +2 duration) and the countdown `0x168d30`. Length control: em004's file is 128 B and `0x10 + 2*0x38 = 0x80` exactly | R | em004-shell01-spec §9; notes `shells-em001.md` §449 documented the 0x38/+0x10 shape first |
| `_sh` FUP layout | five-word header: magic, `2`, then **word2 = nInt, word3 = nFloat, word4 = nVec**. An earlier row here called word2 a constant and shifted the other two; that error produced a phantom "em007_04's file is two words short" — its word2 is **5**, matching the five `getInt` calls its reader makes | R | em007-shells-spec §2b |
| `_sh` control | `5 + nInt + nFloat + 3*nVec == fileWords` with **all three counts read from the header**: **920 of 920 files across 40 monsters' arcs**, zero mismatches — non-circular, unlike the earlier identity | R | em007-shells-spec §2b |
| one type for all | every `_sh` in every arc carries type hash `496f8f22`, and so does `<em>_actiontune.fup` (em004_00 has 14 `_sh`, em005_00 16, em011_00 39). One resource type, one serializer, one schema — so **Basarios's shell00 and Gravios's shell13 `_sh` readings inherit the 920-file control**. Only which indices a base's reader asks for is base-specific | R | em007-shells-spec §2b |
| `0x3fa2bc(0x40)` layout | `+0x00` type word (`0x174e640`), `+0x04` id, `+0x08` raw mode, `+0x0c` enemy, `+0x10..18` vec3 from **`[[enemy+0x1428]+0x40]`** (NOT the enemy's own `+0x40`), `+0x1c` 0, `+0x20..28` the shared empty vec3, `+0x2c` 0, `+0x30..38` vec3 from enemy `+0xfe8/+0xfec/+0xff0`, `+0x3c` `0xffff`. Submitted by tail-call at `0xd36ac8` | R | em007-shells-spec §2b |
| em007 shell01 modes | Diablos's arc ships **exactly** `sh010/011/012` — independent confirmation of the three modes his code produces. Bloodbath's ships `000/003/005/006/007/010/011/012`, so **five of his spawn sites are UNFOUND** — not in `0xd35a94`'s eight motion cases | R | em007-shells-spec §2b |
| em007 shell submits | **9 in `uEm007_00`, not 6** — `bl 0x48b884` ×6 plus **`b` ×3** (`0xd36ac8`, `0xd4179c`, `0xd447cc`). Cross-check: 14 allocator calls, 6 of them funnelling into the shared tail, balances the 9 exactly | R | em007-shells-spec §2c |
| `0x71` mode sites | 0 `0xd413bc` (`stmib r1,{r0,r6}`, r6=0 at `0xd412d8`); 3 `0xd4179c`; **5/6 `0xd447cc`** (`mov #6` / `movweq #5` on `cmp r6,#0`); 7 `0xd3d1a0` **and** `0xd44ee0`; 10/11/12 via `0xd36ac8`. **= exactly the 8 `sh` files the arc ships, both directions** | R | em007-shells-spec §2c |
| `0xd342dc` | em007 action **group 7** handler: 201 indices, table `0xd34304`, 138 distinct arms, default `0xd34d80` (63 indices). Arms are `mov r1,#N / b <shared body>`, so indices share bodies with a differentiating argument | R | em007-shells-spec §2c |
| `em007_04_9.lmt` | **Bloodbath's OWN motion list, list 9** — 31 entries (LMT magic `LMT\0`, count u16 at `+6`). em007_00 ships lists 0–3 only; em007_04 ships those (Diablos's, shared) **plus 9**. His exclusive actions' clips live there, so the deviant gate is in the DATA, not the code — the shared bodies set L9 unconditionally | R | em007-shells-spec §2d |
| group-7 -> clip | `0x62`→L9 M16 (mode 0); `0x69`→L9 M7 f0 and `0x6b`→L9 M7 **start 80** (mode 3, two phases); `0xa0`→L9 M22 / `0xa1`→L9 M23 (modes 5/6, the mirror pair); `0xc8`→L9 M26 (mode 7). Probed with `actprobe7.py`, horns control re-run | R | em007-shells-spec §2d -- **CORRECTED 2026-10-08 (Withdrawn): mode 7 spawns in `0xc8`'s phase 4, L9 M30 f10** |
| `0xb0974` | `0x72714(r0, r1=0, r2=0, r3=0, s1=0.0)` — frame-crossed query with **`r2=0`** (selects `+0x13b8`, not `+0x13b4`); **`s0` is RETURNED by the preceding `0x6f618` call, not set by an instruction** | R | em007-shells-spec §2d |
| `0x6f618` | **action-tune float getter**: `r0=[enemy+0x75e4]`, tail-call `[[r0]+0x4c]` with (obj, index). Sibling `0x6f62c` uses slot `+0x44` (int). The frame thresholds are per-monster tune data, not literals | R | em007-shells-spec §2d |
| `[enemy+0x75e4]` | the action-tune object; its data is `enemyction_tune\<em>_actiontune.fup` | R | em007-shells-spec §2d |
| em007_04 tune | `FUP`, 158 words, `word2`=14 ints, `word3`=139 floats, `word4`=0 vecs; **5+14+139=158 exact with both counts from the header** (a non-circular fit). Floats start at word 19 | R | em007-shells-spec §2d |
| `0x71` spawn frames | mode 0 tune[27]=**116**; mode 3 tune[16]=**160**; mode 5/6 tune[116]=**154**; mode 7 (`0xd3cd40`) tune[137]=**24**; mode 7 (`0xd44bf0`) tune[124]=**10**. Slot `+0x4c` being a plain indexed read is INFERRED (dispatch read, callee not) | R | em007-shells-spec §2d |
| `_sh` FUP counts | the circular-control note here is **superseded** — the serializer read settled the schema, a 920-file control replaced the identity, and **no published value changed**, so `+0x15f0` and the vec destinations are no longer provisional | R | em007-shells-spec §2b |
| group-7 -> mode | index `0x62`→mode 0, `0x69`/`0x6b`→3, `0xa0`/`0xa1`→5/6, `0xc8`→7 (via `0xd44bf0`). Mode 7's other site `0xd3cd40` has ONE caller (`0xd34d28`) reached from ~35 arms with differing `r1` — **reachable set, not a driver list** | R | em007-shells-spec §2c |
| `0x88db14`, `0xb08b44`, `0xb09ae8`, `0xb09a3c` | materialAt / findMatClipByName / setMatClip / clearAllSlots — **names from my own tool table, INFERRED**; structure corroborates, no callee read | I | em007-shells-spec §5 |

### Part data — the `.dtp` file and the per-part record (read via em007)

| addr | what | st | detail |
|---|---|---|---|
| `0x54de0` | **the `.dtp` (dtbparts) serializer** — field by field via `0x824da8(stream, ptr, size)`, so the whole schema is readable off it. Type hash `0x1339ecb` (built at `0x54e14`, `0x556f8`); magic `"DTP\0"`. Scalars `+0x8c..+0xd0`, then ten arrays A..J with per-element field lists | R | em007_04-parts-read §1 |
| `0x824da8` | the serializer primitive: read/write `size` bytes at `ptr` from the stream | R | em007_04-parts-read §1 |
| `.dtp` control | schema consumed length **must equal** file length — em007_00 226/226, em007_04 242/242, with different counts. Reader `efx/agents/diablos-scratch/dtp.py` prints EXACT/MISMATCH every run | R | em007_04-parts-read §1 |
| `0x9d36c` / `0x9d384` | break-level getters: per-part record at **`[enemy+0x1428] + 0x3bc + part*12`**, bytes `+0x3bc` / `+0x3bd`. Stride 12 | R | em007_04-parts-read §2 |
| `[enemy+0x1054]` | a byte read by **both** base01's shell init (`0x3fab5c`, feeding the ground-snap query) and an 18-way keyed-effect switch in `uEm007_00` (`0xd3d630`, table `0xd3d9f0`). Reads like a surface/terrain id — **INFERRED**; `0x49660` unread | I | em007_04-parts-read §4 |
| `0xd3da74` | `u 1034` requested [**WITHDRAWN 2026-10-08: a hit record, not an effect**]: `0x7db70(enemy, 0, 0x40a, r6)`. Siblings `0x408`=1032 at `0xd3da54`, `0x40c`=1036 at `0xd3da94`. **In an arm of the `+0x1054` switch, NOT indexed by part** — in tension with the record-side "part 7" reading | R | em007_04-parts-read §4 |
| `0xd421b4` | `u 1016` requested [**WITHDRAWN 2026-10-08: a hit record, not an effect**] (`0x3f8`) | R | em007_04-parts-read §4 |
| staged-piece slots | **slot 0 = tail, slot 1 = head** for em007_04, from arc row order (tail rows 8/9, head rows 10/11); controlled by em007_00's known slot 0 = tail with the tail as its only staged model. Arc order is tail-then-head, NOT the alphabetical order a listing shows | R | em007_04-parts-read §3 |
| 900/901/905/906 | **not literals anywhere in `uEm007_00`** — fired from the engine's sever path. Pair-to-piece assignment **UNREAD** | — | em007_04-parts-read §5 |

### uEm032_00 (Tigrex **and** Grimclaw Tigrex — one class, vtable `0x17b8748`, code `0xe2031c..0xe34dd0`)

| addr | what | st | detail |
|---|---|---|---|
| `[unit+0xcac4]` / `[unit+0xcac8]` | **shell-id slots in THIS class**: shell00 `0xbd`/`0xbf`, shell01 `0xbe`/`0xc0`. The `uEm004_00` idiom (`movw / ldr [r4,r0] / str [r1,#4]`), NOT em007's literals — third class, third meaning for `+0xcac4` onward | R | em032-shells-spec §1 |
| `0xe35410` | `uShellEm032_sp_00`'s reader (vtable `0x17b9d48` `+0x14c`), **base00 86/95**. Four `getEffect` handles → `+0x15c8`/`+0x15cc`/`+0x15d0`/`+0x15d4`; `accA(0)`→`+0x15d8`; `0x4a2264(0)`→`+0x15fc`; `getFloat(0,1,2)`→`+0x15f4`/`+0x15f8`/`+0x15f0`; `accVec(0)`→`+0x161c`; `getInt(1,2)`→`+0x1660`/`+0x1664` | R | em032-shells-spec §4 |
| `0xe354b4` | **`orr r0,r0,#0x10` — UNCONDITIONAL.** With base00's zero default his shell00 flags are `0x10` (plus `0x20` when `ints[0] != -1`), so **he is the FIRST base00 shell read to take the raw `setup+0x10` position arm** (`0x3f8d88`). `shells.js` line 2927 stops being dead code and its bit-3/bit-7 handling is exercised untested | R | em032-shells-spec §4 |
| `0xe35ac4` | `sp_01`'s reader: a **three-way id switch** — `0xc0` → `0xe35c50` (**Grimclaw's own body, UNREAD**), `0xbe` → `0xe35af8` (Tigrex), anything else returns without reading. The two monsters share the entry and **not** the body | R | em032-shells-spec §3 |
| `0xe35af8` | Tigrex shell01's body: `getEffect(0,1)`→`+0x15c8`/`+0x15d0`; `accA(0,1)`→`+0x15d8`/`+0x15dc`; `getInt(0..5)`→ flags `+0x15ec` bits 7, 5, 11, 2, 3, 12. **Into base01's all-ones default, so every bit it does not name stays SET** | R | em032-shells-spec §3 |
| `0xe2031c..0xe34dd0` | **13 shell submits, all `bl`, 15 allocations.** Modes read: 0 (×2), 4, 5, 6, 6, 8 — all inside shell00's 0..17. 8 of 13 have an unresolved id or mode; the **dispatch (motion id vs action pair) is UNREAD** | R | em032-shells-spec §5 |
| `efx/agents/diablos-scratch/spawnread.py` | the spawn extractor: tracks the request register from the allocator's return, accepts `bl` and `b`, reports a conditional move as two values, handles `stmib`, takes the **last** store before the submit. **Controlled on `uEm007_00`** — reproduces every known id/mode and returns UNRESOLVED rather than a number where the value is out of window | R | em032-shells-spec §5 |
| `0xe343f8` | uEm032_00's action main: dispatches on `[+0x73e0]` (18 entries, table `0xe34418`); **group 7** → `0xe3447c` → the index dispatcher `0xe32484`. So all its shell spawns are `(7, index)` | R | em032-shells-spec §5d |
| `em032_04_9.lmt` | **Grimclaw's own list 9**, 546,432 bytes, version 67, **20 entries**. Tigrex ships lists 0–3 only. So group-7 indices **93, 99, 101, 102, 119, 120, 122, 124** play clips only Grimclaw has — **the second monster pair where the deviant gate is in the DATA, not the code** (after em007_04's list 9) | R | em032-shells-spec §5d |
| em032 group-7 clips | 7/8/9/10/11/12/58 → L2 M5 (one caller `0xe2a8ac`); 38 → L2 M29; 103/113 → L2 M15; 104/114 → L2 M16 — **Tigrex's own**. 93/99 → L9 M4; 101/102 → L9 M12; 119/120 → L9 M5 start 60; 122 → L9 M15; 124 → L9 M18 — **Grimclaw's**. 36/37/59/95/97/105/106 play **no clip** | R | em032-shells-spec §5d |
| `0xe20334` | **the shell-id slot assignment in uEm032_00, and the slots are SWAPPED vs the shell numbers**: `+0xcac4` = `0xbe`/`0xc0` = `sp_01` (base01, folder shell01, 1 mode on Tigrex), `+0xcac8` = `0xbd`/`0xbf` = `sp_00` (base00, folder shell00, 18 modes). `0xe202e8` writes the `0x19d` sentinel to both first. **Folder-to-class confirmed by accessor counts** — `sp_00` makes four `getEffect` calls and folder shell00's `ef` files hold four pairs; `sp_01` two and two | R | em032-shells-spec §0 |
| `0x169da90` / `0x169da9c` | Tigrex shell00's **mode byte tables**, adjacent: B = selector 0..3 → modes [0,1,2] [3,4,5] [6,7,8] [9,10,11]; A = selector 0..1 → [12,13,14] [15,16,17]. Mode = `table[selector*3 + shot]`, selector = `[[unit+0xcac0]+0x29]` (`0xe2ab68`), shot = 0..2. **Together they cover all 18 modes shell00 ships** | R | em032-shells-spec §0a |
| `0xe2aacc` | Tigrex's **shell01 helper**, 12 callers; the frame gate and the shot index live in the CALLERS. `cmp r1,#2 / bhi` bounds the index 0..2 and `rsbne r4,r4,#2` mirrors it, so `r4` (= `r1` or `2-r1`) feeds the request's `+0x20` u16 **angle** — three shots, one clip, different angles | R | em032-shells-spec §5e |
| `0xe2a9d0`/`0xe2aa04`/`0xe2aa38` | the three gates of the **L2 M5** volley: `0xb0968(unit,0,0, s0=frame, s1=0)` at frames **68, 72, 76**, each then calling the helper with `r1` = 0, 1, 2 | R | em032-shells-spec §5e |
| `0xe2ade4` request | 0x30-byte (`0x3f883c`): `+0x04` = `[unit+0xcac8]`, `+0x08` = **the mode from `[sp+0xc]`** (stored at `0xe2abf4` from `ldrb [r1]` at `0xe2abe8`, **r1 UNREAD**), `+0x10..18` a **computed** rotate(offset)+base, `+0x20` the angle, `+0x2e` `0xffff` | R | em032-shells-spec §5e |
| em032 consequence | shell00 **mode 8** is Grimclaw-only (L9 indices); **modes 4/5/6** come from clipless actions; **mode 0** is the frame handler. So of Tigrex's 18 shell00 modes this pass places **mode 0 alone**, while his shell01 is drivable from four clips — the first explanation of `shell-map.md`'s "em032_00: 7 unwired" | R | em032-shells-spec §5d |
| `0xe32484` | Tigrex's shell dispatch: `ldrb [unit+0x73e1] / cmp #0x7c`, PIC table `0xe324b0`, 125 indices, 112 arms. **The ACTION INDEX, not the motion id** — unlike `uEm007_00`'s `0xd35a94`. The group level above it is UNREAD | R | em032-shells-spec §5b |
| `0xe21294` | `uEm032_00` vtable **`+0x208` = the frame handler**, no callers because it is reached through the vtable. Its two submits are shell00 **mode 0**, so that mode is **state-driven per frame, not clip-driven** | R | em032-shells-spec §5b |
| em032 code band | `class-effects.json` says `0xe2031c..0xe34dd0`; `notice-marks.md` says `0xe2021c..0xe361a0`. **The census needs the wider one: 16 submits (14 `bl`, 2 `b`) and 19 allocations, against 13 and zero tail-calls in the narrow band.** The narrow figure is the range of the class's own vtable methods and stops short of code they reach | R | em032-shells-spec §5a |
| `0xe35624`, `0xe35ea0` | the three extra submits sit **inside the shell classes' own code**, between `sp_00`'s `+0x150`/`+0x170` and `sp_01`'s `+0x150`/`+0x014` — the shape of a **second generation**, but ids unresolved and the reaching method untraced. A candidate, not a finding | I | em032-shells-spec §5a |
| `actprobe32.py` | uEm032_00 prober: vtable `0x17b8748`, action main `+0x1f4` = `0xe343f8`. **Control passed** — `(2,0x8)` → L0 M3 blend 16, matching notice-marks' independent Tigrex notice clip; `(2,0x9)` → L0 M9, so it discriminates | R | em032-shells-spec §5c |
| `em032_00c` key 30 | `cm200_040` is requested by **no shell mode** of either monster. The only shell file touching the `c` pel is Tigrex's shell01 `ef000`, and it asks for **key 32**. Exhaustive `(pel,key)` set in the spec; Grimclaw's shell00 also references an **unresolved listId 1** | R | em032-shells-spec §6a |
| em032 arc | Tigrex shell00 18 modes (`sh000..sh017`) list `em032_00u`; shell01 **one** mode list `em032_00c`; Grimclaw shell00 **58** files to `sh073`, shell01 13, both `em032_04u`. shell00's `ef` arrays hold **four** pairs (matching the four `getEffect` calls) and **modes 9/10/11 request nothing** (`999/-1` on all four) | R | em032-shells-spec §6 |

### uEm043_00 (Deviljho **and** Savage Deviljho — one class, reaction table `breaks-em043.md` §3)

| addr | what | class | st | detail |
|---|---|---|---|---|
| vtable `+0x23c` | picks the **break reaction**: 1 -> `(10, 0x14)` (`0xe7dc10`), 0 -> `(10, 7)` (`0xe7dbbc` + table `0xe7dbe0`), keyed by the part in `P+0x5ccb` bits 3..5. **Savage's returns 1 always**, Deviljho's follows rage | uEm043_00 | R | `breaks-em043.md` §3. Consequence for the viewer: Savage's head depletions ALL play **L2 Motion[9]**, so **L3 Motion[9] is free** for him where Deviljho has to cycle it |
| `0x17c0910` | the **tune+0x44 status** reaction `(10, 0x1b)`: plays **L3 Motion[9]** from frame 0, and its setAction requests **c 1109** once (`0xa30dc` -> `0xa4074`: `cm200_008`, joint 3) | uEm043_00 | R | `states-em043.md` §3 reaction table, row "tune +0x44 (INFERRED exhaust)". Transcribed 2026-09-30 into `docs/render/motion-states.js` `em043_05` as a plain `'3|Motion[9]': { start: [['em043_00c', 1109]] }` — no cycle, because the table's only other player of L3 M9 is **part 7's depletion and part 7 carries no hit capsule**. Deviljho's own row cycles it against his calm head break |

### Effect request funnel and the tables (Effects lane)

| addr | what | class | st | detail |
|---|---|---|---|---|
| vtable `+0x1cc` / `+0x1d0` | a class's effect-request override: `+0x1cc` resolves against its c.pel, `+0x1d0` its u.pel. **Each slot has its own id→key table AND its own GOT slot** — the two are not one table read twice | any `uEm` | R | efx/class-requests.json, and see the WITHDRAWN row on that file's vtable |
| `0xa3dc0` / `0xa3ddc` | the **shared** request when a class has no override (c / u) | — | R | efx/class-requests.json |
| `0x159c798` / `0x159c7fc` | the two shared base id→key tables: **one block**, u starting **25 words** in, both ending `0x159c8e8`; 84 keys. WORD array, not halfword | — | R | the read is `base + id*4 - 0xfa0`, i.e. `table[id-1000]`, and it is a **WORD** load — reading it as halfwords gives plausible wrong keys |
| `0x328ba0` | **which array of the .pel a request resolves in.** The selector is an argument, and `0x328b98`-`0x328bac` turn it into `*(pel + 0x74 + sel*0x14)` -> `[key]`: the .pel holds 0x14-byte array descriptors from `+0x74`, so **sel 2 = the third array in the file = UNIQUE** (proof/pel.py reads the three in file order). **All 54 class request overrides pin sel = 2** (`r1 = 2` at each `b 0xa3dc0`/`0xa3ddc`, carried through `0x6fdd4`/`0x6feb8` `mov r2, r5`); the PSL path `0x6ff6c` takes it from ITS caller (`mov r2, r4` at `0x70098`) and is the variable one | — | R | **why it matters:** a .pel can hold one key in both arrays as two different effects — em007_04u 200 is the shared `cm202_035` in SEQUENCE and his own `em007_04_000` in UNIQUE. A state row that does not name UNIQUE wires the wrong effect and nothing complains |
| — | **a shell's `ef` entry is `(listId, uniqueId)` and `listId` IS PER-SHELL**, named by that shell's own `.shl` EffectLists — NOT a fixed pel. Nargacuga: shell00's listId 0 is the **u**.pel, shell01's listId 0 is the **c**.pel (`docs/render/shells.js`, the em037_00 header). The `uniqueId` resolves in **UNIQUE** (`efx/shellef.py`'s layout note) | — | R | I had inferred "listId 0 = u.pel" from Basarios's shell00 alone, where key 160 exists only in `em004_00u`; Nargacuga's shell01 key 30 exists only in `em037_00c` and breaks it. The correct rule was already written in the file I was reading — trap 18 again (open the row and the file it cites) and CLAUDE.md's "check the viewer's own code first" |
| `0x169bb80` | `uEm004_00`'s id→key table: 1001-1006 = Basarios's six, **1007/1008 = Gravios's** u 10 / u 40; real length 8 | uEm004_00 | R | dev/em004-fireball-actions.md |
| `0xa442c` | the break code: `index = part*5 + level + 6` into the shared table, i.e. **`key = 999 + 5*part + level`** | — | R | validated on 5 rows authored without it |
| `0xd2855c` | Basarios/Gravios attack arms; each passes **only (unit, effect id)** — no position, matrix or joint | uEm004_00 | R | EMC, 8 arms 0xd28640..0xd287dc |

### uEm081_00 — the charge state (Effects lane; serves em081_00 AND em081_04)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x1017d84` | **the frame handler is a VARIANT SPLITTER, not a body**: `movw #0xb5f5 / ldrb / cmp #4` -> variant 4 branches to `0x1018558`, variant 0 falls to `0x1017da4`, anything else returns. So **Astalos and Boltreaver have separate frame-handler bodies** requesting overlapping keys | uEm081_00 | R | this is why `class-effects.json` lists 21 sites in three functions: 4 in `0x1011f50`, 8 in Astalos's `0x1017da4`, 9 in Boltreaver's `0x1018558` |
| `0x16a2054` | uEm081_00's id→key table, via GOT `0x183f850` (`base + id*4 - 0xfa0`). **Real extent ids 1000..1017**; index 18 onward is a float (`0x419c0000`) and other data. 1001→220, 1002→221, 1003→220, 1004→221, 1005→240, 1006→241, 1007→200, 1008→210, 1009→231, 1010→201, 1011→211, 1012→230, 1013→202, 1014→212, 1015→232, 1016→300, 1017→310 | " | R | all 21 sites go through `+0x1cc`? no — **all through `+0x1d0` (u.pel)** |
| `0x1017e3c` | **the charge gate.** `enemy[+0xcb7c] != 0`, then the two adjacent bytes `+0xcb02` and `+0xcb03` each tested `(b \| 1) == 3` (bit 1 set). With both set and the handle at `+0xcba4` empty: fire id 1001 -> **key 220 once**, set `+0xb648 = 3`, fire id 1002 -> **key 221 and store its handle at `+0xcba4`** — so 220 is a one-shot and 221 is held | " | R | keys 200/201/202 and 210/211/212 are **three apiece** on one joint each (131; 103/3), which matches Raven's "U = Uncharged, C = Charging, F = Fully Charged" (index.html:641) |
| — | **THE VIEWER CANNOT EXPRESS THIS YET, and that is a missing device rather than an unread.** It has `state.charged`, a `level` axis, `hasChargeState` and `rageLadder` — but `state.level` has no path into the effects runtime, and `RAGE_BY_LEVEL` is a two-entry *rage* table (em037_00/em037_04 only). The runtime side exists: `schedule.holdEvent(pel, key, on)` (the hyper mechanism uses it) and index.html already pushes per-frame state with `rt.puffGates(...)`. What is missing is a charge-keyed table and the call that drives it | " | — | so his 8 charge records are exported and undriven **by decision, pending PM/Raven** — not refused, and the ROM side needs no further reading |
| — | **BUILT 2026-09-30 (PM's call): `CHARGE_EFFECTS` in `render/motion-states.js`.** `step()` diffs the charge level around the monId/level change and returns the records as `holdOn` / `holdOff` / `fire` like any other, so `index.html` needed only to pass `level: state.level | 0` into the `user` argument — no new push and no second state machine. `driven-split.mjs` reads the table too. **The mapping is stated in the table's comment because it IS a mapping:** the ROM carries three independent per-part tiers and the viewer models one level for the monster, so level 2 means all three at tier 2 — which is also the only combination the ROM reaches in one step, via the two actions that set all three gauges to 100. Level 1 is deliberately absent: the tier-1 arcs u 200/201/202 are bound to their charging attacks' clips, which is the more precise driver | " | R | verified by stepping: nothing at level 0, **nothing at level 1** (the control), entering 2 holds 210/211/212/221 and fires 220 once, staying at 2 re-emits nothing, dropping releases all four, and a monster with no entry is unaffected |

### uEm007_00 — the group-6 held effect (Effects lane; serves em007_00 AND em007_04)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xd32ce0` | **action GROUP switch**: selector `enemy[+0x73e0]`, `cmp #0x11` (0..17), PIC jump table at base `0xd32d1c`, target = `base + table[g]`. Group **6** is the only arm reaching the index switch | uEm007_00 | R | groups 4,5,8,9,14,15,16 all share the default arm `0xd32d94` |
| `0xd33ecc` | **action INDEX switch** for group 6: selector `enemy[+0x73e1]`, `cmp #0x32` (0..50), PIC table at base `0xd33ef8`. `add r1,pc,#4` / `ldr r0,[r0,r1]` / `add pc,r0,r1` | " | R | already in `build/hitzone-states/bloodbath_trace.py`'s DISP as group 6 |
| `0xd3c1d4` | the **held-effect handler**. It IS the whole action body for seven indices; sets no motion and no script of its own. `(enemy, r6, r8)`. First frame (`[+0x1a1] == 0`): sets it to 1, `0xbc7f4(enemy, 4)`, requests ONE effect, stores the handle at `[[enemy+0xcac0]+0x24]`. Later frames: accumulates into `[[enemy+0x1428]+0x1bc]` and compares against the r6 threshold; on reaching it, releases the handle (`0x329c40`) and tail-calls `vtable+0x3e8` | " | R | so it is a `hold`-shaped effect over an action, not a one-shot |
| `0x1592828` | the r6 threshold table: **120.0, 180.0, 64.0, 64.0**; default (r6 > 3) 0.0 at `0xd3c374` | " | R | what `0x7264c` accumulates is **UNREAD** — degrees is a guess from the 120/180 shape, not a read |
| `0xd3c318` | site 1, `movw r1,#0x3ea` = id **1002** through `+0x1d0` (u.pel). Taken only when `r6 == 3` | " | R | -> `u[2]` = key **230** |
| `0xd3c418` | site 2, `movw r1,#0x3e9` = id **1001**, with `cmp r8,#1 / movweq r1,#0x3ea` = id **1002**, through `+0x1cc` (c.pel) | " | R | -> `c[1]` = key **30** / `c[2]` = key **40** |
| `0x169bc9c` / `0x169bca8` | the c and u id→key tables, **overlapping by 3 words** (`c[3..5]` ARE `u[0..2]`, visible in the data). c: `[-1, 30, 40]`; u: `[-1, 200, 230]`. `-1` (`0xffffffff`) is the no-record sentinel | " | R | replaces the retracted per-variant reading; see the WITHDRAWN row |
| — | the seven group-6 indices and what each requests: **14, 17, 24** -> c key 30; **27, 38, 39** -> c key 40; **50** -> u key 230. All three resolve to UNIQUE **`em007_00_002`** | " | R | index 17's arm `0xd34160` is reached ONLY through the jump table (no branch, no absolute pointer) |
| `0xd3c274` | **all seven play `L0 Motion[1]`** — `bl 0xafef0` (setMotionL) with `mov r1,#1`, a literal, blend `s0 = 10.0`, start `s1 = 0.0` (pool word at `0xd3c488`). It is the ONLY setMotion-family call in `0xd3c1d4..0xd3c4a0`, so one clip serves all seven | uEm007_00 | R | found by **EMC**, 2026-09-30, verified here: `0xafef0` calls `0x726cc` then `vtable+0x3d8` with the id. It corrects my own "sets no motion", which was wrong by five instructions. `0xc460c` is a DEAD LEAD for this question |
| — | **whether the game ever sets group 6 indices 14/17/24/27/38/39/50** is NOT known. It is a command-stream question (group 4 stream 0, the walker parse — not a byte scan) and has not been run | " | **U** | EMC's, explicitly named rather than inferred from silence; do not write "designed but never issued" without the walker |
| `enemy+0x4b4` | the **current motion id** `(list<<8)|motion`, **NOT the action id** | any | R | EMC withdrew the action-id reading, 2026-09-30: `setMotionC` (`0xafe8c`) calls `0x726cc`, which compares this field against setMotion's `r1`. Nothing of mine reads it; recorded so nobody re-derives the wrong meaning. The action is the (`+0x73e0` group, `+0x73e1` index) pair |

### Effect parameter block, descriptor and placement (Effects lane)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x31b6b0` | parameter-block ctor (fresh block's override words are 0, so every field comes from the record) | uProofEffect | R | efx/proof.py `block()` |
| `0x31c4ac` | the ROM's own **record → block copy**; builds per-field override masks then tail-calls `0x31bbe8` | " | R | efx/proof.py |
| `0x31bbe8` | the field-copy body, gated per field by those masks | " | **I** | body NOT read instruction by instruction; the +0x10 shift below is established from 4 field anchors instead |
| — | **block offset = payload offset + 0x10**; **descriptor = block − 0x30 = `effect + 0x220`** | " | R | anchors: key `+0x30`, joint `+0x32`, offset `+0x00`, scale `+0x20`, mode `+0x36`. Cross-check: payload = `effect + 0x260`, which `0x3272e8` passes independently |
| — | payload map: `+0x00` offset · `+0x10` rotation **in degrees** · `+0x20` scale · `+0x30` key (u16) · `+0x32` joint (s16, **−1 = the unit itself**) · `+0x36` mode · `+0x38` space · `+0x48`/`+0x4c` MASK1/MASK2 · `+0x58` spawn-height limit 900.0 | " | R | docs/render/rom/effect/*, E:/offline/decode/notes/effects-pel.md |
| `0x329d88` | mode → **compose state**: 4→0, 1→2, 0→(1 if `+0x38`==1 else 0), else (3 if `+0x3e`==6 else 4) | " | R | dev/recompose-0x31d16c-trace.md |
| `0x327188` | uMHProofEffect move: the **per-frame recompose**; result → root `+0x40/44/48` at `0x327300..18` | " | R | " |
| `0x327238` | its gate: `ldr r0,[r7,#0x220]! / cmp r0,#1 / bhi` — **states 0,1 re-place every frame; 2,3,4 placed once** | " | R | " |
| `0x31d16c` | the placement. Dispatch: `0x31d228` mode, `0x31d3a0` a caller flag (recompose passes 1), **`0x31d410` the space field** (`cmp r0,#2`) | " | R | trace; `sp+0x3c` and the path from `0x31d47c` to the offset add are UNREAD |
| `0x31f6b4` | parent-model gate: `ldr r0,[r6,#0xf0]` — with a model the **joint-matrix** arm `0x31f6c0` (offset rotated+scaled via `0x1ebe8`); with 0 the **fallback** `0x31f788` (parent `+0x40` + raw offset) | " | R | host.js:317 |
| `0x42744` / `0x31f904` | the core's ground-height resolve, and where its float lands in the world matrix Y | uMHEffectCore | R | proof.js:31 |
| `0x939278` | joint matrix by gid; an **unmapped** gid answers the model root `+0xb0` | — | R | live.js:235 |

### The request STOP and the unit end (Viewer agent, 2026-09-30)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x329c40(core, r1)` | **the request stop.** r1 == 1: `vt+0xa4`, then `+0x30` = 2. r1 == 0 (what a shell's end and the viewer pass): returns if `+0x30` == 2, else **tail-calls `vt+0x9c(core, 7)`** — `0x329874` on the core vtable `0x172a578` | uMHEffectCore | R | code `0x329c40..0x329c98`; the tail target seen in a recorder trace (same sp, lr the harness's) |
| `0x329874` | walks the core's unit array `+0x150` (count `+0x15c`): for each unit, `blx vt+0x128` at `0x329904`, then the `+0x154` neighbour's `vt+0x88` | " | R | `0x3298e0..0x32992c` |
| `0x44ab0` | an effect unit's `vt+0x128` (vtable `0x172a7dc`): unless `+0x364` is set, each of 16 0x18-byte slots at `+0x378` whose `+0x37c` == 4 goes through `0x40be0(slot, u, [u+0x310]->vt+4(), 0)`; then **tail-calls `0x327e7c`** | effect unit | R | `0x44ab0..0x44b20` |
| `0x327e7c(u)` | **THE UNIT END.** State `+0xc & 7` not 1/2 → only `+0x364` = 1. `(+0xc & 0x407) != 0x402` → `vt+0x40`. `+0x364` already set → return. `0x9b2794(u) == 1` → `vt+0x40`. Else `+0x118 & 0xf` ≤ 2 → `vt+0x70`; **> 2 → `0x327f1c`: `+0x29b` == 2 → `+0x368` = 1 (a DEFERRED end), else `vt+0x40`**. Every arm but the first return leaves `+0x364` = 1 | " | R | `0x327e7c..0x327f30`. Plesioth's beam u 30 takes the deferred arm: `+0xc` 0x14cb2, `+0x118` 0x41022283, `+0x29b` 2 -- the same state in the viewer and in the recorder |
| `0x9b2794(u)` | dispatch on `+0x118 & 0xf`: **0** → `vt+0x70`, returns 0; **1** → returns 1, no call; **2** → `vt+0x7c`, returns 0; **≥ 3** → returns 0, no call | " | R | `0x9b2794..0x9b27dc`. So for nibble 0, `0x327e7c` calls `vt+0x70` twice (here and at `0x327f0c`) -- that is the code, not a transcription slip |

### Row gate (Effects lane)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x9bb904..0x9bb934` | the **exclusion** arm: a row is SKIPPED when `((effect+0x116 \| global+0x228) & row[+4])`. Two row tables: exclusion `[[effect+0xf4]+0x70]` **stride 0x44**, masks `[[effect+0xf4]+0x68]` **stride 0x10** | — | R | dev/row-exclusion-gate-0x9bb904.md |
| `0x9bb954..0x9bb974` | the two inclusion tests: `(w00 & [unit+0x1c8]) && (w04 & [unit+0x1cc])` | — | R | " |
| `0x9ba670` | writes those masks (`0x9ba69c` / `0x9ba6a0`) from arguments the start supplies out of payload `+0x48`/`+0x4c` | — | R | " |
| `0x349e44` in loader `0x345d84` | **effect `+0x116` is AUTHORED DATA**: one byte read off a stream (cursor `[r5+0xc]`, buffer `[r5+8]`). Loader is 16.5 KB, 414 stores, in no vtable, called from `0x3a970` / `0x398ce0` / `0x3bfec0`; the middle one walks an array of **0x3b8-byte** records | — | R | " — which resource this is, is UNREAD |
| `0x352b00` | copies `+0x116` on clone | — | R | " |
| `0x183b9ec` → `0x211f554` | the GOT slot and runtime singleton whose `+0x228` is OR-ed into the test | — | R | owner UNREAD |

### u 1400 (`cm202_005`) — **the "26 monsters close as one refusal" claim is WITHDRAWN, 2026-09-30** (Effects lane)

> **Read this before using the rows below.** I closed 26 monsters on the shared latch at `0xadc98`. That gate is
> real and still read — but it is **not the only requester**. Sweeping a class's own code band for branches into
> `0xa3000..0xa4fff` found **four monsters in a row** whose class asks for u 1400 itself, on a clip the viewer
> plays: **Uragaan** and **Crystalbeard** (`0xe94118`, L0 Motion[6], the roll), **Duramboros** (`0xed6288`, L0
> Motion[6], the same machine function for function) and **Brachydios** (`0xf3ccbc` and `0xf3cd9c`, both L0
> Motion[10]). All four are now wired as `hold` rows. **A monster whose class band has not been swept is not
> closed** — "the shared latch" was a conclusion drawn from one shared read, and the per-class question was
> never asked. The sweep is two lines and it is the thing to run before writing the refusal again.


| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xa4a04` in `0xa499c(e, level)` | **the u 1400 requester** (start), with `0xa4940` in `0xa4518` on the LOD refresh. `0xa499c` is reached from shared `0xada80` at `0xadcd0` **with level 2** | shared | R | from `effects-em043_00-unrequested.md` (2026-09-23), the note's own bottom-line table |
| — | **the gate is the unread part, not the requester**: `0xa499c` is class-independent, so every monster reaches the code, and what decides it is a set of **enemy flag bits, NOT READ** | — | **U** | **this corrects a claim I repeated on unit after unit.** I reported "u 1400's requester is UNREAD" for em007_00, em007_04, em033_00 and others while that note had the chain; the honest statement is *the requester is read and the flag gate is not*, and the trigger reaching it with `level` 2 through an LOD refresh is not something the viewer models. **26 monsters currently carry u 1400 undriven**, so this is one shared read, not 26 |
| `0xadc98`..`0xadcd0` | **the u 1400 GATE, read 2026-09-30** (inside `0xada80`, the shared enemy update): it fires only when **`enemy[+0x1404]` has BOTH bits 20 and 21 set** (`and r1, r0, #0x300000` / `cmp r1, #0x300000`) **AND `enemy[+0x1408]` bit 0 is set** (`ldrb r0,[r7] / tst r0,#1`, with `r7 = enemy + 0x1408` from `0xadaf4` and `sl = r7 - 4` from `0xadc74`). Then `0xa499c(e, 2)`. Immediately after, `bfc r0, #0x15, #2` **clears bits 21-22 of `+0x1404`** — so it is a ONE-SHOT LATCH, not a state | shared | R | and the request itself is unconditional inside `0xa499c`: it stops any handle at `+0xb7c4`, copies the area `e+0x1054` -> `e+0xb64c`, sets `e+0xb648 = 2` and asks **id 2** through `+0x1d0` — under 1000, so it falls to the shared base and the shared u table index 2, which is key **1400**. The handle goes back to `+0xb7c4` |
| — | **so the 26 monsters close as ONE refusal with a precise reason**, not 26 unreads: u 1400 is a one-shot fired from a latch in two enemy flag words the viewer does not model, and the latch is cleared the same frame. **What those bits MEAN — what sets `+0x1404` bits 20/21 and `+0x1408` bit 0 — is the next level and is NOT READ** | — | **U** | this replaces "u 1400's requester is UNREAD", which I repeated on unit after unit while `effects-em043_00-unrequested.md` had the chain |

### u 1400 — the per-class sweep, all 22 remaining monsters (Effects lane, 2026-09-30)

Method, and it is two lines: take the class's `code_lo..code_hi` from `class-effects.json`, sweep every `b`/`bl`
into `0xa3000..0xa4fff`, and read the `r1` the `b 0xa499c` is reached with (**that is the LEVEL, and the base u
table `0x159c7fc` turns it into the key: 0 -> 1120, 1 -> 1121, 2 -> 1400, 3 -> 900, 4 -> 901, 5 -> 905, 6 -> 906**).
Then read the `setMotion` before it. A site with level != 2 is **not** a u 1400 site at all.

| monster(s) | site | level | key | clip | st |
|---|---|---|---|---|---|
| `em004_00` Basarios | `0xd27be4` | 2 | **1400** | **L0 Motion[7]** | R — wired |
| `em043_00` Deviljho, `em043_05` Savage | `0xe770a8` | 2 | **1400** | **L0 Motion[6]**, rate 1.3x | R — wired |
| `em066_00` Tetsucabra, `em066_04` Drilltusk | `0xf5d92c` | 2 | **1400** | **L0 Motion[7]** | R — wired |
| `em069_00` | `0xf9272c` | 2 | **1400** | **L0 Motion[8]** | R — wired |
| `em063_00` Brachydios, `em063_05` Raging | `0xf3ccbc`, `0xf3cd9c` | 2 | **1400** | **L0 Motion[10]** (both) | R — wired |
| `em045_00` Uragaan, `em045_04` Crystalbeard | `0xe941b0` | 2 | **1400** | **L0 Motion[6]**, rate 3x | R — wired |
| `em055_00` Duramboros | `0xed6354` | 2 | **1400** | **L0 Motion[6]**, rate 3x | R — wired |
| `em068_00` | `0xf7fdbc`, `0xf85228` | 2 | **1400** | **L0 Motion[44]** (both) | R — **no MOTION_STATES block yet**, so not wired |
| `em007_00` Diablos, `em007_04` Bloodbath | `0xd3bfcc` | 2 | **1400** | **L0 Motion[7]**, posture 4 — in `0xd3b9fc` at `+0xa4` | R — wired |
| " | `0xd3c748` | 1 | 1121 | — | **not a u 1400 site** |
| `em019_00` Daimyo, `em019_04`, `em020_00` Shogun, `em020_04` | `0xdbb68c` | 2 | **1400** | **L0 Motion[4]**, posture 4 — in `0xdbb304` at `+0xb0`. **It belongs to BOTH classes**, read from the code rather than the json: `0xdbb304` has four callers in two disjoint regions — `0xdbbafc` / `0xdbbb10` inside `uEm019_00`'s band, and `0xdc7f58` / `0xdc7f6c` above `uEm019_00`'s `code_hi` and inside `uEm020_00`'s. A genuinely shared helper, so the range overlap is a correct description, not a defect | R — `em019_00` wired; `em019_04`, `em020_00`, `em020_04` have **no MOTION_STATES block yet** |
| `em033_00` Akantor | `0xe3a5c8` | **1** | **1121** | L0 Motion[2], posture 4 — in `0xe3a53c` | **not a u 1400 site.** Akantor genuinely closes on the latch |
| `em084_00` Nakarkos | `0x1073474` | **1** | **1121** | — (in `0x1073214`) | **not a u 1400 site.** With his other site also 1121, Nakarkos genuinely closes on the latch |
| " | `0x10739d0` | 1 | 1121 | L0 Motion[50] | **not a u 1400 site** |
| `em036_00` | `0xe41e10`, `0xe44314` | **0** | 1120 | L0 Motion[21] | **not a u 1400 site** |
| **`em010_00`, `em046_00`, `em047_00`** | — | — | — | — | **R: NO branch into the record family at all in the whole class band — these three genuinely close on the shared latch** |
| **`em033_00`, `em036_00`, `em084_00`** | (sites exist) | 1 / 0 / 1 | 1121 / 1120 / 1121 | — | **R: every site they have resolves a DIFFERENT key, so they close on the latch too.** This is the row the sweep would have got wrong: reading the branch and not the level would have wired all three to u 1400 |
| `em022_00`, `em030_00` | — | — | — | — | **UNRESOLVED: `class-effects.json` gives them the range `0x6bb14..0xcad08`, which is the SHARED enemy layer, not a class band** (its one `0xa499c` hit is the shared latch `0xadcd0` itself). Their real class bands have to be found before either can be answered |

**The headline: of the 22, SIX genuinely close on the latch** — `em010_00`, `em046_00`, `em047_00` (no site at
all) and `em033_00`, `em036_00`, `em084_00` (sites that resolve other keys) — **two cannot be answered from the
json at all** (`em022_00`, `em030_00`), and **the other fourteen are class-requested**. The refusal I wrote on 26
of them was drawn from one shared read and never asked the per-class question.

**How `class-effects.json`'s bands are derived, and why the two failures are DIFFERENT** (asked 2026-09-30):
the file's own `_about` says it, so this is read and not guessed — *"the code range is the cluster of the vtable's
function pointers containing its own frame handler, since a vtable holds inherited methods."*

* **`em022_00` / `em030_00`** both list `frame_handler` = **`0x6be64`** — the SAME address, and it is in the shared
  enemy layer. They do not override the frame handler at all, so "the cluster containing it" is correctly the
  base layer. **The derivation is not broken; it is answering a question those two classes have no answer to.**
  Their real own-code bands need a different derivation (their vtables' overridden slots), and that is a separate
  read.
* **`em019_00` / `em020_00`** each have their **own, distinct** frame handler (`0xdb5274`, `0xdc4f48`). Their bands
  overlap because their vtables' pointer clusters overlap — the two crabs share most of their methods. **Also not
  a defect**, and `0xdbb304`'s two disjoint caller sets confirm it from the code side.

So the two are **not** the same failure, and only the first pair needs a band derivation at all.

### `0x18154c` — the stage ray: READ, and what the 74 records actually wait on (Effects lane)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x18154c` | the **stage query** (through `0x24a5c4`): area `e+0x1054`, position `e+0x40`, output block `e+0x1060..` — `+0x1068` its flag word and **`+0x1074` a height**. **`0x42744` uses `e+0x1074` as an ALTERNATIVE GROUND** (max with `e+0x10f0` when payload `+0x5c` bit 0). A record whose payload has `+0x52` set with `+0x5c` bit 4 takes its Y from it, and `add_effects.py`'s `plan()` refuses such a record by name (`stage_ray(payload)`) | shared | **R** | `shared-state-effects.md` §8 and `effects-firing.md` 7. **CORRECTION, 2026-09-30: I wrote this row as UNREAD and called it "the best-value unread in the tree". Both were wrong** — it has been read since at least 2026-09-28, the board says so explicitly, and PM caught it. What is genuinely NOT READ is the MEANING of `+0x1074` and of the flag bits `0x2` / `0x1000` / `0x800000` (INFERRED water surface / shallow water) — not the query and not its role as a ground height. **The refusal was never a decode gap; it was missing stage geometry** — the viewer used to draw a monster with no map under it |
| — | **and that reason has expired**: there IS a floor now. `stageQuery` / `collide()` answer with a stage plane (the rocks and Basarios's shells land on it), and the effect runtime already resolves clip effects to it (`0x42744` -> `0x31f904`; Render measured Rathian's c 0/1/2/3/4/6 snapping to `floorY`). So the stage ray has **the same labelled stand-in every shell already uses** | — | — | **the 74 records across 23 monsters** (53 of them shared `cm202_*`, all in SEQUENCE) are therefore an EXPORT decision, not a decode one |
| — | **AND IT IS NOT A GENERATOR BUG, which is what I went looking for.** The `CLIP_EFFECTS` writer emits a bit for **every PSL bit whose record is exported** — its own words — so the bit FOLLOWS the export. Proved on `em081_04` u 605: exporting the record made its bit appear on the next run, with the frames the triage had read all along (`[[25, 41]]` = f25-40). u 605 was the tree's **only** genuine export-side miss and is now exported and driven | — | R | how to run the sweep again: replicate the writer's filter but compare against **every** exported record rather than `when == 'clip'` — comparing against `clip` alone over-reports records that legitimately sit in another layer (em007_00u key 900 is exported as `event` for his sever, and skipping its bit is correct). That mistake inflated my first count from 74 to 77 |
| — | two records left over, separate and small: `em080_00c` / `em080_04` key 0, in the **RULED** array with an empty efl name — "missing: no .efl in the staged corpus" | — | — | not the stage ray; their own case |

### uEm055_00 (Duramboros — vtable `0x17c8768`, code `0xed0a38..0xedec14`, frame handler `0xed2a1c`) — **no decode note exists; all of this is Effects', 2026-09-30**

| addr | what | class | st | detail |
|---|---|---|---|---|
| action scripts | **his whole action -> clip map**, probed with `probe.py` and resolved with `scr.py`: `(10, 0x1b)` -> `0x17c90f0` **L3 M1** (tune+0x44, c 1109); `(10, 7)` -> **per part**; `(10, 0x14)` -> `0x17c9080` **L2 M16**, part 0 only; `(10, 0x1d)` -> `0x17c90c0` L3 M10; `(10, 0x1e)` -> `0x17c90d0` L3 M11; `(10, 0x1f)` -> `0x17c90a0` L3 M12; `(10, 0x6e)` -> `0x17c92f0` L3 M8 then L3 M12 held; `(10, 0x72)` -> `0x17c9070` **L3 M20**; `(0,0)/(0,1)/(0,2)` -> L0 M1 / M2 / **M10**; `(1,2)` -> L0 M11; `(11,0)` -> L3 M9; `(11,7)` and `(11,0x12)` -> L3 M17; `(11,0x10)` -> L3 M10 then L3 M11 | uEm055_00 | R | transcribed into `docs/render/motion-states.js` `em055_00` |
| `(10, 7)` per part | **part 0 -> `0x17c9040` L3 M1; parts 1 and 2 -> `0x17c9050` L3 M8; part 3 -> `0x17c9060` L3 M2; part 4 -> `0x17c91b0` L3 M3 with a +90 turn over f80..140; part 5 -> `0x17c91c8` L3 M4 with -90 over the same frames; parts 6 and 7 -> `0x17c9070` L3 M20** | uEm055_00 | R | **independently confirmed**: `CLIP_TURNS.em055_00` already carried `'3\|Motion[3]' +90 f80..140` and `'3\|Motion[4]' -90 f80..140`, read by another lane — which is what says the prober is reading this class correctly. Three clips carry two meanings each (L3 M1 break + exhaust, L3 M8 trap + part 1/2 break, L3 M20 sever + part 6/7 break), so each is a `cycle` |
| `0xed6288` | **the ROLL, the same machine Uragaan has function for function**: gate `[e+0x1428]+0x1a1 == 0` then raise it, `e+0x1404 \|= 0x100000`, `0xbc7f4(e, 4)`, **`0xafe84(e, 6, ..)` = L0 Motion[6]**, `0xb07b4(e, 3.0)`, and the tail-call **`b 0xa499c` at `0xed6354` with r1 = 2** -> base u table index 2 = key **1400**, end 1, HELD | uEm055_00 | **R** | so **his u 1400 is not the shared latch either**. Found by sweeping his whole class band for branches into `0xa3000..0xa4fff`: there are exactly **two**, this and vtable `+0x1d0`'s own tail at `0xede148` — so everything else he shows for a state comes from shared code |
| `0xc2274` x2 | **the sever**: both calls pass **slot 0, kind 0x90** (`0xed0b70`, `0xed2878`) — his own number, where Basarios passes 0x8f, Savage 0x8e, Diablos 0x91 — and the second is gated on **`0x9d384(e, 7) >= 2`**, so the tail must already be at break level 2. **u 900** (`cm202_062`) is on **joint 143**, the Rath line's sever joint; **u 905** (`cm202_001`) has joint **-1**, the landing | uEm055_00 | R | `CUT_TAIL.em055_00` added: `em055_00_tail.glb` is staged and his `monsters.json` entry carries the **shared `em001_00_option`** list, so the piece flies on Rathian's option poses exactly as Gravios's does. **His uEnemyOption descriptor word is the one thing not read directly** and the entry says so |
| `0xed3adc` / `0xed3c40` / `0xed3dd0` | three sites, all **id `0x3e9` = 1001** -> class table `{-1, 100}` -> **u key 100**, each stopping the old handle first and storing the new one — so u 100 is HELD. Gated at frames **270 / 313 / 403**, and the frame handler's own motion table at **`0xed2aec`** (10 entries, motions `0x217..0x220`) binds **L2 M29 (0x21d), L2 M31 (0x21f), L2 M32 (0x220)** to arms carrying those same three literals | uEm055_00 | R | **confirmed from the other side**: the PSL fires **c 72** at f270 / f313 / f403 on those same three motions. `class-effects.json`'s fourth site `0xee23a4` is **outside** his code range and is one of the 50 known false positives |
| — | **EIGHT records BLOCKED, not undecided: u 100, u 310, u 311, c 60, c 62, c 63, c 72, c 212 — 37 PSL bindings, his whole ground-impact move set — every one refused by `add_effects.py`'s `stage_ray`.** Duramboros is the tree's worst stage-ray case by a wide margin | — | — | they are the first to record if the `0x18154c` stub is approved |
| `(10, 0x20)` | **his STUN reaches no motion at all** — the action main runs to completion with no `setMotion` and no script, on every part, where every other monster's stun reaches one | uEm055_00 | R | so **c 1103 stays undriven** and the clip a stunned Duramboros holds is NOT READ. A `hold` row would be invented |

### Basarios `em004_00` — why one animation shows no gas: the six-arm site is an ARRAY TWIN and is unexported (Effects lane, 2026-09-30)

Asked for after Raven reported "one animation shows no gas at all". Read from the PSL, the pel and the export;
the arm SELECTION itself is EMC's read and is not claimed here.

| motion | viewer clip | PSL block | what fires, and whether it is driven today |
|---|---|---|---|
| **L2 Motion[3]** | 234 f | yes, 235 f | **FOUR PSL bits, all DRIVEN**: `em004_00u` **SEQUENCE** 261 / 291 / 321 / 351, every one over frames **33-140**, exported `clip`, joints [2, 0]. **AND a second site at f216 that is NOT driven** — see below |
| **L2 Motion[20]** | 197 f | yes, 197 f | **one bit, DRIVEN**: `em004_00u` SEQUENCE **380**, frames 1-2, 99-100, 194-195 |
| **L2 Motion[24]** | 355 f | **NONE** | **nothing.** The clip exists and is long, and there is no PSL block for it at all — so no clip-layer effect can fire on it |
| **L2 Motion[27]** | 192 f | yes, 193 f | **two bits, both DRIVEN**: `em004_00u` SEQUENCE **230** (f27-137) and **251** (f137-192) |
| **L4 Motion[59]** | **MISSING** | NONE | **the viewer has no L4 Motion[59]** — nothing can play there |

**The f216 six-arm site, and this is the answer to "no gas on one animation".** Its keys — **0, 30, 60, 70, 90,
100** on `em004_00_002` — are **`em004_00u` UNIQUE** records, and **not one of them is exported**. The class
request path resolves in UNIQUE (all 54 class request overrides pin `sel = 2`), so that is the right array and
these are the right records.

**The trap that hides it:** a plain key lookup says 0, 60, 70 and 90 *are* exported. They are not — what is
exported on those numbers is **`em004_00c` SEQUENCE**, a different pel AND a different array, sharing nothing but
the integer. Keys **30**, **100** and **130** have no twin on any pel and simply read as absent. So the six-arm
site looks two-thirds present and is entirely missing.

| record | array | exported? |
|---|---|---|
| `em004_00u` UNIQUE **0 / 30 / 60 / 70 / 90 / 100** (the six arms, `em004_00_002`) | UNIQUE | **NO — none of the six** |
| `em004_00u` UNIQUE **130** (the fire beam, shell02) | UNIQUE | **NO** |
| `em004_00c` SEQUENCE 0 / 60 / 70 / 90 | SEQUENCE | yes, `clip` — **different records, same numbers** |
| `em004_00u` SEQUENCE 261 / 291 / 321 / 351 / 380 / 230 / 251 | SEQUENCE | yes, `clip` — the driven L2 M3 / M20 / M27 bits |

**So Raven's "one animation shows no gas" is L2 Motion[3]:** the clip DOES show gas over f33-140 from the four
PSL bits, and shows nothing at **f216**, where the six-arm site sits. **What is owed here is an export per arm
once EMC's selection read lands** — the records exist, they are simply not in the json — and **u 130 waits on
Render's `base02` shell spawn** before it can be recorded.

### THE PSL ENABLE MASK — enemy `+0x13f4` REPLACES every motion block's own bit mask (Viewer agent, 2026-09-30)

**The PSL file's `+0` "mask of defined bits" is NOT what fires.** For an enemy, the walker copies each motion's
block and the enemy overwrites the copy's mask with its own per-motion word `+0x13f4` before any bit is tested.
Every tool so far (`gen_clip_effects.py`, `add_effects.py psl_blocks`, `effects_triage.py`) iterated the FILE
mask, so: bits the enemy enables outside it were never exported or driven (1119 named + switched-on bindings
tree-wide, 349 of them on bits 0-5, which the base ALWAYS enables), and in-mask bits >= 6 fire in the viewer in
states and actions where the game does not (1311 bindings). Census: 364 enemy PSLs, 2026-09-30.

| addr | what | st | detail |
|---|---|---|---|
| `0x31cc70` | walker: per-list override `[seq+0x6c+list*4][slot]` replaces the block when non-zero | R | this section |
| `0x31cc88`..`0x31ccbc` | walker: if `[seq+0xac]` and byte `[seq+0xb0]`, memcpy the block (0x14c) there, call `seq->vt[+0x24](seq, copy)`, walk the COPY | R | " |
| `0x31ce64`/`0x31ce68` | run reader tests `[copy+0] & (1<<bit)` — the (replaced) mask; rise vt+0x18, on vt+0x1c, fall vt+0x20 | R | " |
| `0xad0c0`..`0xad0e4` | every enemy: sequence via mgr vt+0x38 (handle `e+0x135c`), `0x31cf38` allocates `+0xac`, **`+0xb0 = 1`** (sb = 1 from `0xace94`) | R | " |
| vtable `0x172a4bc` | the MH sequence: `+0x18` = `0x40718` (base rise + `0x4d5b2c(X+0x111c, effectNo)`), **`+0x24` = `0x40780`** (base `0x174b4c0` has `bx lr` there) | R | " |
| `0x40780` | `X = owner->vt[+0x1c]()->vt[+4](); X->vt[+0xf0](X, copy)`. Owner object is addressed through the enemy vtable window at `+0x114` (window `+0x18` = `0x6ff6c` start, `+0x1c` = `0x6bdcc` parent, `+0x28` = the class's `+0x13c`) | R (window) / I (that `X` is the enemy: structural — `0xca52c` reads the field `0x7256c` writes) | " |
| `0xca52c` | enemy vt **`+0xf0`** (base, not overridden by uEm004_00): `copy->mask = [e+0x13f4]` | R | " |
| `0x7256c` | enemy setMotion wrapper: `[e+0x13f4] = 0`; sequence `+0xc0 \|= 4` (motion-change notice); **`e->vt[+0x13c](e, motionId)`** | R | " |
| `0xca170` | base vt `+0x13c`: `+0x13f4 \|= 0x3f` (bits 0-5 ALWAYS), then `\|= 0x1c0` (6-8) calm and not tired, `0xe00` (9-11) **enraged** (tired or not), `0x7000` (12-14) tired and not enraged. Bits 15-31 only if the class sets them | R | " |
| `0x81614` / `0x81670` | tired = `P+0x505 & 0xfe == 2` / enraged = `P+0x518 == 1` | R | " |
| `0xd2e0ec` | **uEm004_00 vt `+0x13c`** (Basarios; em 5 tails to `0xd2e35c`). Calls `0xca170`, then per motion id (table `0xd2e134`, ids `0x203..0x236`). **L2 M3 / L2 M4, status 7** (table `0xd2e23c` on number-5): `0x0a` → bits 15/16; `0x07` → 17/18; `0x05`, `0x0f` → 19/20; `0x10`, `0x15` → 21/22. Other motion arms (`0xd2e2b8`, `0xd2e31c`) not yet transcribed | R | this section |
| `0xd2e35c` | the em-5 (Gravios) arm of the same method | R (entry) — body NOT READ | " |

**Basarios L2 Motion[3], his own `em004_00_2.psl` slot 3** (file mask `0x550000`): bit 0 c 0 (f10), bit 1 c 1
(f68) — outside the file mask, always enabled; bits 16/18/20/22 = u 261/291/321/351 on f33-139 (the charge, ONE
per gas action); bits **15/17/19/21 = u 260/290/320/350 on f151-233** (the gas cloud, one per gas action) —
outside the file mask, so every tool read them as "no motion fires it". Then the class's own f216 request
(`em004-fireball-actions.md`). So the four gas types are the four bit pairs: `(7,0x0a)` 15/16 + u 0;
`(7,0x07)` 17/18 + u 30; `(7,0x05)`/`(7,0x0f)` 19/20 + u 60 / u 70; `(7,0x10)`/`(7,0x15)` 21/22 + u 100 / u 90.

**Rathian's fireball, L2 Motion[5]** (`em001_00_2.psl` slot 5, file mask **0**): the viewer binds nothing; the
game fires u 200 (bit 0, f0-71) always, u 201 at f74 (bit 6 calm / bit 9 enraged) or **u 221 when tired** (bit
12), and u 202 over f87-189 (bit 7 calm / bit 10 enraged, none when tired). u 201 / 202 / 221 were never exported.

### uEm080_00 (Glavenus **and** Hellblade Glavenus — vtable `0x17eac74`, code `0xffe0dc..0x100c340`) (Effects lane, 2026-09-30)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x1000974` | vtable **`+0x1d0`**: `id >= 0x3e8` -> `table[id - 1000]` then `0x6feb8(e, 2, key, ..)`; below 1000 it tails to the shared `0xa3ddc`. GOT `0x183f83c` -> table **`0x16a1c6c`** = `{-1, 200, 201, 202, **204**, **203**, 0, 0, 0, 32, ..}` | uEm080_00 | **R** | note **ids 1004 and 1005 are CROSSED** relative to the keys — 1004 -> 204 and 1005 -> 203, where Brachydios's table runs straight. Read, not assumed |
| `0xfffb24` (vtable `+0x208`) | the frame handler, and the **only** request site in the class (`0xfffc44`). It stops the old handle (`0x329c40`), sets `e+0xb648 = 2` and stores the new one. **THE SELECTOR IS FULLY READ**: `r1 = [e+0x1428]+0x1bb`, and the id comes off **bits 4, 3 and 1** of that byte | uEm080_00 | **R** | the branch reads `r2 = r1 & 8`, `tst r1, #0x10` |
| — | the selector table, `[e+0x1428]+0x1bb` -> id -> key (**and note the class table crosses 1004/1005**): bit4=0 & bit3=1 -> **1002 = key 201**; bit4=0 & bit3=0 & bit1=1 -> **1001 = key 200**; bit4=0 & bit3=0 & bit1=0 -> **no request, the handle is STOPPED**; bit4=1 & bit3=1 -> **1005 = key 203**; bit4=1 & bit3=0 & bit1=0 -> **1003 = key 202**; bit4=1 & bit3=0 & bit1=1 -> **1004 = key 204** | uEm080_00 | **R** | the last two come from `movw r2, #0x3eb` then `addeq r5, r2, r1, lsr #1` with `r1` already masked to bit 1 — a computed id, which is why a scan for immediates misses two of the five |
| `0xffe438`..`0xffe718`+ | the **writers** of `[e+0x1428]+0x1bb`: at least eight sites setting or clearing bits **0, 1, 2 and 4**, most of them also setting `e+0xcaf4 = 1` | uEm080_00 | **U** | **WHAT THE BITS MEAN, and which motion each writer sits under, is NOT READ.** That is the one thing between this and a wired row |
| — | **AND THE FIVE CLASS-REQUESTED RECORDS ARE NOT EXPORTED ON EITHER MONSTER — this is an ARRAY-TWIN case, the session's own trap.** The class request path resolves in **UNIQUE**; `em080_00u` holds **only UNIQUE 200** (so Glavenus's ids 1002..1005 find no record at all), while `em080_04u` holds **UNIQUE 200, 201, 202, 203, 204**, every one of them `em080_00_130`. What IS exported on keys 200/201/203/204 is the **SEQUENCE** twin — different files (`em080_00_014`, `_010`, `_009`, `_013`), PSL-bound, in the clip layer | — | **R** | `efx/array_twins.py` finds seven of them from the other side (em080_00u 200; em080_04u 200, 201, 203, 204, and 220 / 230 / 240). **It does NOT find `em080_04u` UNIQUE 202** — that key has no SEQUENCE twin, which is the tool's documented blind spot; the triage caught it instead. Two tools, two halves of one set |
| — | **Glavenus `em080_00` 81 / 65 / 16 and Hellblade `em080_04` 84 / 74 / 10**, and **every** undriven record on either is an off-the-list decision (blast c 1130..1136, notice/disengage c 1200/1201, c 1500) or hyper | — | — | nothing to wire on the driven measure |
| — | not-exported, by reason: **shell-carried** (6 RULED key 0 and UNIQUE 0 / 1 / 2 / 30 / 40 / 50 / 210 / 211 across shell00 / shell01 / shell03 — the shell lane's), **SEQUENCE with no PSL motion** (u 233 / 235 / 237 / 242 / 401 / 430 / 431 / 501 / 503 / 504, c 30 / 51 / 52 ...), and **TWO stage-ray refusals: `em080_00c` c 50 and c 53** | — | — | Glavenus is a light stage-ray case — 2 records against Duramboros's 8 |
| `em080_00u` UNIQUE **3** | the one record the triage leaves **unattributed** ("nothing found (class request sites not read)"). It is **not** reachable through the table above — that table only produces 200..204 for the class's own ids — and its `.efl` `em080_00_013` is the **same file as UNIQUE 2, which IS shell-carried** (shell00 modes 0..9, shell01 modes 1 and 18) | uEm080_00 | **I** | so the likely carrier is a shell mode the `_ef` reader did not attribute — **the shell lane's question, and stated as a likelihood rather than decided here** |

### uEm063_00 — Raging's slime state machine and the ON-HIT ERUPTION (Effects lane; the read is **Render's, on the task board, not in `dev/` or the decode notes**)

**Why this section exists.** None of `0xf36328` / `0xf36588` / `0xf36984` / `0xf36c74` was in this map, and I wrote
"when u 200..204 fire is not read" in Raging's block while the answer had been on the board since **2026-09-13**.
It is not in `E:\offline\decode\notes` and not in `dev/`, so a grep of either finds nothing — **the board is a
source and this map did not point at it.** Board section: *"Raging Brachydios's on-hit slime eruption"*.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xf46978` | uEm063_00 vtable **`+0x1d0`**: `id >= 0x3e8` -> `table[id - 1000]` (read as `base + id*4 - 0xfa0`) then `0x6feb8(e, 2, key, ..)`; below 1000 it tails to the shared `0xa3ddc` | uEm063_00 | **R** | **confirmed independently, 2026-09-30**: GOT `0x183f760` -> table **`0x16a0364`** = `{-1, 200, 201, 202, 203, 204, 0, 0}`, so **ids 1001..1005 -> keys 200..204** |
| `0xf36328` -> `0xf36588` | the **per-slot slime colour state machine**, one slot per MRL id 51..54 (arm_l / arm_r / body / tail): **0 Yellow, 1 Yellow_to_Red, 2 Red, 3 Red_to_Yellow**, names from table `0x17d9750`; only the two transitions are clips (15 frames on `fAlbedoBlendColor.a`) | uEm063_00, Raging only | R (Render) | board note. Red is reached by a **2700-tick per-slot countdown** (`+0x50+8k`), a **per-slot trigger byte** (`+0x70+k`), and **Move action 6** (`0xf380d0` case 6 -> `0xf37b64`, all four at **frame 158 of motion 0xF**); all four return to Yellow while vtable `+0x3f4` (= `0x7fed4`, action group 0xb / 0xc / 0xe) holds |
| `0xf36984` (tail `0xf36c74`) | **the eruption WARNING request**: a Red slot asks **`0x3e9 + slot`** through `+0x1d0`, with a **30-tick fuse** at `[+0xcacc]+0xb0+4k`; `0xf36100` burns it down and `0xf46234` posts the explosion event and sets that slot's countdown to **-1**, so an erupted part is Yellow again next tick | uEm063_00 | R (Render) | the sites in this band, read here: **`0xf36b68` id 1001, `0xf36c3c` 1002, `0xf36a94` 1003, `0xf36dd0` 1004** -> keys **200 / 201 / 202 / 203** |
| `0xf46f34` | **the hit itself**, the class's hit handler: passes the struck shape's `.dtt` part index (bdd record `+8`) to `0xf36984` — part **0** (Horn/Head shapes) -> body slot, **2** (right arm, bone 50) -> arm_r, **3** (left arm, bone 40) -> arm_l, **6** (tail) -> tail. It also adds **180 ticks** to a YELLOW part's countdown | uEm063_00 | R (Render, 2026-09-16) | board note, hit-zone pass `fc72e3f` |
| — | **so u 200..204 are NOT an unread — they are a PARK.** Raven, 2026-09-13: *"Ensure you are not using the 'on hit' effect Brachy has, the slime flashes red then erupts"*, then *"Log the 'on hit effect' we may implement that later."* Being hit is not a state the viewer models and he asked for it to wait, so they stay undriven **by decision**, cited in `motion-states.js` `em063_05` | — | — | **this replaces my own "WHEN they fire is not read", which was wrong** |
| `0xf46d44`, `0xf46e24`, `0xf46f04` | a **SECOND request group**, ids **1001 / 1002 / 1003** (keys 200 / 201 / 202), sitting beside the explosion `0xf46234` | uEm063_00 | **I** | **the board note does not mention these**, and what distinguishes them from the `0xf36xxx` group is NOT READ. Listed so they are not rediscovered as the same sites |
| — | **id 1005 -> key 204 has NO request site anywhere in the class band** (`0xf35038..0xf47ca0`), although `em063_05u` carries the record | — | **U** | the board note says "1001..1005"; the sweep finds four ids in the warning band and three in the second, never 1005 |

### uEm045_00 (Uragaan **and** Crystalbeard Uragaan — one class, vtable `0x17c257c`, code `0xe8f0b8..0xe9d634`)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xe94118` | **THE ROLL, and the one record the class asks for itself.** Entered from the status-6 handler (`0xe94998` / `0xe949a8`); runs only while `[e+0x1428]+0x1a1 == 0` and then raises that byte, so it fires once as the roll begins. In order: `0xbc7f4(e, 4)` = posture 4; `e+0x1404 \|= 0x100000`; **`0xafe84(e, 6, ..)`** = set motion **6**, and 6 is `(list 0 << 8) \| slot 6` — the same encoding as Savage's `0x209` = L2 Motion[9] — so **L0 Motion[6]**; `0xb07b4(e, 3.0)` = motion rate **3x**; and at **`0xe941b0`** `0xa499c(e, 2)` | uEm045_00 | **R** | read instruction by instruction 2026-09-30, confirming `states-em045_00.md` §8.7. `0xafe84` and `0xafef0` (EMC's control, `mov r1,#1` -> L0 M1) both tail into the same `0xafce8(e, motion, flags)`, differing only in the 3rd argument |
| — | so **Uragaan's and Crystalbeard's `u 1400` is NOT the shared one-shot latch the other 25 monsters close on** — `0xa499c(e, 2)` asks id 2, below 1000, so it falls to the base u table `0x159c7fc` index 2 = key **1400** (`cm202_005`, joint 2, scale 0.9, mode 0, **end 1** — HELD in `e+0xb7c4`). **Wired 2026-09-30** as `'0\|Motion[6]': { hold: [<u>, 1400] }` on both variants | — | — | `docs/render/motion-states.js`. It is the rolling trail, and it runs for as long as he rolls |
| `0xe95d54` | class request site 1: **`movw r1, #0x3e9` = id 1001** -> class table `0x169e9c4` index 1 -> **u key 100**, through vtable `+0x1d0`, handle stored at `[sb]`. Gated on `0xb09c8(e) == 1` | uEm045_00 | R | the area byte `e+0x1054` is copied to `e+0xb64c` first, exactly as `0xa499c` does |
| `0xe99080` | class request site 2: the id is a **REGISTER** (`mov r1, r5`), and the two arms above it set **`movw r5, #0x3ed` = 1005 -> u key 140** (after `0x7db70(e, 0, **0x2c**, 0x1002)`) and **`mov r5, #0x3ec` = 1004 -> u key 130** (after `0x7db70(e, 0, **0x2a**, 0x1002)`). It stops the old handle with `0x329c40` first, stores the new one, then sets motion `0x203` = L2 Motion[3]. Guarded by `0xb0974(e) == 1`, **`0x81614(e) == 0` (NOT tired)** and `0x3a8430(..) >= 5` | uEm045_00 | R | inside the class's per-frame handler, which runs a long chain of `0xb0968(e, sel, ..)` frame-window tests with float bounds — the PSL-like "is the clip between frames a and b" shape |
| `0xe95b78(e, sel)` | **the u 100 / 110 / 120 machine — READ 2026-09-30.** A phase machine on `[e+0x1428]+0x1a1` through a **PIC table at `0xe95be0` whose 4 entries are OFFSETS and are NOT in source order** (phase 0 -> `0xe95bf0`, **phase 1 -> `0xe95c98`**, phase 2 -> `0xe95c3c`, phase 3 -> `0xe95d10`). Phase 0 sets **L2 Motion[2]** (`0xafe84(e, 0x202, ..)`, blend 4, rate 1.15) and zeroes `+0x1a2`/`+0x1a3`; **phase 1 fires the record at `0xb0974(e, 193.0)` — FRAME 193 of that motion —** after `0x329c40` on the old handle at `e+0xcb0c`, and is skipped whole while `0x81614` (tired); it advances on `0xb0968(e, 1, 0, 218.0, 0)`. Phase 2 counts four `0xb09c8` then sets L2 Motion[3]; phase 3 hands to vtable `+0x3dc` | uEm045_00 | **R** | **218.0 is exactly the viewer's `Motion[2]_start` length**, which is what pins the motion rather than inferring it. The key: `sel == 0` -> id **1001 = u 100**; `sel == 1` -> id **1002 = u 110**, or **1003 = u 120** when `0x3a8430 > 4` |
| `0xe98ca8(e)` | **the u 130 / 140 machine — READ 2026-09-30.** Six phases, PIC table `0xe98ce0` (again offsets): phase 0 -> `0xe98cf8` sets **L2 Motion[10]** (0x20a); phase 3 -> `0xe98ed4` sets **L2 Motion[21]** (0x215) at its frame 184; **phase 4 -> `0xe98fa8` fires at `0xb0974(e, 38.0)` — FRAME 38 of L2 Motion[21] —** into the **same** handle `e+0xcb0c`, again never while tired; phase 5 finishes. **`0x3a8430 >= 5` -> id 1005 = u 140, else id 1004 = u 130** | uEm045_00 | **R** | its `0x7db70(e, 0, 0x20 / 0x21 / 0x2a / 0x2c, ..)` calls are the **boulders**, which are shells and the shell session's |
| `0x3a8430` | the chooser behind BOTH splits: `[[obj+0xa4]+0xf]` read as a **signed byte**, returning only **5 / 3 / 1 / 0** (anything else -> 0). So "> 4" and ">= 5" both mean **exactly 5**, its top value | shared | R | **what that byte IS: NOT READ.** So the viewer cannot gate on it and does not pretend to — u 100/110/120 go on `'2\|Motion[2]'` and u 130/140 on `'2\|Motion[21]'` as `cycle`s of `hold`s, each play showing the next, the idiom already used where one clip carries several ROM outcomes |
| `0xb0974(e, f)` / `0xb0968(e, m, r2, f0, f1)` | the shared motion-frame predicates, both tail-calls into **`0x72714(e, mode, .., f0, f1)`** — which rebuilds the current frame from `+0x500` (time), `+0x13ac` (**not the loop point** — the r2 = 1 channel's base frame; the loop point is `+0x508`: corrected 2026-10-01, see Withdrawn), `+0x13bc` (length) and `+0x1c` (delta) and then takes a **13-entry** mode table at `0x728d0`. `0xb0974` is mode **0** with `f1 = 0.0`; `0xb0968` passes its own `r1` as the mode | shared | R | the modes themselves are not enumerated; only 0, 1 and 3 appear in this class |
| — | **NOT WIRED and named: `u 100 / 110 / 120 / 130 / 140`** (`em045_00_004` / `_005`, class table `0x169e9c4` = `{-1, 100, 110, 120, 130, 140, 0, ..}`, ids 1001..1005). **SUPERSEDED the same day by the two rows above — the motions and the frames ARE read.** Wired 2026-09-30; what remains is the export, record and lift, and the one genuine unread is the meaning of `0x3a8430`'s byte | — | **U** | this replaces `effects_triage.py`'s "nothing found (class request sites not read)" for those five keys, which was the tool's UNATTRIBUTED bucket and not a statement about the class |

### The viewer's clip duration is NOT the motion's length (Effects lane, 2026-09-30)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `.lmt` block `+0x08` / `+0x0c` | **`numFrames` and `loopFrame`** (LMT v67: `build/frag/motion-audit/lmt.py`). A monster's **PSL block frame count is this `numFrames`**, exactly — 55 of 55 on Barroth, and on **every** "frames differ" row in the tree | — | R | so **the `.lmt` is the identity test for "is the viewer playing this motion"**, and the viewer's clip duration is a lossy derivative of it |
| — | **a glb animation ends at its last KEYFRAME, not at the motion's last frame.** The exporter ships a `loopFrame == 0` clip as `Motion[N]_loop` alone, and 1076 of the 1100 such clips in the tree land on `(numFrames - 1)/60` exactly — but **24 stop short** because their tracks quit keying early. Barroth's L4 `Motion[3]`: `numFrames` 93, `loopFrame` 0, **glb 90 frames**, 95 of its 102 tracks bufferless | — | R | measured across the whole tree, 2026-09-30. The same shape on `em069_00_3` M35 (119 -> 71) and M36 (91 -> 36), `em070_00_3` M39 (61 -> 25), `em076_00_3` M36 (61 -> 24) |
| — | **`add_effects.py`'s `abs(clip - psl) > 1` guard was therefore asking the wrong question** and refused 5 rows tree-wide as "frames differ". The `.lmt` agrees with the PSL on **all 5**, so in every case the viewer WAS playing the right motion. The guard now asks the `.lmt` first (`rom_motion_frames`), and the same test was copied into `clip_block()` — **which had its own copy of it**, so a record plan() exported would otherwise have had no bit to start it | — | — | the 5: **`em044_00` L4 M3** (c 130, done); `em021_00` L3 M12 (c 50); `em084_00` L2 M48 (c 135); `ems042_00` L2 M1 (c 30); and `em056_00` L0 M10 (c 272/273), which stays refused on its own ground — **its viewer clip has 0 frames**, no keyframes at all, so there is nothing to hang a bit on. The other four belong to other sessions' monsters: they need a re-`--apply` by whoever owns them |
| — | and this is safe at runtime because **the schedule walks REAL frames**: `index.html` `driveClipEffects` hands it `act.time * 60 + splitOffset`, so an ON run reaching past the last keyframe plays to the end of the clip and no further. Barroth's c 130 is `on: [[3, 92]]` on a 90-frame clip: identical timing for 87 of its 90 frames, missing only the 3-frame tail the viewer has no animation for | — | R | `docs/render/monster.js` `'L4 Motion[3]'`, `docs/index.html:7184`+ |

### The PIT ailments — a cross-monster refusal (Effects lane)

| addr | what | class | st | detail |
|---|---|---|---|---|
| actions `(10, 0x63..0x66)` | **the in-pit ailments**: sleep (0x63/0x64), paralysis (0x65), stun (0x66), each playing ONE clip and firing the ordinary **c 1102 / c 1101 / c 1103** — so the ROM shows those effects in a second place besides their normal reactions | many | R | found by setting the decode notes against the units, 2026-09-30. Clips per monster: **L3 M18** on em037_00, em037_04, em042_00; **L3 M20** on em077_00, em081_00; and em038_00 (Ukanlos) has **no cases at all** for 0x60..0x66, which is its own refusal |
| — | **NOT WIRED, and the reason is a clip collision rather than an unread.** On every one of those monsters that clip is ALSO the **in-pit death** clip (em037_00's note: "(11,7) in pit: L3 M18 … (11,0x12): L3 M18"), and the viewer's row for it is already `dead: true`. Cycling a `dead: true` arm against a pit-ailment arm would flip the monster between dead and not-dead on successive plays of the one clip — `dead` clears rage, sets the part sets and settles the material clock — which is a worse error than the effect being absent | — | — | **and nothing is left undriven by it**: c 1101 / c 1102 / c 1103 are already driven on their ordinary reaction clips on all five. This costs fidelity in the pit, not coverage. It would need either a `dead`-aware cycle or a pit state the viewer does not model |

### Shared enemy code — state effects (Effects lane)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x6fe88` | **the current-action test**: `enemy[+0x73e0] == group && enemy[+0x73e1] == index`, twelve instructions | — | R | this is what a "gate" on a state record usually is |
| `0x80254` | a 3-instruction wrapper asking `0x6fe88(enemy, 0xa, 0x6e)` — i.e. "is the current action the **shock trap**" | — | R | c 1105's gate; our notes called it unread |
| `0x80260` | **not** a gate: a proximity predicate (distance from `[enemy+0x1428]`'s position, 3-D when `+0x1ba`==2 else XZ), called from a bank of 10 sites at `0x679e0..0x67bd8` | — | R | — |
| `0xa4604..0xa4658` | c 1100's period (90) | — | R | shared-states.js |
| `0xa465c..0xa46e4` | c 1108's period (36) | — | R | " |
| `0xa46e8` | c 1106's block (period 40 / 7200 f) — record **deliberately not driven** (Raven) | — | R | " |
| `0xa409c` | c 1500's gate: the monster **LYING** on water-attributed ground, every 100 f. Raven sees the effect on **stepping**; the stepping splash is a per-monster **PSL** record, not this | — | R | " |
| `0xa4388` | the combat-edge request (`0xbcae0` → 0→2 fires c 1200; 2→0 fires c 1201; 2→1 fires nothing) | — | R | " |
| `0x97ea0` → `0xaab98`, vtable `+0x3b8` = `0xa44a4`, bound `0x9d810`, gate `0xb6fc4` | the blast band c 1130-1137: selector `[[e+0x1428]+0x5db0]` is a **part index 0..7**, once per proc | — | R | " |
| — | **c 1105's period 42: NOT FOUND.** Not in `0xa4400..0xa4800`; every one of the 27 monsters that fires it uses 42, which is consistency, not a read | — | **I** | motion-states.js em007_00 note |

### Life and spawn (Effects lane)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xaea108` | `spawnLife`: per **particle**, from the row's col2 block — `+0x00` fade-in, `+0x04` hold, `+0x08` fade-out (all in frames), `+0x0e` → slot `+0xc` | — | R | spawn.js:571 |
| `0xaeae40` | `updateLife`: phases 1 fade-in, 2 hold, 3 fade-out, 4 dead | — | R | life.js |
| — | a row's `blk2` life is the **particle's**, not the effect's; short rows make a continuous trail by re-emission | — | R | — |

| `attackdata` byte[30] | `0x05` on every em004_00 record, `0x00` on every em005_00 record — a per-monster constant, not per-attack. **Consumer NOT FOUND**: a census of `0x7db70` for accesses at `sp+0x30..0x3f` (where its 32-byte copy lands) and for `+0x1c`/`+0x1e` of a record pointer returns ZERO; the record is copied onward, so the consumer is downstream of the arming routine. Meaning **unread**; one method spent | **I** | em005-shells-spec |

### Charms → talismans — sMakeAmulet (charm agent, 2026-10-08)

| addr | what | st | detail |
|---|---|---|---|
| `0x14b544` | loads `amuletSkillData00..07` → `sMakeAmulet+0x1c..0x38`, `amuletSlotData00..03` → `+0x3c..0x48` (ids `0xda71..0xda7c`) | R | `C:\MHGU-Extract\charm\charm-roll.md` |
| `0x14b790` | **the roll** `(talisman*, sMakeAmulet*, charmItemId, positiveOnly)`: uniform skill rows, 2nd-skill gate 0/65/75/85 %, coin flip on a straddling range, f32 slot score → `amuletSlotData` row, rarity from score + 2·slots. ROM-run vs `charm/model.py`: 28,000 streams, 0 mismatches | R | same |
| `0x38cbc0` | caller, quest Result unit (`cResult`/`uUIResult`): flag 0 | R | same |
| `0x196290`, `0x19649c`, `0x19667c`, `0x196720` | callers, sItem unit, flag 1: **the Melding Pot**. `0x196290` is the shared call of `0x196188`'s 4-way switch (all four kinds); `0x19649c` Halcyon; `0x19667c` / `0x196720` Juju (Enduring / Timeworn). *Supersedes this row's earlier "fixed Enduring/Timeworn, inferred" — see the charm note's withdrawn line* | R | same, "Melding Pot" |
| `0x196188` | sItem: roll meld slot `(sItem*, slot)`; switch on `slot+0x103c` type 0..5 (table `0x1961c0`) | R | same |
| `0x1962f0` / `0x196504` | Halcyon / Juju: charm count + kinds from the slot seed via `0x3f76ec`; tables `rodata 0x161f2bc..0x161f2f0`. ROM-run vs `charm/meld.py`: every seed × points 3..9, 0 mismatches | R | same |
| `0x3f76ec` | Lehmer `x' = 176·x mod 65363`, 176 when the INPUT is 0 — pure, no RNG state | R | same |
| `0x192fcc` / `0x195d70` / `0x195ff8` / `0x196784` | sItem meld slot: reset / append order / per-quest wait tick (called `0x38b0cc`) / hand over finished | R | same |
| `0x6db3c0` (`uUIAlchemy`, DTI ref `0x10be0`) | Melding Pot UI: order at `0x6db780` (seed = u16 xorshift → `+0x24e`, rolled at once via `0x196188`); style status `0x6daa38`; menu rows `0x6dad10`; costs 100/200/500/1000/800/1200 WP | R | same |
| `0x3f7724` → `0x7c9234` | game RNG: xorshift128, u32 out (`[obj+0x20..0x2c]` state) | R | same |
| `0x127fb0` / `0x128410` | skill-row / slot-row getters: `[res+0x6c] + i*8`, count `[res+0x64]` | R | same |
| `rodata 0x15504b8..0x155054c` | reflection names: `cAmuletSkillBase {mSkillType, mMinValue, mMaxValue}`, `cAmuletSlotBase {mProb[0..3]}` — no weight field | R | same |
| `0x39c1a8` | `rRem` (type `0x5b3c302d`) record getter: `[res+0x6c] + i*0xb4`; record `+4 mFlag[8]`, `+0xc mFlagNum[8]`, `+0x14` entries `{u8 rate, u8 count, u16 item}` | R | `charm/charm-roll.md` "Quest rewards" |
| `0x37bbfc` | `(record, key)` → item list of the group whose **mFlag == key** (mFlag is a key, not a count) | R | same |
| `0x382314` | **sub-quest reward roll**; rolls from `sxtb questData+0x56` (mRemAddLotMax): `1+ceil(x/2)`, +1 at 11/16 up to `x+4`; `u16 rand % Σrate` per roll. Called `0x3875f4` behind `0x3a1fcc(quest,2)` (sub objective done). ROM-run vs `charm/questfarm.py`: 0 mismatches | R | same |
| `0x381a68` | bonus boxes mRemTbl_Add1/Add2: per group, switch on key (table `0x381cc8`); keys 25–35 pay when `[10,15,20,25,30,40,50,60,70,80,90][key-25] <= s16 [state+0x9a]` | R | same |
| `0x3b3478` | delivery: sets `state+0x9a` = count of the delivery-target item (`+0xf0`) in the box | R | same |
| `0x3a2a54` / `0x3a2a78` / `0x3a2a9c` | quest-link getters: mRemTbl_Add1 / Add2 / Sub (`link+0x2c/0x30/0x34`) | R | same |
| questData file `0x55/0x56/0x57` | = in-memory `+0x54/0x55/0x56` mRemAddFrame_1 / _2 / mRemAddLotMax | I | same — by survey of all 1,849 quest files, not by reading the loader |

### Spawn size type → scale and appearance (Viewer agent's sizes pass, 2026-09-13; indexed here 2026-10-08 by the General Agent, not re-read)

The reads were recorded only in `docs/part-review.json` (`<id>.sizes.note`) and were missing from this map. St is as that note records it.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x6fb68` | spawn entry (36 bytes, every `rEmSetList` in `loc\arc\quest` and `arc\quest`) byte `+7` = size type → `em+0x5cb6` | shared | R | part-review.json, any `sizes.note` |
| `0xb94d0` | dtbase's multiplier loaded into `mEmScale` `em+0x1ac`, before vt slot `0x1d8` turns the size type into the scale | shared | R | same |
| `0x10cc078` | Kelbi vt `0x1d8`: types 1..3 × table `0x16a3b48` (0.85 / 1.3 / 1.1), type 0 unchanged | uEms003_00 | R | part-review.json `ems003_00` |
| `0x10cf44c` | Kelbi vt `0x210`: **the same size type picks the part group** — type 0 → group 2 (4,5,104), 1 → group 0 (1,2,101), 2 → group 3, 3 → group 1; spawns use only 0 and 1 | uEms003_00 | R | same |
| `0x10f1788` (`0x10f18c8` / `0x10f18e4` / `0x10f1918`) | Bnahabra vt `0x1d8`: types 2/5/8/11 → 1.0, others 0.6; types come in threes and the first of each also sets other parameters (unread) | uEms026_00 | R | part-review.json `ems026_00` |
| `0x110d5b8` (`0x110d684`) | Konchu vt `0x1d8`: type 100 → 2.0; types 1..3 change something other than size (unread); type 0 is replaced by one of 1..3 through a virtual call (unread) | uEms045_00 | R / unread | part-review.json `ems045_00` |

### Withdrawn — kept so they are not rediscovered

| claim | why wrong | correction |
|---|---|---|
| index.html heat-map note "AN ATTACHED BODY HAS NO HIT ZONES YET" and the board (2026-09-13): the tentacles' 16 capsules each are "on the body's Back / Shell / Head rows" | no read: the slot words are 0 / 1 / 2, and the arc has no arm damage table, so which table they index is unread | slots 0 / 1 / 2 = tip / middle / base by joint; ~~the table is NOT READ~~ READ 2026-10-08: they index the ARM's own `ems099_00_dttune` table 0 (63 / 36 / 15 cut), not the body's rows (section "Nakarkos -- the tentacles' hit zones", dev/em084-arm-hitzones.md) |
| row "`enemy\dt_tune\em084_00_dttune`" (section "Nakarkos -- the tentacles' hit zones", **Viewer agent, 2026-10-08**): "the ONLY damage table in the arc ... No arm dt_tune / dt_base file exists", and the NOT READ row's guess "the arm's own load of em084_00_dttune (then tip / middle / base = Back / Shell / Head values, 30 / 15 / 65 cut)" | searched the arc by file NAME (`em084_00_*`); the arm's table ships under ANOTHER em id, so the name search could not find it | the arm loader requests res `0x8390` / `0x8391` = `enemy\dt_base\ems099_00_dtbase` / `enemy\dt_tune\ems099_00_dttune` (`0x107bfb4`, `0x70960` → `arm+0x75e8` / `+0x75ec`); tip / middle / base = **63 / 36 / 15** cut, the reverse order of the guess (dev/em084-arm-hitzones.md §1, §2) |
| Charms row "`0x196290` … callers, sItem unit: flag 1, kind fixed Enduring `0x164` / Timeworn `0x163`" (**charm agent, 2026-10-08**) | read only the instructions just before each `bl`; at `0x196290` those are the LAST arm (Enduring) of a 4-way switch that falls into one shared call | `0x196188` switches on the slot type: arms `0x1961d8 / 0x196204 / 0x196230 / 0x19625c` load `0x161..0x164` and all reach `0x196290`. Only the Juju sites (`0x19667c`, `0x196720`) are fixed. Charms section, `charm/charm-roll.md` |
| monster.js ROM_STAGE_CLIPS em033_00 (comment, before 2026-10-08): "Angry_Start on slot 1 of the THREE materials ctl+0x3c XfB__m02_eye, ctl+0x40 XfB__m06_body_add02, ctl+0x44 XfB__m03_sukima"; the other three "XfB__m05_body_add01 (ctl+0x30), XfB_N__E0__m01_body (ctl+0x34), XfB_N__E0__m00_face (ctl+0x38)"; and the entry had no rest clip | the cache `0xe362a4..0xe36324` stores by MRL id: +0x3c is m04__kekkan (the eye has no Angry_Start, so the machine would stall at `0xe377d4` if it were); m00_face is not cached; with no rest clip the eye kept Angry's orange texture after the first rage | the six are m01_body / m02_eye / m03_sukima / m04__kekkan / m05_body_add01 / m06_body_add02 at +0x30..+0x44; the entry is now `layered` with `rest: 'Normal'` (Akantor section above) |
| dev/em081-shells-spec.md §3b's base15 move pseudo-code (**research agent, 2026-10-07**): "TURN: v = (−(sgn·A), 0, speed) turned Z, X, Y by the shell's words … S.velocity = (v / \|v\|) × speed" | the helper's bit-exact model (scratchpad bolt15/run_move.py `step`, 1,635 steps against the ROM) turns it by `+0x1748..+0x1750` (0, the owner's Y word, 0) and renormalises the OLD velocity (the transcription matches the helper's checkpoints only that way) | the turn as run_move.py has it (Boltreaver section, implementation rows: "base15 move turn") |
| row "`0x427e0` / `0x427e8` (in `0x42744`)" (section "The beams on their own monsters"): "Boltreaver's L9 M22 beam (mode 8, u 101, ShellScale 1.2) reaches it"; "What sets the bit: NOT READ" (**Viewer agent, 2026-10-01**) | u 101's payload has `+0x52` = 0 and `+0x5c` = 0; it never calls `0x42744` | the record is **u 605** (`+0x52` 1, `+0x5c` 0x11). The bit is payload `+0x5c` bit 4 (copy `0x31c3e8`). The beam, u 604 and u 606 stopped only through live.js `fail()` (dev/effect-ground-ray.md §2; the ground-ray section above) |
| board: "0x42744 casts a 2000-unit DOWNWARD probe" | the ray starts at y + 10000 (`0x181a80`); −2000 sets the reach (y + 100) and the default below-height | dev/effect-ground-ray.md §3.2; the ray's lower bound is NOT READ |
| board: the 2026-09-25 recorder fault is "NOT a misbehaviour of 0x18154c (the fault is not even in 0x42744)" | the faulting read is sCollision `+0x3b58` with sCollision = 0, inside the real `0x18154c`'s traversal | dev/effect-ground-ray.md §3.4 |
| "`0xec1cec`: a slot's state 0 draws its cooled group, anything else its heated one" (task board 2026-09-14; monster.js's AGNAKTOR comment over ROM_STAGE_CLIPS) | incomplete: the cooled group also needs `vt+0x3f4` (`0x7fed4`) = 1 -- action group 11 / 14 / (12, 0xff) | in play the heated group is always drawn; heat shows only through the lava clips (dev/em049-heat.md §4a, §7; Agnaktor section above) |
| `dev/beams/em049_00.md` §4: `E+0xcb00 / +0xcb04 / +0xcb08` possibly the armour heat | none of the three heat consumers (`0xec1cec` + `0xec21d4` / `0xec22c8`, `0xec0dbc` + `0xec146c`) reads them | not heat; meaning NOT READ. The heat is `E+0xcac0..+0xcace` (states), `+0xcad0..+0xcaec` (timers), `+0xcb2e` (reheat bits) (dev/em049-heat.md §7) |
| "base00 flag **0x800**: no test in base00's own band; controls bit 3 at `0x3f8e68` / `0x3f9308`" (Render lane, the beam-base rows; status I) | `0x3f9308` (`tst r0,#8`) follows `ldrb r0,[sb,#1]` at `0x3f9304` (sb = shell+0x15e8 from `0x3f8c64`, never rewritten), so it tests flags bit 11, not bit 3 | base00's init tests **0x800** at `0x3f9308` (byte `+0x15ac` = 0, read by the hit registration `0x43a8b0` at `0x43a8f0..0x43a8fc`: meaning NOT READ) and **0x400** at `0x3f933c` (`0x43ab74(shell, 0xbe518(owner))`). Plesioth's child (flags `0x870`) takes the 0x800 arm, so its "no consumer" reading goes too. Research agent for the Viewer agent, 2026-10-06 (dev/em084-phase2-bases.md §4d); the row is marked in place |
| "`0x3f9140`: in all three cases a yaw-rotated offset is then ADDED" (base00 init placement rows, `base00-init-placement §2`) | the turn is not a yaw: it is the base matrix's 3×3 with bit 3 clear (`0x3f8e70..0x3f8ec0`; on the owner arm the owner's `+0xb0` 3×3, on the 0x10 arm the static `[0x1832afc]`), and with bit 3 set a full X-Y-Z turn by the angle words (`0x3f8ed0..0x3f8f8c`, recomputed with the post-offset words at `0x3f903c..0x3f9134` when `(flags & 0x108) == 8`) | §1b.4 of dev/em084-phase2-bases.md; shells.js init00 / bit3Offset00 transcribes the bit-3 arm (Nakarkos phase 2). The bit-3-CLEAR owner arm in shells.js still turns by the yaw alone -- right only when X = Z = 0; no transcribed shell takes it with other words. The row is marked in place |
| "Nakarkos's body beam (L0 M63, mode 14, u 20) reaches" the placement switch's mode-4 arm `0x329e68` (row "`0x329e64` / `0x329e68`") | u 20's payload mode (`+0x36`) is 3, so it cannot take the mode-4 arm | the L0 M63 record on that arm is c 101 (payload `+0x58` 4500, stop `0x31d0b0`; INFERRED from the json scan and the stop). Mode 4 is the camera-attached placement. Research agent for the Viewer agent, 2026-10-05 (dev/effect-placement-mode4.md §6) |
| "arm actions (7,0x0c) / (7,0x0d) / (7,0x0f) appear in EMC group 0 s35 / s36" (dev/beams/em084_00.md, "What orders the arms") | the arms run no command streams: their loader `0x107ba5c` never calls `0x70460` / `0x709a0`, the only writer of the table pointer `+0x75f4`; group 0 is the body's start group (`0x825f8`) | g0 s35 / s36's (7,0xa) / (7,0xc..0xf) are BODY actions (the motion-record table's). Arm (7,0x0c) <- body (7,0x9b) L / (7,0x69) R; (7,0x0d) <- (7,0x9c) / (7,0x6a); (7,0x0f) has no issuer. Research agent for the Viewer agent, 2026-10-05 (dev/em084-arm-pairings.md) |
| `[unit+0x4f4]` is the current motion frame and `[unit+0x508]` the frame at the tick's start; `0x7294c`'s `beq` means "the motion did not advance" (**em007-shells-spec §2a**, rows in the dispatch section) | the arm was read without `0x72714`'s prologue, which REBUILDS the registers: the frame is prev `+0x500` (or `+0x13ac`) + the step, `+0x4f4` is only its gate, `+0x508` only the wrap's target, and `beq` takes the not-wrapped test (`0x72b1c`), not a return 0 | `+0x4f4` = the queries' gate (> 0: modes 1 / 3 / 4 / 5 / 9 / 11 / 12 answer 0); `+0x508` = the loop point (`0x94f38c`, `0x72898`); the arm's result ("crossed s0 this tick, loop-aware") stands. Viewer agent 2026-10-01 |
| `+0x13ac` is the motion's loop point (**row `0xb0974` / `0xb0968`, uEm045 section**) | `0x72830` loads `+0x13ac` as the BASE FRAME when r2 = 1 (else `+0x500`) | the r2 = 1 channel's base frame (step `+0x13b4`); the loop point is `+0x508`. Viewer agent 2026-10-01 |
| the game ships **no collision** for the hunting areas -- 92 collision entries in 10,595 arcs, none for m17 (**this file, row "area ground height"**; the task board) | the census missed `romfs\nativeNX\loc\` | 27 `loc\arc\stage\map_com\mNN.arc` hold 962 rCollision files over 192 areas, Forlorn Arena's included (section "Walls and ceilings"). Research agent for the Viewer agent, 2026-10-05 |
| `P+0x944` (and `P+0x92c` / `+0x938` / `+0x947`) is quest config filled by `0x757a64` | that function's object is `uUIOtomoBoard` (vtable `0x1776f74`, getDTI `0x75ada8` -> DTI `0x18460b0`) | `P+0x944` is written at `0x181854` (`strb [sb,#4]`, sb = `P+0x940`): 1 when a surface lies above the probe's pick. The other three fields' writers: NOT READ. Same agent, 2026-10-05 |
| `P+0x5b8` = `e+0x1078` is "the surface attribute word" | read at its writer `0x181818..0x181830` | the height of the next surface below the chosen one. Same agent, 2026-10-05 |
| posture-em003_00.md 11.2: statuses 4/5/6/0xe/0xf go to `0xca05c` with "em003_00FwMove", the likely home of the unsettled clips | read: the string there is "emUniqueActMain" (0xd1f6fc); FwMove is status 0's default (0xd10768); `0xca05c` discards r1 and plays nothing | the clips come from the shared turn player's data tables (section "Khezu -- the turn clips' postures"). 2026-10-05 |
| posture-em003_00.md 3.1: L5 M2 "enters at the previous posture" | posture 0 is set on the same update (`0xd12904`) | it is the floor crouch before the leap. 2026-10-05 |
| `uShellEm004_sp_00` is **base13** (from `dti.json` `parentDti`) | the DTI parent is not the runtime shape | **base00**, 91/95 vtable slots vs a stated base00 class |
| shell00 has **32 overrides**, 256/288 identical | compared 288 slots; the table is **95** (next vtable `0x1799064`) | **4 overrides**: `+0x004`, `+0x014`, `+0x14c`, `+0x150` |
| `+0x428` / `+0x454` hold code treating the flags word as a float vec3 | past the end of shell00's table — they are **shell02's** `+0x13c` / `+0x168` | void for shell00 |
| `0xb095a8` is the vec3 pointer | it is the **PIC offset literal** at `0xd28550`; it reads as a `bl` | the slot is `0x1831a78` |
| `+0x15ec` / `+0x15f0` have **no consumer** | scanned vtable methods, not their **transitive calls** | read by `0x3f9378` / `0x3f9cc4` |
| bit `0x01` is tested nowhere on the path | same cause | tested at `0x3f93ac` |
| shell02 mode 1 has **no spawn site** | three sites write literals; the fourth writes from a **register** left unresolved | `0xd28d6c`, `sb = 1`, em test |
| `uEm007_00` has a **per-variant** id→key table (one for em007_00, one for em007_04) | built on `efx/class-requests.json`'s recorded vtable for that class being **4 bytes low** — `0x17994c8` where it is `0x17994cc`. Every slot shifted by one, so the c table and the u table both read as `+0x1d0`, which looked like two tables on one slot | there is **one** table per slot: c at `0x169bc9c` and u at `0x169bca8`, **overlapping by 3 words**. A field in a json a tool wrote is not a read of the ROM — the same shape as the DTI-parent row above (EMC is folding both into one trap) |
| the base13 near/far, flags and `params13` map apply to Basarios | wrong base class | all withdrawn with the base13 attribution |
| base01 flag `0x800` is set by em004_00 shell01 mode 0 | computed with **Rathian's** `params011`, whose `ints[7]` is past the end of his 3-int file and "past the end reads 0" ≠ −1 | his own reader never builds `0x800`; flags are `0x0C` (mode 0) and `0x80` (mode 1) |
| `params13` applies to any base13 shell | it is **Khezu's `sp_13`** reader; Gravios's `0xd3144c` builds a different bit from a different index | base13's *structure* applies; its *reader map* does not — read each `sp_NN` |
| `uShellEm004_sp_01` is 240/288 vs base01 | 288-slot comparison, same bug as `sp_00` | **89/92**, 3 overrides |
| `em003_00`'s published `base00` / `base01` look wrong | flagged from the DTI parent | **they are correct**; flag retracted |
| MASK1 is payload `+0x48` (**Effects**) | found by searching every offset pair for one yielding plausible row sets — a **fit**, reported as a read | the answer **is** `+0x48`, but established via `0x31c4ac` and the block-at-payload+0x10 mapping. The fit was not evidence |
| the row gate is `(w00 & MASK1) && (w04 & MASK2)` (**Effects**) | incomplete — described for months without its first test | there is a **prior exclusion** arm at `0x9bb904`; the full rule is `NOT((effect+0x116 \| global+0x228) & row[+4]) AND` the two mask tests |
| `+0x110..+0x118` is a packed property group, `+0x116` its half-word (**Effects**) | inferred from accessors | the loader shows `+0x114`/`+0x115`/`+0x116` as three consecutive **per-entry bytes** of a repeating structure |
| `f104` (model gen block `+0x104`) is the emission count (**Effects**) | a real field name with plausible values and **no consumer found anywhere** | UNREAD. Naming a field from the shape of its values is not a read |
| 4 effect models ship untextured (**Effects**) | checked the folder for `<stem>_*.dds`; their textures are named after a **different** stem | all textured — cm150_003 → cm150_004/005 etc.; cm102_003 and cm151_001 share cm102_001 |
| 93 records are bound to a clip the viewer lacks (**Effects**) | the test accepted `Motion[N]` and `_start` but **not `_loop`**; "verified" on a print sliced to 8 entries with the answer past the cut | **0** genuine. Index clips by base name |
| 10 of Rathian's 13 shell records are undriven (**Effects**) | a static enumeration over action modes, which cannot see the second generation | **1** (u 36, ef param 3). Render watched 7 of the 10 fire |
| ~150-250 of the 426 undriven records are recoverable by completing break rows (**Effects**) | extrapolated from **two** instances | **0** left: of 85 null slots, 81 have no such record in the pel and 4 fire from another row |
| the placement `+0xf0` fix is verified numerically (**Effects**) | the 3 records used all have offset **(0,0,0)** — invariant under any rotation | correct-and-**untested**; a non-zero-offset record reaching `0x31f6b4` would certify it |
| Basarios has **no common FUP** anywhere in his arc -- his shells' cmn getters take their null paths (joint -1, float 0, zero vec) (**EMC, em004-shell00-spec §2; carried into shells.js params04r / params02b and every base02 read**) | listed with `shellef.load()`, whose dict keyed by path drops the FUP that shares the `.shl`'s path | the FUPs exist: shell00 ints [3]; shell02 ints [3], floats [7200, -50], vecs [[0, -30, 80]] (trap list above) -- joint 3, a 7200 ray |
| a PSL block's `+0` mask is the set of bits that fire (**every tool: gen_clip_effects, add_effects, effects_triage**) | read from the file; the consumer was never read | the walker tests a COPY whose mask the enemy overwrote with `+0x13f4` (`0x31cc88` → `0x40780` → `0xca52c`); see "THE PSL ENABLE MASK" |
| enemy `+0x13f4` is an attack hit-group mask with no visual (**enemy-actions-emc.md §2; motion-states.js em021_00 "HIS GAS TYPE CHANGES NO VISUAL"**) | named from where it was first seen | it is the **PSL enable mask** — em021_00's gas type DOES change which effects fire, through it |
| the 616 SEQUENCE records "no PSL slot names" cannot be fired by the ROM (**board, 2026-09-27**) | only the file-mask bits were read | a slot NAMES records on bits outside its file mask, and the enemy's `+0x13f4` enables them — e.g. Basarios u 260/290/320/350, Rathian u 201/202/221. The 616 need re-sorting by the full block |
| Basarios L2 Motion[3]: "FOUR PSL bits, all DRIVEN ... the clip DOES show gas over f33-140" (**Effects, this file**) | all four fire in the viewer; the game enables ONE pair per action | one charge + one gas cloud per gas action (section above); the viewer shows four charges at once and no cloud |
| `0xd28bb4`'s only setMotion is L2 Motion[27] (`movw r1,#0x21b`), so the beam shows on M27 alone (**Viewer agent, shells.js SHELL_DATA em004_00, earlier 2026-09-30**) | a scan for `movw r1,#<id>` finds the MAIN motion of a blend and misses its partner, which `0xb03f8` takes in **r2** (`movw r2,#0x21d` at `0xd29198`, `mov r2,#0x21c` at `0xd29130`) | the clip is M27 blended with M28 (target above) or M29 (below) by the class; both carry the beam (the uEm004_00 rows above) |
| the spawner's request `+0x10` vec3 is the spawn position (**Effects/EMC**) | measured (0,0,0) by two routes with controls — but base00's init may read a **derived setup**, not the spawner's request | the value is right **for that field**; whether it is the field the init reads is EMC's `request → manager → setup` trace. (0,0,0) at the world origin is implausible on its face |
| base00's ctor is `0x3fa2f8` and writes `+0x15e8 = 0xFFFFFFFF` at `0x3fa348` (**base00 table, spec §3**) | `0x3fa2f8` is **base01's** ctor; base01 starts all-ones and base00 does not | base00's ctor is `0x3f8a04` and writes **0** (`mov r5,#0` / `str r5,[r4,#0x15e8]`); EMC's correction, carried in shells.js `params04r` since 2026-09-30 |
| rows "`0x1832afc` → `0x19177b0`" (Shell infrastructure): "the engine's shared EMPTY 4×4 ... NO site writes it" | the static initializer `0x7c4408` writes it at `0x7c4810..0x7c4850` (r5 = 1.0 on the diagonal, r4 = 0); a census keyed on the GOT slot's direct stores near the load missed an initializer that loads every slot of the block in one run | **`0x19177b0` is the IDENTITY 4×4**; the same initializer writes the unit vectors `0x19176e0` / `0x19176f0` / `0x1917700` (dev/em081-shells-spec.md §4a; research agent, 2026-10-07) |
| row "`0x175c3e8` w1": "the setup DTI IS the base class" | holds for base00/01/02/13/50, but a DERIVED base takes its parent's setup: uShellEm081_sp_14 (setup base00, runs base14), sp_15 (setup base03, runs base15), 04_11 / em001 / em084 sp_11 (setup base01, run base11) | the base is the matching VTABLE; the setup DTI names the request shape only (dev/em081-shells-spec.md §1) |
| census (dev/em081_04-effects-census.md §1 / §5): shell14 "(base00)", shell15 "(base03)"; "Mode 19 (u 26): no spawn site"; "Modes 0, 12, 13 (u 60): no spawn site"; "7:0xd4 → 1 or 9 (condition not read)"; "0xf4 / 0xf2 → 22", "0xe3 / 0xea → 23"; u 10 on 7:0x49 / 0x41 / 0x43 and 0x8d / 0x8f; u 11 "L2 M49 f32"; "shell50 mode 6 → 7, 7 → 8" | setup DTIs taken for bases; a last-gate script per site, not the action number's own path | base14 / base15; shell00 19 by (7,0xdc); shell50 0 by (7,0xcb), 12 / 13 by (7,0xee); (7,0xd4) → 1, (7,0xd5) → 9; the L9 group by action number; u 10 by (7,0x3a..0x49) at wings tier 2/4 and (7,0x8e / 0x90), L2 M27 / M28 f72; u 11 L2 M42 f32; shell50 6 → 8, 7 → 7 (dev/em081-shells-spec.md §0, §7) |
| "A RECORDING IS ONLY AS GOOD AS ITS ORDER OF CALLS": the recorder stopped a shell's request at the frame's start, the viewer between the unit passes, so a fresh recording of Plesioth's beam u 30 could not cover `0x327e7c`'s `0x327f1c` arm (**Viewer agent, this file's trap list and `vecdrawsched.py`, earlier 2026-09-30**) | a hypothesis written up as the cause without a control: moving the stop between the passes and re-recording all 44 Beam Test shells left the refusal in place. Traced call by call, the recorder REACHES `0x327f1c` with the viewer's exact unit (`+0xc` 0x14cb2, `+0x118` nibble 3, `+0x29b` 2) under either order | the stop chain was never RECORDED: a comment's `0x327eac` sat on the recorder's FNS and its frame buried the stop's (trap 40). The between-passes order stays -- it is the viewer's -- but it fixed nothing |
| row "group-7 -> clip" (uEm007_00 section) and em007-shells-spec §2d: "`0xc8` -> **L9 M26** (mode 7)" (**EMC, 2026-09-30**) | the probe reports phase 0's clip; `0xd44bf0` is a five-phase machine (table `0xd44c3c`) and the mode-7 gate `0xd44e20` / submit `0xd44ee0` are in phase 4 | phase 4's motion is **L9 M30** (set at `0xd44dec`): mode 7 / u 300 spawns at **L9 M30 f10** (tune 124). Research agent, 2026-10-08, dev/em007_04-list9-census.md §8 |
| rows "`0xd3da74` `u 1034` requested: `0x7db70(enemy, 0, 0x40a, r6)`" and "`0xd421b4` `u 1016` requested (`0x3f8`)" (Part data section; em007_04-parts-read §4) | `0x7db70` arms a HIT record (row 48; `0x70f40` ids >= 1000 index `[unit+0x75d8]`); `0xd421b4`'s tail `b 0x7ded8` is `0x7db70` with r3 = 0 | 0x408 / 0x40a / 0x40c / 0x3f8 are hit ids, not effect ids; u 1016 / 1021 / 1034 are break records (`0xa442c` 999 + 5*part + level), so the parts-read "tension" dissolves. Census §8 |
| row "`0x72` Bloodbath only (`0xd41bb0` gate) ... modes from `[sl+4/0xc/0x14]` UNREAD" (uEm007_00 section) | `0xd41bb0`'s variant test picks the motion RATE (`[[e+0xcac0]+0x74]` or 1.0 into `0xb07b4` at `0xd41ff0`) | the shell07 spawns have no variant test; modes READ: tables `0x169bc60` / `0x169bc78` (+6 per arm). Census §5 |

### Render lane — the shell02 base, the recompose chain, and what is transcribed

Detail: dev/em004-shell02-spec.md, dev/em004-shell00-spec.md, and the comments in docs/render/shells.js.

| addr | what | st | detail |
|---|---|---|---|
| `0x174e660` | **the base class's own vtable** for shell02's base — the one table of the 19 with no reader at `+0x14c` | R | shell02-spec §1 |
| 19 vtables | share this base (found by the base step word `0x3fd2d8` at `+0x158`, all with landing `0x3fc610`): a runtime here serves Gravios and sixteen more | R | shell02-spec §1 |
| `0x3fb048` | base fn calling slots `+0x158`, `+0x160`, `+0x164` | R | shell02-spec §4a |
| `0x3fb9bc` | base fn that RUNS THE READER (`+0x14c`) and `+0x140`; shell02's `+0x13c` calls it first and requires 1 | R | shell02-spec §4a |
| `0x3fbaf8` / `0x3fbe60` | base fns calling `+0x168`, `+0x16c`, `+0x170` | R | shell02-spec §4a |
| `0x3fc750` | base fn calling `+0x15c` and `+0x160`; shell02's `+0x13c` calls it in its body | R | shell02-spec §4a |
| `0x3fc698` / `0x3fd2d8` | slots `+0x148` / `+0x158` themselves; call `+0x164` / `+0x130` | R | shell02-spec §4a |
| `0x3fd9d8` | base fn calling `+0x148` | R | shell02-spec §4a |
| `0x3fbdc8` | shell02 vtable `+0x24`, **the per-frame entry, READ**: drops the handles at `+0x1600`/`+0x1604`, then state `0xfe` → `[+0x150]`, state `1` → the move `0x3fbe60` | R | shell02-spec §4a |
| `0x3fbe60` | the state-1 move: `[+0x168]`, `0x3fc070`→`[+0x158]`, `0x3fc1c8`, `0x3fc378`, `[+0x16c]`, `[+0x170]` | R | shell02-spec §4a |
| `0x3fc610` | **`+0x150` is this base's ENDING, not its landing** — an effects countdown on `+0x15cc` minus `[r0+0x1c]`, then the handle at `+0x1600` | R | shell02-spec §4c |
| `0x169bbb0` | shell02's mode table, 12 **behaviour codes** (modes 1,2,5,6→1; 3,7,8,9→2; 10,11→3; 4,12→4); the code-1 set is exactly `+0x13c`'s mask `0x33` | R | shell02-spec §4c |
| `+0x13c` | **runs ONCE, not per frame** — the move chain never reaches it and the dispatcher scan finds twelve slots called, not it | R | shell02-spec §4a |
| `0x3fc814` | reads `+0x1680` (the `_sh` vec), inside `0x3fc750` — closing a hole an earlier scan of mine reported as "no consumer" | R | shell02-spec §4c |
| `0x3fd2d8` | base02's step (`+0x158`) — **writes the position** `+0x40/44/48` at `0x3fd310`/`31c`/`328` and calls the effect placement `0x329c9c` / `0x329d04`. On this base the STEP is the mover, not the init | R | shell02-spec §4d |
| `0xd30b84` / `0xd30e30` | **no direct callers anywhere in `.text`** — reached only through their slots; `+0x15c` from `0x3fc750`, which `+0x13c` calls. Who invokes `+0x13c` is UNREAD (outside the base band) | R | shell02-spec §4d |
| `+0x1674` | **base02's FLAGS WORD** — tested `ands r0,r0,#4` at `0x3fd300`; with `r3 != 2` the step copies the position from `+0x15f0..+0x15f8` into `+0x40/44/48` | R | shell02-spec §4e |
| `0x48b9dc` | the unit manager's call through slot `+0x13c` — so base02's `+0x13c` runs at CREATION. Eleven such sites image-wide | R | shell02-spec §4f |
| `0x3fc070` | base02's position link — a STAGE QUERY (`0x43ac6c` setup, `0x43ac8c` run, which `shells.js` `stageQuery` already models); on a hit stores the point into `+0x15f0..f8`, the code into `+0x1640`, then calls `[+0x158]` | R | shell02-spec HANDOVER |
| `0x1832130` → `0x19176f0` | the vec3 `0x3fc070`'s query uses; `.bss`, 0x40 after the shared empty vec3. **Contents UNREAD** — armdis does not map `.bss`; needs the emulator route | — | shell02-spec HANDOVER |
| `0x3fc378` | the only reader of `+0x15e0..+0x15e8` (the init's vec3) and the caller of the effect placement `0x329c9c` / `0x329d04`; tests `+0x1674` bit 2 at `0x3fc540` | R | shell02-spec §4g |
| `0x3fd01c` | `[+0x16c]`, the only link naming `+0x164c` / `+0x1650`; calls `0x4eeed0` / `0x4ef25c` / `0x807984`. **Not established as audio** — one read of `0x4eeed0` did not settle it | I | shell02-spec §4h — **SETTLED (Viewer agent, 2026-09-30): audio.** Under the emulator (`efx/agents/basarios-scratch/shell02/b02run.py`) `0x4eeed0` is called with the `_snd001` id **201**; the harness stubs the sound calls and nothing drawn depends on them |

**THE BEAM BASE, EVERY CLASS (Viewer agent, 2026-09-30).** 21 monster shell classes run on base02 (vtables with `+0x158 = 0x3fd2d8` or `+0x150 = 0x3fc610`; `efx/agents/shells-scratch/shellclasses.json`): uShellEm005_sp_02 (Basarios/Gravios), Em010_sp_02, Em013_00/01/02_02, Em019_sp_02, Em020_04_02, Em020_sp_02, Em023_sp_02, Em024_sp_02, Em033_sp_02, Em038_sp_02, Em049_sp_02, Em050_sp_02, Em056_sp_02, Em058_sp_02, Em067_sp_02, Em081_04_02, Em082_sp_02, Em083_04_02, Em084_sp_02. Their data and the viewer's showcase: `docs/render/beam-types.js` (generator `efx/agents/basarios-scratch/shell02/gen_beam_types.py`, whose header holds the reader maps), `docs/render/shells.js` base02g.

| addr | what | st | detail |
|---|---|---|---|
| `0x174e660` +0x13c..+0x170 | the base's OWN slots: init `0x3fb9bc`, +0x154 / +0x15c / +0x164 = `bx lr` (`0x3fd538` / `0x3fd53c` / `0x3fd540`), +0x160 `0x3fd288`, **+0x168 = `0x3fc750`** (the ray builder, re-run every frame by the move), +0x16c `0x3fd01c`, +0x170 `0x3fd4c4`, +0x148 `0x3fc698`, +0x150 `0x3fc610`. Basarios's class overrides init / +0x15c / +0x168 (so HIS beam aims once and is not rebuilt); 11 classes override only the reader | R | beam-types generator |
| `0x3fb9bc` | base init: the reader, +0x15d4 = the owner's motion, **+0x15cc (life) = +0x1660**, **+0x15d0 = +0x1664** (the growth), state 1, the hit (+0x140 with +0x1654) | R | shells.js base02g |
| `0x3fc750` | the ray: origin +0x15e0 = the joint (+0x1658; -1 → the owner's +0x40) + sh vec 0 (+0x1678) in the joint's space; the angle words from +0x1680 (deg × 182.04); the direction matrix = the JOINT's (sp+0x20) unless flag bit 0 (the owner's vt+0x54 matrix, 0x3fcac0); flag bit 1 turns the origin frame by the X word (0x232118); +0x15c(shell, &matrix) may replace it (base: nothing); +0x40 = origin + (angles' forward × +0x160) × matrix; +0x1000 = origin + (+0x167c turned by the angles) × the joint matrix; flag bit 3 with (+0x1660 − +0x15cc) ≥ +0x1668 takes the direction from `0x3fcd3c` | R | shells.js base02g |
| `0x3fc750` **in full (Viewer agent, 2026-09-30)** | saves the old end / anchor (`+0x1620..` = `+0x40..`, `+0x1630..` = `+0x1000..`); no owner → returns. Angle words from the DEGREE vec `[+0x1680]`: X = s32(0.5 + v.x × 182.044), Y = s32(0.5 + v.y × 182.044) (v.z unused). Joint `+0x1658` ≠ −1: origin `+0x15e0` = the joint's position (`0xc164c`), Mo = Md = the joint's matrix (`0xc15a4`, twice); −1: origin = the owner's `+0x40`, Mo = Md = the owner's `vt+0x54(−1)` matrix. Flag **bit 1** turns Mo by the X word (`0x232118`). origin += `[+0x1678]` × Mo's rows (row vectors). Flag **bit 0** with a joint: Md = the owner's matrix. Then `+0x15c(shell, &Md)`, L = `+0x160`. **Normal arm**: ax / ay = X / Y words × 9.58738e-05; fwd = (L·cos ax·sin ay, −L·sin ax, L·cos ax·cos ay); the anchor vec `[+0x167c]` = (x, y, z) turned about X (y' = y cos ax − z sin ax, z' = y sin ax + z cos ax) then Y (x'' = x cos ay + z' sin ay, z'' = z' cos ay − x sin ay); **end `+0x40` = origin + fwd × Md's rows, anchor `+0x1000` = origin + that × Mo's rows** | R | `0x3fc750..0x3fce58`, stores `0x3fce58..0x3fceac`; sinf `0x13ecc20`, cosf `0x13ecc2c` (emu.PLT) |
| beam classes' OVERRIDES against base02 (`0x174e660`), every slot the ray / step / end use (Viewer agent, 2026-09-30) | Em005: init / `+0x15c` / `+0x168` (Basarios's own path). Em010: `+0x154`, step, **`+0x15c` 0xd6cd38**, `+0x164`. Em013_00 / 01 / 02: **`+0x15c` 0xd8bdfc / 0xd8cb4c / 0xd8d7b8 (one code)**, `+0x160`. Em019: `+0x170` 0xdcdd18. Em033: `+0x168` 0xe3e73c. Em038: `+0x154`, step. Em050: step. Em056: `+0x170` 0xeeb410. Em067: init, `+0x15c` 0xf787bc (`bx lr`). Em084: `+0x16c` 0x1089808. Em020 / 020_04 / 023 / 024 / 049 / 058 / 081_04 / 082: none (the reader only) | R | vtable words read against the base's, all 0x18..0x170 slots |
| Em010 `+0x15c` 0xd6cd38 | Plesioth's direction hook: modes **2, 4, 13, 17, 19, 28 keep Md**; any other rebuilds it as a unit rotation (translation 0): yaw = atan2f(Md[8], Md[10]), pitch = the **spawn setup's X word** (`[+0x136c]+0x20`, ldrh) → rows (cy, ca·0, (sa·0)·cy − sy [vnmls]), (sa·sy − cy·0, ca, sa·cy + sy·0), (sy·ca, −sa, ca·cy) | R | `0xd6cd38..0xd6ce80`; shells.js `DIR_HOOK02`, bit-exact against the ROM (raycheck) |
| Em013 `+0x15c` 0xd8bdfc (= 0xd8cb4c = 0xd8d7b8) | the Fatalis line's direction hook: Md's Euler (`0x7c3a38`), x += the spawn setup's X word × 9.58738e-05, back to a unit rotation from (x, y, z) | R | `0xd8bdfc..0xd8bf18`; shells.js `dirHook013`, bit-exact |
| Em019 `+0x170` 0xdcdd18 / Em056 `+0x170` 0xeeb410 | the end-on-another-motion check, first ADOPTING some motions as the spawn's (`+0x15d4` = the owner's motion, `0xb0944`): Daimyo **0x236 / 0x237 / 0x239**; Nibelsnarf **0x210 + {0, 1, 2, 3, 9, 10, 19}** (mask 0x8060f) — then the base's `0x3fd4c4` | R | shells.js `MOTION_ADOPT02` |
| Em084 `+0x16c` 0x1089808 | Nakarkos, modes in mask 0x6000306 (1, 2, 8, 9, 25, 26): the same callees as the base's audio link `0x3fd01c` (`0x275dc0`, `0x807984`, `0x4ef25c`, `0x4eeed0`) with a sqrtf between | I | audio by its callees (the base's link is SETTLED audio); its own arithmetic not read |
| `0xc156c` (an enemy's `vt+0x54`, uEm004 / uEm010 / uEm049 alike) | `(enemy, idx)`: idx < 0 → **the enemy's own world matrix `+0xb0`**; else the joint the index byte `[[e+0x498] + idx]` names (`[e+0x494]` + index × 0xa0 + 0x10), and an unmapped joint (0xff) → `+0xb0` too (where `0xc15a4` falls back to gid 0) | R | so base02's "owner matrix" (joint −1, flag bit 0) is the unit's +0xb0, which the effect host composes for the monster's parent (host.js composeParent) |
| `0x232118(M, word)` | flag bit 1's turn: a = uxth(word) × 9.58738e-05; row0 unchanged (computed as row0 + 0·row1 + 0·row2), **row1' = cos·row1 + sin·row2, row2' = −sin·row1 + cos·row2**; the translation untouched | R | `0x232118..0x232200`; literals `0x232204` / `0x232208` |
| `0x3fcd3c` — flag bit 3's arm | taken when `+0x1660 − +0x15cc ≥ +0x1668`: X' = owner block `+0x50` + `0x3fcec8(shell)` (u32 add, f32 round trip, uxth), Y' = the block's `+0x54`; the same fwd and anchor turns as the normal arm with ax' / ay', **in WORLD space: no matrix at all** | R | `0x3fcd3c..0x3fce54` |
| `0x3fcec8` **in full** | A = the owner block `+0x40..` + `[+0x1684]`, B = its target `+0x1d0..` + `[+0x1688]`; p = s32(0.5 + atan2f(−(B.y − A.y), √(dx² + dz²)) × 10430.378); lo / hi = s32(0.5 + `+0x166c` / `+0x1670` × 182.044); d = p − X (the block's `+0x50`); **in [lo, hi] (16-bit: uxth(d − lo) ≤ uxth(hi − lo)) → d; else the nearer bound** (hi when uxth(d − lo) < 0x8000 \| (span >> 1), else lo); no owner → 0; uxth | R | `0x3fcec8..0x3fd010`; literals `0x3fd014` 182.044, `0x3fd018` 10430.378 |
| `0x3fcec8` | flag bit 3's pitch: from the owner block's +0x40 (+ vec +0x1684) to its target +0x1d0 (+ vec +0x1688), clamped to [+0x166c, +0x1670] degrees about the owner's +0x50 word; `0x3fcd3c` pairs it with the owner's yaw +0x54 — **the beam tracks the target's pitch** | R | not transcribed: the showcase aims at the target anyway |
| `0x3fbe60` | the move: +0x168, `0x3fc070` (stage query), `0x3fc1c8` (hit), `0x3fc378` (placement), +0x16c, the angle words +0xfe8.., **+0x15d0 −= dt** (clamped at 0), life +0x15cc −= owner[+0x50c] × dt, end at 0 / +0x170, else +0x154 | R | shells.js step02g |
| `0x3fbec0..0x3fbf88` | **the move's angle words** (after the query, the step and the placement): d = `+0x40` − `+0x15e0`; `+0xfe8` = u16(0.5 + atan2(−dy, √(dx² + dz²)) × RAD_TO_U16), `+0xfec` = u16(0.5 + atan2(dx, dz) × …), `+0xff0` = u16(0.5 + atan2(−dx, dy) × …) — shells.js `angles02` exactly; `+0x154` runs after them, so a child made there (Plesioth's) gets THIS frame's words | R | Viewer agent 2026-09-30. Plesioth's child turns its effect by these words × `0xd6c76c` = 0.0054931640625 (360 / 65536: degrees) |
| `0x3fc070` | the stage query (struct 0x43ac6c, run 0x43ac8c); hit: +0x15f0.. = the point, +0x1640 = the type, then **+0x158(shell, point, query, type)**; no hit: +0x15f0.. = +0x40 and the +0x1604 handle is killed (vt+0x40) | R | endpoints for this base INFERRED (A +0x40, B +0x1000) |
| `0x3fd2d8` | the step: type ≠ 2 with **flag bit 2** → +0x40 = the hit (the ray cut); ef param 1 (+0x1648): if +0x1604 → re-placed at the hit, (x, 0, z) × 57.2958 from +0x1610..; else started at the hit (0x4a10c8 / 0x4a11e4) with the RAW +0x1610.. as its rotation override → +0x1604 | R | shells.js step02g |
| `0x43b08c` | the impact's angles: fwd = (sin a, 0, cos a) (a = the yaw word from the old ray end +0x1620 to the new +0x40; type 1) or (0, 1, 0) (type 0), up = the hit normal (query +0x20), frame 0x232530 → Euler 0x7c3a38 (radians) | R | shells.js impactAngles02 |
| `0x3fc378` | the placement: ef 0 at the origin, pitch / yaw toward +0x40, roll = the owner block's +0x58 word; with **flag bit 2** every unit [h+0x150+4i] scaled (1, 1, length / 100.0) at +0x60..+0x6c | R | host.js scaleRequestUnits |
| `0x329c9c` / `0x329d04` | the placement by index: **any index > 0 returns at once**; index 0 writes BOTH unit slots +0x150 / +0x154 | R | host.js placeRequest needs index 0 only |
| `0x4a11e4` | a shell effect's list = the shell's array **+0x1388 + 4 × listId** (filled from the .shl's EffectLists, 0x4a192c); a null slot starts nothing. Gravios's shell02 .shl has its one list in **slot 1** (so do his ef records), everyone else slot 0 | R | beam-types generator |
| Em013 +0x160 `0xd8bf20` | a Fatalis's length: 500.0 while life > +0x1690 (sh float 3), a ramp to the full +0x165c, the full length once life < +0x168c (sh float 2) | R | shells.js length02g |
| Em033 +0x168 `0xe3e73c` | Akantor: the base's rebuild, then +0x44 = +0x1004 (the ray's end at the anchor's height) except modes 5 / 6 | R | shells.js ray02g |
| Em050 +0x158 `0xecfdb8` | Alatreon: the base step only when the hit is within +0x168c (sh float 4) of +0x40 | R | shells.js step02g |
| Em019 / Em056 +0x170 | Daimyo / Nibelsnarf: a motion in their own lists (0x236..0x239 / 0x210 + bits 0x8060f) is taken as the spawn's (the beam lives on through it), then the base's check | R | not needed by the showcase |
| Em067 init `0xf78788` | Zamtrios: the base init alone (its +0x15c `0xf787bc` is another `bx lr`) | R | — |
| Em010 +0x154 `0xd6c970` / step `0xd6cce8` | Plesioth: the base step, then +0x1694 / +0x16a0.. the hit; +0x154 makes a **child shell id 0x7c (uShellEm010_sp_00) mode 0** at the hit (the beam's angle words), moves it there each frame, ends it on hit code 3; +0x164 ends it with the beam | R | NOT transcribed (named in beam-types) — **TRANSCRIBED 2026-09-30 (Viewer agent): shells.js `move154g` / `follow010` / `makeChild02g`, data beam-types.js `child`** |
| Em010 detail (Viewer agent, 2026-09-30) | **reader `0xd6caf0`**: the base02 fields, and **+0x168c = 1 iff sh int 2 ≠ −1** — the child is per MODE: of the beam modes 0 / 2 / 15 / 17 (sh ints [104, 0, −1] / [104, −1, −1] / [104, 0, 0] / [104, −1, 0]) **only 15 and 17 make it**. **Step `0xd6cce8`**: `0x3fd2d8`, then +0x1694 = 1, +0x16a0..+0x16a8 = the point, +0x16ac = 0. **+0x154 `0xd6c970`**, each move: with +0x168c and +0x1694 set — a live child → `0xd6c680(child, +0x16a0)` and `0xd6c6cc(child, +0xfe8)`; none → create it (setup: id 0x7c, mode 0, owner `0x4a0f00`, `+0x2e` = [+0x13dc], `+0x10` = the point, `+0x20` = the beam's angle words +0xfe8..+0xff0) → +0x1690; then +0x1694 = 0; a child whose state is not 1/2 is dropped; **hit type (+0x1640) 3 → the child's `vt+0x148(child, 0)`** | R | `0xd6c970..0xd6cae4`, `0xd6cce8..0xd6cd34` |
| uShellEm010_sp_00 (child 0x7c, vtable `0x179f448`) | **init `0xd6c518`**: base00's `0x3f8b80`, then **+0x1024 = 0.01** (0x3c23d70a). **Reader `0xd6c55c`**: ef 0 → +0x15c8, hit 0 → +0x15d8; flags +0x15e8: **0x800** iff sh int 0 ≠ −1, **0x10** iff int 1 ≠ −1 (and byte **+0x1660** = the same), **0x20** iff int 2 ≠ −1 (byte **+0x1661** = the same), **\| 0x40**; **+0x15fc = sh float 0** (the flight time). **`0xd6c680(child, p)`**: if +0x1660 → +0x40..+0x48 = p, +0x4c = 0, and the flight effect +0x1624 placed there (`0x329c9c`, index 0). **`0xd6c6cc(child, w)`**: if +0x1661 → +0xfe8..+0xff0 = w and the effect's rotation = w as u32 × `0xd6c76c` (`0x329d04`). **Landing +0x150 `0xd6c790` = `bx lr`** — nothing | R | Plesioth's `em010_00_00` mode 0: ints [0, 0, 0] → flags **0x870**; floats [600]; ef 0 = **u 21**; no cmn. So the child is u 21 riding the beam's contact point, turned with the beam, for up to 600 frames or until hit type 3 / the beam's end |
| base00 flag **0x800** | **no test in base00's own band** `0x3f8800..0x3fa2f8` (tst / ands / bics / teq / and / bic, and no shift by 11): a word-by-word scan whose controls — bit 3 at `0x3f8e68` / `0x3f9308`, bit 7 at `0x3f8ec4` / `0x3f8f94` / `0x3f9118` — all came back. A near-the-load scan of the whole binary finds `0x800` beside a `0x15e8` load only in other classes' readers (Em057 sp_18, Em070) and `0x470574` (another base: it treats +0x15f0 as flags) | I | the transitive calls out of the band are NOT scanned, so "no consumer" is bounded to base00's own methods. That near-the-load scan MISSED base00's bits 3 / 7 (their tests sit far from the load) — trap: its negatives are worthless without the band scan. **WITHDRAWN 2026-10-06 (the Withdrawn table): `0x3f9308` follows `ldrb r0,[sb,#1]` (`0x3f9304`), so it tests bit 11 = 0x800 itself (byte `+0x15ac` = 0); `0x3f933c` tests 0x400** (dev/em084-phase2-bases.md §4d) |
| Em038 +0x158 `0xe647cc` | Ukanlos: replaces the base step — on a floor hit, modes in 0xe7: up to 6 firings, each ef 1 at the hit AND a child shell id 0xce (mode from the byte table +0x1690[counter]), the next after +0x169c[counter] frames (+0x1698, counted by its +0x154 `0xe63b5c`); modes 3 / 4 another branch | R (outline) | NOT transcribed; tables from its reader's helper 0xe63d74, unread — **UPGRADED to R below; TRANSCRIBED 2026-09-30: shells.js `hit038` / `move154g` / `makeChild02g` (children base00 via `params038c`, `ANGLE16C`, `CHILD_INIT`, `landing038`)** |
| Em038 +0x158 `0xe647cc`, **READ WHOLE (Viewer agent, 2026-09-30)** | the stage query's hit callback `(shell, point, query, type)`; **the base's `0x3fd2d8` is not called at all** — no ray cut, no per-frame re-placement of ef 1. Type ≠ 1 (not the floor) or mode `+0x168c` > 7 → nothing. Every firing needs the float timer **`+0x1698` ≤ 0**, and each starts ef 1 (`+0x1648`) **anew** at the point (`0x4a10c8` / `0x4a11e4`, the handle `+0x1604` overwritten, the old one not stopped). **Modes 0/1/2/5/6/7** (mask 0xe7): counter `+0x168d` ≤ 5 → ef 1 + child shell 0xce mode `[+0x1690][counter]`, counter++, then (counter ≤ 5) `+0x1698` = `[+0x169c][counter]` (a word). **Modes 3/4**: ef 1 on EVERY firing; an EVEN counter below 10 also makes the child shell, mode `[+0x1690][counter >> 1]`, and sets `+0x1698` = `[+0x169c][counter >> 1]` (the new counter, `& 0xfe`, words); an odd counter only counts (the timer stays ≤ 0, so the next hit frame fires again); from counter 10 on, **ef 1 every hit frame** | R | `0xe647cc..0xe64b44`. The child's setup (0x30 B): vtable literal+8, +4 id 0xce, +8 mode, +0xc `0x4a0f00(shell)`, +0x10..+0x18 the point, +0x1c 0, +0x20..+0x28 a global vec3, +0x2c 0, +0x2e 0xffff; `0x48b884(mgr, setup, 0, 0)` |
| `0x3f76d8(obj)` / `0x7c9234` | **the random u16**: `0x7c9234(obj + 0x20)` — a xorshift128 step on 4 words [a, b, c, d]: t = a ^ (a << 15), t ^= t >> 4, state ← [b, c, d, t ^ d ^ (d >> 21)], returns the new d — then `uxth`. The shells' generator object comes from a global (e.g. literal `0x9ce83c` at `0xe63294`); its SEED is set at run time and NOT read (no xorshift default constants appear as movw/movt anywhere in `.text`) | R (step) | also monster.js's Blind Eye note (`0x27c430 -> 0x3f76d8`). A viewer that draws from it states its own seed |
| shell ids `0x7c` / `0xce` | `0x175c3e8[0x7c]` = {**uShellEm010_sp_00**, cSetupParamEmBase00, res 0x89cf}; `[0xce]` = {**uShellEm038_sp_00**, cSetupParamEmBase00, res 0x8a21} — Plesioth's and Ukanlos's beam children are **base00** shells | R | read from the table 2026-09-30 |
| Em038 `+0x14c` `0xe63ba4` / `+0x154` `0xe63b5c` / dtor `0xe64b60` | Ukanlos's reader: the base02 reader's fields, then **+0x168c = the mode** (`0x4a0ee4`), **+0x168d = 0** (the counter), `0xe63d74` (the tables), **+0x1698 = [+0x169c][0]** (the first delay). `+0x154`: +0x1698 = max(+0x1698 − dt (`+0x1c`), 0). The dtor frees +0x169c and +0x1690: both are heap arrays | R | Viewer agent 2026-09-30 |
| Em038_sp_00 (child 0xce, vtable `0x17be538`) init `0xe63240` | base00's init `0x3f8b80` (0 → `vt+0x40`, return 0); then modes **8..17**: scale = cmn **f1 + f2 × (rng & 0x3ff − 512) × 0.002** (`0x3f76d8`, literal `0x3b03126f`), modes **18..22**: cmn **f3 + f4 ×** the same → `0x43ab74` (the shell's `+0x60..+0x68`); then `0x183664` (a stage query at `+0x40`) whose `s0` is used ONLY as the Y of sound **0xd7**'s position (`0x4eeed0`). Its own reader `+0x14c` `0xe63400`, landing `+0x150` `0xe63714`, `+0x164` `0xe6369c`, `+0x16c` `0xe635e0` are **UNREAD** — **READ below, same day** | R (init) |
| Em038_sp_00 reader `0xe63400` / `+0x16c` `0xe635e0` / landing `0xe63714` / `+0x164` `0xe6369c` | **reader**: ef 0..3 → `+0x15c8` / `+0x15cc` / **`+0x15d4`** / **`+0x15d0`** (2 and 3 SWAPPED against base00's order); hit int 0 → `+0x15d8`; sh int 0 → `+0x15dc` (joint), int 1 → `+0x15e4` (the floor landing's `0x43ac04` id); flags `+0x15e8` \|= **0x40**, \| **0x10** iff sh int 2 ≠ −1, \| **0x20** iff sh int 3 ≠ −1; sh floats 0..4 → `+0x15f4` / `+0x15f8` / `+0x15fc` / **`+0x15ec`** / **`+0x15f0`**; vecs 0 / 1 → `+0x1610` / `+0x161c`; cmn int 0 → `+0x1660`. **`+0x16c`**: modes in mask `0x7fff30` (4, 5, 8..22) → base `0x3f9cc4` (flag bit 1 clear: `deg2u16(+0x15f0)`, ×182.044 + 0.5) **+ (rng & 0x3ff − 512) × 0.002 × cmn f0 × 182.044** (a jitter of ±10.24° with f0 = 10), `uxth`; other modes → the base alone. **Landing**: type 0 → `0x43ac04(+0x15e0)`, ef `+0x15cc`; type 1 → `0x43ac04(+0x15e4)`, then for mode ≤ 3 with an owner `0xac030(owner, &point, 3, 0)`, ef **`+0x15d0`**; type 2 → ef `+0x15d4`; then `0x3f8970(shell, ef, point)` and `vt+0x148(shell, 0)`. **`+0x164`**: modes 1 / 3 only (mode \| 2 == 3) → the hit param's `vt+0x140`, else base `0x3f9aec` (hit side) | R | Ukanlos's modes 8..22: ints [0, 1, 0, −1] → flags **0x50** (the REQUEST's point — the beam's hit — and the owner's facing, `0x20` clear); the child setup's `+0x20` angles are a zero vec3 (`0x18321b0` → `0x1620e60`). base00's `0x3f9cc4` / `0x3f9378` add `+0x15f0` / `+0x15ec` as u16 to Y / X (flag bits 1 / 0 clear) | Ukanlos's `em038_00_00` cmn ints [2], floats [10, 1.0, 0.2, 0.7, 0.1] → scale 1.0 ± 0.2 (8..17), 0.7 ± 0.1 (18..22). Its folder has **no model**; ef per mode 8..22 = u 0 or u 1 (param 0) and u 10 (params 1..3); sh floats e.g. mode 8 [15, 35, 300, 0, −125], vecs [[0,0,0],[0,−1.8,0]] — the last float alternates sign by mode (a side), meaning UNREAD until the reader is |
| Em038 `0xe63d74` | **the tables, by mode (PIC jump table at `0xe63da0`)**: modes 0/5 → delays = **cmn floats 0..5**, child modes **8, 9, 10, 11, 12, 13**; 1/6 → floats **6..11**, modes **15, 14, 15, 14, 15, 14**; 2/7 → floats **12..17**, modes **17, 16, 17, 16, 17, 16**; 3/4 → **cmn float 18 five times**, modes **18, 19, 20, 21, 22**. The count is cmn **int 0** (modes 0/1/2/5/6/7) or **int 1** (3/4); **≤ 5 (≤ 4 for 3/4) ends the shell at init** (`vt+0x148(shell, 1)`, `0xe646c8`). The child modes are LITERALS in code, not data | R | `0xe63d74..0xe64788` (the rest is the arrays' growth). Ukanlos's `em038_00_02` cmn: ints **[6, 5]**, floats **[2, 20, 15, 10, 10, 10, 2, 2, 15, 15, 12, 10, 40, 13, 13, 13, 10, 10, 26]** (`shellef.cmn`) |

| index.html `rockInput` wall `facing` | **FIXED 2026-09-30**: was the constant `+1`, now `ownerZ >= at ? 1 : -1`. `stageQuery`'s wall arm needs a crossing in −z, so a constant `+1` made the plane unhittable for any `+z` shell at ANY wall position — Basarios's `u 162` was unreachable, not undriven. Measured by Effects with a control (facing `+1` byte-identical to no wall; facing `−1` hits at frame 56 and fires `u 162`). **NOT covered by the node suites** — the facing comes from index.html, not shells.js, so Khezu on a wall (base03's queries, shell03 mode 20's climb) is eye-verified only | R | index.html:7465 |
| ~~base02 has no flags word~~ | **WITHDRAWN** — the scan searched `tst`; the test is `ands`. A flag test is `tst` / `ands` / `bics` / `teq`, and one mnemonic finds a quarter of them | W | shell02-spec §4e |
| `0x4a225c` / `0x4a229c` / `0x4a22e0` | the three common accessors' NULL paths: int → `-1`, float → `0.0` (literal `0x4a22a4`), vec → the shared empty vec3 | R | shell02-spec §3 |
| `0x1831a78` → `0x19176b0` | **the engine's shared empty vec3** — reached by `cmn.getVec`'s null path AND by the em004 shell00 spawner (`0xd284c4`). Two unrelated sites, one slot: zero IS the value | R | shell02-spec §3 |
| `0xd30b84` | shell02 `+0x13c`: guard `bl 0x3fb9bc` == 1, mode−1 ≤ 0xb, **bit (mode−1) of mask `0x33`** (modes 1,2,5,6); then `0xc15a4` for the joint at `+0x1658` and a vec3 at `+0x15e0..8` advanced along the matrix's 2nd row × the common float at `+0x168c` | R | shell02-spec §4 |
| `0xd30e30` | shell02 `+0x15c`: 12-entry jump table on mode−1 → 3–4 behaviours, `sinf`/`cosf` on angle words | R (partial) | shell02-spec — **READ IN FULL below ("The beams on their own monsters", Viewer agent, 2026-09-30)** |
| `0xd30cec` | shell02 `+0x168`: the same mask-`0x33` predicate as its guard | I | shell02-spec — **UPGRADED to R below (Viewer agent, 2026-09-30)** |
| `0xd30cec` | shell02 `+0x168`, **READ**: a mode outside mask `0x33` tail-calls `0x3fc750`; a code-1 mode is **THE FAR CHECK** — no owner → `[+0x148]`; joint position (`0xc164c`) farther from the origin `+0x15e0..8` than `size × 250.0` (`0xd30e2c`) → `[+0x148](shell, 0)` | R | shells.js `far02` |
| `0xd30b84` | also: a mode outside 1..12 or outside mask `0x33` returns **1 without the init body** (`0xd30bc0` / `0xd30bd4` → `0xd30cdc` with r5 = 1) | R | — |
| `0x4a22f0` | getEffect's null path: no resource `[shell+0x1384]` → 0; else `[[list]+0x10][raw mode]` (mode from setup `+8` when the arg is −1), a **null entry → 0** (`0x4a2348`) | R | M24 row above |
| `0x3fbaf8` | shell02 vtable `+0x18`, **the activation**: `[+0x168]` (the far check) first, then the effect is created ONLY IF `+0x1644` (the reader's `getEffect(0)`, `0xd30aa8`) is non-null with id ≥ 0 (`0x3fbb2c..0x3fbb40`); the start's angles are atan2s of (position − origin) | R | shells.js `step02` / `angles02` |
| `0x3fd288` | `+0x160`: the ray length — the cmn float 0 (`+0x165c`), **1.0 where it is 0** | R | shells.js `make02` |
| `0x3fd4c4` | `+0x170`: 1 when the owner's motion `[+0x4b4]` is no longer the spawn's `+0x15d4` → the shell ends | R | shells.js `step02` |
| `0x31e014`..`0x31e03c` | the effect start NEGATES its quaternion when w < 0 (after `0x320ed4` → `0x72dec`, tested at `0x31e008`). **First reached by Basarios's downward beam** (L2 M29, start rotation (70.93°, 0, 180°), `+0x14` = `0x40000002`): the lifted runtime refused there. The first recording of `shell_em004_00_L2M29_start_70x0e_*` did NOT cover it — shellplan dropped the rotation (tooling row below) — the second, with the rotation, is the one on V= (2026-09-30) | R | lift-effects.sh V |
| `0x4a22f0` | **getEffect(i)** — control: `params00` `0xe82304` fills the four ef handles `+0x15c8/cc/d0/d4` from `(0..3)` | R | shell02-spec §3.1 |
| `0x4a2224` | **common int** — control: `params00`'s `joint: c.ints[0]` → `+0x15dc` | R | shell02-spec §3.1 |
| `0x4a2264` | **common float** — control: `params00`'s `flight: c.floats[late?1:0]` on both arms | R | shell02-spec §3.1 |
| `0x4a22a8` | **common vec** — control: `params00`'s `vec: c.vecs[...]` → `+0x1610` | R | shell02-spec §3.1 |
| `0x4a24f8` / `0x4a2584` | sh float / sh vec — same control (`sh.floats[0/1]` → `+0x15f4/f8`, `sh.vecs[0]` → `+0x161c`) | R | shell02-spec §3.1 |
| `0x4a2378` | int getter of a section none of the controls pin down; 94 call sites, 2 in `0xd30a90` | — | **UNREAD**, agrees with EMC's row |

**The recompose chain (shell00's placement), certified on screen as well as read:**

| addr | what | st | detail |
|---|---|---|---|
| `0x329d88` | placement mode `+0x36` → compose state (4→0, 1→2, 0→1 if `+0x38`==1 else 0) | R | EMC; measured to agree |
| `0x327238`–`0x327240` | `cmp r0,#1 / bhi 0x3273d8` on the compose state at `+0x220` — **state ≥ 2 skips the per-frame recompose** (the `0x31d16c` call at `0x3272f4`) | R | measured: state 0/1 records hold gap 0.0 over 8091 units of joint travel, state 2 records spawn on the joint and hold in world space |
| `0x31f6b4` / `0x31f6c0` / `0x31f788` | the parent-model gate; transformed arm vs raw-add arm | R | **certified on screen by `c 1104`**: joint-space offset `[0,-10,60]` constant over 8 spawns while the world delta varied |
| `0x42744` → `0x31f904` | the ground-height resolve, stored into the effect's world-matrix Y | R | measured: every clip record's spawn delta is a pure world vertical whose size tracks the joint's height |

**Transcribed in docs/render/shells.js** (uncommitted; nine shell suites byte-identical before and after):

| what | where | detail |
|---|---|---|
| `params04r` — em004 shell00's reader `0xd304ac` | shells.js ~2881 | shell00-spec §2 |
| `params04s01` — em004/em005 shell01's reader `0xd308dc`, into `READERS01` by reader address (Gravios free) | shells.js ~4199 | shell01-spec |
| `params02b` + `READERS02` — em004/em005 shell02's reader `0xd30a90`, base02's field offsets | shells.js ~3155 | shell02-spec §3 |
| `spawn02b` — spawner `0xd28bb4`, dispatched ahead of the generic arm; refuses by name (base02's init unread) | shells.js ~3200 | shell02-spec §2 |
| `READER00` — class → reader, defaulting to `params00` | shells.js ~2896 | so no existing monster changes reader |
| the placement bit `0x10` and the bit 3 / bit 7 offset arms inside `init00` | shells.js ~2920 | shell00-spec §3, §5 |
| `spawn04` — spawners `0xd283fc` / `0xd2ba08`, with `REQ04_POS` / `REQ04_ANG` = the two request vectors | shells.js ~3155 | launches measured at `(0,−50,10)` modes 0–4 and `(−65,65,90)` / `(−10,65,90)` modes 8–10 |
| `landing04` + its `LANDING` key | shells.js ~3920 | type 0 → `_ef` 2, type 2 → `_ef` 1; **type 1's `u 161` refuses by name** |
| the dispatch ahead of the generic `a.spawns` arm | shells.js ~4869 | his rows were falling into Rathian's `create001` |

---

### The beams on their own monsters — every beam monster's spawn sites (2026-09-30)

Raven: *"add them to their respective monsters since each look correct"*. The per-class reads are the four research
agents' (groups A–D), each in **`dev/beams/<monster>.md`** — every row READ at the consuming instruction, then ROM-run
through the class's own action main under unicorn, with Basarios's (7,0x0e) f142 mode 1 reproduced as the positive
control in all four harnesses. Transcribed as rows in `docs/render/beam-spawns.js` (the spawn: list, clip, frame, mode,
state) on `docs/render/shells.js`'s base02g runtime (`spawnBeamReal`, `ray02real`). The Viewer agent's own reads of the
day are marked so.

| addr | what | st | detail |
|---|---|---|---|
| `0xd30e30` | **Basarios / Gravios `+0x15c`, READ IN FULL** (to its pop `0xd311e4`; Viewer agent): `[shell+0x136c]` = the spawn setup; mode − 1 > 0xb → Md kept. Code (`0x169bbb0`) **1** (`0xd30ffc`): the owner's rotation (`0xd29708` tilt × quaternion `P+0x50..0x5c`) → Euler `0x7c3a38`, the setup's u16 `+0x20` × 2π/65536 ADDED to x, rebuilt. **2** (`0xd30e98`): Md's Euler **`0x7c37d0`**, x REPLACED by the setup word, z = 0, rebuilt (rows `(cy·cz, sz·cy, −sy)`, `(sx·sy·cz − sz·cx, cx·cz + sx·sy·sz, sx·cy)`, `(cx·sy·cz + sx·sz, sy·sz·cx − sx·cz, cx·cy)`, translation 0, in the vmul / vmla order shells.js keeps). **3 / 4** (`0xd30f88`): row 2 as four floats normalised | R | shells.js `dirHook005`; code 1 is make02's (its `+0x168` is the far check, never this builder) |
| `0x7c37d0` | Euler from a row matrix, the order code 2 inverts: `out[3] = 0`; `m[6] ≥ 1` (or NaN) → (π/2, −atan2(−m[1], m[0]), 0); `m[6] ≤ −1` → (−π/2, −atan2(m[1], m[0]), 0); else x = −asin(−m[6]), y = −atan2(m[2], m[10]), z = −atan2(m[4], m[5]) | R | Viewer agent; the sibling at `0x7c389c` is another order (unread past its head) |
| `0xd67fd8`..`0xd680dc` + `0xd682a0`..`0xd6830c` | **Plesioth's aim** ((7,0xd) / (7,0x28) / (7,0x32); Viewer agent, beside agent A's note): at the step crossing **f22**, point = joint **0x68** (`0xc164c`) with y + table `0xd6835c` (−150.0; 50.0 for r1 = 1, which no beam action passes); d = target − point; `atan2(−dy, √(dz² + dx²))` → u = u16(s32(0.5 + p × 10430.378)); `(u − 0x1556) < 0x6aaa` → **29.998°**, `(u − 0x8001) < 0x6aaa` → **330.002°**, else u × 360/65536; > 180 → −360 (`vselgt`); kept in `e+0xcae8` (degrees; phase 0 zeroes it). At the spawn: `+0x20 = strh s32(0.5 + deg × 182.044)` | R | shells.js `aim010` / `beamSetup`; literals `0xd6835c`..`0xd68384` |
| `0xd81e80` | **the Fatalis aim** ((7,0x3e) / (7,0x3f) at f94; Viewer agent): v = (0, 250, 800) × size (`0xbe518`) turned by the owner's Z, X, Y words (`P+0x58`, `+0x50`, `+0x54`); M = `P+0x40` + v; d = (target + (0, 380, 0)) − M; w = s32(0.5 + atan2(−dy, h) × 10430.378), u = u16(w): u < 0x4000 → (u > 0x18e4 ? 0x18e4 : w); else (u < 0x10000 − 0x18e4 ? that : w) | R | shells.js `aim013` |
| shell02 ShellScale | **the `.shl` ShellInfoList scale per mode — what `0x4a10c8` writes to the effect requester `+0x40`, and what the shell unit's `+0x60` (its effects' parent) is** (proof.js). Non-1 on beams: **em081_04 modes 4 / 5 / 7 / 8 = 1.2; em084_00 3 / 10 = 1.3, 50..63 = 2.0 (52 = 2.3); em083_04 0 = 0.78** (no effect there); every other beam mode 1.0. The Beam Test drew every type at 1.0 until 2026-09-30 | R (data) | beam-types.js `scale` (gen_beam_types.py `shell_scales`); trap 41 |
| `0xd6964c` / `0xd6765c` / `0xd67834` / `0xd67f44` / `0xd68db4` / `0xd69200` / `0xd683a4` / `0xd68c64` | **Plesioth** (id 0x7d literal): status-7 table; (7,6) L2 M10 f130 mode 2 / G 17, +0x20 0xe39; (7,8 / 9) M12 / M11 f126 3 / 18; (7,0xd) M6 f86 0 / 15; (7,0x28) M15 f112 6 / 21; (7,0x32) M13 f124 13 / 28; (7,0xf / 0x10 / 0x15 / 0x16) M7 f116 5 / 1 / 10 / 9 (G +15); (7,0x27) M14 f116 4 / 19. The mode is the only thing the rank changes (`questRank > 4`, `movwgt`) | R | dev/beams/em010_00.md (agent A) |
| `0xd865a0` | **Fatalis line**: (7,0x32 / 0x33 / 0x3e / 0x3f) → L2 M46 / M47 (blend 8), f94, id 0x84 / 0x88 / 0x8c by `e+0xb5f5` 0 / 1 / 2 (other variants: none), mode 0; +0x20 = 0x2d8 (r2 0) or `0xd81e80` (r2 1) | R | dev/beams/em013_00.md (agent A) |
| `0xdb9a88` / `0xdbbff0` / `0xdb935c` / `0xdb4780` | **Daimyo line**: the helper (no frame test; `ctl+0x52 = 1`; id `[e+0xcacc]`; mode 1 iff variant 0 and questRank ≥ 5; +0x24 = serial `ctl+0x16` from `0x16b4b4`); the six beam actions (7,3 / 0x1a / 0x1c / 0x2e / 0x2f / 0x31) call it at f96 unless tired; the turns (L2 M57 / M55, kinds 6 / 7) call it in their first update iff `ctl+0x52 == 0`; the on-action-start hook clears `ctl+0x52` for exactly those six numbers | R | dev/beams/em019_00.md (agent A) |
| `0xdc3e8c` / `0xdc5e44` / `0xdc5edc` / `0xdc9bd0` / `0xdca470` / `0xdcb404` / `0xdcbe78` | **Shogun / Rustrazor**: `e+0xcad8` = 0x9e (0xa0 variant 4), read only by `0xdc5e44`; `0xdc5edc` holds the literal 0xa0 (a tail `b` submit: why a literal scan missed it). Shogun (7,0x32) L2 M27 f50 mode 4 iff the shell type `e+0xcadc == 3` (part pass `0xdc5228`: set 3 = part 109); Rustrazor (7,0xc9 / 0xca) at L9 M31 / M33's first frame mode 0, (7,0xd4) as L2 M73 f34 sets M74 mode 2, (7,0xdf / 0xe2) L9 M20 f50 (tune float 0x28) mode 1 / 3, each not tired | R | dev/beams/em020_00.md (agent B) |
| `0xdca604` — (7,0xc9) / (7,0xca) phase 5 | **Rustrazor's beam SWEEP and END, READ (Viewer agent, 2026-10-01)**: every update after the spawn, `0x76dd0(e, ∓27307, 2.0, 70.0)` — s32(0.5 + tune float 0x1c (150.0) × 182.044 `0xdca708`), uxth, negated (`rsbeq`) for r5 = 0 = (7,0xc9) / L9 M31; frames tune 0x1a / 0x1b — then `0xb0968(e, 1, 0, 70.0)` (mode 1) → **L2 M75 (0x24b)**, blend 0: his class keeps base02's +0x170 (no override), so the 2000-frame mode-0 beam ends there, the unit turned ∓150°. Phase 6: M75's end → vt+0x3dc. Nothing else plays L9 M31 / M33 (no other movw 0x91f / 0x921 in .text; no aligned word in .data / .rodata — control 0x914 found at `0x1794638` / `0x17eb234`) | R | dev/beams/em020_00.md §5; render/beam-spawns.js `leave`, render/motion-states.js CLIP_TURN |
| `0xdcb480` — (7,0xd4) phase 2 | at **L2 M74's end** (`0xb09c8`, the ended flag: its first pass, 26 + 80 = 106 frames) → L2 M75 → the mode-2 beam (2000 frames) ends. No turn in `0xdcb404` | R | dev/beams/em020_00.md §5 |
| `0xdcbe78` — (7,0xdf) / (7,0xe2) | ph0 `0x782e4(e, 2, 0x8000, 0, 0)`: `P+0x5e64` = 2, `+0x5e66` = the side (bit 15) of (the target's bearing from `P+0x1d0` / `+0x1d8` − `P+0x40` / `+0x48`) + 0x8000 − the yaw (`0x782e4..0x783f4`, READ); ph1 `0x7840c(e, 910, 0x8000 / 0x8000 + 910, 0, 50.0, 56.0, 150.0)` — 910 = s32(0.5 + tune 0x27 (30) / (tune 0x26 (56) − tune 0x25 (50)) × 182.044), +910 = tune 0x29 (5°) for (7,0xe2): the steer to his back on the hunter, `0x7840c` → `0x77d28` READ 2026-10-05 (rows below) (follows `P+0x1d0`, the hunter, which the viewer does not have). Mode 1 / 3 live 108 frames: they end by life at f158, the action at M20's end (`0xdcc00c`) | R | dev/beams/em020_00.md §5 |
| `0x7840c` / `0x77d28` | **the monster steer, READ (research agent for the Viewer agent, 2026-10-05)**: state `P+0x5e65` (1: no turn but mode 1's side turn; not 0/1: return 0), travelled sum `+0x5e6c` += \|`P+0x320..`\| -- once > s2 and the target is behind (dot with (sin, 0, cos) of yaw + r3 < 0) within 150 (`0x7828c`; 300 with flags bit 4) the steer stops for good; then flags bit 0/1 -> forced side `0x77b54`, f0 < 0 -> `0xc0dbc` (no window), else `0x770e4`. Unicorn-checked, 8 cases x 70 updates, 0 mismatches | R | dev/beams/em020_00.md "The steer"; index.html STEER |
| `0x770e4(e, rate, off, slot, f0, f1)` | the windowed steer: `0xb0968(e, 9, &share, f0, f1)`; s = ceil(rate x step `+0x13b8` x share) & 0xffff; T = s32(0.5 + atan2f(tx - x, tz - z) x 10430.378); d = s16(off - yaw + uxth T); \|d\| < s -> yaw = T + off, else yaw +/- s (the shorter way). A catch-up branch for the gate `+0x4f4` (byte `+0x13f0`) the viewer never takes | R | same |
| `0x782e4` | steer setup: `+0x5e64` mode, `+0x5e65` = 0, `+0x5e66` the side (computed, read only by mode 1 and `0x77a2c`), `+0x5e68` flags, `+0x5e6c` = 0 | R | same |
| `0x13ecba8` / `0x13ecc14` / `0x13ecc20` / `0x13ecc2c` | atan2f / sqrtf / sinf / cosf (PLT relocations) | R | same |
| `P+0x320` | this update's displacement (written `P+0x40..` - `P+0x00..` at `0xa61bc`) | I | same |
| `0x75388` (uEm020 vt+0x3ec) → `0xdc61b0` | **Shogun's (7,0x32) end**: at M27's end → `0x75388`: posture 6 (keeping `P+0x992`), `0x76098(e, 0, 8, 2)` = action (0, 8); status 0's table (`0xdc6134`, `[e+0x73e1]` ≤ 8) entry 8 = `0xdc61b0`: phase 0 posture 6 + **setMotion L5 M1 (0x501)**, phase 1 at its end `0xdc5c40` → so his 2000-frame mode-4 beam ends at M27's end (+0x170) | R | dev/beams/em020_00.md §5; render/beam-spawns.js `leave` |
| `em020_00_actiontune` floats 0x18..0x2b | 0, 8, 2, 70, 150, 0, 10, 30, 60, 1, 48, 54, 0.125, 50, 56, 30, 50, 5, 0, 12 (same file in both arcs; control: em007_04's 27 / 16 / 116 / 137 / 124 = 116 / 160 / 154 / 24 / 10, row 228) | R | `beamsB/harness.py tune_of` (`shellef.fup`) |
| `0xde8908` / `0xde86c0` / `0xde9fc4` / `0xdeada8` / `0xde1f84` | **Rajang / Furious**: the helper (0xa9, 0xad for variant 5; refuses mode > 2); (7,6) / (7,0xa) L2 M8 f80 mode 2 / 1; (7,0x34 / 0x35) L2 M20 / M21 f74 mode 0; the tired remap swaps each for its no-beam twin (7,0x3e / 0x3f / 0x40). **0xaa / 0xae are base22, not the beam** | R | dev/beams/em023_00.md (agent B) |
| `0xde8864..0xde88ec` / `0xde87e8` | **Rajang / Furious, (7,6) / (7,0xa) phase 1 and 2** (Viewer agent, 2026-10-05): `P+0x1a2` = 2 (set in phase 0, `0xde88bc`) counted down on each motion end (`0xb09c8`, a loop's wrap included); at 0 -> phase 2 and L2 M9 (`0x209`, `0xde88dc`); phase 2 hands on at M9's end (vt+0x3dc). So L2 M8 = _start + TWO _loop passes, then M9; the beam (no +0x170 override) ends at M9, 116 frames after its f80 spawn | R | monster.js ROM_ANIMATIONS em023 'S. Motion 8 Beam' |
| `0xdfc814` (Kushala vtable +0x2a8) tail `0xdfca70..0xdfcadc` | **the hit-zone conditional state, READ (Viewer agent, 2026-10-01)**: b = `P+0x1bb`; 0xff -> nothing; 3 -> 3 (or 2 when `[[e+0xcac0]+0x18]` != 0); 2 -> 2 (or 1); any other value stands; non-zero -> `b 0xc02e4` (`P+0x5dec` = 2, counted down per frame) -- so his bit-15 Head shape (record 0: sphere r300 on joint 2) counts while `P+0x1bb` is not 0 / 0xff. `P+0x1bb` is written at `0xdef8f4` (+1), `0xdef778` / `0xdef9a4` / `0xdefb2c` / `0xdefc20` (-3), `0xdef93c` (3 or 2), `0xdef790` and others (0): INFERRED his wind aura level (Raven: "Likely tied to the Wind Aura"); the meaning is not read. The viewer leaves bit-15 shapes out of the drawn zone (index.html `zoneConditional`) and the heat map (build-hitzones.py; em024_00.bin rebuilt: 206 vertices left Head) | R / meaning I | build-notes/hitzone-capsules.md section 3 |
| `0xdf8c28` / `0xdfad3c` / `0xdef358` / `0xdef0f0` | **Kushala**: L2 M1 to f40 then L2 M8 (L2 M27 + M8 for (7,0x1a)), 0xb1 at f24: mode 1 iff `ctl+0x2c` (enraged at the action start) **and** `ctl+0x2d` (`e+0x1053` ∈ {3, 14, 20}), else 0 | R | dev/beams/em024_00.md (agent B); which stages those are: ~~NOT READ~~ → READ 2026-10-05, the rows below and em024_00.md §5 |
| `e+0x1053` (`0x6bb20` get vt+0x9c / `0x6bb2c` set vt+0xa0) | **the quest's map number** (cQuestData `mMapNo`, folded `% 100 % 28`). Set in the shared enemy setup `0xb8b98` (`0xb8f4c`) and at construction (`0xacde4`, then `+0x1054` = `G+0x49` by vt+0xa4) from `G+0x48`; the base ctor `0x538dfc` stores 0xff. **3 = Arctic Ridge, 14 = Frozen Seaway, 20 = Polar Field** (names from quest text). Positive controls: Lao-Shan tests 26, Nakarkos 21, each = its quests' only map | R (names: text) | em024_00.md §5 (research agent, 2026-10-05) |
| `0x49648` / `0x49660` → `G+0x48` / `G+0x49` | G = `*0x18858a8` (GOT `0x1831ae0`); `+0x48` written at `0x6bd808` = `0x3bc828(*0x1883d18)` = `(s8 rec0.mMapNo % 100) % 28` (quest `Q+0xd68` → `0x3b9ac4` → `0x39af14(rec, 0)`, stride 0x108). `0x49648` has 3 callers: `0xabcd4`, `0xacde8`, `0xb8f50` | R | em024_00.md §5 |
| `0x370598` | cQuestData registration: `"mMapNo"` at **+0x10** (in memory; packed file +0x14, questdata.py) | R | em024_00.md §5 |
| `0xdef0c8..0xdef0e8` | Kushala `ctl+0x2d`: `stage ≤ 0x14 && (0x104008 >> stage) & 1` = {3, 14, 20}; tested after the stage is set (`0xb8f5c` before vt+0x1d8 at `0xba210`, same function). Mode 1 = the same efls (`_016` / `_007`) with payload MASK1 2 instead of 1 (+0x68 0.2 → 0.5, NOT READ) | R | em024_00.md §5 |
| `0xe3b0b8` / `0xe3b9e0` / `0xe3c594` / `0xe36550` | **Akantor** (0xc2): (7,4) L2 M5 + M22 / M23 f112 mode 0, f152 modes 1 + 2; (7,0xf) L2 M14 + M24 / M25 f132 mode 0, f172 3 + 4 — (7,0x27) at questRank ≥ 5 (the remap), f162; (7,0x26) L2 M31 f201 mode 5, f330 mode 6. Modes 0 / 2 / 4 start no effect | R | dev/beams/em033_00.md (agent B) |
| `0xe60ef8` / `0xe615e8` | **Ukanlos** (0xd0): M5 f125 modes 0 / 1 / 2 ((7,9) / (7,8) / (7,0xa)), M41 f120 mode 7, M34 f218 modes 3 / 4 | R | dev/beams/em038_00.md (agent C) |
| `0xeba3d8` / `0xebb520` / `0xebcd94` / `0xebebec` / `0xeb4ae0` | **Agnaktor** (0xee): L2 M4 f120 modes 0 / 5 / 6 by r1 2 / 3 / other (table `0x169ebe0`); L2 M28 f236 mode 1, M27 f168 mode 2; L2 M11 f118 mode 3; L2 M30 f120 mode 9; the remap `0xeb4ae0` turns (7,4 / 0x1f / 0x20) into (7,0x16) and (7,0x38) into (7,0x39) when tired | R | dev/beams/em049_00.md (agent C) |
| `0xec8544` | **Alatreon** (0xf1): (7,0xe) / (7,0x25) → L2 M8 to f40, then L2 M11, mode 0 at **f22 of M11**; the spawner sets posture 3 | R | dev/beams/em050_00.md (agent C) |
| `0xec8a5c` / `0xec8b70` / `0xec8c80` | **NOT beam spawns** (candidates in the Viewer agent's brief): the 0xf3 (`uShellEm050_sp_41`, base41) submits of the same function, allocated by `0x41ee98`; a literal scan matched the earlier `mov r0,#0xf1`. The `e+0xcad0 = 150.0` timer at `0xec9e54` follows a 0xf3 submit too | R | dev/beams/em050_00.md (agent C) |
| `0xee53e8` / `0xee5710` | **Nibelsnarf** (0xf5): (7,0xd) L2 M17 f102 mode 0; (7,0x24) / (7,0x25) — reached only through `0x768c8` as (7,0xe) / (7,0x23)'s L2 M18 ends — L2 M35 f55 mode 1 | R | dev/beams/em056_00.md (agent C) |
| `0xf0cf34` | **Amatsu** (0xfe): (7,0xa) L2 M18, mode 0 at f270 (tune float 33), mode 1 at f410 (float 34) | R | dev/beams/em058_00.md (agent D) |
| `0xf6fb08` / `0xf7132c` / `0xf71d00` | **Zamtrios** (0x123): L4 M59 / M60 f36 mode 0; L4 M57 / M58 f10 mode 1; (7,0x4a) enters M60 at frame 6 (f36 fires) | R | dev/beams/em067_00.md (agent D) |
| `0x102feb4` / `0x1028e00` / `0x1029530` / `0x1029288` / `0x1029430` | **Boltreaver** (0x153 in `[e+0xcbb8]`, variant 4 only): L9 M1 f48 mode 4 → at f90 (7,0xd2) L9 M2 in its first update, mode 5; L9 M21 f78 mode 7 → at f116 (7,0xd1 / 0xe5) L9 M22 in its first update, mode 8 | R | dev/beams/em081_04.md (agent D) |
| `0x104cfa8` / `0x104d15c` | **Mizutsune / Soulseer** (`[e+0xcac4]`, +10 on the mode for variant 4): L2 M75 f2 mode 2, f100 (tune 20) mode 0; L2 M81 f20 mode 2, f100 (tune 21) mode 1 | R | dev/beams/em082_00.md (agent D) |
| `0x107ca4c` / `uEmOstgaloaArm` | **Nakarkos**: the arms (kind 1 left at body+0xcc00, kind 2 right at +0x19750; models `em084_00_left` / `_right`, lists `l_*` / `r_*`) fire most beams through `0x107ca4c(arm, index)`, the mode from four 9-entry tables by side and questRank > 4; the body (7,0x43) L0 M63 f146 mode 14 | R | dev/beams/em084_00.md (agent D); NOT YET IN beam-spawns.js |
| `0xbdf54` mode 1 (`0xbe048`..`0xbe33c`) | **the tilt pass's PER-FOOT mode, READ (Viewer agent, 2026-10-01)**: only when `0xc3be4(e, 2)` == 1 or the one-shot `P+0x5df0` (else the normal is kept); points p0 / p1 = the record's `e+0x7480` / `e+0x7490` × size (`P+0x1ac` × `P+0x1b0`), turned by the yaw `P+0x54` (a proper rotation) and offset by the unit's position, each `y` probed by `0x49b50` (or left on the plane `P+0x5b4`); c = the unit's position (`[e+0x1424]`); normal = **(c − p0) × (p1 − p0)**, normalised, into `e+0x7460`. The ceiling record's normal `e+0x1080` is NEVER read in this mode | R | index.html `MOUNT` |
| `em020_00` tilt record (`.dtb` +0x74, `tiltrec.py`) | **mode 1**, p0 = **(180, 0, 150)**, p1 = **(−180, 0, 150)** → on ANY flat surface the fitted normal is (0, +1, 0) (y = (−150)(−360) − (−180)(0) > 0): **Shogun is never rolled on a ceiling**; his class writes roll = pitch = 0 on attaching (`0xdc7844` / `0xdc784c`, posture 6 at `0xdc77f8`, L5 M8) and writes no roll / pitch lock (`P+0x342` / `+0x343`: no store in his code); his origin is pinned to the ceiling (`0xbf284`) and his ceiling clips are authored hanging (root Y −230.3). ~~Khezu (mode 0) takes the ceiling's own normal → roll 180~~ (withdrawn 2026-10-05: his 180 is the shared draw's flip, `0xca06c` / `P+0x992`; section "Walls and ceilings") | R | posture-mount.md §3.5 (Khezu); index.html `MOUNT` |
| Shogun's status-7 table `0xdc80a4` (256 offsets from `0xdc807c`) | 61 targets; default `0xdc8870` = the generic unhandled-action logger `0xca050` (`(7,3)` lands there: Shogun has no Daimyo beam action). His own functions plus one shared Daimyo-band function `0xdbc82c` ((7,0xa..0xc / 0x17..0x19 / 0x30 / 0x47..0x4d): L2 M19 → M20) | R | scratchpad beamsB/run_em020_sweep.py |
| **L2 M18 is never played by Shogun** | the family's water-beam motion (Daimyo fires his beam there at f96; Shogun's and Rustrazor's PSLs bind the charge u 231 f20–59 and flash u 230 f88 on it), but in the whole Ceanataur band only Daimyo's beam fn sets `0x212` (`0xdbc3b4`; a `.text`-wide `movw #0x212` scan, 63 sites, none in Shogun's code), every setMotion id in Shogun's code is a literal and none is `0x212`, and a harness sweep of every action his command table issues (statuses 1 / 2 / 3 / 6 / 7) never sets it. **Control**: the same harness on Daimyo's (7,3) logs `0x212` and his spawn at f96 | R (negative, controlled) | scratchpad beamsB/run_em020_sweep2.py, run_em019_control.py |
| `0x6f618` → `0x3cb330` | the action-tune float getter lands in `rFreeUseParam` (vtable `0x174d378`) slot +0x4c: float i in range, else 0.0 — **upgrades em007-shells-spec §2d's INFERRED reading of that slot** | R | dev/beams/em084_00.md (agent D) |
| `0x152530` / `0x159daa0` | resource ids name their file: {hash of the lowercase backslash path, type hash}, checked on `0x8abb` | R | dev/beams/em084_00.md (agent D) |
| `0x427e0` / `0x427e8` (in `0x42744`) | the effect ground resolve's arm on **`[r4+0xec]` bit 0x10 SET** -- no vectors: Boltreaver's L9 M22 beam (mode 8, u 101, ShellScale 1.2) reaches it in the viewer (which has a stage) and its shell recording (`shell_em081_04_L9M22_none_0` + `_near`, 2026-10-01) does not. What sets the bit: NOT READ | R (the test) / the input UNREAD | soak `L9 Motion[22]` stops at f26 — **WITHDRAWN 2026-10-07 (the Withdrawn table): the record is u 605, not u 101; the bit is payload `+0x5c` bit 4** (the ground-ray section) |
| `0x329e64` / `0x329e68` (in `0x329d88`) | the placement-mode switch's **`[r4+0x76] == 4`** arm (`beq 0x329e8c`): mode 4 = the CAMERA-ATTACHED placement (section "Effect placement mode 4" below). Recorded 2026-10-05 (the lift after Nakarkos's sets) | R | dev/effect-placement-mode4.md; **corrected 2026-10-05 -- the u 20 beam claim is Withdrawn** |
| `0x9b76d8` / `0x9b76e4` (in `0x9b75e8`, draw) | **`[r5+0x1f0] == 0`** falls into code never recorded -- Gravios's clip effect u 241 (L4 M59, bits 7 / 10 from f119) reaches it at f120 in the viewer; `add_em005_00_u241_hold80` (+ `_near`) records 0x9b75e8 40 times on the other arm | R (the test) / what leaves +0x1f0 null: UNREAD | blocks L4 M59 before its beam (f134) can be soaked |
| `0x329904` on a destroyed unit | **CONFIRMED (Viewer agent, 2026-10-01)**: u 241's long-hold recording dies because the core's walk calls +0x128 on a corpse whose vtable is the base cUnit 0x17828bc (r0 0x509f6fe0 at frame 175, `WATCH_EXEC=0x0`), so `blx 0` runs the static initialisers and `0x19a8` re-registers `aFestaMain` through `0x7abef0` (self-link written at `0x7abf2c` then `0x7abfc8`, `WATCH_WRITE=0x1844184`). proofunit.py's PASS 2 note (2026-09-25) named the mechanism: the harness deletes a unit before the core reaps it | R | task board (bug) em005_00 u241 |
| `0xb0174` / `0xb04d0` / `0xc0e14` | blends: `0xb0174(e, main, partner)` (the partner via vt+0x3d8; the weight separately by `0x72620` → `e+0x638`); `0xb04d0` takes partner B when s2 < 0 and stores \|w\| to `e+0x638`; `0xc0e14` = the target's elevation less the owner's pitch, clamped ±45°. **How `e+0x638` is consumed: NOT READ** | R | dev/beams/em024_00.md, em033_00.md (agent B) |

### Map AREAS — the stage vertex formats, the material classes and the fog (Area lane, 2026-09-24 .. 2026-10-03)

Everything the Monster Viewer's `docs/render/area.js` and `C:\MHGU-Extract\build-map-areas.py` transcribe.
Decoded against the geometry and the shader package, not inferred from names.

| what | detail | st | note |
|---|---|---|---|
| stage vertex format `0x207d603b` | stride **24**: `+0x00` f32 x3 position (game units, x0.01 -> m); **`+0x0c` normal PACKED u32** — x bits 0-9, y 10-19, z 20-29, each `v/1023*2-1`, w bits 30-31 always 3; `+0x10` f16 x2 UV; `+0x14` u8 x4 RGBA | **R** | verified on 4 models over 2 maps: 100.0% unit length, median dot with the geometric face normal **+0.991..+0.996**, dot > 0.9 on 95-100% of triangles. `mod-stage-normals.py` |
| stage vertex formats `0x49b4f02d` / `0x926fd032` | stride **28** / **32**; **normal is snorm8 xyz at `+0x0c`**, NOT the packed word — the three formats do not share an encoding. The rest of their bytes is **UNREAD** | **R** (the normal) | median dot **+0.996** / **+0.993**, 100% unit. The Volcano `m08a10d` mixes all three in one model |
| `.mod` mesh record, vertex addressing | a vertex is at `vertexBuffer + mesh[+0x10] + (mesh[+0x0c] + i) * stride` — **`+0x10` is the vertex REGION, `+0x0c` the first vertex WITHIN it**. Only shows up on a model that MIXES formats; a single-format model has `+0x10` zero everywhere | **R** | control: `m08a10d` meshes 3 and 4 share region 36932 at first 0 and 57. Header: `+0x0c` vertexCount, `+0x10` indexCount, `+0x14` triangleCount, `+0x18` vb size, `+0x30` mesh table, `+0x34` vb, `+0x38` ib, `+0x40..` bbox; mesh (48 B): `+0x02` vcount, `+0x0a` stride, `+0x0b` fmt id, `+0x14` fmt hash, `+0x18`/`+0x1c` index start/count (triangle STRIP, `0xffff` restart) |
| **`revil_toolset` drops stage normals** | `mod_to_gltf` emits only POSITION / TEXCOORD_0 / COLOR_0 **for the 24-byte format**; it writes NORMAL itself for the 28- and 32-byte ones | **R** | measured: the Volcano gets NORMAL on 31 of 48 prims from `mod-stage-normals.py`, exactly the 24-byte meshes. Any area pipeline on `mod_to_gltf` alone has no normals for the lit terrain |
| material classes | `5fb0ebe4` = `nDraw::MaterialStd` (lit), `23823d1b` = `nDraw::MaterialConstant`, `3c8994e1` = `nDraw::MaterialConstantFog` (both unlit) | **R** | resolved from `main.rodata` strings by `path_hash`; all three were already in `build-materials.py`'s `CLASS_NAMES` |
| material class `0854d484` | one material in Primal Forest `m13a01d`. **UNRESOLVED** — hashes to no string in `main.rodata`, `main.data`, `main` or the shader package | **UNREAD** | falls through as unlit, which is safe but unjustified |
| **`FDiffuseVertexColorPLS`** — the vertex colour | `sd = lerp(mc.vertex_color, FAmbient(mc), max(light_mask.x, light_mask.y) * CBAmbient.fLightMapMask)`; `dif = CBMaterial.fDiffuseColor + $Globals.fPreLightScale * mc.vertex_color`; **`mc.diffuse = (mc.diffuse + sd) * dif * mc.occlusion`** | **R** | `efx/shader/mfxprog.py`. **The vertex colour is baked light the ROM ADDS — it is NOT a multiplier.** A zero vertex colour means "no baked light", never black. **CORRECTION: `area.js` multiplied by it from 2026-09-24 to 2026-10-03**, which is still what the Monster Viewer ships. NOT read and not applied: `fPreLightScale`, the light_mask lerp, `mc.occlusion`, and whether the 127 ceiling seen in every area means a /127 scale |
| `FConstantOutputLite` / `FConstantOutput` | `Lite` returns `color` unchanged; the plain one is an sRGB -> linear conversion | **R** | so the UNLIT path takes no vertex colour at all |
| the FOG, whole | `FFogDistance`: `dist = length(wposition - CBViewProjection.fCameraPos)`, `O.effect = FDistanceFog(dist)`, `addfactor = fFogColor * effect`, `mulfactor = 1 - effect`. `FBlendFog(color, I, diffuse) = float4(color.xyz * I.mulfactor + I.addfactor, color.w)`. Variants: `Linear` `saturate((d - fFogStart) * fFogInvRange) * fFogDensity`; `Exp` `(1 - exp(-d*inv)) * den`; `Exp2` `v=d*inv; (1-exp(-v*v))*den`; `ReverseExp` `exp(-1/(d*inv))*den`; `ReverseExp2` `v=1/(d*inv); exp(-v*v)*den`; the family base `FDistanceFog` returns **0** | **R** | `CBFog` (0x215) = `fFogColor, fFogDensity, fFogHStart, fFogHInvRange, fFogStart, fFogInvRange, fFogHColor, fFogHDensity, fFogHUVScale, fFogHSlopeBias, fFogHUVOffset, fFogDiffuseBlend` — name for name what the `.sdl`'s ColorFog sets |
| **which surfaces take fog** | `PS_MaterialConstantFog` calls the **`FFog` FAMILY**, whose base variant returns effect 0. Which variant runs is a feature selection and **NO stage material in the game makes it: 2,714 materials over 289 stage `.mrl` files select no `FFog` / `FDistanceFog` / `FHeightFog` / `FBlendFog` variant at all** | **UNREAD** | so the binding is the engine's, at draw time. **This is why fog is off by default in `area.js`** |
| height fog | the base `FHeightFog` is an EMPTY function, and **no area's ColorFog sets a single `fFogH*` field** — checked across all 240 area schedules | **R** | height fog is off by the ROM's own doing, not an omission |
| `ColorFog.mDistanceType` -> the variant | INFERRED to index the `FDistanceFog` family (base `0x4f8`, Linear `0x4f9` .. TableVTF `0x4ff`), and `fFogInvRange` = `1/(mEnd - mStart)` | **INFERRED** | the `.sdl` -> `CBFog` write lives in the executable and was not traced. Corroboration over all 240 schedules: the value is only ever 1 (223 areas), 2 (3), 3 (1), 4 (8), 5 (2) — inside the family's range, never 0 (fog off, and every area has fog) and never 6/7 (which sample `tFogTable`, and no area arc ships one) |
| area ground height | **corrected 2026-10-05 (Withdrawn: "no collision for these areas")**: every hunting area's collision ships in `romfs\nativeNX\loc\arc\stage\map_com\mNN.arc` -- 27 arcs, 962 rCollision (`SBC\xff`) files, 192 areas; Forlorn Arena's `m17a01d-a-g00` floor under the origin is -312.6, agreeing with the measured -3.142 m to 1.6 cm. `build-map-areas.ground_under()` still MEASURES the visual model | R (files) / measured (viewer) | posture-mount.md section 10 |
| areas are **open shells** | seen from a free overhead camera an area has holes you can see the background through — proven by setting the scene background magenta and watching the "black" patches turn magenta (Primal Forest `m13a01`) | observed | the terrain is authored for the game's own camera, which never looks down from 300 m. Not a pipeline fault, and nothing to fix |
| `uAmbientLight` — the class | DTI at `0x211a3fc`, registered at `0x929518` with size `0x450`; ctor/dtor `0x920c??..0x920d4c` / `0x920d78`, property table `0x920e28..0x920fc8`. Members: **`+0x3b8` `mLightMapAtten`**, **`+0x3bc` `mEnvMapAtten`** (ctor default `0x3f400000` = **0.75**), **`+0x3c0` `mpEnvCubeTexture`** | **R** | property records are built in code: `bl 0x7b875c` then `prop[0]=name`, `prop[4]=type`, `prop[0xc]=&member`. Names at `rodata+0x182213..0x18225f` |
| **`mpEnvCubeTexture` has a class DEFAULT** | the ctor loads `system/texture/DefaultCube_CM` at `0x920cdc..0x920d44` (string at `rodata+0x182221`, inside uAmbientLight's own property cluster) and stores the result to `+0x3c0` | **R** | **so the 178 areas whose `.sdl` never sets the property are NOT cube-less** — they get this one, as the 59 that name it do. `area.js resolveSceneCube` returned null for them until 2026-10-05, which left the global reflections AND the SH ambient off in three quarters of the game |
| the stage ambient SH — where it lives | **27 float32 at `+0x10` of a `*_CM` .tex**, as NINE PER CHANNEL in R, G, B order, then zero padding (`f[27]` exactly 0). `DefaultCube_CM` carries L0 = (1.908, 1.999, 2.085) | **R** | present on every stage `_CM` sampled at both texture sizes. The viewer's `rom/ambient.js` said the coefficients "are NOT the ROM's, and cannot be" — true for a MONSTER, which carries no lighting, and **wrong for a STAGE** |
| the order WITHIN a channel | standard `(l, m)`: **a0 Y00, a1 Y1-1, a2 Y10, a3 Y11, a4 Y2-2, a5 Y2-1, a6 Y20, a7 Y21, a8 Y22** | **R** | from the ROM's own SH projector at **`main.text+0x13b6d90`**, which evaluates the nine for a direction (`s8`=x, `s14`=y, `s12`=z) and writes them to three per-channel blocks of nine in exactly this order: `0.282095`, `-0.488603*y`, `+0.488603*z`, `-0.488603*x`, `+1.09525*x*y`, `-1.09525*y*z`, `0.315392*(3z^2-1)`, `-1.09525*z*x`, `0.546274*(x^2-y^2)`. Pool `0x13b7008..0x13b7020`. The packer below consumes the same nine at the same offsets |
| the frame is **(-x, -y, +z)** | the sign pattern `(+,-,+,-,+,-,+,-,+)` above is exactly the substitution `(x,y,z) -> (-x,-y,z)` applied to the standard basis | **R** | and independently the frame a 48-way search of signed axis permutations picks when the stored nine are compared against a projection of the cube's own pixels. Code and data agree. Confirmed again on the result: the packed set evaluates BRIGHT facing +y (0.65/0.74/0.83) and dim facing -y (0.35/0.33/0.31) — sky above, ground below |
| **`CBAmbient.fSHCoef` — the fill** | `main.text+0xbced0c..0xbcee4c`, constants in the pool at `0xbcefc4..0xbcefe4`. Per channel `ch`, from that channel's nine `a0..a8`: `fSHCoef[ch] = (-K1*a3, -K1*a1, +K1*a2, K0*a0 - K20*a6)`; `fSHCoef[3+ch] = (+K2*a4, -K2*a5, +K2Z*a6, -K2*a7)`; `fSHCoef[6].xyz = +K22*a8` per channel, `.w = 1.0`. The 28 staged floats are copied word for word to the constant buffer at `r6+0x20..0x8c` | **R** | **K0 `0.2820948` = 1 x Y00, K1 `0.3257350` = 2/3 x Y1, K2 `0.2731371` = 1/4 x Y2, K20 `0.0788479` = 1/4 x Y20, K2Z `0.2365437` = 3 x K20, K22 `0.1365685` = 1/4 x Y22** — so the stored nine are RADIANCE coefficients and **the ROM convolves them with the Lambert cosine lobe (A = 1, 2/3, 1/4) here, on the CPU**. The result the shader returns is therefore irradiance/pi, to multiply straight into albedo. A flag at `[sp+0x1c]` selects a DC-only path (`0xbcec98`, which memsets a1..a11 to zero) |
| `getSHdiffuse` / `FAmbientSH` | `FAmbientSH(mc) = getSHdiffuse(mc.normal) * mc.ambient_occlusion`; `getSHdiffuse(vN)`: `n4 = vec4(vN,1)`; `x1 = (dot(C0,n4), dot(C1,n4), dot(C2,n4))`; `vB = n4.xyzz * n4.yzzx` = `(xy, yz, zz, zx)`; `x2 = (dot(C3,vB), dot(C4,vB), dot(C5,vB))`; `x3 = C6.xyz * (x*x - y*y)`; `x1+x2+x3`. **Only `C6.xyz` is ever read**, which is why the packed form has 27 used floats | **R** | `AppShaderPackage.mfx`. `CBAmbient`: `fAmbientColor` vec3 @0, `fLightMapMask` @3, `fEnvMapMask` @4, `fLightMask` vec2 @5, `fDeferredLightingDiffuseLuminanceThreshold` @7, **`fSHCoef` vec4[7] @8**, `fDeferredLightingLogRangeCoeffDec` @36, `fHalfLambertBlendCoeff` @37. **10,611 of the game's 10,734 stage materials select `ambient: SH`**; the other 123 take no ambient term, so the viewer hangs it on exactly the 10,611 |
| the ROM's own l=2 typo | the PROJECTOR at `0x13b6d90` uses **`1.09525478`** where the exact constant is `1.0925484` — a digit transposition — while the PACKER uses the exact value (`0.2731371 = 1.0925484/4`) | **R** | recorded because a future reader fitting one against the other will find a 0.25% discrepancy that is the ROM's, not theirs |
| the normal `getSHdiffuse` wants | a WORLD normal **in the ROM's own axes**, and glb space IS ROM space: `mod-stage-normals.add_normals` pairs each glb primitive to its `.mod` mesh row by comparing POSITIONS component for component (`abs(P - mpos).max() <= POS_TOL`), and that succeeds for every area that builds | **R** | so no flip, no permutation, uniform positive node scale; three.js world space is the same handedness again. This is the control for applying the formula verbatim |


### Walls and ceilings -- where the game finds them (research agent for the Viewer agent, 2026-10-05; posture-mount.md section 10)

Raven, 2026-10-05: "Based on in game behaviors, they know where the walls or ceilings are. We need to find that, then
define walls and ceilings using the grids." All static reads; collision layouts INFERRED where marked.

| addr | what | st | detail |
|---|---|---|---|
| `0xbde60` -> `0x49aec` -> `0x1814c0` -> `0x18154c` | the per-frame ground probe, which ALSO finds the ceiling (not an area setting) | R | posture-mount.md 10.1 |
| `0x181928` | one vertical ray from pos.y + 10000 down (constants `0x181a70..80`); reach above the unit 100, 50 with flag 8 (posture 5), 0 with flag 2 (posture 1) | R | same |
| `0x181ad4` | collects up to 16 hits, ascending height; hits flagged `& 0x1004` (water) are not recorded but their height is kept in `e+0x1074` | R | same |
| `0x181cac` | the pick: floor mode walks down from the top, skipping `0x10` hits and hits above the reach; ceiling mode (flag 1, posture 6) takes the topmost `0x10` hit, else the first within the reach; a `0x2000` hit takes the one below | R | same |
| `0x181138` | the hit record layout; the polygon flags word is attribute word 1 | R | same |
| `P+0x940..0x983` | the "next surface above" block (`0x1816c8`, `0x181838..0x181898`): `+0x944` = 1 when a hit lies above the chosen one, **`+0x980` its height (default +100000.0)**, `+0x950` its record, `+0x970` its normal. Written through `sb = P+0x940` (`strb [sb,#4]` at `0x181854`) | R | same; trap 45 |
| `e+0x1078` (= `P+0x5b8`) | the height of the next surface BELOW the chosen one (`0x181818..0x181830`) -- corrected, see Withdrawn | R | same |
| `0x4fed00..0x4ff014` | the hunting-area loader registers each collision file with `0xc44dec(.., LAYER, area, ..)` (layer at node `+0x10`, `0xc167c4` / `0xc16b80`): `-a-g00` 1, `-a-w00` 2, `-a-g00-shell` 0x10, `-a-w00-shell` 0x20, `-a-cam` 0x100 | R | same |
| `0xc14924(filter, 1, ..)` | the probe asks for layer 1 (the shells' `0x183490` pass 0x10 / 0x20): the filter test itself NOT READ, so "the probe sees only `-a-g00`" is INFERRED | I | same |
| ceiling polygons | upward-facing ground-layer polygons with flags `0x10`; the posture-6 cling test is `e+0x1068 & 0x18` | R (test) / I (attribute word = file record word2, checked on water bits) | same |
| `0xa6c6c` | the WALL finder: walks the body contacts at `P+0x7b4 + 0x20i` (count `P+0x8f0`), keeps those flagged `0x8000000` or `0x400`, returns the averaged yaw of their normals. What fills the contact list: NOT READ | R | same |
| `0xd141f0` / `0xd11cf0` | Khezu accepts a wall only if the ground 1.3 x PushHitRadius (350) into it -- or `P+0x980` for a `0x8000000` wall -- is >= 900 above the floor; then `[e+0xcac0]+0x10` = dir + 0x8000 | R | same |
| `0xbf284` (`0xbf330..0xbf364`, re-read) | on the wall: `P+0x44 <= P+0x980 - TenjoOfs x size` -- **TenjoOfs is the gap kept below the ceiling while on the wall** | R | same |
| `0xd13884` | attach to the ceiling once `P+0x44 >= P+0x980 - (TenjoOfs + 30) x size` and `P+0x944 == 1`; at posture-6 entry `P+0x44 = P+0x980` and the `+0x950` / `+0x970` record is installed: the origin sits ON the ceiling pick | R | same |
| `0xb6b090` (vtable `0x178d6c0`) | the rCollision loader: header and array order READ; triangle / vertex / attribute layouts INFERRED (196,461 of 211,142 ground triangles' stored normals match their winding) | R / I | same |
| Forlorn Arena (m17a01) | **no `0x10` polygon and no surface above the floor (`P+0x944` = 0): the game gives Khezu NO ceiling there**; its only `0x400` polygons are a low ring (y -513..-10) that fails the 900 test: **no climbable wall either**. 48 areas do have `0x10` ceilings (m07a09d 1500, m12a08d 5000, m08a03d 1340..2003, m22a08d 550, m01a09d 2522, ...) | R (files) | posture-mount.md 10.3 table |
| ~~OPEN~~ RESOLVED 2026-10-05: the ceiling roll | the up-facing `0x10` polygons are what the game expects: the 180 is NOT the surface normal's. His roll / pitch words are 0 on a ceiling (class `0xd12c20/28`, `0xd13dc0/dfc`, `0xd18b04/0c`; the tilt pass eases toward 0 on a flat ceiling); the flip is added in the shared draw (next rows) | R | posture-mount.md section 11 |
| `0xca06c` (every enemy's vtable +0xcc, 92 vtables) | builds the DRAWN rotation from the angle copy `e+0xfe8/0xfec/0xff0` (made from `P+0x50/54/58` by `0xc2710` / `0xc2788`, run each frame from `0xa5fc8` / `0xada80`); **adds pi to the roll** (`0xca0d8..0xca0f4`, literal `0x40490fdb` at `0xca114`) when vtable +0x3bc says so, then `0x8a4dfc` | R | posture-mount.md 11; closes "the drawn model's matrix: NOT READ" (sections 1.2 / 9) |
| `0xaf30c` (vtable +0x3bc) | true when posture == 6 and `P+0x992` != 0 | R | same |
| `0x8a4dfc` | the rotation in the order at `e+0x38`, which `0xa50dc` resets to 4 every frame; case 4 (`0x8a5190`) = Ry . Rx . Rz -- so the flip is 180 about the model's own forward axis, applied first | R | same; index.html MOUNT ('YXZ') |
| `P+0x992` | the ceiling flip switch: Khezu writes 1 after each of his 32 posture-6 entries (all 45 of his stores write 1); script op 0x36 (`0x9fab8`) sets it; the posture setter `0xbc7f4` (`0xbc89c`) and `0xbc984` / `0xbca24` clear it. Shogun never writes it (direct stores; his scripts' op 0x36 NOT checked) | R / I (Shogun) | same |
| `e+0x7452` / `e+0x7453` | the tilt pass's normal gate: `0xa50dc` sets 7452 = 1, 7453 = 0 every frame; `0xadf5c` keeps 7452 for posture 6; the script reader `0x9ee80` clears both (op 0x27); 16 of Khezu's posture-6 handlers clear it each frame (world up), 8 follow the polygon normal -- a flat ceiling targets pitch 0 / roll 0 either way | R | same 11.3 |

### Nakarkos -- the effects his class code requests (research agent for the Viewer agent, 2026-10-05; dev/em084-class-effects.md)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x16a2848` / `0x16a2858` | uEm084_00's c / u id→key tables, overlapping by one word: c {-1, 800, 1600, 1601} (ids 1001..1003), u {-1, 90, 94, 91, 95, 92, 96} (1001..1006); body vtable 0x17f11fc +0x1cc 0x106f890 / +0x1d0 0x106f8c0 | uEm084_00 | R | dev/em084-class-effects.md §0 |
| `0x1067ed4` | the cannon-charge level machine, run at every action start from vt+0x204: flag E+0xcadc set on (7,0x32), cleared on (7,0x33-0x35), (10,0xaf), group 11; levels E+0xcb05 → u 90/94, 91/95, 92/96 (handles E+0x26300/+0x26304) | uEm084_00 | R (emulated) | dev/em084-class-effects.md §2  transcribed: motion-states.js CHARGE_EFFECTS em084_00, the State rungs Charge 1 / 2 / 3 (2026-10-05) |
| `0x106d8f4` ← `0x1076c54` | the shot (0x10767c0, all six shot actions) stops the charge pair at L2 M82 frame 285 (0xb0968 op 1, literal 0x1076cd0) | uEm084_00 | R | §2 |
| `0x106af68` / `0x106eff4` / `0x10698d0` | c 800 ×3 at L3 M65 (vt+0x2a8 motion test 0x341, latch E+0xcb20), placed at tune vecs 1..3 × size, yaw-turned; stopped at every action start | uEm084_00 | R | §3 |
| `0x1067be0` / `0x106bc08` | (10,0x6a) → c 1600 (unstored) + c 1601 (E+0x26314, latch E+0x26318); vt+0x208 stops c 1601 off L3 M23/M24/M76/M77 | uEm084_00 | R | §4 |
| `0x107bd98` / `0x107bdac` | uEmOstgaloaArm's pels: +0x1358 = em084_00c_l/_r (0x837c/d), +0xb624 = em084_00u_l/_r (0x837e/f) — every arm request and arm PSL bit resolves in the arm's lists | uEmOstgaloaArm | R | §0 |
| trap | class-requests.json's vtables for uEm084_00 (0x17f11f8) and uEmOstgaloaArm (0x17f6494) are 4 bytes low (em007 again); class-request-sites.json's "1032 → 3" is the field P+0x408 | — | R | §0 |

### Nakarkos -- his non-beam shells (research agent for the Viewer agent, 2026-10-05; dev/em084-shells-spec.md)

Census: 22 submits (`0x48b884`) and 31 setup allocations in the band, the shell classes included; control: the same census finds the beam sites `0x106f73c` / `0x107cb78`. Both arms' shells use ef slot 1 = `em084_00u_r` (the .shl lists), never `u_l`. No issuer found for arm (7,0x27) / (7,0x28) / (7,0x2d) / (7,0x2e) or the form setters (7,0x1c..0x1f).

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x175c3e8[0x16c..0x173]` | Nakarkos shells: sp_00 base00, sp_01 base01, sp_02 base02, sp_06 base06, sp_11 (setup base01, vtable base11's 0x402fd8 / 0x40308c), sp_13 base13, sp_31 base31, sp_48 base48; vtables 0x17f6918 / 0x17f6a94 / 0x17f6c04 / 0x17f6d80 / 0x17f6ee8 / 0x17f705c / 0x17f71d8 / 0x17f7338 | uShellEm084_* | R | dev/em084-shells-spec.md §1 |
| `0x107c0cc` / `0x107c628` | arm shell00 / shell01 spawners, index → mode by kind (and rank for shell00) | uEmOstgaloaArm | R (emulated) | §2 |
| `arm+0xcb30` / `E+0xcb0c/0xcb0d` / `0x106d994` | tentacle form byte, the body's per-side copy, and its writer: (7,0x1c..0x1f) → 0..3, (7,7) → 1, (7,8) → 3; many actions clear | both | R (emulated) | §3 |
| `0x17f6420` / `E+0xcb30..+0xcb6c` / `0x1069e78` | the body's motion-record table: per action, at a frame of a body clip, layer clip L2 M70..73 on layer type+2, shell at layer frame ≥ 58, part-break gate from `.dtp` A rows 3/1/0 | uEm084_00 | R | §4b |
| `0x106f354` | sel → shell13 8..22 / 0 / 1, shell48 0 / 1, shell00 65 / 66 | uEm084_00 | R | §4b |
| `0x106aa48` | shell06 aura manager (5 / 6 arm sockets, 0 body) | uEm084_00 | R | §4c |
| `0x1088e38` / `0x108aba8` / `0x1089384` / `0x108a330` / `0x108b2e8` | second generation: sp_00 / sp_13 landings, sp_01 end, sp_11 create, sp_48 +0x15c | uShellEm084_* | R | §6 |
| `0x1088c5c` / `0x10891dc` / `0x1089c08` / `0x108a04c` / `0x108a954` / `0x108ae98` / `0x108b118` | the seven readers | uShellEm084_* | R | §8 |
| trap | `dev/beams/em084_00.md`'s "arm actions in EMC group 0 s35/s36" — those numbers are also body actions (§9) | — | I | §9 |

### Nakarkos -- who orders the arms, and what plays beside them (research agent for the Viewer agent, 2026-10-05; dev/em084-arm-pairings.md)

The arms run NO command streams; every arm action is ordered by body code. Transcribed: docs/render/monster.js ROM_ARM_PAIRS (the body's and the other arm's clip beside each arm clip), beam-spawns.js em084_00 (the unissued (7,0xf) rows dropped).

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x825f8` / `0x70fe0` / `0x709a0` / `0x70460` | command table binding: group table `[u+0x75f4]+0x68` → `+0x72f4`, start group 0 stream 0; `+0x75f4` written only by `0x709a0`, registered by the shared loader `0x70460` (slot `+0x76ec/+0x76f0`); the tick `0x82d20` needs a non-zero cursor | shared | R | dev/em084-arm-pairings.md §1 |
| `0x107ba5c` | uEmOstgaloaArm vt+0x148: its own loader, never `0x70460` / `0x709a0` → **the arms run no EMC**; em084_00_cmdtbl groups 0 and 1 are the body's | uEmOstgaloaArm | R | §1 |
| `0x107f4c8` ← `0x106e238` / `0x106e2d4` / `0x106e380` / `0x106e4dc` | the only route from the body to an arm action (4 funnels; arm by r1; refusals on `E+0x196c9` / `E+0x26219` / `P+0x1bb`) | uEm084_00 | R | §2 |
| `0x1074870..0x1074c34` | single-arm orders: setMotionC L0 M1 / M50, order one arm, hold until that arm's pair (`E+0x13fe0/1` L, `E+0x20b30/1` R) changes | uEm084_00 | R | §2, §3 |
| `0x107fe34` | arm idle (0,0)/(0,1): `l_0`/`r_0` M1 when the body's stance `+0xcac4` == 1, else M50 | uEmOstgaloaArm | R | §2 |
| `0x1071564` | body (2,0xb): turn table `0x16a2998` (L0 M1 / M2 / M3); M2 → L (2,3) + R (2,2), else R (2,3) + L (2,2) | uEm084_00 | R | §3 |
| `0x107847c` / `0x1078150` / `0x1078870` | body (7,0x6f) / (7,0x6e) / (7,0x70): timer-stepped arm sequences of (7,0x29) / (7,0x2a) / (0,7) on L0 M50 | uEm084_00 | R (driver with timer) | §3 |
| `0x107e304..0x107e388` | form → group: 0→2, 1→4, 2→5, 3→3, 0xff→0; part state 3 → 1 | uEmOstgaloaArm | R | §5 |
| negative | arm (7,0x0f/0x10/0x11/0x12/0x26/0x27/0x28/0x2c/0x2d/0x2e/0x07/0x08/0x1c..0x1f): no issuer by body code, EMC, the arm, or direct write | — | R (with controls) | §4 |

### Effect placement mode 4 -- the camera-attached placement (research agent for the Viewer agent, 2026-10-05; dev/effect-placement-mode4.md)

Blocks Nakarkos's charge partners u 94 / 95 / 96, u 202, c 101 (L0 M14 / M63), L2 M81 / M82; predicted for em024 / em050 / em083's mode-4 records. All static reads.

| addr | what | st | detail |
|---|---|---|---|
| `0x31bd54` / `0x31bd64` (in `0x31bbe8`) | the mode copy: payload `+0x36` → block `+0x46` (descriptor `+0x76`); ctor default 3 (`0x31b780`). Same table: `+0x38`→`+0x48` (0x31bdc0), `+0x3c`→`+0x4c` (0x31bee0), `+0x42`→`+0x52` (0x31bf94), `+0x52`→`+0x62` (0x31bfb8), `+0x58`→`+0x68` (0x31bc04), `+0x86`→`+0x96` (0x31c468) | R | dev/effect-placement-mode4.md §1 |
| **mode 4** | **camera-attached placement**: position = eye + offset in the camera's (u×f, u, f) basis, re-placed every frame (state 0); the camera = sCamera viewport k, first set bit of payload `+0x86` with an active viewport | R (arithmetic) / name I | §2 |
| `0x1832188` → `0x211f504` | the **sCamera** singleton (DTI "sCamera", 0xdf0; ctor store `0xb87498`); viewports `G+0x30+k·0x1b0` (8, "sCamera::Viewport" 0x1b0), active byte vp`+0x30`, camera vp`+0x24`. Harness and viewer never set it: the recorder reads `.text` (camera 0x3a000048), the viewer zeros | R | §2, §5 |
| `0x31d298`..`0x31d398`, `0x31d470` | 0x31d16c's inline viewport lookup: `[sp+0x38]` = camera (0x31d394), `[sp+0x3c]` = effective mode (0x31d38c, upgrades row 344's UNREAD); no camera → `out+0x70 = 0`, return | R | §2 |
| `0x31f1ac`..`0x31f3f0` | mode 4's position: d = cam`+0x60` − cam`+0x40`, basis `0x7c8f04(u, f, 0)`, eye = −R·t of cam vt+0x4c, `V.row3 := offset; V *= B` | R | §2 |
| `0x31f400`..`0x31f4a0`, `0x31f7e8`..`0x31f894` | space 1 + mode 4: aim from the camera point at the parent (joint matrix row 3, or parent `+0xe0` for joint −1) via `0x31fc94` (UNREAD) | R / 0x31fc94 UNREAD | §2 |
| `0x7c8f04(out, u, f, pos)` | basis rows (normalize(u×f), u, (u×f)×u), row 3 = pos, w 1 | R | §2 |
| `0x1c33c` / `0x7c2f70` | camera vt+0x4c (uFesta/uQuest/uSubScene/uVillageCamera vtables 0x1729c28 / 0x1729d0c / 0x1729d90 / 0x1729e10): `0x7c2f70(out, +0x40, +0x60, +0x50)`, a look-at (eye, target, up) | R (args) / "view matrix" I | §2 |
| `0x31d074(desc)` | mode ≠ 4 → 0; else the camera of the first active viewport in `+0xc6` | R | §6 |
| `0x328d9c` (core vt+0x68) | the mode-4 RANGE test: `+0xe8` (payload `+0x58`) 0 → 1; else \|pt − parent`+0x40`\| (÷ parent`+0x60` unless `+0xd2`) ≤ range, pt = vt+0x64 | R | §6 |
| `0x3293c0` / `0x3295fc` | its callers, mode 4 only: start deferred (`core+0x30 = 1`) while out of range; per frame, out of range with `+0x18d` → units ended | R | §6 |
| `0x42aac` (core vt+0x64) | the range point: `*0x187ea38` → `0x275dc0` (`mgr[+0x1c + 4·[*0x18858a8+0x30]]`) → its `+0x40`; none → the camera eye from vt+0x4c. No null checks | R / "hunter" I | §5 |
| `0x1068840`..`0x106891c` | Nakarkos's pair: both requests share params `E+0xb640`; `+0xb648 = 3` before the first, 0 after the second — not the cause of u 94's mode | R | §3 |
| transcribed | the game's camera and hunter: docs/render/rom/effect/host.js `installGameCamera` / `setGameCamera` (live.js feeds the viewer's camera and the invisible target each frame before the units step); efx/efx_emu.py builds the same after the static initialisers. Lifted from recordings 2026-10-05: 0x42aac, 0x7c8f04, 0x1c33c, 0x275dc0, 0x7c2f70, 0x3f772c, 0x31fc94 (lift-effects.sh lifted-added line); Nakarkos's mode-4 records run | R (layout) / 0x31fc94 meaning UNREAD | this section |
| `0xa55ea8` / `0xa55ed4` | particle-generator base destructor (called from 0xa99530, 0xaa8c68, 0xa825a0); its arm for +0xb0 != 0 and +0xed & 4 is UNRECORDED: the viewer reaches it releasing Nakarkos's c 131 while the charge pair runs (Charge -> Enraged) -- a release the game never makes (c 131 is a clip record, dev/em084-c131.md); the branch stays unrecorded for other records' stops | R (code) / the state that sets it NOT READ | board; dev/em084-c131.md (pending) |

### Nakarkos -- c 131 and his PSL enable word (research agents for the Viewer agent, 2026-10-05; dev/em084-c131.md, dev/em084-psl-mask.md)

Transcribed: docs/effects/em084_00.json c 131 `when: clip` (was `calm`), CLIP_EFFECTS em084_00 'L0 Motion[67]' bit 1.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `em084_00_0.psl` slot 67 bit 1 | em084_00c SEQUENCE 131 (em084_00_005, joint 4, end 1, +0x3b 0) on L0 M67 f0-19; bit 0 = c 123 at f20. The only live request of c 131 | uEm084_00 | R | dev/em084-c131.md §2a/§3 |
| `em084_00_0.psl` slots 15 / 64 / 65 | PSL blocks with NO motion: em084_00_0.lmt pointers 15/64/65 are 0 (19 motions: 1-5 8 9 14 17 18 40 41 50-52 59 63 66 67); slot 15 binds c 131 bit 0 + c 135 bit 1 f0-379 — dead | uEm084_00 | R (lmt) / I (never plays) | dev/em084-c131.md §3 |
| `0x1073214` / `0x1073604` | group-6 dispatcher (table 0x107323c, offsets from it): (6,0x33) → 0x1073424, (6,0x34) → 0x1073438, both 0x1073604(e,1,r2) → L0 M67 (0xafe84 0x43 at 0x1073668), arms (1,0x34) / (1,0x38); r1 0 → L0 M18; clip end → vt+0x3dc | uEm084_00 | R | dev/em084-c131.md §3 |
| `0x106cae8` | uEm084_00 vt+0x13c (PSL enable word): base 0xca170, then L3 M63 (0x33f) |= 0xf8000; L2 M23 (0x217) on (7,n≤7, 0xfb bit n) |= table 0x159bff0[n] (0x38000 ×6, 0x1c0000 ×2); L0 M1 on (13,0) with [P]+0x1a1==4 |= 0x38000. Clears nothing — bits 0-5 always on | uEm084_00 | R (emulated) | dev/em084-c131.md §2b |
| `0x6ff6c` gate | the PSL start refuses (returns 0, no request) when action == (12, 0xff) (0x6ffac..0x6ffd0); no rage/tired/rank test; sel from 0x31c980 = 1 (0x31c9fc) | shared enemy | R (emulated) | dev/em084-c131.md §2a |
| `0x106f9e0` | uEm084_00 group-0 dispatcher: numbers 0/1 (idle by stance), 7 (0x106fb44); every other number — incl. (0,2), the shared tired idle — goes straight to vt+0x3dc 0x75168 | uEm084_00 | R | dev/em084-c131.md §3 |
| trap | em084_00 c 131 `calm` (docs/effects/em084_00.json) was an export choice, never a read: c 131 is PSL-bound (L0 M67 f0-19) with no rage/calm test anywhere on its path; the rage hard-release is not a game behaviour | — | R | dev/em084-c131.md §4 |
| trap | the .dtp break-row column "131" (part 4) is a GROUP id; the break key is 999+5·part+level (u 1021/1023) — never c 131 | — | R | em084-class-effects.md §5, em084-c131.md §2d |
| `0x106cae8` | **uEm084_00 vt +0x13c** (body vtable 0x17f11fc; +0xf0 base 0xca52c), extent 0x106cae8..0x106cbb0: 0xca170, then L3 M63 (0x33f) \|= 0xf8000 always; L2 M23 (0x217) action (7, n), n <= 7, n != 2 (0xfb) -> table 0x159bff0 {0x38000 x6, 0x1c0000 x2}; L0 M1 \|= 0x38000 only if 0x6fe88(E, 13, 0) and P+0x1a1 == 4. Reads no stance / charge / form / map (emulated control) | uEm084_00 | R | dev/em084-psl-mask.md §1-2 |
| `0x107a250` | uEm084_00 group-13 action (13, 0): phases (P+0x1a1, table 0x107a2d0) L3 M4 -> L0 M17 -> posture 4 + 0xbf62c/0xbf700, wait 90 -> **L0 M1 with PSL bits 15-17 (c 140 debris)**, wait 300 -> L0 M1 re-set without them; tail 0x107a4f4 (P+0x1a2, G+0x50, 0xaa7c4) UNREAD | uEm084_00 | R (phases) / I (meaning: dive and buried wait) | dev/em084-psl-mask.md §2-3 |
| `0x10755d4` | (7, 6) / (7, 7) via group-7 table 0x1073a74: angle-picked turn 0x7a258 on table 0x17f1684 whose side rows hold 0x217 (L2 M23) -> the word's bits 18-20 (u 205 / u 206) | uEm084_00 | I (row choice 0x794f0 not read) | dev/em084-psl-mask.md §3 |
| `0x107f0e4` / `0x107f0d4` | **uEmOstgaloaArm vt +0x13c / +0xf0** (vtable 0x17f6498): per arm motion l/r_2 M1/5/6/13/14/28/50/51/86 by body action (7, 0x44/45/69/6a/9b/9c -> 15-17; 0x4a/4b -> 18-20) and arm action (table 0x107f398); M92/M93 by skull form -> table 0x1592ae8 {0x38000, 0x1c0000, 0xe00000, 0x7000000} | uEmOstgaloaArm | R (arm+0xcadc = body is I) | dev/em084-psl-mask.md §6 |
| trap | Nakarkos's c 140 (`em084_00_008`, rock models cm202_020_g) on L0 M1 is NOT an idle effect: the class enables bit 15 only in the buried hold of (13, 0). Every other bit 0-5 of his body PSLs (all the c 135 bindings) always fires | — | R | dev/em084-psl-mask.md §3 |
| transcribed | the enable word: docs/render/psl-mask.js CLASS_MASK.em084_00 (body lists only; pslMask returns null for l_N / r_N), PSL_MASK_MONSTERS, CLIP_ACTIONS em084_00 '2|Motion[23]' (2026-10-05, dev/em084-psl-mask.md; emulated, identical words) | R | psl-mask.js |

### Nakarkos -- the tentacles' hit zones (Viewer agent, 2026-10-08)

Raven: "Can you double check if Nakarkos tentacles have a hit zone table or not".

| addr | what | class | st | detail |
|---|---|---|---|---|
| `enemy\body_data\em084_00_arm_left_bodydata` / `_arm_right_bodydata` | the arms' OWN capsules: 764 B, 17 records (16 + the 0xFFFF terminator), identical left and right. Slot (+6): **0** bones 11-12 (the tip, 4 capsules), **1** bones 4-10 (the middle, 9), **2** bones 0-3 (the base, 3). Flag word (+0xa) `0x804` / `0x884`: no bit of `0x152`, so the common attack types COUNT them (0x16bc54) | uEmOstgaloaArm | R (the file) | this row |
| `enemy\dt_tune\em084_00_dttune` (+ `dt_base\em084_00_dtbase` / `_dtbparts`) | the BODY's damage table: 2 tables x 8 rows, the body's 7 zones (Back, Shell, Head, Fin, Body, Blowhole, Weakpoint) + an empty row 7. ~~the ONLY damage table in the arc; no arm dt_tune / dt_base file exists~~ **WITHDRAWN 2026-10-08 (the Withdrawn table): the arc also ships `ems099_00_dttune` / `_dtbase` / `_dtbparts`, and the arm loads the first two** | uEm084_00 | R (the file) | docs/hitzones.json em084_00 |
| `0x107bfb4..0x107bff4` (arm loader `0x107ba5c`, extent `..0x107c02c`) | res **`0x8390` = `enemy\dt_base\ems099_00_dtbase`** → `arm+0x75e8`, **`0x8391` = `enemy\dt_tune\ems099_00_dttune`** → `arm+0x75ec` via `0x70960` (its ONLY caller); fixed ids, both kinds. Also `0x838c/d` arm bodydata → `+0x75cc` (`0x70924`), `0x838e/f` cambodydata → `+0x75d0`, `0x838a` arm_attackdata → `+0x75d4`, `0x838b` arm_hitsize → `+0x75dc`; no dtbparts (`0x8392`) | uEmOstgaloaArm | R | dev/em084-arm-hitzones.md §1 |
| `ems099_00_dttune` table 0 rows 0 / 1 / 2 | **THE ARM'S HIT ZONES**, slots tip / middle / base: cut/impact/shot **63/63/35** fire 15 thunder 10 dragon 20; **36/36/25** fire 5 dragon 10; **15/15/10** no element; stun / exhaust 0. ONE block (header byte 0x12 = 1, so `[dt+0x10]` = 0 and `0xbaafc` is a no-op): no state switch | uEmOstgaloaArm | R | §2 |
| `0xbaaa4(E, slot)` / `0xbab38` / `0x57684` | the hit's row: every handler passes `ldrb [rec,#6]` → `[[E+0x1428]+0x418+4*slot]` of the STRUCK unit (slot >= 8 → vt `+0x314`); the reset writes `P+0x418+4k = [[E+0x75ec]+0x64]+0xc + 10k`; the dtt loader puts table 0 at `[dt+0xc]` (file: 0x38 hdr, u32, 0x50 parts, hdr[8] preamble, 0x50) and table 1 at `[dt+0x10]` only when hdr[0x12] == 0 | shared | R | §2 (closes hitzone-capsules.md's "where the handler reads the row") |
| `0x107b440` → `0xc9df4` → `0xad4e0` → `0xa4b90` → `0xbab38` | the arm's activation (vt `+0x18` `0x107b3a4`) resets its rows from its own `+0x75ec`; no other meat call or `P+0x418` write reaches an arm (Nakarkos code: only the body's `0x1069c08` / `0x1069c18`, on the body) | uEmOstgaloaArm | R | §2 |
| `arm+0x7648` / `0xadd7c` | the arm's setup writes `+0x7648 = 1` (`0x107b3c4`; the only writer besides the ctor's zero `0x6db24`); the update `0xada80` then SKIPS the damage step `0xa5844` → `0x97d20`, the only HP (`P+0x370`) subtracter (`0x98a48` / `0x98b04` / `0x996e8`) -- **the arm takes no damage of its own** | uEmOstgaloaArm | R | §3 |
| `0x1066048` (body vt `+0x1e8`) → `0x106cdd4(body, side)` | before the body's damage step: left arm's `P+0x444` set → side 0 (arm `body+0xcc00`, **body part 1**), else right arm's → side 1 (`body+0x19750`, **body part 0**); copies the arm's hit block `P+0x444..0x4fc` (arm part-0 damage `P+0x488` → body `P+0x488+2*part`) and `E+0x142c..0x1431` into the body, which charges its **HP** (sum of `P+0x488`, `0x986a0` → `0x98b04`) and part counter `P+0x3be+12*part` (`0x98690`) | uEm084_00 | R | §3 |
| `0x107d704` (arm vt `+0x2a8`) | arm group word `P+0x3b4` = 0 each frame, bit 15 set on motion `0x21b` / `0x21c` (l_2 / r_2 M27 / M28) when `0xb0968(arm, 2, 0, 120.0, 0.0)` passes → record 1 (tip sphere r330, mask `0x8000`) off; no meat call | uEmOstgaloaArm | R (mode 2 I) | §4 |
| `0x107ddbc` (arm vt `+0x344`) / `0x106ef7c` / `0x16c560` | 0 when `[attack+0xb5]` bit 5 (set after a hit on em `0x63` arm or `0x54` body) or any of body / left / right holds `P+0x444`; INFERRED one Nakarkos unit per swing / frame; its consumer NOT READ | uEmOstgaloaArm | R (code) / I (purpose) | §4 |
| VIEWER (2026-10-09) | **baked**: build-hitzones.py `bake_attached` (`--attached em084_00` updates only this monster; table 0 at 0x8c + header byte 8, the loader 0x57684's own layout) -> docs/hitzones/em084_00_left.bin / _right.bin and hitzones.json `attached` {tables, names, bodyPart, prims, slots}; index.html heatEach paints each tentacle from its own zones in the damage and hardness maps and the charts list Tentacle Tip / Middle / Base (zoneChartRows). Extracts: NOT READ for a tentacle hit, left gray | — | viewer | index.html zoneChartRows / heatEach |

### Nakarkos -- his aura, shell06 on base06 (research agent for the Viewer agent, 2026-10-05; dev/em084-shell06-aura.md)

Raven: "Still missing Nakarkos's blue miasma effect". Transcribed: docs/render/shells.js SHELL_DATA.em084_00.shells.shell06, params06 / place06 / make06 / step06 / end06, the manager aura084 (0x106aa48), AURA084_STANCE (the clip's stance, derived from state-decodes' per-action table and nak-clips.json; Raven: "Follow the clip"), AURA084_CASE_A; index.html auraInput; u 40 / 41 / 42 exported `shell` (docs/effects/em084_00.json).

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x174ed48` | base06's vtable (88 slots, `+0..+0x15c`): init `+0x13c` `0x4014f8`, move `+0x24` `0x401a18`, end `+0x148` `0x401c88`, `+0x158` `0x401c20`, `+0x15c` `0x401d10`, `+0x14c` pure, `+0x150` / `+0x154` `bx lr`; ctor `0x4013b8` (vec ptrs `+0x15dc..+0x15e8` = `0x19176b0`) | uShellEmBase06 | R | dev/em084-shell06-aura.md §1 |
| `0x4016ac` | base06 placement: P = joint position (`0xc164c`); vec `[+0x15dc]` and `[+0x15e0]` through the joint 3×3 (flags bit 0 clear) or turned about Y by word `+0xfec` (set); `+0x40` = P + A' + B', `+0x1000` = P + A' − B'; bit 1 ground snap | uShellEmBase06 | R (unicorn) | §4b, §8 |
| `0x401a18` / `0x401ae0` | base06 move: `0x4a1698`, handle hygiene, `0xfe` wait (1800), state 1: owner test, `+0x15c`, `0x4016ac`, bit 2 hit re-arm every float 1, life float 0 then **slot 0 byte `+0x13ad` keeps it alive**; no motion test, no effect placement | uShellEmBase06 | R | §5, §7 |
| `0x401c88` | base06 end `(shell, flag)`: `0x43b058(+0x15f8)` → `0x329c40(h, flag)`, `0x4a1de4`, vt `+0x154`, state `0xfe`; `0x1089c00` = flag 0 | uShellEmBase06 | R | §6a |
| `0x4014f8` | base06 init: ef 0 started ONCE at `+0x40` on the shell (`0x4a10c8`, no rotation override), handle `+0x15f8`; then vt `+0x158` | uShellEmBase06 | R | §3 |
| `0x1089d14` / `0x1089e50` | sp_06 `+0x15c` (angle words: joint Euler if bit 0 clear, else owner words + vec 1 deg) / `+0x158` (slot 0, arg `0x1b`) | uShellEm084_sp_06 | R (unicorn) | §4a, §5 |
| `0x175c3e8` base06 census | ids `0xff` (Amatsu `uShellEm058_sp_06`, vtable `0x17d4d68`, reader `0xf0ff20`) and `0x16f`; `0x401a18` at `+0x24` of exactly these + the base | uShellEm*_sp_06 | R | §7 |
| `0x1064be0` / `0x1066168` | body vt `+0` (dtor: ends the three auras, `0x1089c00`) / vt `+0x1dc` (drops aura handles whose unit left states 1 / 2) | uEm084_00 | R | §6b |
| `arm+0xcad8` / `0x107d408` | arm byte: set to 1 every frame by arm vt `+0x1dc` (`0x107d5cc`), cleared (0) by arm action code; INFERRED "riding the body" | uEmOstgaloaArm | R (writes) / I (meaning) | §6c |
| trap | shells.js's "`0x4a1698` (hit side, not visual)": it also **deletes the shell** (vt `+0x40`) when the owner's unit leaves states 1 / 2 | — | R | §5 |
| trap | spec §4c "arm byte set in arm status 2 / 6 code": action-side stores write 0; the 1 comes from arm vt `+0x1dc` | — | R | §6c |
| transcribed | his BEAMS by stance (Raven: "Stance"): beam-spawns.js em084_00 `when.stance` -- stance 1: (7, 0xc) / (7, 0xd) (ordered by (7, 0x9b / 0x69 / 0x9c / 0x6a), (2, 0xb)); stance 2: (7, 0x44 / 0x4a) L2 M86, (7, 0x43) L0 M63; (7, 0x2a) M28 ungated ((7, 0x6f / 0x70) keep the stance). Stances from state-decodes' per-action table (0x1066c14) | R (table) / I (that each beam's order is its only issuer, dev/em084-arm-pairings.md) | beam-spawns.js |

### Nakarkos -- his cannon, shell31 on base31 (research agent for the Viewer agent, 2026-10-05; dev/em084-shell31-cannon.md)

Raven: "List 2, Motion 82 does not fire the beam". Transcribed: docs/render/shells.js SHELL_DATA.em084_00.shells.shell31, .cannon084 (the six shot actions as the play's pick, leave = the game's M83 frame), params31 / place31 / make31 / step31 / end31, cannon084(); u 100 / u 101 exported `shell`.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x1750fec` (+0x000..+0x154, 86 slots) | uShellEmBase31 vtable: +0x18 activation `0x413c40`, +0x24 move `0x4147a8`, +0x13c init `0x413ad4`, +0x148 end `0x414d18`; subclasses uShellEm079_sp_31 `0x17ea9b4`, uShellEm084_sp_31 `0x17f71d8` (override +0x4 / +0x14 / +0x14c only) | uShellEmBase31 | R | dev/em084-shell31-cannon.md §2a |
| `0x413ad4` | base31 init: `+0x160c` = owner motion `[+0x4b4]`; local words `+0x1670..` = vec3 deg; life `+0x1604` = float 0; hit slot 0; no effect | uShellEmBase31 | R | §2c |
| `0x413c40` | base31 activation: placement, ef 0 at `+0x1620` with rotation override = words `+0xfe8..` (deg), handle `+0x1610` | uShellEmBase31 | R | §2d |
| `0x413d60` | base31 placement: P = joint int 0 + Rown∘Rloc(vec0) → `+0x1620`; `+0x1000` / `+0x40` = P + R(vec1 / vec2); words = pitch / yaw / atan2(−dx, dy) of `+0x40 − +0x1000`; the sweep vec4 × 182.044 × dt while float1 < clock `+0x1608` < float2 | uShellEmBase31 | R (unicorn 40/40) | §2e |
| `0x4147a8` / `0x414870` | base31 move: re-place every frame, effect placed by `0x329c9c` / `0x329d04`; ends (flag 0) on life, owner motion ≠ `+0x160c`, owner inactive; hit serial re-armed every float 3; ending wait 1800 | uShellEmBase31 | R (unicorn) | §2f |
| `0x414d18` | base31 end `(shell, flag)`: `0x43b058(+0x1610, flag)`, state 0xfe, `+0x1604` = 0; flag 1 deletes | uShellEmBase31 | R | §2h |
| `0x4145ec` / `0x414ac0` | base31 sound: `_snd` int 0 at the point of `+0x40`→`+0x1000` nearest the hunter, replayed every `_snd` int 1 | uShellEmBase31 | R | §2g |
| `0x1073a48` / table `0x1073a74` | body status-7 action switch (`E+0x73e1`): 0x33 / 0x34 / 0x35 / 0x3c / 0x3d / 0x3e → `0x10767c0` r1 0 / 1 / 2 / 3 / 1 / 2 | uEm084_00 | R | §1a |
| `0x10767c0` | the cannon shot: L2 M82, passes tune int 0xc / 0xe / 0xe / 0xd by r5; turn ≤ 90° to target over f0..180 (r5 0 / 3); **shell31 pair at f282 of the first pass** (1+0 / 3+2 / 5+4 / 1+0); rate 1.3 for r5 3; L2 M83 at the count's end | uEm084_00 | R | §1b, §1c |
| `0x106f820` | shell31 spawner: setup 0x10 bytes {vtable, 0x172, mode, owner} only | uEm084_00 | R | §1d |
| `0xff2604` ← `0xffb360` | Malfestio's shell31 spawner (same setup); mode by `0x3a8430` | uEm079_00 | R | §4 |
| trap | `motionIdOf` maps only `Motion[N]`, so a `_start` / `_loop` clip has no motion id and a base02 / base31 "owner's motion changed" end never fires on such a clip | — | R | §5d |
| VIEWER STAND-IN | not a ROM finding: while L2 M82 is in its loop and no cannon shell of the play is live, shells.js cannon084 holds a straight pair (modes 1 + 0, no leave, no life limit) -- Raven, 2026-10-05: "Keep 82 loop firing forward for the time being". The game spawns once at f282 of the first pass and plays M83 after its passes | — | — | shells.js cannon084 |

### Nakarkos -- the tentacle-form shells, phase 1 (implementation agent for the Viewer agent, 2026-10-06; dev/em084-shells-spec.md §5 / §6 / §8)

Raven: "move onto the Tentacle Form effects". Phase 1 = arm (7,0x1b) on `l_2` / `r_2` M93 f246 (tune 4), all four forms, and the second generation it reaches. Transcribed: docs/render/shells.js SHELL_DATA.em084_00 (lists[1] = u_r, shells.shell01 2..7 + hitdata, shell11 0, shell13 2..5, .arm084), params084s01, params11n / READERS11, create11n / CREATE11, endCreate084, params13n / scatter13n / thrown13n / launch13n / init13n / landing13n / LANDING13, ownArm084, make13n, arm084; index.html armsInput (shellExtra `arms`). Rows below marked R were read this session (efx/armdis.py via scratchpad naka_shells/dd.py); the spec's own rows stay in its section above.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x107cb9c` | arm shell11 request (0x40, `0x3fa2bc`): id 0x170, mode 0, owner = the arm, +0x10 / +0x20 the zero vector, **+0x30.. = 0x1620e60 (zero angles)**, +0x3c 0xffff | uEmOstgaloaArm | R | shells.js arm084 |
| `0x107cc68` | arm shell13 requests (0x40, `0x4041a8`) ×4: id 0x171, modes 2..5, owner the arm, +0x10 / +0x20 zero, **+0x30 = 1..4**, +0x34 0xffff | uEmOstgaloaArm | R | shells.js arm084 / make13n |
| `0x107b3dc` | the arm's setup writes its em byte **+0xb5f4 = 0x63** (and copies +0xb5f5 from `[arm+0xcadc]`) | uEmOstgaloaArm | R | shells.js thrown13n |
| `0x10891dc` | sp_01 reader verified: bfc/orrne per bit over the ctor's 0 -- bit 0 int0, 2 int2, 4 int3, 8 int4, 0x800 int5, 0x20 int6; +0x15e4 int1; +0x15f0 float0; +0x1608 / +0x160c &vec0 / &vec1 | uShellEm084_sp_01 | R | shells.js params084s01 |
| `0x1089384` | sp_01 +0x154 end create (table `0x10893b0` on mode−4): 4→5, 6→7, 43/46→44, 70..72/76..78→45; setup = own +0x40, **own words +0xfe8..**, +0x3c 0xffff, owner the shell's | uShellEm084_sp_01 | R | shells.js endCreate084 |
| `0x108a04c` | sp_11 reader verified: ef0 → +0x1664; bit0 int1, bit1 int3; +0x15e4 int2; count int0, times (k+1)×float3 (modes 2..4) / float k (mode 0); **owner +0xfe8.. → +0x1668..**; +0x1680 = 0xc164c(joint int2) or owner +0x40; +0x1690 = int4≠−1 | uShellEm084_sp_11 | R | shells.js params11n |
| `0x108a330` | sp_11 +0x168 create: base +0x1680 + sh vec k turned by +0x166c; mode 0 → shell01 2 (setup +0x30.. = +0x1668..); modes 2..4 → ef +0x1664 + shell00 1 (0x108a508.., not transcribed) | uShellEm084_sp_11 | R (mode 0) | shells.js create11n |
| `0x108a954` | sp_13 reader verified: ef 0/1/2/3 → +0x15c8/+0x15d0/+0x15cc/+0x15d4; +0x15e4 int0; flags +0x15e0 bit 2 int1, 4 int2, 0x200 int3; +0x15e8 int4; floats → +0x15ec/+0x15f0/+0x15f8/+0x1600/+0x15fc/+0x1610; +0x162c &vec1, +0x1628 &vec2, +0x161c = +0x1620 = &vec0; int5 → byte +0x1670 | uShellEm084_sp_13 | R | shells.js params13n |
| `0x404350` | base13 ctor: +0x15e0 = 0; +0x15ec..+0x1617 cleared (`0x13ecbb4`, 0x2c B: gravity +0x15f4, limits, +0x160c, +0x1614 = 0); +0x1618 = 1.0; +0x161c..+0x1630 = zero-vec ptr | uShellEmBase13 | R | shells.js params13n |
| `0x4045ec..0x40461c`, `0x4047b0` | base13 init **joint path**: +0x40 = OWNER's joint (`0xc15a4`) row 3; points [+0x161c]/[+0x1620] midpoint turned by that joint's 3×3 (flag 2 clear), size only with flag 8; second midpoint at +0x163c (0x404a64..0x404c48) moves +0x40 by m−m when both points match | uShellEmBase13 | R | shells.js init13n |
| `0x404dc8` | base13 launch: +0x15f0 > 0 clamps the drop ≤ 0; **+0x15f0 > 0 and +0x15f4 == 0 → g = −((√(2h)+√(2(h−dy)))/t)²** (0x404f04..0x404f4c), else +0x15f4 | uShellEmBase13 | R | shells.js launch13n (Khezu's launch13 keeps its own path) |
| `0x405564` / `0x40564c..0x405980` | base13 thrown point, flags 0x200 + 4: vec1 turned (Z,X,Y) by words + vec2 deg, words = `[owner+0xcadc]+0xfe8..` when owner em byte == 0x63 else the owner's; scatter; re-measured bearing, distance clamped [+0x15fc, +0x1600], **y = shell's own** (target y overwritten) -- no target read | uShellEmBase13 | R | shells.js thrown13n |
| `0x4057c4..0x405840` | the scatter: LCG 0x41c64e6d/0x3039 on +0x1640, then on (r0 % 10); both + owner halfword **+0x73e8**; radius +0x1610×(r0%100)/100, angle ((r1%100)<<16)/100 | uShellEmBase13 | R | shells.js scatter13n |
| `0x767bc` / `0x76498..0x764a8` | the action setter writes **+0x73e8** at every action change: the old value, or `0x49634()` → `0x3f76d8` on global `0x18858a8` (a random draw: INFERRED) | shared enemy | R (write) / I (meaning) | shells.js H73E8_STANDIN = 0 |
| `0x108aba8` / `0x108ac50` | sp_13 landing (state 2): type0 ef +0x15cc, type2 +0x15d4, type1 +0x15d0 after `0x43b1a0` → +0x167c.. and, owner active, mode ≤ 0x16 in mask 0x7fbf3f, shell01 [`0x16a2e00`[mode]] at the point with those words (owner the shell's); then `0x4042bc` (effect, handle +0x1678), vt+0x148 | uShellEm084_sp_13 | R | shells.js landing13n |
| `0x16a2e00` | sp_13 child table, modes 0..22: 2..5 → 6, all others 0 | uShellEm084_sp_13 | R | shells.js CHILD13N |
| `0x405af0` / `0x4050f4` | base13 end stops only +0x1674; the 0xfe ending deletes when **both** +0x1674 and +0x1678 are gone | uShellEmBase13 | R | shells.js stepOrb |
| em084_00_01 / _13 hit | shell01 `_hit###` int 0 per mode (2→2, 3→1, 4→3, 5→4, 6→5, 7→6), `_hitdata` HDS v0x20160209, 14 × 0x38 from +0x10 (800 B): (10,60) (4,6) (0,40) (4,450) (4,10) (10,150) (0,10) (10,60) (100,10) (4,450) (4,10) (10,60) (120,10000) ×2; shell13 3 records (0,500) | data | R (file) | shells.js SHELL_DATA (em004 hit convention) |
| INFERRED | the arm's block +0x40 / words +0x50.. = the attached body's frame (body joint 200 / 203 world matrix), words by `eulerOf` | — | I | shells.js ownArm084, index.html armsInput |
| trap | shells.js:2030 (Khezu) reads `[+0x73e8] & 3` as "the action number's low bits"; the setter writes it from the old value or `0x49634()` (above) -- re-check that reading | — | I | Khezu's (7,0x05)/(7,0x47) mode note |
| transcribed (Viewer agent, 2026-10-06) | u_r 0 / 10 / 20 / 21 / 30 / 31 / 32 / 35 exported `shell` (em084_00u_r UNIQUE); r_2 M93 form g5 recorded (record_shells.py --arm-form=5: 6 sets) and lifted -- 0x44a34 (u_r 20) now runs. TOOLING: dev/shell-capture.mjs serializes the attached bodies' joints and takes --arm-form; efx/shellplan.mjs --inputs rebuilds them; record_shells.py --arm-form=<group> (in the capture tag) | R | this section |
| VIEWER RULE | Nakarkos's FLOOR is his unit origin (index.html FLOOR_AT_ORIGIN; Raven: "His origin"): the game keeps a grounded unit's height on the floor (0x18154c), and the viewer's clip-lowest-point floor put it ~5 m below, past base01's +-500 snap (form 1's shell01 2 and the left arm's form 2 shell01 4 deleted themselves). With it every form fires on both arms | R (the probe) / viewer rule | index.html monsterFloorY |

### Nakarkos -- the tentacle-form shells, phase 2 (implementation agent for the Viewer agent, 2026-10-06; dev/em084-phase2-bases.md, dev/em084-shells-spec.md §5 / §6 / §8)

Raven: "Okay, now move onto the Tentacle Form effects". Phase 2 = the other five arm rows of spec §5 -- (7,9) M9 f110, (7,0xa) M21 f190/235/280, (7,0x17)/(7,0x18) M102 k1 f30 / k2 f56 each pass (both arms), (7,0x23) M62 f146, (7,0x24) M74 f360/390/420 -- for every form each lists, both sides, and the second generation they reach. The base reads are the research agent's (rows R below, from dev/em084-phase2-bases.md §6, written here as proposed there; static `efx/armdis.py`, unicorn `p2bases/uc_check.py`, census `p2bases/census.py`, scratchpad, not in the repo).

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x3f97bc..0x3f97d8` | base00 move, flight `+0x15fc` ≤ 0 (or NaN): byte `+0x13ad` or `+0x1465` set → vt `+0x168` (collide), both clear → vt `+0x148(0)`; the flight step vt `+0x160` already ran | uShellEmBase00 | R | phase2-bases §1c; unicorn `uc_check.py` B with controls. shells.js `flightTimer` (base00 only; base54's `0x42ba04` still throws, not read) |
| `0x3f9aec` | base00 vt `+0x164`: slot 0 only, `0x4a1ad8 == 1` and `+0x15d8 >= 0` → vt `+0x140(shell, 0, +0x15d8, −1, 1.0, 0x1f, 2, +0x1588)` | uShellEmBase00 | R | §1b.11; shells.js make00n (`slots` filtered to slot 0) |
| `0x3f8e68` / `0x3f8ed0` / `0x3f903c..0x3f9134` | base00 init offset: bit 3 SET → `rotXYZ(vec, words)` (pre-offset words for the aim point; recomputed with the post-offset words when `(flags & 0x108) == 8`, the one added at `0x3f9140`); bit 3 clear → the base matrix's 3×3 (joint / owner `+0xb0` / `[0x1832afc]`) | uShellEmBase00 | R | §1b.4; corrects row `0x3f9140`'s "yaw-rotated" (Withdrawn table). shells.js init00 + bit3Offset00, gated on bit 3 (no reader before his sets it) |
| `0x3f9304` / `0x3f9338` | base00 init: flags byte 1 bit 3 = **0x800** → byte `+0x15ac` = 0; byte 1 bit 2 = **0x400** → `0x43ab74(shell, 0xbe518(owner))` | uShellEmBase00 | R | §4d; corrects the "base00 flag 0x800: no test" row (Withdrawn table). Not his bits; not transcribed |
| `0x43a8f0..0x43a8fc` | `+0x15ac == 0` skips the second half of the hit registration (`+0xb720`, `0xcad9c(owner, +0x15bc)`) | enemy-shell base | R (branch) / I (meaning) | §4d |
| `0x4a1bd4..0x4a1bec` | hit slot k = shell + `0x13a8` + `0xb8`·k; with `0x168a2c`: byte `+0x13ad` / `+0x1465`, slot 0 delay `+0x1404`, duration `+0x1408` | enemy-shell base | R | §1b.11 |
| `0x1088c5c` | sp_00 reader verified: ef 0..3 → `+0x15c8..+0x15d4`, hit 0 → `+0x15d8`, int 0 → joint `+0x15dc`; `+0x15e8` bit 3 int 3, `0x10` int 1, `0x20` int 2; floats 0 / 1 / 3 / 2 / 4 → `+0x15ec` / `+0x15f0` / `+0x15f4` / `+0x15f8` / `+0x15fc`; vec 0 → `+0x1610`, **`+0x1614` = 0**, vec 1 → `+0x161c` | uShellEm084_sp_00 | R | §1a; shells.js params084s00 (READER00) |
| `0x1088e38` / table `0x1088e9c` | sp_00 landing verified: state 1 only; type 0 / 1 / 2 → ef `+0x15cc` / `+0x15d0` / `+0x15d4`; type 1 child BEFORE the effect: shell01 0 (0, 2..8, 65, 66), 1 (1), 6 (11..13, 18..20, 25..27, 32..34, 40..42, 45..47, 52..54, 57..59), at the contact with the shell's current words, owner the shell's; then vt `+0x148(0)` | uShellEm084_sp_00 | R | §1d; shells.js landing084 / CHILD084 (LANDING) |
| `0x1089208` | sp_01 reader: ef 1 → **`+0x15d0`** (not `+0x15cc`), so base01's init never starts it; only vt `+0x164` does | uShellEm084_sp_01 | R | §4b.2; shells.js params084s01 `efAt`, make001 |
| `0x3fa5b4..0x3fa638` | base01 init: words += `u16(s32(0.5 + [+0x160c][i] × 182.04445))` per component (uxtah), after the copy from setup `+0x30`, before the position; skipped on the `0x80` arm | uShellEmBase01 | R | §3; unicorn `uc_check.py` A. shells.js init011 (`k.deg`; every other reader the ctor's zero, + 0) |
| `0x43b1a0` | ground angles: `ldrh [r3]` (the post-offset Y word) for the heading; writes all three words `uxth` | enemy-shell base | R | §3; shells.js groundAngles (already `A[1]`) |
| `0x3fb0fc..0x3fb118` | base01 move: the ONLY `0x20` test (census over sp_01's 92 slots, depth 3, 442 functions; controls `0x800` / `0x40` / `0x100`) → vt `+0x164` | uShellEmBase01 | R | §2a, §2c; shells.js move011 |
| `0x3fb3a4` | base01 vt `+0x164`: `+0x15d0` set and slot 0 delay `+0x1404` − `[[0x211f764]+0x68]` ≤ 0 → `0x43b058(h, 1)` on `+0x1624` / `+0x1628` / `+0x162c`, ef `+0x15d0` at `+0x40` → `+0x162c`, `0x40` → `0x43ac04(+0x15e8)`, `+0x15d0` = 0 | uShellEmBase01 | R | §2b; shells.js switch01 |
| `0x3fafd0..0x3fb010` | base01 ending: deletes when `+0x1624`, `+0x1628`, `+0x162c`, `+0x1630` are all gone, or past `[0x162493c] × 60.0` (GOT `0x1835c58`) | uShellEmBase01 | R | §4b.5; shells.js step011 / end011 (`effect3`) |
| tooling | scratchpad `p2bases/census.py` (recursive-descent field / bit census over a vtable's closure; validated on base01 bits 0x800 / 0x40 / 0x100) and `p2bases/uc_check.py` (unicorn: base01 offset block; base00 move exits) | — | — | not in the repo |
| em084_00_00 hit | shell00 `_hit###` int 0 per mode: 0, 2..8 → 0; 1 → 1; 11..59 → 2; 65 / 66 → 3; `_hitdata` HDS v0x20160209, 4 × 0x38: (0,300) (0,300) (0,200) (0,300); shell01 15..62 → 8, 43 / 46 / 70..78 → 9, 44 / 45 → 10, 82 / 84 → 12, 83 / 85 → 13 | data | R (file) | `p2bases/hitdump2.py`; shells.js SHELL_DATA |
| transcribed (2026-10-06) | docs/render/shells.js: SHELL_DATA.em084_00.shells.shell00 (modes 0..8, 11..59, 65, 66 + hitdata), shell01 modes 15..17, 22..24, 29..31, 36..38, 43..46, 48, 51..53, 57, 60..62, 70..72, 76..78; arm084 rows (7,9) / (7,0xa) / (7,0x17)+(7,0x18) `both` / (7,0x23) / (7,0x24) (`spawns`, per-kind `left` / `right`); arm084 + armSpawn084 + make00n; params084s00 / READER00; landing084 / CHILD084 / LANDING; flightTimer's base00 slot arm; init00 bit-3 offset (bit3Offset00); params084s01 (refusals dropped, `efAt`); init011 `deg`; make001 `efAt` / `ef15d0`; move011 → switch01; end011 / step011 `effect3`. Every other monster's dev/shells-*-check / -snapshot output byte-identical before and after | R (probes) | this section |
| NOT MODELLED, named | the blends M9+M10, M62+M65, M102+M104 (the primary clip plays); the speed windows `0xb07b4`; the arm's yaw word `+0xcb08` = (1 − w)·(±90°) of (7,0x17)/(7,0x18) (`0x1086460`) -- the arm's angle words are the attached frame's (INFERRED, phase 1); the form clear vs the phase-0 copy order (spec §3) | — | named | shells.js arm084 rows |
| VIEWER GAP | render/rom/effect/schedule.js stops a shell's own request only at its end, with flag 0, and links an `out.started` request only to `effect2`: switch01's flag-1 stops of `+0x1624..+0x162c` are events only, so u_r 13 runs on to the shell's end beside u_r 14, and the switch's handle (`effect3`) never holds its request (the ending does not wait on it) | — | gap | for the Viewer agent: a flag-1 stop of `sh.request` on `{ ev: 'stop', flag: 1 }`, and `sh.effect3.request = q` for a `kind: 'switch'` start |
| transcribed (Viewer agent, 2026-10-06) | u_r 13 / 14 / 24 / 25 exported `shell`; schedule.js applies base01's 0x20 switch: its flag-1 stop (proof.js stopRequest(m, q, 1) -> 0x329c40(h, 1)) and its handle as effect3 (stopped at the shell's end); efx/vecdrawsched.py `<frame>:stop:<n>[:<flag>]`, efx/shellplan.mjs emits the flag-1 stops. Every arm form x 11 clips recorded with the tentacles POSED (386 sets) | R | this section |

### Effects -- the primitive layer the shell recorder never draws, and the fade's angle factor (research agent + Viewer agent, 2026-10-05; dev/effect-bb43ac-flag8.md)

Raven: "The beam itself still isn't firing and after the current effect is played once, it breaks effects". Nakarkos's cannon u 100 (em084_00_064) stopped at 0xbb43c8 (as u 211 on L3 M63); u 101 (em084_00_062_s) at the fade's angle factor. Fixed: vecprim set add_em084_00_064prim lifted; bridge.js distanceFade translates 0xca6988.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x178e584` (`+0x30..+0x58`) | the draw system's vtable: +0x30 `0xbad710` layer begin, +0x34 `0xbad790` layer draw, +0x40 `0xbab58c` list draw, +0x44 `0xbadd68`, +0x48 `0xbb4214` GPU batch, **+0x4c `0xbb43ac` (word `0x178e5d0`)**, +0x50 `0xbb44f8` (not read), +0x54 `0xbb46d8` | draw system (`*0x211f8b4`, name not read) | R | §1 |
| `0xbac62c` | primitive BATCH draw `(sys, ctx, ?, desc)`: vt +0x44, +0x50, +0x4c, +0x48 on (sys, ctx, desc); desc = `0xbab58c`'s `sp+0xa0` = {first record's word 0 & 0x3fffffff, word 1} (`0xbac540..0xbac558`) | draw system | R | §1 |
| `0xbb43ac` | depth-stencil + rasterizer select from desc word 1: bits 8 / 0x10 / 0x2000 pick `ctx+0xfdc` / `0xfcc` / `0xfc4` / `0xfe4` or the tables `0x159d390..0x159d3a8`, into `ctx+0x11c`; byte +6 bit 1: `ctx+0x1014` / `0x108c` into `ctx+0x120` | draw system | R (names I) | §1 table |
| primitive record (0x28 B) | word 0 bits 0..4 = TYPE (`0x8a2e58`: arg 5, quads pass 4; `0x889100`: 3); bits 16..25 = `[ctx+0x94] & 0x3ff` (`0x889100`); word 1 = the caller's descriptor word 1 | — | R (set-index name I) | §1 |
| `0x889100` | the type-3 (strip) record builder; called by the genType-2 draws (`0xa99a3c..0xa9e804`, 24 sites incl. `0xa9ab30`) | — | R | §1 |
| `gen+0xf4` (genType 2, vtable `0x1789834`) | the draw-flag word, = record word 1 (`0xa9d05c..0xa9d068`); built at init `0xa566d0` from `0x9b38dc(row)`: result bit 3 = row draw-word bit 7 (`0x9b3910..18`); per frame `0xa578cc` sets bit 13 from `[owner+0x1c4]` | genType 2 | R (rest of `0x9b38dc` from `0x9b3958` not read) | §1 |
| `efx/vecprim.py` | the ONLY recorder that runs the primitive layer (`0xbad710` / `0xbad790` -> `0xbab58c` -> `0xbac62c` -> `0xbb43ac` / `0xbb4214`); one efl, `--parent` or `--proof` | 23 sets cover `0xbb43ac` | `--proof` refuses compose state > 2 (em084_00u:100 is 3). **`vecdrawsched.py` / `record_shells.py` / `add_effects --record` never draw the primitive layer**: those functions are keys with 0 calls in every `draw.json` |
| `0xca6988` | the distance fade's ANGLE FACTOR (0xca6874 flag bit 7): angle of a to normalized b (b as is under FLT_EPSILON), acos of the clamped dot, 1 up to p+0x20 falling to 0 at p+0x24; p+2 bit 0 also -dot, kept by min (p+3 bit 0x10) or max; r1 / r2 as 0xca6874's caller passed them | shared | R (translated; ROM emulated over 1008 cases, 0 mismatches) | bridge.js angleFactor |

### Boltreaver Astalos -- every effect record (census agent for the Viewer agent, 2026-10-07; dev/em081_04-effects-census.md)

Raven: "Find and add all of Boltreaver's effects." 124 records: 71 running, 13 exported but undriven / refusing (11 by Raven's off-list: blast / notice / water), 17 ready (added 2026-10-07 by the enable-word fix), 17 need shell runtimes, 6 never fired. Transcribed: docs/render/psl-mask.js CLASS_MASK.em081_04 (base word only) + PSL_MASK_MONSTERS; `add_effects.py em081_04 --apply` exported the 17 and regenerated his CLIP_EFFECTS (140 motions) from the whole blocks.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x1019eb4` (vt+0x13c) | the PSL enable word: `bl 0xca170`, then **variant ≠ 0 returns** (`0x1019ecc`) — Boltreaver = base mask only; variant 0 ORs charge-keyed bits 15–29 | uEm081_00 | R | dev/em081_04-effects-census.md §0 |
| `0x1019c1c` (vt+0x158) variant 4 | shell ids: +0xcbac 0x150 shell00, +0xcbb0 0x151 shell01, **+0xcbb4 0x152 = uShellEm081_04_01 → folder shell01_02**, +0xcbb8 0x153 shell02, +0xcbbc 0x154 shell11, +0xcbc0 0x155 shell14, +0xcbc4 0x156 shell15, +0xcbc8 0x157 shell50 (res 0x8a9d..0x8aa4 by `0x159daa0`) | " | R | §1 |
| `0x10129b8` | variant 4 skips the id-1016 (u 300) discharge, `beq 0x1012c3c` | " | R | §1 |
| `0x102f44c` (vt+0x1a8) → `0x102f840` (vt+0x1b0) | per-motion frame table → shell01 modes 11/12/13 (c 30/32/31); vt+0x1a4 `0x102f134` is camera shakes (`0xc241c`), not effects | " | R | §5 |
| `0x16a2200` | shell00 mode table (19 words) for `0x102fd04` / `0x1031080` | " | R | §5 |
| `0x102fd04 0x1030024 0x1030b48 0x1030cc8 0x1031080` / `0x102f840 0x102fdd8 0x10306cc 0x10308f8` / `0x103034c 0x102fa88` / `0x103047c` / `0x102ff4c` | enemy-side shell spawners: shell00 / shell01 / shell14 (rank < 5 → 4/5) / shell11-or-shell01 by tail tier / shell50 (alloc `0x427c00`) | " | R | §5 |
| `0x1032858` / `0x1032f74`+`0x1033a90` / `0x10348b0` / `0x1031f28` | shell-side children: shell50 → shell01_02 (mask `0x3b2b`); sp_00 +0x150 → shell15 (table `0x1032fb8`) + shell01 2/3/4; sp_15 +0x174 → shell15 6/7/17/18; 04_11 +0x168 → shell01 29/30 | uShellEm081_* | R (event meaning UNREAD) | §5, §6 |
| trap | `effects_triage.py`'s "PSL: no motion fires it" is a FILE-MASK negative for any monster not in PSL_MASK_MONSTERS — em081_04 has 102 named, switched-on bits outside the mask | — | R | §0 |
| trap | `effects_triage.py`'s viewer column matches (pel, key), not array: it called SEQ u 200/201/202/230/231 and UNIQUE c 30 "wired" because the other array's record is | — | R | §2 |
| trap | `driven-split.mjs` reports beam records (u 100/101) "named by no shell mode": it does not read beam-spawns.js | — | R | §2 |
| trap | class name ≠ folder: uShellEm081_04_01 runs `em081_04_shell01_02`, and shell-map.md's "em081_04 01=0x17ed8a8" is that class, not the shell01 folder (which is uShellEm081_sp_01) | — | R | §1 |

### Boltreaver -- his shells (research agent for the Viewer agent, 2026-10-07; dev/em081-shells-spec.md)

Group D's carriers: who spawns each shell (every status-7 action run under unicorn through `0x1023a6c`, real gates / spawners / actiontune; control (7, 0xca) = the beams lane's f48), and what each base does. Three bases new to the viewer: base14, base15, base50. Scratch drivers in the session scratchpad (`bolt\drv.py`, `bolt14\`, `bolt15\`), not in the repo.

| addr | what | class | st | detail |
|---|---|---|---|---|
| vtables | sp_00 `0x17ede90` base00; sp_01 `0x17ee00c` base01; 04_01 `0x17ed8a8` base01; 04_11 `0x17edb94` **base11**; sp_14 `0x17ee17c` **base14** (setup base00); sp_15 `0x17ee2f8` **base15** (setup base03, own slots to `+0x174`); 04_50 `0x17edd08` **base50** | uShellEm081_* | R | spec §1 |
| `0xc9e7c` (uEm081_00 vt+0x28) → `0xae32c` | runs every step after the move (walker `0xc04728`: vt+0x24, +0x2c, +0x28 per unit with state&0x407 == 0x402); gated on global `[[0x1831aec]+0x2a2c]` bit 1 -- the same bit gates the enemy move `0xad6f8` (`0xad73c`); setter `0x7234` | uEm081_00 / uEnemy | R (meaning of the bit I) | spec §2a |
| `0x102f44c` (vt+0x1a8) | per-motion `0xb09b0` gates: tables `0x102f4c8` (0x101..0x114) / `0x102f540` (0x419..0x440), literals `0x102f754..0x102f760` = 40 / 88 / 56 / 72; the full frame table | uEm081_00 | R | spec §2a |
| `0x102f840` (vt+0x1b0) | sel 4 / 3 / 1 → shell01 11 / 12 / 13 (c 30 / 32 / 31) at the block's point and words | uEm081_00 | R | spec §2a |
| `0x1033eb0` | sp_01 reader: bit0 i0, 2 i2, 0x80 i3, 0x800 i4, 4 i5, 8 i6, 0x1000 (i7==0), 0x20 i8; joint i1; `+0x1610` i7; timer f0; vec0/1 | uShellEm081_sp_01 | R | spec §2b |
| `0x1033e20` / `0x10340c0` / `0x1034128` | sp_01 +0x13c / +0x150 / +0x154: modes 26/27 write their position to e+0xb5fa..+0xb60c; end byte +0x15c0 -- nothing visual | uShellEm081_sp_01 | R | spec §2b |
| `0x3fae20` | base01 init: `+0x15ed` bit 4 (flag 0x1000) → byte `+0x15ac` = 0; `+0x1610` → `+0x15bc` (hit side) | uShellEmBase01 | R | spec §2b |
| `0x1032d38` / `0x1032ed0` / `0x1032f74` / `0x1033a90` | sp_00 reader (flags 0x44 \| bit0 i1; floats degX/degY/vz/flight/xlo/xhi; vec1 → +0x1618); landing (position = contact; type 1 → children); child table `0x1032fb8` (shell15 + shell01 2/3/4); types 0/2 → shell01 only | uShellEm081_sp_00 | R (emulated children) | spec §3a |
| `0x1034638` / `0x10345a0` / `0x10348b0` | sp_15 reader (flags 0xc8 \| 0x10 i1 \| 0x20 i2; +0x1700..+0x171c); init (modes 20..23 byte +0x13e3); +0x174 children (table `0x10348e0`: 0→6, 1/2→7, 9/11→17, 10/12→18; only with pause > 0) | uShellEm081_sp_15 | R (emulated) | spec §3b |
| `0x406f6c` / `0x40714c` / `0x4072f0..0x407bd4` / `0x407bf4` | base15 ctor / init (owner Y word, RNG `0x7c91a0`/`0x7c9234`, amplitude) / move (zigzag, pause, turn, vt+0x174 at a corner; no effect call) / +0x174 bx lr | uShellEmBase15 | R (move bit-exact vs a model) | spec §3b |
| `0x3fec78` | base15 move's only stage query: map byte +0x1053 == 9 and area 1 only | uShellEmBase15 | R | spec §3b |
| `0x1034260` / `0x1034240` | sp_14 reader (ef1 → +0x1668 u 40, ef2 → +0x1664 u 41; flag 0x100 iff i3; +0x1674..+0x1690) / ctor | uShellEm081_sp_14 | R | spec §5b |
| `0x405d70` / `0x405e90` / `0x406704` | base14 ctor / init (joint, ±700 diagonal ground query, lift, u 41 start) / move (u 40 at the delay, its units stretched anchor→head, u 41 stopped; u 40 never stopped) | uShellEmBase14 | R (emulated) | spec §5b |
| `0x103034c` / `0x102fa88` | (7,0x87) / (7,0x88) at L2 M23 f90: shell14 10 / 11 at `0x3a8430` ≥ 5 else 4 / 5; 0x88 first shell01 20 | uEm081_00 | R | spec §5b |
| `0x10306cc` / `0x10308f8` / `0x102fdd8` | shell01 0 / 1 (number masks 0x5541 / 0x7541, 0x8e / 0x90; f72) / 5; callers gated `([e+0xcb02] \| 1) != 1` (wings tier 2/4) | uEm081_00 | R | spec §5a |
| `0x10323c4` | 04_50 reader: flags bit0 i2, 2 i3, 4 i4, 0x200 i5, 8 i6, 0x80 i7, 0x800 i8, 0x20 i9, \|0x40; +0x1660 i1 (motion type); floats → +0x15ec..+0x1684 | uShellEm081_04_50 | R | spec §4a |
| `0x427c3c` / `0x428078` / `0x4286b0` / `0x4283b8` / `0x4281a8` / `0x428660` / `0x428688` | base50 ctor / init / move (clock `+0x1688` += dt / `[[0x211f764]+0x38]`, end past +0x1670 + +0x1678 via vt+0x174) / eased slide type 0 / linear type -1 / scale lerp (→ `0x43ab74`) / speed lerp | uShellEmBase50 | R (divisor NOT READ) | spec §4a |
| `0x10327c4` / `0x1032c10` / `0x1032858` | 04_50 +0x150 (contact) / +0x174 (time-out) / children: mask 0x3b2b → shell01_02 0; **6 → 8 + shell01 27; 7 → 7 + shell01 26** | uShellEm081_04_50 | R (emulated) | spec §4b |
| `0x10312ac` / `0x10314e8` / `0x1031254` | 04_01 reader (**ef1 → +0x15d4**, flags \|0x100, rate/size/hold +0x1654..+0x165c) / +0x150 (unit scale grows to size, then a hold on the +0x38 clock, then the end) / ctor | uShellEm081_04_01 | R | spec §4b |
| `0x3fb2fc..0x3fb36c` | base01 end: with `+0x15d4` set, that ef starts at +0x40 into `+0x1630` | uShellEmBase01 | R | spec §4b |
| `0x1031978` / `0x1031d28` | 04_11 reader (joint i0 138; count i2 20; times f0..f19; points: vecs, or the spiral angle += f20°, radius += f21) | uShellEm081_04_11 | R (emulated) | spec §6 |
| `0x1032120` / `0x1031f28` / `0x49f45c` | 04_11 +0x150 (follow joint 138, then base11 `0x40308c`) / +0x168 (point k turned by Y → shell01 k==0 ? 29 : 30) / factory | uShellEm081_04_11 | R | spec §6 |
| `0x103047c` | (7,0xc7) L4 M62 f40: tail `[e+0xcb03]` 4 → shell11 6, 2 → shell01 22, else 21 | uEm081_00 | R (emulated) | spec §6 |
| `0x102ff4c` callers | shell50 0 (7,0xcb), 1/9 (7,0xd4/0xd5), 3 (0xe1/0xe8/0xe9/0xf1/0xf2/0xf4), 5 (0xe3/0xec/0xed), 6 (0xcf), 7 (0xdf), 8 (0xd3), 11/12/13 (0xee L9 M3 f188/144/100) | uEm081_00 | R (emulated) | spec §7 |
| `0x7c4408` | static initializer of the engine's constant block: `0x19176b0` 0, `0x19176c0` 1, `0x19176d0` -1, `0x19176e0` X, `0x19176f0` Y, `0x1917700` Z, `0x1917710`/`0x1917720` ∓FLT_MAX, `0x1917730` FLT_EPS, **`0x19177b0` identity 4×4**; in the pointer table `.data 0x1842db4` (init array: I) | engine | R | spec §4a |
| `0x13ecef0` | PLT = `atanf` (GOT `0x183105c` → dynsym); `0x13ecbb4` = `__aeabi_memclr4` | sdk | R | spec §3b |
| trap | an extent finder that classifies by mnemonic prefix takes `ble`/`bls`/`blt`/`blo` for calls: `0x4072f0` came out ending `0x407b18` (true `0x407bd4`) | — | R | spec §9 |
| trap | a naive vtable diff runs into the next vtable's header and the base's DTI vtable: base14 / base15 / sp_15 own slots end at `+0x170` / `+0x174` / `+0x174`; "+0x180 / +0x184" are other classes' slots | — | R | spec §1, §3b |

Implementation (implementation agent for the Viewer agent, 2026-10-08; Raven: "Find and add all of Boltreaver's effects"). Transcribed in docs/render/shells.js (SHELL_DATA.em081_04 shell00 / 01 / 01_02 / 11 / 14 / 15 / 50, `perFrame081`, `actions` code 'em081'; params081s00 / s01 / s0102 / s11 / s14 / s15 / s50, perFrame081, spawn081, landing081s00, base15 init15 / move15 / step15, base14 make14 / move14 / step14, base50 make50 / slide50 / move50 / step50, move081s0102, create081s11, end011's `+0x15d4` arm), render/rom/effect/host.js placeUnits, schedule.js (stopNow, units14, the end start's `effect4`), index.html shellChargeTier. Rows R were read this session (efx/armdis.py) or are the helpers' emulations re-run.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x1031d28` | the spiral, instruction for instruction: m = int 3; points k < m = vec k (w 0); at k = m from point m−1: s = x² + z² (mla from 0), r = √s, (x, z)/r (unnormalised under 2^−23), angle = acosf(x̂·unit X); each k ≥ m: angle += float 20 × `0x3c8efa35` (0.0174533), r += float 21, (r cos, 0, r sin) | uShellEm081_04_11 | R | shells.js params081s11 |
| `0x1031f28` | create: point k turned by ldrh `+0xfec` (x cY + z sY, y, z cY − x sY) + `+0x40`; shell01 request mode k == 0 ? 0x1d : 0x1e, +0x30.. = the shell's full words, +0x3c = `+0x1588`; returns at once unless mode 6 (`0x4a0ee4`) and owner active | uShellEm081_04_11 | R | shells.js create081s11 |
| `0x406704..0x406dec` | base14 move: elapsed += dt; `0x3f9814` → end; elapsed ≥ f4 → done (`+0x16a8`), stop `+0x169c`; !done && delay `+0x1698` == 0 → pos += dt·v; elapsed < delay → return; delay ≠ 0 → u 40 (`+0x1668` → `+0x16a0`) at `+0x40`, req `+0x14` \|= 0x40000002, `+0x30..` = X / Y words × U16→deg, **`+0x40` / `+0x44` = 1.5, `+0x48` = 0**, ef `+0x1660` when set, stop `+0x16a4` (flag 0), delay = 0, vt+0x164; past f4 + f5: anchor += dt·`+0x16b0` and an end on a negative dot (`+0x16b0` the ctor's zero: never); each unit of `+0x16a0`: `+0x40..` = anchor (w 0), `0x8a4dfc`(unit, (X, Y) × U16→rad), and unless (`+0x166c` == −1 and elapsed ≥ f4) `+0x68` = \|pos − anchor\| / `+0x1680`, `+0x6c` 0; then `0x43ac8c` → vt+0x150 (bx lr) | uShellEmBase14 | R (unicorn run14.py agrees: mode 10, moves 1..140) | shells.js move14; host.js placeUnits |
| `0x4286b0` / `0x4283b8` / `0x4281a8` / `0x428660` / `0x428688` | base50 move: `0x539d48`(clock += dt × 1/[[0x211f764]+0x38]); anchor = pos; type 0 / −1; clock > T + extra → vt+0x174 then the end; else owner active and (`+0x13ad` or `+0x1465`) → tail vt+0x168 (collide), else the end. Type 0: t = vminnm(τ/T, 1); t < 0.5: v = v0 + (t+t)(v1−v0), d = τ(v0+v)·0.5; τ/T < 1: v = v1 + 2(t−0.5)(v2−v1), d = (v+v1)(τ − 0.5T)·0.5 + T(v0+v1)·0.25; else d = T(v0 + (v1+v1) + v2)·0.25 (no further 0.5). Type −1: τ < T: v = v0 + (v2−v0)t, d = (v+v0)τ·0.5; else T(v0+v2)·0.5. Position = `+0x16a0` + rotXYZ((0,0,d)), `+0x4c` 0; scale vt+0x178 = from + (to−from)t → `0x43ab74` | uShellEmBase50 | R | shells.js slide50 / move50 |
| `0x10327c4` / `0x1032c10` | 04_50 contact: type 0 / 1 → `0x3f8970` ef `+0x15cc` / `+0x15d0`, byte `+0x15c0`, children `0x1032858`, `0x43ac04(+0x15e4)`, end; type 2 → ef `+0x15d4` only; **the position is NOT moved to the contact** (the children take `+0x40`, the step's own point). Time-out: byte, children, `0x43ac04` | uShellEm081_04_50 | R | shells.js move50 / children50 |
| `0x10314e8` | 04_01 +0x150: rate ≠ 0 and size ≠ 0 and `+0x1660` < 1 → `+0x1660` = mla(`+0x1660`, dt, rate) (unclamped), `0x43ab74`(0.0 + size × vminnm(`+0x1660`, 1)); else `+0x1664` < hold → `+0x1664` += `[[0x211f764]+0x68]` / `[[0x211f764]+0x38]`; else vt+0x148(0) | uShellEm081_04_01 | R | shells.js move081s0102 |
| STAND-IN | **`[[0x211f764]+0x38]` = 60** (CLOCK081_DIVISOR: base50's clock and 04_01's hold, in seconds -- INFERRED frames per second, NOT READ); `+0x68` = the viewer's dt | — | viewer rule | shells.js CLOCK081_DIVISOR |
| STAND-IN | the wings' / tail's charge bytes `[e+0xcb02]` / `[e+0xcb03]` = the viewer's charge rung (part-review's five rungs, one per ROM tier 0..4; motion-states.js: one level for all three regions) | — | viewer rule (mapping from existing code) | index.html shellChargeTier → input.chargeTier |
| base15 move turn | the turn's lateral vector `(−(sgn·A), 0, speed)` is turned by **`+0x1748..+0x1750` (0, the OWNER's Y word, 0)**, not the shell's words; the words become (hX, hY); **the velocity is the old velocity renormalised × speed** (run_move.py `step`, bit-exact vs the ROM) -- corrects spec §3b's pseudo-code (Withdrawn table) | uShellEmBase15 | R | shells.js move15 (checkpoint mode 0: m298 (600, 0, 2541.60) relative, exact) |
| tooling | efx/shellplan.mjs: the monster's OWN `shell` record first (Boltreaver's em081_00c c 30..32 sent defOf to Astalos's json); `early` flag-0 stops and plan `units`; efx/vecdrawsched.py plan `units` (per-unit `+0x40`, `0x8a4dfc`, `+0x68`); dev/shell-capture.mjs `--level`, efx/record_shells.py `--level=` (the charge rung, in the tag `_lvN`) | — | — | 2026-10-08 |
| transcribed (2026-10-08) | exported `shell` (UNIQUE): em081_00c 30 / 31 / 32 (cm200_040), em081_04u 10 11 25 26 40 41 60 63 64 70 73 74 80 81. Recorded and lifted (118 sets, vectors.list 12120 → 12238): `shell_em081_04_{L1M1_loop,L4M32,L0M24,L4M34}_none_0`, `_L2M48_70x7d_*`, `_L9M10_70xe0_*`, `_L4M22_70xdc_*`, `_L2M23_70x88_*` / `_70x87_*`, `_L2M48_70xcb_*`, `_L9M20_70xcf_*`, `_L9M8_70xdf_*`, `_L9M3_70xee_*`, `_L4M22_70xd5_*`, `_L4M62_start_70xc7_lv4_*` (each with `_near`). `add_effects.py em081_04 --check` after each phase: pages 99 / 0, soak 140 / 0, live / sweep / sweep enraged 140 / 0 | R (runs) | this section |
| NOT MODELLED, named | the AI's choice among a clip's actions (the viewer's pick rotates per play); `0x78b78` (u 11's landing wait: M42 plays alone); `0xb04d0`'s blend weight (L2 M48 with M33 / M35: the primary's frames); what u 40 does once shell14 is deleted (its request runs on, its units where last placed); shell00 2 / 8 (flight 0.0: their life is the unread hitdata) and every no-effect shell01 / shell00 mode (2..4, 9..11, 16, 17, 21, 22, 26, 27) | — | named | shells.js SHELL_DATA.em081_04 comments |
| `0x328ea8` → `0x31d028(core+0x50)` | **an effect whose parent unit is deleted ends itself**: `0x31d028` reads the parent handle `[block+0xf0]`; if `handle->vt[0]()` = 0 → `block+0x3c \|= 2`, handle := 0, return 1; `0x328ea8` then `[core+0x194]` := 0 and `vt+0x9c(core, 1)` (`0x328ec0..0x328ed8`). `0x43da0` tests the same handle (`0x43db4` / `0x43dcc` → `0x43e7c`) | uMHEffectCore | R (the consumer) / I (the handle's vt[0] = the unit's liveness) | Viewer agent 2026-10-08; proof.js `handleValid`, bridge.js `HANDLE_VALID` |
| STAND-IN | the parent handle answers 0 once its unit is deleted: viewer `host.parentGone(parent)` → proof.js `goneParents`; recorder `vecdrawsched.py` `<frame>:gone` → `x.gone_parents` → proofunit `handle_valid`. Applied to **base14 alone** (deleted the move after its end, dev/em081-shells-spec.md §5b): Boltreaver's u 40 ended there, where it used to run for ever (Raven 2026-10-08, "an effect that does not seem to stop"). Other bases: NOT applied — whether the viewer's `out.ended` is the game's deletion frame is unread per base | — | viewer rule | schedule.js `goneNext`; shellplan.mjs `gone` |
| trap | **the recorder's per-function cap drops a LATE path.** vectors.py keeps ≤ 60 (vecdrawsched 40) vectors per function, so a path first reached late in a run (an owner deleted at frame ~110: `0x43da0` 147 calls) is never recorded and the lift refuses it. `VEC_KEEP_NEW_PATHS=1` (opt-in) keeps the first vector of a never-seen path past the cap | — | — | efx/vectors.py |

### The effect ground ray -- 0x42744's ray arm and 0x18154c's answer (research agent + Viewer agent, 2026-10-07; dev/effect-ground-ray.md)

Boltreaver's L9 M22 stopped at f26 on **u 605** (payload `+0x52` 1, `+0x5c` 0x11), the one walked record that takes the ray arm.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x427e8..0x428e4` (in `0x42744`) | the ray arm: A = (x, y − 2000, z) (`0x42944` = −2000.0), B = the point; unit vt `+0xac`(unit, 1) → group, vt `+0xa8`(unit) → flags, area byte `[unit+0x1054]` (post-indexed `ldr` at `0x42870`); `0x18154c(*0x21200e0, &A, &B, area, &h, hitblock, group, above, flags)`; `ble 0x428e8` on a miss; hit → floor h, water = hitblock `+0x14` | uMHEffectCore | R | dev/effect-ground-ray.md §1.2 |
| `0x42908..0x4292c` | the join: `[block+6] & 4` → keep y; floor = `sp+0x9c`; `core+0xec` bit 0 → max(water, floor) | uMHEffectCore | R | §1.3 |
| `core+0xec` = payload `+0x5c` | copied `0x31c3d8` / `0x31c3e8` (→ block `+0x6c`); bit 4 = ray, bit 0 = max with water. No runtime writer in the core's code | uMHEffectCore | R (copy) / I (block → core shift, five fields agree) | §2 |
| `0x328c10` (vt `+0x60`) | the spawn height check: `core+0xe2` gate; joint `[core+0xc2]` (vt `+0xac` `0x329b7c`) → vt `+0x58` → 1 when y − ground > `core+0xe8` (payload `+0x58`); called from the base step `0x329390` when `core+0xd0` (payload `+0x40`) != 0; 1 → vt `+0x9c`(core, 2) | uMHEffectCore | R | §1.5 |
| `0x328bd4` | vtable `0x174b96c` `+0x58`: the base ground resolve, returns 0.0 | — | R | §1 |
| `0x181928` | ray start (x, max(A.y, B.y) + 10000, z); list `+0x54` = A.y + (reach > d ? reach : reach + d) (d = B.y − A.y; reach 100 / 50 flag 8 / 0 flag 2); `+0x50` = A.y; `+0x564` = −100000 | shared | R | §3.1 (refines the Walls-and-ceilings row `0x181928`) |
| `0x181ad4` | water height: `w & 0x1046` → `+0x564` = max; `w & 0x1004` → not recorded | shared | R | §3.1 (refines the `0x181ad4` row, which says 0x1004 for both) |
| `0x181138` | hit block: `+6` = attribute word 2, `+8` = word 1 (flags), `+0x14` −100000; no attribute record → 0x3fffffff per word | shared | R | §3.1 |
| `0x18154c` count rule | count 1 → index 0 with no pick (`0x18179c` `blo`); out height and block written on a miss too (`0x18189c`); returns 1 / 0 / −1 | shared | R | §3.1 |
| `0xbdf2c..0xbdf38` | the enemy probe's hit: `P+0x5b4` = `e+0x10f0` = the picked floor (posture 6 gated on `e+0x1068 & 0x18`) | shared enemy | R | §1.4 |
| `0xaa2d0` / `0xaa1e0` | enemy vt `+0xa8` (ray flags: posture 5 → \|8; postures 1..6 → 0x10000 / 0x20000; `0x490fc(area)` → 4) / vt `+0xac` (group 4 / 8 / 0x808 / 0x1804 \| 0x8000); thunks `0x6bb44` / `0x6bb48` on 93 vtables | shared enemy | R | §1.2 |
| `*0x21200e0` (GOT `0x183224c`) | the collision singleton (INFERRED sCollision); **null in the recorder**: the 2026-09-25 fault `0xc14100` read `[0 + 0x3b58 + 0x14]` = .text `0xe3a0007f` | — | R (arithmetic) / I (name) | §3.4 |
| STAND-IN | **`0x18154c` is answered, never run**, against ONE floor plane: viewer native `docs/render/rom/effect/bridge.js` (after `PARENT_VFN_A8`), floor = `m.svc.stageRay()` = host.stageFloorY, set per frame from rockInput `floorY` (live.js); recorder service `stage_ray` in `efx/proofunit.py` (floor 0.0, the parent at the origin), replayed by `dev/effect-check.mjs` `stageRay`. Hit when floor < B.y + 10000: height = floor, block `+0..+6` 0, `+8..+0x10` 0, `+0x14` −100000, `+0x18` floor, `+0x20` (0,1,0) (I: normal), above `+4` 0, `+0x40` 100000, r0 1; else A.y, r0 0 | — | viewer rule | §4.1 / §4.2 |
| STAND-IN | the parent's vt `+0xa8` / `+0xac` answer 0 from fixed addresses `0x7e001014` / `0x7e001018` (bridge.js `PARENT_VFN_A8` / `_AC`, host.js createParent; efx/parent.py `VFN_A8` / `VFN_AC`). A standing monster's `+0xa8` is 0 or 4, both reach 100 (`0xaa2d0`) | — | viewer rule | §4.1.2 |
| MEASURED | **u 605 recorded with the stand-in** (`add_em081_04_u605` / `_high` / `_near`, each with one `stage_ray` call), lifted; `0x42744` 2/2; Boltreaver 140 motions clean in pages / soak / live / sweep (2026-10-07). `add_effects.py stage_ray()` refusal **RETIRED** (opt back in with `EFX_REFUSE_STAGE_RAY=1`): the other 69 ray records, Duramboros's eight first, now plan and record like any other | — | viewer rule | efx/add_effects.py `stage_ray` |
| NOT READ | the traversal `0xc3a254` / `0xc39b28` and filter `0xc14924` (where the ray ends below, which layers it sees); `0x5024b0`; `0x182dd4`'s vec3; a plain ground polygon's attribute words 1 / 2; vt `+0x9c`(core, 2) meaning "not spawned" (I) | — | — | §6 |

### Akantor -- the rage material machine and its six materials (Viewer agent, 2026-10-08; docs/render/monster.js ROM_STAGE_CLIPS em033_00)

Raven: "Akantor's eyes remain orange, they should be green in calm and then orange in enraged." The eye stuck orange after the first rage: the viewer's machine entry named the wrong three materials and never put Normal back.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xe362a4..0xe36324` | spawn cache of the six rage materials **by MRL id**: per model material `0x88db14`, id = `[mat+0x18] >> 22`, `uxtab` id − 1, switch 0..5 → `ctl+0x30 + 4(id−1)` (ctl = `[e+0xcac0]`). Akantor: +0x30 m01_body, +0x34 m02_eye, +0x38 m03_sukima, +0x3c m04__kekkan, +0x40 m05_body_add01, +0x44 m06_body_add02; m00_face (id 0) not cached | uEm033_00 | R (the cache) / I (mNN = MRL id, the convention of em086 / em063_05's rows) | monster.js ROM_STAGE_CLIPS em033_00 comment |
| `0xe37560` (vt+0x210) | the rage material machine, ctl[6] 0..3, jump table `0xe37594`: 0 + enraged → `Angry_Start` slot 1 (time 0) on +0x3c/+0x40/+0x44 → 2; 2 → when +0x3c's Angry_Start time ≥ its frames (`0xe377ac..0xe37800`, `blt` exit if the clip is absent) all six `clearAllSlots` + `Angry` slot 0 → 1; 1 + calm → `Angry_End` slot 1 on the three → 3; 3 → when +0x3c's Angry_End has run, all six clear + `Normal` slot 0 → 0 (`0xe378c8..0xe37930`) | uEm033_00 | R | monster.js ROM_STAGE_CLIPS em033_00 (`layered`) |
| `0xe37934..0xe379c0` | after the switch: vt+0x3f4 (`0x7fed4`) = 1 and ctl[6] = 0 → `End` in slot 1 of +0x38 (sukima) unless already there (`0xb0cff0`) | uEm033_00 | R | **not transcribed** (no action category in the viewer) |
| m02_eye clips | `Normal` tex key 1 = the green-eyed atlas (`bb455a75`), `Angry` key 2 = the orange (`7513448e`); kind-3 keys are 1-based into the entry's texture list | — | R (data) | materials.json em/033_00 |

### Khezu -- the turn clips' postures (research agent for the Viewer agent, 2026-10-05; posture-em003_00.md section 13 "The FwMove clips")

| addr | what | st | detail |
|---|---|---|---|
| `0xca050` / `0xca05c` | `bx [vt+0x3dc]`; r1 (the "<em>XxxMove" / "emUniqueActMain" string) discarded -- plays nothing | R | posture-em003_00.md 13 |
| `0x75168` (vt+0x3dc, shared) | idle chooser: `0xbc7f4(e,0)` then action (0, 0/1/2) | R | same |
| `0x7a258` / `0x7a284` / `0x7a2b0`, `0x7a27c` / `0x7a2a8` / `0x7a2d4` | angle-picked turn: start / continue, table mode 0/1/2 -> `0x794f0` / `0x79a00` | R | same |
| `0x772b4` | plays a turn table's motion: `+0x10` straight (threshold `+0xe`), `+0x20` / `+0x30` sides; `P+0x336 & 0x100` -> `0xb00b4(m1 = +0x10, m2 = side)` | R | same |
| `0x169b774..0x169ba33` | Khezu's turn tables -- why the posture dataflow never saw these clips (ids in data, not immediates) | R | same; motion-states.js CLIP_POSTURE em003_00 |
| `0x1795f00` / `0x1795f08` | Khezu's ceiling / wall turn arrays (L5 M39 / M40 / M6 / M7, sides mirrored): [5, 6] | R | same |
| `0x9c760` | posture-indexed reaction router (tables `0x9c82c` / `0x9c878`) | R | same |

### Agnaktor -- per-region heat (research agent 2026-10-06, dev/em049-heat.md; transcribed by the implementation agent for the Viewer agent, 2026-10-07)

| address | what | class | status | detail |
|---|---|---|---|---|
| `0x17c5eb4` | uEm049_00 vtable (`+0x1f4` 0xec0a20, `+0x1fc` 0xeb4ae0, `+0x204` 0xeb4dd4, `+0x208` 0xec1578, `+0x210` 0xec1cec, `+0x214` 0xec2550, `+0x1dc` 0xeb5198, `+0x24` 0xeb4a24) | uEm049_00 | R | dev/em049-heat.md |
| `E+0xcac0 + 2k` / `E+0xcad0 + 4k` (k 0..7) | per-slot heat state (0 cooled, 3 heating, 2 molten, 1 cooling) / its half-step timer; slot k = break part k (head, chest, legs 2..5, back, tail) | uEm049_00 | R | §1 |
| `0xec22c8` (from `0xec21d4`) | the heat machine per lava material: cool_Loop / maguma_Change (or Loop on reheat) / maguma_Loop / maguma_End; 3 -> 2 past 60, 2 -> 1 past 30 x tune int 0/1 (= 900), 1 -> 0 past 180; slot map by MRL id 51..56 | uEm049_00 | R (ids I) | §3, §4b |
| `0xec1cec` (vt+0x210) | part driver: heated group unless (`vt+0x3f4` = 0x7fed4, groups 11 / 14 / (12,0xff)) and state 0; groups 3/4 .. 17/18/19 heated, 20/21 .. 34/35/36 cooled | uEm049_00 | R | §4a |
| `0xec0dbc` (from vt+0x208) | hit zones: cooled and intact -> table 0, else table 1; zone 0 head, 1/5/7 back, 2 chest, 3 slots 2+4, 4 slots 3+5, 6 tail | uEm049_00 | R | §4c |
| `0xec146c` / `E+0xcb2e` | cooled-part accumulators (P+0x4a8 x tune int 4, P+0x4b8; threshold tune int 2 / 3) -> reheat-request bits; consumed by `0x7fba0` (vt+0x1dc) and `0xec2550` | uEm049_00 | R / meaning I | §2d |
| `0xeba3d8` / `0xebcd94` / `0xebebec` | beams L2 M4 / M11 / M30: chest heated f0, head f100 (+0xcb2e bits 1 / 0 cleared) | uEm049_00 | R, H | §2a |
| `0xebb520` | beams L2 M27 / M28: all eight slots heated f0 | uEm049_00 | R, H | §2a |
| `0xeb5ae8` (from `0xeb6e60`, status 1) | reheat action (1, 8..0x46): heats a subset of six groups at f0 of L3 M14 | uEm049_00 | R (table), H (sets) | §2b |
| `0xeb4dd4` (vt+0x204) | action start: P+0x1bb bit k <-> state 0 / 3 sync; (10, 0xa / 0x38 / 0x5c / 0x60) heat all eight | uEm049_00 | R | §2b, §2e |
| `0x7fed4` (vt+0x3f4, shared) | 1 iff action group 11 or 14 or action (12, 0xff) | shared | R | §4a |
| action group 11 / 14 / (12, 0xff) -> clips | (11, 0) L3 M12 (script `0x17c6b00`); (11, 3) `0x17c6ce0` L3 M21 -> L3 M18; (11, 6 / 7 / 0x22) `0x17c6b88` and (11, 0x12) `0x17c6b10` L3 M18; (11, 0x10) `0x17c6ba0` L3 M10 -> L0 M16. **Only L3 M12 is group 11's alone** (L3 M18 / M21 / M10, L0 M16 are also status-10 reactions). Group 14 and (12, 0xff) set no motion in this class (`emUniqueActMain` / `revival_move` unhandled). Same sweep: the heater clips' other players (L2 M6 also (7, 6/7/8/0x22/0x2b/0x2c); L2 M18 also (6, 1); L0 M1 the idles; L3 M21 also (11, 3); L3 M15 also (10, 0x67)) | uEm049_00 | H (efx/agents/notice-scratch/probe.py + cephadrome-scratch/scr.py, statuses 0..17 x 0..0x7f, first motion of each script) | motion-states.js HEAT_CLIPS comment; monster.js ROM_HEAT_REGIONS comment |
| `0xec1cec`'s break compare, vs `docs/part-rest.json` em049_00 | the compare is `cmp threshold, level` / `movhi` = intact, so part-rest's em049_00 "undamaged" set [4, 6, 8, 10, 12, 14, 16, 18, 35] is the BROKEN groups (intact heated: 3, 5, .. 17); `build-partrest.py` assumes `cmp level, threshold`. Not hand-edited (the file is generated; a generator fix must detect operand order and would touch other classes). Visible only under Raw Parts: the review rows' defaults win otherwise | uEm049_00 | R (compare, the note §7) / generator cause I | dev/em049-heat.md §7 |
| `build-partrest.py` LOW_ARM, vs `0xec1cec` (upgrade of the row above, verification agent 2026-10-07) | the generator takes `lo` / `ls` as the undamaged arm whatever the `cmp` operand order (its LOW_ARM, read); uEm049_00 writes `cmp thr, level`, so its `movls` = broken. The same 9 sites' `movhi` arms give **[3, 5, 7, 9, 11, 13, 15, 17, 34]**. Consumers (read, and run headless): only `defaultGroupsOn` -> Raw Parts' opening groups (4, 6, .. 18 drawn = every part broken); the default open uses the review rows (groups 0, 1, 3, 5, .. 17 = intact), and Raw Parts turns the state table off for every monster (`zoneStates`), so **no hit-zone path reads it**. Left for a generator fix (shared) | uEm049_00 | R (generator source + compare) | scratchpad hz049/hzprobe2.out |
| `0xec0dbc` / `0xec1cec` break thresholds | `[[E+0x75f0]+0x64]` = the `.dtp` array A (em049_00_dtbparts.dtp, 8 x 4 B, file 0x4d); byte 1 at rank <= 4, byte 2 at `0x3a8430` > 4. Entry per break part, BOTH routines: 0, 1, **2, 2, 4, 4**, 6, 7 -- parts 3 / 5 read parts 2 / 4's entries (`ldrb [A,#9/#0xa]`, `#0x11/#0x12`). Values head 2/2, chest 2/3, legs 1/1 (A[2..5] all 1/1, so the reuse changes nothing), back 1/1, tail 1/2. `0xbaacc(E,s)` = `[dt+0xc]+10s` (table 0), `0xbaafc(E,s,r)` = `[dt+0x10]+10r` (table 1) | uEm049_00 | R | hz049/ec0dbc.txt, ec1cec.txt |
| **hit zones verified 2026-10-07** (verification agent) | `0xec0dbc` under unicorn (build/hitzone-states/meatemu.py Run + the real .dtp A), 14,432 runs, ranks 5/3/1/0, each zone exhaustive over its slots' states 0..3 x its parts' levels 0..3 + 3000 random: **0 mismatches** vs §4c, **0** vs monster.js `meatTableFor` on the 3,958 runs the viewer can show (controls: legs heat swapped 523, part 2/3 swapped 548, rank byte inverted 733). Headless viewer: every Broken row alone x cooled / heated / death clip, Beam heated through heating / molten / cooling (table 1) to cooled (table 0) = the ROM. Capsules 33/33 placed (slots 3/2/1/6/6/4/6/5, none special-only, conditional or copied). Bake: every drawn mesh in every state has a bake of its own length (control: the 6 hideIdx prims flagged when visibility is ignored). Panel values = the .dtt tables (0x90 / 0xe0), 16/16 rows. Mapping by skinning: break part k's meshes sit on .bdd part k's capsules; zone 3 = parts 2 + 4 = RIGHT legs (-X, joints 10-13 front / 19-22 rear, m01), zone 4 = parts 3 + 5 = left | uEm049_00 | R + H | scratchpad hz049/ (zonerun.py, zonecmp.mjs, bakecheck.py, hzprobe.mjs) |
| tail sever vs zone 6 | `0xec0dbc` zone 6 reads break 7's level only; `0xec1cec` draws 19 / 36 on `vt+0x370(E,1)` (sever) whatever the level, so a Severed row does not say whether break 7 reached its threshold. The viewer reads Severed as not broken (cooled + severed = table 0). Whether a sever implies break 7 >= threshold: NOT READ | uEm049_00 | R / gap | monster.js em049_00 ROM_MEAT_SWITCH comment |
| **transcribed** | the six region machines (`0xec22c8` per material; monster.js ROM_STAGE_CLIPS em049_00 `heat:`, ROM_HEAT_REGIONS), the part rule (`0xec1cec`: index.html applyPartState, heated group in play, cooled only in L3 M12 with the region cooled), the hit-zone rule (`0xec0dbc`: monster.js ROM_MEAT_SWITCH em049_00 `heat` rules + cooled broken groups), the heating clips (motion-states.js HEAT_CLIPS); Heated = all six, Beam heated = head + chest. The viewer reverts a clip's heat at its end (Raven's choice), where the game holds molten 1800 f then cools | uEm049_00 | -- | those files |

### Bloodbath -- List 9 effects (research agent for the Viewer agent, 2026-10-08; dev/em007_04-list9-census.md)

Raven: "Look into Bloodbath's List 9 animation effects." 53 PSL bindings on L9 M4..M30: 36 running, 4 wrongly gated, 1 refusing (L9 M27), 11 missing (3 records unexported), 1 never enabled; 7 shell-carried records. No class request reaches List 9. Not yet transcribed (census only).

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xd4532c` (vt+0x13c) | the PSL enable word: `0xca170`, then EVERY motion `+0x13f4 \|= vt+0x370(e,1) ? 0x1c0000 : 0x38000` (bits 18-20 tail severed / 15-17 intact); L0 M5/M7 bits 24-26 if `[[e+0x1428]+0x1ba]==0`; L2 M15 / M19 / M22 (bit 21, variant 4, (7,0x67)) / M31 and **L9 M11** action arms; L3 M20 bit 22/23 by vt+0x3f4. Emulated (`emu13c.py`), identical | uEm007_00 | R | census §1.1 |
| `0x169bd20` (5 words) / `0x1592818` (4 words) | T1 for L2 M15, (7,0xb4..0xb8): bits 27 / 28-29 / 28-29 / 30-31 / 30-31; T2 for L2 M31 and **L9 M11**, (7,0xb5..0xb8): 28-29 / 28-29 / 30-31 / 30-31. Both arms then **clear bits 0-5** (bfc) | " | R | §1.1 |
| `0xa3bf4` (vt+0x370) | `([[e+0x1428]+0x3b4] & r1) != 0`; with r1 = 1 it is P+0x3b4 bit 0, which `0xc2274` (the sever) sets for option kind 1 (`e+0x8b94+slot*0x14f0`; kind 2 -> bit 1, 3 -> bit 3) = **tail severed** | shared | R | §1.1 |
| L9 PSL vs the word | out-of-mask, enabled: M9 b0 u 381, M10 b15 u 630 (intact) / b18 u 631 (severed), M11 b28 u 911 (7,0xb5) / b30 u 912 (7,0xb7), M14 b0 c 2, M19 b1 u 600, M22 b1 u 913, M25 b0 u 600, M30 b1 u 950 (em045_04_000); in-mask unexported M16 b0 u 904; enraged-only M16 b9/b10; never M11 b27 u 910 | em007_04 | R | §2, §4, §7 |
| control | 31 of the 35 named PSL bits >= 15 in all em007_04 PSLs are reached by an arm of `0xd4532c`; the 4 misses are u 910/911 on L2 M19, L2 M31, L9 M11 | " | R | §1.1 |
| `0xd44bf0` (7,0xc8) | five phases, table `0xd44c3c`: L9 M26 -> M27 -> M28 (`0xb0df4`) -> M29 -> **M30**; shell 0x71 mode 7 (u 300) at **L9 M30 f10** (gate `0xd44e20`, phase 4) | uEm007_00 | R | §1.3, §5 |
| `0xd41b48` (7,0x77/0x79/0x7a/0x7b) | L9 M10; three shell07 `0x72` spawns `0xd41de8/0xd41e94/0xd41f3c` at tune 24/25/26 = f128/132/134; modes from `0x169bc60` {0,1,2} intact / `0x169bc78` {3,4,5} severed (vt+0x370 at `0xd41d1c`), +6 when the arm's r1 == 0 -> u 0+u 1 / u 10+u 11. No variant test on the spawn | " | R | §5 |
| `0xd446dc` | shell 0x71 mode 5/6 spawner: r1 0 -> 5, 1 -> 6; callers `0xd4463c` ((7,0xa0)/(7,0xa1), L9 M22/M23) and `0xd449ac` ((7,0xa2)/(7,0xa3)) | " | R | §5 |
| `0xd421d8` | L9 M11 body (a 180-degree turn, `0x76dd0` f12-26), selector r1 0..8 from (7,0x6f/0x73/0x71/0x70/0x8d/0x8a/0x5a/0xb5/0xb7) | " | R | §1.3 |
| `0xa692a0` / `0xa6980c` | rotation onto an axis; `0xa6980c` is its dot <= -0.999 (antiparallel) arm, never recorded = **L9 M27's refusal** (f16). Caller NOT identified: alive then u 914 x3 (em007_04_000 polyline row 22) and u 350 x2 (em007_00_000 type-2 row 24 + polylines); lifted callers `0xa9a788`/`0xa9ad90` (type-2 draw), `0xaa91d8`/`0xaa946c`, `0xa65694`/`0xa6586c` (in `0xa654a0`, from the polyline layer); 29 ROM callers | effect runtime | R (arm) / I (path) | §3; board 2026-10-08 |
| `0xa69400` / `0xa697f0` (in `0xa692a0`) | the `0x80` path's inputs: A = v . M with v = the particle direction at `[fp+8]` (`0xa693f8`, read at `0xa69400`) and M the effect's rows `[r8+0x18]` +0x00/+0x10/+0x20; U = (s24, s22, s20) the axis chosen by `[r5+0x18]` bits 24-27 (`0xa69538`); dot at `0xa697f0..0xa69808` | uMHEffect type 2 | R | Viewer agent 2026-10-08 |
| **FIXED 2026-10-08** | the L9 M27 refusal: `0xa6980c -> 0xa69820 -> 0xa698d8` (axis +-Y) recorded by **injection** (Raven: "Replay with set inputs") -- `vecdrawsched.py INJECT_ANTIPARALLEL=<n>` writes v = -U . M^-1 at `0xa69400` so the ROM's own code takes the arm; sets `add_em007_04_u914_antipar` / `_u350_antipar` (both effects reach the routine); lifted, vectors.list 12240. Soak of all 27 L9 motions in the refusing order: **0 refused**. Still unrecorded: the large-X-axis sub-arm `0xa6989c` (neither effect's axis) | — | R (emulated) | efx/vecdrawsched.py |
| em007_04_000 rows | per key (mask1 = payload +0x48): 900 `0x4` rows 0-6; 901 `0x2`; 910 `0x400`; 911 `0x800`; 912 `0x1000` (incl. poly 22); **913 `0x2000` = rows 12, 14 only, both MODEL**; 914 `0x4000` (incl. poly 22); UNIQUE 200 `0x1`. Only row 31 is mask2-gated (`w04 0xa2`) | data | R (gate rule: Row gate section) | §0 |
| trap | the 2026-09-20 "zero billboards on u 913" was read against `engdraw --proof`, which applies the wrong block words as masks; u 913's own mask1 selects two model rows, at every LOD rung | — | R | §0 |
| **implementation, item 1 (2026-10-08)** | the enable word transcribed: docs/render/psl-mask.js `em007_04` (CLASS_MASK, every arm of `0xd4532c`; a clearing arm returns `{set, clear}`), `PSL_MASK_MONSTERS += em007_04`, CLIP_ACTIONS em007_04 (L9 M11, L2 M15 / M19 / M31, L3 M20 actions; L0 M5 / M7 `posture`), `clipPostureFor`; index.html `playNow` passes `severed` (shellTailInput) and `posture`. Control: the census's 16 emulated words reproduced exactly (node, scratchpad bb/pm.mjs). `--apply`: 5 records exported (u 202, u 360, u 630, u 904, u 950), em045_04_000.efl staged; CLIP_EFFECTS 90 -> 96 motions, nothing dropped | em007_04 | R | implementation agent (Bloodbath List 9) |
| `0xd36e50` (uEm007_00 vt+0x210, the part pass) | variant 4: set **0xb** when vt+0x370(e, 1) (the sever bit), else **0xa** (`0xd37044..0xd37068`); set 11 draws part 4 (monsters.json em007_04 groups[11], the Tail row's "Broken" that sheds the tail piece). The viewer reads the sever bit from part 4 shown: motion-states.js `SHELL_TAIL.em007_04 = { severed: 4 }` (feeds the enable word's bits 15-17 / 18-20 and shell07's table) | uEm007_00 | R (set) / viewer data (part) | psl-mask.js em007_04 comment |
| `P+0x1ba` (`[[e+0x1428]+0x1ba]`) | **the POSTURE byte**: the setter `0xbc7f4(e, p)` stores p at `0xbc97c` (early-out when equal, `0xbc8ac`); `0xbc984` / `0xbca24` write 1; the spawn init `0xb8b98` writes 0 (`0xb8e84`, r8 = 0 at `0xb8bbc`). Closes census §6 E6 | shared enemy | R | — |
| L0 M5 / L0 M7 plays (bits 24-26) | the action sets the posture BEFORE setMotion (the word is built at setMotion): posture 0 -- L0 M5 `0xd393fc` (`0xd39478` -> `0xd39560`), L0 M7 `0xd39c40` (`0xd39c98` -> `0xd39cac`) and `0xd419dc` ((7, 0x6a): `0xd41a10` -> `0xd41a24`); posture 4 (the burrow) -- L0 M5 `0xd3b908`, L0 M7 `0xd3b9fc` (u 1400) and `0xd3c4a0`. Bits 24-26 (c 0 / c 1 on M5, c 2 / c 3 / c 30 on M7) fire on the posture-0 plays only; the viewer alternates (CLIP_ACTIONS `posture` 0, 4). Agrees with motion-states.js CLIP_POSTURE em007_00 [0, 4] and diablos-scratch/phaseflow.txt | uEm007_00 | R | psl-mask.js em007_04 |
| (7, 0xb4..0xb8) / (7, 0x5a) by phase | probe (actprobe7 with P+0x1a1 = 1 and the frame gates answered, scratchpad bb/phprobe.py): (7, 0x5a / 0xb5 / 0xb7) phase 0 L9 M11, **phase 1 L2 M31** (start 40, `0xd42314`; selector != 0, `0xd422d0`); (7, 0x6f) phase 1 the idle chooser; (7, 0xb4) phase 0 L2 M15 start 0, (7, 0xb6) / (7, 0xb8) L2 M15 start 98 (setMotionL `0xd3ce0c`); **(7, 0xb8) phase 1 L2 M19** (`0xd3dc38`); (7, 0xb4) / (7, 0xb6) phase 1 -> action (2, 0xc8). So T2 serves L9 M11 and its own L2 M31; (7, 0xb6) / (7, 0xb8) never play L9 M11 (census §6 E4 answered) | uEm007_00 | R (emulated) | psl-mask.js CLIP_ACTIONS em007_04 |
| L3 M20 plays (bit 22 / 23) | scripts playing L3 M20: (10, 0x63 / 0x65 / 0x66 / 0x7d / 0x7f / 0x80) -> vt+0x3f4 0 -> bit 22; (11, 3 / 7 / 0x12 / 0x22) -> 1 -> bit 23 (c 3000, cm202_080). efx/agents/diablos-scratch/scrpost7.txt (script table `0x179a330..`). The viewer alternates (10, 0x63) / (11, 3) | uEm007_00 | R (data) | psl-mask.js CLIP_ACTIONS |
| MOTION_STATES em007_04 `0|Motion[1]` holds | c 30 / c 40 / u 230 now name `'UNIQUE'` (the group-6 records are UNIQUE: the row's own comment): c 30 is also L0 M7 bit 26's SEQUENCE cm202_000 once the word is read, and add_effects.py export refuses a key held in two arrays without one | em007_04 | R | motion-states.js |
| shell01 `0x71` spawn requests (item 3) | all four sites (`0xd41334` mode 0, `0xd44730` 5 / 6, `0xd44e48` 7, and `0xd4179c` 3) fill `0x3fa2bc(0x40)` the same: +4 0x71, +8 mode, +0xc enemy, **+0x10.. the ENEMY's own +0x40 / +0x44 / +0x48** (not the block's, unlike `0xd36ac8`), +0x20.. a GOT vec3, +0x30.. the enemy's words +0xfe8.., +0x3c 0xffff (5 / 6: [P+0xb0a]). Gates `0xb0974` at tune 27 / 0x74 / 0x7c (f116 / f154 / f10). Arms: (7, 0x62) `0xd34a74` -> `0xd411e8`; (7, 0xa0) / (7, 0xa1) r1 0 / 1 (`0xd34ccc` / `0xd34cd4`); (7, 0xc8) `0xd34d74` -> `0xd44bf0` | uEm007_00 | R | render/shells.js SHELL007 (SHELL_DATA.em007_04) |
| `0xd46770` 0x71 side, transcribed | render/shells.js `params007s01` (READERS01): bit 0 cleared; int 0 joint, 1 -> 0x4, 2 -> 0x8, 3 -> 0x800, 4 -> 0x80; float 0 timer; vec 0 / vec 1 (+0x160c = init011 `deg`); ef 0 only. Mode 3's 0x800 refused by name (base01's +0x1650 arm not transcribed; mode 3 has no effect record) -- L9 M7 f160 not listed | uShellEm007_04_01 | R | shells.js |
| `0x72` = `uShellEm007_04_07`, **base07** | vtable `0x179aae8` (89 slots; own +0x4, +0x14, **+0x28 `0xd46c40`**, **+0x14c `0xd46a94`**); base07: ctor `0x402148`, init +0x13c `0x4022a8`, move +0x24 `0x402914`, step +0x158 `0x402a1c`, integrate +0x15c `0x402bac` (-> `0x539224`), hit reg. +0x160 `0x402c98`, landing +0x150 `0x402050`, end +0x148 `0x402d04`, +0x154 bx lr. Second user: uShellEm018_04_07 (id 152) | base07 | R | dev/em007-base07-spec.md 1 |
| `0xd46a94` (shell07 reader) | ef 0..3 -> +0x15c8..+0x15d4 (flight / landing type 0 / 1 / 2); hit 0 -> +0x15d8; int 0 joint +0x15dc, ints 1 / 2 the landings' camera ids (`0x43ac04`); int 3 -> +0x15e8 bit 1 (keep the words), int 4 -> bit 2 (vecs x size `0xbe518`), int 5 -> bit 3 (`0x43ab74`, unread); float 0 F +0x15ec, float 1 H +0x15f0; vec 0 / 1 pointers +0x15f4 / +0x15f8 | uShellEm007_04_07 | R | spec 2 |
| `0x4022a8` (base07 init) | P = owner's own +0x40 (joint -1) + vec 0 (x size) turned Z, X, Y by the owner's u16 words; T = P + vec 1 turned; v = (dx / F, H / (F/4), dz / F), gravity y = H / (h (h x -0.5)) in double (h = F/2): a parabola of apex H landing back at P.y at t = F; words the owner's; life +0x1600 = 2F; ef 0 at +0x40 -> +0x1604. F <= 0 -> returns 0 | base07 | R | spec 3 |
| `0x402a1c` / `0x402050` / `0x402d04` | step: anchor = pos, `0x539224` (= stepFlight), words from v unless bit 1, life countdown, the rocks' query `0x43ac8c` (mask 0x30); landing: ef 1 / 2 / 3 by hit type at the contact -> +0x1608, then end; end: ef 0 stopped (flag), state 0xfe, 30 x 60 ending. +0x28 `0xd46c40` -> `0x43b2b0` each frame (a pooled ground marker, `0x2b3c8`: INFERRED a shadow; not modelled) | base07 | R / I (+0x28 meaning) | spec 4-5 |
| shell07 spawns (item 4) | `0xd41b48` (L9 M10, phase 0 `0xd41bac`): phase 1, three gates tune 24 / 25 / 26 = f128 / f132 / f134; `0x402014(0x30)` +4 0x72, +8 table mode + r6, +0xc enemy, +0x10 GOT vec3, +0x20 [P+0xb0a]; tables `0x169bc60` {0,1,2} / `0x169bc78` {3,4,5} by vt+0x370(e,1) (`0xd41d1c`); r6 = 6 for arm r1 0: (7, 0x79) / (7, 0x7b) -> 6..8 / 9..11; (7, 0x77) / (7, 0x7a) -> 0..2 / 3..5 | uEm007_00 | R | spec 6; shells.js SHELL007 |


## 1b. The decode notes — `E:\offline\decode
otes\` (82 files)

**This directory is where "the detail lives" for most of section 1, and the map did not point at it.** It
cost three separate re-derivations on 2026-09-30 alone — the worst being `effects-em081_00-charge.md`, which
already held the complete Astalos charge wiring table (every record, its mask, what fires it, when it starts
and stops, the 41 charging attacks with motions ROM-RUN, the discharge actions) while that work was being
redone from the ROM. **A row that cites a note is not read until the note is open** (trap 18); this index
exists so the note can be found at all.

Nothing here is verified by the indexer — the titles are each file's own first heading, and the dates are
file mtimes. Regenerate by listing the directory and taking the first `#` line of each file.

| file | its own title | last written | size |
|---|---|---|---|
| `README.md` | decode/ — index | 2026-09-08 | 2 KB |
| `breaks-em001.md` | Rathian (em001_00): part breaks, the torn wings, the tail sever and the cut tail | 2026-09-22 | 21 KB |
| `breaks-em037.md` | Nargacuga (em037_00): part breaks, the tail sever and the cut tail | 2026-09-21 | 17 KB |
| `breaks-em043.md` | Savage Deviljho (em043_05): part breaks and the tail sever | 2026-09-21 | 28 KB |
| `completeness.md` | The completeness rule — the census that had never been run | 2026-09-08 | 2 KB |
| `effect-node-infinite.md` | cParticleNodeInfinite (generator type 25, row word 3 bits 0xf0) — decoded from the ROM | 2026-09-23 | 45 KB |
| `effects-color.md` | Effect colour: what happens to an effect draw's output between the draw and the screen (2026-09-21) | 2026-09-21 | 24 KB |
| `effects-distance-fade.md` | The effect distance fade and its angle factor (0xca6874 / 0xca6988) | 2026-09-25 | 4 KB |
| `effects-draw.md` | Effect draw: what a Model particle hands the renderer, and what the engine makes of it | 2026-09-21 | 34 KB |
| `effects-efl.md` | rEffectList (.efl) | 2026-09-08 | 5 KB |
| `effects-em021_00.md` | Congalala (em021_00) effects — the wiring, the chain walk, and what did NOT run | 2026-09-25 | 5 KB |
| `effects-em043_00-unrequested.md` | Deviljho (em043_00): who requests u 1301 / 1302 / 1303 / 1311 / 1312 / 1313 / 1400 | 2026-09-23 | 18 KB |
| `effects-em081_00-charge.md` | Astalos (em081_00): the CHARGE EFFECTS -- the effects his own class requests | 2026-09-25 | 35 KB |
| `effects-filter.md` | Effect FILTER: generator type 9 (cParticleGeneratorFilter) -- request, consumer, draw (2026-09-21) | 2026-09-21 | 34 KB |
| `effects-firing.md` | What starts a monster's effects (PEL records, requesters, masks) | 2026-09-21 | 28 KB |
| `effects-generator.md` | cParticleGenerator and its 26 concrete subclasses | 2026-09-21 | 5 KB |
| `effects-ground-ray.md` | The effect ground-height ray (0x42744 -> 0x18154c) | 2026-09-25 | 6 KB |
| `effects-node.md` | Effect generator type 25 (cParticleNode) and sGpuParticle — decoded from the ROM | 2026-09-21 | 46 KB |
| `effects-nodeblocks.md` | Effect node blocks: the four sub-block offsets at +0x68..+0x6e, and 0xae8268 | 2026-09-22 | 29 KB |
| `effects-pel.md` | rProofEffectList (.pel) | 2026-09-08 | 3 KB |
| `enemy-actions-emc.md` | Enemy action layer: EMC command tables, action dispatch, shells, held objects | 2026-09-17 | 12 KB |
| `gaps.md` | Gaps — what this pass did NOT establish | 2026-09-08 | 4 KB |
| `posture-em003_00.md` | Khezu (em003_00): the posture byte `P+0x1ba` per clip, what each posture means, and how high he goes | 2026-09-24 | 61 KB |
| `posture-mount.md` | The surface frame: what the engine does to a monster's transform in postures 5 (wall) and 6 (ceiling) | 2026-09-23 | 33 KB |
| `puff-pick-em001.md` | Rathian (em001_00): the rage-puff pick u 1120 / u 1121, and joint 4 from the ROM | 2026-09-22 | 24 KB |
| `questions.md` | Questions — written before the work | 2026-09-08 | 3 KB |
| `shared-state-effects.md` | Shared state effects on Rathian (em001_00c c 1100 / 1106 / 1108 / 1109 / 1130..1137 / 1200 / 1201 / 1500, the hyper u 1301..1314, the flag-driven landing dust) | 2026-09-28 | 41 KB |
| `shells-api.md` | The shell API: how a monster gets its shells | 2026-09-27 | 13 KB |
| `shells-em001.md` | Rathian's shells (em001_00): decode | 2026-09-22 | 51 KB |
| `shells-em037.md` | Nargacuga's shells (em037_00): decode | 2026-09-21 | 37 KB |
| `shells-em043.md` | Savage Deviljho's shells (em043_05): decode | 2026-09-21 | 50 KB |
| `states-em001.md` | Rathian (em001_00): state changes, the motions that carry them, and their frames | 2026-09-22 | 36 KB |
| `states-em002_04.md` | Dreadking Rathalos (em002_04): state changes, breaks, the tail sever, and the clips that carry them | 2026-09-22 | 39 KB |
| `states-em003_00.md` | Khezu (em003_00): part breaks, rage, the ailments, tiredness, death -- and the Taiden (charge) state | 2026-09-23 | 46 KB |
| `states-em004_00.md` | Basarios (em004_00): part breaks, rage, the ailments, tiredness and death | 2026-09-23 | 56 KB |
| `states-em005_00.md` | Gravios (em005_00): part breaks, rage, the ailments, tiredness and death | 2026-09-24 | 66 KB |
| `states-em007_00.md` | Diablos (em007_00): part breaks, rage, the ailments, tiredness, death -- and the burrow posture | 2026-09-24 | 66 KB |
| `states-em008_00.md` | Yian Kut-Ku (em008_00): part breaks, rage, the ailments, tiredness and death | 2026-09-24 | 61 KB |
| `states-em009_00.md` | 0. Bottom line / the viewer table | 2026-09-24 | 74 KB |
| `states-em010_00.md` | Plesioth (em010_00): the fin alpha breaks, the water states, rage, the ailments, tiredness and death | 2026-09-25 | 76 KB |
| `states-em011_00.md` | Kirin (em011_00): the horn break, the lightning aura, rage, the ailments and death | 2026-09-24 | 71 KB |
| `states-em014_00.md` | Velocidrome (em014_00): part breaks, rage, the ailments, tiredness and death -- AND THE -DROME CLASS | 2026-09-24 | 70 KB |
| `states-em017_00.md` | Cephadrome (em017_00): part breaks, the sand states, rage, the ailments, tiredness and death | 2026-09-24 | 69 KB |
| `states-em018_00.md` | Yian Garuga (em018_00) and Deadeye Yian Garuga (em018_04): part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 88 KB |
| `states-em019_00.md` | Daimyo Hermitaur (em019_00): the shell, the claws, rage, the ailments, tiredness and death | 2026-09-24 | 75 KB |
| `states-em021_00.md` | Congalala (em021_00): the eaten-item / gas state, part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 76 KB |
| `states-em022_00.md` | Blangonga (em022_00): the fang break, the Blango summon, the tail, rage, the ailments, tiredness and death | 2026-09-25 | 65 KB |
| `states-em023_05.md` | Furious Rajang (em023_05): part breaks, rage, the ailments, tiredness and death -- and every diff against Rajang | 2026-09-24 | 65 KB |
| `states-em030_00.md` | Bulldrome (em030_00): part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 57 KB |
| `states-em032_00.md` | Tigrex (em032_00) and Grimclaw Tigrex (em032_04): part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 89 KB |
| `states-em033_00.md` | Akantor (em033_00): part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 71 KB |
| `states-em036_00.md` | Lavasioth (em036_00): the magma armour, the part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 77 KB |
| `states-em037.md` | Nargacuga (em037_00): state changes, the motions that carry them, and their frames | 2026-09-21 | 32 KB |
| `states-em037_04.md` | Silverwind Nargacuga (em037_04): part breaks, the tail sever, rage, the ailments, tiredness and death | 2026-09-24 | 66 KB |
| `states-em038_00.md` | Ukanlos (em038_00): part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 78 KB |
| `states-em042_00.md` | Barioth (em042_00): part breaks, rage, the ailments, tiredness and death | 2026-09-24 | 66 KB |
| `states-em043.md` | Savage Deviljho (em043_05): state changes, the motions that carry them, and their frames | 2026-09-21 | 24 KB |
| `states-em043_00.md` | Deviljho (em043_00): part breaks, the tail sever, rage and the shared states -- what his VARIANT does | 2026-09-23 | 34 KB |
| `states-em044_00.md` | Barroth (em044_00): the mud, the part breaks, the head and tail options, rage, the ailments and death | 2026-09-25 | 80 KB |
| `states-em045_00.md` | Uragaan (em045_00) and Crystalbeard Uragaan (em045_04): part breaks, the two severs, rage, the ailments, tiredness and death | 2026-09-25 | 81 KB |
| `states-em046_00.md` | Lagiacrus (em046_00): the CHARGE tiers, part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 69 KB |
| `states-em047_00.md` | Royal Ludroth (em047_00): the sponge, the part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 69 KB |
| `states-em050_00.md` | Alatreon (em050_00): the ELEMENT FORMS, part breaks, rage, the ailments and death | 2026-09-25 | 74 KB |
| `states-em056_00.md` | Nibelsnarf (em056_00): part breaks, the swallow/stuck-jaw chain, the sand camouflage, rage, the ailments, | 2026-09-25 | 71 KB |
| `states-em057_00.md` | Zinogre (em057_00) and Thunderlord Zinogre (em057_04): the charged state, part breaks, rage, the ailments and death | 2026-09-25 | 96 KB |
| `states-em061_00.md` | Lagombi (em061_00) and Snowbaron Lagombi (em061_04): part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 71 KB |
| `states-em063_00.md` | Brachydios (em063_00): the slime, the part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 67 KB |
| `states-em066_00.md` | Tetsucabra (em066_00) and Drilltusk Tetsucabra (em066_04): part breaks, the boulder state, rage, the ailments and death | 2026-09-25 | 87 KB |
| `states-em067_00.md` | Zamtrios (em067_00): the ice armour, the bloat, the part breaks, rage, the ailments and death | 2026-09-25 | 75 KB |
| `states-em069_00.md` | Seltas Queen (em069_00): the male Seltas coupling, part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 63 KB |
| `states-em077_00.md` | Seregios (em077_00): the bladescales, part breaks, rage, the ailments, tiredness and death | 2026-09-25 | 63 KB |
| `states-em079_00.md` | Malfestio (em079_00): part breaks, rage, the ailments, tiredness and death | 2026-09-24 | 68 KB |
| `states-em079_04.md` | Nightcloak Malfestio (em079_04): part breaks, rage, the ailments, tiredness and death | 2026-09-24 | 69 KB |
| `states-em080_00.md` | Glavenus (em080_00): the tail heat, part breaks, rage, the ailments, tiredness and death | 2026-09-24 | 77 KB |
| `states-em080_04.md` | Hellblade Glavenus (em080_04): the DIFF against Glavenus (em080_00) | 2026-09-25 | 69 KB |
| `states-em081_00.md` | Astalos (em081_00): the charge tiers, part breaks, rage, the ailments, tiredness and death | 2026-09-24 | 75 KB |
| `states-em081_04.md` | Boltreaver Astalos (em081_04): the charge states, part breaks, the tail sever, rage, the ailments, tiredness and death. **CAVEAT, NARROWED (Effects, 2026-09-30; their file not edited).** Its bullet "the class makes exactly one kind of effect request … and nothing else" reads as absolute but is **scoped**: the same section's closing parenthetical sets ids 1001..1015 aside explicitly. So it is not the contradiction I first wrote here. What IS wrong is how that parenthetical characterises them — "the class's clip/attack effect routing and is not state machinery". For Astalos `effects-em081_00-charge.md` shows those ids are requested **from the per-frame handler by charge tier**, which is state machinery; an independent re-read on 2026-09-30 found the same 21 sites and resolved every id and key. Treat the discharge statement as sound and the parenthetical's "clip/attack routing" as superseded. Everything else in this note held up against the ROM, and its §1.4-equivalent table of which key lives in which variant's pel is the authority I used. |
| `states-em082_00.md` | Mizutsune (em082_00): part breaks, rage, the soap coat, the ailments, tiredness and death | 2026-09-25 | 76 KB |
| `states-em083_00.md` | Gammoth (em083_00): part breaks, the snow armour, rage, the ailments, tiredness and death | 2026-09-24 | 93 KB |
| `states-em083_04.md` | Elderfrost Gammoth (em083_04): the DIFF against Gammoth (em083_00) | 2026-09-24 | 77 KB |
| `states-em085_00.md` | Great Maccao (em085_00): the two breaks, the Maccao call, rage, the ailments, tiredness and death | 2026-09-25 | 61 KB |
| `tail-option-em043.md` | Savage Deviljho (em043_05): the cut tail (uEnemyOption slot 0) | 2026-09-21 | 27 KB |

## 1c. The in-repo notes — `MHGU-Monster-Viewer/dev/` (24 files)

The companion to 1b. These are the notes that live with the viewer rather than under `E:\offline`, and the
same rule applies: a row that cites one is not read until the file is open. Several are EMC's and are marked
so in their own titles; the Effects lane's are the effect / twin / retro files.

| file | its own title | last written | size |
|---|---|---|---|
| `em007_04-list9-census.md` | Bloodbath's List 9: 53 PSL bindings and 7 shell records; uEm007_00's enable word `0xd4532c` (tail bits, L9 M11 action bits); L9 M27's refusal; three rows withdrawn | 2026-10-08 | 20 KB |
| `em007-base07-spec.md` | base07 (uShellEmBase07) and Bloodbath's shell07 `0x72` -- decode spec: reader, init, move, landing, end, the L9 M10 spawns | 2026-10-08 | 9 KB |
| `em081_04-effects-census.md` | Boltreaver's 124 effect records: what fires each, viewer status, what adding needs; the PSL enable word | 2026-10-07 | 30 KB |
| `em081-shells-spec.md` | Boltreaver's shells: every spawn by action (emulated), the readers, base14 / base15 / base50, the c 30 motion table, shell11's spiral -- the Viewer agent's spec for Group D | 2026-10-07 | ~45 KB |
| `effect-ground-ray.md` | The effect ground ray: 0x42744's ray arm, 0x18154c's answer, u 605 (Boltreaver L9 M22), the stand-in floor service | 2026-10-07 | 24 KB |
| `effect-bb43ac-flag8.md` | why 0xbb43c8's arm was never recorded: the shell recorder builds primitive records but never draws the layer; vecprim.py covers it | 2026-10-05 | 14 KB |
| `em084-arm-hitzones.md` | Nakarkos's tentacles' hit zones: their own table `ems099_00_dttune` (tip / middle / base 63 / 36 / 15 cut), the hit's row path `0xbaaa4`, the arm's skipped damage step (`+0x7648`) and the copy into the body's HP and part 1 / 0 (`0x106cdd4`); what the viewer should bake | 2026-10-08 | 12 KB |
| `em084-shell31-cannon.md` | Nakarkos's wave-motion cannon: the shot 0x10767c0, base31 (vtable 0x1750fec) and shell31; the viewer's spec | 2026-10-05 | 22 KB |
| `em084-shell06-aura.md` | Nakarkos's aura: base06 (vtable 0x174ed48) and shell06, the manager 0x106aa48, the viewer's spec | 2026-10-05 | 20 KB |
| `em084-psl-mask.md` | Nakarkos's PSL enable word (vt+0x13c 0x106cae8): c 140 debris only in the buried hold of (13, 0); L2 M23 by action; L3 M63; the tentacles' 0x107f0e4 | 2026-10-05 | 14 KB |
| `em084-c131.md` | em084_00c 131 (em084_00_005): PSL-only, L0 M67 f0-19 on (6,0x33)/(6,0x34); no rage/calm dependence; L0 M15 has no motion | 2026-10-05 | 12 KB |
| `em084-class-effects.md` | em084_00 Nakarkos — the effects his class code requests, and four PSL records nothing fires | 2026-10-05 | 14 KB |
| `em084-shells-spec.md` | em084_00 Nakarkos — the non-beam shells: who spawns them, on which clip and frame, with which mode | 2026-10-05 | 37 KB |
| `em084-arm-pairings.md` | em084_00 Nakarkos — which body action orders which arm action, and what the body and the other arm play meanwhile | 2026-10-05 | 18 KB |
| `em084-phase2-bases.md` | em084_00 Nakarkos, phase 2: what base00 and base01 do with his values (flight 0, flag 0x20, +0x160c) | 2026-10-06 | ~20 KB |
| `dev/base00-init-placement.md` | base00's init — where a shell's position actually comes from | 2026-09-30 | 4 KB |
| `dev/effects-families.md` | Which monsters share their animations and effects | 2026-09-25 | 21 KB |
| `dev/effects-inventory.md` | MHGU Monster Effects — Inventory & Known Issues | 2026-09-25 | 27 KB |
| `dev/effects-ledger.md` |  | 2026-09-27 | 5 KB |
| `dev/effects-walk-order.md` | Effects walk order -- the IN-APP list, one monster at a time | 2026-09-30 | 59 KB |
| `dev/em004-fireball-actions.md` | Basarios / Gravios: the "six fireball actions", read per action from the ROM | 2026-09-29 | 8 KB |
| `dev/em004-shell00-spec.md` | em004_00 shell00 — implementation spec (Basarios, uShellEm004_sp_00) | 2026-09-30 | 30 KB |
| `dev/em004-shell01-spec.md` | em004_00 / em005_00 shell01 — implementation spec | 2026-09-30 | 9 KB |
| `dev/em004-shell02-spec.md` | em004_00 shell02 — decode spec (Basarios / Gravios, uShellEm005_sp_02, u 130) | 2026-09-30 | 35 KB |
| `dev/em005-shells-spec.md` | em005_00 shells — decode spec (Gravios) | 2026-09-30 | 8 KB |
| `dev/em007-shells-spec.md` | em007_00 / em007_04 shells — decode spec (Diablos, Bloodbath Diablos) | 2026-09-30 | 36 KB |
| `dev/em007_04-parts-read.md` | em007_04 parts — what the read establishes, and what it does not | 2026-09-30 | 8 KB |
| `dev/em007_04-sever-note.md` | Bloodbath Diablos (em007_04): the sever records 905 / 906 — evidence, not an entry | 2026-09-30 | 6 KB |
| `dev/em032-shells-spec.md` | HANDOVER — read this first | 2026-09-30 | 28 KB |
| `dev/monster-review.md` | Per-monster review | 2026-09-13 | 233 KB |
| `dev/notice-marks.md` | Notice marks: the "!" and "?" actions, per monster | 2026-09-27 | 96 KB |
| `dev/recompose-0x31d16c-trace.md` | The per-frame recompose: 0x327188 -> 0x31d16c, as far as it is read (2026-09-29) | 2026-09-29 | 10 KB |
| `dev/retro-effects.md` | Why we keep missing effects — the Effects agent's account (2026-09-30) | 2026-09-30 | 20 KB |
| `dev/retro-emc.md` | Why we keep missing effects — the EMC/shell lane's account | 2026-09-30 | 14 KB |
| `dev/retro-render.md` | Why we keep missing effects — the render leg's account | 2026-09-30 | 15 KB |
| `dev/rom-map.md` | ROM map — index of established addresses and the tools that found them | 2026-09-30 | 118 KB |
| `dev/row-exclusion-gate-0x9bb904.md` | The row-exclusion gate at 0x9bb904 — open, three unknowns (2026-09-29) | 2026-09-29 | 7 KB |
| `dev/shell-map.md` | Shell id -> vtable: the whole map, and how it was got | 2026-09-29 | 22 KB |
| **the task board** `C:\Coding Repos\MHGU-TASKS.md` | **A SOURCE, and this map did not point at it until 2026-09-30.** Render logged Raging's whole slime state machine and on-hit eruption there on 2026-09-13 and the hit handler on 2026-09-16; neither is in the decode notes or `dev/`, so a grep of either returns nothing and the read reads as missing. **Grep the board too before calling something unread.** Never commit it | 2026-09-16 | — |
| `dev/states-em055_00.md` | **Duramboros (em055_00): the note that did not exist** — actions, per-part break clips, the sever, the roll, the stun refusal, u 100 and the eight blocked records | 2026-09-30 | 9 KB |
| `dev/unexported-array-twins.md` | Records on a key whose twin is exported -- **90 records across 32 monsters** (regenerated after this session's exports; 72 in UNIQUE, 2 already refused by name) | 2026-09-30 | 9 KB |
| `C:\MHGU-Extract\charm\charm-roll.md` | Charm → talisman roll: table layouts, `0x14b790` transcribed, exact-odds tool, ROM-vs-model differential test | 2026-10-08 | 5 KB |

**EMC's tooling, for completeness** (`C:\MHGU-Extract\efxgents\diablos-scratch\`, *unverified by me*):
`spawnread.py` (shell submits, controlled on uEm007_00), `dtp.py` (part files, length control),
`actprobe7.py` / `actprobe32.py` (action → motion, each controlled on an independently documented clip).

## 2. Tooling

| script | resolves | validated control | caveats |
|---|---|---|---|
| `efx/vecprim.py` | the ONLY recorder that runs the primitive layer (`0xbad710` / `0xbad790` -> `0xbab58c` -> `0xbac62c` -> `0xbb43ac` / `0xbb4214`); one efl, `--parent` or `--proof` | 23 sets cover `0xbb43ac` | `--proof` refuses compose state > 2 (em084_00u:100 is 3). **`vecdrawsched.py` / `record_shells.py` / `add_effects --record` never draw the primitive layer**: those functions are keys with 0 calls in every `draw.json` |
| `efx/armdis.py` | disassembly; `sweep()` over a range | — | `run()` stops at a data word — use `sweep()`. Maps `.text`/`.rodata`/`.data`, **not `.bss`**. Import costs ~70 s |
| PC-relative string xref (built 2026-10-05, inline; the method, not a kept script) | which code references a `.rodata` string, in a binary where **no string address exists as a word anywhere** | **81.8% of the `.rodata` targets it resolves are the start of a printable C string** (13,059 of 15,971), over 35,995 `add rD,pc,rM` and 135,803 `ldr rT,[pc]` | the pattern is `ldr rM,[pc,#imm]` (pool holds a PC-relative OFFSET) then `add rD,pc,rM`, so the address is `poolValue + add_va + 8`. **The source register need not be the destination.** `armdis.py run()` already does exactly this per range; the scan above is the whole-binary index of it |
| `efx/array_twins.py` | records on a key whose twin in ANOTHER array is exported — the array-twin check (Effects' lane) | found em007_00c 30 / 40 and em007_04u 230, all `em007_00_002`, with seven ROM firing sites, in a unit already signed off | measures what has **never been examined**, NOT what fires. A UNIQUE twin needs the class sites read; a SEQUENCE twin with no PSL bit is legitimately unexported. Carries a `REFUSED` table so a closed row is not re-investigated. Run per unit; regenerate the md AFTER any export |
| `efx/effects_triage.py` | per record: its array, file, joint, what fires it, and whether it is in the viewer. **It reads the shell `_ef` files, so it names a record's shell carrier outright** ("shells: shell01 mode 0") — which is the sourced way to answer "is this shell-carried", as against inferring it from what the .efl usually is | named `em077_00c` UNIQUE 30's carrier as shell01 mode 0, and Barioth's u 10/20/21/30 by shell and mode | **its "wired / not in the viewer" column keys on `(pel, key)` and drops the array**, so it shares the array-twin blind spot: on Seregios it reported `c UNIQUE 30` as **"wired (clip)"** while no UNIQUE record on that key existed in the export at all — it was reading the status of the SEQUENCE twin (and even the layer was wrong, since that record's carrier is a shell). Trust its *carrier* column and check the array before trusting its *wired* column. Its "nothing found (class request sites not read)" is the UNATTRIBUTED bucket, not a statement about class code |
| `efx/class-effects.json` | per class: vtable, code range, **real** effect request sites, and the record keys its tables resolve | **positive control passed 2026-09-30**: its `uEm007_00` entry holds exactly the four sites read by hand that day (`0xd363a4`, `0xd36620`, `0xd3c358`, `0xd3c460`), and its vtable `0x17994cc` is the CORRECT one — this is the sound file, `class-requests.json` is the one whose vtable was 4 bytes low | `request_sites: []` is therefore a trustworthy negative (uEm032_00 has none, so Tigrex AND Grimclaw have nothing on this layer). **But `table_keys` OVER-REPORTS**: for `uEm007_00` it lists `0, 3..10, 30, 40, 200, 230` where the tables' true extent holds only `30, 40, 200, 230` — it reads past the end of a 3-entry table into neighbouring data (c is `[-1, 30, 40]`, u is `[-1, 200, 230]`, and they overlap). Treat `table_keys` as a superset and derive each table's extent before chasing a key from it |
| — | **`class-effects.json` OVER-REPORTS request sites across class boundaries.** 50 of its listed sites, across **23 of 98 classes**, lie outside the listing class's own code range and inside (almost always) the NEXT class's — the signature of the site scan running past the class's end. **All 50 are false positives**: for each one, the enclosing function appears in NO slot of the listing class's vtable, so that class never reaches it. Checked with the vtable deliberately OVER-scanned (to the next vtable), because over-scanning can only make a "found" more likely — a not-found after it is a strong negative | — | R | **seven classes are left with NO real request site at all**: `uEm010_00`, `uEm017_00`, `uEm025_00`, `uEm033_00` (Akantor), `uEm065_00`, `uEm068_00`, `uEm077_00` (Seregios). Worked example: `uEm033_00`'s single site `0xe3f1dc` sits in `0xe3f0e8`, which is **`uEm036_00`'s frame handler**, at `uEm036_00` vtable `+0x208`; Akantor has its own `0xe36748` in that slot. The error direction is over-report, which wastes a search rather than hiding work — and the `uEm007_00` control found all four of its real sites, all in range, so there is no evidence of the opposite. **Strip out-of-range sites before trusting a class's list; a class with none listed at all (e.g. `uEm032_00`) is unaffected** |
| `efx/lift-w08.sh` (the **Armor Viewer agent's**; *unverified by me*) | shared `vectors.list` + every player set `vectors/w[0-9][0-9]_*` -> `vectors-w08.list`; lifts request/added/proof/particles from the static `cmd_lifted-*.sh` and the draw layer from `lift-effects.sh`'s **live** command; `EXTRA_<layer>` roots appended on the command's LAST line; output to `_liftout`, copied only into the Armor Viewer | their report: the Lance (w03) went from 6 refusals to none; w08 unchanged at 24576 frames / 187 starts | never writes `vectors.list`; does **not** take `.locks/lift.lock`; **the static copies drift from `lift-effects.sh`** (2026-09-30: added layer, `0xa60c6c` live-only, `0x43400` copy-only); **do not edit it, or any sh script, while it runs** — sh resumes by byte offset after a compound command and the script dies on a parse error |
| `efx/vecdrawsched.py` (their use; *unverified by me*) | records the functions named in `lift-effects.sh`, its own FNS lists, and `lift-w08.sh`'s `EXTRA_*` lines | their report: the Lance's `0xaf0364` chain gained vectors only once named (u1000: 6 vectors, its four leaves 2 each) | **a function's key in draw.json is not coverage — count its `vectors`**; a re-record the same size means nothing changed (trap 15). `1-<held-1>:psl:0:1 <held>:psl:0:2` gives a clip bit's walk shape and reaches blocks a held record does not (992: 4 of `0x328ea8`, 7 of `0x43168`) |
| `efx/player/w03/record/record-w03.sh` (theirs; *unverified by me*) | every request shape the Lance's code asks (29 sets `vectors/w03_*`) | their report: w03 audit clean, 15000 frames, 97 starts, no refusal | records only the missing sets; the `_off` sets carry the bit-off notice |
| `efx/agents/notice-scratch/emclasses.py` | every `uEm` class's vtable, code block, action main | — | vtable is via the getDTI thunk at `+0x14`, **not** `dti.json`'s `mtVtable`. Bound per class **group** |
| `efx/agents/notice-scratch/probe.py` | action (status, number) → the motion it plays, any class | reproduced the Seregios worked example | status-10 actions stop at a *script*, not a motion |
| `efx/agents/cephadrome-scratch/scr.py` | script → motion records | Cephadrome's `0x17ab0f0` → L3 M9, M13 as documented | (Effects' lane) |
| `efx/agents/shells-scratch/moncheck.py` | a monster's shell coverage: under / over / dead / untranscribed | — | **measures the table, not the screen**. Does not check that any action spawns, that a spawner branch exists, or that a per-class landing is registered |
| `efx/agents/khezu-shell-scratch/kharness.py` + `build/arm/emu.py` | runs code **after `emu.init_array()`**, so `.bss` is filled | reproduced all 18 of Khezu's `ORB_SLOT_POINT` values | fills only what **main's** initialisers write |
| `efx/shellef.py`, `agents/narga-shell-scratch/fup.py` | `.arc` contents; FUP ints/floats/vecs; `.efl` params | — | read from the `.arc`, never `scratch-em/<mon>/` (partial extractions) |
| `efx/proof.py` | builds the parameter block the ROM's own way (`0x31b6b0` + `0x31c4ac`) and reads the fields the start consumes | its block offsets agree with the payload at 4 independent anchors | a record whose compose state > 2 is refused: only states 0..2 are transcribed |
| `dev/driven-split.mjs` | per monster: **exported / driven / undriven**, each undriven record named with why | agrees with Render's observed Rathian list (74 / 53 / 21) | **shell mode reachability is NOT statically decidable** — `ctx.create` (`0x48b884`) spawns a second generation whose mode is computed at runtime, so that test was removed. Only the ef-param test decides. A record fired by another row of the same monster is already driven |
| `efx/residue.py` | per monster: every record's ROM firing site, and the residue that has none | — | says nothing about whether the **viewer** fires it — that is driven-split's question |
| `efx/monster_effects.py` + `class-effects.json` | a class's real request sites and the keys its table can produce | — | sites found by **raw word scan** (`ldr rD,[rY,#0x1cc/0x1d0]` + matching `blx` within 6 words) so it **cannot truncate**; but matches **cond=AL only** and the **immediate-offset LDR form only** |
| `efx/agents/.../class_sites.py` | the ids an enclosing function loads | — | **uses `md.disasm(T[f:end])`, which stops silently at the first undecodable word** — it can UNDER-list ids. Never a phantom site, never a false "no site" |
| `efx/add_effects.py` | `--apply` / `--states` export, `--record`, `--check`, `--grow`, `--files`; `ADD_ONLY_KEYS=u1025,...` restricts a record run | — | `--record` only covers records already **exported**, so `--states` comes first. Regenerates that monster's `CLIP_EFFECTS` block in monster.js |
| `efx/record_shells.py`, `efx/shellplan.mjs`, `dev/shell-capture.mjs` | shell recordings from the viewer's own inputs | — | rest-pose plans miss animated-pose branches. `shellplan --list` returns `[]` when no action can select the shell. **Until 2026-09-30 shellplan copied `requester.rotation`, which no shell sets — the viewer's field is `rotationDeg` — so EVERY shell set before then was recorded with NO rotation override** (+0x14 bit 1 clear). A path only an override reaches is missing from those sets; Basarios's L2 M29 beam refused at `0x31e014` because of it. Fixed (`requestOf`, which also passes `flags14` / `flags1c` / `type8`) |
| `efx/vecdrawsched.py` SHELL_PLAN stops | **Since 2026-09-30 a shell plan's stops run BETWEEN the passes** (inside `between()`, after the placements), where the ROM's shell end and the viewer's schedule stop them; clip-effect stops keep the frame's start | none that this order matters: **the control first claimed here (Plesioth u 30's `0x327f1c` refusal) is WITHDRAWN** -- that refusal was the FNS fault in the next row | it is the viewer's order, kept on that ground alone |
| `efx/vecdrawsched.py` / `vecdraw.py` LIFTED_FNS, `add_effects.py` `_add_routines` | the recorders watch every routine `lift-effects.sh` lifts; `--grow` skips a routine already lifted. **Until 2026-09-30 all three took EVERY `0x` number in the script, comments included** | the fixed recorder records `0x329c40` / `0x329874` / `0x44ab0` / `0x327e7c` on Plesioth u 30's stop, the old one records all four at **0 calls** with the same stop run (scratchpad `dbgsched.py` + `vectors_dbg.py` print every entry) | **every set recorded while a comment named `0x327eac` has NO stop chain for a running unit** (the note on `unit00500k241pass2`, Effects' pass-2 work). Measured from `efx/logs/*.log`: `0x327e7c` recorded in 156 sets in the hour from 2026-09-25 00:00, 4 at 01:00, then **6 in about 8,000 recordings** from 02:00 until the fix; the `0x329c40` counts after that are its early-return arm (`+0x30` == 2), which never reaches the walk; sets that ran `0x7c3638`'s gimbal arm lost the calls around it (`0x7c36d8`, the Astalos note). They record, lift and play; only an arm no older set reached shows it. Trap 40 |
| `efx/agents/basarios-scratch/emc.py` | EMC streams: `load(path)` → 21 groups of streams, `parse(stream)` → ops, lengths from the descriptor table `0x172bc8c` | walks every stream of em004_00_cmdtbl and em005_00_cmdtbl with no stop; g1 s22 reads op 0x24 → (7,0x0d) if / (7,0x0e) else | gives bytes, not meanings: op `02` is a percentage draw, `6e` the previously called stream, `14` the call (shared-layer rows above) |
| `efx/agents/basarios-scratch/shell02/b02run.py` + `bharness.py` | Basarios's beam on the ROM (unicorn, after `init_array`): (7,0x0e) → `0xd28bb4` frame by frame → its shell02 request → the shell's ctor, init `+0x13c`, move `+0x24` | the request's layout matches the spawner's stores; `0x4eeed0` is called with `_snd001`'s id 201 | the cmn getters are hooked with the real FUP (not `shellef.load()`); sound calls are stubbed; the activation `+0x18` must be called by hand — the harness's manager never calls it |
| `efx/agents/basarios-scratch/shell02/readermap.py` | every beam (base02) class's READER map by execution: base02's ctor `0x3fb7f8`, the class's vtable, its `+0x14c` run with every rShell getter answering a TAG (sh int i 0x1000+i, sh float 1000+i, sh vec → a tagged vec, cmn the same in the 0x2000 / 3000 / 400 bands), the tags read back from `+0x1640..+0x16b0`; run twice (ints tagged / ints −1) so a flag bit's int shows as the difference -> readermap.json | Rajang's anchor = sh vec 1 and angles = sh vec 4 against everyone else's (vec 1 = angles) came out of it, and the base ctor's defaults (vec pointers 0x19176b0, joint −1, +0x1668 0) | the flag bit's INDEX is not separated (all ints tagged at once); Ukanlos's table builder faults on the heap after the ray fields (harmless to the map) |
| `efx/agents/basarios-scratch/shell02/raycheck.py` + scratchpad `raycheck.mjs` | base02's ray builder `+0x168` (0x3fc750 / 0x3fcd3c / 0x3fcec8 and the classes' `+0x15c` / `+0x160`) on the ROM against shells.js `ray02real` (`rayForCheck`), the same inputs, compared as f32 bit patterns | 10 / 10 bit-exact: Kushala, Agnaktor (bits 0 + 1), Rajang before and after its bit-3 start, Daimyo (bit 3 + clamp), Plesioth modes 0 / 15 (its hook) and 17 (kept), both Fatalis (hook + ramp) | the setup's +8 MUST carry the mode (0x4a0ee4 reads it) and the class's own fields its `+0x160` reads must be set: two false misses came from the harness, not the transcription |
| `scratchpad/basshell.py` (this session) | runs a spawner after `init_array` and dumps the 0x30-byte request | `init_array` 2334/2334 clean; the DTI thunk resolves; a **wrong** address reads as code, not zeros | a zeroed stand-in unit makes anything read **from the unit** come back 0 spuriously; and a value written by an **arc load** rather than `init_array` would also read 0 |

| `dev/effect-live-soak.mjs --beam-state <json>` (Viewer agent, 2026-09-30) | the state a beam on its own monster fires in (`tired`, `rage`, `rank`, `parts`), merged over the viewer's own `beamState` for the shells' step; each motion's line now ends with the shells spawned, the beam types, and **`SHELL REFUSED:`** with stepShells' reasons (schedule.js `shellTally` -- the schedule dropped `out.refused` before, so a refused beam was silent in a soak) | Alatreon L2 M11: 1 shell, `em050_00:0`, nothing refused | the pick on a multi-row clip is `--rock`'s, not the state's. **The soak never steps the viewer's motion-state machine, so the viewer's own `tired` / `rage` read STALE in a soak -- pin them with `--beam-state`.** Also new: **`--viewer-inputs`** (the viewer's own `rockInput` -- target, floor, pick -- which `driveClipEffects` installs in the viewer and a soak without `--rock` never had: Plesioth's aimed beams refused "no target" without it); the tally prints each beam's +0x20 (`@0x..`) and spawn frame (`#f..`); a `_start` piece now stops a step short of its end (a 91.98-frame clip stepped 92 times wrapped to 0 -- a new play -- and the `_loop` jump re-crossed its spawn frames: a phantom second beam on Rajang M8 / M20, Daimyo M18, Nibelsnarf M17, Gravios M27) |
| `schedule.js setClip(..., loop)` (Viewer agent, 2026-09-30) | the clip's frame is in the motion's LOOP: a motion shipped as a `_loop` piece alone (Rustrazor's L9 M31 / M33) has loop start 0, which the schedule passed to the shells as "no loop" -- every wrap was the action issued again (a 2000-frame beam stacked every 81 frames) | index.html passes `loopSeg`; the soak and shell-capture.mjs the same | affects every shell on a `_loop`-only motion, not only beams |
| `vecdrawsched.py` `WATCH_EXEC=<addr>` (Viewer agent, 2026-10-01) | every execution of one address during a recording, with lr, r0 and `[r0]` (its vtable) -- `0x0` catches a null-slot call and names its caller and object (beside the existing `WATCH_WRITE`) | named `0x329904` / the base cUnit corpse in one run | off unless set; stderr into the set's log |
| `shells.js aimForCheck` (Viewer agent, 2026-09-30) | a beam row's computed +0x20 on given inputs: Plesioth's f22 pitch, the Fatalis `0xd81e80`, Gravios's `0xd288b8` phase-0 pitch | **8 / 8 against the research agents' ROM-runs** (`scratchpad/beamsA/*_runs.txt`): Fatalis 0xfbf1 / 0xe71c / 0x1364 (level / 1500 up / 800 down), Plesioth 0xfd1a / 0xeaac, Gravios 0xe6bc / 0 / 0x1945 | the runs' inputs: owner at the origin, angle words 0, size 1, the target 2100 ahead |
| `raycheck.py` + `raycheck_modes.mjs` (Viewer agent, 2026-09-30) | the class's own `+0x168` on the ROM against `rayForCheck`, now for **every mode** (BEAM_MODES; the type parser reads one entry a line since beam-types.js holds two arrays) | **Gravios codes 2 / 3 of `0xd30e30`: 6 / 6 bit-exact**, one with the joint scale 1.2 pushing Md[6] past 1 (`0x7c37d0`'s gimbal arm); the first 10 cases still bit-exact | the setup's +0x20 is written as a word; `0xd30e30` reads its low half (`ldrh`) |
| scratchpad `checkrows.mjs` / `scales02b.py` (Viewer agent, 2026-09-30) | every `beam-spawns.js` row against monsters.json (list, clip or its `_start`/`_loop`, the frame inside the motion) and BEAM_MODES; the shell02 `.shl` ShellScale per mode without shlparse's 1.0 assumption | 104 / 104 rows; `scales02b.py` agrees with shlparse on every arc shlparse parses | session scratch: copy before relying on it |
| VIEWER RULE | the Hit Zones panel reads each region's heat TARGET (index.html regionTarget: the toggles + the playing clip), not the material stage, so the zones switch instantly (Raven, 2026-10-07: "For Hit Zone panel, we would want the zones to switch instantly between states ... Since that panel is more about information not visuals"). The game's 0xec0dbc reads state 0 alone (soft through the 6 s cool-down); the lava's transitions stay visual | — | — | index.html zoneTable |

### Lift roots reported by the Armor Viewer agent (*unverified by me*)

If a monster ever refuses at one of these, it is a missing **lift root**, not a decode gap — list the routine
in `lift-effects.sh` before re-recording (and see trap 15: the static copies of the lift commands drift).

    0xa60c6c   0xaf0364   0xaee9ac   0xaeeda0   0xaf2c84   0xaf2e14
    0xaf7db8   0x13b7160  0xa7276c (in the recorder's FNS list but in NO lift command)   0xa72918

Lift roots added by the **Viewer agent** (2026-09-30, lifted-added line via `add_effects.add_routines`), each named by a
live refusal "call to X, which is not translated":

    0x9b3704   called at 0x9b74f4 inside 0x9b6e44 (the stop group's unit routine) -- 12 Beam Test types reached it once
               their stops were recorded; it rewrites the unit's +0x110..+0x118 and tail-calls 0x9b29f4 (meaning NOT read)
    0x8825f8   a leaf (no push) called at 0x9b49a0 inside the draw root 0x9b4744 -- Alatreon's beam (u 30 / 31) only. Its
               body is NOT read: its first lines average two vec3 at r1 (+0x0 / +0x10, x 0.5) and load [r0 + 0xd94]
    0x9b29f4   0x9b3704's tail call (0x9b3750) -- the same 12 types' next refusal once 0x9b3704 was lifted. Found with the
               callee census below, not by a third refusal: its only other calls are sqrtf and an indirect blx the
               recorded runs never followed out of the function

    THE CALLEE CENSUS (how to add a chain's roots in ONE batch, 2026-09-30): take every block the new sets recorded,
    collect each bl / blx target and each b target that starts with a push, keep the ones that were ENTERED (their first
    block is in the recorded set), and ask the page's own map which are missing (`cpu.lifted(a)` after importing
    live.js / proof.js -- from a page loaded AFTER the lift). An entered routine that is still missing but whose types
    already soak clean (0x326d40, 0x32820c in 108 Beam Test sets; 0xaa8c00 / 0xaa8c3c / 0xaa991c / 0xaad168 in
    Boltreaver's) is reached only on the recorder's harness paths, never by the viewer: no root needed. Two slips on the
    way, each caught by a control: a tail call INTO the recorded blocks is still a call (the first census dropped
    0x9b29f4), and a page loaded before the lift reports the old map (0x9b3704 "missing" while the soak had passed it)

Also from them, for the runtime queue: **generator type 20 is not translated** — `construct.js` skips the row.
It appears in `cm001_500.efl` (3 rows) and `cm123_030..035`. Player/weapon side first, so it is upstream of
the monster work; they have it on the board.

### Traps that cost time today — check against these before trusting a result

- **NO STRING ADDRESS IS STORED AS A WORD IN THIS BINARY (Area lane, 2026-10-05).** Searching `main.text`,
  `main.rodata` and `main.data` for the VA of `uAmbientLight`, `mpEnvCubeTexture`, `mSH` and three more returned
  **nothing for all six**, which reads as "this class is never registered" and is false. The build is `-fpic`: an
  address is a PC-relative offset in a literal pool plus an `add rX, pc, rX`. `movw`/`movt` is NOT used for
  addresses here either (`movt #0x157` occurs **zero** times in 20 MB; the `movt` immediates are float and int
  constants). Resolve with the method in the tooling table, or `armdis.py`, which already does it.
  **And check the mask before believing a zero**: a first pass found 0 `ldr rT,[pc]` in the whole binary because
  `rn` and `rt` were in the wrong nibbles (`0x0ff0f000` masks `rt`, not `rn` — the right one is `0x0fff0000`).
  A scan that returns zero hits on a construct the architecture uses constantly is a broken scan, not a finding.

- **`mSH` IS A GRASS PROPERTY, NOT THE AMBIENT SH (Area lane, 2026-10-05).** `rodata+0x181d32` sits in the cluster
  with `mGrassShadowScale`, `mColorTweak`, `mWindGroup`, `uGrassMark` — nothing to do with `CBAmbient`. There is no
  SH property on any class, and **no `fSHCoef` or `CBAmbient` string anywhere in the executable**: the constant
  buffer is written by OFFSET and the reflection lives only in `AppShaderPackage.mfx`. Name-grepping the exe for a
  shader constant will always come up empty; go to the shader package for the layout and to the code for the fill.

- **AN ARC HOLDS TWO RESOURCES UNDER ONE PATH, and `efx/shellef.py load()` KEEPS ONE (Viewer agent, 2026-09-30).**
  `load()` returns `{path: (type, bytes)}`, so where a shell folder's `.shl` (type `4aa69872`) and its **ShellCmnParam
  FUP** (type `496f8f22`) share a path -- which is the layout: the `.shl` names its common param as `rFreeUseParam
  shell\em\<mon>_shellNN\<mon>_NN`, its own path -- the FUP is silently dropped from every listing built on it. That is
  where **"Basarios has no common FUP anywhere in his arc"** (EMC, shell00 spec §2, and every Basarios shell decision
  since) came from. Read with the arc's own entries (`arclist.entries`), the files ARE there: `em004_00_00` (shell00)
  **ints [3]**; `em004_00_02` (shell02) **ints [3], floats [7200.0, -50.0], vecs [[0, -30, 80]]**; Gravios's
  `em005_00_02` ints [3], floats [7200.0, -40.0], vecs [[0, -30, 80]], `em005_00_13` ints [3]. So Basarios's shells
  hang from **joint 3**, not the owner's origin, and the beam's ray is **7200** long, not the null path's 1.0 (base02
  `+0x160` = `0x3fd288` answers 1.0 only when the cmn float is 0). Every "no cmn" conclusion made with that loader --
  any monster, any base -- is to be re-read. `scratchpad arcdups.py` pattern: list `arclist.entries` rows whose path
  repeats.

- **A RECORDING IS ONLY AS GOOD AS THE FIELD NAMES BETWEEN THE VIEWER AND THE RECORDER (Viewer agent, 2026-09-30).**
  `shellplan.mjs` read `requester.rotation`; every requester in `render/shells.js` says `rotationDeg`. `undefined || null`
  is a legal value, so nothing failed: every shell set was recorded without its rotation override, the lift "covered"
  it, and the live page refused at a branch the override reaches (`0x31e014`) with a fresh recording of that very
  shell on V=. When a live refusal survives a re-record, diff the plan's inputs against what the page hands the host.

- **A BLEND'S SECOND MOTION IS IN r2 (Viewer agent, 2026-09-30).** `0xb03f8` (and Rathian's `0xb04d0`) set TWO motions:
  r1 the main one, r2 the partner, s2 the main one's weight. Looking for an action's clips by `movw r1,#<id>` finds the
  main clip only -- Basarios's beam was written up as "L2 Motion[27], the function's only setMotion" while M28 / M29
  (the beam aimed up / down, `0x21c` / `0x21d` in r2) went unlisted and showed no beam. Scan r2 too, and read which
  class picks which partner.

- **A slot NUMBER means different things in different bases.** `+0x150` is base00's landing and base02's ENDING. base00's names were written up first, so they are the ones most likely to be borrowed — both EMC's specs and mine carried them into a base where they were wrong.
- **A negative result needs a control IN THE SAME RUN.** A closure scan of mine reported `+0x1680` as having no consumer; a positive control (`+0x168c`, whose consumer at `0xd30ca4` had been read by hand) came back empty too, which is what exposed the scan's two faults — following plain `b` targets, and not tracking `movw / add / ldr [rX]`. Corrected, `+0x1680` resolves to `0x3fc814`.
- **A viewer helper named for one monster is that monster's.** `ctx.create` → `make001` → `init011` is em001_00's base01: calling it for em004_00's shell01 threw on base01 flag `0x800`, which his mode 0 sets and hers never do. Same shape as `params00` being another class's reader, and as em004's action rows falling into `create001`. The throw was the transcription defending itself — treat one as a finding, not an obstacle.

- **`schedule.stepShells()` DROPS `stepShells`'s return value.** The wrapper in `docs/render/rom/effect/schedule.js` ends on a `for (const sh of out.ended)` loop and never `return out`, so a page harness that hooks it and reads `out.refused` / `out.spawned` / `out.ended` reads **undefined every step** and reports silence whatever happened. That is how em004_00's landing was reported as "never entered" for a whole round when it fires on every clip: 292 undefined returns in one drive. **Read the shells instead** -- `stepShells`'s own state object is reachable as `schedule.shells.state`, `stepRock` clears `S.events` at the top of each step, and `move00` pushes `{ ev: 'hit', type }` into it *before* calling the class's landing, so the hit, its type and its point are all readable after the step, along with `S.state` (0xfe = ended) and `S.timer`. A harness that reads an outcome through a return value needs a POSITIVE CONTROL on that value -- here, that any step at all returned an object.


1. **Derive an extent, never choose one.** Four failures from one cause: a class band from vtable
   clustering; a 0x400-byte window per method; a function bounded at a guessed address when it ran
   further; a vtable read to 288 slots when it held 95. *Find the next structure and stop there.*
2. **A flag test is not only `tst`.** `ands`, `bics`, `teq` and `cmp`-against-a-mask all test bits; a
   `tst`-only scan finds about a quarter (Render, base02's flags word at `+0x1674` found by an `ands`).
   *Counted for base00's path code: 14 `tst`, 2 `tsteq`, 1 `tstne`, **0** `ands`/`bics`, and one `teqmi`
   at `0x3f95a0` that is a literal-pool misdecode — so base00's `tst`-only lists are complete, by
   enumeration rather than by luck.*
3. **A post-indexed load leaves a POINTER register.** `ldr r0,[sb,r0]!` makes `sb` point at the field;
   every later `[sb]` test never mentions the offset again. Both an offset scan and a value-register scan
   are blind to it. Cost: seven of ten flag tests invisible.
4. **Closure, not methods.** "Reachable from the vtable" must be the *transitive closure* of the calls.
5. **A positive control before any negative.** A detector that cannot find the known case proves nothing
   when it finds nothing. Two negatives were worthless for want of one; two were trustworthy because of one.
6. **Proximity is not aboutness.** "a store within 4 instructions" and "a shift within 6" both produced
   false results. Check the target, not the neighbourhood.
7. **Names, DTI parents and comments are hypotheses.** Three separate pieces of metadata pointed the wrong
   way on one shell.
8. **RECORDED METADATA IS NOT A READ — three costumes in one day.** `dti.json`'s `parentDti` said
   base13 where the vtable says base00 (mine); `class-requests.json` recorded a vtable four bytes low,
   shifting every slot by one and inventing a per-variant table (Effects'); a code comment named an aim
   helper as a reader (mine). Each was a recorded fact standing in for the read it summarises.
9. **The instrument's shape decides what you can see.** An id extractor thresholded at `>= 1000` reported
   field offsets as ids (Effects'); a `tst`-only scan missed `ands` (Render's base02); a census bounded to
   one routine missed a consumer that is downstream (mine, byte[30]). Say what the instrument could not
   have seen, alongside what it found.
10. **Map edits go through a QUOTED heredoc.** `python -c "..."` in double quotes lets bash
   command-substitute every backticked address, and the entry lands looking plausible with its facts
   silently removed. Caught once by grepping for a line I had just written.
11. **One monster's transcription is not the base's.** Shared runtime encodes the arms *one* monster's
   flags word selects.
8. **A guard that cannot fail is not a guard.** A `grep` for one pattern was offered as proof that shells
   have one spawn site (it has two generations). A process check that exits 0 either way was chained by
   `&&` to an irreversible `rm`, and deleted while its own output showed a match. *Capture the result, exit
   non-zero on a hit, then act.*
9. **Parse a tool's output; never measure it with a shell one-liner.** Four wrong numbers in one day from
   three such shortcuts: `grep -c` counting **lines** as records (59 vs 93); splitting on `", "` when the
   reason fields **contain commas** (1255 vs 1681); a print **sliced to 8 entries** read as absence. Write
   the parser as a file, assert its total against the tool's own, and test it on a run whose answer is
   already known.
10. **Test the thing the criterion names.** "Is the record wireable" is a question about the **pel**, not
   the export: 81 of 85 candidates were absent from the pel entirely. Testing the export would have sent
   someone hunting effects that do not exist.
11. **Implausibility is evidence.** (0,0,0) as a spawn position puts a fireball at the world origin, metres
   from the monster. The number was reported with its controls and its caveat but *without* saying it was
   absurd on its face — which is the fact that points at having measured the wrong field.
12. **A retracted finding must not be built on.** An observation Render withdrew as an instrument fault was
   turned into a static test the next day, and produced seven false negatives.

13. **A reader that matches on SHAPE silently drops the richer form.** `driven-split.mjs`'s pair walker
   accepted `[pel, key]` and required `length === 2`, so every row written in the array-naming form
   `[pel, key, 'UNIQUE']` — a documented form — read as **no row at all**. `em057_04u 250` had been written
   that way for some time and was counted undriven throughout; nothing errored, the number was just quietly
   wrong. Whenever a data form gains an optional field, grep for every reader that destructures or measures
   it. The tell here was a row I had just written reading as absent, which is the cheap version of the same
   discovery — if a change you made does not show up, suspect the reader before rewriting the change.
14. **An array is part of a record's identity.** em007_04u key 200 is the shared `cm202_035` in SEQUENCE
   and the monster's own `em007_04_000` in UNIQUE — two different effects on one key, and asking for the
   wrong one succeeds silently. Ask for the array explicitly; the `0x328ba0` row says which one a request
   path takes and how that is read out of the ROM.
15. **A re-record that comes out the same size means nothing changed, not that the path isn't reached.**
   Check the function's `vectors` count in draw.json before concluding. (Armor Viewer agent, 2026-09-30,
   their wording, verified by them and not by me: `0xa60c6c` had been recorded all along — 3 vectors, 63
   calls, from the first pass. The real cause of that refusal was the **lift** lacking it as a root, because
   that app lifts from static copies of the lift commands dated 2026-09-27 and the live
   `lift-effects.sh` has since gained `0xa60c6c`.) Worth noting the shape of the near-miss: the first
   version of this entry, as first sent and as I first filed it, said the held record "never reaches its
   end's code" — a statement about the ROM inferred from an unchanged output size. The drift between a live
   command file and a static copy of it is a standing hazard wherever two apps share lift roots.
16. **An answer identical for every input is a reason to go static, not a verdict either way.** *(Rewritten
   2026-09-30: the first version of this trap said such an answer "is the instrument, not the subject", and
   that conclusion was wrong in the case that produced it.)* Seven group-6 action indices, on two monsters,
   all returned `L0 M1` — fourteen runs, one answer — while the static read said their arms differ (`r6`
   0/1/2/3, `r8` 0/1). I called the measurement broken and discarded the result. **It was correct**: EMC
   read `0xd3c274 bl 0xafef0` with `mov r1,#1` — a literal motion id, and the only setMotion-family call in
   the whole body — so the seven genuinely share one clip. The suspicion was right to raise and wrong to
   settle with. What settles it is the static read of the call, which is cheap; what the emulator was
   actually good for was pointing at the site (a hook reporting LR came back at that call + 4).
   The deeper error underneath: I had asserted `0xd3c1d4` "sets no motion and no script" while
   `bl 0xafef0` sat five instructions above a call I had named, in disassembly I had printed and read. I
   never checked what `0xafef0` was. **Naming one call in a block is not reading the block.**
   **The general form, merged here at Render's request rather than kept as a second entry:** *deciding in
   advance what the answer will look like, and then failing to see one that arrives in another shape.* Mine
   discarded a real signal for looking too clean — fourteen identical results. Theirs discarded one for
   looking like a symptom: hunting a request that could not come while `shellsLive` dropping 2 -> 1 and draws
   1560 -> 1152 *was* the landing they were looking for, recorded as noise. Two shapes, one error. It differs
   from the control traps above, which are about instruments that cannot speak; this is about not hearing one
   that did.
17. **`meatemu`: three failure modes that all look like "nothing happened".**
   * `Run.again()` catches only `UcError`, so a run that **exhausts its instruction budget reports
     `err = None`**. `Run.__init__` does check (`pc_end != RET`); `again()` does not. Never read `err = None`
     from an `again()` loop as "the frame completed".
   * `actiontrace.py` prints a row only when a category or motion call was logged and **never reads
     `Run.err`**, so an index that faults is indistinguishable from one that does nothing. All seven of the
     group-6 indices printed blank rows and all seven were hanging.
   * `0x7abef0` (3205 callers — a base constructor) links the new object into a global list with
     `while [r1+8]: r1 = [r1+8]`, and the emulator fills THR with `0x01` bytes, so a garbage head reads
     `0x01010101` whose `+8` is itself: an endless walk. Skip the **link** with a code hook at `0x7abf7c`
     jumping to `0x7abfa0`; do NOT stub the whole function through `logcalls` — that returns 0 where the
     object's vtable pointer was expected and sends the run into the static-init array (thousands of calls
     with rodata string pointers, which is what that looks like when it happens).
   Every waypoint on the path deserves a counter before any of this is believed; the fix that mattered was
   only found because `0xd3c1d4` counted 6 entries while `0xd3c238` — straight-line code just after it —
   counted 0.

15. **A field offset means something different in every derived class.** I carried `+0xcac4..+0xcadc`
   from `uEm004_00` (where they really are the shell-id slots) into `uEm007_00`, where they are material
   clip handles, and wrote up "seven slots vs Basarios's four" as if the layout were shared. `+0xcac0` IS
   shared; `+0xcac4` onward is derived-class private. This is the per-base slot trap one level up: it
   applies to the **enemy** classes too, not just the shell bases. The tell was the content — a slot
   region that reads as five pointers plus a −1 index is not four ids and a sentinel.
16. **`ldrb rX,[rY,rZ]!` re-bases the pointer register.** Pre-indexed writeback at `0xd31e4c` leaves
   `sl = &unit+0xb5f5`, so three later `ldrb r0,[sl]` sites look like different fields and are all the
   variant byte. Same family as the post-indexed `sb` form that hid 7 of 10 base00 flag tests: **any
   writeback form silently changes what a later bare `[reg]` means.**
17. **A literal-scanning classifier needs a negative control even when its hits are real ids.** Scanning
   for `mov rX,#imm` within 8 instructions of `str rX,[rY,#4]` returned `0x7f` seven times in `uEm007_00`
   — and `0x7f` **is** a genuine shell id (`uShellEm011_sp_11`), which is exactly what would have made the
   false positives look confirmed. The accessor block `0x4a2000..0x4a3000`, which spawns nothing, returned
   `0x7f` too: `mov #127` before `str [x,#4]` is a common idiom. The same control also showed the detector
   **cannot** see `uEm004_00`'s ids, which come from a field rather than a literal. Both halves matter —
   a detector that finds nothing where the answer is known is not a detector.
18. **Reading the address is not reading the row.** Before this read I grepped `rom-map.md` for
   `0x175c3e8`, saw `1`, and moved on. The row said `dev/shell-map.md`, which already had the table
   layout, the id->class->resource resolution, and a **solved** fix for the dti.json name gap I then wrote
   up as a blocker on Tigrex. Grepping for the count satisfies the letter of "check the map first" and
   none of its purpose. **Open the row and the file it cites.**

19. **A case body is not the address range between two jump-table targets.** Attributing the five em007
   spawn sites by "largest table target <= the address" put four of them in the wrong case: the compiler
   interleaves blocks and `0xd35c90` branches out of one case body into another's region. Walk the branches
   from each case entry instead. The tell was that a single case appeared to own four spawns with three
   different modes.
20. **Count the dispatches before trusting one.** I decoded three jump tables in `0xd35a94`, attributed
   what I could and reported the rest as unreachable; there were **five** — `add pc, rX, rY` appears five
   times in that function, and the two I missed owned three of the five spawn sites. Grep the whole
   function for the indirect-branch forms first.
21. **Do not assume which float argument is the frame.** At the `0xb09a4` gate I read `s1` as the frame and
   got 0.0 at four of five sites, then reasoned about "frame 0". The frame is **`s0`**; `s1` is unused in
   the `r1=0` arm. Reading the callee's arm settled in one call what two rounds of inference had muddled.

22. **A band shape is not an encoding.** `[+0x4b4]`'s four key bands (`0x04..0x2e`, `0x101..0x113`,
   `0x201..0x21b`, `0x303..0x315`) look exactly like `(status<<8)|index`, and I published them as the action
   id on that resemblance alone. They are `(list<<8)|motion`. The disproof took one read: `setMotionC`
   (`0xafe8c`) calls `0x726cc`, which compares the field against setMotion's `r1`. The tell I ignored was
   that em007 has status-10 actions and there is no `0xa` band, while lists 0-3 is exactly what an LMT has.
   **A field's meaning comes from the instruction that writes it or compares it, never from the shape of
   the values.** (CLAUDE.md §2, which I had quoted at the top of the same file.)
23. **Identical answers across differing inputs can be the right answer — check statically before calling
   the instrument broken.** Seven group-6 arms probed to the same clip; Effects had warned that identical
   answers mean broken measurement, and for their harness it did. Here `0xd3c274` is the ONLY
   setMotion-family call in `0xd3c1d4..0xd3c4a0` and its argument is `mov r1,#1` — a literal. The seven
   really do share one clip. Emulation showed the caller; the static read decided whether to believe it.

24. **Trap 18 caught me again, two days after I wrote it.** I grepped this file for `0x1831a78`, saw five
   hits, did not open them, and published request `+0x20` as a third consumer of an "unresolved `.bss`
   block" — carrying the wording from `em004-shell01-spec.md` §6, which predates the resolution. Rows 134
   and 295 here already say it is **the engine's shared empty vec3**, zero by definition. A hit count is not
   a read, and **my own older note is not a source** when this file has a later row on the same address:
   check the map against the note, not the note against itself. §6 of that spec is now marked WITHDRAWN.

25. **A matching number with a matching instruction shape can still be unrelated.** Hunting the engine site
   that fires sever keys 901/905/906, I found `movw r1,#0x385 / add r1, sl, r1` (and #0x389, #0x38a) in three
   sibling blocks -- a textbook "key = base + slot" form, which would have assigned Bloodbath's two record
   pairs to his two staged pieces. Each block also stores a NAME STRING at `[r0]`, and resolving it gives
   `mItemNum[115]` / `[119]` / `[120]`: they are indices into the player's item box, in a reflection table of
   148 such entries. `900` is not a literal anywhere in `main.text`. The identifying evidence was already
   inside the block I was reading and cost one resolve. **When a hit carries a name, read the name before
   reading the arithmetic.**
26. **Do not extract a value from a switch arm without stopping at the arm's terminator.** Decoding an
   18-way table's arms, I took "the first `mov r2,#imm` before the next `bl`" and read straight past an
   unconditional `b`, attributing the *following* arm's effect key to three entries and making entry 7 look
   like the default. Same family as trap 19 (a case body is not an address range): an arm ends at its branch.

27. **A call census must accept the tail-call form.** I enumerated shell submits as `bl 0x48b884` and
   reported that five of Bloodbath's eight shell01 modes had no spawn site. Three of the nine submits are
   `b 0x48b884` — including two entire spawn sites. The fix that makes such a census self-checking is to
   count the ALLOCATIONS too and require the two to balance: 14 allocator calls against 9 submits, with six
   funnelling into one shared tail, leaves nothing orphaned either way.
28. **`movweq` after `mov`, and `stmib`, both hide a written value.** `mov r0,#6 / movweq r0,#5` reads as
   one mode to a scanner that keeps the last plain `mov` — mode 5 exists only in the conditional. And
   `stmib r1,{r0,r6}` writes request `+0x04` AND `+0x08` in a single instruction, so a scan for
   `str rX,[r1,#8]` finds no mode at all. Same family as the flag-test census (a `tst`-only scan finds a
   quarter of the tests).

29. **Identical answers across differing inputs can mean the gate is in the DATA.** Probing six Bloodbath-only
   actions returned the same result for variant 0 and variant 4, which by trap 23 is a reason to go static.
   Static said the bodies are shared and set list-9 clips unconditionally; what makes them Bloodbath's is that
   only em007_04 ships `em007_04_9.lmt`. So the third possibility, beside "broken instrument" and "genuinely
   identical", is **"the discriminator is not in the code you are reading"** — and a list id outside the
   range a dispatch table showed (0-3 here) is the tell worth chasing rather than reporting.

30. **A threshold can arrive in a register from a call, not from an instruction.** Hunting the frame for five
   spawn gates, I searched backwards for the `vldr`/`vmov` that set `s0` and got an implausible 1.2, two
   not-founds, and a call I mislabelled a precondition. `s0` was the RETURN VALUE of `0x6f618` two
   instructions earlier. **When a scan for "what sets this register" finds nothing plausible, the answer is
   usually the preceding call** — and here the call was a virtual dispatch into per-monster tune data, so the
   value was never going to be in the instruction stream at all.
31. **A length check whose input is derived from the length proves nothing.** My `.dtp`/`_sh` control was
   "schema consumed == file size", but `nInt` was computed as `size - 5 - nFloat - 3*nVec`, so the equality
   was an identity. It still validated the field sizes and order taken from the serializer; it did not
   validate the counts, and I reported it as if it had. A real control needs every term read independently —
   which the action-tune file supplies (both counts in the header, 5+14+139=158).

32. **A backslash escape can arrive halved through a heredoc, and the damage lands in a shared file.**
   Writing a map row containing the FUP magic, the escape in a heredoc-ed Python bytes literal reached Python
   as a single backslash, so the row was written with a real **NUL byte** in `dev/rom-map.md` (grep then
   reported it as a binary file). Two repair attempts failed silently for the same reason: the replacement
   string was itself halved, so NUL was replaced by NUL with no length change. The fix that works is to build
   the escape as `bytes([92])` and never type a backslash in heredoc-ed source. Same family as the earlier
   trap where command substitution stripped every backticked address from a map line.

33. **A "no writer" negative is only as good as the resolver that found the readers.** Asked whether the
   shared empty vec3 is written at runtime, I built a PIC-pair resolver and it reported 2518 users of the
   slot -- and 1973 for an unrelated slot, which is what exposed it: the `ldr rY,[pc,rX]` mask matched any
   register-offset load. Fixing the mask did not fix the count. **Two unrelated targets returning similar
   large counts is the cheapest tell that a resolver is matching on something else**, and it is worth
   running a second target for exactly that reason before believing either number.

34. **A name absent from `draw.json` is not absence — diff the functions.** I checked whether a recording had
   covered `u 162` by grepping its `draw.json` for `em004_00_005` and found only `em004_00_003`, and called
   the recording a failure. The check could not have worked: `draw.json` has `file` (the FIRST efl only),
   `frames`, and `functions` keyed by **address**, so the second effect's name is not in the file to find.
   What settled it was diffing the two sets' covered functions — the wall set is a strict superset (22
   functions with vectors only in it, none the other way) and `0x40a54`, the request control-block builder,
   goes from **1 call to 2**, one per request. Same family as trap 15 (the Armor Viewer's): a key in
   `draw.json` is not coverage, count the vectors; and one level out, a missing NAME is not missing coverage.
   Both halves have now cost a wrong conclusion in one day.

34. **Read the ctor of the base you are actually on.** `em004-shell00-spec` §3 established base00 s
   flags word from a store at `0x3fa348` — which is inside **base01 s** ctor. base01 writes −1 there, base00
   writes 0, and the whole word inverted: `0xFFFFFFFE` became `0x00000000`, and with it the answer to which
   position base the init picks. The same paragraph called `0x3f8aac` "base00 s landing" and dismissed it,
   when it is base00 s ctor and the store that decides the value. **A default is a property of the ctor, so
   derive the ctor s extent the way any other function s is derived** — the addresses here are 0x1800 apart
   and both are "in the shell-base region", which is not the same as being in the same class.

35. **Convergence tells you something is wrong, not where.** Three lanes independently suspected the
   `(0,0,0)` at request `+0x10` — Effects from implausibility, Render from a floor measurement, me from
   doubting which struct the init receives. All three were right that the placement was wrong and all three
   mislocated it: the field is correct and the BRANCH was wrong. Worth remembering when agreement across
   lanes starts to feel like proof — it raises confidence that a fault exists and says nothing about its
   address. (Render 2026-09-30.)

36. **Widening a window can invalidate the assumption that made it meaningful.** The spawn extractor read
   request fields as stores through `r1`, valid only BETWEEN the allocation and the submit. Widening to the
   function start to resolve ids set earlier made it report the allocator size argument `0x40` as a shell
   mode, because `r1` held something else there. The fix is to track the request register from the
   allocator's return and believe stores only through it — after which the wide window is safe. A second
   ordering bug hid behind it: `setdefault` kept the FIRST store, so four submits sharing one function all
   reported the first one's mode. **The last store before the submit is the one that reaches the request.**

37. **A class's code range is not the range of its own methods.** I censused Tigrex's shell spawns over
   `class-effects.json`'s `uEm032_00` range and found 13 submits and no tail-calls; over `notice-marks.md`'s
   wider range for the same class there are 16 and two tail-calls. The narrow range is the span of the
   class's vtable overrides, which is a real and useful thing but stops short of code those methods reach —
   here, the shell classes that sit immediately after it. **When two files give a class two ranges, take the
   wider for a reachability question and the narrower only for 'is this address one of the class's own
   methods'.**

38. **Nothing references a mid-function address, so an empty caller scan on one is evidence about the
   address, not about the code.** The trap is that such an address often disassembles into perfectly
   plausible instructions, which is what stops you noticing. EMC, 2026-09-30: `0xd366d4` reads as
   `movw` / `ldr` for four instructions and is a **float literal pool**; the real function starts at
   `0xd366dc`, and a caller scan on the pool address came back empty **twice** before they checked what the
   address actually was. Mine the same day: `class-effects.json` names c 1109's request site as `0xa4094`,
   which is the `mov r1, #9` **inside** the thunk beginning at `0xa4074` — scanning for callers of it found
   none, and the thunk has exactly one. **Before believing an empty caller scan, confirm the address is a
   function start** (a `push`/`stmdb`, or the first instruction after one), and widen to the enclosing
   function if it is not.

39. **The notes index is not the notes.** *(Renumbered from 38 by the Effects lane, 2026-09-30: two
   traps were written as 38 in the same hour — this one by EMC, the mid-function-address one above by me.
   Both stand; only the number moved.)* §1b of this file indexes `E:\offline\decode
otes` (82 files)
   and this file cites it 51 times, and I still spent a session re-deriving em032 and em007 facts that
   `states-em032_00.md` §1.4 and `states-em007_00.md` already stated — one of them explicitly "listed for the
   shell agent". **Per monster, open `states-em<NNN>.md` before the first ROM read**, not after the work.
   This is trap 18 ("reading the address is not reading the row") at directory scale: a hit count, a cited
   path and an index entry are all things you can see without opening anything.

40. **A recorder that watches an address opens a frame there -- so every address it watches must be a function
   ENTRY, and a comment is not a list of functions (Viewer agent, 2026-09-30).** `vecdrawsched.py` and `vecdraw.py`
   built their watch list from every `0x` number in `lift-effects.sh`, comments included, to stay in sync with the
   lift. A note there names `0x327eac`, the block after `0x327ea8`'s `bne` inside the unit end `0x327e7c`. The
   recorder's `on_block` opened a "call" at it with the enclosing function's lr and its post-push sp, so no return
   ever matched; it sat on top of `0x329c40` / `0x329874` / `0x44ab0` / `0x327e7c` and all five were dropped at the
   frame's end. Every stop of a running unit recorded since that note went into its set as **0 calls**, and nothing
   failed: the sets recorded, lifted and played on older coverage until the Beam Test reached an arm (`0x327f1c`,
   Plesioth's u 30) that only a new set could carry. Found by printing the recorder's own frame stack at the stop
   (a private copy of `vectors.py`), after a timing hypothesis had been written up as the cause and re-recorded for
   nothing (WITHDRAWN table). Same family as trap 38, from the other side: there, nothing references a mid-function
   address; here, a tool treated one as a function. **When a live refusal survives a re-record, check that the
   recording's `draw.json` actually counts calls for the functions on that path (trap 34) before theorising about
   what the run did.**

41. **A generated table carries only what its generator read (Viewer agent, 2026-09-30).** `render/beam-types.js`
   gave the beam runtime every type's life, length, ray and effects -- and no ShellScale, so `step02g` hard-coded the
   requester's scale to 1 and the Beam Test drew Boltreaver's beams (1.2) and Nakarkos's G-rank ones (2.0 / 2.3) at
   1.0, and Raven reviewed them that way. Nothing refused: a missing field reads as the default. Found only because
   Gravios's class path (`make02`) carries `mode.scale` and the two paths were compared. The tool beside it had its
   own version: `agents/rathian-shell-scratch/shlparse.py` finds the first ShellInfoList entry by a ShellScale of
   exactly 1.0, which em083_04's first entry (0.78) is not -- it throws there, and on an arc whose first entry were
   non-1 at a different offset it could have walked garbage. **When a runtime takes a constant where the ROM takes a
   per-record value, list the fields the ROM's own requester fills (proof.js's comment: `0x4a10c8` writes +0x40 =
   ShellScale) and check each against the generator's output.**

42. **A transform on a monster's GROUP reaches neither its drawn body nor its bones (Viewer agent, 2026-10-01).**
   render/pose.js writes every bone by WORLD matrix against the driver's `frame` (`world`), so the group's own
   transform is divided straight back out (stepTurn's note, 2026-09-27), and three.js's ATTACHED bind mode resets a
   skinned mesh's `bindMatrixInverse` to the inverse of its own world matrix on every update, so the group's
   transform does not reach the drawn mesh either. The posture mount had been written onto the group: on Khezu's
   ceiling clips it moves only bones the driver does not pose (some of his vertices drawn at the ceiling, the rest
   where the clip puts them), and every effect and shell -- which read the posed bones -- stays with the un-mounted
   body. Measured headless with the viewer's OWN loop (a soak steps frames itself and never runs the posture code):
   Shogun's shell joint stayed ~85 above the floor with his group lifted to the ceiling, so his water beam ended in
   the floor beneath him. A transform meant for the body goes on the frame the bones are posed in (index.html
   `mountFrame`, Shogun's mount) or on the proxy (stepTurn) -- never on the group.

43. **A query's arm names no field: read the PROLOGUE that feeds it (Viewer agent, 2026-10-01).** `0x72714`'s arms
   test s4 / s6 / s10, and read alone they look like `[+0x4f4]` / `[+0x508]` -- the prologue's first loads. They are
   not: the prologue rebuilds s4 / s6 as prev / cur from `+0x500` (or `+0x13ac`) and the step, keeps `+0x4f4` only as a
   gate and `+0x508` only as the wrap's target. em007-shells-spec §2a named the fields from the arm, and the map
   carried "the current frame" and "the frame at the tick's start" as READ; the result of the arm was right, the
   names were not. Before naming a field from a comparison, follow the register back to its LAST write.

44. **A stand-in allocator that reuses a freed block only for the SAME shape runs out under variety -- and the first
   refusal blacks out the whole monster (Viewer agent, 2026-10-01).** proof.js's GPU pool 5 stand-in (2 MB: efx/
   proofunit.py's size, "at least" the sGpuParticle ctor's buffers, which hold 1152 KB of it from the mount; the real
   pool 5's size is NOT read) handed a freed block back only to a request of exactly its size and alignment. One effect
   looped is flat that way (Shogun's L2 M27: 1234 KB over 115 passes); anything that asks NEW shapes -- the Beam Test's
   next type every play, a session of clips on one monster, a node sized by its particle count (effect-node-infinite.md
   11c's record E) -- raises the cursor per new shape with the old blocks idle (real run: 1152 -> 1432 KB, 10 idle
   blocks in 8 shapes) until 'GPU pool 5 stand-in exhausted', and live.js fails the monster's whole effect set. Found
   chasing Raven's "effects eventually stop rendering ... if the animation is kept on loop long enough", but NOT shown to
   be his case: the A/B (the committed proof.js served by an override server against the new one) ran 80 Beam Test plays
   and all 81 of Rustrazor's motions clean on BOTH -- the Beam Test has 44 types and goes flat once it has seen them all.
   His case was more likely a beam on a looped clip firing once (render/shells.js `rearm`). The limit is real all the
   same (a synthetic sequence of ever-new shapes exhausts the old allocator and plateaus on the new), so it is fixed: a
   coalescing first-fit allocator (proof.js installRequests). Measured with the viewer's OWN loop headless for minutes
   (scratchpad longplay.mjs: the pool's cursor, held and idle blocks each second).
45. **A P-block field written through a POINTER REGISTER never shows its offset (2026-10-05).** `P+0x944` is written by
   `strb [sb, #4]` with `sb = P+0x940` (`0x181854`): a scan for `#0x944` finds nothing, and a UI object's unrelated
   `#0x944` store (`0x757a64`, uUIOtomoBoard) was taken for it. Track the base register, as trap 16 says for loads.
46. **A shell recording BUILDS primitive records but never DRAWS them (2026-10-05).** `0x889100` / `0x8a2e58`
    calls in a `draw.json` show the record was built. Nothing under `0xbad790` ran: vecdrawsched has no primitive
    layer. A refusal in `lifted-prim.js` needs a `vecprim.py` set (or §4 B), not a re-record with record_shells.
47. **A harness that steps the body itself must step the ATTACHED bodies too (2026-10-06).** dev/shell-capture.mjs ran
   `pose.step([V.mounted.main])` only; Nakarkos's tentacles are posed by index.html stepAttached in the render loop, so every
   arm capture recorded them at the BIND POSE (an arm's joint 12 at y 735 behind him) and base01's ground snap deleted the
   arm shells in the replay -- the recordings came out holding the aura alone, with no error anywhere. The capture now calls
   `__view.stepAttached()`; any other harness stepping poses by hand needs the same.
48. **effect-check.mjs's lifted run seeds r0..r3, sp and d0..d7 ONLY -- a routine that takes `ip` fails every vector (2026-10-07).**
   `0xcabf1c` stores through `ip` (`0xcabf38` / `0xcabf64` / `0xcabf68`), which its caller sets; the vector does not carry r12,
   so the check reports "game 9, js unwritten" on Boltreaver's u 604 (shipped) and u 605 alike. The viewer is unaffected: the
   lifted caller passes its real r12, and the soak / live / sweep play the motions clean. A 0/N on such a routine is the
   harness, not the lift; carrying r12 needs the recorder to log it (vectors.py) and runLifted to seed it.
49. **An arc can carry a class's data under ANOTHER monster's id -- find a class's files by its loader's resource ids, not
   by file name (2026-10-08).** "No arm dt_tune in em084_00.arc" came from a name search for `em084_00_*`; the arm loads
   `ems099_00_dttune` / `_dtbase` (res `0x8390` / `0x8391`, `0x107bfb4`), shipped in the same arc. Resolve every
   `0x152530(rm, id, dti)` in the loader against the arc (`0x159daa0` hashes, scratchpad `resids.py` method:
   `~crc32(lowercase backslash path)`) before calling a file absent.
