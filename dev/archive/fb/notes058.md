# Amatsu (em058_00) shells -- working notes (scratch, 2026-10-19)
Ids 0xfc sp_00 (base00, reader 0xf0f3a0, landing 0xf0f4bc), 0xfd sp_01 (base01, reader 0xf0f794, +0x150 0xf0fb10, +0x154 0xf0fa28),
0xfe sp_02 (beam, beam-spawns (7, 0xa)), 0xff sp_06 (base06), 0x100 sp_29 (base29 NEW: init 0x4123d0, step 0x412914, +0x164 0xf10480),
0x101 sp_30 (base30 NEW: init 0x413080, step 0x41330c, +0x164 0xf10ed8), 0x102 sp_42 (base42 NEW: init 0x4207e4, step 0x42124c).
HIS PHASE BYTE IS e+0x15e1 (sub +0x15e2 / +0x15e3), not P+0x1a1 -- trgen FB_PHASEAT=0x15e1 (census empty without it). (1, 0xd)
uses P+0x1a1.
Census (FB_PHASEAT): 7:0x00 L2 M16 f122 sp_29 0; 7:0x01 L2 M14 f102 sp_01 4; 7:0x02 L2 M15 f130 sp_01 3; 7:0x08 / 0x0e sp_06 0 f58;
7:0x09 L2 M17 f110 sp_00 0; 7:0x0a beam; 7:0x0b L2 M19 f220 sp_30 0 / 1 / 2; 7:0x0c L2 M22 sp_01 1 f200 / f206 / (tail) + sp_01 8 f206;
7:0x18 L2 M7 f78 sp_06 1; 7:0x19 / 0x1a / 0x1b sp_42 0 / 1 / 2 f18 / 20 / 22.
Reached (reach058): 7:0x00..0x05, 0x09..0x0d, 0x10, 0x14, 0x15 (no chain edges). So 0x08 / 0x0e / 0x18 / 0x19..0x1b UNREACHED -- sp_06 and
sp_42 made by no reached action (base06 / base42 not needed).
Status-7 table 0xf080c4 (0x1c): 0 0xf0bc0c, 1 0xf0bd10, 2 0xf0be9c, 3 / 4 / 6 / 7 0xf0c054(k 0 / 1 / 2 / 3) (A TIMER: 0x539d5c on
P+0x1bc, census-blind), 5 0xf0c948, 8 / 0xe 0xf0cae0(0 / 1), 9 0xf0cd0c, 0xa 0xf0cf34 (beam), 0xb 0xf0d1c4, 0xc 0xf0d3a0, 0xd ?, 0x10
0xf082bc, 0x14 / 0x15 0xf0d8d0(0 / 1), 0x18 0xf0d9e8, 0x19 0xf0dda0, 0x1a 0xf0e194, 0x1b 0xf0e678.
The id immediates outside status 7 (0xf0787c 0x101, 0xf0ae74 0x102 ...) are MOTION ids (setMotion's r1), not shells: the 25
0x48b884 calls are all in status 7 and the shell classes.
(7, 1) 0xf0bd10: p0 L2 M14; p1 f102 sp_01 4 at block +0x40, words e+0xfe8 -- gated by e+0x17f4 bit 0 CLEAR (its writer not found: 6 movw
#0x17f4 sites in the text, 0xf07518 sets bit 1 on a part break; bit 0 none found -> the ctor's 0, named).
(7, 2) 0xf0be9c: p0 L2 M15; p1 -> p2 at once; p2: turn 0x76dd0(-0x500, 80, 120); f130 sp_01 3: +0x10 the GOT zero, +0x20.. the BLOCK
point, words e+0xfe8.
(7, 0) 0xf0bc0c: p0 L2 M16 (afce8 s0 14); p1 f122 sp_29 0 (0x4121c4(0x10): id, mode 0, owner).
(7, 3 / 4 / 6 / 7) 0xf0c054(k 0..3): THE TRAIL -- sp_01 6 at block +0x40 (words e+0xfe8, +0x3c 0xffff) each time 0x539d5c(e, &P+0x1bc, 1.0)
fires (T <= 0: 0 and fire; else T - dt, fire at <= 0, kept >= 0), T = 16 after each. Phases: 0 T = 6, L2 M1 (k 0 / 1) / L2 M9 (k 2 /
3); 1 (L2 M1) from f92 (0xb0968(1, 0, 92)) ...; end (f44 hit k<=1) -> 2: T = 3, L2 M2, +0xcb60 = 1; 2 every call, 0x78b78(e,0,0x80)
(arrival: NOT viewer-visible) -> k 0 / 2: phase 5 L2 M3 ; k 1 / 3: phase 3, T = 3, L2 M4; 3 (L2 M4) from f152; end -> 4: T = 3, L2 M2
(afe84 s0 8), 0xc460c; 4 every call, 0x78b78(e,0,0x100) -> 5 L2 M3; 5 turn, end -> done.
(7, 9) 0xf0cd0c: p0 L2 M17; p1 at tune float 0x20 (110) sp_00 0 (zero setup).
(7, 0xb) 0xf0d1c4: p0 L2 M19 (afce8 14), ctl +0xcae0 = e+0x1480, +0xcae8 = e+0x1488, +0xcaec = 0, +0xcae4 = e+0x19f4; p1 -> p2; p2 at tune
0x23 (220) sp_30 0, 1, 2 (0x412f7c(0x10): id 0x101, mode, owner).
(7, 0xc) 0xf0d3a0: p0 L2 M22 (afe84 12), P+0x1bc = tune 0x25 (806), +0x15e2 = 0; p1 -> p2; p2 at tune 0x24 (206) sp_01 8 at the block
point (words e+0xfe8); from tune 0x26 (200) +0x15e2 = 1; 0x7206c counts P+0x1bc down; at s32 <= 0: p3, L2 M23 (afe84 4), the ctl copies
again, sp_01 1 at the block point (tail call). p3: hit, +0x918 at a window, end.
Tune (em058_00 action_tune): 0x20 110, 0x23 220, 0x24 206, 0x25 806, 0x26 200, 0x2b 2, 0x2c 32, 0x2d 30.
