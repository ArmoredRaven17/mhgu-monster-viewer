# Effect placement mode 4: the camera-attached placement (research agent for the Viewer agent, 2026-10-05)

Static reads only (armdis + capstone over main.text, my own scans in the scratchpad). Nothing was recorded or
emulated. Every claim is marked **READ** (the consuming instruction was read, address given) or **INFERRED**
(with the reason). Offsets: `payload` = the record's 160 bytes; `block` = payload + 0x10; `descriptor` =
block − 0x30 = payload − 0x40 (= `effect + 0x220`; dev/recompose-0x31d16c-trace.md). The core's own descriptor
copy sits at `core + 0x50`.

## 0. Short answer

**Mode 4 places the effect relative to the game's CAMERA, not the monster.** Its position is
`eye + offset.x·R0 + offset.y·R1 + offset.z·R2`, where `eye` comes from the camera's view matrix and R0..R2 is a
basis built from the camera's look direction (forward = target − eye) and world Y. The camera is the one of
`sCamera`'s eight viewports whose bit is set in payload `+0x86` and whose active byte is set. The ROM reaches
it through a singleton the harness and the viewer never set up (`*0x211f504`), and that is the cause of every
stop on this branch:

- **recorder**: the pointer is 0, `.text` is mapped at VA 0, so "viewport 0 is active" reads text byte 0x60
  (0x90) and "its camera" reads the text word at 0x54 = **0x3a000048**. The fault at 0x31f1b4 is that word used
  as a camera (READ: `armdis.u32(0x54) == 0x3a000048`, and the u 94 log's r1 = 3a000048).
- **viewer**: low memory reads 0, so the active byte is 0 and the lookup goes on into code never recorded:
  **0x31d298** (inside the placement) or **0x31d0b0** (inside the core's range test). Which one a record hits
  first is decided by payload `+0x58` (§6).

## 1. The field `[r4+0x76]` and what mode 4 is (Q1)

| claim | st | where |
|---|---|---|
| `[r4+0x76]` in 0x329d88 is the **descriptor's placement mode**: r4 = descriptor (the start passes `effect+0x220`) | READ (earlier) | rom-map "payload map"; recompose trace |
| Its only writer on the record path is the field copy `0x31bbe8`: `ldrb r4,[r1,#0x36]` / `strb r4,[r0,#0x46]` at **0x31bd54 / 0x31bd64** (mask bit 3 of the word at block+4). So it is **payload byte +0x36**. The block ctor `0x31b6b0` defaults it to **3** (`mov r1,#3; strb r1,[r4,#0x46]`, 0x31b778 / 0x31b780) | READ | this pass |
| Other `#0x76` stores in the runtime are other structs: `0x31c1cc strh r5,[r0,#0x76]` is block +0x76 (= payload +0x66, a halfword), `0x3f713c` is a shell base copying its own bytes | READ | lifted-proof.js:546, lifted-request.js:5218 |
| 0x329d88: mode 4 → compose state **0** (`0x329e8c mov r1,#0`, stored at 0x329eac). State 0 is re-placed **every frame** by the recompose (gate 0x327238 `cmp r0,#1; bhi`) | READ | lifted-request.js L_329d88 (the 0x329e8c arm is now lifted in the working tree) |
| 0x329d88 itself does nothing camera-specific; mode 4 sends it down the same state as a mode-0 record with space ≠ 1. The camera work is all in **0x31d16c** and the core's **vt+0x68** | READ | §2, §6 |
| **Meaning: mode 4 = camera-attached (screen-space) placement**, re-placed every frame | INFERRED from §2's arithmetic: the position is built from the camera's eye and basis, the offset is in camera axes. The game's own name for it is not in the binary |

Other payload fields mode 4 reads, all copied by 0x31bbe8 (READ, copy instruction given):

| payload | descriptor | copy | used by mode 4 as |
|---|---|---|---|
| `+0x00..+0x08` offset | `+0x40` | 0x31bcc4 | the offset in camera axes (§2) |
| `+0x38` space | `+0x78` | 0x31bdc0 / 0x31bdd0 | 0 → the rotation is aimed from the camera direction (0x31d588); 1 → the rotation is aimed at the parent (0x31f400 / 0x31f7e8) |
| `+0x3c` axis selector | `+0x7c` | 0x31bee0 / 0x31bef0 | which rotation components are zeroed (0 / 1 / 2 arms at 0x31d66c and 0x31f89c; 3 = none) |
| `+0x42` | `+0x82` | 0x31bf94 / 0x31bfa4 | in 0x328d9c (as core +0xd2): 0 → the range distance is divided by the parent's scale |
| `+0x52` ground flag | `+0x92` | 0x31bfb8 / 0x31bfc8 | non-zero → `r5`'s vt+0x58 ground height (0x31f400, 0x31f8dc); 0 on every mode-4 record |
| `+0x58` float | `+0x98` (= core `+0xe8`) | 0x31bc04 / 0x31bc14 | **the range** of the core's camera/player test (§6). The rom-map payload map calls +0x58 "spawn-height limit 900.0"; this pass shows a second consumer, it does not test the first |
| `+0x86` u16 | `+0xc6` | 0x31c468 / 0x31c478 | **the viewport mask** (bit k = sCamera viewport k) |

## 2. `[sp+0x38]` in 0x31d16c: the camera (Q2)

### The lookup, 0x31d228..0x31d398 (READ)

    31d228  ldrb r1,[r4,#0x76]          ; mode
    31d224  ldr  sb,[fp,#0x24]          ; the parent unit (stack arg 8; see below)
    ; sb != 0 and ([sb+0xc] & 7) in {1,2}  -> 0x31d288: ip = mode, sl = 0
    ; else sb = 0, sl = 1; mode < 2 -> ip = 2; mode 4 -> ip = 2 if [r4+0x78]==1 else 4
    31d290  cmp r1,#4 / bne 0x31d37c    ; modes != 4 store r2 = 0 below
    31d298  ldr r1,=GOT 0x1832188       ; -> *0x211f504
    31d29c  ldrh r2,[r4,#0xc6]          ; the viewport mask (payload +0x86)
    31d2a8  ldr r1,[r1]                 ; G = the sCamera singleton
    ; for k = 0..7: if (mask & (1<<k)) and byte [G + 0x60 + k*0x1b0] != 0: take k
    31d368  mov r2,#0x1b0 / smlabb r1,r5,r2,r1 / ldr r2,[r1,#0x54]   ; camera = [G + 0x54 + k*0x1b0]
    31d374  cmp r2,#0 / beq 0x31d470    ; no viewport, or a null camera -> 0x31d470
    31d37c  str lr,[sp,#0x34]           ; r1 arg (e+0x210, the core)
    31d38c  str ip,[sp,#0x3c]           ; the EFFECTIVE mode
    31d394  str r2,[sp,#0x38]           ; the CAMERA (0 for every mode but 4)
    31d398  str r1,[sp,#0x30]           ; descriptor+0x40, the offset
    31d470  strb #0,[r8,#0x70] ; b 0x31f9a4 (return)   ; mode 4 with no camera: not placed

So `[sp+0x38]` = the camera object, written once at **0x31d394**, from `[G + 0x54 + k·0x1b0]`; `[sp+0x3c]` (the
local rom-map row 344 calls UNREAD) = the effective mode `ip` above. Mode 4 with no active viewport in the mask
leaves through **0x31d470**: `out+0x70 = 0`, nothing placed; the recompose then drops bit `0x800` of the unit's
`+0xc` (0x327394..0x3273d4: with `out+0x70 == 0` only `0x3d << 10` survives; READ), so the effect stays at the
caller's `+0x330` position and loses the bit the core's `+0x18c` would set. That the bit is draw-enable is
INFERRED.

### What G and the camera are (READ unless marked)

| claim | st | evidence |
|---|---|---|
| GOT `0x1832188` → `0x211f504` (`.bss`) holds the **sCamera** singleton. Its ctor stores itself there (`0xb87494 ldr r2,[pc,r2]; 0xb87498 str r0,[r2]`); its vtable `0x178df88` slot +0x14 (`0xb88f94`) returns DTI `0x211f4e4`, registered at `0xb89060` with the name **"sCamera"**, size **0xdf0** (build/arm/dti.json: 3568) | READ | gotscan (93 sites read the slot; 0x31d2a0 among them = positive control) |
| The 8 slots are **sCamera::Viewport** objects at `G + 0x30 + k·0x1b0` (DTI "sCamera::Viewport", size **0x1b0** = 432, registered at 0xb89024; the ctor/dtor stores a vtable at `+0xc00` = slot 7's base; 0xb87d68 `mla r6, k, 0x1b0, G+0x30`) | READ | |
| viewport `+0x30` (= `G+0x60+k·0x1b0`) = its **active** byte: `0xb860f0 ldrb r0,[r5,#0x30]; beq` skips the viewport's draw | READ (that it is "active") INFERRED from that use |
| viewport `+0x24` (= `G+0x54+k·0x1b0`) = its **camera** | READ that the placement uses it as one (+0x40/+0x60, vt+0x4c); its writer NOT READ |
| The quest camera class: **uQuestCamera** (vtable `0x1729d0c`, getDTI 0x2a15c → DTI `0x18468b8`), size 0xb00; uFestaCamera / uSubSceneCamera / uVillageCamera vtables `0x1729c28` / `0x1729d90` / `0x1729e10` share slot +0x4c | READ (vtables and their DTIs); that viewport 0 holds a uQuestCamera during a hunt: INFERRED (class name; writer not read) |
| camera **vt+0x4c = `0x1c33c`(out, cam) → `0x7c2f70(out, cam+0x40, cam+0x60, cam+0x50)`**: 0x7c2f70 forms `normalize(arg2 − arg1)` first (0x7c2f9c..0x7c2fec) — a look-at matrix from **eye +0x40, target +0x60, up +0x50** | READ (args, the subtraction); "look-at / view matrix" INFERRED: both consumers (0x31f324..0x31f394 and 0x42b08..) recover the eye as `−(row_i · t)` from its rows 0..2 and row 3, which holds for a world→view matrix in the row-vector, translation-last-row layout host.js already uses for `view` |
| `0x1832130` → `0x19176f0`: the Y axis vector the placement crosses with (also 0x31d5fc) | INFERRED from spawn.js:383 ("the ROM's Y axis", recorded) and the arithmetic; the rom-map row 682 still says contents UNREAD |
| `0x1831a78` → `0x19176b0`: MtVector3 zero, passed as the basis's position | READ (rom-map row 733 / construct.js) |

### The placement with the camera (space 1, the recompose and the start both pass `[fp+0x18] = [fp+0x1c] = 1`)

    31f0ec  ldr r1,[sp,#0x3c] ; orr r0,r1,#1 ; cmp r0,#1 ; bne 0x31f194     (ip = 4 goes on)
    31f194  ldr r5,[sp,#0x34] ; cmp r1,#4 ; bne 0x31f4a4
    31f1a0  ldr r0,[sp,#0x38] ; cmp r0,#0 ; beq 0x31f4a4                   (no camera: the plain offset add)
    31f1ac  c = [sp,#0x38]; P = c+0x40..48, T = c+0x60..68, Y = *0x1832130
            d = T − P ; a = d × Y ; u = normalize(a × d) ; f = normalize(d)      (0x31f1dc..0x31f2fc)
    31f30c  B = 0x7c8f04(out, u, f, zero)  : rows (normalize(u × f), u, (u×f)×u, (0,0,0,1))   (0x7c8f04 READ)
    31f320  V = cam->vt+0x4c(out=sp+0xf0, cam)                                     (the view matrix)
    31f324..31f394  out+0x10..0x18 = −(V.row0·V.row3, V.row1·V.row3, V.row2·V.row3)  = the EYE ; out+0x1c = 0
    31f398..31f3b4  V.row3 := (offset, 1) ; V *= B   (0x1ebe8 = MtMatrix operator*=, polyline.js:35)
    31f3d8..31f3f0  sp+0x40 = V.row3.xyz + eye  =  eye + offset.x·B0 + offset.y·B1 + offset.z·B2

READ, instruction by instruction, except the names "eye", "up", "forward". For u 94, offset = (0, 100, 500):
**100 up and 500 along the camera's look direction from the eye** (B2 = f for an orthonormal u ⊥ f). The sign of
B0 (u × f) is camera-left for a right-handed Y-up frame; every mode-4 record in the data has offset.x = 0, so it
does not show.

Then, with `[fp+0x18] == 1` and space 1 (0x31f3d0..0x31f3fc), 0x31f400..0x31f470 converts the rotation to
radians and **aims from that point at the parent**: joint `[r4+0x72]` > −1 → the parent's `vt+0x54` joint matrix
(0x31f48c), its row 3 (`+0x30..+0x38`); joint −1 → the parent's `+0xe0..+0xe8` (0x31f7e8); `d2 = that − P`, a basis
with Y (0x31f854..0x31f890), then **0x31fc94** (NOT READ: it writes the out rotation), then the `+0x7c` zeroing
(0x31f89c), ground (0x31f8dc, `+0x92` = 0 here), out+0x00..0x08 = P (0x31f914..0x31f928). READ to the call;
"faces the monster" INFERRED. With space 0 (c 101) the rotation is instead built from the camera direction at
0x31d588..0x31d65c (same `+0x40/+0x44/+0x48/+0x60/+0x64/+0x68` loads, `0x31fc94` again), and the position step at
0x31f1ac is the same.

Reads of the camera object in all of mode 4: `+0x40..+0x48`, `+0x60..+0x68`, `[cam]` → vt `+0x4c`, and through
vt+0x4c `+0x50..+0x58`. Nothing else (READ: every `[sp,#0x38]` load in 0x31d16c is at 0x31d574, 0x31d588,
0x31f1a0, 0x31f1ac, 0x31f310; plus 0x328d9c / 0x42aac in §6).

## 3. Who fills it for Nakarkos's u 94 (Q3)

- **Nobody on the monster's side.** The camera is the game's: sCamera's viewport 0 (mask bit 0 on all ten
  mode-4 records in the data, §5). What writes viewport `+0x24` is NOT READ; that it is the hunt camera is
  INFERRED (uQuestCamera is the camera class with the quest's name).
- **`E+0xb648 = 3` is not related to the mode.** READ at 0x1068840..0x106891c: the pair's two requests are issued
  through vt+0x1d0 with the **same** params pointer `r5 = E+0xb640`; `+0xb648 = 3` is stored before the first
  (`str r1,[r7,r0]!`, 0x1068848 / 0x10688d8) and cleared to 0 after the second (`str r0,[r7]`, 0x106891c). So u 90
  and u 94 get identical request params; the difference is the record. What `+0xb648` means: NOT READ.

## 4. Why u 90 runs and u 94 stops (Q4) — the payloads (READ from docs/effects/em084_00.json)

| | u 90 | u 94 | u 95 / u 96 | u 202 | c 101 |
|---|---|---|---|---|---|
| efl | 060 | 060 | 060 | 065 | cm202_050 |
| `+0x36` mode | **0** | **4** | 4 | 4 | 4 |
| compose state | 1 (space 1) | 0 | 0 | 0 | 0 |
| `+0x38` space | 1 | 1 | 1 | 1 | 0 |
| `+0x32` joint | 0 | −1 | −1 | 3 | 0 |
| offset | (0,0,0) | (0,100,500) | (0,100,400) | (0,0,100) | (0,0,400) |
| `+0x58` | 900 | **0** | 0 | 0 | **4500** |
| `+0x86` mask | 0 | 1 | 1 | 1 | 1 |

u 90 (mode 0) never enters any camera code: 0x31d290 `bne 0x31d37c` stores `[sp+0x38] = 0`, and the core's
mode-4 tests (0x3293c4, 0x329608) are not taken. u 94 is the record that reaches **0x31d298**: in the live
"Charge 1" pair it is u 94, not u 90 (the coordinator's first data point). It is the **same** mode-4 path as the
earlier 0x329e68 refusal, one step further on now that 0x329e8c is lifted; the viewer's joints and parent are
not involved yet at 0x31d298 (the lookup runs before any parent use). Note `+0x86` alone is not a mode-4 marker:
2776 of 5980 records hold a non-zero mask with mode ≠ 4; it is only read behind a mode == 4 test.

## 5. What must be supplied (Q5)

The runtime's convention (host.js `createParent`, `initDraw`): a stand-in object in flat memory, its vtable slots
pointing at ROM addresses that run lifted (`VT+0x54 = 0x939278`) or at registered natives, and fixed `.bss`
pointers written directly (`m.w32(0x211f8b4, SYS)`). Mode 4 needs, in that convention:

1. **the sCamera singleton**: `G = malloc(0xdf0)` zeroed; `m.w32(0x211f504, G)`. **[game: the boot's sCamera]**
2. **viewport 0 active with a camera**: `m.w8(G + 0x60, 1)`; `m.w32(G + 0x54, CAMOBJ)`. Other viewports inactive
   (every mode-4 record in the data has mask 1). **[game: the hunt's viewport 0]**
3. **the camera object** `CAMOBJ = malloc(0xb00)`, vtable with **`+0x4c = 0x1c33c`** (the ROM's own getter, so the
   view matrix is the ROM's from the same three vectors); each frame `+0x40` = eye, `+0x50` = up (0,1,0),
   `+0x60` = target, w words 0. In the viewer: the orbit camera's position and target, in the ROM frame the
   parent's `+0x40` uses. The placement uses only the direction `target − eye` (normalized at 0x31f2d0) and the
   view matrix; 0x1c33c / 0x7c2f70 are not lifted yet. Alternative: a native at +0x4c writing host.js's `view`
   (16 floats, row-major, translation last row); that skips the ROM's look-at and must agree with +0x40/+0x60.
   **[game: uQuestCamera, vtable 0x1729d0c]**
4. **the parent**: already supplied. It must be a type-1/2 unit (`[+0xc] & 7` in {1,2}; createParent's
   `0xf4ff9` gives 1), else a space-1 mode-4 record takes the ip = 2 arm instead (0x31d24c..0x31d25c). Joint −1
   reads `parent+0xe0..+0xe8` (INFERRED to be the world matrix's translation row as composeParent writes it);
   joint ≥ 0 goes through `vt+0x54` as today.
5. **the range point, for records with `+0x58` ≠ 0 (c 101)**: core vt+0x64 = **0x42aac** first asks a manager
   `*0x187ea38` (`.bss`) through `0x275dc0` = `mgr[+0x1c + 4·[*0x18858a8 + 0x30]]` for a unit and uses its
   `+0x40`; with none, it uses the camera eye from vt+0x4c. **Neither pointer is null-checked** (0x42acc,
   0x275dd0). The viewer reads 0 there today (low memory is zero), so it would take the camera-eye arm by
   accident; the recorder reads `.text`. Supply a manager stand-in whose slot is 0 (the ROM's own no-unit arm), or
   a unit with the hunter's position. That the unit is the local hunter: INFERRED (manager not identified).
6. **the recorder harness (efx_emu.py)** needs items 1–3 and 5 too, poked after the static initialisers (they
   fill the Y axis and the zero vector the path reads). Without them it records garbage: c 101's recording
   (`add_em084_00_c101.log`) ran 0x328d9c 197 times with camera 0x3a000048, never reached 0x31d16c and drew 0
   GPU draws; its vectors are of the wrong arm.

**Code the path needs lifted (never recorded):** 0x31d298..0x31d398 (the lookup), 0x31d470, 0x31d56c..0x31d66c,
0x31f1a0..0x31f3fc, 0x31f400..0x31f4a0, 0x31f7e8..0x31f8dc, **0x31fc94**, **0x7c8f04**, **0x1c33c**,
**0x7c2f70**, 0x13ecc14 (only on a NaN sqrt); for c 101 also 0x31d0b0..0x31d164, 0x328dd8..0x328e98, **0x42aac**,
0x275dc0, 0x3f772c, and the out-of-range teardown 0x329638..0x3296f0.

**Still unread:** 0x31fc94 (the rotation it writes), the viewport +0x24 writer, the manager at 0x187ea38, what
the `+0xc` bit 0x800 gates, what `+0xb648` means, and the Y axis's contents (taken from spawn.js).

## 6. Positive control: the two stops and the other refusals (Q6)

**The core's range test.** uMHEffectCore vt+0x68 = **0x328d9c** (vtable 0x172a578 + 0x68 = 0x172a5e0, READ):

    328db4  s0 = [core+0xe8] (payload +0x58) ; == 0 -> return 1            (no camera code at all)
    328dc8  cam = 0x31d074(core+0x50)   ; mode != 4 -> 0; else the same viewport lookup as 0x31d298 (READ)
    328dd4  cam == 0 or [core+0x140] == 0 or its vt+4() == 0 -> return 0
    328e18  pt = core->vt+0x64(core, out, cam)          ; 0x42aac, §5 item 5
    328e1c  d = pt − parent+0x40 ; [core+0xd2] == 0 -> d /= parent+0x60 (per axis)
    328e88  return ([core+0xe8] >= |d|)

Its two callers both test mode 4 first (READ): **0x3293c0** (`[core+0xc6] == 4 && [core+0x30] == 0` → vt+0x68; 0
→ `core+0x30 = 1`, not spawned) and **0x3295fc** (per frame, mode 4: 0 with `+0x18d` set → every live unit gets
vt+0x48 / vt+0x128 / vt+0x88, then `+0x18d = 0`). So a mode-4 record with a range spawns only while the hunter
(or the camera) is within `+0x58` of the parent, and is torn down when it leaves. "Hunter" INFERRED.

| record / clip | prediction from this reading | observed (coordinator, 2026-10-05) |
|---|---|---|
| u 94 / 95 / 96 (`+0x58` 0) | 0x328d9c returns 1 at once; first camera code = the placement's lookup, viewport 0 inactive → **0x31d298**'s inline loop (never recorded) | 0x31d298 ✓ |
| u 202 (`+0x58` 0) | same → **0x31d298** | 0x31d298 ✓ |
| c 101 (`+0x58` 4500) | 0x31d074 first; bit 0 set, `[0 + 0x60]` = 0 → **0x31d0b0** (recorded only taken, under the recorder's text byte 0x90) | 0x31d0b0 ✓ |
| L2 M81 / M82 | the charge pair u 94 / 95 / 96 (held through M81, stopped at M82 f285, em084-class-effects §2) → 0x31d298 | 0x31d298 ✓ |
| L0 M14 / L0 M63 | a mode-4 record with `+0x58` ≠ 0; in em084_00.json the **only** one is c 101 → 0x31d0b0 | 0x31d0b0 ✓ (c 101's binding to these clips not checked) |
| recorder u 94 / u 202 | camera = text word at 0x54 = 0x3a000048 → fault at 0x31f1b4 `vldr s0,[r1,#0x44]` | both logs fault there, r1 = 3a000048 ✓ |

**Where it does not fit: the beam u 20.** u 20's payload mode is **3** (READ, `+0x36` = 03), so its record cannot
take `cmp r0,#4; beq` at 0x329e68, nor reach either stop. The rom-map row "`0x329e64` / `0x329e68` ... Nakarkos's
body beam (L0 M63, mode 14, u 20)" attributes the refusal to the wrong record; the record on L0 M63 that takes the
mode-4 arm is, by the table above, c 101. INFERRED, open on one point: a requester could override the mode
(0x31bbe8 copies a field only under its mask bit, and a shell request's masks were not read here).

**Other monsters (predictions, not run):** em024_00 u 220 / u 240 (`+0x58` 0) → 0x31d298; em050_00 u 301 (9000),
em083_00 / em083_04 u 256 (2000) → 0x31d0b0. These are the only other mode-4 records in docs/effects (10 of 5980).

## 7. Proposed dev/rom-map.md rows

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

WITHDRAWN (move, do not delete): row "`0x329e64` / `0x329e68` (in `0x329d88`)": the claim "Nakarkos's body beam
(L0 M63, mode 14, u 20) reaches it" — u 20's payload mode is 3; the L0 M63 mode-4 record is c 101 (INFERRED from
the json scan and the 0x31d0b0 stop); the "why mode 4: UNREAD" half is answered here.

## 8. What to implement

1. **host.js**: a `createCamera()` beside `createParent()`: G (0xdf0) at `*0x211f504`, viewport 0 active
   (`G+0x60 = 1`), `G+0x54 = CAMOBJ`; CAMOBJ's vtable `+0x4c = 0x1c33c`. A `setCamera` path that also writes
   CAMOBJ `+0x40` eye, `+0x50` up, `+0x60` target from the viewer's camera every frame, before the unit passes
   (the recompose reads it each frame). Plus a manager stand-in at `*0x187ea38` whose slot is 0 (or the hunter's
   position, Raven's call: the game measures c 101's range from the hunter, INFERRED).
2. **efx_emu.py** (the recorder harness): the same three objects after the static initialisers, with a fixed
   eye / target, so recordings take the camera arm instead of reading `.text`. Re-record u 94 / 95 / 96, u 202,
   c 101 (its current vectors are the garbage arm), and the em024 / em050 / em083 mode-4 records.
3. **lift** what §5 lists (0x31d298.., 0x31f1a0.., 0x31fc94, 0x7c8f04, 0x1c33c, 0x7c2f70, 0x42aac, ..) from those
   recordings. Read **0x31fc94** before calling the rotation done.
4. The viewer's free camera is the ROM's input here: these effects will sit 400–500 units in front of whatever
   camera the viewer has, and follow it. That is what the ROM does with its own camera.
