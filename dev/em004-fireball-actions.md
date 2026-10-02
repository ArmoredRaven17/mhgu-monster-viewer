# Basarios / Gravios: the "six fireball actions", read per action from the ROM

Raven's challenge was that six distinct actions resolving to one clip and one frame looked like a
tracer artefact. It is not. The ROM really does route all of them through one routine -- but the
six are *not* identical, and the differences are in the two places the first pass never looked:
the effect id and the attack record.

Class `uEm004_00`, shared by **em004 (Basarios)** and **em005 (Gravios)**. Module roEm004.

## 1. The six stubs are four instructions each and do nothing but pick a number

Status-7 action table base **0xd2c944**; entries are *offsets from that base*, not pointers.
Validated: all eight entries below resolve to the stub the action number predicts -- 8/8, no
mismatches.

    (7,0x05) -> 0xd2caf4   mov r0,r4 / mov r1,#0 / pop {r4,lr} / b 0xd2855c
    (7,0x07) -> 0xd2cd80                  r1,#1
    (7,0x0a) -> 0xd2cb68                  r1,#2
    (7,0x15) -> 0xd2cbb8                  r1,#3
    (7,0x0f) -> 0xd2ce18                  r1,#4
    (7,0x10) -> 0xd2ce28                  r1,#5
    (7,0x3b) -> 0xd2d05c                  r1,#6     <-- see section 5
    (7,0x3c) -> 0xd2d06c                  r1,#7     <-- see section 5

`pop {r4,lr}` then `b` is a TAIL CALL, not a return. So there is exactly **one** motion-set site
for all eight, and the first pass reporting "one clip, one frame" was reading the ROM correctly.

## 2. The one routine: 0xd2855c, a four-phase state machine

Phase byte is `[[unit+0x1428]+0x1a1]`. Jump table at 0xd28590 (offsets from 0xd28590):

    phase 0 -> 0xd285a0    phase 1 -> 0xd285dc    phase 2 -> 0xd28668    phase 3 -> 0xd286a4

**Phase 0** sets the phase to 1, then the single motion-set site:

    0xd285c0  movw r1,#0x203        ; list 2, motion 3
    0xd285c4  bl   0xafe84          ; setMotion, blend 6.0 (vmov.f32 s0,#6.0)
    0xd285d4  str  #240.0 -> [[unit+0x1428]+0x1bc]

**Phase 1** waits for the frame, then branches on the selector:

    0xd285dc  vldr s0,[pc,#0x2d0]   ; literal @0xd288b4 = 216.0   <-- the ONE frame constant
    0xd285e4  bl   0xb0974          ; motion reached frame s0?
    0xd285ec  bne  0xd28818         ; not yet
    ...
    0xd28608  sub  r0,r5,#1         ; r5 = the stub's selector
    0xd2860c  cmp  r0,#6
    0xd28610  bhi  0xd286c8         ; selector 0 -> default arm
    0xd28620  add  pc,r0,r1         ; table at 0xd28624

**Phase 2** waits for a second frame then sets **L2 Motion[4]** (`mov r1,#0x204`, 0xd28698).
**Phase 3** ends the action via `[vtable+0x3dc]`.

## 3. Frame 216 IS inside the clip -- the LMT counts in 60ths

`em005_00_2` slot 3 header: `tracks=70660, nTracks=39, frameCount=235, loopFrame=222`.
The viewer's `dur` confirms that field layout across every slot in the file:

    slot 1  frameCount 371, no loop   dur 6.183  x60 = 370.98
    slot 2  frameCount 345, no loop   dur 5.750  x60 = 345.00
    slot 3  frameCount 235, loop 222  dur 3.700  x60 = 222.00   <-- _start is frames 0..222
    slot 4  frameCount 153, no loop   dur 2.550  x60 = 153.00

`Motion[3]_start`'s 3.700 s is derived from the **loop** frame, not the total. The clip runs 235
frames; **frame 216 is 3.600 s in, 0.100 s before the loop point.** There is no unreachable-frame
problem. (Multiplying `dur` by 30 gives 111 and makes it look out of range -- that is the trap.)

## 4. The selector arms: this is where the six differ

Table at 0xd28624 (offsets from 0xd28624). Every arm has the same two-step shape -- request an
effect through `[vtable+0x1d0]`, then arm an attack record through
`0x7db70(unit, index, hitId, flags)` -- but the numbers are all different.

| sel | action | arm | effect id | hit id | flags |
|----:|--------|-----|----------:|-------:|------:|
| 0 | (7,0x05) | 0xd286c8 | 0x3eb = **1003** | 0x0e | 0x400 |
| 1 | (7,0x07) | 0xd28640 | 0x3ea = **1002** | 0x0d | 0x400 |
| 2 | (7,0x0a) | 0xd286f0 | 0x3e9 = **1001** | **0x10 if em==4, else 0x2d** | 0x1400 |
| 3 | (7,0x15) | 0xd28728 | 0x3ed = **1005** | 0x0f | 0x400 |
| 4 | (7,0x0f) | 0xd28750 | 0x3ec = **1004** | 0x36 | 0x400 |
| 5 | (7,0x10) | 0xd28778 | 0x3ee = **1006** | 0x37 | 0x400 |
| 6 | (7,0x3b) | 0xd287a0 | 0x3f0 = **1008** | 0x3a (idx0) + 0x38 (idx1) | 0x400 |
| 7 | (7,0x3c) | 0xd287dc | 0x3ef = **1007** | 0x3b (idx0) + 0x39 (idx1) | 0x1400 |

Selector 2 is the only arm that branches on the monster: `ldrb r0,[unit+0xb5f4] / cmp r0,#4 /
movweq r2,#0x10` (0xd2870c..0xd28720) -- **Basarios arms hit 0x10, Gravios arms hit 0x2d.**
Both records are byte-identical in each monster's own table, so the split changes the slot, not
the values.

**No arm spawns a shell.** The scan of 0xd28624..0xd28820 finds only `ldr r3,[r0,#0x1d0]` (the
effect request) and `bl 0x7db70` (the attack record). Zero shell-slot loads.

Cross-check against Effects' independent read of the `.efl` row masks: effect ids map to pel keys
1001->u 0, 1002->u 30, 1003->u 60, 1004->u 70, 1005->u 90, 1006->u 100, 1007->u 10, 1008->u 40.

## 5. (7,0x3b) and (7,0x3c) exist, are fully coded, and are never issued

They are real table entries reaching real arms with effect ids 1007/1008 -- exactly Gravios's
`u 10` and `u 40`, the two records standing as named refusals. So the refusal is no longer "we
cannot find where these come from"; it is **"we know exactly where they come from and nothing
calls it."**

Neither `em004_00_cmdtbl` (19104 bytes) nor `em005_00_cmdtbl` (20432 bytes) contains the action.
Scanning both for the op-00 byte pattern `00 07 NN` finds all six of the issued numbers
(0x05 x2, 0x07 x1, 0x0a x5, 0x0f x2, 0x10 x2, 0x15 x2) and **zero** occurrences of 0x3b or 0x3c.

*Method limit, stated rather than hidden:* that is a raw byte scan, not a walker parse, so a
misaligned match is possible in principle -- but it is a negative result over ~40 KB that finds
every positive control, and I have **not** searched for a code-side issuer (an action requested
from C++ rather than from a command stream). `u 10` / `u 40` stay refusals on that basis.

## 6. The attack records -- the six are three shapes, not six attacks

`0x7db70` fetches a 32-byte record via `0x70f40(unit, hitId)`:

    hitId >= 1000 -> table [unit+0x75d8], id -= 1000
    hitId <  1000 -> table [unit+0x75d4]
    count = [[table+0x64]+8]   data = [table+0x68]   record = data + id*32   (bounds-checked)

File: `enemy\hit_data\emNNN_00_attackdata` (type 70bb64ba), 16-byte header + 74 x 32 bytes.
All ids here are < 1000, so they use the normal table.

    id    action / key             32 bytes
    0x0d  (7,0x07) key 30   00 00 3c 00 00 00 01 00 30 00 00 09 01 00 00 00 01 00 00 00 00 00 00 00 0a 0a 02 00 fe 0a 05 00
    0x0e  (7,0x05) key 60   00 00 3c 00 14 00 02 00 30 00 00 28 01 00 00 00 02 00 00 00 00 00 00 00 28 0a 02 00 08 0a 05 00
    0x0f  (7,0x15) key 90   00 00 3c 00 1e 00 02 00 30 00 00 28 01 00 00 00 00 00 01 00 00 00 00 00 28 0a 02 00 07 0a 05 00
    0x10  (7,0x0a) key 0    00 00 3c 00 1e 00 02 00 30 00 00 28 05 00 00 00 00 00 00 00 00 00 00 00 00 0a 02 00 07 0a 05 00
    0x36  (7,0x0f) key 70   00 00 3c 00 14 00 02 00 30 00 00 1e 01 00 00 00 02 00 00 00 00 00 00 00 14 1a 02 00 08 0a 05 00
    0x37  (7,0x10) key 100  00 00 3c 00 19 00 02 00 30 00 00 1e 01 00 00 00 00 00 01 00 00 00 00 00 19 1a 02 00 07 0a 05 00

(em005's bytes are identical except byte[30], which is 0x05 for every em004 record and 0x00 for
every em005 record -- a per-monster constant, not a per-attack value.)

**The pairing Effects found in the `.efl` row masks is present in this file too, from a different
source entirely.** Effects: keys 60/90 draw rows [3,4,5,6] (with flare), keys 70/100 draw rows
[12,13] (the same two models, no billboards), pairing 60<->70 and 90<->100. The attack records:

    key 60 -> 70   byte[4] 0x14 = 0x14   byte[16] 0x02 = 0x02   byte[28] 0x08 = 0x08   byte[11] 0x28 -> 0x1e
    key 90 -> 100  byte[18] 0x01 = 0x01                         byte[28] 0x07 = 0x07   byte[11] 0x28 -> 0x1e

Each pair keeps its distinguishing bytes and drops byte[11] from 0x28 to 0x1e. Two independent
files, same pairing, neither read using the other.

So the honest answer to "six attacks or six variants of one" is **neither extreme**: three
distinct attack shapes, two of which have a flare / no-flare variant --

    key 30  (0x0d)       byte[11] 0x09, byte[6] 0x01   -- the odd one out, much lower
    key 0   (0x10/0x2d)  byte[11] 0x28, byte[12] 0x05
    key 60 / key 70      (0x0e / 0x36)   a pair, 0x28 -> 0x1e
    key 90 / key 100     (0x0f / 0x37)   a pair, 0x28 -> 0x1e

**Refusal on field semantics.** byte[11] moving 40 / 30 / 9 across these records behaves like
attack power, and byte[4] like an element or status value, but I have not traced a single consumer
of any field in this record, so I am not naming them. The groupings above are byte-position facts
and stand on their own; the labels would be a guess.
