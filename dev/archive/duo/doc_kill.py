p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
def mark(prefix, note):
    global s
    i = s.index(prefix); j = s.index(nl, i)
    line = s[i:j]
    s = s[:i] + line.rstrip(' |') + ' ' + note + ' |' + s[j:] if False else s[:i] + line + ' **[WITHDRAWN 2026-10-22 in part, see the Withdrawn table: ' + note + ']**' + s[j:]
mark("| `0xfc9a18` / `0xfc9a88` -> `0x7206c` -> `0x539d5c` / `0xfc9aa4` |", "he IS killed at her M79 frame 80 -- spec §21")
mark("| her status-1 actions (all phases x link x scenarios) and every vtable method of uEm069_00, run against him", "her record 0x23 kills him through the hit system -- spec §21")
mark("| `0x168f20` (the partner exclusion) |", "a hit object with +0x30 & 0xc0 skips it: her M79 record 0x23 (flag 0x400) hits him -- spec §21")
# the new rows, after the 7:0x3f timeline row's neighbour (the pair-pass row)
a = "| `0x16acf0` (the hit manager's pair pass;"
i = s.index(a)
rows = [
"| `0xf8fc8c` (her 1:0x24 phase 0, her M79) -> `0x7db70(e, 0, 0x23, 0x400)` | **HER M79 ARMS THE KILL (duo agent, 2026-10-22; `duo/arm23.py`)**: record 0x23 (em069_00_attackdata: kind byte 6 = 0x0a, shape set byte 0x19 = 18 = ONE sphere r200 on JOINT 200, em069_00_hitsize.hts) with flag 0x400 -> hit object `+0x30` \\|= 0x80 (`0x7ddec..0x7de18`) -> `0x168f20` returns 0 at once (`tst #0xc0`): the partner exclusion is skipped. Her M78 (1:0x23 `0xf8fbd4`) arms 0x2b through `0x7ded8` (flags 0: excluded; shape set 1 = her tail / pincer capsules, joints 143 / 144 / 160 / 161) | uEm069_00 / shared | R + E | spec §21 |",
"| `0x98e14..0x98ff0` / `0x990cc..0x990ec` (the damage step `0x97d20`) | **THE SELTAS-ONLY KILL**: with no reaction lock (`P+0x3a2 / 3a3 / 3a4` 0) and `0x817c0`: a pending hit (`P+0x444`) of kind 0x0a (`P+0x484`) on a unit frozen by his 1:0x21 (`P+0x3a8` bit 0x80, `0x9cd6c(e, 0x80)` at `0xfc9a08`), in posture 0 / 2 -- or posture 1 (air) when `e+0xb5f4` == 0x4c (Seltas) and `e+0xb5f7` == 0 -- sets HP `P+0x370` = max `P+0x374` x `P+0x380` (-1.0, the spawn default `0xb9708`, no class overrides it: clamped to 0) and the reaction `P+0x3ae` = 0xf, and asks (11, 8). EMULATED (`duo/emu_kill.py`): HP 0, reaction 15, (11, 8) requested; locked (`P+0x3a2` 2): nothing; controls kind 2, unfrozen, em 0x45: a flinch (reaction 4, (10, 0x25)), HP kept | shared | R + E | spec §21 |",
"| `0xfc9960..0xfc99d0` (his 1:0x21 every frame) | `0xc0354` sets the reaction lock `P+0x3a2` = 2 each frame; when her motion is `0x44f` (L4 M79) or `0x497` and her frame >= 80.0 (`0xb0968`, literal `0xfc9aac`), `0xc0368` clears it: the kill lands at her M79 frame 80. The pending hit is reset only by `0x1721a0` (the pair pass's start) when the enemy's flag bit 0x40000000 is set (INFERRED: set when a hit is processed -- the locked path writes nothing, emulated) | uEm076_00 / shared | R / I | spec §21 |",
"| his (11, 8) death script `0x17e7350` (`efx/agents/cephadrome-scratch/scr.py`) | op 0x30 (P+0x54c \\|= 0x800, P+0x5bd = 1), op 0x37 3, op 0x34 (0, 0, 0) x size (no move), P+0x57c = 0, op 4 posture air, **L4 M77 b0** wait 2 (the record's +0x14 = 0x212f130, a runtime object: the landing NOT READ), op 0x31, op 4 posture 0, **L4 M78 b0** wait 1, end 0xff. The airborne fall rate NOT READ (the viewer drops him at his 1:0x22's rate as a stand-in) | uEm076_00 | R (script) / NR (fall) | spec §21 |",
]
s = s[:i] + nl.join(rows) + nl + s[i:]
# tooling
a = "| `<scratchpad>\\duo\\emu_freeze.py`"
i = s.index(a)
tools = [
"| `<scratchpad>\\duo\\arm23.py` (duo agent, 2026-10-22) | tracer.py run of her 1:0x1c / 1:0x21..0x24, every phase x link x scenario, recording the hit-record arming calls `0x7db70` / `0x7ded8` with (index, hitId, flags) | the 0x2b arming (her M78) the earlier read named is reproduced | the flag word passed to `0x7ded8` is its own r3 = 0 (printed r3 is the caller's) |",
"| `<scratchpad>\\duo\\emu_kill.py` | the damage step `0x97d20` native on unicorn (unmapped reads zero-filled) with a pending hit of a given kind on a unit with given freeze / posture / em / lock | controls: kind 2, no freeze flag, em 0x45 give the flinch (10, 0x25), HP kept | the run ends in a stubbed vtable call after the decisive writes; HP damage of the flinch is 0 here (no damage numbers set) |",
]
s = s[:i] + nl.join(tools) + nl + s[i:]
# withdrawn table
w = s.index("### Withdrawn — kept so they are not rediscovered")
t = s.index("|---|---|---|", w); t = s.index(nl, t)
wrows = [
"| duo rows / spec §8, §15, §17, §19, §20 (Seltas duo agent, 2026-10-17..18): \"he is not dead -- no kill code\"; \"her records cannot hit the male while he is linked\" (`0x168f20`); \"her class writes nothing into him: nothing of hers damages or kills him in M76..M79\"; \"he stays frozen on her back ~844 frames, then drops (1:0x22)\" as THE outcome | the exclusion has an early out for hit objects flagged 0xc0 at +0x30 (`0x168f20`: `tst #0xc0; popne r0 = 0`), and her M79's own arming passes flag 0x400 (-> 0x80); the write census stubbed the shared hit system, the path the kill takes; the damage step has a Seltas-only branch (`0x990cc`: em 0x4c in the air) | her M79 (1:0x24) arms record 0x23 (kind 0xa, sphere r200 on joint 200, past the exclusion); his 1:0x21 holds the reaction lock to her M79 frame 80; then HP 0 (max x -1.0, clamped) and his death (11, 8): unlinked, L4 M77 falling, L4 M78 lying; she then eats him (g1 s46, selector 4). The 1:0x22 drop is the path only when that hit does not land (spec §21) |",
]
s = s[:t] + nl + nl.join(wrows) + s[t:]
open(p, 'w', encoding='utf-8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
old = "## 10. Not read" + nl
new = """## 21. HER M79 KILLS HIM -- what was missed (2026-10-22; Raven, for the third time: "Seltas when doing the grab animation stops animating, enters static pose then is placed back onto the queen's body once she is done")

**WITHDRAWN**: §8 / §15 / §17 / §19 / §20's "he is not dead", "her records cannot hit him while linked", "nothing of hers kills
him", and "he rides her back frozen ~844 frames, then drops" as the outcome (rom-map Withdrawn table).

* **What was missed**: the partner exclusion `0x168f20` has an early out -- a hit object whose `+0x30` has bit 0x40 / 0x80 is
  never excluded -- and her M79 arms exactly such a hit: her 1:0x24 at its start (`0xf8fc8c`) calls `0x7db70(e, 0, 0x23, 0x400)`
  (`duo/arm23.py`), and flag 0x400 becomes `+0x30` bit 0x80 (`0x7de08`). Record 0x23 (em069_00_attackdata) is kind 0x0a, and its
  shape set (byte 0x19 = 18, em069_00_hitsize.hts) is ONE sphere of radius 200 on JOINT 200 -- the joint he rides. The write
  census of §20 stubbed shared code, which is where this goes.
* **The kill** (the damage step `0x97d20`, `0x98e14..0x98ff0` and `0x990cc`): a pending hit of kind 0x0a on a unit frozen by his
  1:0x21 (`P+0x3a8` bit 0x80, set at `0xfc9a08`) -- in the air only for em 0x4c, Seltas -- sets his HP to max x `P+0x380` (-1.0,
  the spawn default; no class sets it: 0) and asks (11, 8). Emulated (`duo/emu_kill.py`): HP 0, reaction 0xf, (11, 8);
  controls (kind 2 = her M78's 0x2b, not frozen, em 0x45) give an ordinary flinch.
* **When**: his 1:0x21 sets the reaction lock `P+0x3a2` = 2 every frame and clears it only when her motion is L4 M79 and her
  frame >= 80 (`0xfc9980..0xfc99d0`, literal 80.0); locked, the damage step does nothing (emulated) and the hit stays pending
  (INFERRED: it is reset only by `0x1721a0` on a processed flag). So **he dies at her M79 frame 80**.
* **His death** (11, 8), script `0x17e7350`: posture air, L4 M77 b0 (start, loop) until the ground, posture 0, L4 M78 b0 (start,
  loop): he lies dead. Status 11 clears his link bit (`0xfc5eac`) and the action start unlinks (`0xfc4894`): her joint 200 no
  longer carries him -- **he is not put back on her body**. The fall rate of the airborne death is not read (the viewer uses his
  1:0x22's -10 / -1 per frame as a stand-in).
* **Then she eats him**: her g1 s46 after the grab: selector 4 (`0xf89d48`: he is dead -- status 11 -- and in her area) -> walk
  (2:0x15 / 2:0x16, L0 M8 b12) -> 1:0x1c, L0 M16 b4.
* **Unchanged by this**: the freeze's timing (§17: he struggles, M79 loop at speed 1, through her M77, frozen from her M78) and
  its mechanics (§20, emulated: both layers' speed 0). So Raven's "stops animating, enters static pose" is the ROM during her M78
  and M79 to frame 80; "placed back onto the queen's body" was the viewer's error -- he dies and drops at her M79 frame 80. The
  1:0x22 drop entry stays as the path when that hit does not land (e.g. he is out of the sphere).
* **In the viewer**: render/monster.js pairs `'4|Motion[79]'` `death: { at: 80 }`, `dismounts.death`, the joined `S.
  Motion[76]-[79]` now with `deathAt` (her M79 piece, frame 80) and her eat (L0 M16 start + loop, b4) after M79 (her walk to him
  not shown: her steering is not read); index.html `partnerClipOf` death pick (linked pre-part from the pairs, then the
  unlinked death), `dismountPlan` / `unlFrameAt` (the kill frame), `releaseMatOf(a, at)`, the glow off once dead. Check: on her
  M79 entry and the joined entry -- linked and frozen to frame 79, dead at 80 with M77, falling in world space away from joint
  200, lying (M78) on her ground, her L0 M16 after.

## 10. Not read
"""
assert s.count(old) == 1
s = s.replace(old, new)
open(p, 'w', encoding='utf-8', newline='').write(s)

B = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(B, 'rb').read().decode('utf-8', 'surrogateescape')
anchor = "      - **STATIC AUDIT + M78 / M79 2026-10-18**"
assert b.count(anchor) == 1
b = b.replace(anchor, "      - **HER M79 KILLS HIM 2026-10-22** (Raven, third time; his correction stood). MISSED: her M79 arms record 0x23 (kind 0xa,\n        sphere r200 on joint 200) with flag 0x400, which skips the partner exclusion; the damage step's Seltas-only branch kills a\n        frozen Seltas (HP = max x -1.0 -> 0, (11, 8)) once his lock clears at her M79 frame 80 (emulated, controls). He dies, falls\n        (L4 M77), lies (L4 M78); she eats him (L0 M16). Built on her M79 entry and the joined grab. Old rows withdrawn. Spec §21.\n      - [ ] (read) his airborne death's fall rate (script 0x17e7350 wait mode 2, +0x14 runtime object) -- stand-in: his 1:0x22 rate.\n" + anchor)
open(B, 'wb').write(b.encode('utf-8', 'surrogateescape'))
print('ok')
