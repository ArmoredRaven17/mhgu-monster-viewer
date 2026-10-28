## 5a. The shells: the slime pools, the explosions, the lines and the eruption (shells lane, 2026-10-25; <archive>\gapQ\RESULT.md)

Built in render/shells.js (SHELL_DATA em063_00 / em063_05; the code under "Brachydios / Raging"); rom-map "Brachydios / Raging -- the
shells". Every value below is READ (the consuming instruction read), except where marked.

* **Three shells per class** (vt+0x158 0xf35108): Brachydios 0x110 **sp_01** (base01: the explosions, reader 0xf4815c), 0x111 **sp_11**
  (base11: the slime line and the scatter), 0x112 **sp_35** (a NEW base, base35 0x175169c: **the slime pool**); Raging the same as
  0x113 / 0x114 / 0x115. Raging's EffectList is index 1 (em063_05u; index 0 null).
* **The pool** (sp_35, base35): a timer (float 0: **300 frames Brachydios, 150 Raging**), one ef from its init to its end (u 0 / 10
  Brachydios; u 100 / 10 / 110 Raging), then at timer-out an sp_01 at its spot (int 1: Brachydios mode 6 u 1 / mode 7 u 11; Raging 6
  u 1 / 7 u 11 / **21 u 111**). **No warning stage in the shell**: nothing else starts before the explosion (a flash inside the pool's own
  .efl is not read).
* **The fists** (0xf458ec, probe 0xf454e0: joint 40 left / 50 right, a ray down to the ground within +-300): a calm fist leaves a pool
  (sp_35 0); an **enraged Brachydios** fist explodes at once (sp_01 3, u 50); a Depleted arm (level 0) makes nothing. **Raging**: a Red
  slot's fist explodes at once (sp_01 14, u 50), a Yellow slot's leaves a pool -- with Red Slime off sp_35 0 (u 100), with the slot spent
  under Red Slime sp_35 4 (u 110) and its explosion sp_01 21 (u 111). The two-fist slam L2 M3 (0xf3b7e8): two pools, or sp_01 4 (u 40) /
  5 (u 41) with one arm Depleted; Raging sp_01 17 (u 130) / 18 (u 131).
* **The sites**: L2 M28 / M29 f72; L2 M11 / M13 f26 (an instant explosion); L2 M54 f72; L2 M5 / M8 f6 (the turn punches); L2 M3 f8 / 34
  (f30 for (7, 0xb2)); L2 M42 f125 the slime line (sp_11 1 -> eight sp_01 1, u 30) and f90 the big pool (sp_35 1 550 ahead, u 10 -> sp_01
  7 u 11); L2 M41 f190 the scatter (sp_11 0 -> twelve sp_01 0, u 31) and f124 the big pool 400 ahead; the frame handler 0xf3552c on L2 M22
  (f114 / 152 / 180); the status-3 walks L0 M52 / 54 / 57..63.
* **The eruption** (Raging, 0xf46234): on the fuse's burn-out, sp_01 modes 23..38 AT A JOINT (head 3, left arm 40, right arm 50, tail
  143; the file's int 4 = 0), u 210: head 0x17 / 0x18, left arm 0x19 / 0x1a, right arm 0x1b / 0x1c, tail 0x1d / 0x1e (calm / enraged);
  the broken head / arms 0x1f.. / 0x21.. / 0x23.., the severed tail 0x25 / 0x26. A slot not Red at the burn-out makes none.
* **The viewer's inputs** (index.html shellExtra): `arm063` [left, right] (monster.js armSlimeLevels; Brachydios only), `breaks063`
  (motion-states.js brachyBreaks063: a part whose broken set is drawn is at level 2 -- the part pass's own test against the same .dtp
  threshold, 2 everywhere), `slime063` / `erupt063` (the effects lane's slime timer: Red while Red Slime is on and the slot not spent;
  the burn-out slots with a sequence number), `tailSevered`. The shells take each `erupt063` sequence once, and a burned-out slot as Red
  for its own explosion (the timer has already marked it spent; the ROM turns it Yellow the next tick) -- rom-map trap 146.
* **Exported** `when: shell`: em063_00u 0 / 1 / 10 / 11 / 30 / 31 / 40 / 41 / 50 / 51; em063_05u 1 / 10 / 11 / 30 / 31 / 40 / 41 / 50 /
  100 / 110 / 111 / 130 / 131 / 210. Not exported: em063_05u 21 (no such record; only the unmade sp_01 mode 8 names it).
* **No maker** (negative, control: the 8 submit sites): sp_01 modes 2, 8, 10..13, 15, 16, 19, 20, 22.
* **Check**: `node dev/shells-brachydios-check.mjs` (stepShells on a stand-in pose: the modes, timers and keys above).
METERLINE
