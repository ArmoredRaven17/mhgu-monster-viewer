# patch086.py <src shells.js> <dst shells.js> [--named]: Valstrax's gap-D rows (RESULT.md (b)), anchored on text, not line numbers.
#   A  spawn086: the row field maxH (the height gate of (3, 4)'s maker, 0x1096ae0..0x1096b04)
#   B  the reached rows: (7, 0x33) L2 M73 f2 sp_01 10; (3, 4) L0 M36 start sp_01 6 (maxH 900)
#   --named  also the (3, 0) / (13, 0) / (13, 1) rows (makers READ, issuers NOT READ -- RESULT.md (a) 2b): left out unless asked
# The repo file has CRLF line ends: read raw, work on LF, write the file's own ends back.
import sys
src, dst = sys.argv[1], sys.argv[2]
named = '--named' in sys.argv
CR, LF = chr(13), chr(10)
raw = open(src, encoding='utf-8', newline='').read()
NL = CR + LF if (CR + LF) in raw else LF
s = raw.replace(CR + LF, LF)

# ---- A ------------------------------------------------------------------------------------------------------------------------
fn = s.index('function spawn086(')
anchorA = "    if (!own.ownerPos || !own.facing){ refuse('no owner position / facing'); continue; }" + LF
iA = s.index(anchorA, fn)
assert iA < s.index('const act086 =', fn), 'anchor A outside spawn086'
GATE = LF.join([
"    // maxH: the block's +0x44 <= its ground +0x5b4 + maxH, else no shell ((3, 4)'s 0x1096ae0..0x1096b04: 900, unordered -> none)",
"    if (sp.maxH != null){",
"      if (own.ground == null){ refuse('no ground (input.ground or input.rock.floorY)'); continue; }",
"      if (!(own.ownerPos[1] <= f(own.ground + f(sp.maxH)))) continue;",
"    }", ""])
assert GATE not in s, 'A already applied'
s = s[:iA + len(anchorA)] + GATE + s[iA + len(anchorA):]

# ---- B ------------------------------------------------------------------------------------------------------------------------
anchorB = "    ...[0x34, 0x35].map(n => act086(7, n, '2', 'Motion[71]', [{ start: true, shell: 'shell01', mode: 7 }]))," + LF
assert s.count(anchorB) == 1, 'anchor B'
ROWS = LF.join([
"    // 0x109b07c (7, 0x33), READ whole -- REACHED: 0x109a5b4's phase 6 ((7, 0x32 / 0x34 / 0x35) alike: P+0x1bc = tune float 0x28 (150)",
"    // run out, 0x7206c) with e+0x7420 set -> vt+0x3d0(e, 7, 0x33) (0x109acb4..0x109acd4); e+0x7420 clear -> vt+0x3e0. Phase 0 motion",
"    // 0xffff, P+0x1bc = tune 0x29 (60); phase 1 the block to e+0xcad0.. / words e+0xcac0.. at the run-out, L1 M5 (0x105); phase 2 the",
"    // fall, his +0x44 <= the block +0x1d4 + 857 -> the block on the +0x1d0 point, posture 0, L2 M73 (0x249); phase 3 at tune float 0x2a",
"    // (2.0) of L2 M73 (0xb0974) sp_01 10 at his +0x40 with his words, +0x3c = P+0xb0a (0x109b58c..0x109b648): u 140 by the 0x20 switch",
"    act086(7, 0x33, '2', 'Motion[73]', [{ frame: 2, shell: 'shell01', mode: 10 }]),",
"    // 0x109699c (3, 4), READ whole -- REACHED: (2, 0x00 / 0x09 / 0x0c / 0x0d / 0x0e) phases 1 / 2 call 0x1095114: e+0x7420 set, the area",
"    // point query 0xa6c48(e, 0, 0x400, 0x3000, 4) finds none and 0xa6c48(e, 0, 0x10000, 0x3000, 4) finds one -> vt+0x3d0(e, 3, 4)",
"    // (0x1095224; the stage's points decide, the viewer has no list of them). Phase 0 L0 M34 (0x222); phase 1 at its end L0 M35 (0x223);",
"    // phase 2 landed (0xbf52c(e, 674.0)) and L0 M35 f20 (0xb0968 mode 1) -> posture 0, L0 M36 (0x224) and, the block's +0x44 <= +0x5b4",
"    // + 900, sp_01 6 at the block's +0x40 with his words, +0x3c 0xffff (0x1096ae0..0x1096bc4): c 30 (ef 0, list 1)",
"    act086(3, 0x04, '0', 'Motion[36]', [{ start: true, shell: 'shell01', mode: 6, maxH: 900.0 }]),", ""])
NAMED = LF.join([
"    // (3, 0) 0x1096130.. / (13, 0) 0x109d840.. / (13, 1) 0x109ddc0.., READ: L1 M1's end (13, 1: after L3 M3 / L0 M11 / M12 / L1 M1) ->",
"    // the lift 0xbc984, L1 M2 (0x102), the block moved, P+0x50 = 0xe001, sp_01 11 at his +0x40 with his words, +0x3c 0xffff: u 500 (ef 0).",
"    // ISSUERS NOT READ: (3, 0) only cmdtbl g1 s43 (no 0x14 / 0x20 / 0x9e names s43; the shared '14 NN ff' streams' NN = 0xb4d9c's",
"    // record byte -- which NN, NOT READ); status 13 from no code of his or the shared layer (rom-map 'status 13 (13, n) issuers')",
"    act086(3, 0x00, '1', 'Motion[2]', [{ start: true, shell: 'shell01', mode: 11 }]),",
"    ...[0x00, 0x01].map(n => act086(13, n, '1', 'Motion[2]', [{ start: true, shell: 'shell01', mode: 11 }])),", ""])
assert ROWS not in s, 'B already applied'
iB = s.index(anchorB) + len(anchorB)
s = s[:iB] + ROWS + (NAMED if named else '') + s[iB:]
open(dst, 'w', encoding='utf-8', newline='').write(s.replace(LF, NL))
print('patched', dst, '(+ named rows)' if named else '', 'line ends', 'CRLF' if NL != LF else 'LF')
