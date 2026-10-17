# Deviant special pigments -- which index is which Deviant (research agent for the Viewer agent, 2026-10-15)

Question (Raven, through the Viewer agent): the Monster Viewer shows Soulseer with `#FE97F0` (light pink),
his memory of Soulseer is "a gray or a reddish color". The task board's 18 pairs were mapped to Deviants by
**ResultMsg string order (INFERRED)**, and Grimclaw (11) / Boltreaver (16) were already swapped by eye.
Read the index -> Deviant binding from the code.

**Answer: the code binds index i to the same Deviant the board already names, all 18 rows. Nothing
differs from the board's table. The Grimclaw / Boltreaver swap Raven made in the viewer is NOT what the
ROM says (see section 4). Soulseer is index 15: `#312425` / `#FE97F0`.**

Indices below are 0-based `i` (the code's register); the board's list is 1-based (`i + 1`).

## 1. The chain, three independent bindings on one register

### 1a. Unlock bit i <- the EX quest 4(01+i)16 cleared  (READ)

- `0x525534(save, bit)` is the ONLY bit setter of `save+0xd18` (word `bit>>5`, mask `1<<(bit&31)`;
  mirrors into `+0xd1c` / `+0xd20` the first time). The board's `0x525540` is 3 instructions into it
  (`push {fp,lr}` at `0x525534`, `and r2,r1,#0x1f` / `lsr r1,r1,#5` before it). Whole-binary BL scan:
  **one caller, `0x3f0cbc`**. Whole-binary scan of `ldr/str [rX,#0xd18]`: every other store at that offset
  is in `0xbfa..0xbfc` (another class); the `0x1890dd8` save object's other `+0xd18` hits are all loads
  (`0x522ca4`, `0x525580/94`, `0x567f54 .. 0x5742ec`, `0x71c100`, `0x727c28`, `0x757164`, `0x758170`).
- `0x3f0c58` (called from `0x384698`), the loop that calls it:

      for (i = 0; i != 18; i++) {                 ; 0x3f0cc4 cmp r4,#0x12
        v = QUESTS[i];                            ; GOT 0x18357f4 -> 0x1623e04 (.rodata, 18 x u32)
        q = v + 16 - v % 100;                     ; 0x3f0c8c..0x3f0c9c (umull 0x51eb851f, mls #100)
        if (0x523084(save + 0x42c, q) == 1)       ; per-quest bit lookup
          0x525534(save, i);                      ; set unlock bit i
      }

  `save` is `[GOT 0x1831cb4] = 0x1890dd8` for both the lookup and the setter.
- `0x1623e04` = `40101, 40201, ..., 41201, 41311, 41411, ..., 41811` -> `q` = **`40116 + 100*i`** for all
  18 (the last six start at level 11, the GU Deviants having no low-rank levels; every one normalises to
  level **16**).
- `0x523084(bits, questId)` walks the quest list at `[[GOT 0x1831c54]+0xb4]` (count at `+0x64`, entries via
  `0x39b3e8`, id at `+4`), takes the matching entry's index `k`, and returns bit `k` of the byte array at `save+0x42c`.
  That it is the "cleared" bit is INFERRED from what it does (per-quest flag looked up by quest id); the
  quest-id -> bit binding itself is READ.

### 1b. Quest 4(01+i)16 -> its target  (file data; the reader of the field NOT read)

`romfs/nativeNX/loc/quest/questData/questData_00{q}.ext` (329 bytes each): u32 at `+0xc` is the quest
id (`0xa22c` = 41516 in Soulseer's), and the byte at **`+0x20`** (repeated at `+0x64`) is the target's
**em number** -- it equals the viewer's em id for all 18 (0x52 = em082 Mizutsune, 0x51 = em081 Astalos,
0x20 = em032 Tigrex, 0x53 = em083 Gammoth, ...). The quest's own text,
`eng/quest/questData/questData_00{q}_eng.gmd`, names the target ("Hunt a Soulseer Mizutsune").
Status: the em-number reading of `+0x20` is INFERRED (18 / 18 match plus the text; the `.ext` parser's
consumer of `+0x20` was not read). The quest text is the game's own string for that quest id.

### 1c. The pigment menu draws index i with bit i, pair i and name 159+i  (READ)

`0x57425c` (the board's `0x5742d0` is its loop head), loop `r5 = 0..17` (`0x574424 cmp r5,#0x12`):

- `tst [save + (r5>>5)*4 + 0xd18], 1<<r5` (`0x5742ec/f8`; `save` = `[GOT 0x1831cb4]`, the same object
  `0x3f0c58` writes) -- locked -> string 0x57 of category 0 and grey `0xff929292` (`0x5743ac`).
- unlocked -> name = `0x55a74c(obj, 7, HALF[r5])` with `HALF` = `0x16293dc` (r8, `+2` per step at
  `0x574420`) = **159, 160, ..., 176**; colours = `0x55f474(_, r5, 0)` / `(_, r5, 1)` -> painted by
  `0x54644c` as the swatch.
- `0x55f474` IGNORES r0: `ldr r0,[GOT 0x18380cc]` -> `0x18921b4 + i*8 + which*4`.
- The same pattern (bit r5, `HALF[r5]`, pair r5) is the second reader at `0x568bdc` (loop at `0x568c54`).

String ids 159..176 are, in `eng/table/ResultMsg_eng.gmd`, the label entries **`Color_Special_1..18`**
(entry k carries string index k, checked at 159 / 160 / 173 / 174 / 176) and their strings are
Redhelm .. Bloodbath. It is the only English GMD with `Color_Special` labels. **Not resolved:** which file
category 7 opens at run time -- emulating `init_array` gives the category record at `0x1892084 + 7*16` =
`{type 5, 0x29, 0, 1}`, so `0x55a74c` asks group 1 file 41 (or group 4 file 1 when `0x3f7a0c` is 0);
the group / file -> GMD name list is filled at run time and was not followed. So the NAME binding is
INFERRED (ids match ResultMsg's labels exactly); the bit and quest bindings above do not depend on it.

### 1d. The pairs  (READ, by emulation)

`build/arm/emu.py`, `Emu()` + every `init_array` entry (0 faults; `0x560bd4` is one of them); then
`0x55f474(_, i, 0|1)` called for i = 0..17. Every word's last writer is `0x560bd4`. Values identical to
the task board's 18 pairs. u32 is `0xAABBGGRR` (board, from the converter at `0x5daad4`).

## 2. The table

| i | board # | Deviant (quest, em) | colour A | colour B | `0x1623e04[i]` | menu string | vs board |
|---|---|---|---|---|---|---|---|
| 0 | 1 | Redhelm Arzuros (40116, em060) | #0089EC | #FF4033 | 40101 | 159 Redhelm | same |
| 1 | 2 | Snowbaron Lagombi (40216, em061) | #FFFFFF | #8F43FF | 40201 | 160 Snowbaron | same |
| 2 | 3 | Stonefist Hermitaur (40316, em019) | #971F2D | #FCBAC4 | 40301 | 161 Stonefist | same |
| 3 | 4 | Dreadqueen Rathian (40416, em001) | #400F5B | #FF0FBF | 40401 | 162 Dreadqueen | same |
| 4 | 5 | Drilltusk Tetsucabra (40516, em066) | #3A0A00 | #FF763B | 40501 | 163 Drilltusk | same |
| 5 | 6 | Silverwind Nargacuga (40616, em037) | #212121 | #FFFFFF | 40601 | 164 Silverwind | same |
| 6 | 7 | Crystalbeard Uragaan (40716, em045) | #4B410D | #FEE68D | 40701 | 165 Crystalbeard | same |
| 7 | 8 | Deadeye Yian Garuga (40816, em018) | #293F14 | #CDFAD0 | 40801 | 166 Deadeye | same |
| 8 | 9 | Dreadking Rathalos (40916, em002) | #060000 | #FF2121 | 40901 | 167 Dreadking | same |
| 9 | 10 | Thunderlord Zinogre (41016, em057) | #413509 | #FFF546 | 41001 | 168 Thunderlord | same |
| 10 | 11 | **Grimclaw Tigrex** (41116, em032) | #002D6B | #93F8FF | 41101 | 169 Grimclaw | same as board; **viewer has it swapped** |
| 11 | 12 | Hellblade Glavenus (41216, em080) | #560000 | #FF8E00 | 41201 | 170 Hellblade | same |
| 12 | 13 | Nightcloak Malfestio (41316, em079) | #000217 | #273FE5 | 41311 | 171 Nightcloak | same |
| 13 | 14 | Rustrazor Ceanataur (41416, em020) | #15274B | #BCFFFE | 41411 | 172 Rustrazor | same |
| 14 | 15 | **Soulseer Mizutsune** (41516, em082) | **#312425** | **#FE97F0** | 41511 | 173 Soulseer | same |
| 15 | 16 | **Boltreaver Astalos** (41616, em081) | #4DBF00 | #9CD3FF | 41611 | 174 Boltreaver | same as board; **viewer has it swapped** |
| 16 | 17 | Elderfrost Gammoth (41716, em083) | #292930 | #C5DEE4 | 41711 | 175 Elderfrost | same |
| 17 | 18 | Bloodbath Diablos (41816, em007) | #1E32F0 | #FF2929 | 41811 | 176 Bloodbath | same |

The ResultMsg-order mapping was right; what was INFERRED is now READ through the unlock path (1a) for
every row, with the quest target (1b) and the menu label (1c) agreeing.

## 3. Soulseer

`#312425` / `#FE97F0`. The first colour is a near-black warm (reddish) grey -- R 0x31 > G 0x24 -- which is
the "gray or a reddish color" Raven remembers; the second is the light pink the viewer shows, because
the viewer's rule is "use the second color" (Raven, 2026-10-10). The Challenge Run / Zenny Gauntlet
`#DC6F9E` is those apps' own hand-picked theme colour (no ROM source), in the pink family of the second
colour. The Armor Viewer's `['Soulseer', '#312425', '#fe97f0']` is the ROM's pair.

## 4. The control: Raven's Grimclaw / Boltreaver swap -- explained, not reproduced

The method does NOT reproduce the swap: index 10 is bound to quest 41116 (Grimclaw) and to name 169
"Grimclaw", index 15 to 41616 (Boltreaver) and 174 "Boltreaver", by the same register that picks the pair.
The game therefore shows Grimclaw's pigment as `#002D6B / #93F8FF` and Boltreaver's as
`#4DBF00 / #9CD3FF`; `mhgu-armor-viewer` (`docs/index.html` ~2495 / 2500) has exactly that.

Why Raven saw them as swapped: the two SECOND colours are near neighbours (`#93F8FF` cyan,
`#9CD3FF` sky blue), and his reference was the Challenge Apps' hand-picked themes -- Boltreaver
`#22D3DB` (cyan), Grimclaw `#3070D0` (blue). Against those, the cyan one "belongs" to Boltreaver, so
the swap matches the Challenge Apps, not the game. Whether the viewer keeps Raven's swap is Raven's
call; the ROM's binding is the table above.

Positive control for the chain itself: the emulated pairs reproduce all 18 board values word for word,
and an extra constant in the same menu loop fits the bound colours -- `0x574348..0x574364` picks DARK
label text (`0xff0f1928`) only for `r5 == 1` and `r5 == 15`, the two entries whose colour A is light
(Snowbaron `#FFFFFF`, Boltreaver `#4DBF00`); every other entry gets light text `0xffe6e6e6`.

## 5. Aside: entries 18..23 on the board are in the wrong channel order

The board's six extra pairs (after entry 17) were written as 0xAARRGGBB. Read as 0xAABBGGRR they are
`#E6E6E6/#FFFFFF, #BEBEBE/#FF0000, #FFFF50/#0080FF, #00FF00/#D1BA3F, #FF8400/#F011EE, #6FE8ED/#5F5F5F`.
Still unidentified (the menu loops stop at 18).

## 6. Not read (NR)

- Which GMD file message category 7 opens at run time (group 1 file 41 / group 4 file 1 -> name): the
  name binding rests on the label match only.
- The consumer of the quest `.ext` byte `+0x20` (em number by 18 / 18 match + quest text).
- That `save+0x42c` is specifically the "quest cleared" array (it is a per-quest-index bit array,
  looked up by quest id).
- The equip path's selection -> stored 5-bit id (`menu+0x108`, setters at `0x726ed4`, `0x7273f0`,
  `0x7275d4`) was not traced to confirm id = i + 2 at the menu end; `0x56e228` (id - 2 -> pair) is the
  board's read.

Scratch (session, not kept): `d.py` (BL-caller scan, PIC literal resolve), `emu1.py` (init_array + getter).
