# gapO: every beam type's FOLDER and HIT 0, from the ROM (2026-10-22, ROM-decode helper, shells lane)

Nothing in the repo, rom-map, specs or board was edited. The generator was not run over the repo file. Everything is in
`<scratchpad>\gapO\`:

| file | what |
|---|---|
| `shlinfo.py` | walks a .shl's ShellInfoList and records each mode's four resources (ef / snd / hit / sh paths) |
| `beamreads.py` → `beamreads.json` | every BEAM_TYPES (44) and BEAM_MODES (120) entry: id, row, res, path hash, folder, HitParam path, ints, hit 0, hitrec[hit 0]. It asserts all the checks below |
| `readersites.py` | each beam reader's `bl 0x4a23f4` and the store after it |
| `patch_beam_types.py` | the in-place patch (deliverable b) |
| `beam-types.patched.js` | its output: the repo file with both fields added to all 164 entries |
| `make_gen_new.py` → `gen_beam_types.new.py` + `gen_beam_types.diff` | the generator change. The diff is not applied |
| `shellres_all.txt` | `shellres.py` over all 25 arcs, ids 0x60..0x17f |

## (a) The reads

### 1. The folder: shell id → 0x175c3e8 row → res → 0x159daa0 path

**The id each spawn writes to the setup +4.** Every one was already READ in `dev/beams/<mon>.md`. I re-checked each one here:
- **Literals.** Disassembled. Each is a `mov` / `movw` of that id at the cited address (`beamreads.py` CHECK).
- **Notes that cite only a function.** A scan of that function finds the literal sites (the SCAN list).
- **Slot writers.** These are the vt+0x158 functions: 0xd2e538, 0xdc09d4, 0xdc3e8c, 0x1019c1c, 0x1035040. They were disassembled, and the stores match.

**From the id to the folder:**
1. The id's row `0x175c3e8 + 12·id` gives {class DTI, setup DTI, res} (`shelltable.json`).
2. `0x159daa0[res]` gives {~crc32 of the lowercase path, type}.
3. That hash is matched against the arc's own paths. Each match is unique and is the .shl (`4aa69872`).
4. In every case **the row's class equals the entry's `cls`, and the setup is cSetupParamEmBase02**.

| class (reader vt+0x14c) | monster → id (source) | res | folder (HITSHAPES key) |
|---|---|---|---|
| uShellEm005_sp_02 (`0xd30a90`) | em004_00 → **0x6c**: [e+0xcacc] by vt+0x158 `0xd2e538` (em 4 `0xd2e570` → str `0xd2e590`); spawn `stmib {[e+0xcacc], sb}` `0xd29570` | 0x89ba | `shell\em\em004_00_shell02` |
| | em005_00 → **0x6e**: the same slot, em 5 (`0xd2e55c`) | 0x89bc | `shell\em\em005_00_shell02` |
| uShellEm010_sp_02 (`0xd6caf0`) | em010_00 → **0x7d**: literal at 7 spawners (0xd6777c 0xd67924 0xd682a8 0xd684c8 0xd68d08 0xd69108 0xd69554) | 0x89d0 | `shell\em\em010_00_shell02` |
| uShellEm013_00_02 (`0xd8bcdc`) | em013_00 → **0x84**: `0xd865a0` variant 0, `0xd86708` | 0x89d7 | `shell\em\em013_00_shell02` |
| uShellEm013_01_02 (`0xd8ca2c`) | em013_01 → **0x88**: variant 1, `0xd867a0` | 0x89db | `shell\em\em013_01_shell02` |
| uShellEm019_sp_02 (`0xdcdb98`) | em019_00 → **0x9a**: [e+0xcacc] by vt+0x158 `0xdc09d4` (`0xdc0a20` → str `0xdc0a48`) | 0x89ed | `shell\em\em019_00_shell02` |
| | em019_04 → **0x9c**: variant 4, `movweq r3,#0x9c` `0xdc0a3c` | 0x89ef | `shell\em\em019_04_shell02` |
| uShellEm020_sp_02 (`0xdce2d8`) | em020_00 → **0x9e**: [e+0xcad8] by vt+0x158 `0xdc3e8c` (`0xdc3e98` → str `0xdc3eb4`); helper `0xdc5e44` | 0x89f1 | `shell\em\em020_00_shell02` |
| uShellEm020_04_02 (`0xdce00c`) | em020_04 → **0xa0**: helper `0xdc5edc`, literal `0xdc5f04` | 0x89f3 | `shell\em\em020_04_shell02` |
| uShellEm023_sp_02 (`0xdee77c`) | em023_00 → **0xa9** (`0xde8970`), em023_05 → **0xad** (`0xde8948`): `0xde8908`, ldrb [e+0xb5f5] `0xde8924`, cmp #5 `0xde8940` | 0x89fc / 0x8a00 | `shell\em\em023_00_shell02` / `shell\em\em023_05_shell02` |
| uShellEm024_sp_02 (`0xdfde00`) | em024_00 → **0xb1**: `0xdf8d78` / `0xdf8f4c` | 0x8a04 | `shell\em\em024_00_shell02` |
| uShellEm033_sp_02 (`0xe3e76c`) | em033_00 → **0xc2**: 8 sites (0xe3b228 0xe3b2b8 0xe3b334 0xe3bae8 0xe3bb84 0xe3bc00 0xe3c620 0xe3c6b8) | 0x8a15 | `shell\em\em033_00_shell02` |
| uShellEm038_sp_02 (`0xe63ba4`) | em038_00 → **0xd0**: 8 arms (0xe6100c 0xe61078 0xe610c4 0xe61114 0xe61174 0xe611c0 0xe616c4 0xe61710) | 0x8a23 | `shell\em\em038_00_shell02` |
| uShellEm049_sp_02 (`0xec4640`) | em049_00 → **0xee**: 0xeba564 / 0xebb6ac / 0xebb71c | 0x8a41 | `shell\em\em049_00_shell02` |
| uShellEm050_sp_02 (`0xecfc04`) | em050_00 → **0xf1**: 0xec8814 / 0xec8924 | 0x8a44 | `shell\em\em050_00_shell02` |
| uShellEm056_sp_02 (`0xeeb328`) | em056_00 → **0xf5**: 0xee54e8 / 0xee5880 | 0x8a48 | `shell\em\em056_00_shell02` |
| uShellEm058_sp_02 (`0xf0fd08`) | em058_00 → **0xfe**: 0xf0d06c / 0xf0d108 | 0x8a51 | `shell\em\em058_00_shell02` |
| uShellEm067_sp_02 (`0xf785ec`) | em067_00 → **0x123**: movw 0xf6fc00 / 0xf7150c / 0xf72418 | 0x8a76 | `shell\em\em067_00_shell02` |
| uShellEm081_04_02 (`0x10316a8`) | em081_04 → **0x153**: [e+0xcbb8] by vt+0x158 `0x1019c1c` (`0x1019c6c` → `0x1019cc8`); helper `0x102feb4` ldr `0x102fee4` | 0x8aa0 | `shell\em\em081_04_shell02` |
| uShellEm082_sp_02 (`0x104ee78`) | em082_00 → **0x15a** (`0x103508c`), em082_04 → **0x15e** (`0x1035068`): [e+0xcac4] by vt+0x158 `0x1035040`, str `0x10350a4` | 0x8aa7 / 0x8aab | `shell\em\em082_00_shell02` / `shell\em\em082_04_shell02` |
| uShellEm084_sp_02 (`0x10896d8`) | em084_00 → **0x16e**: movw 0x106f6d4 / 0x107cb18 | 0x8abb | `shell\em\em084_00_shell02` |

The generator's two classes with no entries got the same resolution:
- em013_02: 0x8c, res 0x89df → em013_02_shell02.
- em083_04: 0x169 → em083_04_shell02. Its arc entry starts no effect.

**Result: the name-built `<mon>_shell02` folder was right in all 164 entries.** It is now a read, not a fit. The generator's `CLASS` table (monster → class) is also confirmed: each monster's id row names that class.

### 2. Hit 0: the reader's source and the value per mode

**The getter `0x4a23f4` (`0x4a23f4..0x4a246c`, READ).** Inputs: S, i.
1. res = `[S+0x1384]`. If null, it returns −1.
2. The list comes from res vt+0x40 (the ShellInfoList).
3. mode = byte `[[S+0x136c]+8]`, the setup's +8. With no setup it is 0xff.
4. elem = `[[list+0x10] + 4·mode]`. There is **no bound**. A null elem gives −1.
5. `0x48a4a8` returns `[elem+0x10]`, the cShellInfo **HitParam**. A null gives −1.
6. It tail-calls its vt+0x44. That is **`0x3cb30c`** (FUP vtable `0x174d378` +0x44, read): i ≥ `[+0x64]` gives 0, else `[[+0x70] + 4i]`.

So **hit 0 = int 0 of the HitParam FUP that the .shl's ShellInfoList[mode] entry names.** It is not "the mode number", and it is not the cmn.

**Every beam reader takes it once, as hit int 0 into +0x1654.**
- Statically: the first `bl 0x4a23f4` in each reader, with `mov r1,#0`, then `str r0`. The sites are:
  - 0xd30ae8 / 0xd6cb64 / 0xd8bd34 / 0xd8ca84 / 0xdcdbf0 / 0xdce080 (020_04) / 0xdce348 (020_sp)
  - 0xdee7d4 / 0xdfde70 / 0xe3e7dc / 0xe63c18 / 0xec46b0 / 0xecfc74 / 0xeeb380 / 0xf0fd78 / 0xf78660
  - 0x103171c / 0x104eeec / 0x1089748
- Emulated: `readermap.json` tags +0x1654 = "hit int 0" for all 19 classes and all their modes, with exactly one hitInt call each.
- base02 registers it as slot 0 (`0x3fbab0..0x3fbae4`, gapN a5).

**Per BEAM_TYPES entry** (the HitParam the mode's own entry names, then its ints, then HITSHAPES hitrec[hit 0] = [delay, duration, kind, group]):

| entry | HitParam | hit | hitrec[hit 0] |
|---|---|---|---|
| em004_00:1 | _hit001 | [0] | [22, 999, 2, 0] |
| em005_00:1 / :7 | _hit001 / _hit007 | [1] / [3] | [16, 999, 2, 0] / [16, 999, 2, 1] |
| em010_00:0 / :2 / :15 / :17 | _hit000 / 002 / 015 / 017 | [0] / [2] / [4] / [6] | [0, 9999, 2, 0] ×2, [0, 9999, 2, 1] ×2 |
| em013_00:0, em013_01:0 | _hit000 | [0] | [10, 1000, 2, 0] |
| em019_00:0 / :1 | _hit000 / 001 | [0] / [0] | [0, 9999, 2, 0] |
| em019_04:0 | _hit000 | **[1]** | [0, 9999, 2, 0] |
| em020_00:4 | _hit004 | [0] | [0, 999, 2, 0] |
| em020_04:0 / :1 | _hit000 / 001 | [0] / [1] | [14, 999, **31**, 0] / [0, 999, 2, 1] |
| em023_00:0 / :1, em023_05:0 / :1 | _hit000 / 001 | [0] / [1] | [26, 99, 2, 0] / [36, 99, 2, 1] |
| em024_00:0 / :1 | _hit000 / 001 | [0] / [1] | [0, 999, **3**, 0] / [0, 999, **21**, 0] |
| em033_00:1 / :5 / :6 | _hit001 / 005 / 006 | [1] / [5] / **[5]** | [2, 200, 2, 0] |
| em038_00:0 / :3 | _hit000 / 003 | [0] / [1] | [2, 130, 2, 0] / [2, 160, 2, 1] |
| em049_00:0 | _hit000 | [0] | [5, 999, 2, 0] |
| em050_00:0 | _hit000 | [0] | [0, 9999, **21**, 0] |
| em056_00:0 / :1 | _hit000 / 001 | [0] / [1] | [0, 999, 2, 0] / [0, 999, 2, 1] |
| em058_00:0 | _hit000 | [0] | [0, 88, 2, 0] |
| em067_00:0 | _hit000 | [0] | [0, 9999, 2, 0] |
| em081_04:4 / :5 | _hit004 / 005 | [0] / [0] | [0, 300, **49**, 0] |
| em082_00:0 / :2 | _hit000 / 002 | [0] / [0] | [2, 400, 2, 0] |
| em082_04:10 / :12 | _hit010 / 012 | [2] / [2] | [2, 400, 2, 1] |
| em084_00:1 / :2 / :5 / :14 / :52 / :54 | _hit001 / 002 / 005 / 014 / 052 / 054 | [1] / [1] / [3] / [2] / [4] / [5] | [0, 10000, 2, g] with g = 1 / 1 / 3 / 2 / 0 / 4 |

**Every BEAM_MODES mode, as mode:hit0** (each HitParam FUP has exactly one int; no mode lacks a HitParam):

| folder | mode:hit0 |
|---|---|
| `em004_00_shell02` | 1:0 |
| `em005_00_shell02` | 1:1 2:2 3:1 5:3 6:4 7:3 8:1 9:3 10:1 11:3 |
| `em010_00_shell02` | 0:0 1:1 2:2 3:3 4:0 5:1 6:1 9:1 10:1 13:0 15:4 16:5 17:6 18:7 19:4 20:5 21:5 24:5 25:5 28:4 |
| `em013_00_shell02` / `em013_01_shell02` | 0:0 / 0:0 |
| `em019_00_shell02` / `em019_04_shell02` | 0:0 1:0 / 0:1 |
| `em020_00_shell02` / `em020_04_shell02` | 4:0 / 0:0 1:1 2:2 3:3 |
| `em023_00_shell02` / `em023_05_shell02` | 0:0 1:1 2:2 (each) |
| `em024_00_shell02` | 0:0 1:1 |
| `em033_00_shell02` | 1:1 3:3 5:5 6:5 |
| `em038_00_shell02` | 0:0 1:0 2:0 3:1 4:1 5:2 6:2 7:2 |
| `em049_00_shell02` | 0:0 1:1 2:2 3:3 5:0 6:0 9:0 |
| `em050_00_shell02` | 0:0 |
| `em056_00_shell02` | 0:0 1:1 |
| `em058_00_shell02` / `em067_00_shell02` | 0:0 1:0 (each) |
| `em081_04_shell02` | 4:0 5:0 7:0 8:0 |
| `em082_00_shell02` / `em082_04_shell02` | 0:0 1:1 2:0 / 10:2 11:3 12:2 |
| `em084_00_shell02` | 0:0 1:1 2:1 3:4 4:0 5:3 6:3 7:0 8:1 9:1 10:4 11:0 14:2 20:5 21:5 25:5 26:5 30:5 31:5 36:5 37:5 50:0 51:0 52:4 53:4 54:5 55:5 56:1 57:1 58:5 59:5 60:0 61:0 62:5 63:5 |

Every hit 0 is a valid index into its folder's HITSHAPES hitrec (asserted).

### 3. Controls (all PASS, run by `beamreads.py`)

- **Positive, folder and hit.**
  - Neset sp_58 0x179 → res 0x8ac6 → `em087_00_shell58`. Its modes 0 / 1 / 2 give hit [0] each, which equals shells.js SHELL_DATA (make087s58 reads `HITSHAPES[def.folder]`).
  - Basarios shell01 0x6b → res 0x89b9 → `em004_00_shell01`. Its modes 0 / 1 give [0] / [1], which equals SHELL_DATA (EMC 2026-09-30).
- **Positive, folder.** Basarios / Gravios 0x6c / 0x6e → res 0x89ba / 0x89bc, as in the rom-map uEm004_00 rows. The Gammoth method (rom-map `0x48b784..0x48b7b0`) is unchanged.
- **The walk.** For every entry:
  - the EffectParam the walk finds for mode m is the `_ef%03d` the generator took for it;
  - its ShellScale equals the entry's `scale`.
- **The patch.** Removing the inserted text gives back the input byte for byte. A second run refuses ("already has folder / hit"). Node imports the output: 44 + 120 entries, all with folder and hit.
- **The generator.**
  - The unmodified generator, run to a scratch path, reproduces the repo's `beam-types.js` byte for byte.
  - The modified generator (`gen_beam_types.new.py <scratch path>`) produces a file **byte-identical to `patch_beam_types.py`'s output**.
  - `gen_beam_types.diff` applies cleanly. Use `git -c core.autocrlf=false apply`: with the global autocrlf=true it writes CRLF.

### 4. Worth knowing (not in the brief)

- **hit 0 ≠ the mode in 19 of 44 BEAM_TYPES and 82 of 120 BEAM_MODES entries.** For example: em005_00:7 → 3, em010_00:15 → 4, em019_04:0 → 1, em033_00:6 → 5, em081_04:4 / 5 → 0, em082_04:10 → 2, em084_00:52 → 4. Taking `hit = [mode]` would pick the wrong record.
- The hunter pass will meet record kinds other than 2 on hit 0:
  - em020_04:0: kind 31
  - em024_00:0 / :1: kinds 3 / 21
  - em050_00:0: kind 21
  - em081_04:4 / 5: kind 49 (0x31)

  How the hunter pass treats these kinds was not looked at.

## (b) The deliverables

- **`patch_beam_types.py [in] [out]`**
  - in: the repo file, read only.
  - out: `gapO\beam-types.patched.js` by default.
  - It inserts `, "folder": "<key>", "hit": [<ints>]` right after each entry's `"cls": "..."`, in BEAM_TYPES and BEAM_MODES alike (BEAM_MODES is what `spawnBeamReal` uses).
  - Line endings are kept: the file is LF.
  - It refuses an entry with no read, one that already has the fields, or a `cls` anchor that is not unique.
- **`gen_beam_types.diff`** (not applied) changes the generator in five places:
  1. A header note.
  2. `BEAM_ID` (monster → id, with sites), plus `shl_of()` (row → res → `0x159daa0` hash → the arc path; it asserts the row's class equals `CLASS[mon]`) and `hit_of()` (it refuses by name a mode with no HitParam or no ints).
  3. `shell_scales(T, base, hits)` records each mode's HitParam path in the same walk.
  4. `base = shl_of(...)` in place of the name-built path; then `folder` and `hit` are emitted right after `cls`.
  5. An optional output path in argv[1], defaulting to the repo file.

## (c) rom-map rows (for the lane to add)

| address / range | what | owner | status | detail |
|---|---|---|---|---|
| `0x4a23f4..0x4a246c` | **HitParam int(i), read whole**: `[S+0x1384]` (null → −1) vt+0x40 list; elem `[[list+0x10] + 4·byte [[S+0x136c]+8]]` (no bound; null → −1; no setup → mode 0xff); `0x48a4a8` = `[elem+0x10]` (null → −1); tail FUP vt+0x44 `0x3cb30c` (i ≥ +0x64 → 0). **Hit 0 is the int in the HitParam FUP named by the .shl's ShellInfoList[mode] entry**, not the mode number | enemy-shell base | R | gapO RESULT a2 (upgrades row `0x4a23f4`, and row "holder members" `+0x10 _hit` from R / I to R) |
| beam readers' hit 0 | `bl 0x4a23f4` (r1 = 0) → `str` +0x1654, once per reader: 0xd30ae8 0xd6cb64 0xd8bd34 0xd8ca84 0xdcdbf0 0xdce080 0xdce348 0xdee7d4 0xdfde70 0xe3e7dc 0xe63c18 0xec46b0 0xecfc74 0xeeb380 0xf0fd78 0xf78660 0x103171c 0x104eeec 0x1089748 | uShellEm*_02 | R (static) + E (readermap.json) | gapO a2 |
| beam shell ids → folders | 0x6c / 0x6e (res 0x89ba / 0x89bc) em004 / em005; 0x7d 0x89d0 em010; 0x84 / 0x88 / 0x8c 0x89d7 / 0x89db / 0x89df em013_00 / 01 / 02; 0x9a / 0x9c 0x89ed / 0x89ef em019_00 / 04; 0x9e 0x89f1 em020_00; 0xa0 0x89f3 em020_04; 0xa9 / 0xad 0x89fc / 0x8a00 em023_00 / 05; 0xb1 0x8a04 em024; 0xc2 0x8a15 em033; 0xd0 0x8a23 em038; 0xee 0x8a41 em049; 0xf1 0x8a44 em050; 0xf5 0x8a48 em056; 0xfe 0x8a51 em058; 0x123 0x8a76 em067; 0x153 0x8aa0 em081_04; 0x15a / 0x15e 0x8aa7 / 0x8aab em082_00 / 04; 0x169 em083_04; 0x16e 0x8abb em084 — each `<mon>_shell02` through `0x159daa0` (the name-built folder was right; now read). Spawn sites per dev/beams/<mon>.md, re-checked | base02 classes | R | gapO a1; beam-types.js `folder` (once applied) |
| `render/beam-types.js` `folder` / `hit` | folder = the id's .shl folder (row above); hit = the mode's HitParam ints (hit[0] → HITSHAPES[folder].hitrec). hit[0] ≠ mode in 19 / 44 BEAM_TYPES and 82 / 120 BEAM_MODES entries (em005 7→3, em010 15→4, em019_04 0→1, em033 6→5, em081_04 4→0, em082_04 10→2, em084 52→4 …) | viewer data | R | gapO `patch_beam_types.py` / `gen_beam_types.diff` |
| tooling: `gapO\shlinfo.py` / `beamreads.py` / `readersites.py` | the .shl ShellInfoList walk with each mode's ef / snd / hit / sh paths; per beam entry id → row → res → path → HitParam → hitrec, with the literal-site checks | — | — | controls: Neset 0x179 → em087_00_shell58 hit [0]×3 and Basarios shell01 0x6b → [0] / [1] = SHELL_DATA; each mode's ef path = the generator's `_ef%03d`, scale = the entry's; unmodified generator reproduces the repo file byte for byte, modified = patch output byte for byte |

**Trap (numbered list): a mode's hit record is not its mode number.**
- It is the int in the HitParam FUP that the mode's ShellInfoList entry names. For example, em033_00 mode 6 → `_hit006` = [5], and em010_00 mode 15 → [4].
- Read the FUP. Do not index hitrec by mode.

**WITHDRAWN:** none. The name-built folder held, so it is upgraded from fit to read rather than withdrawn.
