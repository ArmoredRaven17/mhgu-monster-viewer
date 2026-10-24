p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
def rep(old, new):
    global s
    old = old.replace('\n', nl); new = new.replace('\n', nl)
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)

rep("""## 0. Bottom line
""", """## 0. Bottom line

**LAYOUT AND RELEASE (2026-10-17, latest -- §9.3, §15):** her raw lists 0 / 3 / 4 play the Queen ALONE; one list,
**"Combined (with Seltas)"** (id `duo`), holds every animation the ROM plays with him: 44 required clips of hers, the
joined S. Motion[76]-[79], 5 clips of hers where he LEAVES her (request 7, `+ Seltas leaves`: released at her frame 0 into
world space, his M46 then M47), his 7 own clips, and 95 of her both clips with him on his own decision loop
(`+ Seltas free`) -- 152 entries. The Off / Combined row and the Special list (it held only the duo clip) are gone.
**The male she carries back on her back after the tail grab is NOT dead**: his 1:0x21 freezes him (speed 0) for a
1200-frame timer and he stays linked; her M79 carries joint 200 back onto her back, so he rides there rigid until about
844 frames after her M79 ends, then his 1:0x22 unlinks him and he drops off (§15). What the viewer shows under M78 / M79
is that ROM state; the joined clip is not extended (no clip of hers holds the drop).
""")

rep("""## 11. Every coupling, frame for frame""", """### 9.3 The combined list (2026-10-17, supersedes the row and S_4 of §9 / §9.1 / §9.2)

Raven: *"leave Queen's raw animations uncombined in case people want to see them."*

* **Her raw lists 0 / 3 / 4** (and Special, which now holds no duo clip) play her alone: `partnerWanted` is true only on
  the combined list. The Seltas Off / Combined row is removed (`buildPartnerRow` no longer called).
* **"Combined (with Seltas)"** (`ROM_PARTNER_BODY.em069_00.partnerList`, id `duo`), built in index.html, in this order:

| group | entries | named | he plays |
|---|---|---|---|
| required | 44 | `Queen L<list> <clip>` | her clip's ROM pair (§3 / §11; the `combined` class of §6 / §14) |
| joined | 1 | `S. Motion[76]-[79]` | the tail grab with its blends (moved here from her Special list) |
| leaves | 5 | `Queen L<list> <clip> + Seltas leaves` | released at her frame 0 (§15): L4 M68 loop (shake-off 1:0x1a), L3 M12, L3 M18, L3 M35 loop, L3 M36 loop |
| his | 7 | `Seltas Motion[N]` / `Seltas Motion[33] with her 7:0x4e` | his clip leads; her side laid on his frames (M43, M35, M31..M34, the 7:0x3f / 7:0x4e pair) |
| free | 95 | `Queen L<list> <clip> + Seltas free` | his own decision loop, seeded per entry (§12) |

* **Decisions**: one entry per animation; the leading clip comes first in the name. His S_4 entries whose clip a required
  clip of hers already leads (M6, M7, M14, M4, M48, M3, M5, M71, M73, M45, M8, M27, M28, M79, M16, M9) are not repeated:
  her entry plays the same pair. The solo clips (L0 M16, L4 M29) and the 11 unresolved stay off it. Her clip-keyed effects
  and state records (render/motion-states.js, keyed by her list|clip) do not fire on the renamed combined entries -- her
  raw list still shows them.
* Check: dev/checks/em069_00.mjs duo block, 61 assertions (raw lists never mount him; each of the 152 entries mounts
  him with its pair; the release test of §15).

## 11. Every coupling, frame for frame""")

rep("""## 10. Not read
""", """## 15. The end of the tail grab, and every unlink (2026-10-17)

Raven: *"does she place the Dead Seltas back on her body? Seems odd and Seltas uses the stiff pose during this."*

**The end of the tail grab, read** (his 1:0x21, phases at `0xfc99c0..0xfc9aa8`):
* Phase 0: `0xb07b4(0.0)` (`0xfc99fc`): his motion speed 0 -- the freeze; `P+0x1bc` = 1200.0 (`movt #0x4496`,
  `0xfc9a18`).
* Phase 1: if `[+0x50]` (her object) is set, only the countdown runs: `0x7206c(&P+0x1bc, 1.0)` (`0xfc9a88`), which
  (`0x539d5c`) subtracts the unit's frame delta `e+0x1c` times 1.0 -- not his motion speed, so it runs while he is frozen.
  On expiry: `0x768c8(.., 1, 0x22)` (`0xfc9aa4`) -- his 1:0x22. With no partner: back to his table (`0xbc984`,
  `0x75230`, `0x82454`). Her side: at her M79 frame >= 80 `0xc0368` clears `P+0x3a2` (`0xfc99d0`).
* So **through her M78 and M79 he is frozen AND linked** (mode 3 on joint 200); her M79 brings joint 200 back onto her
  back (§13: within 1.1 of her pincers to frame ~128, back on her back by ~150), so he is set back on her back, rigid.
  The freeze starts with her M78 (§13); her M78 + M79 run about 356 frames from there; the timer runs 1200, so he stays rigid on her
  back for about **844 frames after her M79 ends**, under whatever her table plays next.
* Then **1:0x22** (`0xfc9ab4`): unlink (`0xc20f4`), bit 0 of `P+0x1bb` cleared, L4 M77 b0 (`0xfc9be4`), yaw + 0x8000,
  `P+0x14` = -10, `+0x24` = -1 (he drops); on landing (`0xbf0bc`) L3 M11 (`0xfc9c88`), at its end L3 M29 (`0xfc9ce4`),
  then `vt+0x3dc`.
* **He is not dead.** No code of either class kills him (§8). Her g1 s46 eat (1:0x1c, L0 M16) runs only if he is dead
  (selector 4) -- by the shared hit system, NOT READ.
* **The joined clip is not extended**: the drop is not inside any clip of hers (her next action is her table's), so
  S. Motion[76]-[79] ends where her M79 ends, with him frozen on her back -- the ROM's state at that frame. A separate
  "Seltas 1:0x22 drop" entry could show his M77 -> L3 M11 -> L3 M29, but the 844-frame wait and her clip under it are her
  table's pick; not added.
* **Difference from Raven's reading**: the stiff male is alive, held by a timer, and his "stiff pose" is his M79 frame 6
  (§14.1), the ROM's.

**Every mid-clip unlink, audited** (his link sites, rom-map `0xfc5054` row):

| unlink | when | which clip of hers | viewer |
|---|---|---|---|
| 1:0x13 (`0xfc5054`, bit `0xfc5088`) | at its own start, his answer to request 7 (her hook at her action start: 1:0x1a `0xf8972c`; (10,8) / (10,0x25) / all status 11 `0xf8975c`) | L4 M68 loop (the shake-off), L3 M12, L3 M18, her deaths L3 M35 loop / M36 loop -- at her frame 0 | `+ Seltas leaves`: released at her frame 0 in world space, M46 b4 then M47 b0 (`0xfc8e84`); unlinked he does not ride again (`0xfc8e9c`); glow off (`0xfc6468`) |
| 1:0x22 | the 1200-frame timer above | none -- after her M79 ends | S. Motion[76]-[79] ends linked, frozen |
| 1:0x12 (`0xfc521c`) | its trigger NOT READ | no clip of hers is known to issue it | -- |
| 7:0x3f cut (`0xfd58e4` -> `0xfd5950`) | she enters status 10 (number != 0x69) while he runs 7:0x3f | a flinch interrupting her 7:0x4e / 7:0x4f -- not a clip of its own | -- |
| her `[+0xc] & 7` not 1..2 (`0xfc59c8` -> `0xfc5b40`) | every frame she is gone | none (she is not drawn) | -- |
| his death (status 11, `0xfc5eac` / `0xfc4894`) | by damage, NOT READ | none | -- |

Clips shared between a request-7 action and a linked one (L3 M5, M7, M10, M11, M14, M21, L0 M19, §2.3) stay `both`: he is
on her under them on the combined list (`+ Seltas free`).

**In the viewer**: `ROM_PARTNER_BODY.em069_00.leaves` = M46 b4, M47; index.html `partnerClipOf` gives a leaves entry a
`release` pick; `releaseMatOf` samples her joint 200 at HER frame 0 from her own pose driver (put back after), so a late
load, a scrub or a pause cannot move it, and `attachFrame` holds his frame there. The check: at her frame 0 his frame is
joint 200's; at frames 40 / 80 his frame is unchanged while joint 200 has moved > 1; he plays M46 then M47; glow group 8
off; control: on L4 M36 + Seltas free his frame follows joint 200 frame by frame and group 8 is on.

## 10. Not read
""")
rep("""* Her M78 attack 0x2b against him (§8).""", """* Her M78 attack 0x2b against him (§8).
* What issues his 1:0x12 (`0xfc521c`, §15).""")
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
