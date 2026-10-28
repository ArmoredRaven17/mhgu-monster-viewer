# Shell draw table -- every shell record of every monster with SHELL_DATA (shells agent, 2026-10-20)

For every record in `docs/effects/<mon>.json` with `when: 'shell'` (973 of them, on 88 monsters), what the effects agent's
draw meter (`__view.effectMeter`) measured when the page played every clip that makes its shells:
- **starts**: how often it started;
- **lit**: lit samples / samples;
- **verdict**.

A record that never started has a named reason.

## Totals

| verdict | records |
|---|---|
| DRAWS | 874 |
| ROM GIVES NOTHING | 40 |
| NO WALL / HUNTER | 40 |
| ROM CONDITION | 15 |
| INPUT MISSING | 4 |
| **all** | **973** |

## How it was measured

- **The plays** (`<archive>\fb\smfull.mjs`):
  - every clip of the monster whose shells start a record in a node replay of `stepShells`, over every pick of that clip;
  - Tigrex's / Grimclaw's four grounds;
  - every beam row's clip with its partner clips, in a rage pass where the row asks for rage.
- **The meter** (`shellmeter.mjs`):
  - plays every menu entry of each clip (its copies, and both halves of a split clip);
  - lets a clip wrap through its picks, because a wrap is a new play;
  - runs with the clip loop on, through the shared two-slot soak lock.
- **The state sweep** (records still unstarted): every option of each state control the page shows for that monster, the
  plays again each time. The controls: State, the class controls, Carrying, Stance, Boulder, Level, the class toggles, and the
  Quest Rank (High / Low).
- **Rounds 3 to 7** (2026-10-20 / 21): the plays the node replay could not plan -- the play's action (Zinogre's picks), rage in the
  picks, the Snow Variants list, the Charge rung, the Rockets and Wind Aura controls, Quest Level 0, the tentacle forms (the
  attached rows), the Parts rows, chained plays on one shell state, a _loop's wraps -- and the makers built for this table.
- The best measurement of each record across all runs is kept (`classify.py`, `drawtable.json`).

## Built and fixed for this table (shells agent and its decode helpers, 2026-10-20)

- FIXED index.html unitGamePos: the unit stood still through a pass (the travel is the `reference` node's) -- Mizutsune's / Soulseer's trail.
- FIXED slam060: an attributed Ground is refused by name (the stage number is not an input) instead of the plain dust.
- FIXED params11n: sp_11's init starts nothing (base11 starts only +0x15c8 / +0x15cc) -- Nakarkos u_r 10 no longer started at it.
- FIXED Kushala sp_01 startEf2 (its ef 1 is an init start).
- FIXED (2026-10-21) stepShells: a fresh motion first seen at frame 1 / 2 starts its history at 0 (Thunderlord u 180, Chaotic u 90 / 91).
- FIXED (2026-10-21) Kecha Wacha's hang height (motion-states.js AIR_HEIGHT em065_00 `hang`, READ 0xf51fc4): his drop starts above the floor (u 12).
- WIRED (2026-10-21) Nakarkos input.parts084 from the Parts rows (the part pass 0x106b2d0, READ).
- BUILT (2026-10-22) the shells' HUNTER CONTACT (type 2: the hit manager's slot-0 latch, 0x16acf0 -> 0x16b6cc -> 0x43ac8c, READ gapM): shells.js hunterPass + collide's hunter arm, the shapes in shell-hitshapes.js; the hunter's capsule 0x2821e4 on a stand-in standing pose (its in-quest pose NOT READ). Met through the effects agent's Hunter control (Body: Solid).
- LISTED (2026-10-22) Ahtal-Neset's (10, 0x8e) drops: the reaction fires at HP 65% (P+0x380 0.65 at spawn, dtbase bit 16; READ gapL). Congalala's last charges through the effects agent's Charges control (gas021Last).
- BUILT (2026-10-21) Neset's lifts (1, 0x15) / (1, 8): Ahtal-Ka's sp_57 24 / 25 (u 320 / 70; 0x10ac10c READ).
- The meter (2026-10-21): a split clip played as _start then _loop pairs (the pick advances only on the _start); a child made 300 frames on needs the window.
- BUILT Kirin's status-2 strikes; Old Fatalis (7, 0x49) and the storm (sp_01 9); Nargacuga / Silverwind 0xe47b0c; the Nakarkos rank pair,
  sp_11 2's fall and the record table's 65 / 66; Valstrax (7, 0x33) and (3, 4); Ahtal-Ka's anchors' sub-states 2 / 3; Soulseer's base12
  deferred init; Kushala's frame handler (the pulse, sp_01 0..4 / 9 / 10 / 12 / 13); Gammoth's / Elderfrost's leg snow.

## The verdicts

- **DRAWS**: it lights pixels. A record the meter found drawing off its camera, lit when aimed at, also counts.
- **NO WALL / HUNTER**: its only trigger is a contact the viewer cannot give.
- **ROM GIVES NOTHING**: it starts, but the ROM builds nothing to draw (a row mask), or the ROM never starts it.
- **ROM CONDITION**: the ROM refuses it under the viewer's real inputs, for example 900+ above the floor while he flies.
- **INPUT STAND-IN**: the viewer's stand-in for a game input keeps it from starting.
- **INPUT MISSING**: it needs a game input the viewer has no control for.
- **NOT EXPORTED**: built, but the monster whose page plays it carries no such record in its effects export.
- **NOT BUILT**: its maker is read but not transcribed.
- **UNREAD**: a gate on its path is not read yet (named).

## Per monster

### em001_00 (Rathian)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 0 | 17 | 236/501 | DRAWS |  |
| c 1 | 13 | 126/290 | DRAWS |  |
| c 2 | 9 | 100/112 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| c 3 | 15 | 631/1206 | DRAWS |  |
| c 30 | 24 | 288/341 | DRAWS |  |
| c 31 | 6 | 74/88 | DRAWS |  |
| u 30 | 2 | 2/6 | DRAWS |  |
| u 31 | 2 | 18/24 | DRAWS |  |
| u 32 | 9 | 240/252 | DRAWS |  |
| u 33 | 2 | 18/24 | DRAWS |  |
| u 34 | 2 | 18/22 | DRAWS |  |
| u 36 | 9 | 99/110 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 61 | 4 | 26/40 | DRAWS |  |
| u 62 | 2 | 35/42 | DRAWS |  |

### em001_02 (Gold Rathian)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 0 | 17 | 238/498 | DRAWS |  |
| c 1 | 13 | 126/287 | DRAWS |  |
| c 2 | 9 | 100/112 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| c 3 | 26 | 1504/2091 | DRAWS |  |
| c 30 | 30 | 358/424 | DRAWS |  |
| c 31 | 6 | 73/88 | DRAWS |  |
| u 30 | 13 | 37/58 | DRAWS |  |
| u 31 | 13 | 117/152 | DRAWS |  |
| u 32 | 13 | 347/364 | DRAWS |  |
| u 33 | 13 | 117/154 | DRAWS |  |
| u 34 | 13 | 117/149 | DRAWS |  |
| u 36 | 9 | 99/110 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 60 | 8 | 52/80 | DRAWS |  |
| u 61 | 14 | 90/133 | DRAWS |  |
| u 62 | 10 | 176/211 | DRAWS |  |

### em001_04 (Dreadqueen Rathian)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 0 | 17 | 272/521 | DRAWS |  |
| c 1 | 13 | 126/289 | DRAWS |  |
| c 2 | 9 | 99/111 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| c 3 | 26 | 1506/2094 | DRAWS |  |
| c 30 | 24 | 288/342 | DRAWS |  |
| c 31 | 12 | 147/172 | DRAWS |  |
| u 30 | 13 | 42/62 | DRAWS |  |
| u 31 | 13 | 117/150 | DRAWS |  |
| u 32 | 13 | 345/364 | DRAWS |  |
| u 33 | 13 | 117/151 | DRAWS |  |
| u 34 | 13 | 117/154 | DRAWS |  |
| u 40 | 6 | 741/749 | DRAWS |  |
| u 41 | 7 | 908/918 | DRAWS |  |
| u 42 | 69 | 9307/9403 | DRAWS |  |
| u 60 | 30 | 205/300 | DRAWS |  |
| u 61 | 19 | 125/193 | DRAWS |  |
| u 62 | 8 | 141/168 | DRAWS |  |
| u 70 | 1 | 23/25 | DRAWS |  |

### em002_00 (Rathalos)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 0 | 34 | 322/476 | DRAWS |  |
| c 1 | 32 | 507/696 | DRAWS |  |
| c 2 | 9 | 100/112 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| c 3 | 32 | 0/2477 | DRAWS | off the meter's camera, lit when aimed at |
| c 30 | 24 | 290/342 | DRAWS |  |
| c 31 | 63 | 755/895 | DRAWS |  |
| u 60 | 6 | 104/126 | DRAWS |  |

### em002_02 (Silver Rathalos)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 0 | 32 | 300/437 | DRAWS |  |
| c 1 | 31 | 507/685 | DRAWS |  |
| c 2 | 9 | 99/111 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| c 3 | 35 | 0/2765 | DRAWS | off the meter's camera, lit when aimed at |
| c 30 | 24 | 290/342 | DRAWS |  |
| c 31 | 65 | 786/924 | DRAWS |  |
| u 30 | 8 | 41/68 | DRAWS |  |
| u 31 | 6 | 36/71 | DRAWS |  |
| u 32 | 8 | 160/224 | DRAWS |  |
| u 33 | 6 | 36/69 | DRAWS |  |
| u 34 | 6 | 36/70 | DRAWS |  |
| u 36 | 4 | 22/50 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 60 | 8 | 54/80 | DRAWS |  |
| u 62 | 4 | 70/84 | DRAWS |  |

### em002_04 (Dreadking Rathalos)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 0 | 22 | 168/271 | DRAWS |  |
| c 1 | 21 | 413/459 | DRAWS |  |
| c 2 | 12 | 106/144 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| c 3 | 33 | 760/2544 | DRAWS |  |
| c 20 | 8 | 88/104 | DRAWS |  |
| c 30 | 24 | 286/341 | DRAWS |  |
| c 31 | 65 | 778/926 | DRAWS |  |
| u 10 | 5 | 89/95 | DRAWS |  |
| u 11 | 4 | 175/184 | DRAWS |  |
| u 12 | 5 | 80/112 | DRAWS |  |
| u 13 | 1 | 101/102 | DRAWS |  |
| u 20 | 19 | 260/412 | DRAWS |  |
| u 21 | 4 | 0/100 | DRAWS | off the meter's camera, lit when aimed at |
| u 22 | 9 | 99/110 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 23 | 1 | 18/39 | DRAWS |  |
| u 25 | 5 | 454/462 | DRAWS |  |
| u 31 | 50 | 221/612 | DRAWS |  |
| u 32 | 41 | 217/500 | DRAWS |  |
| u 33 | 41 | 178/504 | DRAWS |  |
| u 34 | 41 | 638/1023 | DRAWS |  |
| u 36 | 3 | 24/37 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 60 | 34 | 225/340 | DRAWS |  |
| u 61 | 4 | 27/41 | DRAWS |  |
| u 62 | 24 | 420/505 | DRAWS |  |
| u 200 | 4 | 29/34 | DRAWS |  |
| u 201 | 2 | 45/50 | DRAWS |  |
| u 202 | 6 | 128/136 | DRAWS |  |
| u 203 | 2 | 211/214 | DRAWS |  |
| u 204 | 2 | 96/105 | DRAWS |  |
| u 205 | 2 | 45/50 | DRAWS |  |
| u 206 | 4 | 365/369 | DRAWS |  |

### em003_00 (Khezu)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 2 | 24/28 | DRAWS |  |
| c 31 | 46 | 559/632 | DRAWS |  |
| u 0 | 13 | 256/494 | DRAWS |  |
| u 30 | 2 | 34/38 | DRAWS |  |
| u 31 | 8 | 66/77 | DRAWS |  |
| u 32 | 6 | 106/114 | DRAWS |  |
| u 60 | 1 | 8/10 | DRAWS |  |
| u 61 | 1 | 20/28 | DRAWS |  |
| u 90 | 12 | 113/130 | DRAWS |  |
| u 92 | 12 | 219/254 | DRAWS |  |
| u 93 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 120 | 2 | 82/84 | DRAWS |  |

### em004_00 (Basarios)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 0 | 10 | 124/144 | DRAWS |  |
| u 130 | 8 | 212/220 | DRAWS |  |
| u 160 | 14 | 167/215 | DRAWS |  |
| u 161 | 13 | 264/299 | DRAWS |  |
| u 162 | - | - | NO WALL / HUNTER | his landing 0xd3066c (READ; shells.js landing04): type 0 -> ef 2, type 2 -> ef 1, both u 162; the floor (type 1) starts no ef and makes shell01 u 161; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |

### em005_00 (Gravios)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 0 | 10 | 122/144 | DRAWS |  |
| u 130 | 35 | 1952/1987 | DRAWS |  |
| u 131 | 2 | 37/39 | DRAWS |  |
| u 150 | 5 | 239/278 | DRAWS |  |

### em007_00 (Diablos)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 0 | 5 | 62/73 | DRAWS |  |
| c 1 | 5 | 61/71 | DRAWS |  |
| c 2 | 5 | 54/64 | DRAWS |  |

### em007_04 (Bloodbath Diablos)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 0 | 5 | 61/71 | DRAWS |  |
| c 1 | 5 | 61/71 | DRAWS |  |
| c 2 | 6 | 74/87 | DRAWS |  |
| u 0 | 72 | 1911/2011 | DRAWS |  |
| u 1 | 72 | 1540/1756 | DRAWS |  |
| u 10 | 6 | 161/170 | DRAWS |  |
| u 11 | 6 | 129/147 | DRAWS |  |
| u 100 | 1 | 73/74 | DRAWS |  |
| u 120 | 2 | 104/106 | DRAWS |  |
| u 300 | 4 | 173/241 | DRAWS |  |

### em008_00 (Yian Kut-Ku)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 6 | 71/84 | DRAWS |  |
| c 31 | 37 | 434/505 | DRAWS |  |
| u 0 | 48 | 505/562 | DRAWS |  |
| u 1 | 48 | 677/742 | DRAWS |  |
| u 2 | - | - | NO WALL / HUNTER | the Solid hunter is met in the NODE replay (synthetic joints within ~100 of the unit, the shells launched at the origin) but not on the page at any of the Hunter control's points (front 0 / 500 / 1200, left / right 500 / 1200, behind 0 / 500): the page's real launch joints put the shells on other paths -- measured on em008 L2 M1: the fan shots pass at x -566 / +604 by z 1360 while the hunter stands near x 0, z 550. Not timing or pass order: hunterPass runs after the slot countdown on the page as in node |

### em009_00 (Gypceros)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 28 | 340/400 | DRAWS |  |
| c 31 | 1 | 33/35 | DRAWS |  |
| u 0 | 44 | 793/2029 | DRAWS |  |
| u 1 | 29 | 585/644 | DRAWS |  |
| u 2 | - | - | NO WALL / HUNTER | the Solid hunter is met in the NODE replay (synthetic joints within ~100 of the unit, the shells launched at the origin) but not on the page at any of the Hunter control's points (front 0 / 500 / 1200, left / right 500 / 1200, behind 0 / 500): the page's real launch joints put the shells on other paths -- measured on em008 L2 M1: the fan shots pass at x -566 / +604 by z 1360 while the hunter stands near x 0, z 550. Not timing or pass order: hunterPass runs after the slot countdown on the page as in node |
| u 3 | 7 | 260/367 | DRAWS |  |
| u 4 | 3 | 310/421 | DRAWS |  |
| u 10 | 28 | 675/712 | DRAWS |  |
| u 20 | 28 | 403/3212 | DRAWS |  |

### em010_00 (Plesioth)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 2 | 70/76 | DRAWS |  |
| u 1 | 2 | 20/36 | DRAWS |  |
| u 10 | 2 | 72/76 | DRAWS |  |
| u 20 | 12 | 265/277 | DRAWS |  |
| u 21 | 14 | 312/466 | DRAWS |  |
| u 30 | 7 | 209/216 | DRAWS |  |

### em011_00 (Kirin)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 30 | 76 | 1135/1314 | DRAWS |  |
| u 31 | 380 | 6162/8959 | DRAWS |  |
| u 90 | 3 | 60/90 | DRAWS |  |

### em012_00 (Lao-Shan Lung)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 10 | 150 | 2350/7333 | DRAWS |  |
| u 20 | 150 | 3945/4497 | DRAWS |  |

### em013_00 (Fatalis)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 21 | 287/325 | DRAWS |  |
| u 0 | 21 | 424/503 | DRAWS |  |
| u 1 | 18 | 408/456 | DRAWS |  |
| u 2 | - | - | NO WALL / HUNTER | the Solid hunter is met in the NODE replay (synthetic joints within ~100 of the unit, the shells launched at the origin) but not on the page at any of the Hunter control's points (front 0 / 500 / 1200, left / right 500 / 1200, behind 0 / 500): the page's real launch joints put the shells on other paths -- measured on em008 L2 M1: the fan shots pass at x -566 / +604 by z 1360 while the hunter stands near x 0, z 550. Not timing or pass order: hunterPass runs after the slot countdown on the page as in node |
| u 11 | 7 | 392/402 | DRAWS |  |
| u 20 | 12 | 1104/1116 | DRAWS |  |
| u 30 | 4 | 68/80 | DRAWS |  |
| u 31 | 4 | 167/178 | DRAWS |  |

### em013_01 (Crimson Fatalis)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 14 | 190/220 | DRAWS |  |
| u 0 | 9 | 518/672 | DRAWS |  |
| u 1 | 11 | 263/290 | DRAWS |  |
| u 2 | 9 | 228/249 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 11 | 1 | 55/57 | DRAWS |  |
| u 20 | 12 | 1103/1115 | DRAWS |  |
| u 30 | 2 | 34/40 | DRAWS |  |
| u 31 | 2 | 84/89 | DRAWS |  |
| u 100 | 43 | 499/988 | DRAWS |  |
| u 101 | 43 | 2020/2074 | DRAWS |  |
| u 103 | 43 | 789/988 | DRAWS |  |
| u 130 | 2 | 179/185 | DRAWS |  |

### em013_02 (Old Fatalis)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 12 | 162/191 | DRAWS |  |
| u 0 | 12 | 116/174 | DRAWS |  |
| u 1 | 11 | 368/383 | DRAWS |  |
| u 2 | - | - | NO WALL / HUNTER | sp_01 6 only from sp_00 0's type-0 (wall) landing 0xd8d08c; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 11 | 3 | 129/142 | DRAWS |  |
| u 12 | 3 | 142/153 | DRAWS |  |
| u 13 | 3 | 14/18 | DRAWS |  |
| u 30 | 2 | 41/46 | DRAWS |  |
| u 31 | 2 | 58/68 | DRAWS |  |
| u 32 | 2 | 42/47 | DRAWS |  |
| u 33 | 2 | 59/68 | DRAWS |  |
| u 100 | 39 | 195/251 | DRAWS |  |
| u 103 | 39 | 856/912 | DRAWS |  |
| u 110 | 79 | 0/496 | DRAWS | off the meter's camera, lit when aimed at |
| u 111 | 82 | 0/1891 | DRAWS | off the meter's camera, lit when aimed at |
| u 200 | 1 | 8/9 | DRAWS |  |
| u 201 | 1 | 35/38 | DRAWS |  |

### em016_00 (Iodrome)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 19 | 101/125 | DRAWS |  |
| u 30 | 3 | 47/54 | DRAWS |  |
| u 50 | 1 | 16/18 | DRAWS |  |
| u 60 | 3 | 131/173 | DRAWS |  |
| u 80 | 1 | 80/85 | DRAWS |  |
| u 90 | 10 | 148/167 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 110 | 9 | 143/162 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |

### em017_00 (Cephadrome)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 25 | 251/294 | DRAWS |  |
| u 1 | 24 | 603/862 | DRAWS |  |

### em018_00 (Yian Garuga)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 10 | 194/592 | DRAWS |  |
| u 1 | 9 | 189/202 | DRAWS |  |
| u 2 | 10 | 106/119 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 3 | 9 | 446/667 | DRAWS |  |

### em018_04 (Deadeye Yian Garuga)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 16 | 207/560 | DRAWS |  |
| u 1 | 12 | 253/270 | DRAWS |  |
| u 2 | 10 | 106/120 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 3 | 12 | 654/890 | DRAWS |  |
| u 60 | 6 | 87/94 | DRAWS |  |
| u 61 | 3 | 65/73 | DRAWS |  |
| u 110 | 4 | 146/167 | DRAWS |  |

### em019_00 (Daimyo Hermitaur)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | - | - | ROM GIVES NOTHING | Stonefist's sp_01 0 ((7, 0xf2) on the L9 motions) through the shared em019_00c list; Daimyo has no L9 motion |
| u 0 | 4 | 280/286 | DRAWS |  |
| u 10 | 8 | 514/523 | DRAWS |  |

### em019_04 (Stonefist Hermitaur)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 2 | 24/29 | DRAWS |  |
| u 0 | 8 | 554/563 | DRAWS |  |

### em020_00 (Shogun Ceanataur)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 60 | 4 | 235/239 | DRAWS |  |
| u 70 | 4 | 235/240 | DRAWS |  |

### em020_04 (Rustrazor Ceanataur)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 31 | 2 | 24/28 | DRAWS |  |
| u 60 | 30 | 721/751 | DRAWS |  |
| u 70 | 30 | 709/758 | DRAWS |  |
| u 100 | 6 | 215/224 | DRAWS |  |
| u 110 | 25 | 947/984 | DRAWS |  |

### em021_00 (Congalala)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 32 | 1745/1934 | DRAWS |  |
| u 100 | 42 | 1967/2167 | DRAWS |  |
| u 130 | 1 | 59/64 | DRAWS |  |
| u 140 | 1 | 61/64 | DRAWS |  |
| u 150 | 1 | 61/64 | DRAWS |  |
| u 160 | 1 | 60/64 | DRAWS |  |
| u 200 | 10 | 62/75 | DRAWS |  |
| u 210 | 6 | 118/143 | DRAWS |  |
| u 220 | 4 | 80/95 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 300 | 2 | 93/97 | DRAWS |  |
| u 310 | 2 | 95/97 | DRAWS |  |
| u 320 | 2 | 95/97 | DRAWS |  |
| u 330 | 2 | 93/97 | DRAWS |  |

### em022_00 (Blangonga)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 1 | 49/50 | DRAWS |  |
| u 10 | 4 | 164/168 | DRAWS |  |
| u 30 | 6 | 101/127 | DRAWS |  |
| u 31 | 18 | 134/213 | DRAWS |  |
| u 32 | 5 | 112/163 | DRAWS |  |
| u 33 | 12 | 305/324 | DRAWS |  |
| u 40 | 6 | 90/112 | DRAWS |  |
| u 41 | 5 | 70/92 | DRAWS |  |
| u 42 | 15 | 277/360 | DRAWS |  |
| u 43 | 18 | 327/429 | DRAWS |  |

### em023_00 (Rajang)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 200 | 16 | 1095/1111 | DRAWS |  |
| u 230 | 17 | 172/4802 | DRAWS |  |
| u 231 | 5 | 171/178 | DRAWS |  |
| u 232 | 1 | 14/16 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 260 | 1 | 295/297 | DRAWS |  |
| u 261 | 2 | 415/417 | DRAWS |  |
| u 262 | 2 | 671/675 | DRAWS |  |
| u 263 | 1 | 29/30 | DRAWS |  |
| u 264 | 2 | 44/48 | DRAWS |  |
| u 265 | 2 | 43/48 | DRAWS |  |
| u 266 | 1 | 81/82 | DRAWS |  |
| u 267 | 1 | 22/24 | DRAWS |  |

### em023_05 (Furious Rajang)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 200 | 16 | 1095/1111 | DRAWS |  |
| u 210 | 6 | 618/624 | DRAWS |  |
| u 230 | 17 | 175/4798 | DRAWS |  |
| u 231 | 5 | 170/177 | DRAWS |  |
| u 232 | 1 | 15/16 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 260 | 1 | 296/297 | DRAWS |  |
| u 261 | 2 | 413/417 | DRAWS |  |
| u 262 | 2 | 672/674 | DRAWS |  |
| u 263 | 1 | 27/29 | DRAWS |  |
| u 264 | 2 | 44/48 | DRAWS |  |
| u 265 | 2 | 42/48 | DRAWS |  |
| u 266 | 1 | 81/82 | DRAWS |  |
| u 267 | 1 | 22/24 | DRAWS |  |

### em024_00 (Kushala Daora)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 29 | 29 | 350/412 | DRAWS |  |
| c 30 | 41 | 493/586 | DRAWS |  |
| c 31 | 41 | 495/586 | DRAWS |  |
| c 32 | 6 | 73/86 | DRAWS |  |
| c 33 | - | - | ROM CONDITION | a camera-attached record (payload mode 4, MASK1 2) whose core range test 0x328d9c measures from the hunter (+0x58 600..1200): the viewer's hunter stand-in is 2100 ahead -- out of range; with the hunter at him it starts and draws (the effects agent, 2026-10-21) |
| c 34 | - | - | ROM CONDITION | a camera-attached record (payload mode 4, MASK1 2) whose core range test 0x328d9c measures from the hunter (+0x58 600..1200): the viewer's hunter stand-in is 2100 ahead -- out of range; with the hunter at him it starts and draws (the effects agent, 2026-10-21) |
| c 35 | - | - | ROM CONDITION | a camera-attached record (payload mode 4, MASK1 2) whose core range test 0x328d9c measures from the hunter (+0x58 600..1200): the viewer's hunter stand-in is 2100 ahead -- out of range; with the hunter at him it starts and draws (the effects agent, 2026-10-21) |
| u 60 | 52 | 9934/10003 | DRAWS |  |
| u 61 | 6 | 138/277 | DRAWS |  |
| u 62 | 8 | 106/118 | DRAWS |  |
| u 63 | 183 | 5557/5804 | DRAWS |  |
| u 70 | 6 | 834/846 | DRAWS |  |
| u 71 | 5 | 110/146 | DRAWS |  |
| u 72 | 8 | 117/130 | DRAWS |  |
| u 73 | 6 | 423/430 | DRAWS |  |
| u 80 | 2 | 24/28 | DRAWS |  |
| u 120 | 3 | 39/45 | DRAWS |  |
| u 121 | 5 | 78/103 | DRAWS |  |
| u 130 | 2 | 26/30 | DRAWS |  |
| u 131 | 1 | 19/20 | DRAWS |  |
| u 150 | 7 | 952/985 | DRAWS |  |
| u 151 | 4 | 143/302 | DRAWS |  |
| u 160 | 3 | 748/761 | DRAWS |  |
| u 161 | 3 | 829/832 | DRAWS |  |
| u 162 | 2 | 343/347 | DRAWS |  |

### em025_00 (Chameleos)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 5 | 60/71 | DRAWS |  |
| c 31 | 9 | 108/128 | DRAWS |  |
| u 0 | 10 | 117/149 | DRAWS |  |
| u 1 | - | - | ROM GIVES NOTHING | INFERRED on a flat stage: (7, 0x1f) 0xe0b70c keeps him grounded (posture 0, P+0x44 = P+0x5b4) and its L2 M45 f70 gob starts at joint 3 + (0, -80, 140), 458 x size BELOW that ground (the neck dips 297 under his feet); base00's segment query cannot meet a floor it starts under (gapP). The viewer's floor there now IS the unit (FLOOR_AT_UNIT_CLIPS); a lower stage level is the only way it lands |
| u 2 | - | - | NO WALL / HUNTER | ef 1 / ef 3 of sp_00 / sp_13: the type-0 / type-2 contacts; the floor landing starts ef 2 (sp_13's is (999, -1)); the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 3 | 7 | 2616/2734 | DRAWS |  |
| u 4 | 2 | 815/840 | DRAWS |  |
| u 11 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |

### em027_00 (Teostra)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | - | - | ROM GIVES NOTHING | (4, 0x06) 0xe16edc phase 1 tests f70 (0x428c0000) on L1 M7, whose game motion is 61 frames, held at 60 (0x7256c: e+0x13bc = e+0x504); the ended bit moves him to L1 M15 that update -- f70 never passes (READ gapI; the Gore line's L1 M13 f90 likewise) |
| c 31 | 14 | 170/201 | DRAWS |  |
| c 34 | - | - | ROM CONDITION | a camera-attached record (payload mode 4, MASK1 2) whose core range test 0x328d9c measures from the hunter (+0x58 600..1200): the viewer's hunter stand-in is 2100 ahead -- out of range; with the hunter at him it starts and draws (the effects agent, 2026-10-21) |
| u 30 | 8 | 412/428 | DRAWS |  |
| u 40 | 2 | 11/17 | DRAWS |  |
| u 50 | 12 | 36193/36209 | DRAWS |  |
| u 60 | 4 | 127/136 | DRAWS |  |
| u 70 | 8 | 571/589 | DRAWS |  |
| u 90 | 40 | 2660/2700 | DRAWS |  |
| u 100 | 8 | 1089/1097 | DRAWS |  |
| u 110 | 24 | 400/432 | DRAWS |  |
| u 111 | 11 | 242/257 | DRAWS |  |
| u 150 | 224 | 1162/1806 | DRAWS |  |
| u 151 | 224 | 1162/1806 | DRAWS |  |
| u 152 | - | - | ROM CONDITION | a leader's end makes sp_01 0 only when the owner's next action is (7, 0x2d) / (7, 0x2e) (0x6fe88): L2 M10 then L4 M10 in one run |

### em032_00 (Tigrex)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 32 | 28 | 338/401 | DRAWS |  |
| u 0 | 3 | 66/89 | DRAWS |  |
| u 1 | 3 | 67/90 | DRAWS |  |
| u 3 | 3 | 67/89 | DRAWS |  |
| u 30 | 3 | 0/72 | DRAWS | off the meter's camera, lit when aimed at |
| u 31 | 3 | 0/71 | DRAWS | off the meter's camera, lit when aimed at |
| u 33 | 3 | 28/133 | DRAWS |  |

### em032_04 (Grimclaw Tigrex)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 9 | 227/247 | DRAWS |  |
| u 1 | 9 | 227/247 | DRAWS |  |
| u 3 | 9 | 229/246 | DRAWS |  |
| u 30 | 9 | 351/400 | DRAWS |  |
| u 31 | 9 | 171/211 | DRAWS |  |
| u 33 | 9 | 365/404 | DRAWS |  |
| u 70 | 48 | 1000/1064 | DRAWS |  |
| u 71 | 48 | 1721/1944 | DRAWS |  |
| u 72 | 24 | 500/532 | DRAWS |  |
| u 73 | 24 | 534/620 | DRAWS |  |
| u 74 | 8 | 107/126 | DRAWS |  |
| u 75 | 8 | 180/208 | DRAWS |  |
| u 76 | 8 | 0/136 | ROM GIVES NOTHING | live, no draw |
| u 77 | 8 | 177/208 | DRAWS |  |
| u 78 | 8 | 0/136 | ROM GIVES NOTHING | live, no draw |
| u 79 | 8 | 227/258 | DRAWS |  |
| u 80 | 2 | 32/35 | DRAWS |  |
| u 81 | 2 | 21/23 | DRAWS |  |
| u 83 | 2 | 32/35 | DRAWS |  |
| u 90 | 2 | 43/47 | DRAWS |  |
| u 91 | 1 | 22/24 | DRAWS |  |
| u 93 | 2 | 44/48 | DRAWS |  |
| u 100 | 2 | 49/51 | DRAWS |  |
| u 101 | 1 | 24/25 | DRAWS |  |
| u 103 | 2 | 50/52 | DRAWS |  |
| u 110 | 1 | 65/66 | DRAWS |  |
| u 111 | 1 | 45/46 | DRAWS |  |
| u 113 | 1 | 65/66 | DRAWS |  |
| u 122 | 24 | 546/617 | DRAWS |  |
| u 123 | 24 | 350/415 | DRAWS |  |
| u 124 | 24 | 560/617 | DRAWS |  |
| u 125 | 24 | 352/415 | DRAWS |  |

### em033_00 (Akantor)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 10 | 2 | 60/65 | DRAWS |  |
| u 30 | 16 | 1073/1089 | DRAWS |  |
| u 31 | 3 | 110/114 | DRAWS |  |
| u 40 | 6 | 252/262 | DRAWS |  |

### em034_00 (Giadrome)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 10 | 4 | 52/57 | DRAWS |  |
| u 20 | 9 | 201/216 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 30 | 4 | 90/96 | DRAWS |  |
| u 50 | 4 | 267/303 | DRAWS |  |

### em036_00 (Lavasioth)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 9 | 168/184 | DRAWS |  |
| u 1 | 9 | 102/142 | DRAWS |  |
| u 2 | 9 | 119/137 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 3 | 27 | 207/573 | DRAWS |  |
| u 4 | 27 | 63/675 | DRAWS |  |
| u 30 | 53 | 1461/1499 | DRAWS |  |
| u 31 | 20 | 274/306 | DRAWS |  |
| u 32 | - | - | NO WALL / HUNTER | the Solid hunter is met in the NODE replay (synthetic joints within ~100 of the unit, the shells launched at the origin) but not on the page at any of the Hunter control's points (front 0 / 500 / 1200, left / right 500 / 1200, behind 0 / 500): the page's real launch joints put the shells on other paths -- measured on em008 L2 M1: the fan shots pass at x -566 / +604 by z 1360 while the hunter stands near x 0, z 550. Not timing or pass order: hunterPass runs after the slot countdown on the page as in node |
| u 33 | 32 | 526/590 | DRAWS |  |
| u 90 | 27 | 3492/8880 | DRAWS |  |
| u 91 | 12 | 107/289 | DRAWS |  |
| u 100 | 27 | 354/396 | DRAWS |  |
| u 101 | 27 | 262/407 | DRAWS |  |
| u 102 | 9 | 120/138 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |

### em037_00 (Nargacuga)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 6 | 68/81 | DRAWS |  |
| u 0 | 62 | 673/847 | DRAWS |  |
| u 1 | 57 | 1612/2103 | DRAWS |  |
| u 2 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 3 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |

### em037_04 (Silverwind Nargacuga)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 6 | 68/81 | DRAWS |  |
| u 0 | 171 | 1616/3086 | DRAWS |  |
| u 1 | 142 | 4204/5252 | DRAWS |  |
| u 2 | - | - | NO WALL / HUNTER | ef 1 of sp_00 (base00): the type-0 (wall) contact; the floor landing starts ef 2 (measured); the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 3 | 3 | 40/48 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 4 | 142 | 3956/5276 | DRAWS |  |
| u 10 | 8 | 290/490 | DRAWS |  |
| u 11 | 8 | 289/489 | DRAWS |  |
| u 12 | 40 | 1415/1499 | DRAWS |  |
| u 20 | 1 | 36/42 | DRAWS |  |
| u 21 | 1 | 37/42 | DRAWS |  |
| u 23 | 5 | 105/112 | DRAWS |  |
| u 30 | 2 | 46/99 | DRAWS |  |
| u 31 | 2 | 34/37 | DRAWS |  |

### em038_00 (Ukanlos)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 162 | 1621/3731 | DRAWS |  |
| u 1 | 45 | 532/810 | DRAWS |  |
| u 10 | 207 | 5078/5416 | DRAWS |  |
| u 30 | 9 | 467/477 | DRAWS |  |
| u 40 | 48 | 642/702 | DRAWS |  |
| u 90 | 4 | 283/287 | DRAWS |  |
| u 92 | 84 | 1365/1484 | DRAWS |  |

### em042_00 (Barioth)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 10 | 10 | 39/50 | DRAWS |  |
| u 20 | - | - | NO WALL / HUNTER | the Solid hunter is met in the NODE replay (synthetic joints within ~100 of the unit, the shells launched at the origin) but not on the page at any of the Hunter control's points (front 0 / 500 / 1200, left / right 500 / 1200, behind 0 / 500): the page's real launch joints put the shells on other paths -- measured on em008 L2 M1: the fan shots pass at x -566 / +604 by z 1360 while the hunter stands near x 0, z 550. Not timing or pass order: hunterPass runs after the slot countdown on the page as in node |
| u 21 | 10 | 255/290 | DRAWS |  |
| u 30 | 10 | 383/460 | DRAWS |  |

### em043_00 (Deviljho)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 12 | 367/421 | DRAWS |  |
| u 10 | 12 | 253/289 | DRAWS |  |
| u 20 | 8 | 129/140 | DRAWS |  |
| u 30 | - | - | ROM GIVES NOTHING | sp_54 4 comes only from (7, 0x7e..0x81), which no command-table stream issues (board; every issued action reaching 0xe78e34 passes r2 0) |
| u 40 | - | - | ROM GIVES NOTHING | sp_54 4: (7, 0x7e..0x81) issued by no stream |
| u 50 | - | - | ROM GIVES NOTHING | sp_54 4: (7, 0x7e..0x81) issued by no stream |
| u 60 | 4 | 164/168 | DRAWS |  |

### em043_05 (Savage Deviljho)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 6 | 183/210 | DRAWS |  |
| u 10 | 6 | 128/145 | DRAWS |  |
| u 20 | 4 | 65/71 | DRAWS |  |
| u 40 | - | - | ROM GIVES NOTHING | Deviljho's command table: (7, 0x7e..0x81) issued by no stream |
| u 50 | - | - | ROM GIVES NOTHING | as u 40 |
| u 60 | 2 | 80/82 | DRAWS |  |
| u 70 | 10 | 237/247 | DRAWS |  |
| u 100 | - | - | ROM GIVES NOTHING | as u 40 |

### em044_00 (Barroth)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 10 | 104 | 1766/1903 | DRAWS |  |
| u 11 | 1 | 13/14 | DRAWS |  |
| u 20 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 21 | 1 | 22/25 | DRAWS |  |
| u 30 | 104 | 1341/1563 | DRAWS |  |

### em045_00 (Uragaan)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 30 | 1 | 22/24 | DRAWS |  |
| u 50 | 1 | 17/18 | DRAWS |  |
| u 200 | 2 | 51/63 | DRAWS |  |

### em045_04 (Crystalbeard Uragaan)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 30 | 36 | 15772/15820 | DRAWS |  |
| u 32 | 84 | 1350/1494 | DRAWS |  |
| u 33 | - | - | ROM GIVES NOTHING | sp_32 ef 2 (+0x15d0) has no read in base32, the class methods or their callees; the controls +0x15c8 / +0x15cc found by the same scan (rom-map 3154 (e)) |
| u 34 | 43 | 1229/1388 | DRAWS |  |
| u 40 | 4 | 3399/3405 | DRAWS |  |
| u 50 | 1 | 18/19 | DRAWS |  |
| u 60 | 9 | 170/185 | DRAWS |  |
| u 61 | 5 | 107/122 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 62 | 4 | 85/97 | DRAWS |  |
| u 80 | 9 | 426/438 | DRAWS |  |
| u 200 | 3 | 104/113 | DRAWS |  |
| u 230 | 2 | 1001/1004 | DRAWS |  |

### em046_00 (Lagiacrus)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 21 | 242/271 | DRAWS |  |
| u 1 | 48 | 2125/2210 | DRAWS |  |
| u 2 | 16 | 357/379 | DRAWS |  |
| u 3 | 5 | 55/64 | DRAWS |  |
| u 4 | 9 | 63/74 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 10 | 2 | 9/12 | DRAWS |  |
| u 11 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 60 | 8 | 224/232 | DRAWS |  |
| u 61 | 2 | 457/472 | DRAWS |  |
| u 70 | 1 | 28/29 | DRAWS |  |
| u 80 | 12 | 177/189 | DRAWS |  |
| u 81 | 2 | 29/32 | DRAWS |  |
| u 82 | 6 | 87/96 | DRAWS |  |
| u 90 | 4 | 188/192 | DRAWS |  |
| u 91 | 4 | 40/44 | DRAWS |  |
| u 120 | 5 | 1062/1067 | DRAWS |  |
| u 301 | 2 | 36/39 | DRAWS |  |
| u 311 | 2 | 27/30 | DRAWS |  |

### em047_00 (Royal Ludroth)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 13 | 94/112 | DRAWS |  |
| u 1 | 13 | 148/182 | DRAWS |  |
| u 2 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 30 | 12 | 111/129 | DRAWS |  |
| u 31 | 12 | 173/203 | DRAWS |  |
| u 32 | 11 | 1230/1254 | DRAWS |  |
| u 34 | 10 | 144/172 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |

### em049_00 (Agnaktor)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 12 | 1061/1073 | DRAWS |  |
| u 2 | 18 | 296/606 | DRAWS |  |
| u 100 | 12 | 365/389 | DRAWS |  |
| u 101 | 5 | 125/134 | DRAWS |  |

### em050_00 (Alatreon)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 25 | 100/100 | DRAWS |  |
| u 1 | 50 | 1371/1828 | DRAWS |  |
| u 2 | - | - | NO WALL / HUNTER | the Solid hunter is met in the NODE replay (synthetic joints within ~100 of the unit, the shells launched at the origin) but not on the page at any of the Hunter control's points (front 0 / 500 / 1200, left / right 500 / 1200, behind 0 / 500): the page's real launch joints put the shells on other paths -- measured on em008 L2 M1: the fan shots pass at x -566 / +604 by z 1360 while the hunter stands near x 0, z 550. Not timing or pass order: hunterPass runs after the slot countdown on the page as in node |
| u 30 | 15 | 5100/5115 | DRAWS |  |
| u 31 | 120 | 6711/6867 | DRAWS |  |
| u 90 | 5 | 120/127 | DRAWS |  |
| u 91 | 5 | 162/168 | DRAWS |  |
| u 122 | 6 | 118/124 | DRAWS |  |
| u 150 | 60 | 1761/2021 | DRAWS |  |
| u 180 | 44 | 9973/21048 | DRAWS |  |
| u 182 | 15 | 836/854 | DRAWS |  |
| u 183 | 33 | 2088/2685 | DRAWS |  |
| u 184 | 22 | 151/273 | DRAWS |  |
| u 185 | 11 | 112/153 | DRAWS |  |
| u 210 | 35 | 322/738 | DRAWS |  |
| u 211 | 35 | 429/985 | DRAWS |  |
| u 212 | 35 | 557/938 | DRAWS |  |
| u 214 | 15 | 339/384 | DRAWS |  |
| u 215 | 15 | 1221/1242 | DRAWS |  |

### em056_00 (Nibelsnarf)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 5 | 571/588 | DRAWS |  |
| u 1 | 6 | 517/525 | DRAWS |  |

### em057_00 (Zinogre)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 16 | 464/2112 | DRAWS |  |
| u 1 | 2 | 0/21 | DRAWS | off the meter's camera, lit when aimed at |
| u 60 | 256 | 4436/4781 | DRAWS |  |
| u 61 | 256 | 3585/3930 | DRAWS |  |
| u 150 | 2 | 36/38 | DRAWS |  |

### em057_04 (Thunderlord Zinogre)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 24 | 419/465 | DRAWS |  |
| u 1 | 24 | 144/247 | DRAWS |  |
| u 2 | 24 | 1711/2612 | DRAWS |  |
| u 10 | 48 | 686/774 | DRAWS |  |
| u 11 | 45 | 271/463 | DRAWS |  |
| u 12 | 45 | 3215/4900 | DRAWS |  |
| u 60 | 144 | 2490/2686 | DRAWS |  |
| u 61 | 144 | 2009/2215 | DRAWS |  |
| u 70 | 144 | 2084/3168 | DRAWS |  |
| u 71 | 144 | 1451/2208 | DRAWS |  |
| u 150 | 24 | 496/528 | DRAWS |  |
| u 160 | 9 | 183/195 | DRAWS |  |
| u 170 | 16 | 448/469 | DRAWS |  |
| u 171 | 16 | 438/459 | DRAWS |  |
| u 180 | 7 | 87/106 | DRAWS |  |
| u 210 | 8 | 275/314 | DRAWS |  |
| u 220 | 32 | 1096/1252 | DRAWS |  |

### em058_00 (Amatsu)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 10 | 3 | 647/666 | DRAWS |  |
| u 20 | 2 | 189/190 | DRAWS |  |
| u 22 | 2 | 179/191 | DRAWS |  |
| u 30 | 1 | 27/28 | DRAWS |  |
| u 31 | 1 | 30/34 | DRAWS |  |
| u 40 | 6 | 212/218 | DRAWS |  |
| u 41 | 6 | 218/227 | DRAWS |  |
| u 50 | 6 | 118/124 | DRAWS |  |
| u 51 | 78 | 2139/2270 | DRAWS |  |

### em060_04 (Redhelm Arzuros)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | - | - | INPUT MISSING | the slam's 2 / 5: the ground cast's attribute (& 6) AND the stage number 0x17 / 6 / 4 by the area byte (0xf189d8): no stage input (now refused by name on an attributed Ground) |
| u 10 | - | - | INPUT MISSING | the slam's 3 / 6: the same attribute and stage gate |
| u 20 | 1 | 41/42 | DRAWS |  |
| u 30 | 1 | 26/71 | DRAWS |  |
| u 40 | - | - | ROM CONDITION | INFERRED: the (7, 0xf5) lump flies with no gravity, aimed at the target; it meets no floor in its 450 frames, so its floor ef 2 needs a target below the launch |
| u 50 | 9 | 194/219 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |

### em061_00 (Lagombi)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 16 | 284/304 | DRAWS |  |
| u 1 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 2 | 16 | 356/384 | DRAWS |  |
| u 10 | 6 | 108/117 | DRAWS |  |
| u 11 | 6 | 126/135 | DRAWS |  |
| u 12 | 6 | 44/143 | DRAWS |  |
| u 13 | 6 | 425/666 | DRAWS |  |

### em061_04 (Snowbaron Lagombi)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 24 | 454/489 | DRAWS |  |
| u 1 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 2 | 24 | 526/576 | DRAWS |  |
| u 10 | 10 | 577/687 | DRAWS |  |
| u 11 | 4 | 93/103 | DRAWS |  |
| u 12 | 6 | 46/154 | DRAWS |  |
| u 14 | 6 | 591/600 | DRAWS |  |
| u 15 | 2 | 44/48 | DRAWS |  |
| u 16 | 6 | 137/153 | DRAWS |  |
| u 17 | 6 | 147/162 | DRAWS |  |
| u 20 | 3 | 66/71 | DRAWS |  |
| u 40 | 16 | 799/843 | DRAWS |  |
| u 50 | 14 | 906/1018 | DRAWS |  |
| u 51 | 14 | 294/335 | DRAWS |  |
| u 60 | 13 | 244/252 | DRAWS |  |

### em062_00 (Volvidon)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 10 | 107/121 | DRAWS |  |
| u 1 | 7 | 121/163 | DRAWS |  |
| u 2 | 3 | 67/71 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |

### em063_00 (Brachydios)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 129 | 12538/12937 | DRAWS |  |
| u 1 | 127 | 1691/1933 | DRAWS |  |
| u 10 | 4 | 402/407 | DRAWS |  |
| u 11 | 4 | 145/169 | DRAWS |  |
| u 30 | 48 | 719/768 | DRAWS |  |
| u 31 | 12 | 264/276 | DRAWS |  |
| u 40 | 15 | 187/232 | DRAWS |  |
| u 41 | 5 | 64/79 | DRAWS |  |
| u 50 | 38 | 466/575 | DRAWS |  |
| u 51 | - | - | ROM GIVES NOTHING | sp_01 mode 8 names it and no maker makes mode 8 (gapQ: the 8 submit sites + 2 shell sites read, the control; 0xf458ec kind 3 passed by none of its 23 callers) |

### em063_05 (Raging Brachydios)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 1 | 80 | 1109/1218 | DRAWS |  |
| u 10 | 4 | 203/208 | DRAWS |  |
| u 11 | 4 | 144/168 | DRAWS |  |
| u 30 | 40 | 600/640 | DRAWS |  |
| u 31 | 12 | 252/264 | DRAWS |  |
| u 40 | 8 | 101/125 | DRAWS |  |
| u 41 | - | - | INPUT MISSING | sp_01 mode 5 (0xf3b7e8: one arm Red with rage 0x81670 off); the viewer shows a Red slot only as Red Slime, his rage (the effects lane slime063, Raven 2026-09-16), so a Red arm with rage off cannot be set -- whether the game reaches it (the per-slot 2700-frame ladder) is not read |
| u 50 | 65 | 800/989 | DRAWS |  |
| u 100 | 82 | 4026/4135 | DRAWS |  |
| u 110 | 8 | 401/412 | DRAWS |  |
| u 111 | 8 | 112/122 | DRAWS |  |
| u 130 | 10 | 130/160 | DRAWS |  |
| u 131 | 2 | 23/27 | DRAWS |  |
| u 210 | 4 | 56/60 | DRAWS |  |

### em065_00 (Kecha Wacha)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 31 | 3 | 37/43 | DRAWS |  |
| u 0 | 18 | 285/400 | DRAWS |  |
| u 1 | 15 | 279/350 | DRAWS |  |
| u 2 | 5 | 68/86 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 10 | 2 | 19/212 | DRAWS |  |
| u 11 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 12 | 2 | 230/234 | DRAWS |  |

### em066_00 (Tetsucabra)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 12 | 168/191 | DRAWS |  |
| u 1 | 12 | 180/204 | DRAWS |  |
| u 2 | - | - | NO WALL / HUNTER | ef 1 of sp_13 (base13): the type-0 (wall) contact; the floor landing starts ef 2 (measured); the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 20 | 23 | 64/506 | DRAWS |  |
| u 21 | 8 | 105/180 | DRAWS |  |
| u 22 | 23 | 0/560 | DRAWS | off the meter's camera, lit when aimed at |
| u 23 | 8 | 0/192 | DRAWS | off the meter's camera, lit when aimed at |
| u 24 | - | - | NO WALL / HUNTER | its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 25 | - | - | NO WALL / HUNTER | the snow rocks' ef 1 / ef 3 (types 0 / 2); their floor ef is u 23; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 30 | 21 | 2834/3022 | DRAWS |  |
| u 31 | 6 | 681/737 | DRAWS |  |
| u 32 | 3 | 0/473 | DRAWS | off the meter's camera, lit when aimed at |
| u 33 | 6 | 681/737 | DRAWS |  |
| u 40 | 18 | 1316/1527 | DRAWS |  |
| u 41 | 3 | 208/234 | DRAWS |  |
| u 42 | 3 | 0/267 | DRAWS | off the meter's camera, lit when aimed at |
| u 43 | 3 | 222/234 | DRAWS |  |
| u 100 | - | - | NO WALL / HUNTER | sp_16 ef 2 (+0x15d0) is started only by +0x98 0xf65ac8 at a hunter's hit; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 101 | - | - | NO WALL / HUNTER | sp_16 0's ef 2: a hunter's hit only (0xf65ac8); the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 110 | - | - | NO WALL / HUNTER | sp_16 3's ef 2: a hunter's hit only; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 111 | - | - | NO WALL / HUNTER | sp_16 1's ef 2: a hunter's hit only; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |

### em066_04 (Drilltusk Tetsucabra)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 2 | 29/32 | DRAWS |  |
| u 1 | 2 | 30/34 | DRAWS |  |
| u 2 | - | - | NO WALL / HUNTER | ef 1 of sp_13 (base13): the type-0 (wall) contact; the floor landing starts ef 2 (measured); the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 20 | 25 | 58/350 | DRAWS |  |
| u 21 | 8 | 100/116 | DRAWS |  |
| u 22 | 4 | 88/100 | DRAWS |  |
| u 23 | 8 | 184/192 | DRAWS |  |
| u 24 | 18 | 386/438 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 25 | - | - | NO WALL / HUNTER | the snow rocks' type-0 / type-2 slots; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 30 | 55 | 1891/11540 | DRAWS |  |
| u 31 | 6 | 859/914 | DRAWS |  |
| u 32 | 4 | 0/479 | DRAWS | off the meter's camera, lit when aimed at |
| u 33 | 6 | 536/593 | DRAWS |  |
| u 40 | 51 | 381/4460 | DRAWS |  |
| u 41 | 2 | 126/146 | DRAWS |  |
| u 42 | 4 | 0/354 | DRAWS | off the meter's camera, lit when aimed at |
| u 43 | 4 | 276/297 | DRAWS |  |
| u 100 | - | - | NO WALL / HUNTER | sp_16 ef 2: a hunter's hit only (0xf65ac8); the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 101 | - | - | NO WALL / HUNTER | sp_16 0's ef 2: a hunter's hit only; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 110 | - | - | NO WALL / HUNTER | sp_16 3's ef 2: a hunter's hit only; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 111 | - | - | NO WALL / HUNTER | sp_16 1's ef 2: a hunter's hit only; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |

### em067_00 (Zamtrios)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 9 | 124/135 | DRAWS |  |
| u 1 | 9 | 194/226 | DRAWS |  |
| u 10 | 7 | 88/101 | DRAWS |  |
| u 11 | 7 | 158/180 | DRAWS |  |
| u 30 | 16 | 700/727 | DRAWS |  |
| u 31 | 16 | 618/645 | DRAWS |  |

### em068_00 (Najarala)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 10 | 159/173 | DRAWS |  |
| u 1 | 10 | 1213/1225 | DRAWS |  |
| u 2 | 8 | 123/136 | DRAWS |  |
| u 3 | 8 | 2582/2586 | DRAWS |  |
| u 30 | 8 | 128/140 | DRAWS |  |
| u 31 | 8 | 200/211 | DRAWS |  |

### em069_00 (Seltas Queen)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 31 | 5 | 61/71 | DRAWS |  |
| c 32 | 5 | 62/71 | DRAWS |  |
| c 33 | 5 | 61/71 | DRAWS |  |
| u 10 | 3 | 44/82 | DRAWS |  |
| u 20 | 2 | 14/38 | DRAWS |  |
| u 21 | 27 | 540/631 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |

### em070_00 (Nerscylla)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 17 | 324/789 | DRAWS |  |
| u 1 | - | - | ROM GIVES NOTHING | sp_00 reader 0xfac410 puts ef 1 / ef 2 at +0x15d4 / +0x15cc, but its landing 0xfac5e8 (READ whole) replaces base00's and starts no contact ef: only sp_01 children |
| u 2 | 10 | 501/538 | DRAWS |  |
| u 90 | 82 | 918/1027 | DRAWS |  |
| u 91 | 81 | 2383/2545 | DRAWS |  |
| u 100 | 82 | 930/1039 | DRAWS |  |
| u 101 | 82 | 2404/2606 | DRAWS |  |

### em071_00 (Gore Magala)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 1 | 12/14 | DRAWS |  |
| c 31 | 4 | 48/56 | DRAWS |  |
| u 0 | 2 | 28/30 | DRAWS |  |
| u 1 | 2 | 31/36 | DRAWS |  |
| u 10 | 3 | 122/133 | DRAWS |  |
| u 11 | 3 | 37/54 | DRAWS |  |
| u 150 | 35 | 442/483 | DRAWS |  |
| u 151 | 4 | 60/64 | DRAWS |  |
| u 152 | 8 | 102/112 | DRAWS |  |
| u 162 | 15 | 191/210 | DRAWS |  |
| u 172 | 15 | 191/210 | DRAWS |  |
| u 210 | 4 | 64/68 | DRAWS |  |
| u 220 | 4 | 62/68 | DRAWS |  |
| u 230 | 2 | 32/34 | DRAWS |  |

### em071_05 (Chaotic Gore Magala)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 1 | 12/14 | DRAWS |  |
| c 31 | 4 | 48/56 | DRAWS |  |
| u 0 | 2 | 27/30 | DRAWS |  |
| u 1 | 2 | 31/35 | DRAWS |  |
| u 10 | 3 | 109/113 | DRAWS |  |
| u 11 | 3 | 44/52 | DRAWS |  |
| u 60 | 3 | 48/63 | DRAWS |  |
| u 61 | 3 | 57/62 | DRAWS |  |
| u 90 | 6 | 263/270 | DRAWS |  |
| u 91 | 6 | 100/110 | DRAWS |  |
| u 120 | 3 | 36/42 | DRAWS |  |
| u 121 | 3 | 200/208 | DRAWS |  |
| u 123 | 9 | 284/915 | DRAWS |  |
| u 150 | 42 | 522/574 | DRAWS |  |
| u 151 | 8 | 119/130 | DRAWS |  |
| u 152 | 10 | 128/140 | DRAWS |  |
| u 153 | 22 | 280/307 | DRAWS |  |
| u 154 | 16 | 201/224 | DRAWS |  |
| u 180 | 1 | 5/6 | DRAWS |  |
| u 181 | 1 | 16/18 | DRAWS |  |
| u 182 | 1 | 18/20 | DRAWS |  |
| u 210 | 6 | 95/102 | DRAWS |  |
| u 220 | 8 | 124/136 | DRAWS |  |
| u 230 | 4 | 63/68 | DRAWS |  |
| u 300 | 1 | 54/56 | DRAWS |  |

### em072_00 (Shagaru Magala)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 1 | 12/14 | DRAWS |  |
| c 31 | 4 | 48/56 | DRAWS |  |
| u 0 | 1 | 9/11 | DRAWS |  |
| u 1 | 1 | 19/21 | DRAWS |  |
| u 60 | 3 | 48/63 | DRAWS |  |
| u 61 | 3 | 57/61 | DRAWS |  |
| u 90 | 34 | 1300/1364 | DRAWS |  |
| u 91 | 33 | 560/628 | DRAWS |  |
| u 120 | 6 | 72/78 | DRAWS |  |
| u 121 | 6 | 300/312 | DRAWS |  |
| u 123 | 12 | 350/804 | DRAWS |  |
| u 124 | 3 | 0/58 | DRAWS | off the meter's camera, lit when aimed at |
| u 150 | 42 | 522/574 | DRAWS |  |
| u 151 | 4 | 60/64 | DRAWS |  |
| u 152 | 8 | 101/113 | DRAWS |  |
| u 153 | 15 | 188/210 | DRAWS |  |
| u 154 | 15 | 190/210 | DRAWS |  |
| u 180 | 1 | 4/5 | DRAWS |  |
| u 181 | 1 | 17/18 | DRAWS |  |
| u 182 | 1 | 17/19 | DRAWS |  |
| u 210 | 2 | 32/34 | DRAWS |  |
| u 220 | 2 | 30/34 | DRAWS |  |
| u 230 | 1 | 15/17 | DRAWS |  |

### em076_00 (Seltas)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 12 | 118/296 | DRAWS |  |
| u 1 | 30 | 144/186 | DRAWS |  |
| u 10 | 12 | 0/195 | DRAWS | off the meter's camera, lit when aimed at |
| u 11 | 15 | 204/245 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 20 | 15 | 211/243 | DRAWS |  |
| u 21 | 15 | 197/242 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |

### em077_00 (Seregios)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 11 | 131/156 | DRAWS |  |
| c 32 | 10 | 120/141 | DRAWS |  |
| u 30 | 254 | 2600/3350 | DRAWS |  |
| u 31 | 254 | 3060/4867 | DRAWS |  |
| u 32 | - | - | NO WALL / HUNTER | the Solid hunter is met in the NODE replay (synthetic joints within ~100 of the unit, the shells launched at the origin) but not on the page at any of the Hunter control's points (front 0 / 500 / 1200, left / right 500 / 1200, behind 0 / 500): the page's real launch joints put the shells on other paths -- measured on em008 L2 M1: the fan shots pass at x -566 / +604 by z 1360 while the hunter stands near x 0, z 550. Not timing or pass order: hunterPass runs after the slot countdown on the page as in node |
| u 40 | 160 | 1294/2030 | DRAWS |  |
| u 41 | 55 | 1358/2085 | DRAWS |  |
| u 42 | - | - | NO WALL / HUNTER | the Solid hunter is met in the NODE replay (synthetic joints within ~100 of the unit, the shells launched at the origin) but not on the page at any of the Hunter control's points (front 0 / 500 / 1200, left / right 500 / 1200, behind 0 / 500): the page's real launch joints put the shells on other paths -- measured on em008 L2 M1: the fan shots pass at x -566 / +604 by z 1360 while the hunter stands near x 0, z 550. Not timing or pass order: hunterPass runs after the slot countdown on the page as in node |

### em079_00 (Malfestio)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 29 | 11 | 112/158 | DRAWS |  |
| c 30 | 6 | 74/86 | DRAWS |  |
| u 0 | 4 | 167/178 | DRAWS |  |
| u 1 | 4 | 171/183 | DRAWS |  |
| u 10 | 2 | 330/362 | DRAWS |  |
| u 20 | 3 | 63/71 | DRAWS |  |
| u 21 | 3 | 51/58 | DRAWS |  |

### em079_04 (Nightcloak Malfestio)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 29 | 32 | 314/448 | DRAWS |  |
| c 30 | 8 | 97/115 | DRAWS |  |
| u 0 | 6 | 279/290 | DRAWS |  |
| u 1 | 4 | 168/177 | DRAWS |  |
| u 10 | 3 | 69/77 | DRAWS |  |
| u 20 | 15 | 298/337 | DRAWS |  |
| u 21 | 3 | 64/72 | DRAWS |  |
| u 30 | 4 | 92/104 | DRAWS |  |
| u 60 | 7 | 244/390 | DRAWS |  |
| u 80 | 3 | 86/92 | DRAWS |  |
| u 81 | 9 | 241/264 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |

### em080_00 (Glavenus)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 9 | 44/57 | DRAWS |  |
| u 1 | 8 | 312/342 | DRAWS |  |
| u 2 | 7 | 306/335 | DRAWS |  |
| u 40 | 2 | 43/45 | DRAWS |  |

### em080_04 (Hellblade Glavenus)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 21 | 75/101 | DRAWS |  |
| u 1 | 21 | 822/897 | DRAWS |  |
| u 2 | 21 | 697/801 | DRAWS |  |
| u 3 | 6 | 203/228 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 40 | 2 | 43/45 | DRAWS |  |
| u 220 | 12 | 696/744 | DRAWS |  |
| u 221 | 4 | 165/175 | DRAWS |  |
| u 225 | 7 | 153/161 | DRAWS |  |
| u 226 | 7 | 25/34 | DRAWS |  |
| u 227 | 7 | 253/276 | DRAWS |  |
| u 230 | 16 | 841/931 | DRAWS |  |
| u 240 | 2 | 74/78 | DRAWS |  |

### em081_00 (Astalos)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 1 | 13/15 | DRAWS |  |
| c 31 | - | - | ROM CONDITION | INFERRED: L4 M32's dust is base01's, deleted 900+ above the ground (0x3fa498) while he flies -- as c 30 on L1 M1 (measured: the floor -960 under him); rage reaches the play (round 6) |
| c 32 | 5 | 61/71 | DRAWS |  |
| u 10 | 12 | 252/288 | DRAWS |  |
| u 27 | 41 | 956/1590 | DRAWS |  |
| u 28 | 9 | 58/68 | DRAWS |  |
| u 30 | 9 | 91/163 | DRAWS |  |
| u 31 | - | - | ROM GIVES NOTHING | sp_15 ef 1 / ef 2 go to +0x15d4 / +0x15cc (0x1034660..80), which nothing on base15's path loads (rom-map 0x1034638: end READ, no other reader INFERRED) |
| u 40 | 1 | 34/35 | DRAWS |  |
| u 41 | 1 | 9/11 | DRAWS |  |
| u 100 | 12 | 248/264 | DRAWS |  |

### em081_04 (Boltreaver Astalos)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 1 | 13/15 | DRAWS |  |
| c 31 | - | - | ROM CONDITION | INFERRED: as Astalos's -- base01's 900 rule on L4 M32 while he flies |
| c 32 | 5 | 60/73 | DRAWS |  |
| u 10 | 3 | 51/54 | DRAWS |  |
| u 11 | 2 | 31/34 | DRAWS |  |
| u 25 | 250 | 6361/14630 | DRAWS |  |
| u 26 | 67 | 445/538 | DRAWS |  |
| u 40 | 2 | 69/71 | DRAWS |  |
| u 41 | 2 | 18/21 | DRAWS |  |
| u 60 | 27 | 717/777 | DRAWS |  |
| u 63 | 27 | 85/559 | DRAWS |  |
| u 64 | 27 | 62/394 | DRAWS |  |
| u 70 | 6 | 221/246 | DRAWS |  |
| u 73 | 6 | 579/591 | DRAWS |  |
| u 74 | 6 | 82/143 | DRAWS |  |
| u 80 | 57 | 609/685 | DRAWS |  |
| u 81 | 3 | 28/33 | DRAWS |  |
| u 100 | 9 | 307/317 | DRAWS |  |
| u 101 | 9 | 215/229 | DRAWS |  |

### em082_00 (Mizutsune)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 260 | 5248/5645 | DRAWS |  |
| u 1 | 294 | 7915/8307 | DRAWS |  |
| u 2 | 287 | 28106/28482 | DRAWS |  |
| u 10 | - | - | ROM GIVES NOTHING | puddle sp_01 3 (the landing child of throw 1): the throw chooser yields 0 / 2 only -- mode 1 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 11 | - | - | ROM GIVES NOTHING | sp_13 mode 1: the throw chooser yields 0 / 2 only -- mode 1 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 12 | - | - | ROM GIVES NOTHING | puddle sp_01 3 (the landing child of throw 1): the throw chooser yields 0 / 2 only -- mode 1 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 20 | - | - | ROM CONDITION | puddle sp_01 4 (throw 2): the 10% roll x = u16((e+0x73e8 + 23 k - 0x9c4) % 100) in [90, 100) on the S13_082 actions; the named stand-in e+0x73e8 = 0 never lands in it |
| u 21 | - | - | ROM CONDITION | sp_13 mode 2: the 10% roll x = u16((e+0x73e8 + 23 k - 0x9c4) % 100) in [90, 100) on the S13_082 actions; the named stand-in e+0x73e8 = 0 never lands in it |
| u 22 | - | - | ROM CONDITION | puddle sp_01 4 (throw 2): the 10% roll x = u16((e+0x73e8 + 23 k - 0x9c4) % 100) in [90, 100) on the S13_082 actions; the named stand-in e+0x73e8 = 0 never lands in it |
| u 30 | - | - | ROM GIVES NOTHING | puddle sp_01 5 (the landing child of throw 3): the throw chooser yields 0 / 2 only -- mode 3 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 31 | - | - | ROM GIVES NOTHING | sp_13 mode 3: the throw chooser yields 0 / 2 only -- mode 3 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 32 | - | - | ROM GIVES NOTHING | puddle sp_01 5 (the landing child of throw 3): the throw chooser yields 0 / 2 only -- mode 3 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 40 | - | - | ROM GIVES NOTHING | puddle sp_01 6 (the landing child of throw 4): the throw chooser yields 0 / 2 only -- the third arm, 4, is never reached, its bound the second's (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 41 | - | - | ROM GIVES NOTHING | sp_13 mode 4: the throw chooser yields 0 / 2 only -- the third arm, 4, is never reached, its bound the second's (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 42 | - | - | ROM GIVES NOTHING | puddle sp_01 6 (the landing child of throw 4): the throw chooser yields 0 / 2 only -- the third arm, 4, is never reached, its bound the second's (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 50 | - | - | ROM GIVES NOTHING | puddle sp_01 7 (the landing child of throw 5): the throw chooser yields 0 / 2 only -- mode 5 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 51 | - | - | ROM GIVES NOTHING | sp_13 mode 5: the throw chooser yields 0 / 2 only -- mode 5 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 52 | - | - | ROM GIVES NOTHING | puddle sp_01 7 (the landing child of throw 5): the throw chooser yields 0 / 2 only -- mode 5 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 60 | 134 | 910/2938 | DRAWS |  |
| u 61 | 134 | 7248/11247 | DRAWS |  |
| u 80 | 27 | 30/586 | DRAWS |  |
| u 81 | 33 | 2106/2945 | DRAWS |  |
| u 100 | 9 | 143/155 | DRAWS |  |
| u 101 | 47 | 3932/3969 | DRAWS |  |
| u 120 | 8 | 311/330 | DRAWS |  |
| u 121 | 16 | 890/914 | DRAWS |  |
| u 122 | 22 | 2347/2430 | DRAWS |  |

### em082_04 (Soulseer Mizutsune)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 320 | 6492/6932 | DRAWS |  |
| u 1 | 320 | 8688/9107 | DRAWS |  |
| u 2 | 320 | 32777/33198 | DRAWS |  |
| u 10 | - | - | ROM GIVES NOTHING | puddle sp_01 3 (the landing child of throw 11): the throw chooser yields 0 / 2 only -- mode 11 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 11 | - | - | ROM GIVES NOTHING | sp_13 mode 11: the throw chooser yields 0 / 2 only -- mode 11 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 12 | - | - | ROM GIVES NOTHING | puddle sp_01 3 (the landing child of throw 11): the throw chooser yields 0 / 2 only -- mode 11 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 20 | - | - | ROM CONDITION | puddle sp_01 4 (throw 12): the 10% roll x = u16((e+0x73e8 + 23 k - 0x9c4) % 100) in [90, 100) on the S13_082 actions; the named stand-in e+0x73e8 = 0 never lands in it |
| u 21 | - | - | ROM CONDITION | sp_13 mode 12: the 10% roll x = u16((e+0x73e8 + 23 k - 0x9c4) % 100) in [90, 100) on the S13_082 actions; the named stand-in e+0x73e8 = 0 never lands in it |
| u 22 | - | - | ROM CONDITION | puddle sp_01 4 (throw 12): the 10% roll x = u16((e+0x73e8 + 23 k - 0x9c4) % 100) in [90, 100) on the S13_082 actions; the named stand-in e+0x73e8 = 0 never lands in it |
| u 30 | - | - | ROM GIVES NOTHING | puddle sp_01 5 (the landing child of throw 13): the throw chooser yields 0 / 2 only -- mode 13 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 31 | - | - | ROM GIVES NOTHING | sp_13 mode 13: the throw chooser yields 0 / 2 only -- mode 13 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 32 | - | - | ROM GIVES NOTHING | puddle sp_01 5 (the landing child of throw 13): the throw chooser yields 0 / 2 only -- mode 13 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 40 | - | - | ROM GIVES NOTHING | puddle sp_01 6 (the landing child of throw 14): the throw chooser yields 0 / 2 only -- the third arm, 4, is never reached, its bound the second's (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 41 | - | - | ROM GIVES NOTHING | sp_13 mode 14: the throw chooser yields 0 / 2 only -- the third arm, 4, is never reached, its bound the second's (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 42 | - | - | ROM GIVES NOTHING | puddle sp_01 6 (the landing child of throw 14): the throw chooser yields 0 / 2 only -- the third arm, 4, is never reached, its bound the second's (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 50 | - | - | ROM GIVES NOTHING | puddle sp_01 7 (the landing child of throw 15): the throw chooser yields 0 / 2 only -- mode 15 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 51 | - | - | ROM GIVES NOTHING | sp_13 mode 15: the throw chooser yields 0 / 2 only -- mode 15 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 52 | - | - | ROM GIVES NOTHING | puddle sp_01 7 (the landing child of throw 15): the throw chooser yields 0 / 2 only -- mode 15 is never a chooser value (shells.js choose082s13; leviathan-shells-spec 5c) |
| u 60 | 57 | 549/1249 | DRAWS |  |
| u 61 | 69 | 4519/6146 | DRAWS |  |
| u 80 | 1 | 2/3 | DRAWS |  |
| u 81 | 4 | 295/298 | DRAWS |  |
| u 100 | 9 | 144/155 | DRAWS |  |
| u 101 | 47 | 3932/3969 | DRAWS |  |
| u 120 | 8 | 277/298 | DRAWS |  |
| u 121 | 6 | 583/592 | DRAWS |  |
| u 122 | 75 | 249/860 | DRAWS |  |
| u 150 | 3 | 978/981 | DRAWS |  |
| u 200 | 27 | 7851/8424 | DRAWS |  |
| u 201 | 8 | 955/964 | DRAWS |  |
| u 210 | 10 | 158/205 | DRAWS |  |

### em083_00 (Gammoth)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 1 | 17 | 156/177 | DRAWS |  |
| u 2 | 17 | 370/403 | DRAWS |  |
| u 31 | 1 | 40/41 | DRAWS |  |
| u 32 | 1 | 24/27 | DRAWS |  |
| u 41 | 2 | 49/51 | DRAWS |  |
| u 42 | 2 | 44/48 | DRAWS |  |
| u 51 | 3 | 93/96 | DRAWS |  |
| u 52 | 3 | 67/72 | DRAWS |  |
| u 60 | 120 | 4016/4174 | DRAWS |  |
| u 61 | 40 | 1335/1385 | DRAWS |  |
| u 70 | 1 | 41/49 | DRAWS |  |
| u 80 | 6 | 219/226 | DRAWS |  |

### em083_04 (Elderfrost Gammoth)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 1 | 17 | 164/270 | DRAWS |  |
| u 2 | 15 | 326/356 | DRAWS |  |
| u 31 | 2 | 85/88 | DRAWS |  |
| u 32 | 2 | 47/53 | DRAWS |  |
| u 41 | 2 | 61/64 | DRAWS |  |
| u 42 | 2 | 43/47 | DRAWS |  |
| u 43 | 1 | 27/30 | DRAWS |  |
| u 44 | 2 | 50/52 | DRAWS |  |
| u 51 | 2 | 45/48 | DRAWS |  |
| u 52 | 6 | 134/146 | DRAWS |  |
| u 53 | 2 | 130/145 | DRAWS |  |
| u 54 | 6 | 177/186 | DRAWS |  |
| u 55 | 1 | 24/26 | DRAWS |  |
| u 60 | 140 | 4664/4858 | DRAWS |  |
| u 62 | 13 | 434/450 | DRAWS |  |
| u 70 | 1 | 55/62 | DRAWS |  |
| u 80 | 6 | 219/227 | DRAWS |  |
| u 100 | 10 | 188/202 | DRAWS |  |
| u 101 | 10 | 220/240 | DRAWS |  |
| u 110 | - | - | INPUT MISSING | sp_13 6's ef 4 (+0x167c) starts only when sp_13's +0x158 0x1064158 hits ANOTHER Elderfrost (u16 e+0xb5f0 / 0x400 == 0x453): no second monster |
| u 150 | 1 | 40/41 | DRAWS |  |

### em084_00 (Nakarkos)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 1 | 20 | 599/721 | DRAWS |  |
| u 2 | 2 | 43/46 | DRAWS |  |
| u 4 | 4 | 553/607 | DRAWS |  |
| u 5 | - | - | NO WALL / HUNTER | the G-rank arm shells 5..8 (BUILT 2026-10-20) draw (u 4); u 5 is their ef 1 / ef 3, the type-0 / type-2 landing -- the floor's is (999, -1); the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 10 | 2 | 51/54 | DRAWS |  |
| u 20 | 3 | 361/365 | DRAWS |  |
| u 31 | 6 | 630/636 | DRAWS |  |
| u 32 | 40 | 4200/4240 | DRAWS |  |
| u 33 | 6 | 636/648 | DRAWS |  |
| u 34 | 40 | 4240/4320 | DRAWS |  |
| u 40 | 4 | 3984/3995 | DRAWS |  |
| u 41 | 7 | 1520/1560 | DRAWS |  |
| u 42 | 7 | 1522/1560 | DRAWS |  |
| u 100 | 8 | 150/168 | DRAWS |  |
| u 101 | 8 | 1716/1788 | DRAWS |  |
| u 110 | 6 | 618/624 | DRAWS |  |
| u 111 | 6 | 594/603 | DRAWS |  |
| u 112 | 20 | 2060/2080 | DRAWS |  |
| u 113 | 20 | 1976/2011 | DRAWS |  |
| r 0 | 2 | 56/64 | DRAWS |  |
| r 10 | 6 | 130/144 | DRAWS |  |
| r 13 | 30 | 1020/1062 | DRAWS |  |
| r 14 | 30 | 522/570 | DRAWS |  |
| r 20 | 2 | 305/308 | DRAWS |  |
| r 21 | 2 | 17/19 | DRAWS |  |
| r 24 | 10 | 1011/1021 | DRAWS |  |
| r 25 | 10 | 170/199 | DRAWS |  |
| r 30 | 38 | 1000/1047 | DRAWS |  |
| r 31 | 38 | 2074/2122 | DRAWS |  |
| r 32 | 38 | 853/966 | DRAWS |  |
| r 35 | 30 | 678/770 | DRAWS |  |

### em086_00 (Valstrax)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| c 30 | 6 | 76/84 | DRAWS |  |
| u 10 | 60 | 569/648 | DRAWS |  |
| u 20 | 53 | 728/794 | DRAWS |  |
| u 21 | 4 | 58/63 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 30 | 16 | 376/463 | DRAWS |  |
| u 140 | 3 | 97/115 | DRAWS |  |
| u 500 | 7 | 203/212 | DRAWS |  |
| u 501 | 2 | 20/24 | DRAWS |  |
| u 502 | - | - | ROM GIVES NOTHING | sp_01 9: no maker -- every 0x175 create in main.text and every in-band 0x48b884 call read (gapD); control: the same census finds modes 0..8 / 10..14 |

### em087_00 (em087_00)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 0 | 132 | 9420/9552 | DRAWS |  |
| u 1 | 132 | 7562/7718 | DRAWS |  |
| u 30 | 66 | 375/461 | DRAWS |  |
| u 31 | 33 | 3408/3449 | DRAWS |  |
| u 32 | 7 | 441/456 | DRAWS |  |
| u 60 | 128 | 7124/7326 | DRAWS |  |
| u 61 | 127 | 5679/5836 | DRAWS |  |
| u 62 | 21 | 534/562 | DRAWS | with the Hunter control's Solid body (a type-2 contact) |
| u 90 | 4 | 439/452 | DRAWS |  |
| u 400 | 3 | 148/157 | DRAWS |  |
| u 410 | 3 | 225/231 | DRAWS |  |
| u 70 | 6 | 168/198 | DRAWS |  |
| u 320 | 6 | 1826/1832 | DRAWS |  |
| u 321 | 8 | 322/388 | DRAWS |  |

### em088_00 (Ahtal-Ka)

| record | starts | lit | verdict | why |
|---|---|---|---|---|
| u 30 | 14 | 151/168 | DRAWS |  |
| u 31 | 14 | 172/192 | DRAWS |  |
| u 32 | 14 | 253/308 | DRAWS |  |
| u 34 | - | - | NO WALL / HUNTER | the silk ball's ef 4 (+0x1670), "u 34 on a hit"; sp_00 collides only at y <= 0 (u 32). The hunter is INFERRED: the reader of +0x1670 is not recorded; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 60 | 2 | 80/86 | DRAWS |  |
| u 61 | 2 | 102/105 | DRAWS |  |
| u 62 | 2 | 102/104 | DRAWS |  |
| u 70 | 3 | 94/114 | DRAWS |  |
| u 90 | 1 | 86/87 | DRAWS |  |
| u 91 | 1 | 82/87 | DRAWS |  |
| u 200 | - | - | NO WALL / HUNTER | sp_57 ef 1 starts only from base57 vt+0x98 0x430714, the hit callback; modes 2 / 14 / 18 do spawn with Carrying 2; the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 201 | - | - | NO WALL / HUNTER | the same hit callback 0x430714 (k 0's modes, which spawn with Carrying 0); the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 202 | - | - | NO WALL / HUNTER | the same hit callback 0x430714 (k 1's modes); the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind |
| u 230 | 1 | 39/41 | DRAWS |  |
| u 231 | 11 | 8922/8937 | DRAWS |  |
| u 232 | 2 | 67/70 | DRAWS |  |
| u 260 | 3 | 62/74 | DRAWS |  |
| u 261 | 3 | 62/71 | DRAWS |  |
| u 262 | 3 | 69/86 | DRAWS |  |
| u 300 | 5 | 4162/4168 | DRAWS |  |
| u 301 | 11 | 8887/8898 | DRAWS |  |
| u 310 | 2 | 90/124 | DRAWS |  |
| u 311 | 2 | 120/122 | DRAWS |  |
| u 320 | - | - | DRAWS | on Ahtal-Neset's page: his lifts (1, 0x15) / (1, 8) on L0 M9 and his drops (10, 0x8e) on L3 M12 (READ gapJ / gapL) make Ahtal-Ka's sp_57 -- metered there (em087_00) |
| u 321 | - | - | DRAWS | on Ahtal-Neset's page: his lifts (1, 0x15) / (1, 8) on L0 M9 and his drops (10, 0x8e) on L3 M12 (READ gapJ / gapL) make Ahtal-Ka's sp_57 -- metered there (em087_00) |
| u 330 | 5 | 200/205 | DRAWS |  |
| u 331 | 5 | 3967/3977 | DRAWS |  |
| u 332 | 5 | 250/273 | DRAWS |  |
| u 360 | - | - | ROM CONDITION | BUILT 2026-10-20 (sub 2 0x4397ec starts it); INFERRED: the orbit (7, 0x34) is reached only through (7, 0x33)'s chain at f86 on L2 M35 and needs a live shell61 anchor -- the page's one L2 M35 play after the webs had none |
