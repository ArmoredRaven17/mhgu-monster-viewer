# base00's init — where a shell's position actually comes from

EMC, 2026-09-30. Written because Effects' capture has Basarios's shell00 at y ≈ −50 with floorY ≈ −1.4,
below the floor plane, and the built driver derives that from `setup+0x10` + offset. **The `setup+0x10` rule
is only one of three branches, and it is the one taken least often.**

## 1. `setup` IS the raw request — the derived-struct hypothesis is disproved

Traced `0x48b884` (the shell submit) to the end:

    0x48b9cc  ldr r0, [r8]            ; r8 = the newly created SHELL
    0x48b9d0  mov r1, r6              ; r6 = THE REQUEST, unchanged
    0x48b9d4  ldr r2, [r0, #0x13c]    ; shell vtable +0x13c = the init
    0x48b9dc  blx r2                  ; init(shell, request)

The request is passed **as-is**. Nothing derives a struct from it, and `[mgr+0x34]` is not on this path — the
manager's role is the pool scan at `0x48b8ec` (144 slots at `[mgr+0x6d8c]`) and the id/type checks at
`0x48b8a4`..`0x48b8cc`. So `[setup+0x10]` is literally the vec3 the spawner wrote.

The request is a **polymorphic object** (`[request+0x00]` is a vtable, set by the spawner from `[slot]+8`;
slot `+0x14` is called twice at `0x48b930`/`0x48b940`), which is why the 0x30 and 0x40 shapes coexist.

## 2. base00's init is `0x3f8b80`, and it has THREE position bases

`em004_00 sp_00`'s vtable `+0x13c` is `0xd304a8`, which is a one-instruction veneer `b 0x3f8b80`.
Tigrex's `sp_00` points at `0x3f8b80` directly. Same function.

    0x3f8cb8  tst r0, #0x10                  ; r0 = the FLAGS word
    0x3f8d54  bne 0x3f8d88                   ; bit 0x10 SET ->
    0x3f8d88    ldr r0,[r6,#0x10] -> [r4,#0x40]   ; base = setup +0x10/+0x14/+0x18  (RAW)

    0x3f8d58  movw r0,#0x15dc / ldr r1,[r4,r0]   ; the JOINT
    0x3f8d60  cmn r1, #1
    0x3f8d64  beq 0x3f8da0                   ; joint == -1 ->
    0x3f8e20    ldr r0,[r8,#0x40] -> [r4,#0x40]   ; base = THE OWNER'S POSITION
    0x3f8d68  else                           ; joint >= 0 ->
    0x3f8d70    bl 0xc15a4, copy sp+0x120 -> [r4,#0x40]   ; base = a joint MATRIX transform

`r8` comes from `0x3f8c14 bl 0x4a0f00` — `[shell+0x136c]` (the request) → `+0x0c` (the enemy) → `+0x0c`.
So `r8+0x40/+0x44/+0x48` is the owner chain's position, the same `+0x40` idiom em007's spawner reads out of
`[enemy+0x1428]`.

`+0x15dc` is the joint, and em004 `sp_00`'s reader writes it with `accB(cmn, 0)` at `0xd30514`..`0xd30520`.

**Then, in all three cases**, a yaw-rotated offset is **added** on top (`0x3f9140`..`0x3f9168`):

    vldr s0,[r4,#0x40] / vadd.f32 s0,s24,s0 / vstr s0,[r4,#0x40]     (and +0x44, +0x48)

built from `0x13ecc20`/`0x13ecc2c` (sin/cos) with a scale from `0xbe518` when flags bit `0x80` is set.

## 3. What this means for the driver

The viewer computes `setup+0x10 + offset`. That is correct **only when flags bit `0x10` is set**. Otherwise:

- **joint `+0x15dc` == −1 → the base is the OWNER's position**, so the shell lands on the monster and the
  rotated offset displaces it from there. A zero `setup+0x10` is then irrelevant.
- joint >= 0 → the base is the joint's transformed point.

Basarios's shell00 spawns at the origin + `(0,−50,10)` in the capture, which is exactly what the
`bit 0x10 set` branch produces from a zero `setup+0x10`. **So the question that decides it is whether bit
`0x10` is actually set in his shell00 mode's flags word (`+0x15e8`).** If it is not, the driver is on the
wrong branch and the fix is to use the owner's position as the base. I have not re-read his flags here —
`dev/em004-shell00-spec.md` has the ten flag tests and the per-mode values, and that is the one value to
check before changing anything.

## 4. Two things settled in passing

- **`setup+0x10` for em004's shell00 really is the shared empty vec3.** The spawner at `0xd28490` is a
  **0x30-byte** request (`0x3f883c`), terminator `+0x2e`, and it fills `+0x10..+0x18` from slot `0x1831a78`
  → `0x19176b0` and `+0x20..+0x28` from a **different** slot `0x18321b0` → `0x1620e60`, which is in
  `.rodata` (real static data, not `.bss`).
- **`accVec`'s null path returns the same address.** `0x4a22e0` resolves slot `0x1831a78` → `0x19176b0`,
  byte-identical to the spawner's `+0x10` source. A function whose job is "return a vec3 when the param is
  absent" would not return live scratch, which is the strongest available argument that the block really is
  a shared zero — so the placement is not explained by a runtime writer, it is explained by the branch.

## 5. Named limits

1. **I could not census writers of `0x19176b0`.** Two attempts produced 2518 and 1973 "sites" for that slot
   and a comparable count for an unrelated one — the PIC-pair resolver was matching any register-offset
   load. Both numbers are void. The map's "no writer" row rests on a detector of the same family and should
   be treated as unverified by me, though §4's `accVec` argument supports its conclusion independently.
2. What sets flags bit `0x10` in a mode's data, and whether Basarios's shell00 sets it (§3).
3. `0xc15a4` (the joint-matrix path) is unread.
