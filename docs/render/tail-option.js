// THE CUT TAIL, as the game drops it (E:\offline\decode\notes\tail-option-em043.md, read and run under the emulator
// by the tail agent, 2026-09-21). Raven: "Follow how the ROM handles tail cut animations".
//
// Savage's cut tail is the enemy's embedded uEnemyOption slot 0 (enemy+0x7720, vtable 0x172d5e8), activated on the
// SEVER frame -- the frame the tail-cut reaction (10, 0x72) starts L3 Motion[15] (0xc2274, then the option's +0x28 pass
// 0x73780 phase 0 -> 1 -> 2, activation 0x73f7c): drawn from that frame, with the monster's model
// em043_05_tail (resource 0x7bc4, every mesh group), at scale S = the monster's size (0xbe518), and never removed
// while the monster is shown (carving leaves it; only the death fade, 0xa1774, or the monster's removal takes it).
// It moves by its own motion, em_option\mot\em001_00_option motion 1 (55 frames, no loop, speed 1.0, root-only),
// whose root step 0x951aa0 is scaled and turned by the activation, plus an eased descent (0x73eac..0x73f60):
//   J  the world position of the monster's joint 142 (+0x1477 = 0x8e) on the sever frame (0x7421c..0x742a8)
//   G  (monster x, ground y + 20 S, monster z): the monster's position latched at the sever plus the stage's ground
//      (0x742b0..0x74374; the viewer's ground is its floor plane)
//   d  (G - J) across the ground, normalised; qa the yaw turning +Z toward it (0x745a4..0x747a0)
//   s  |G - J| across the ground / T(54).z (0x74448..0x744a4)
//   frame k = 0 .. 52: pos = (J.x, 0, J.z) + s T(k).z d + (0, s T(k).y + yb, 0), quat = qa x Q(k); yb starts at J.y
//      and, for each counter c = k + 1 in 11..42, yb += ((c - 10) / 32)^2 (G.y - yb) -- at G.y from k = 41
//   k = 42: u 905 (cm202_001) is requested at G, once (0x703b8)
//   k >= 53 (the motion's end bit): pos = G, quat = qa x Q(54), held (0x73d94..0x73ea8)
// All at the viewer's step, one frame a 1/60 s; the game's own step for the option is NOT READ (with 2 the descent
// takes 16 steps of the same easing, not 32).
export const CUT_TAIL = {
  // Silverwind Nargacuga: the same option code and joint 143, HIS OWN model -- em037_04_tail carries 172 silver
  // vertices Nargacuga's does not (both its groups 0 and 100 are drawn) -- on em001_00_option Motion[1], spawned
  // at the world position of joint 143. (states-em037_04.md 0)
  em037_04: { piece: 'em037_04_tail', joint: 143, above: 20, landing: ['em037_04u', 905] },
  // Diablos: the same option code, but JOINT 144 rather than the Rath line's 143 -- his sever hook passes kind
  // 0x91 (0xc2274 at 0xd32724) where Basarios passes 0x8f and Savage 0x8e, and u 900 names joint 144. His
  // uEnemyOption slot 0 resolves em007_00_tail (descriptor table[114] = 0x159abc4) and +0xb4 = 0x77ed is the same
  // option motion list Rathian uses, so the piece flies on her poses. (states-em007_00.md 3.4)
  // CORRECTED 2026-10-14: the piece drops from the joint byte the sever passes (0xc2274's 4th argument -> option +0x1477,
  // read by the drop at 0x7421c) -- 0x91 = JOINT 145 (0xd32730, the class's on-action-start hook, both variants); 144 was
  // u 900's joint (dev/em007_04-undriven-spec.md; rom-map Withdrawn).
  em007_00: { piece: 'em007_00_tail', joint: 145, above: 20, landing: ['em007_00u', 905] },
  // BLOODBATH DIABLOS: TWO option slots (descriptor [0x172ba68][115] = 0x159ac90: 0x8473 em007_04_tail, 0x8474
  // em007_04_head; +0xb4 0x8489 = em_option\mot\em007_04_option, whose Motion[1] is em001_00_option's byte for byte).
  // The TAIL: (10, 0x72) part 7 -> 0xc2274(e, 0, 0, 0x91) at 0xd32810 = JOINT 145 (u 900 sits on 144), kind 1, CutTail
  // exactly (emulated: lands at k 42). The HORN: part 6 -> 0xc2274(e, 1, 0, 3) = JOINT 3, kind 2, which em 7 flies on
  // 0x74910 instead: Motion[2] (73 f), h = -20 unscaled (0x740d0..0x740f4), eased over (10, 48], u 906 at k 48, G at
  // k 71 (HornPiece007 below; dev/em007_04-undriven-spec.md 1-2). A row's `drops: 'horn'` takes the second piece.
  em007_04: { piece: 'em007_04_tail', joint: 145, above: 20, landing: ['em007_04u', 905],
              horn: { piece: 'em007_04_head', joint: 3, above: -20, unscaled: true, landing: ['em007_04u', 906],
                      flight: 'em007_04_horn' } },
  em043_05: { piece: 'em043_05_tail', joint: 142, above: 20, landing: ['em043_05u', 905] },
  // GRAVIOS: his sever hook passes kind 0x8f, the same as Basarios's, and u 900 names JOINT 143 (the Rath line's
  // sever joint); descriptor table[113] = 0x159aaf8 has uEnemyOption slot 0 and em005_00.arc ships em005_00_tail
  // plus em001_00_option.lmt, so the piece flies on Rathian's option poses. Basarios has the same option slot but
  // no staged model, which is why he is not here. (states-em005_00.md 3.4)
  em005_00: { piece: 'em005_00_tail', joint: 143, above: 20, landing: ['em005_00u', 905] },
  // DURAMBOROS: sever kind 0x90 (his own; 0xc2274 twice, the second gated on tail break level >= 2) and u 900
  // names JOINT 143, the Rath line's sever joint; `em055_00_tail.glb` is staged and his monsters.json entry
  // carries the SHARED `em001_00_option` list, so the piece flies on Rathian's option poses exactly as Gravios's
  // does. His uEnemyOption DESCRIPTOR WORD is the one thing here not read directly -- the three independent
  // pieces (the staged model, the option list, and u 900's joint) agree, and that is stated rather than dressed
  // up as a fourth. (Read 2026-09-30, Effects; there is no decode note for Duramboros.)
  em055_00: { piece: 'em055_00_tail', joint: 143, above: 20, landing: ['em055_00u', 905] },
  // GLAVENUS: sever kind 0x91 (as Diablos passes) and u 900 names JOINT 145; descriptor [0x172ba68][64] =
  // 0x15983ec has word[1] != -1, and em080_00.arc ships his OWN em080_00_option.lmt rather than the Rath
  // line's, so the piece flies on his own option poses. (states-em080_00.md 0, 3.4)
  em080_00: { piece: 'em080_00_tail', joint: 145, above: 20, landing: ['em080_00u', 905] },
  // HELLBLADE GLAVENUS: the same sever call and the same JOINT 145 -- `em080_04_bodydata.bdd` records 36 and 41
  // are the only ones carrying capsule mask 0x0001, byte for byte as Glavenus's are -- but HIS OWN cut-tail
  // model, which is staged. His sever is UNGATED where Glavenus's needs the tail hot and already broken:
  // `vtable +0x230` returns 1 for part 6 unconditionally. (states-em080_04.md 0, 3.4)
  em080_04: { piece: 'em080_04_tail', joint: 145, above: 20, landing: ['em080_04u', 905] },
  // BARROTH: his sever hook passes kind 3 for the head and the tail one names JOINT 142; descriptor 0x159b3bc
  // has BOTH option words non-negative, so he has TWO pieces -- `em044_00_tail` in slot 0, wired here, and
  // `em044_00_head` in slot 1, which his head-break reaction (10, 0x72) with part 0 spawns and which this
  // table has nowhere to put: it carries one `piece` per monster. Raised rather than dropped silently.
  // (states-em044_00.md 0, 3.4)
  //   WIRED 2026-10-15 (dev/em044-em045-second-pieces-spec.md): both sever calls are in his on-action-start hook vt+0x204 0xe83900 --
  // the tail 0xc2274(e, 0, 0, 0x8f) at 0xe839d8, so the drop joint is 0x8f = 143 (142 was u 900's joint, WITHDRAWN), and
  // the head 0xc2274(e, 1, 0, 3) at 0xe83bc8, JOINT 3. Both fly on CutTail itself (kind 2 on any em but 7 runs 0x73cd8;
  // emulated on his option list, u 906 at k 42, within 1e-4 of CutTail); his .dtp has no option rows, so both land 20 S
  // up. `drops: 'head'` on his head-break row takes the second piece.
  em044_00: { piece: 'em044_00_tail', joint: 143, above: 20, landing: ['em044_00u', 905],
              head: { piece: 'em044_00_head', joint: 3, above: 20, landing: ['em044_00u', 906] } },
  // BRACHYDIOS: u 900 names JOINT 143 and descriptor 0x1597a5c (class index 52) has word[1] != -1, so
  // uEnemyOption slot 0 exists; em063_00_tail.glb is staged and his monsters.json entry carries the option
  // list. Raging Brachydios shares the class and the sever, and differs only in u 900's scale.
  // (states-em063_00.md 3.5)
  em063_00: { piece: 'em063_00_tail', joint: 143, above: 20, landing: ['em063_00u', 905] },
  // RAGING BRACHYDIOS: the same class, the same sever ((10, 0x72) -> 0x17da1b0 -> L3 Motion[22]) and the SAME
  // uEnemyOption descriptor -- 0x4bc18 resolves it from `0x50aa8(63)`, the em NUMBER, so class index 52 ->
  // 0x1597a5c serves both variants. His u 900 differs from Brachydios's by SCALE alone (1.0 against 1.4), which
  // states-em063_00.md 3.4 calls the one state record in the two u.pel files that is not byte-identical; u 905,
  // the landing, IS byte-identical. `em063_05_tail.glb` is his own staged model. (states-em063_00.md 3.4, 3.5)
  em063_05: { piece: 'em063_05_tail', joint: 143, above: 20, landing: ['em063_05u', 905] },
  // ROYAL LUDROTH: sever kind 0x8e and u 900 names JOINT 143; descriptor [0x172ba68][39] = 0x1597000 has
  // word[1] = 0x7c30 != -1, and em047_00_tail.glb is staged. (states-em047_00.md 3.4)
  //   2026-10-15: the drop joint is the sever call's kind byte, mov r3,#0x8e at 0xeabc90 = JOINT 142 -- 143 was u 900's
  // joint (WITHDRAWN; dev/leviathans-effects-survey.md). His .dtp has no option rows (dtp.py: +0x78 empty), so 20 S stands.
  em047_00: { piece: 'em047_00_tail', joint: 142, above: 20, landing: ['em047_00u', 905] },
  // MIZUTSUNE and SOULSEER, one class (uEm082_00): the on-action-start hook vt+0x204 0x1036e98, (10, 0x72) with
  // 0x9e8d8(e) == 5 (the tail), calls 0xc2274(e, 0, 0, 0x8e) -- `mov r3, #0x8e` at 0x1037154, `bl` at 0x1037160 -- so
  // the drop joint is 0x8e = JOINT 142 for both (u 900 sits on 144; rom-map trap 50). Descriptor [0x172ba68][67] =
  // 0x1598650 = (0x7f82, 0x7f83, -1, ...): word [1] != -1, slot 0 exists, and it is keyed by the em number, so both
  // share it; em082_00_tail and em082_04_tail are staged and both monsters.json entries carry em001_00_option.
  // Their .dtp HAS one +0x78 option row, the same in both files: (zero id, 0.8, 20.0) -- dtp.py, 2026-10-15 -- so row
  // 0 gives 20 S, the shared height. [Which file resource 0x7f83 names: READ 2026-10-18 -- 0x159daa0[0x7f83] =
  // jamcrc(enemy\em082\em082_00\mod\em082_00_tail); Soulseer's own descriptor [130] = 0x159b884 word 1 0x85fc -> em082_04_tail.]
  em082_00: { piece: 'em082_00_tail', joint: 142, above: 20, landing: ['em082_00u', 905] },
  em082_04: { piece: 'em082_04_tail', joint: 142, above: 20, landing: ['em082_04u', 905] },
  // LAGIACRUS (2026-10-15): the sever is 0xc2274(e, 0, 0, 0x91) at 0xea0290 (`mov r3,#0x91` at 0xea0284, vt+0x204's
  // status-10 arm, (10, 0x72) with part 6) -> the drop joint is 0x91 = JOINT 145; u 900 sits on 145 as well, so here
  // the two agree. Descriptor [0x172ba68][38] = 0x1596f34 (0x7c0c, 0x7c0d, -1, ...): slot 0 exists, and 0x159daa0
  // [0x7c0d] = {jamcrc(enemy\em046\em046_00\mod\em046_00_tail), rModel} -- the staged em046_00_tail.glb (control
  // [0x7bc4] = em043_05_tail). His monsters.json entry carries em001_00_option, and his .dtp has NO option rows
  // (dtp.py: +0x91 = 0, +0x78 empty), so the landing is the shared 20 S. (states-em046_00.md 3.4)
  em046_00: { piece: 'em046_00_tail', joint: 145, above: 20, landing: ['em046_00u', 905] },
  // AGNAKTOR (2026-10-17, dev/em049_00-effects-spec.md 3): vt+0x204's status-10 arm, (10, 0x72) with 0x9e8d8(e) == 7,
  // calls 0xc2274(e, 0, 0, 0x91) at 0xeb5024 (`mov r3, #0x91` at 0xeb5018) -> the drop joint is JOINT 145; his .dtp's one
  // +0x78 option row gives 20.0 (dtp.py). The piece file READ (2026-10-18): descriptor [0x172ba68][40] = 0x15970cc, word 1 =
  // 0x7c51 -> 0x159daa0[0x7c51] = {jamcrc(enemy\em049\em049_00\mod\em049_00_tail), rModel} -- the staged em049_00_tail.glb.
  em049_00: { piece: 'em049_00_tail', joint: 145, above: 20, landing: ['em049_00u', 905] },
  // KUSHALA DAORA (2026-10-18, dev/em024_00-effects-spec.md 3): vt+0x204's (10, 0x72) arm with 0x9e8d8(e) == 2 calls 0xc2274(e, 0, 0,
  // 0x8f) at 0xdef988 -> JOINT 143 (u 900's joint too). Descriptor [0x172ba68][23] = 0x1596340: word 1 0x7a56 -> 0x159daa0[0x7a56]
  // = jamcrc(enemy\em024\em024_00\mod\em024_00_tail), word 2 -1, +0xb4 0x77ed (em001_00_option). His .dtp has no +0x78 row (break
  // loader dtp.py): the shared 20.
  em024_00: { piece: 'em024_00_tail', joint: 143, above: 20, landing: ['em024_00u', 905] },
  // CHAMELEOS (2026-10-18, dev/em025_00-effects-spec.md 3): vt+0x204 0xdff4f0 on (10, 0x72) with part 6 calls 0xc2274(e, 0, 0, 0x8f)
  // at 0xdffd18 (emulated) -> JOINT 143. Descriptor [0x172ba68][24] = 0x159640c: word 1 0x7a77 = em025_00_tail, +0xb4 0x77ed. His .dtp's
  // +0x78 row is the same shape as Agnaktor's (break loader dtp.py) -- the shared 20 kept, as there.
  em025_00: { piece: 'em025_00_tail', joint: 143, above: 20, landing: ['em025_00u', 905] },
  // TEOSTRA (2026-10-18, dev/em027_00-effects-spec.md 3): vt+0x204 0xe107ac on (10, 0x72) with part 2 calls 0xc2274(e, 0, 0, 0x8f)
  // (emulated) -> JOINT 143. Descriptor [0x172ba68][25] = 0x15964d8: word 1 0x7a9a = em027_00_tail, +0xb4 0x77ed; his .dtp's +0x78 row
  // holds 0.9 / 20.0 (break loader dtp.py) -- 20 above.
  em027_00: { piece: 'em027_00_tail', joint: 143, above: 20, landing: ['em027_00u', 905] },
  // AMATSU (2026-10-18, dev/em058_00-effects-spec.md 7): vt+0x204 0xf08e7c on (10, 0x72) with part 6 calls 0xc2274(e, 0, 0, 0x8e)
  // (emulated) -> JOINT 142; the reaction is the follow (1, 0x14), L3 M9 (motion-states.js). Descriptor [0x172ba68][46] = 0x1597594:
  // word 1 0x7d0a -> 0x159daa0[0x7d0a] = jamcrc(enemy\em058\em058_00\mod\em058_00_tail), word 2 -1, +0xb4 0x77ed. His .dtp's
  // +0x78 row holds 0.8 / 20.0 (dtp.py) -- 20 above, as Teostra's 0.9 / 20.0.
  em058_00: { piece: 'em058_00_tail', joint: 142, above: 20, landing: ['em058_00u', 905] },
  // THE GORE LINE (2026-10-18, dev/em071-em072-effects-spec.md 3): vt+0x204 0xfadfa0 on (10, 0x72) with part 6 calls 0xc2274(e, 0, 0,
  // 0x8f) (emulated, all three) -> JOINT 143. Descriptors [0x172ba68][59] / [127] / [60]: word 1 0x7e84 em071_00_tail / 0x85b3
  // em071_05_tail / 0x7ea6 em072_00_tail, +0xb4 0x77ed. No +0x78 row on Gore or Shagaru: the shared 20.
  em071_00: { piece: 'em071_00_tail', joint: 143, above: 20, landing: ['em071_00u', 905] },
  em071_05: { piece: 'em071_05_tail', joint: 143, above: 20, landing: ['em071_05u', 905] },
  em072_00: { piece: 'em072_00_tail', joint: 143, above: 20, landing: ['em072_00u', 905] },
  // VALSTRAX (2026-10-18, dev/em086_00-effects-spec.md 3): vt+0x204 0x109f830 on (10, 0x72) with part 6 calls 0xc2274(e, 0, 0, 0x8f)
  // (emulated) -> JOINT 143. Descriptor [0x172ba68][132] = 0x159ba1c: word 1 0x8626 em086_00_tail, +0xb4 0x77ed. No +0x78 row: 20.
  em086_00: { piece: 'em086_00_tail', joint: 143, above: 20, landing: ['em086_00u', 905] },
  // ALATREON: sever kind 0x8e and u 900 names JOINT 144; his descriptor's slot 0 exists and
  // em050_00_tail.glb is staged. His tail has no .dtp row at all, so there is no broken level -- only
  // the sever. (states-em050_00.md 0, 4.4)
  em050_00: { piece: 'em050_00_tail', joint: 144, above: 20, landing: ['em050_00u', 905] },
  // SEREGIOS: sever kind 0x91 (as Diablos and Glavenus pass) and u 900 names JOINT 144; descriptor
  // [0x172ba68 + 4*62] = 0x1598254 has word[1] != -1, so uEnemyOption slot 0 exists, and em077_00.arc ships
  // em077_00_tail plus the Rath line's em001_00_option.lmt -- so the piece flies on Rathian's option poses.
  // His tail has NO .dtp row: there is no broken level, only the sever. (states-em077_00.md 4.4)
  // joint 145, not 144 (u 900's): his one sever 0xfdae24 bl 0xc2274 passes r3 = 0x91 (0xfdae18) -- dev/em077_00-effects-spec.md 8
  em077_00: { piece: 'em077_00_tail', joint: 145, above: 20, landing: ['em077_00u', 905] },
  // YIAN GARUGA and DEADEYE: u 900 names JOINT 143, both uEnemyOption descriptors (indices 15 and 16) have
  // slot 0, both tail models are staged, and both fly on the Rath line's em001_00_option Motion[1]. Deadeye's
  // sever is gated on FOUR tail depletions (vtable +0x230: breakLevel(7) >= 4) where Garuga's is ungated --
  // a game gate, not something the drop can show. (states-em018_00.md 4, 7.3)
  em018_00: { piece: 'em018_00_tail', joint: 143, above: 20, landing: ['em018_00u', 905] },
  em018_04: { piece: 'em018_04_tail', joint: 143, above: 20, landing: ['em018_04u', 905] },
  // TIGREX and GRIMCLAW: sever kind 0x8f and u 900 on JOINT 143 for both -- cm202_062 at 1.3x for Tigrex, his
  // own record for Grimclaw -- and both have uEnemyOption slot 0 with a staged tail model. Neither tail has a
  // .dtp row, so there is no broken level, only the sever. (states-em032_00.md 0.1, 4)
  em032_00: { piece: 'em032_00_tail', joint: 143, above: 20, landing: ['em032_00u', 905] },
  em032_04: { piece: 'em032_04_tail', joint: 143, above: 20, landing: ['em032_04u', 905] },
  // ZINOGRE: u 900 names JOINT 144 and the sever kind is 0x8f. HIS uEnemyOption DESCRIPTOR IS NOT READ -- the
  // decode says so -- so this entry rests on what the viewer can see instead: `docs/monsters.json` carries his
  // option list and `em057_00_tail.glb` is staged. (states-em057_00.md 0, 4)
  //   2026-10-15: the sever call 0xeed254 passes kind byte 0x8f = JOINT 143 for both -- 144 was u 900's joint (WITHDRAWN;
  // dev/remaining-classes-effects-survey.md). No .dtp option rows on either (dtp.py: +0x78 empty), so 20 S stands.
  em057_00: { piece: 'em057_00_tail', joint: 143, above: 20, landing: ['em057_00u', 905] },
  em057_04: { piece: 'em057_04_tail', joint: 143, above: 20, landing: ['em057_04u', 905] },
  // URAGAAN: u 900 names JOINT 142 and the sever is GATED on the tail already being at break level >= 1.
  //   2026-10-15 (dev/em044-em045-second-pieces-spec.md): the sever call 0xc2274(e, 0, 0, 0x8e) at 0xe8fc48 drops at 0x8e = 142 on both
  // variants, and his .dtp HAS OPTION ROWS: the activation (0x740e8..0x74218) takes the landing height from row 0 for the
  // tail -- 75 S, where every entry before it assumed the shared 20 (WITHDRAWN for this class).
  em045_00: { piece: 'em045_00_tail', joint: 142, above: 75, landing: ['em045_00u', 905] },
  // CRYSTALBEARD: his tail sever names JOINT 144 and needs level >= 2. HE HAS A SECOND PIECE THIS TABLE CANNOT
  // CARRY: his BEARD comes off through uEnemyOption SLOT 1 (one of only three monsters in the ROM with a live
  // slot 1) with its own `em045_04_head.mod`. One `piece` per monster, so the tail is wired and the beard is
  // named -- the same gap Barroth's head has. (states-em045_00.md 4, 7)
  //   WIRED 2026-10-15 (dev/em044-em045-second-pieces-spec.md): the tail drops at 0x8e = JOINT 142 (144 was u 900's, WITHDRAWN) and 75 S
  // up (.dtp option row 0); the beard is 0xc2274(e, 1, 0, 4) at 0xe8fc84 (variant 4, part 0 only), JOINT 4, landing
  // 30 S up (row 1), u 906. Both on CutTail (em045_04_option.lmt is byte-identical to Barroth's). `drops: 'beard'`.
  em045_04: { piece: 'em045_04_tail', joint: 142, above: 75, landing: ['em045_04u', 905],
              beard: { piece: 'em045_04_head', joint: 4, above: 30, landing: ['em045_04u', 906] } },
  // Deviljho: the same class, the same sever call and joint 142, his own model and landing record
  // (states-em043_00.md 4: the cut tail is the only part of the sever that differs from Savage)
  em043_00: { piece: 'em043_00_tail', joint: 142, above: 20, landing: ['em043_00u', 905] },
  // Nargacuga: the same option code (breaks-em037.md): +0x1477 = 143 from its sever call, model em037_00_tail, its
  // dtbparts.dtp row count +0x91 = 0 (file byte 13) -- no speed, height or rotation override, as Savage
  em037_00: { piece: 'em037_00_tail', joint: 143, above: 20, landing: ['em037_00u', 905] },
  // Rathian: the same option code (breaks-em001.md 4.3): +0x1477 = 0x8f (joint 143) from its sever call (0xcedfa8), model
  // em001_00_tail (descriptor 0x15950ec), dtp row count +0x91 = 0 -- no override, as Savage
  em001_00: { piece: 'em001_00_tail', joint: 143, above: 20, landing: ['em001_00u', 905] },
  // Gold Rathian: the same class and sever call (joint 143), its own model (descriptor 0x15951b8: 0x77ef = em001_02_tail)
  // and landing record, the same option motion (0x77ed)
  em001_02: { piece: 'em001_02_tail', joint: 143, above: 20, landing: ['em001_02u', 905] },
  // Dreadqueen: descriptor 0x1595284 (0x7805 = em001_04_tail), the same option motion; her tail is cut only once broken
  em001_04: { piece: 'em001_04_tail', joint: 143, above: 20, landing: ['em001_04u', 905] },
  // Rathalos: the same class and sever call (joint 143, breaks-em001.md 4.3), his own model (em002_00_tail) and
  // landing record, the same option motion; his tail has no break, so it is cut from intact (set 11 -> 12)
  em002_00: { piece: 'em002_00_tail', joint: 143, above: 20, landing: ['em002_00u', 905] },
  // Silver Rathalos: the same class and sever call (joint 143), his own model (em002_02_tail) and landing record,
  // the same option motion; like Rathalos his tail is cut from intact (set 11 -> 12)
  em002_02: { piece: 'em002_02_tail', joint: 143, above: 20, landing: ['em002_02u', 905] },
  // Dreadking: the same class and sever call (joint 143), his own model (descriptor 0x15954e8 +0x04: 0x784d =
  // em002_04_tail) and landing record, the same option motion (+0xb4 0x77ed); his tail too is cut only once broken
  em002_04: { piece: 'em002_04_tail', joint: 143, above: 20, landing: ['em002_04u', 905] },
  // ASTALOS: his sever hook passes kind 0x8a (0xc2274 at 0x10127f4, where Barioth and Basarios pass 0x8f, Savage
  // 0x8e and Diablos 0x91), and u 900 names JOINT 136 -- the joint the sever record sits on, and the one whose
  // bodydata capsule (record 3, mask 0x0001) the sever bit takes away. Descriptor table[66] = 0x1598584 has
  // uEnemyOption slot 0 (word [1] = 32606 != -1) and em081_00.arc ships em081_00_tail plus em001_00_option.lmt,
  // so the piece flies on Rathian's option poses like every other staged cut tail. (states-em081_00.md 3.4)
  em081_00: { piece: 'em081_00_tail', joint: 136, above: 20, landing: ['em081_00u', 905] },
  // BOLTREAVER: the same class, the same sever hook and kind 0x8a, the same JOINT 136, his OWN model
  // (enemy\em081\em081_04\mod\em081_04_tail, Group[0], 310 vertices) and his own landing record, on the same
  // em001_00_option Motion[1] (0.917 s) every staged cut tail flies on. (states-em081_04.md 0)
  em081_04: { piece: 'em081_04_tail', joint: 136, above: 20, landing: ['em081_04u', 905] },
  // AKANTOR: his sever hook passes kind 0x8f (0xc2274 at 0xe36690, Barioth's and Basarios's byte), and u 900 names
  // JOINT 143 -- the joint the sever record sits on, and the one whose bodydata capsule (record 9, radius 130,
  // mask 0x0001) the sever bit takes away. Descriptor table[29] = 0x1596808 = (0x7b07, 0x7b08, -1, 0x7b09, 0x7b0a,
  // -1): word [1] is 0x7b08 != -1 so uEnemyOption slot 0 exists, word [2] is -1 so slot 1 does not -- Barioth's and
  // Basarios's shape exactly. em033_00.arc ships em033_00_tail.mod / _tail.glb / _tail.mrl plus
  // enemy\em_option\mot\em001_00_option.lmt, so the piece flies on Rathian's option poses like every other staged
  // cut tail. His landing record is in his own pel and was read there rather than assumed from the pattern:
  // em033_00u UNIQUE key 905, effect\cm\cm202_001, JOINTLESS (65535), mode 3, scale 0.75. (states-em033_00.md 4)
  em033_00: { piece: 'em033_00_tail', joint: 143, above: 20, landing: ['em033_00u', 905] },
  // UKANLOS: the same family shape as Akantor and every number re-read from his own files. Descriptor
  // table[33] = (0x7b80, 0x7b81, -1, 0x7b82, 0x7b83, -1): word [1] is 0x7b81 != -1 so uEnemyOption slot 0 exists,
  // word [2] is -1 so slot 1 does not. u 900 names JOINT 143 (cm202_062, mode 1) and his landing record is
  // em038_00u UNIQUE key 905, effect\\cm\\cm202_001, JOINTLESS (65535), mode 3, scale 1.0 -- note the scale differs
  // from Akantor's 0.75, which is why it was read rather than copied. (states-em038_00.md 4)
  em038_00: { piece: 'em038_00_tail', joint: 143, above: 20, landing: ['em038_00u', 905] },
  // BARIOTH: Raven, 2026-10-14, the Flying Wyverns survey -- his u 905 was exported and undriven because he had no entry
  // here. The piece drops from the joint the sever call passes as its 4th argument -- 0xc2274 stores it at option
  // +0x1477 (0xc22f8), which the drop reads (0x7421c) -- and Barioth passes 0x8f = JOINT 143 (0xe657ec / 0xe657f8, in his
  // on-action-start hook vt+0x204 0xe65568, (10, 0x72) with part 7). NOT u 900's joint 144, which a first spec proposed
  // (dev/fw-undriven-barioth-basarios-ukanlos.md withdraws it). Descriptor [0x172ba68][123] = 0x159b2f0 word [1] =
  // 0x8537, which hashes (0x159daa0) to em042_00_tail -- the staged glb is the ROM's piece; option list +0xb4 = 0x77ed
  // em001_00_option. u 905 = base u table 0x159c7fc[5] (his +0x1d0 is the base 0xa3ddc), cm202_001, jointless, mode 3,
  // scale 0.75. (states-em042_00.md 3.2 / 3.4)
  em042_00: { piece: 'em042_00_tail', joint: 143, above: 20, landing: ['em042_00u', 905] },
  // BASARIOS: the same mechanism -- sever kind 0x8f at 0xd22d14 / 0xd22d20 = JOINT 143; descriptor 0x159aa2c word [1] =
  // 0x8413 hashes to em004_00_tail (staged); +0xb4 = 0x77ed; dtp byte 13 is 0 (no override). His +0x1d0 0xd2e0bc sends ids
  // under 1000 to the base table, so the landing's id 5 is u 905. Raven, 2026-10-14 (the Flying Wyverns survey).
  // (dev/fw-undriven-barioth-basarios-ukanlos.md)
  em004_00: { piece: 'em004_00_tail', joint: 143, above: 20, landing: ['em004_00u', 905] },
};

// The root curves of em001_00_option motion 1, frames 0..54, as the ROM's own evaluator 0xafb70c gives them
// (efx/agents/tail-scratch/curve.py; T.x is 0 on every frame): T(k) = (0, T_Y[k], T_Z[k]), Q(k) = Q[4k .. 4k + 3]
// (x, y, z, w). The viewer's poses/monsters/em001_00_option.glb carries the same curves one frame late.
const T_Y = [
  0, 25.021368, 49.6527748, 73.7713623, 97.3237152, 120.256416,
  142.537384, 164.113251, 184.95192, 205, 224.19873, 242.489319,
  259.796997, 276.036316, 291.111115, 304.898499, 317.264954, 328.03952,
  337.003204, 343.899567, 348.376068, 350, 348.167755, 343.21582,
  335.731842, 326.143158, 314.770294, 301.853638, 287.580139, 272.104706,
  255.550217, 238.023514, 219.610046, 200.379272, 180.395294, 159.711533,
  138.381409, 116.447655, 93.9529877, 70.9508514, 47.489315, 23.7019234,
  0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0,
  0,
];
const T_Z = [
  0, 10.1423349, 20.52841, 31.1379147, 41.9437637, 52.9188805,
  64.0429459, 75.2956619, 86.6567001, 98.1057587, 109.629288, 121.200218,
  132.804993, 144.430084, 156.055191, 167.666733, 179.244431, 190.774734,
  202.25087, 213.645767, 224.945877, 236.151169, 247.227875, 258.169128,
  268.968201, 279.598022, 290.051788, 300.309235, 310.363556, 320.194427,
  329.788361, 339.131744, 348.204346, 356.992554, 365.476105, 373.648193,
  381.488525, 388.970032, 396.085907, 402.815857, 409.139618, 415.036774,
  420.487122, 423.733582, 426.980072, 429.92865, 432.877258, 435.490723,
  437.799469, 439.742645, 441.279541, 442.396698, 443.11438, 443.49353,
  443.608643,
];
const Q = [
  0, 0, 0, 1,
  0.148930877, -0.00927766133, 0.00122074492, 0.988803387,
  0.294702679, -0.0180679355, 0.00537154824, 0.955403149,
  0.433702081, -0.0253969692, 0.0122100813, 0.900615573,
  0.562903583, -0.0310146455, 0.021002043, 0.825673342,
  0.679339111, -0.0344309211, 0.0317448191, 0.732328534,
  0.780654192, -0.0351624042, 0.0439530015, 0.622423351,
  0.864176691, -0.0329652056, 0.0568955019, 0.498873413,
  0.928260922, -0.0275890287, 0.0698271021, 0.364272833,
  0.97145915, -0.0187992845, 0.0822773948, 0.221685082,
  0.992821217, -0.00708111562, 0.093519561, 0.0742296204,
  -0.991876066, -0.00781197008, -0.103020355, 0.0742137134,
  -0.968777716, -0.0251472034, -0.109622277, 0.220953584,
  -0.923963547, -0.044672478, -0.113512032, 0.362506181,
  -0.858602643, -0.0656707734, -0.113520116, 0.495582432,
  -0.774165571, -0.0876459926, -0.109862663, 0.617184043,
  -0.672643125, -0.109869108, -0.101812042, 0.72464782,
  -0.556177557, -0.131353602, -0.0896036699, 0.815710783,
  -0.4277969, -0.151633486, -0.0730087161, 0.888069212,
  -0.290094584, -0.169710219, -0.0525002852, 0.940365553,
  -0.146513566, -0.184851289, -0.0278375782, 0.971385002,
  0, -0.196069181, 0, 0.980590045,
  0.14575772, -0.202888891, 0.0305187851, 0.967811763,
  0.287853509, -0.204842314, 0.0629908442, 0.933387578,
  0.422951669, -0.201463699, 0.0969467759, 0.878137529,
  0.547896624, -0.192398638, 0.130870134, 0.803532898,
  0.66001904, -0.177274808, 0.164333254, 0.711296856,
  0.756748378, -0.156526521, 0.196085498, 0.603640497,
  0.836278617, -0.130142048, 0.225123763, 0.482722014,
  0.896594465, -0.0984007493, 0.250274867, 0.351849824,
  0.936495602, -0.0620260462, 0.271058708, 0.2136724,
  0.955257356, -0.0214884058, 0.286186486, 0.0715466216,
  -0.952465534, -0.0222128052, -0.295357078, 0.071276255,
  -0.928471684, -0.0678714514, -0.297364831, 0.21191518,
  -0.883860409, -0.114755355, -0.292259902, 0.346707672,
  -0.819588959, -0.161622852, -0.279788196, 0.473149657,
  -0.737514079, -0.207021505, -0.259509265, 0.588107049,
  -0.639578998, -0.249728739, -0.231664285, 0.689134121,
  -0.527884483, -0.288847059, -0.197041079, 0.774002731,
  -0.40507105, -0.322787195, -0.155533612, 0.841151178,
  -0.274212986, -0.350885212, -0.108171292, 0.888811529,
  -0.138193756, -0.37160936, -0.0561564751, 0.916327178,
  0, -0.384528726, 0, 0.923113108,
  0, -0.388195276, 0, 0.921577215,
  0, -0.391855687, 0, 0.92002672,
  0, -0.395509839, 0, 0.91846174,
  0, -0.399495989, 0, 0.916734993,
  0, -0.403474897, 0, 0.914990723,
  0, -0.407446325, 0, 0.913229167,
  0, -0.411410093, 0, 0.911450386,
  0, -0.414446682, 0, 0.910073698,
  0, -0.417478383, 0, 0.908686876,
  0, -0.41931361, 0, 0.907841444,
  0, -0.421147197, 0, 0.906992376,
  0, -0.421642065, 0, 0.906762362,
];
const T_END = T_Z[54];                      // 443.60864: s = |G - J| / T(54).z
const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
                        a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
                        a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
                        a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const q = k => Q.slice(4 * k, 4 * k + 4);

export class CutTail {
  // J, G: game units (the viewer's world / 0.01), [x, y, z]; the tail as the activation leaves it on the sever frame
  constructor(J, G){
    this.J = J; this.G = G; this.k = 0; this.yb = J[1];
    const dx = G[0] - J[0], dz = G[2] - J[2], dist = Math.hypot(dx, dz);
    this.s = dist / T_END;
    this.d = dist >= 2 ** -23 ? [dx / dist, dz / dist] : [0, 0];
    const dot = this.d[1];
    if (dot >= -0.999){ const r = Math.sqrt(2 * (1 + dot)); this.qa = [0, this.d[0] / r, 0, r / 2]; }
    else this.qa = [0, 1, 0, -4.37114e-8];                 // 0xb33bbd2e: turned half round
  }
  // on to frame k (never back); returns true when the landing frame (42) is passed on the way
  advance(k){
    let landed = false;
    for (let n = this.k + 1; n <= k; n++){
      const c = n + 1;
      if (c >= 11 && c <= 42){ const t = (c - 10) / 32; this.yb += t * t * (this.G[1] - this.yb); }
      if (n === 42) landed = true;
    }
    if (k > this.k) this.k = k;
    return landed;
  }
  // position (game units) and rotation (x, y, z, w) on the current frame
  pose(){
    if (this.k >= 53) return { position: this.G.slice(), quaternion: qmul(this.qa, q(54)) };
    const k = this.k, sz = this.s * T_Z[k];
    return { position: [this.J[0] + sz * this.d[0], this.s * T_Y[k] + this.yb, this.J[2] + sz * this.d[1]],
             quaternion: qmul(this.qa, q(k)) };
  }
}

// BLOODBATH DIABLOS's HORN PIECE (CUT_TAIL.em007_04.horn): em 7's kind-2 option flies on 0x74910, not CutTail's
// 0x73cd8 (0x73a08: em +0xb5f4 == 7 and kind 2 -> 0x74910 via 0x73d78). Phase 2 samples em007_04_option Motion[2]'s
// root at the frame and the frame before (0x74be0 x2, the ROM evaluator 0xafb70c), adds the delta turned by the aim yaw
// +0x1454 and scaled by +0x14e0..+0x14e8, and over f in (10, 48] (literals 0x74bd8 48.0, 0x74bdc 38.0) eases the base
// height to G; f > 48 once -> 0x703b8(owner, kind 2, &G) = u 906; the motion's end (73 frames) -> position G.
// The tables are that code RUN (the tail_emu harness on the option's own ctor, reset, activation, both passes and
// 0x74910; dev/em007_04-undriven-spec.md 2.2, session table ng/head_table.json), per step k = 0..71, in the canonical
// frame J (0, 400, -300), G (0, -20, 0), facing +Z (qa = identity). Two runs with different J, owner, yaw and S agree
// with the closed form HornPiece007 uses:
//   pos.xz = J.xz + HEAD_F[k] (G.xz - J.xz)   -- the fraction depends on neither the distance nor S
//   pos.y  = yb + HEAD_H[k]                   -- the root height, UNSCALED; yb from J.y, for each c = k + 1 in 11..48:
//                                                yb += ((c - 10) / 38)^2 (G.y - yb)
//   quat   = qa x HEAD_Q[k]                   -- qa CutTail's yaw toward G
//   k = 48: u 906 at G; k >= 71: pos G, quat qa x HEAD_Q[71], held (H(70) = 115: the piece sits 115 above G until the
//   motion ends and is then placed at G -- the ROM's own snap).
// STAND-INS the harness names: a flat floor (the stage probe 0x180fd4 answered by the viewer's floor) and the model with
// no joints. The writer of +0x1454 / +0x14e0..e8 in the activation is not opened (the harness reads them as the J -> G
// yaw, |G - J| / 1484.6 and 1.0). One game frame per step, as CutTail. The viewer's em007_04_option.glb runs a frame
// late against the ROM evaluator, so the table, not the glb, is the source.
const HEAD_F = [
  0.01491, 0.02985, 0.04483, 0.05986, 0.07489, 0.08993, 0.10501, 0.1201, 0.13523, 0.15037, 0.16552, 0.18071,
  0.19589, 0.21108, 0.2263, 0.24151, 0.25673, 0.27196, 0.28719, 0.30243, 0.31767, 0.33291, 0.34814, 0.36335,
  0.37859, 0.3938, 0.409, 0.42419, 0.43938, 0.45453, 0.46969, 0.48481, 0.49994, 0.51503, 0.5301, 0.54515,
  0.56016, 0.57515, 0.59011, 0.60505, 0.61995, 0.63481, 0.64965, 0.66444, 0.6792, 0.69391, 0.70858, 0.7232,
  0.73779, 0.75232, 0.7668, 0.78124, 0.79563, 0.80997, 0.82424, 0.83845, 0.85258, 0.86671, 0.88075, 0.89472,
  0.90862, 0.92215, 0.93506, 0.94719, 0.95842, 0.96862, 0.97763, 0.9853, 0.99151, 0.99614, 0.99901, 1.0,
];
const HEAD_H = [
  62.988, 125.565, 187.82, 250.392, 312.963, 375.534, 437.882, 499.817, 560.959, 620.345, 675.336, 724.115,
  766.575, 803.221, 834.753, 861.89, 885.272, 905.403, 922.726, 937.622, 950.366, 961.218, 970.391, 978.068,
  984.386, 989.469, 993.452, 996.413, 998.443, 999.618, 1000.0, 999.618, 998.443, 996.413, 993.452, 989.469,
  984.386, 978.068, 970.406, 961.233, 950.382, 937.637, 922.756, 905.433, 885.317, 861.951, 834.829, 803.297,
  766.667, 724.222, 675.397, 620.345, 560.699, 499.481, 437.592, 375.321, 312.737, 250.153, 187.454, 125.0,
  116.636, 115.095, 114.744, 114.866, 114.988, 114.988, 114.988, 114.988, 114.988, 114.988, 114.988, 0.0,
];
const HEAD_Q = [
  0.0, 0.0, 0.0, 1.0, 0.18793, 0.00273, 0.00149, 0.98218,
  0.36919, 0.00537, 0.00293, 0.92933, 0.53823, 0.00904, 0.00293, 0.84275,
  0.68837, 0.0127, 0.00147, 0.72524, 0.81383, 0.01612, -0.00098, 0.58089,
  0.90965, 0.01905, -0.00488, 0.4149, 0.97222, 0.02075, -0.00977, 0.23292,
  0.99878, 0.02125, -0.01563, 0.04176, 0.98802, 0.01991, -0.0224, -0.15142,
  -0.94023, -0.01782, 0.02832, 0.33888, -0.85691, -0.01318, 0.03442, 0.51415,
  -0.74105, -0.00708, 0.0398, 0.67024, -0.59696, 0.00073, 0.04395, 0.80107,
  -0.42973, 0.01001, 0.04664, 0.9017, -0.24612, 0.02027, 0.04712, 0.96788,
  -0.05298, 0.03101, 0.04517, 0.99709, 0.14234, 0.04175, 0.04077, 0.9881,
  0.33213, 0.05202, 0.03395, 0.94119, 0.50935, 0.06104, 0.02466, 0.85804,
  0.66665, 0.06837, 0.01294, 0.74211, 0.79849, 0.07326, -0.00049, 0.59753,
  0.89954, 0.07545, -0.01538, 0.42999, 0.9658, 0.07448, -0.03126, 0.24639,
  0.995, 0.07008, -0.04713, 0.05323, -0.98602, -0.0625, 0.06225, 0.14135,
  -0.9394, -0.05127, 0.07617, 0.3303, -0.85699, -0.03711, 0.08814, 0.50638,
  -0.74204, -0.02002, 0.09743, 0.66293, -0.59915, -0.00098, 0.10303, 0.79398,
  -0.43408, 0.01953, 0.10498, 0.89452, -0.25298, 0.04078, 0.1028, 0.96113,
  -0.06276, 0.06178, 0.09597, 0.99148, 0.12894, 0.08181, 0.08498, 0.98461,
  0.31527, 0.09939, 0.07009, 0.94118, 0.48939, 0.11429, 0.05128, 0.86302,
  0.64464, 0.12551, 0.0293, 0.75354, 0.77582, 0.1326, 0.00513, 0.61684,
  0.87828, 0.13478, -0.02051, 0.45831, 0.94857, 0.13185, -0.04688, 0.28396,
  0.98453, 0.1238, -0.07252, 0.1006, -0.9854, -0.11109, 0.09668, 0.08545,
  -0.95167, -0.09326, 0.11841, 0.26758, -0.88504, -0.07129, 0.13672, 0.43923,
  -0.78811, -0.0459, 0.15088, 0.59499, -0.66502, -0.01782, 0.16015, 0.72923,
  -0.52032, 0.01196, 0.16408, 0.83798, -0.35915, 0.04248, 0.16261, 0.91802,
  -0.18753, 0.07252, 0.1553, 0.96719, -0.01099, 0.10109, 0.14236, 0.98458,
  0.16458, 0.12722, 0.12454, 0.97016, 0.33332, 0.14993, 0.10183, 0.92523,
  0.49006, 0.16848, 0.07521, 0.85194, 0.63067, 0.18215, 0.04541, 0.753,
  0.75067, 0.19048, 0.01368, 0.63248, 0.84726, 0.19314, -0.01953, 0.49444,
  0.91819, 0.18999, -0.05275, 0.34359, 0.96221, 0.18116, -0.08521, 0.18458,
  0.97884, 0.16676, -0.11646, 0.02222, -0.96879, -0.14795, 0.14283, 0.13843,
  -0.93314, -0.12598, 0.16334, 0.29444, -0.87345, -0.10106, 0.18089, 0.44063,
  -0.80279, -0.0752, 0.19581, 0.55815, -0.73832, -0.05225, 0.20729, 0.63968,
  -0.68493, -0.03296, 0.21561, 0.69519, -0.64385, -0.01856, 0.22121, 0.73224,
  -0.61432, -0.00952, 0.22439, 0.75642, -0.59505, -0.00317, 0.22733, 0.77086,
  -0.5842, 0.00049, 0.23021, 0.77828, -0.57969, 0.0022, 0.23271, 0.7809,
  -0.57918, 0.00293, 0.23489, 0.78062, -0.5816, 0.00244, 0.23708, 0.77815,
];
const qh = k => HEAD_Q.slice(4 * k, 4 * k + 4);

export class HornPiece007 {
  // J, G: game units, as CutTail's; G.y is the floor - 20 (unscaled, 0x740d0 vmov s2,#-20 for kind 2 on em 7)
  constructor(J, G){
    this.J = J; this.G = G; this.k = 0; this.yb = J[1];
    const dx = G[0] - J[0], dz = G[2] - J[2], dist = Math.hypot(dx, dz);
    const d = dist >= 2 ** -23 ? [dx / dist, dz / dist] : [0, 0];
    const dot = d[1];
    if (dot >= -0.999){ const r = Math.sqrt(2 * (1 + dot)); this.qa = [0, d[0] / r, 0, r / 2]; }
    else this.qa = [0, 1, 0, -4.37114e-8];
  }
  // on to step k (never back); true when the landing step (48) is passed on the way
  advance(k){
    let landed = false;
    for (let n = this.k + 1; n <= k; n++){
      const c = n + 1;
      if (c >= 11 && c <= 48){ const t = (c - 10) / 38; this.yb += t * t * (this.G[1] - this.yb); }
      if (n === 48) landed = true;
    }
    if (k > this.k) this.k = k;
    return landed;
  }
  pose(){
    if (this.k >= 71) return { position: this.G.slice(), quaternion: qmul(this.qa, qh(71)) };
    const k = this.k, f = HEAD_F[k];
    return { position: [this.J[0] + f * (this.G[0] - this.J[0]), this.yb + HEAD_H[k], this.J[2] + f * (this.G[2] - this.J[2])],
             quaternion: qmul(this.qa, qh(k)) };
  }
}

// a CUT_TAIL piece's `flight` names its class; a piece without one flies on CutTail
export const FLIGHTS = { em007_04_horn: HornPiece007 };
