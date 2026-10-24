# Alatreon (em050_00) shells -- working notes (scratch, 2026-10-19)

Ids: 0xef sp_00 (base00; init 0xecf56c = 0x3f8b80 then +0x15c1 = 1; reader 0xecf594; landing 0xecf6e4), 0xf0 sp_01 (base01, reader
0xecf990), 0xf1 sp_02 (base02g beam: already in beam-spawns.js (7, 0xe) L2 M11 f22; reader 0xecfc04, +0x158 0xecfdb8), 0xf2 sp_11
(base11, reader 0xecff90, +0x168 0xed0140), 0xf3 sp_41 (BASE41 NEW: init 0x41f410, step 0x41fbe8, landing +0x150 0x41eed4, end
0x420348, ctor 0x41f210; class +0x15c 0xed0a38 / +0x160 0xed0a3c / +0x164 0xed0aa8 / +0x16c 0xed0aac; reader 0xed0478).

sp_00 reader 0xecf594: ef 0 +0x15c8, ef 1 +0x15cc, ef 2 +0x15d4, ef 3 +0x15d0 (sic: 2 and 3 swapped); hit 0 +0x15d8; int 0 joint
+0x15dc; floats 0..4 -> +0x15ec / +0x15f0 / +0x15f4 (vz) / +0x15f8 (vy) / +0x15fc (flight); vec 0 -> +0x1610, vec 1 -> +0x161c. Flags
the ctor's 0.
sp_00 landing 0xecf6e4(shell, c, ?, type): 0 -> 0x3f8970(+0x15cc) then end; 1 -> 0x3f8970(+0x15d0), 0xecf770 (an sp_01 by mode:
table[mode] for mode <= 2 -- READ the table), end; 2 -> 0x3f8970(+0x15d4) (no end call: tail).
sp_01 creator 0xecf770: id 0xf0, mode = table 0xecf864-relative[mode] (mode <= 2, else 0), +0x10 the contact, +0x30.. a GOT vec
(words), +0x3c 0xffff, +0x20 GOT vec.

Census (cen11_ed050_*; reach050.txt from chain050.py -- 7:0x48..0x51 NOT reached):
  4:0x09 / 0x0f p2 L1 M10 f6 sp_00 2 (0xec6754)
  7:0x02 / 0x21 p1 L2 M6 f76 sp_00 0 / 1 (0xec7c74)
  7:0x06 p3 L2 M1 f2 sp_01 2 (0xec8200)
  7:0x0d / 0x40 p2 L2 M8 f24 / 26 / 30 sp_41 5 / 6 / 7 and 2 / 3 / 4 (0xec8a60 / 0xec8b74 / 0xec8c84)
  7:0x0e / 0x25 p2 f22 sp_02 0 (the beam, built)
  7:0x18 p1 L2 M5 f170 sp_01 2
  7:0x19 p0 L2 M21 sp_41 0 (no frame test: three sites 0xec9c78 / 0xec9d70 / 0xec9e50)
  7:0x1a p1 L0 M14 f164 / 224 / 284 sp_01 3
  7:0x36 / 0x37 p1 L2 M6 f74 sp_11 0 / 1; 7:0x38 / 0x39 p1 L2 M7 f164 sp_11 2 / 3
  7:0x3f p1 L2 M7 f96 / f164 sp_01 5
  (phase clips: motqx still to run; phase 2 / 3 clips may differ from the listed phase-0 clip -- trap 88)

base41 band 0x41ee98..0x420478 (b41.txt): 0x41eed4 = vt+0x150 the landing (type 0 -> +0x15e8 / 5, 2 -> +0x15f4 / 8, 1 -> by the
contact's halfword +8 & 0x1040: set -> +0x15f0 / 7; clear -> +0x1604 bit 2 ? (state 3, +0x162c = +0x161c, +0x40 += [+0x1628],
handles [+0x1634]+0 / +8 stopped, ef +0x15e0 -> [+0x1634]+0xc, hit +0x15fc, +0x1548 = +0x15d0, hit slot 0 off) : (ef +0x15e4 ->
[+0x1634]+0x10, the end); then param r6 started into [+0x1634][r5]). Handles live in a 0x30-byte block [+0x1634] (0x41ee98 allocs).

base41 init 0x41f410 (read 0x41f410..0x41fbb8, first pass): 0x43a850; +0x1588 = setup +0x2c (u16, the hit group); resource check;
the handle block [+0x1634] grown to 9 words (0x24 bytes, +0x1638 = 9); the reader; the owner; +0x1604 bit 0 SET -> state halfword 1
and none of: (bit 0 CLEAR -> state 2, +0x162c = +0x1618, the hit vt+0x140 with +0x15f8 / group, ef +0x15d4 -> [blk]+0, ef +0x15dc ->
[blk]+8 at +0x40). Words: setup +0x20.. == the GOT zero vec -> +0xfe8 = block +0x50 + u16(s32(0.5 + [+0x1608] x 182.04)), +0xfec =
block +0x54 + same of [+0x160c], +0xff0 = 0; else the setup's +0x20.. words. +0x1640.. = 0x8a4b88(shell) (a vec; READ it). The point:
setup +0x10.. == the GOT zero vec -> joint +0x1600 != -1: the joint matrix (0xc15a4) row 3, else the owner's +0x40; then + [+0x1620]
vec turned Z (+0xff0), X (+0xfe8), Y (+0xfec) -- careful order; else the setup's point (no offset). Velocity +0x1020.. = (0,
[+0x1624]+4, [+0x1624]+8) turned by Y (+0xfec); gravity +0x1010.. = (0, +0x1614, +0x1610)?? turned X (+0xfe8) then Y then Z (+0xff0)
-- re-read the gravity block's component order before transcribing.
base41 step 0x41fbe8: 0x4a1698; every handle of [+0x1634] x +0x1638 dropped when its unit left states 1 / 2; state 1 -> 0x41fd40 (the
held state: sub-state byte +5 0 / 1 / 2, each a +0x162c countdown clamped at 0 by vselge), 2 -> 0x4200b0 (the flight), 3 -> 0x420238 (the
landed hold), 0xfe -> +0x162c down by dt (vselge 0): at <= 0 deleted (vt+0x40); while > 0, all handles null -> 0xff and deleted.
NEXT: read 0x41fd40..0x4200b0 (state 1), 0x4200b0..0x420238 (flight), 0x420238..0x420348 (state 3), 0x420348 end; the reader 0xed0478,
the class's +0x15c..+0x16c, 0x8a4b88; the makers 0xec8a60 / b74 / c84 (7, 0xd / 0x40) and 0xec9c78 / 9d70 / 9e50 (7, 0x19).
base41 state 1 0x41fd40 (READ): anchor +0x1000 = +0x40 each move; by sub-state +5 the clock +0x162c -= dt (vselge: never below the
literal at pc -- read it, probably 0): sub 0 at <= 0 -> sub 1, +0x162c = +0x15c8, ef [+0x15d8] at +0x40 -> blk+4; sub 1 at <= 0 -> sub 2,
+0x162c = +0x15cc, ef [+0x15d4] -> blk+0; sub 2 at <= 0 -> STATE 2 (the flight), +0x162c = +0x1618, ef [+0x15dc] -> blk+8, the hit
(vt+0x140, +0x15f8, group +0x1588). (A wind-up: two waits, each with its effect, then the launch.) Init with +0x1604 bit 0 set enters
state 1 (halfword 1: state 1, sub 0) and starts nothing; clear: straight to state 2.
base41 state 2 0x4200b0 (the flight, READ): the life +0x162c -= dt (vselge floor; at <= 0 the end vt+0x148(0)); anchor = +0x40;
0x539224(shell) (the move: velocity +0x1020 / gravity +0x1010 -- READ it, probably the shared integrator); the stage query 0x43ac6c /
0x43ac8c (mask 3, a query struct with -100000.0 at +0x34) -> vt+0x150 (the landing 0x41eed4) on a hit; +0x1604 bit 2 (0x2) -> 0x43b2b0
(shell, 1, &+0x40, 1) (the ground-follow? READ).
base41 state 3 0x420238 (the landed hold, READ): +0x162c -= dt; while > 0: nothing unless byte +0x151e == 0xff (then return? -- reread
the branch); at <= 0 (or +0x151e != 0xff): ef [+0x15e4] at +0x40 -> blk+0x10, then the end vt+0x148(0).
base41 end 0x420348 (READ): handles blk+0 / +8 / +4 / +0xc stopped (0x43b058(h, flag)), 0x4a1de4 (hits off), state 0xfe, +0x162c = G x
60; flag 1 deletes.

Status-7 table 0xecbc98 (82 offsets on e+0x73e1; fb/stdisp.py band050.txt 0xecbc98 0x52): 0xec8544(e, k) for (7, 0xd) k 0, (7, 0xe) 1,
(7, 0x25) 2, (7, 0x40) 3 (k 0 / 3 sp_41 at f24.. (0xec8724 site), k 1 / 2 the beam sp_02 (0xec8814 / 0xec8924 sites)); 0xecb36c(e, k)
for (7, 0x35) 0, (7, 0x3a) 1, (7, 0x3b) 2, (7, 0x3c) 3, (7, 0x3d) 4, (7, 0x3e) 5 -- A TIMER MAKER (census miss, trap 83): phase 1 sub
P+0x1a2 1: P+0x1bc += dt, every > 7.0 -> 0xecb128(e, k, P+0x1a3 (the count), e+0x73e8) makes sp_01 (two sites 0xecb1e4 / 0xecb2b4;
0xc460c the target choice between), count +1, at 10 the sub-phase on. All six reached. 0xecad24 = (7, 0x1f) / (7, 0x20) (both reached)
-> 0xecaad8 sp_41 at 0xecac88: no census create -- READ why (a timer or a gate). 0xec91f0 (7, 0x48..0x51): unreached.

Phase clips (motqx): 4:0x09 p2 L1 M11, 4:0x0f p2 L1 M9; 7:0x06 p3 (READ: p2 L2 M2, p3 not set by motqx answers); 7:0x0d / 0x40 p2 L2 M9;
7:0x0e / 0x25 p2 L2 M11; 7:0x19 p0 L2 M21 (no frame test); 7:0x1f L1 M19 (p2 L1 M1); 7:0x20 L2 M7; 7:0x35 / 0x3a..0x3e L2 M28.
sp_00 landing's sp_01 table 0x169ee40 = [0, 0, 1] (mode 0 / 1 -> sp_01 0, 2 -> sp_01 1).
sp_01 reader 0xecf990: ef 0 +0x15c8, ef 1 -> +0x15d0 (the 0x20 switch's); hit 0; flags 1 int0, 0x20 int1, 0x400 int3, 4 int4, 8 int5;
int 2 the joint +0x15e4; vec 0. Modes: 0 / 1 / 4 / 5 flags 0; 2 / 3 0x20 (u 90 then the switch to u 91); 6 flag 1 joint 14; 7 flags 1 +
0x400 joint 9 (0x400: READ base01's arm before building -- Kushala's refusal).
sp_11 reader 0xecff90: int 0 = n, floats 0..n-1 -> the table [+0x1654] (count +0x1658); +0x1670.. = block +0x40.. (at creation),
+0x1680.. = block +0x50 / +0x54 / +0x58. sp_11 +0x168 0xed0140(shell, k): owner active; mode < 4 -> sp_01 MODE 4 at +0x1670 + vec k
(x cosY + z sinY, y, z cosY - x sinY; Y = +0x1684 u16), words +0x1680.., +0x3c 0xffff; mode 4 nothing; mode > 4 -> vt+0x148(1).
sp_41 reader 0xed0478: cmn floats 0 / 1 / 2 -> +0x15c8 / +0x15cc / +0x15d0 ([31, 10, 10]: the two wind-up waits, the landing's
+0x1548); ef 0..5 -> +0x15d4..+0x15e8, ef 6 -> +0x15f0, 7 -> +0x15ec, 8 -> +0x15f4; hit 0 / 1 -> +0x15f8 / +0x15fc; flags +0x1604: 1 int0
(wind-up), 2 int1 (0x43b2b0 in flight), 4 int2 (landing hold); int 3 the joint +0x1600; floats 0..5 -> +0x1608 (deg X) / +0x160c (deg Y)
/ +0x1610 / +0x1614 / +0x1618 (the flight life -> +0x162c) / +0x161c (the landed hold); vec ptrs 0 / 1 / 2 -> +0x1620 (offset) / +0x1624
(velocity: y, z used) / +0x1628 (the landing's +0x40 add). base41 calls no class virtual past +0x150 (grep: none).
0x8a4b88(out, shell): the shell's quaternion +0x50..+0x5c -> a matrix -> out (READ further: which axis).

MAKERS (READ):
 A 0xec66d4 (4:0x09 / 0x0f, phase 2, b0968 f6): sp_00 2, setup zero vec / zero words, +0x2c byte 0, +0x2e 0xffff (base00 joint path).
 B 0xec7ae0(e, side) (7:0x02 side 0, 0x21 side 1): p0 L2 M6; p1 f76 sp_00 side (zero setup).
 C 0xec7870(e, k) (7:0x18 k 1): p0 L2 M5; p1 f170: sp_01 2 at block +0x40 + (lat, 0, fwd) turned by Y (block +0x54): lat = 8 x (f(h & 0xff)
   + -128), fwd = -200 + -5 x s32(h >> 8); x = ox + (fwd sinY + lat cosY) [vmul s2 = sinY x fwd; vmla s2 += lat x cosY], z = (fwd cosY
   - sinY x lat) + oz; y = oy + 0. Words GOT zero, +0x3c 0xffff.
 D 0xec7f14(e, k) (7:0x06): p0 L2 M1; p1 (landing 0xbf4e4) -> p2 L2 M3?? (p1 sets 0x203 at the landing: so phase 2 = L2 M3 -- RECHECK
   which phase the f2 create is: table entry 3 = 0xec8064 -> phase 3; phase 2's clip = what p1 set (L2 M3)); p3 f2 (k == 1): sp_01 2
   at block +0x40 + (lat 8 x (f(h&0xff) - 128), fwd 1000 + 5 x s32(h >> 8)) turned by Y; y + 0.
 E 0xec8544(e, k) (7:0xd k0 / 0x40 k3): p2 (L2 M9) f24 / 26 / 30: sp_41 5 / 6 / 7 (k 0) or 2 / 3 / 4 (k 3), zero setup, +0x2c 0xffff.
 F 0xec9af0 (7:0x19): p0 setMotion L2 M21 (0xafce8 r2 1) and three sp_41 0 at block +0x40 + (x, 2000, z) turned by Y, (x, z) from
   hashes of h (h x 0x12d6f3 / 0x74a04f / 0x34bf15 ..): with h = 0 each (-512, 1000); then +0xcad0 = 150.0.
 G 0xec9eb8 (7:0x1a): p0 L0 M14 (0x0e), P+0x1a2 / 1a3 = 0; p1 f164 / 224 / 284: sp_01 3 at block +0x40 + T6[a / b / c] turned by Y;
   T6 = (800,0,800) (-800,0,800) (1200,0,0) (-1200,0,0) (800,0,-800) (-800,0,-800); a = h % 6, b = (h >> 4) % 5 (+1 if >= a), c = (h >> 8)
   & 3 skipped past a and b (see 0xeca314..). h = 0: 0, 1, 2.
 H 0xecb4f8(e, k) (7:0x36 k0 / 0x37 k1): p0 L2 M6; p1 f74 sp_11 k at block +0x40, words GOT zero.
 I 0xecb774(e, k) (7:0x38 k0, 0x39 k1, 0x3f k2): p0 L2 M7; p1: k 2 f96 0xc460c then sp_01 5 at the TARGET block +0x1d0; f164 (all k):
   phase 2, setMotion L2 M21 (afce8 r2 1, s0 26), 0xb07b4, then k 2: 0xc460c + sp_01 5 at the target; k 0 / 1: sp_11 2 / 3 at block +0x40.
 J 0xecb128(e, k, i, h) (the timer 0xecb36c: k = (7, 0x35) 0, 0x3a 1, 0x3b 2, 0x3c 3, 0x3d 4, 0x3e 5; every P+0x1bc > 7.0, i = P+0x1a3
   0..9): k >= 2 and P+0x230 <= 2 and (h + i) % 10 == 0 -> sp_01 5 at the target (0xc460c first); else sp_01 4 at block +0x40 + V[T[k][i]]
   (NOT turned: world offsets). T (0x169edd4, 6 x 10 bytes) and V (BSS 0x212aec0, 57 vec4, filled by the static initialisers -- read on
   the booted executable): see fb/notes050.md tables below. P+0x230: UNREAD (a byte the target choice / player count? -- name it).
