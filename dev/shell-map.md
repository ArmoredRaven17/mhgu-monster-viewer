# Shell id -> vtable: the whole map, and how it was got

Answers the one gap in the shell API that the Effects session flagged as blocking.
Scripts and data: `efx/agents/shells-scratch/`.

## The join

No emulator was needed -- it is two static scans that meet in the middle.

1. **name -> DTI object.** Every reflected class registers itself by calling
   `MtDTI::MtDTI` at **0x7abef0**. At each call the PIC setup is
   `ldr r0,[pc,#a] / ldr r1,[pc,#b] / ldr r0,[pc,r0] / add r1,pc,r1`, so the name string
   (`add r1,pc,r1`) and the DTI object's .bss address (a GOT-like slot in .data) are both
   readable at the site. `uShellEm043_sp_00` etc. are real strings in .rodata -- 204 `_sp_`
   names across 69 monsters -- so the id in the suffix is the ROM's own.
2. **DTI object -> its vtable.** The class's getDTI thunk is the 3-word PIC thunk
   `ldr r0,[pc,#imm] / ldr r0,[pc,r0] / bx lr` returning that DTI; the .data word holding
   that thunk is **vtable + 0x14**. (The same join that resolved all 98 enemy vtables.)

`build/arm/dti.json` was missing 68 of the 242 monster shell classes -- a contiguous run
between `uShellEm023_sp_00` (0x188c428) and `uShellEm058_sp_06` (0x188cd48), which is why
the four earlier routes had nothing to look up. Where dti.json HAS a class its dti wins;
the scan only fills gaps. On the 242 shell classes the two **agree everywhere they
overlap (174 of 242)** and the scan supplies the other 68.

## Result

**242 monster shell classes, 0 unresolved.** Ownership is read from the enemy class's own
code (each class loads its shell DTIs through GOT slots), not inferred from the names --
`classshells.json`, 70 enemy classes. It reproduces Effects' Deviljho list exactly:

    uEm043_00 -> uShellEm043_sp_00 / _sp_01 / _sp_04 / _sp_54 / _sp_55
    dti        0x188c8e8  0x188c908  0x188c928  0x188c948  0x188c968   (as Effects had)
    vtable     0x17c0d08  0x17c0e84  0x17c0ff4  0x17c115c  0x17c12cc   (new)

## Coverage against the 816 unwired records

| | records | monsters |
|---|---|---|
| monster has shell classes of its own | 636 | 65 |
| resolved through the enemy class it runs | 180 | 12 |
| **unresolved** | **0** | **0** |

The second row is 12 ids that have no shell classes of their own and do not need any, because
shells are owned by the enemy CLASS and they run someone else's: the deviants and subspecies
(em019_04, em023_05, em032_04, em043_05, em045_04, em057_04, em060_04, em061_04, em066_04,
em071_05, em080_04) plus **Shagaru Magala (em072_00)**, which runs `uEm071_00` -- that class
tests `+0xb5f4` against 71 AND 72 -- and so uses uShellEm071_sp_00 / _sp_01 / _sp_03 / _sp_11.
Ownership read from code, not a naming guess. **But ownership is of the CLASS, not of the data --
see the section below before reusing any entry between a base and its deviant.**

Two of those cross em numbers and corroborate the class-sharing map from a direction that had
nothing to do with it: **uEm019_00 owns em020's shells** (uShellEm020_sp_02, _04_01, _04_02 --
Daimyo Hermitaur's class carrying Shogun Ceanataur's, which is the pair that also shares
roEm019.cro), and **uEm060_00 owns em062's** (uShellEm062_sp_00 / _sp_01 / _sp_43 -- Arzuros's
class carrying Volvidon's, which is how em062 was resolved in `dev/notice-marks.md`).

One thing worth knowing for the viewer: **uEm083_00 owns both families at once** --
uShellEm083_sp_00 / _sp_00_02 / _sp_00_03 / _sp_01 / _sp_13 AND uShellEm083_04_00 / _04_02 /
_04_13. The `_04_` classes are Elderfrost's, selected at runtime by the same class, so a
per-monster shell table has to key on the variant byte `+0xb5f5`, not just the em number.

## Class is shared; DATA is not. Do not read the `(via ...)` rows as shared data.

A later question from Effects forced this apart, and it matters for the wiring.

* The shell **class** -- the code and the vtable, which is what this document maps -- is owned by
  the ENEMY class. That is why 12 ids have no classes of their own.
* The shell **data** -- the `rShellEffectParam` `.sep` files, one per mode, holding the
  `{listId, uniqueId}` pairs that say which record a mode fires -- is **per monster arc**. All 12
  of the `(via ...)` ids carry their own `<mon>_shellNN/` folders in their own `.arc`, with ids
  matching the classes their shared class owns.

The Rathian family is the clean demonstration. One class, `uEm001_00`, owning
uShellEm001_sp_00 / _sp_01 / _sp_11 -- and three completely different datasets for shell01's
reference to `u UNIQUE 60`:

| monster | shell01 modes firing u 60 |
|---|---|
| em001_00 Rathian | **none -- u 60 is not referenced by any shell in its arc** |
| em001_02 Gold Rathian | 3, 4 |
| em001_04 Dreadqueen | 3, 4, 5, 10, 11, 12, 31, 33 |

So a SHELL_DATA entry may never be shared between a base and its deviant on the strength of a
shared class. Read each monster's own `.sep` set. (Read from the `.arc`, not from
`scratch-em/<mon>/`: several of those are partial extractions -- `scratch-em/em001_02/` holds only
`enemy/`, which briefly had me believing Gold Rathian had no shells of its own.)

## The sharing census: measured, not assumed

Raven, 2026-09-28: "we assume each monster will need their own data, we simply check if they
share anything". So this is the check, over all **101 monsters that have shell data**:
`shellshare.py` parses every `.sep` in every arc into `{shell: {mode: [(listId, uniqueId)]}}`
and hashes it, so identical datasets fall out as identical hashes rather than being inferred
from a shared class, a shared cro or a sibling relationship.

**Per monster is the right default: whole-dataset sharing is 3 groups out of 101.**

| group | monsters |
|---|---|
| `c27a5cd6270f` | ems011_00 ems015_00 ems040_00 ems044_00 |
| `6734195809f8` | ems019_00 ems021_00 ems027_00 ems039_00 |
| `618b4581484a` | em023_00 em023_05 |

Only one of those is a large-monster pair: **Rajang and Furious Rajang are byte-identical**
across all three of their shells (00, 02, 22). The other two groups are small monsters.

### Siblings: 24 of 25 pairs DIFFER

Every base vs its deviant / subspecies, shell by shell:

| pair | identical shells | differing | only on the variant | only on the base |
|---|---|---|---|---|
| em001_02 vs em001_00 | -- | [0, 1] | -- | -- |
| em001_04 vs em001_00 | -- | [0, 1] | -- | -- |
| em002_02 vs em002_00 | -- | [0, 1] | -- | -- |
| em002_04 vs em002_00 | -- | [0, 1] | -- | -- |
| em007_04 vs em007_00 | -- | [1] | [7] | -- |
| em013_01 vs em013_00 | [2, 51] | [0, 1] | -- | -- |
| em013_02 vs em013_00 | -- | [0, 1, 51] | -- | [2] |
| em018_04 vs em018_00 | [1] | [0] | [7] | -- |
| em019_04 vs em019_00 | [1] | [2] | -- | -- |
| em020_04 vs em020_00 | -- | [2] | [1] | -- |
| em023_05 vs em023_00 **IDENTICAL** | [0, 2, 22] | -- | -- | -- |
| em032_04 vs em032_00 | -- | [0, 1] | -- | -- |
| em037_04 vs em037_00 | -- | [0, 1] | [45, 46] | -- |
| em043_05 vs em043_00 | -- | [0, 4, 54, 55] | -- | -- |
| em045_04 vs em045_00 | [13] | [1, 32] | [0] | -- |
| em057_04 vs em057_00 | -- | [1, 18] | -- | -- |
| em061_04 vs em061_00 | -- | [0, 19] | [13, 24] | -- |
| em063_05 vs em063_00 | -- | [1, 35] | -- | -- |
| em066_04 vs em066_00 | [13, 16] | [0] | -- | -- |
| em071_05 vs em071_00 | -- | [0, 1, 3, 11] | -- | -- |
| em079_04 vs em079_00 | -- | [1, 31, 40] | [0] | -- |
| em080_04 vs em080_00 | -- | [0, 1, 3] | -- | -- |
| em081_04 vs em081_00 | -- | [0, 1, 14, 15] | [2, 50] | -- |
| em082_04 vs em082_00 | [1] | [2, 12, 13] | [26] | -- |
| em083_04 vs em083_00 | -- | [0, 1, 13] | -- | -- |

So sharing has to be checked **per shell**, not per monster: 8 pairs have some identical shells
while differing on others, and 10 have shells the variant carries that the base does not.

### Sharing an enemy class shares NOTHING about the data

The pairs that share a class, from the ownership map, compared on their data:

| pair | identical | differing |
|---|---|---|
| em071_00 vs em072_00 | **none** | [0, 1, 3, 11] |
| em019_00 vs em020_00 | **none** | [2] |
| em001_00 vs em002_00 | **none** | [0, 1] |
| em004_00 vs em005_00 | **none** | [1, 2] |

Gore Magala and Shagaru run the same class and share **not one** of their four shells. Daimyo
Hermitaur and Shogun Ceanataur share a class AND `roEm019.cro` and still differ. Rathian and
Rathalos, Basarios and Gravios: all differ.

### What IS reusable: 13 generic shell datasets that cross families

Identical at the SHELL level on monsters with nothing else in common -- worth one shared
definition rather than thirteen copies:

* `ba5d52fb84e3` -- em008_00/shell13, ems011_00/shell00, ems015_00/shell00, ems040_00/shell00, ems044_00/shell00
* `03d2ca1426ca` -- em019_00/shell01, em019_04/shell01, em042_00/shell01, em044_00/shell01
* `0863a61729fe` -- ems019_00/shell00, ems021_00/shell00, ems027_00/shell00, ems039_00/shell00
* `4d30e4b26d23` -- em009_00/shell53, em013_00/shell02, em013_01/shell02
* `5da0917882ba` -- em013_00/shell51, em013_01/shell51, em050_00/shell02
* `e3da4b7b5246` -- em019_00/shell02, em022_00/shell01, em063_00/shell35
* `0863f0467c52` -- em009_00/shell44, em025_00/shell39
* `1379b27255b6` -- em009_00/shell52, ems022_00/shell00
* `3f780546beef` -- em020_04/shell01, em065_00/shell01
* `015325dbbabc` -- em050_00/shell00, em065_00/shell23
* `19a330bac37f` -- em058_00/shell00, ems023_00/shell00
* `46b02d1f2983` -- em071_05/shell00, em072_00/shell00
* `5399b4499048` -- em087_00/shell58, em088_00/shell58

`em087_00/shell58` = `em088_00/shell58` and `em071_05/shell00` = `em072_00/shell00` are the two
where the pair also shares a class; the rest are unrelated monsters reusing one effect set.

## CORRECTION (2026-09-29): the per-monster table below was WRONG, and the class NAME is not ownership

The table further down was built from each class's NAME -- uShellEm004_sp_00 attributed to em004. That
is wrong, and Basarios proved it. The ROM assigns shell ids in uEm004_00 at **0xd2e538**, branching on
the em number `+0xb5f4`:

    em == 4 Basarios : +0xcac4 = 0x6a, +0xcac8 = 0x6b, +0xcacc = 0x6c, +0xcad0 = 0x19d (unset)
    em == 5 Gravios  : +0xcac4 = 0x19d (unset), +0xcac8 = 0x6d, +0xcacc = 0x6e, +0xcad0 = 0x6f

(`0x19d` is the unset sentinel the ctor writes to all four slots; the code skips a slot holding it.)
Resolving those ids through the global table at 0x175c3e8 (12 bytes an entry: class DTI, setup DTI,
resource):

    0x6a uShellEm004_sp_00  res 0x89b8   |   0x6d uShellEm004_sp_01  res 0x89bb
    0x6b uShellEm004_sp_01  res 0x89b9   |   0x6e uShellEm005_sp_02  res 0x89bc
    0x6c uShellEm005_sp_02  res 0x89ba   |   0x6f uShellEm005_sp_13  res 0x89bd

So **Basarios's third shell is a class called uShellEm005_sp_02**, and **Gravios's first is called
uShellEm004_sp_01** -- they share two classes and differ only in the resource. The em prefix in a shell
class name is where the class was authored, not who uses it. What DOES hold is that the folder number
tracks the class SUFFIX: `sp_NN` <-> `<mon>_shellNN`, confirmed both ways (em004 ships shell00/01/02
against sp_00/sp_01/sp_02; em005 ships shell01/02/13 against sp_01/sp_02/sp_13).

**Measured scale of the error: 34 of 102 monsters disagreed** between the name-derived attribution and
the arc's own folders, in BOTH directions -- shells claimed that a monster does not ship (em037_00 was
given 45 and 46, which are em037_04's; em061_00 given 13 and 24, which are em061_04's; em086_00 given
56) and shells it does ship that were missed (em004_00 shell02, em005_00 shell01, em023_00 shell01,
em086_00 shell00).

**The class -> vtable map of 242 classes is NOT affected** -- name to vtable is sound. What was wrong is
only the per-monster attribution derived from it. The authoritative source for "which shells does this
monster have" is **its own .arc folders**, listed below; for the global id, the ctor's +0xb5f4 branch.

### Which shells each monster actually ships, from its .arc

| monster | shell folders in its own .arc | unwired shell records |
|---|---|---|
| em001_00 | shell00, shell01, shell11 | -- |
| em001_02 | shell00, shell01, shell11 | -- |
| em001_04 | shell00, shell01, shell11 | -- |
| em002_00 | shell00, shell01 | -- |
| em002_02 | shell00, shell01, shell11 | -- |
| em002_04 | shell00, shell01, shell11 | -- |
| em003_00 | shell00, shell01, shell03, shell05, shell13 | -- |
| em004_00 | shell00, shell01, shell02 | 4 |
| em005_00 | shell01, shell02, shell13 | 1 |
| em007_00 | shell01 | -- |
| em007_04 | shell01, shell07 | 7 |
| em008_00 | shell00, shell01, shell13 | 4 |
| em009_00 | shell00, shell01, shell13, shell44, shell52, shell53 | 8 |
| em010_00 | shell00, shell02 | 6 |
| em011_00 | shell01, shell11 | 3 |
| em012_00 | shell01, shell13 | 2 |
| em013_00 | shell00, shell01, shell02, shell51 | 7 |
| em013_01 | shell00, shell01, shell02, shell51 | 10 |
| em013_02 | shell00, shell01, shell02, shell11, shell51 | 13 |
| em016_00 | shell00, shell01, shell13 | 7 |
| em017_00 | shell00, shell01 | 2 |
| em018_00 | shell00, shell01 | 5 |
| em018_04 | shell00, shell01, shell07 | 9 |
| em019_00 | shell01, shell02 | 3 |
| em019_04 | shell00, shell01, shell02 | 2 |
| em020_00 | shell02 | 2 |
| em020_04 | shell01, shell02 | 5 |
| em021_00 | shell00, shell01, shell04 | 10 |
| em022_00 | shell00, shell01, shell13 | 10 |
| em023_00 | shell00, shell01, shell02, shell22 | 10 |
| em023_05 | shell00, shell01, shell02, shell22 | 10 |
| em024_00 | shell00, shell01, shell02, shell33, shell34, shell38 | 24 |
| em025_00 | shell00, shell01, shell13, shell39 | 7 |
| em027_00 | shell01, shell04, shell20, shell21 | 14 |
| em032_00 | shell00, shell01 | 7 |
| em032_04 | shell00, shell01 | 18 |
| em033_00 | shell01, shell02 | 6 |
| em034_00 | shell00, shell01, shell13 | 5 |
| em036_00 | shell00, shell01 | 14 |
| em037_00 | shell00, shell01 | -- |
| em037_04 | shell00, shell01, shell45, shell46 | -- |
| em038_00 | shell00, shell01, shell02 | 7 |
| em042_00 | shell00, shell01 | 4 |
| em043_00 | shell00, shell01, shell04, shell54, shell55 | 15 |
| em043_05 | shell00, shell01, shell04, shell54, shell55 | 15 |
| em044_00 | shell00, shell01 | 5 |
| em045_00 | shell01, shell13, shell32 | 6 |
| em045_04 | shell00, shell01, shell13, shell32 | 17 |
| em046_00 | shell00, shell01, shell11, shell25, shell26 | 18 |
| em047_00 | shell00, shell01 | 7 |
| em049_00 | shell01, shell02 | 4 |
| em050_00 | shell00, shell01, shell02, shell11, shell41 | 19 |
| em055_00 | shell01 | -- |
| em056_00 | shell02, shell47 | 8 |
| em057_00 | shell01, shell18 | 5 |
| em057_04 | shell01, shell11, shell18 | 16 |
| em058_00 | shell00, shell01, shell02, shell06, shell29, shell30, shell42 | 9 |
| em060_04 | shell00, shell01 | 6 |
| em061_00 | shell00, shell01, shell19 | 7 |
| em061_04 | shell00, shell01, shell13, shell19, shell24 | 15 |
| em062_00 | shell00, shell01, shell43 | 3 |
| em063_00 | shell01, shell11, shell35 | 10 |
| em063_05 | shell01, shell11, shell35 | -- |
| em065_00 | shell00, shell01, shell13, shell23 | 7 |
| em066_00 | shell00, shell01, shell13, shell16 | 21 |
| em066_04 | shell00, shell01, shell13, shell16 | 21 |
| em067_00 | shell01, shell02, shell13 | 6 |
| em068_00 | shell01, shell36 | 6 |
| em069_00 | shell00, shell01 | 6 |
| em070_00 | shell00, shell01, shell13 | 7 |
| em071_00 | shell00, shell01, shell03, shell11 | 11 |
| em071_05 | shell00, shell01, shell03, shell11 | 21 |
| em072_00 | shell00, shell01, shell03, shell11 | 20 |
| em076_00 | shell00, shell01, shell37 | 6 |
| em077_00 | shell01, shell27, shell28 | 8 |
| em079_00 | shell01, shell31, shell40 | 7 |
| em079_04 | shell00, shell01, shell31, shell40 | 11 |
| em080_00 | shell00, shell01, shell03 | 14 |
| em080_04 | shell00, shell01, shell03 | 19 |
| em081_00 | shell00, shell01, shell14, shell15 | 16 |
| em081_04 | shell00, shell01, shell02, shell11, shell14, shell15, shell50 | 18 |
| em082_00 | shell01, shell02, shell12, shell13 | 27 |
| em082_04 | shell01, shell02, shell12, shell13, shell26 | 29 |
| em083_00 | shell00, shell01, shell13 | 12 |
| em083_04 | shell00, shell01, shell02, shell13 | 21 |
| em084_00 | shell00, shell01, shell02, shell06, shell11, shell13, shell31, shell48 | 29 |
| em086_00 | shell00, shell01 | 5 |
| em087_00 | shell00, shell01, shell48, shell58, shell59 | 11 |
| em088_00 | shell00, shell01, shell48, shell57, shell58, shell60, shell61 | 26 |
| ems007_00 | shell00 | -- |
| ems011_00 | shell00 | -- |
| ems012_00 | shell00, shell01 | -- |
| ems015_00 | shell00 | -- |
| ems019_00 | shell00 | -- |
| ems021_00 | shell00 | -- |
| ems022_00 | shell00 | -- |
| ems023_00 | shell00 | -- |
| ems026_00 | shell00 | -- |
| ems027_00 | shell00 | -- |
| ems039_00 | shell00 | -- |
| ems040_00 | shell00 | -- |
| ems044_00 | shell00 | -- |

## Per monster

A shell id can carry a sub-variant (`uShellEm083_sp_00_02` is shell 00 sub 2); those show as
`00.2` below. They are separate classes with separate vtables on the same id.

| monster | unwired | shell ids -> vtable |
|---|---|---|
| em004_00 | 4 | 00=0x1798ee8, 01=0x1799064 |
| em005_00 | 1 | 02=0x17991d4, 13=0x1799350 |
| em007_04 | 7 | 01=0x179a978, 07=0x179aae8 |
| em008_00 | 4 | 00=0x179c130, 01=0x179c2ac, 13=0x179c41c |
| em009_00 | 8 | 00=0x179da38, 01=0x179dbb4, 13=0x179dd24, 44=0x179dea0, 52=0x179dffc, 53=0x179e15c |
| em010_00 | 6 | 00=0x179f448, 02=0x179f5c4 |
| em011_00 | 3 | 01=0x17a0348, 11=0x17a04b8 |
| em012_00 | 2 | 01=0x17a5738, 13=0x17a58a8 |
| em013_00 | 7 | 00=0x17a6e40, 01=0x17a6fbc, 02=0x17a712c, 51=0x17a72a8 |
| em013_01 | 10 | 00=0x17a7418, 01=0x17a7594, 02=0x17a7704, 51=0x17a7880 |
| em013_02 | 13 | 00=0x17a79f0, 01=0x17a7b6c, 02=0x17a7cdc, 11=0x17a7e58, 51=0x17a7fcc |
| em016_00 | 7 | 00=0x17a94a8, 01=0x17a9624, 13=0x17a9794 |
| em017_00 | 2 | 00=0x17ab560, 01=0x17ab6dc |
| em018_00 | 5 | 00=0x17ad114, 01=0x17ad290 |
| em018_04 | 9 | 07=0x17acfa8 |
| em019_00 | 3 | 00=0x17af398, 01=0x17af514, 02=0x17af684 |
| em019_04 | 2 | 00=0x17af398, 00=0x17afc68, 01=0x17af514, 01=0x17af800, 02=0x17af684, 02=0x17af970, 02=0x17afaec _(via uEm019_00)_ |
| em020_00 | 2 | 02=0x17afaec |
| em020_04 | 5 | 01=0x17af800, 02=0x17af970 |
| em021_00 | 10 | 00=0x17b0e00, 01=0x17b0f7c, 04=0x17b10ec |
| em022_00 | 10 | 00=0x17b1e40, 01=0x17b1fbc, 13=0x17b212c |
| em023_00 | 10 | 00=0x17b3110, 02=0x17b33fc, 22=0x17b3578 |
| em023_05 | 10 | 00=0x17b3110, 02=0x17b33fc, 22=0x17b3578 _(via uEm023_00)_ |
| em024_00 | 24 | 00=0x17b4760, 01=0x17b48dc, 02=0x17b4a4c, 33=0x17b4bc8, 34=0x17b4d2c, 38=0x17b4e90 |
| em025_00 | 7 | 00=0x17b6000, 01=0x17b617c, 13=0x17b62ec, 39=0x17b6468 |
| em027_00 | 14 | 01=0x17b75a0, 04=0x17b7710, 20=0x17b7878, 21=0x17b79dc |
| em032_00 | 7 | 00=0x17b9d48, 01=0x17b9ec4 |
| em032_04 | 18 | 00=0x17b9d48, 01=0x17b9ec4 _(via uEm032_00)_ |
| em033_00 | 6 | 01=0x17bad08, 02=0x17bae78 |
| em034_00 | 5 | 00=0x17a9914, 01=0x17a9a90, 13=0x17a9c00 |
| em036_00 | 14 | 00=0x17bc070, 01=0x17bc1ec |
| em038_00 | 7 | 00=0x17be538, 01=0x17be6b4, 02=0x17be824 |
| em042_00 | 4 | 00=0x17bfa30, 01=0x17bfbac |
| em043_00 | 15 | 00=0x17c0d08, 01=0x17c0e84, 04=0x17c0ff4, 54=0x17c115c, 55=0x17c12cc |
| em043_05 | 15 | 00=0x17c0d08, 01=0x17c0e84, 04=0x17c0ff4, 54=0x17c115c, 55=0x17c12cc _(via uEm043_00)_ |
| em044_00 | 5 | 00=0x17c2270, 01=0x17c240c |
| em045_00 | 6 | 00=0x17c3498, 01=0x17c3614, 13=0x17c3784, 32=0x17c3904 |
| em045_04 | 17 | 00=0x17c3498, 01=0x17c3614, 13=0x17c3784, 32=0x17c3904 _(via uEm045_00)_ |
| em046_00 | 18 | 00=0x17c4920, 01=0x17c4a9c, 11=0x17c4c0c, 25=0x17c4d80, 26=0x17c4ee0 |
| em047_00 | 7 | 00=0x17c5bc8, 01=0x17c5d44 |
| em049_00 | 4 | 01=0x17c6e40, 02=0x17c6fb0 |
| em050_00 | 19 | 00=0x17c8030, 01=0x17c81ac, 02=0x17c831c, 11=0x17c8498, 41=0x17c860c |
| em056_00 | 8 | 02=0x17ca618, 47=0x17ca794 |
| em057_00 | 5 | 01=0x17cbad8, 11=0x17cbc48, 18=0x17cbdbc |
| em057_04 | 16 | 01=0x17cbad8, 11=0x17cbc48, 18=0x17cbdbc _(via uEm057_00)_ |
| em058_00 | 9 | 00=0x17d4900, 01=0x17d4a7c, 02=0x17d4bec, 06=0x17d4d68, 29=0x17d4ed0, 30=0x17d5030, 42=0x17d5190 |
| em060_04 | 6 | 00=0x17d7288, 00=0x17d7574, 01=0x17d7404, 01=0x17d76f0, 43=0x17d7860 _(via uEm060_00)_ |
| em061_00 | 7 | 00=0x17d8b78, 01=0x17d8cf4, 13=0x17d8e64, 19=0x17d8fe0, 24=0x17d915c |
| em061_04 | 15 | 00=0x17d8b78, 01=0x17d8cf4, 13=0x17d8e64, 19=0x17d8fe0, 24=0x17d915c _(via uEm061_00)_ |
| em062_00 | 3 | 00=0x17d7574, 01=0x17d76f0, 43=0x17d7860 |
| em063_00 | 10 | 01=0x17da2d8, 11=0x17da448, 35=0x17da5bc |
| em065_00 | 7 | 00=0x17dbc20, 01=0x17dbd9c, 13=0x17dbf0c, 23=0x17dc088 |
| em066_00 | 21 | 00=0x17dd160, 01=0x17dd2dc, 13=0x17dd44c, 16=0x17dd5cc |
| em066_04 | 21 | 00=0x17dd160, 01=0x17dd2dc, 13=0x17dd44c, 16=0x17dd5cc _(via uEm066_00)_ |
| em067_00 | 6 | 01=0x17ded18, 02=0x17dee88, 13=0x17df004 |
| em068_00 | 6 | 01=0x17e0be8, 36=0x17e0d58 |
| em069_00 | 6 | 00=0x17e1f40, 01=0x17e20bc |
| em070_00 | 7 | 00=0x17e3ba0, 00.2=0x17e3d1c, 01=0x17e3e98, 13=0x17e4008 |
| em071_00 | 11 | 00=0x17e58a8, 01=0x17e5a24, 03=0x17e5b94, 11=0x17e5d10 |
| em071_05 | 21 | 00=0x17e58a8, 01=0x17e5a24, 03=0x17e5b94, 11=0x17e5d10 _(via uEm071_00)_ |
| em072_00 | 20 | 00=0x17e58a8, 01=0x17e5a24, 03=0x17e5b94, 11=0x17e5d10 _(via uEm071_00)_ |
| em076_00 | 6 | 00=0x17e77b0, 01=0x17e792c, 37=0x17e7a9c |
| em077_00 | 8 | 01=0x17e9010, 27=0x17e9180, 28=0x17e92e0 |
| em079_00 | 7 | 01=0x17ea844, 31=0x17ea9b4, 40=0x17eab14 |
| em079_04 | 11 | 00=0x17ea6c8 |
| em080_00 | 14 | 00=0x17ebd48, 01=0x17ebec4, 03=0x17ec034 |
| em080_04 | 19 | 00=0x17ebd48, 01=0x17ebec4, 03=0x17ec034 _(via uEm080_00)_ |
| em081_00 | 16 | 00=0x17ede90, 01=0x17ee00c, 14=0x17ee17c, 15=0x17ee2f8 |
| em081_04 | 18 | 01=0x17ed8a8, 02=0x17eda18, 11=0x17edb94, 50=0x17edd08 |
| em082_00 | 27 | 01=0x17ef4d4, 02=0x17ef644, 12=0x17ef7c0, 13=0x17ef92c |
| em082_04 | 29 | 26=0x17ef370 |
| em083_00 | 12 | 00=0x17f0a9c, 00.2=0x17f0c18, 00.3=0x17f0d94, 01=0x17f0f10, 13=0x17f1080 |
| em083_04 | 21 | 00=0x17f0628, 02=0x17f07a4, 13=0x17f0920 |
| em084_00 | 29 | 00=0x17f6918, 01=0x17f6a94, 02=0x17f6c04, 06=0x17f6d80, 11=0x17f6ee8, 13=0x17f705c, 31=0x17f71d8, 48=0x17f7338 |
| em086_00 | 5 | 01=0x17f9810, 56=0x17f9980 |
| em087_00 | 11 | 00=0x1809118, 01=0x1809294, 48=0x1809404, 58=0x1809574, 59=0x18096e0 |
| em088_00 | 26 | 00=0x1809838, 01=0x18099b4, 48=0x1809b24, 57=0x1809c94, 58=0x1809dec, 60=0x1809f58, 61=0x180a0b4 |
