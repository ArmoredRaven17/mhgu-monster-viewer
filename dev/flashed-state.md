# The Flashed state -- the flash, the blindness timer P+0x59c, and c 1103 (2026-10-25)

Asked by the coordinator for Raven (2026-10-26: "we could add it to all monsters since it is a state like Poison that persists between
animations"). Every address below is in dev/rom-map.md section "Flashed" (and its two Withdrawn rows); the tools are in
`dev/archive/flashed/` (rom-map "2. Tooling"). The engine-level summary, written for 3U / 4U / FU, is dev/effect-runtime-engine.md E28.

## 1. What a flash is in the ROM

- **A flash does not hit the monster.** Three shell classes register a SOURCE in the enemy manager's table of 8 slots at G+0x28f8
  (24 bytes each: point, radius, a float, the area byte, a state byte -- 2 free, 0 new, 1 live) through `0x5bacc`:
  uShellPlcom_000 (`0x47caf0`), uShellOt001 (`0x441a8c`), uShellPlw04_000 (`0x46e840`). By their class names a hunter's common shell,
  a Palico's and a weapon's -- that these are the Flash Bomb / the Palico flash / a weapon flash is INFERRED from the names only.
- **The monster looks for it.** Its sense scan `0xc3088`, after the hunter and companion loops, runs the flash test
  `0xc3934..0xc3bc4`. Gates, in order: P+0x24a bit 1; `0x99c58(e, 4)` -- P+0x3a8 bit 2; P+0x5a4 <= 0; no Chameleos area timer in his
  area (`0x5c1a8`); e+0x7420 (the unit's owner); posture 4 (burrowed) only with P+0x3a8 bit 3; not in (10, 0xa1..0xa6 / 0xbd / 0xbe /
  0xc1 / 0xc2) (`0x810d4`). Then each live source in his area: horizontal distance <= its radius, its height within the sense
  record's band (+0x10 above, +0x14 below the eye), and its direction within the record's **flash cone** -- the u16 half-angles at
  record **+0x1c (yaw) / +0x1e (pitch)** (100 / 80 degrees on most monsters; a narrower sight cone sits at +0x18 / +0x1a).
- **A hit.** Already blind (P+0x59c > 0): nothing. e+0xba47 & 0x26: P+0x59c = 0 (a transient flag word set by 33 shared-layer sites,
  meaning not read). Otherwise `0xa1a88(e, 1)` and `0x82cd0(e, 0x18, 0)`, which restarts his command table into group 8 -- the flash
  reaction (animation: held).

## 2. The timer

`0xa1a88`: P+0x59c = the s16 of the dttune's flash row -- `[[dttune obj+0x64]+0x58]` is a block of four row pointers, and row **1**
is this one -- picked **calm / enraged (or `0x816b8` == 1) / tired**; a null block or row gives **1800.0**. Then minus **300 x P+0x5a1**
(the flashes so far; +1 per flash, held at 3), and never below **300**. Counted down 1.0 a frame (`0xc9080`); zeroed at death
(`0x75be4`) and by the resets. The game's frames are 1/60 s here (the timer and the viewer's step are both per game frame).

Per monster (census.py -> shared-states.js FLASH_BLIND, [calm, enraged, tired] frames): the Rath line 1080 / 1080 / 1800 (Gold and
Silver 1500 / 1500 / 2100), most 1200 / 1200 / 1800, the Garugas 1800 flat, Akantor / Ukanlos 60 (-> the 300 floor), Alatreon 450,
Amatsu 480, Kushala 900, Chameleos tired 0 (-> 300), Ahtal-Ka 0 / 0 / 0 (-> 300), Valstrax null (-> 1800). Measured under unicorn
(`flashemu.py`): Rathian 1080, tired 1800, second flash 780, fourth 300.

## 3. Which monsters can be flashed

**The data decides first: dtbase obj +0x6c bit 2** (copied to P+0x3a8 by `0x9cd50` at the base init). Read out of every monster's own
dtbase with the game's own loader (`0x53800` under tune_emu): **24 of 130 have it clear -- immune**:

| immune (bit 2 clear) | flags word |
|---|---|
| Khezu | 0x400062 |
| Gypceros | 0x400022 |
| Kirin | 0x2 |
| Lao-Shan Lung | 0x40402 |
| Fatalis, Crimson Fatalis, Old Fatalis | 0x400402 |
| Cephadrome | 0x8000072 |
| Daimyo, Stonefist | 0x400072 |
| Shogun, Rustrazor | 0x72 |
| Lavasioth | 0x400072 |
| Nibelsnarf | 0x42 |
| Gore Magala | 0x8400062 |
| Soulseer Mizutsune | 0x400062 |
| Nakarkos | 0x412 |
| Ahtal-Neset | 0x50402 |
| small: Cephalos, Great Thunderbug, Remobra, Hermitaur, Ceanataur, Konchu | |

**And one by its class: Chaotic Gore Magala.** Its dtbase has bit 2 and its tune a row (1200 / 1200 / 1800), but uEm071_00's
action-start hook (vt+0x204 `0xfadfa0`) writes P+0x24a = 1 for em 0x47 -- Gore and Chaotic both -- after changeAction has written 3
(`0x76748`), so the test's first gate (P+0x24a bit 1) never passes. Nothing in his band sets it back.

**Positive control** (flashemu.py, the same harness, the real code from `0xc3934` to the scan's exit with the real `0xa1a88` on each
monster's loaded dttune): Rathian is blinded (1080); Fatalis with bit 2 forced ON is blinded (1800 -- his row 1 is null); Rathian with
bit 2 forced OFF is not; Chaotic with P+0x24a = 3 is blinded (1200), with the class's 1 is not. Also refused: a source in another area,
behind the eye, already blind, e+0xba47 = 0x20, posture 4 without bit 3 (Uroktor, bit 3 set: blinded in posture 4).

**Per state, on flashable monsters only** (classes that flip bit 2 or P+0x24a while running -- they decide when a flash can START,
not whether a blindness already running continues): Plesioth (enraged: off; calm: on land on, underwater off), Nargacuga (off in
(10, 0x4c)), Royal Ludroth (P+0x24a 1 / 3 by action), Rajang / Deviljho (variant 3 only), Alatreon, Amatsu, Najarala, Seregios,
Malfestio, Astalos, Ahtal-Ka, Larinoth (sites in rom-map; most conditions not read). No class turns bit 2 on for a data-immune
monster. Chameleos's area timer (his cloak, 5400 frames) blocks every flash in his area while it runs.

**The Fatalis line is immune.** So `0xa3ef0`'s three arms are all closed for him -- no stun case (dev/em013-effects-spec.md 5), P+0x5cde
small monsters only, no flash -- and his c 1103 is a ROM reason, not a Flashed record (rom-map Withdrawn row; dev/archive/cen/cenreport.py
OPEN_REASON_FLASH, "ROM REASON TO BRING").

## 4. What a blinded monster shows (short of animation)

- **c 1103, one held request.** `0xa3ef0` (vt+0x28, after the action main) requests id 3 = **c 1103** (the base c table `0x159c798`
  [3]; ids below 1000 go to the shared table on every class) ONCE into the handle e+0xb62c while P+0x59c > 0, or the stun bit P+0x5e08
  bit 4, or P+0x5cde == 1; `0x6f124` stops it when none holds. It is the **stun's own handle**: a stun ending while he is blind keeps
  the stars, and a blindness ending during a stun keeps them too. Every flashable large monster's c.pel has the record (cm200_003);
  the small monsters have no effects export in the viewer.
- **Nothing else that draws.** The whole-text #0x59c scan (134 hits; its control: it lists `0xa3f3c`, the known c 1103 site) finds no
  PSL enable word, material, part-set or hit-zone reader. The other readers are behaviour: the sense scan skips the hunter test
  (`0xc362c`) and the forced transition refuses the notice (`0x7ea24`), the command start picks group 8 (`0x827e0`), two command-op
  conditions, the save / sync record; class code -- Rathian / Seregios cut it to 1.0 on a call (caller not read), the dromes and
  Great Maccao wait on it in an action, Velociprey looks at an ally's, Ahtal-Ka zeroes it.
- **No eye overlay, no material.** None reads it.

## 5. What the viewer builds

- **"Flashed"** -- `#monFlashed` in the shared-state row, beside Poisoned and Dung Bombed (index.html). Offered where
  shared-states.js FLASH_BLIND lists the monster AND its runtime holds the c 1103 record (so: the 75 flashable large monsters with
  effects; the 19 immune ones with effects and the 30 flashable small monsters -- no effects export -- have no switch). A new
  monster starts with it off; turning Effects off clears it (the row hides), as it clears Poisoned.
- **stepFlashed**: on -> schedule.holdEvent(c.pel, 1103, true), held across every clip until it is switched off. A stun row's
  holdOff is skipped while flashed (one handle); switching off during a stun clip leaves the stun's. A `dead` row stops it (the timer
  is zeroed at death) and the next play brings it back while the switch is on.
- **The notice** (stepNotice): while flashed the sense scan sees no one and 0x7f010 may not fire, so no "!" -- and the "?" comes when
  the memory runs out, as in the game.
- **Not built**: the flash reactions (command group 8: the flinch, the fall from the air, the blinded wander) -- animation, held.
- **Differs from the game, by request**: the switch holds the state until it is turned off; the game would end it after the
  monster's own time (flashFrames, shown by `window.__flashed.now()`).
- Labels for Raven: **"Flashed"** (the switch). No options.

## 6. Meter (flashmeter.mjs, the draw meter on the switch)

Each monster: List 0's second clip looping, Flashed on for 90 frames, the clip changed to the third (the state must persist: ONE
start), 90 frames, off, 20 frames -- c 1103's starts, draw frames, lit samples and verdict; the request must be stopped after the off.
Immune monsters: the switch must be hidden; the record is then held by force (FORCED: a meter-only path the ROM never takes).

## 7. Results (2026-10-25, headless Edge on my own server; `<archive>\flashed\meter_summary.txt`)

**94 monsters with effects, 94 PASS.**

- **The 75 flashable** (the switch offered, every one): c 1103 **1 start** each, over two clips (the state persists -- never
  restarted), and **draws** -- lit on every sample it was sampled (39 / 39; 74 / 74 on Chameleos, Hellblade, Astalos, Boltreaver,
  whose page sampled faster), stopped after the switch went off (0 live). Rathian, Gold, Dreadqueen, Rathalos, Silver, Dreadking,
  Basarios, Gravios, Diablos, Bloodbath, Kut-Ku, Plesioth, Velocidrome, Gendrome, Iodrome, Garuga, Deadeye, Congalala, Blangonga,
  Rajang, Furious Rajang, Kushala, Chameleos, Teostra, Bulldrome, Tigrex, Grimclaw, Akantor, Giadrome, Nargacuga, Silverwind,
  Ukanlos, Barioth, Deviljho, Savage, Barroth, Uragaan, Crystalbeard, Lagiacrus, Royal Ludroth, Agnaktor, Alatreon, Duramboros,
  Zinogre, Thunderlord, Amatsu, Arzuros, Redhelm, Lagombi, Snowbaron, Volvidon, Brachydios, Raging, Kecha Wacha, Tetsucabra,
  Drilltusk, Zamtrios, Najarala, Seltas Queen, Nerscylla, Shagaru, Seltas, Seregios, Malfestio, Nightcloak, Glavenus, Hellblade,
  Astalos, Boltreaver, Mizutsune, Gammoth, Elderfrost, Great Maccao, Valstrax, Ahtal-Ka.
- **The 16 immune with the record** (the switch hidden on every one): Khezu, Gypceros, Kirin, Fatalis, Crimson, Old Fatalis,
  Cephadrome, Daimyo, Stonefist, Shogun, Rustrazor, Lavasioth, Nibelsnarf, Gore Magala, Chaotic Gore Magala, Soulseer. Held by
  force (FORCED, the ROM never takes this path): c 1103 1 start, draws (Nibelsnarf 21 / 21, the rest 39 / 39). **The Fatalis line's
  c 1103 draws when held -- but the game never holds it** (section 3).
- **3 immune without the record** (no switch, nothing to meter): Lao-Shan Lung, Nakarkos, Ahtal-Neset.
- **The 30 flashable small monsters**: no effects export, no runtime -- not metered; no switch.

The interplay check `<archive>\flashed\flashstun.mjs` (Rathian), 4 / 4 PASS: (A) Flashed on through L0 M1 -> L3 M5 (the stun hold)
-> L0 M1: one request all along; (B) switched off during L3 M5: the stun row keeps it, the next clip stops it; (C) a death row (L3
M17) stops it and the next play holds it again; (D) with Flashed on and the hunter brought into view no c 1200 fires, and once it
is off c 1200 fires (the control: he was in view).

The census merge: `<scratchpad>\pq\flashed.out` (mkpq.py; the FORCED rows left out) carries the 75 flashable monsters' c 1103 as
`draws` under "Flashed" into cen/cenreport.py. The Fatalis line's c 1103 is filed there as OPEN with its ROM reason
(OPEN_REASON_FLASH, "ROM REASON TO BRING") -- not under the Flashed state, because the ROM cannot flash him.
