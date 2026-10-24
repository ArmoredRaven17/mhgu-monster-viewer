p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
old = "## 10. Not read" + nl
assert s.count(old) == 1
new = """## 18. Unlinked: the dismounts in world space, and what he does next (2026-10-17; Raven: "once delinked Seltas follows his normal logic")

* **How a unit moves** (the shared move pass `0xae370`): linked, the link modes place his unit on her joint; unlinked, the
  unit `P+0x40..` moves only by code -- the frame's move request `P+0x530` (`P+0x540`), velocities (`0x7d65c`), direct
  writes -- and the body is drawn from joint 0 on the unit. **The clip's `reference` track is not drawn**: his 1:0x13 jump
  (0, 1392.5, 245) x size at M46's end equals M46's last joint 0 minus M47's first ((0.03, 13.80, 2.446) model units); with
  M47's reference (0, 13.932, 0) drawn instead, M47 would start 2.4 behind M46. The viewer plays the unlinked partner with
  the reference held (pose.js `holdReference`) and moves his frame by the code.
* **Built** (render/monster.js `ROM_PARTNER_BODY.em069_00.dismounts`; index.html `dismountPlan` / `unlBaseOf` /
  `unlFrameAt`): the unit starts where joint 200 is at her frame 0, upright (pitch / roll 0), at his yaw + hers, kept in the
  world group's space.
  * **leave** (request 7: `Queen L4 M68 / L3 M12 / M18 / M35 / M36 + Seltas leaves`, her clip held or looped to 300 frames):
    L4 M46 b4; at its end the unit jumps up 1392.5 and forward 245 x size; L4 M47 b0; then vt+0x3e0's (0, 3), L1 M1 b10, the
    hover. Wings flap from frame 0 and on across the pieces; glow off.
  * **drop** (`Seltas Motion[77] drop off her (1:0x22)`, a new entry of his; her side her idle L0 M1, 600 frames): turned
    180 degrees at frame 0; L4 M77 b0; falling -10 / frame, -1 / frame^2 to her ground (the grid floor) -- 15 frames from
    her back in the check; on the ground L3 M11 b0 (start + one loop pass), L3 M29 b0, then vt+0x3dc's (0, 0), L0 M1 b10.
  * The "+ Seltas leaves" static hold is gone; the combined list has 153 entries (his 8).
* **What his table does next, unaware** (the EMC ops read for it, rom-map "EMC ops -- the shared table"): g0 s0 on a fresh
  walk (latches `0x73f0 / 0x73f3 / 0x73f4` 0) -> the posture switch (posture 4: (6, 3)) -> just-exhausted test (op 68:
  `P+0x527` bit 0) -> the awareness switch (op 0a, `P+0x2c0`; 0 -> default) -> the link (0) -> g0 s1 -> op 4e (the wander
  state s8 `e+0x73d3` < 0) -> op 97: **THE WANDER** state machine over the stage's navigation (`0x8b1fc`, RNG
  `0x7c9234`). That is where the unaware Seltas goes, and it needs the area's navigation data the viewer does not have --
  NOT READ through; the viewer holds his idle there (L0 M1 on the ground, L1 M1 in the air). **No unaware stream of his
  re-combines him**: he goes back onto her only when she asks (her requests 4 / 0xa / 0xf, his 1:0x2 / 1:0x1a answers).
* **Not built**: his own effect runtime (render/rom/effect-mounts.js runs one runtime, the main monster's -- the Effects
  lane's code); a seeded pick loop for the wander (the wander itself is not readable without navigation).
* **The hit system** (her attack 0x2b on him): `0x7db70` arms the record; when the attacker is linked it takes the
  partner's facing (`+0xfec` + `P+0x54`). Whether any record can hit the partner is the collision side's target filter --
  NOT READ. So the smash -> his death -> her eat chain stays unbuilt (§17).
* Checks (duo block): leave -- unit at joint 200 at frame 0, unmoved while her joint moves, the jump at frame 31 to the
  read offset, the root continuous across the seam, the hover after M47, glow off; drop -- 180 degrees, the fall at frame 5
  to the formula, on the floor at the landing frame with L3 M11, then L3 M29 and L0 M1, his root coming down; control: a
  linked entry follows joint 200.

## 10. Not read
"""
s = s.replace(old, new)
open(p, 'w', encoding='utf-8', newline='').write(s)

P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read().decode('utf-8', 'surrogateescape')
old = """      - [ ] (read) his UNLINKED logic (Raven: "once delinked Seltas follows his normal logic"): decode the EMC ops his
        unlinked root stream uses (0x61, 0x9e, 0x3f, 0x54, 0x0c, 0x68, 0x0a, 0x24, 0x39) for "no hunter", then build the
        dismounts with their code movement (1:0x13 offset, 1:0x22 fall / turn / landing, read in spec §17) and his picks after."""
assert b.count(old) == 1
new = """      - **UNLINKED 2026-10-17**: READ + BUILT the dismounts in world space (spec §18): the engine draws joint 0 on the unit,
        not the reference track (the 1:0x13 jump matches the M46 / M47 seam); leave = M46 b4, jump (0, 1392.5, 245) x size,
        M47, hover L1 M1; drop (new entry "Seltas Motion[77] drop off her (1:0x22)") = 180 degrees, M77, fall -10 / -1 to her
        ground, L3 M11, L3 M29, L0 M1. EMC ops 0a, 0c, 24, 39, 3f, 4e, 54, 61, 68, 96, 97, 9e read into rom-map's shared op
        table. Unaware, his table goes to op 97, the WANDER over the stage navigation (NOT READ through; the viewer holds his
        idle); no unaware stream re-combines him. Static leaves hold removed; list now 153 entries.
      - [ ] (read) the wander state machine op 97 (`0x8b1fc`) and op 96 (`0x8a740`) -- they need the area navigation.
      - [ ] (build, Effects lane) a second effect runtime for the partner (his L4 M31..M34 PSL bits)."""
b = b.replace(old, new)
open(P, 'wb').write(b.encode('utf-8', 'surrogateescape'))
print('ok')
