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
| NOT READ | the traversal `0xc3a254` / `0xc39b28` and filter `0xc14924` (where the ray ends below, which layers it sees); `0x5024b0`; `0x182dd4`'s vec3; a plain ground polygon's attribute words 1 / 2; vt `+0x9c`(core, 2) meaning "not spawned" (I) | — | — | §6 |
