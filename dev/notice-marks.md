# NOTICE MARKS ("!" and "?") -- the per-monster mapping, and what is still missing

Raven wants, per monster, the motion the game plays when the monster NOTICES a hunter (the "!" mark)
and the motion, if any, on the way back to unaware (the "?"): the final action of command group 4
stream 0, resolved through the class's status (+0x73e0) and number (+0x73e1) switches to a
`{ list, motion }`, for wiring into `render/motion-states.js` as a `start:` record.

**NOT DERIVED HERE, and not derivable from this repository.** Every row's action and motion is
blank below, deliberately -- see "Why no row is filled". What this note does carry is the part that
IS in the repository: which monsters carry the two records, on which joint, out of which c.pel, and
the shared request sites read back off the generated triage tables.

## The shared code (checked against all 93 generated triage tables, not re-derived)

`dev/effects-triage/*.md` is generated from the game's data by `C:\MHGU-Extract\efx\effects_triage.py`,
and its "fired by" column is byte-identical across all 93 monsters that carry the records:

    c 1200  cm200_020.efl  "!"  shared enemy code 0xa43dc (id 22): caller-selected
                                (0xa4388 r1 == 2, [+0x1428]+0x1a8 bit 0, +0x2c0 == 0)
    c 1201  cm200_021.efl  "?"  shared enemy code 0xa4424 (id 23): every frame from the enemy
                                update (0xa41b8 from 0xae78c / 0xaf0f8) -- its condition not read

The "!" line confirms Raven's reading exactly: 0xa4388 requests id 22 when the new awareness is 2,
the old byte at [+0x1428]+0x2c0 is still 0, and [+0x1428]+0x1a8 bit 0 is up.

**The "?" line does not.** The triage attributes id 23's request site (0xa4424) to the per-frame
state pass 0xa41b8 -- the same pass that runs the rage puff and the tired drool countdowns
(`render/motion-states.js`: "0xa41b8 returns before its countdowns -- the rage puff pauses") -- and
records its condition as not read. It does not name 0xa4388 as a caller of 0xa4424, the way it names
it for 0xa43dc. Either 0xa4424 has a second, per-frame caller besides the awareness drop, or the
generator's attribution for id 23 is coarser than for id 22. This bears directly on question 2:
if the "?" can be requested from the per-frame pass, an awareness-drop motion is not the whole
story for it. **Worth resolving at 0xa4424's callers before any "?" row is wired.**

## Why no row is filled

The mapping needs two inputs, and this container has neither:

1. `enemy\cmd_tbl\<mon>_cmdtbl.emc` -- there is no .emc file anywhere in the repository (nor any
   dump of one), so group 4 stream 0 cannot be followed for any monster.
2. The ROM's code -- the class status/number switches (+0x73e0 / +0x73e1) and 0xbcae0's callers.
   `docs/effects/rom-pages.bin` is 256 KB of the DATA pages the effect host touches
   (`dev/effect-export-rom.mjs`), not the image's code; no ROM image and no Unicorn harness is here.

Three in-repo routes were checked and none substitutes:

* **The PSL motion bindings.** In all 93 tables, c 1200 and c 1201 are attributed to shared code and
  to no motion at all -- neither record is PSL-fired for any monster. So the committed effect data
  cannot name a notice motion, for Seregios or anyone else.
* **The decode notes in `render/motion-states.js`.** They record command group 6 (the rage entry)
  per monster, because rage needed it. Group 4 appears nowhere; the notes it came from
  (`E:\offline\decode\notes\states-em*.md`) are not in the repository either.
* **The exported effect data.** No `docs/effects/*.json` carries record 1200 or 1201, and
  `cm200_020.efl` / `cm200_021.efl` are not among the extracted files in `docs/effects/files/`.

## Two premises in the request that do not reproduce at this commit

Raven: "The viewer shows them on Seregios only ... wired in render/motion-states.js as
`'0|Motion[5]': { start: [['em077_00c', 1200]] }`", and "the effect side is done and waiting on it".

At b959955 on this branch: `MOTION_STATES` has no `em077_00` entry (its keys are em004_00, em037_04,
em007_00, em042_00, em003_00, em043_00, em043_05, em037_00 and the em 1 / em 2 line); nothing in
`docs/render/` mentions record 1200, 1201, cm200_020 or cm200_021; there is no
`docs/effects/em077_00.json`; and Seregios's own triage row says c 1200 is code-requested with no
motion firing it. So the worked example is not in this tree, and neither is the effect side it
depends on. It presumably lives in uncommitted work or another checkout -- **it needs to be shared
before it can be checked or followed.**

## What is needed to fill the table

Either the inputs come here (`<mon>_cmdtbl.emc` for the monsters wanted, plus a way to read the
class switches -- the notes, a disassembly, or the ROM and harness), or the pass runs on the machine
that has `C:\MHGU-Extract` and the existing `efx\agents\state-scratch\emc.py` parser, and its output
comes back for wiring. Nothing between those two is honest: group 4 stream 0 is per-class data and a
neighbour's pair cannot stand in for it.

## The rows to fill (93 large monsters)

Every large monster in the triage set carries both records except Ahtal-Ka's dummy neighbour
`em087_00` ("None"), whose c.pel is its own `em087_00_000` set and carries neither -- so no notice
mark can play on it and there is nothing to map. The 36 small monsters (`ems*`) in
`docs/monsters.json` have no triage file here, so whether their c.pels carry the records is unknown.

`joint` and `mode/sub` are the placement out of the c.pel (`-1` = no joint; mode 3 = placed). Where
the two records differ, both are given as `1200 / 1201`. `action`, `list|motion` and `drop` are for
the EMC pass to fill; `note` should name the ROM address or file each number came from.

| monster | name | c.pel | joint | mode/sub | action | list\|motion | drop | status |
|---|---|---|---|---|---|---|---|---|
| `em001_00` | Rathian | `em001_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em001_02` | Gold Rathian | `em001_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em001_04` | Dreadqueen Rathian | `em001_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em002_00` | Rathalos | `em002_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em002_02` | Silver Rathalos | `em002_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em002_04` | Dreadking Rathalos | `em002_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em003_00` | Khezu | `em003_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em004_00` | Basarios | `em004_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em005_00` | Gravios | `em005_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em007_00` | Diablos | `em007_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em007_04` | Bloodbath Diablos | `em007_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em008_00` | Yian Kut-Ku | `em008_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em009_00` | Gypceros | `em009_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em010_00` | Plesioth | `em010_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em011_00` | Kirin | `em011_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em012_00` | Lao-Shan Lung | `em012_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em013_00` | Fatalis | `em013_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em013_01` | Crimson Fatalis | `em013_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em013_02` | Old Fatalis | `em013_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em014_00` | Velocidrome | `em014_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em015_00` | Gendrome | `em015_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em016_00` | Iodrome | `em016_00c` | 2 | 0/0 / 0/1 | — | — | — | needs cmd_tbl |
| `em017_00` | Cephadrome | `em017_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em018_00` | Yian Garuga | `em018_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em018_04` | Deadeye Yian Garuga | `em018_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em019_00` | Daimyo Hermitaur | `em019_00c` | 1 | 0/0 | — | — | — | needs cmd_tbl |
| `em019_04` | Stonefist Hermitaur | `em019_00c` | 1 | 0/0 | — | — | — | needs cmd_tbl |
| `em020_00` | Shogun Ceanataur | `em020_00c` | 1 | 0/0 | — | — | — | needs cmd_tbl |
| `em020_04` | Rustrazor Ceanataur | `em020_00c` | 1 | 0/0 | — | — | — | needs cmd_tbl |
| `em021_00` | Congalala | `em021_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em022_00` | Blangonga | `em022_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em023_00` | Rajang | `em023_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em023_05` | Furious Rajang | `em023_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em024_00` | Kushala Daora | `em024_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em025_00` | Chameleos | `em025_00c` | 5 | 0/1 / 0/0 | — | — | — | needs cmd_tbl |
| `em027_00` | Teostra | `em027_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em030_00` | Bulldrome | `em030_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em032_00` | Tigrex | `em032_00c` | 2 | 0/0 / 0/1 | — | — | — | needs cmd_tbl |
| `em032_04` | Grimclaw Tigrex | `em032_00c` | 2 | 0/0 / 0/1 | — | — | — | needs cmd_tbl |
| `em033_00` | Akantor | `em033_00c` | 4 | 0/0 | — | — | — | needs cmd_tbl |
| `em034_00` | Giadrome | `em034_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em036_00` | Lavasioth | `em036_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em037_00` | Nargacuga | `em037_00c` | 2 | 0/1 | — | — | — | needs cmd_tbl |
| `em037_04` | Silverwind Nargacuga | `em037_00c` | 2 | 0/1 | — | — | — | needs cmd_tbl |
| `em038_00` | Ukanlos | `em038_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em042_00` | Barioth | `em042_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em043_00` | Deviljho | `em043_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em043_05` | Savage Deviljho | `em043_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em044_00` | Barroth | `em044_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em045_00` | Uragaan | `em045_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em045_04` | Crystalbeard Uragaan | `em045_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em046_00` | Lagiacrus | `em046_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em047_00` | Royal Ludroth | `em047_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em049_00` | Agnaktor | `em049_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em050_00` | Alatreon | `em050_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em055_00` | Duramboros | `em055_00c` | 4 | 0/0 | — | — | — | needs cmd_tbl |
| `em056_00` | Nibelsnarf | `em056_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em057_00` | Zinogre | `em057_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em057_04` | Thunderlord Zinogre | `em057_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em058_00` | Amatsu | `em058_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em060_00` | Arzuros | `em060_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em060_04` | Redhelm Arzuros | `em060_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em061_00` | Lagombi | `em061_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em061_04` | Snowbaron Lagombi | `em061_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em062_00` | Volvidon | `em062_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em063_00` | Brachydios | `em063_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em063_05` | Raging Brachydios | `em063_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em065_00` | Kecha Wacha | `em065_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em066_00` | Tetsucabra | `em066_00c` | 3 | 0/0 / 0/1 | — | — | — | needs cmd_tbl |
| `em066_04` | Drilltusk Tetsucabra | `em066_00c` | 3 | 0/0 / 0/1 | — | — | — | needs cmd_tbl |
| `em067_00` | Zamtrios | `em067_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em068_00` | Najarala | `em068_00c` | 12 | 0/1 / 0/0 | — | — | — | needs cmd_tbl |
| `em069_00` | Seltas Queen | `em069_00c` | 1 | 0/1 / 1/1 | — | — | — | needs cmd_tbl |
| `em070_00` | Nerscylla | `em070_00c` | 1 | 0/1 | — | — | — | needs cmd_tbl |
| `em071_00` | Gore Magala | `em071_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em071_05` | Chaotic Gore Magala | `em071_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em072_00` | Shagaru Magala | `em072_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em076_00` | Seltas | `em076_00c` | 1 | 0/1 | — | — | — | needs cmd_tbl |
| `em077_00` | Seregios | `em077_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em079_00` | Malfestio | `em079_00c` | 4 | 0/2 | — | — | — | needs cmd_tbl |
| `em079_04` | Nightcloak Malfestio | `em079_00c` | 4 | 0/2 | — | — | — | needs cmd_tbl |
| `em080_00` | Glavenus | `em080_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em080_04` | Hellblade Glavenus | `em080_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em081_00` | Astalos | `em081_00c` | 130 | 0/0 | — | — | — | needs cmd_tbl |
| `em081_04` | Boltreaver Astalos | `em081_00c` | 130 | 0/0 | — | — | — | needs cmd_tbl |
| `em082_00` | Mizutsune | `em082_00c` | 132 | 0/0 | — | — | — | needs cmd_tbl |
| `em082_04` | Soulseer Mizutsune | `em082_00c` | 132 | 0/0 | — | — | — | needs cmd_tbl |
| `em083_00` | Gammoth | `em083_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em083_04` | Elderfrost Gammoth | `em083_00c` | 2 | 0/0 | — | — | — | needs cmd_tbl |
| `em084_00` | Nakarkos | `em084_00c` | -1 | 0/0 / 0/2 | — | — | — | needs cmd_tbl |
| `em085_00` | Great Maccao | `em085_00c` | 3 | 0/2 | — | — | — | needs cmd_tbl |
| `em086_00` | Valstrax | `em086_00c` | 3 | 0/0 | — | — | — | needs cmd_tbl |
| `em088_00` | Ahtal-Ka | `em088_00c` | 1 | 0/0 | — | — | — | needs cmd_tbl |

Shared c.pels (the record itself is one file for the whole family, but awareness, the command table
and the motion lists are per class, so each variant still needs its own row): em001_00c (em001_00,
em001_02, em001_04), em002_00c (em002_00, em002_02, em002_04), em007_00c, em013_00c (3), em018_00c,
em019_00c, em020_00c, em023_00c, em032_00c, em037_00c, em043_00c, em045_00c, em057_00c, em060_00c,
em061_00c, em063_00c, em066_00c, em071_00c, em079_00c, em080_00c, em081_00c, em082_00c, em083_00c.

Sources: `dev/effects-triage/*.md` (generated from the game's data) for every record, joint, mode and
c.pel above; `docs/monsters.json` for the monster set; `dev/effect-export-rom.mjs` for what
`rom-pages.bin` holds.
