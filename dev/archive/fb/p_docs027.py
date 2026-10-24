D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
spec = """
## 6. Teostra (em027_00) -- uEm027_00 (2026-10-18)

- **Which actions**: em027_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain027.py: (7, 0x2c) -> (7, 0x2e),
  (7, 0x2a) -> (7, 0x2d)). Shell actions reached: (4, 0x06), (2, 0x1f / 0x20), (7, 0x03 / 0x05 / 0x07 / 0x0a / 0x15 / 0x16 / 0x1a /
  0x21 / 0x23 / 0x24 / 0x25 / 0x26 / 0x2a / 0x2b / 0x2c), (1, 0x07 / 0x1b). Not reached (named): (7, 0x1b / 0x1d / 0x1e / 0x1f / 0x20 /
  0x22 / 0x28 / 0x29), (4, 0x0a). Class main 0xe1a408, vtable 0x17b65cc; the status-7 helpers by the table 0xe193a8 (48 offsets on
  e+0x73e1): 0xe173e0(e, side, kind) for (7, 0 / 1) kind 0 (no shell), (7, 0x1e / 0x1f) kind 1, (7, 0x2b / 0x2c) kind 2; 0xe17758(e,
  side, kind) for (7, 3) (0, 0), (7, 0x21) (1, 0), (7, 0x25) (0, 1), (7, 0x26) (1, 1); 0xe17ce8(e, sel) the nova; 0xe18a08(e, n) for
  (7, 0x0a / 0x15 / 0x16) 0 / 1 / 2; 0xe18588(e, kind) for (7, 0x1d) 1, (7, 0x2a) 2; 0xe19134(e, 0 / 1) for (7, 0x2d / 0x2e).
- **The makers** (cengen11; fb/motqx.py the clips; phase 2 of 0xe18a08 found by its body -- setMotion 0x208 behind the loop counter
  P+0x1a2, which motqx's answers do not reach):
  - (4, 0x06) L1 M7 f70: sp_01 4 at the owner's point and words.
  - (2, 0x1f) / (2, 0x20) L4 M16 f56 (0xe12f5c(e, 0 / 1)): sp_21 9 / 10; 10 is a LEADER (setup +0x12 = 1, +0x14 = e+0x73e8) and
    phase 2 (L0 M34) hands to (7, 0x2d).
  - (7, 0x03) / (7, 0x21) / (7, 0x26) L4 M6 f104: sp_04 0 / 1 / 1. (7, 0x25) L4 M6: sp_21 2 / 3 / 4 at f100 / 115 / 130 (0xe13168,
    +0x12 0) and sp_04 3 at f180.
  - (7, 0x05 / 0x07 / 0x1a / 0x23 / 0x24) phase 2 L4 M10 f50: sp_20 0 / 1 / 2 / 5 / 6, index 0. (The selector's mode table also gives
    3 / 4 / 7 / 8 to the unreached (7, 0x1b / 0x22 / 0x28 / 0x29).)
  - (7, 0x0a / 0x15 / 0x16) phase 2 L2 M8 f24: sp_04 2.
  - (7, 0x2a) L4 M4 f36 AND f40 (two): sp_21 8 at G rank (0x3a8430 >= 5), 11 below; leaders; at f84.. -> (7, 0x2d).
  - (7, 0x2b) / (7, 0x2c) L2 M10 / M11 f44 AND f48: sp_21 0 / 1 at G rank, 12 / 13 below; leaders; at f120.. -> (7, 0x2e).
  - vt+0x208 0xe10f7c by the motion id (fb/probe208.py: 0xb0944 stubbed, every frame literal alone, P+0x1bb poked): L2 M2 f52 sp_01 2
    -- 400 x the size ahead (block +0x54's sin / cos), y the ground, while block +0x44 <= the ground + 1000 and e+0x1054 == G+0x49
    (0xb6fac: the monster in the loaded area, true in the viewer); L0 M5 f186 sp_01 1 at block +0x40 while the fire aura is on (P+0x1bb
    not 0 / 0xff and P+0x5e08 bit 1 clear) or the action is (1, 7) (0x6fe88). L0 M5 is the clip of (1, 7) and of the rage roar (1,
    0x1b): rows (1, 7) always, (1, 0x1b) with the aura. Its other arms (L2 M12 / M4 / M13) arm hit records (0x7db70), not shells.
- **The classes**:
  - sp_01 0xb9 (base01): reader 0xe1ad60 -- ef 0 / 1 -> +0x15c8 / +0x15cc (both started by the init; mode 1's c 31 and c 34), 0x80 int
    0, 0x800 int 1, 4 int 2, 8 int 3, vec 0. Its init 0xe1ac9c: base01's, then +0x40 moved by the setup's +0x3e halfword (x / z by 400 x
    +-1.5625e-5 x u16(h << 8) / u16(h << 2), signs bits 0x100 / 4). Every maker writes 0 there but mode 10's second blast (e+0x73e8).
  - sp_04 0xba (base04): reader 0xe1af84 = Savage's 0xe82944 instruction for instruction (diffed); +0x158 0xe1b128: mode 3, life < 30:
    the length x max((life - 6) / 30, 0).
  - **BASE20** sp_20 0xbb, the nova's ring (ctor 0x409544, init 0x40968c, step 0x409d68, move 0x409e30, end 0x409f3c); reader 0xe1b2f0
    (ef 0, hit 0, ints 0 / 1 / 2 (the count), floats the radius / the scatter / the interval, vec 0, +0x15e8 = the turn table[index]:
    0x161f21c (0, 0x2000, .. 0xe000) for int 1 == -1, 0x161f23c (0, 0x8000, 0x2000, 0xa000, 0xe000, 0x6000, 0xc000, 0x4000) else).
    - Placement, int 0 != 0: the owner's point + (R sin a, 0, R cos a), a = u16(table + block +0x54), + the scatter (sx, 0, sz) and vec 0
      each turned Z, X, Y by the owner's words; the scatter is n = e+0x73e8 x index read as bits (0 with H73E8_STANDIN).
    - int 0 == 0 (modes 4 / 7 / 8, unreached): the target + (x, y, -100) turned Z, X, Y.
    - The leader (index 0): its clock reaches interval x (index + 1) -> +0x158 0xe1b418 makes the next pillar (index + 1); at count - 1 it
      ends. 8 pillars, 6 frames apart, 45 degrees (or opposite pairs) apart. The others live while their hit slot does.
  - **BASE21** sp_21 0xbc (ctor 0x40a214, init 0x40a318, step 0x40a7bc, move 0x40a8b8, end 0x40aa74); class init 0xe1b60c (+0x1634 =
    setup +0x14), reader 0xe1b650, vt+0x154 0xe1b794, +0x158 0xe1b844.
    - Setup: +0x10 the hit group, +0x12 the leader byte, +0x14 the second blast's +0x3e.
    - Init: the joint's position (0xc164c) or the unit's +0xe0.. (joint -1); the anchor that point; the words the owner's, Y + float 2
      degrees; int 1 == 0: +0x40 += (0, 0, float 3) turned Z, X, Y (the flame line, modes 2..7), sub-state 1; int 2 == 0: the anchor +=
      vec 0 turned by Y (modes 9 / 10: 650 ahead, 200 up). Ef 0 and ef 1 at +0x40 (each mode one live).
    - Move: sub-state 0 follows the joint for float 0 frames, sub-state 1 lives float 1 frames. A leader waits for the owner's action
      (7, 0x2d) / (7, 0x2e); 60 frames later it ends and +0x158 makes sp_01 0 (u 152) at the anchor. Mode 10's own move makes one more at
      50 frames (+0x1636 once), the count +0x1630 giving the second +0x3e = +0x1634.
- **Viewer**: SHELL_DATA.em027_00 (23 rows; code 'em027', spawn027). (7, 0x2d) / (7, 0x2e) rows on L4 M10 name the trigger: the shells
  read the play's action (stepShells ctx.ownerAction, the row the pick stands for). The aura: input.fireAura027 (the Fire Aura control).
  Rank: input.rank (G default).
- **Check**: dev/shells-teostra-check.mjs 33/33 -- the ROM's own runs, every maker, the leaders' trigger through the next play
  (emu_fb `actionAt`, 0x6fe88 unstubbed), the low-rank modes, the vt+0x208 rows. Controls: joint 3 / joint 4 moved, the facing, the
  owner's point, no trigger, the ground 1080 lower. Page 18/18.
- **Seen in the harness**: a pillar or blast made by the LAST unit of line 18 (a lone leader) is counted by the hit pass in the step it
  is made, before its first move: its slot life is one move shorter (the check's slot0Until lists; the module's line-18 order, INFERRED).
"""
p = D + r'\elder-dragon-shells-spec.md'
s = open(p, encoding='utf8').read()
s = s.rstrip('\n') + '\n' + spec
open(p, 'w', encoding='utf8').write(s)

p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
a = "| **BASE39** ctor / init"
i = s.index(a); i = s.rindex('\n', 0, i) + 1; j = s.index('\n', i)
rows = """| `0xe1a408` / `0xe193a8` | Teostra's action main / its status-7 table (48 offsets on e+0x73e1): 0xe173e0(side, kind) (7, 0 / 1 / 0x1e / 0x1f / 0x2b / 0x2c), 0xe17758 (7, 3 / 0x21 / 0x25 / 0x26), 0xe17ce8 (the nova), 0xe18a08 (7, 0xa / 0x15 / 0x16), 0xe18588 (7, 0x1d / 0x2a), 0xe19134 (7, 0x2d / 0x2e) | uEm027_00 | R | elder spec 6 |
| `0xe12f5c` / `0xe173e0` / `0xe17758` / `0xe18588` / `0xe18a08` / `0xe13168` | Teostra's shell makers: (2, 0x1f / 0x20) L4 M16 f56 sp_21 9 / 10 (leader, +0x14 e+0x73e8; p2 -> (7, 0x2d)); L2 M10 / M11 f44 + f48 sp_21 0 / 1 (12 / 13 below G), kind 2 leaders -> (7, 0x2e) at f120; L4 M6 f104 sp_04 0 / 1, (7, 0x25) sp_21 2 / 3 / 4 f100 / 115 / 130 + sp_04 3 f180; L4 M4 f36 + f40 sp_21 8 (11), kind 2 leaders -> (7, 0x2d); p2 L2 M8 f24 sp_04 2 (p2 = setMotion 0x208 behind P+0x1a2); 0xe13168 the sp_21 setup (+0x10 group, +0x12 byte, +0x14 0) | uEm027_00 | R + E | elder spec 6 |
| `0xe10f7c` (vt+0x208) shells | L2 M2 (0x202) f52 sp_01 2: 400 x size ahead on the ground, while block +0x44 <= ground + 1000 and 0xb6fac (e+0x1054 == G+0x49); L0 M5 (id 5) f186 sp_01 1 at block +0x40 while the aura (P+0x1bb not 0 / 0xff, 0xa1f0c(e, 2) clear) or 0x6fe88(e, 1, 7); L2 M12 / M4 / M13 arms: hit records only | uEm027_00 | R + E (fb/probe208.py) | elder spec 6 |
| `0xe1ad60` / `0xe1ac9c` / `0xe1af84` / `0xe1b128` | Teostra's sp_01 reader (0x80 / 0x800 / 4 / 8 by ints 0..3; ef 0 / 1) / sp_01 init (base01, then +0x40 by setup +0x3e) / sp_04 reader (= Savage's 0xe82944, diffed) / sp_04 +0x158 (mode 3, life < 30: length x max((life - 6) / 30, 0)) | uEm027_00 | R + E | elder spec 6 |
| `0xe1b2f0` / `0xe1b418` / `0x161f21c` / `0x161f23c` | sp_20 reader (ef 0, hit 0, ints 0..2, floats R / scatter / interval, vec 0, +0x15e8 = table[index]) / +0x158 the next pillar (mode, +0x10 = +0x1610, +0x20 group, +0x24 index) / the turn tables (int 1 == -1: 0, 0x2000 .. 0xe000; else 0, 0x8000, 0x2000, 0xa000, 0xe000, 0x6000, 0xc000, 0x4000) | uEm027_00 | R + E | elder spec 6 |
| `0xe1b60c` / `0xe1b650` / `0xe1b794` / `0xe1b844` | sp_21 init (+0x1634 = setup +0x14) / reader (ef 0 / 1, hit 0, ints joint / reach / vec, floats follow / life / degrees / reach, vec 0 copied) / vt+0x154 (mode 10 leader: -10, then once at 50 the blast) / +0x158 (sp_01 0 at the point; mode 10 by the count +0x1630, the second with +0x3e = +0x1634) | uEm027_00 | R + E | elder spec 6 |
| `0x409544` / `0x40968c` / `0x409d68` / `0x409e30` / `0x409f3c` | **BASE20** ctor / init (int 0 != 0: owner + R at table + Y, scatter and vec 0 turned Z X Y; == 0: target + (x, y, -100) turned) / step / move (the leader's chain by interval x (index + 1), its end at count - 1; the others by the hit slot) / end | uShellEmBase20 | R + E | elder spec 6 |
| `0x40a214` / `0x40a318` / `0x40a7bc` / `0x40a8b8` / `0x40aa74` | **BASE21** ctor / init (joint or unit +0xe0; Y + degrees; int 1 == 0 the reach turned Z X Y, sub 1; int 2 == 0 the anchor + vec turned Y; ef 0 / 1) / step / move (sub 0 follow, sub 1 life; the leader: (7, 0x2d / 0x2e) -> 60 frames -> end + vt+0x158 at the anchor) / end (both handles) | uShellEmBase21 | R + E | elder spec 6 |
"""
s = s[:j + 1] + rows + s[j + 1:]
a = "| `<scratchpad>\\fb\\emu_fb.py` options 2026-10-18 (2):"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + ("| `<scratchpad>\\fb\\emu_fb.py` options 2026-10-18 (3): `actionAt` {at, before, action} (the owner's e+0x73e0 before each depth-0 move from the step the play reaches `at`), `slot0Until` values may be LISTS (one life per flight of that key, in run order); TOFF base20 +0x15f0 / base21 +0x1618; `<scratchpad>\\fb\\probe208.py <class> <mon> <pokes>` (vt+0x208 by every list clip's motion id, 0xb0944 stubbed, 0xb6fac answered 1, every frame literal alone); `fb/emu_keep.py` (emu_fb keeping the cases / output: FB_EMU for a check); `fb/scanbase.py <addr>..` (every table id whose class init / step is one of those) | -- | Teostra: the leaders' blasts (none without actionAt + unstub 0x6fe88), the lone leader's first child (one move short without the list) | actionAt follows the module's step timing (a spawn one step after its tested frame) |\n") + s[j + 1:]
a = "104. **emu_fb's frame step"
i = s.index(a); j = s.index('\n', i)
traps = """105. **emu_fb stubs the current-action test 0x6fe88 to 0 (2026-10-18).** A shell or a vt+0x208 arm that asks "is the action (s, n)" never sees it in the harness: Teostra's L0 M5 blast for (1, 7) and every leading powder's trigger were absent from the ROM runs until the cases named `unstub: ['0x6fe88']`. Grep the band for `bl #0x6fe88` before calling a ROM run's silence a negative. (T)
106. **A module spawn is one step after the frame it tests (2026-10-18).** shells.js's line-4 tests the previous advance (F[k-2], F[k-1]], so a shell spawned for frame F is made at the step after F; its move k is the step at F + k. A harness input keyed on a step (actionAt) must count from there, or the trigger lands a move early. (T)
107. **A shell made by the last unit of line 18 has its hit slot counted before its first move (2026-10-18, module order INFERRED).** The walk stops at the unit that was last when it started, then the hit pass counts every slot: a lone leader's first child lives one move less than its siblings. (T; the ROM's own hit-pass order is not read.)
"""
s = s[:j + 1] + traps + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

p = D + r'\effect-runtime-engine.md'
s = open(p, encoding='utf8').read()
a = "| base39 | the poison cloud:"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + ("| base20 | a chain of placed effects: the leader makes the next every interval (index + 1) at a turn-table angle round the owner, ends at the count; the others live by their hit slot | `0x40968c` / `0x409d68` | elder 6 |\n"
                 "| base21 | a placed effect that follows a joint for a while, then holds; a leader waits for the owner's action, then ends and makes a child at its anchor | `0x40a318` / `0x40a7bc` | elder 6 |\n") + s[j + 1:]
a = "  - 104 (T) the frame-step global is null in emu_fb unless `frameStep`.\n"
assert s.count(a) == 1
s = s.replace(a, a + "  - 105 (T) emu_fb stubs the current-action test `0x6fe88`: `unstub` it for any arm that asks for an action.\n"
                     "  - 106 (T) the module spawns a step after the frame it tests: harness inputs keyed on steps count from there.\n"
                     "  - 107 (T, order INFERRED) a child of the last unit of line 18 has its hit slot counted before its first move.\n"
                     "  - (G) a shell that waits for its OWNER'S NEXT ACTION (Teostra's leaders) only acts when the play goes on: the module must be told\n"
                     "    the action the play stands for (shells.js ctx.ownerAction), and a lone clip shows the wait and the timeout, not the blast.\n")
a = "    `frameStep` / `dtp`.\n"
assert s.count(a) == 1
s = s.replace(a, "    `frameStep` / `dtp` / `creatorCopy` / `slot0Until` (a life per 'id:mode', or a list per flight) / `actionAt` (the owner's action\n    from a step on).\n")
open(p, 'w', encoding='utf8').write(s)

p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "      - [x] 2026-10-18 -- CHAMELEOS'S SHELLS"
i = s.index(a)
add = ("      - [x] 2026-10-18 -- TEOSTRA'S SHELLS (spec dev/elder-dragon-shells-spec.md 6): his fire breaths, the nova's ring of eight fire\n"
       "        pillars, the blast powder he breathes and its delayed explosions (after (7, 0x2d) / (7, 0x2e)), the flame line of (7, 0x25), the\n"
       "        dive's flare, the dust of L2 M2 and L0 M5's blast (the Fire Aura or (1, 7)). Check 33/33 against the ROM's own runs + page 18/18.\n"
       "        The powder explodes only when the play goes on to (7, 0x2d) / (7, 0x2e) -- a lone L2 M10 shows the powder fade.\n")
s = s[:i] + add + s[i:]
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')
