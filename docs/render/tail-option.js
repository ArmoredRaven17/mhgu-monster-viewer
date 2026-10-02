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
  em007_00: { piece: 'em007_00_tail', joint: 144, above: 20, landing: ['em007_00u', 905] },
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
  em044_00: { piece: 'em044_00_tail', joint: 142, above: 20, landing: ['em044_00u', 905] },
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
  em047_00: { piece: 'em047_00_tail', joint: 143, above: 20, landing: ['em047_00u', 905] },
  // ALATREON: sever kind 0x8e and u 900 names JOINT 144; his descriptor's slot 0 exists and
  // em050_00_tail.glb is staged. His tail has no .dtp row at all, so there is no broken level -- only
  // the sever. (states-em050_00.md 0, 4.4)
  em050_00: { piece: 'em050_00_tail', joint: 144, above: 20, landing: ['em050_00u', 905] },
  // SEREGIOS: sever kind 0x91 (as Diablos and Glavenus pass) and u 900 names JOINT 144; descriptor
  // [0x172ba68 + 4*62] = 0x1598254 has word[1] != -1, so uEnemyOption slot 0 exists, and em077_00.arc ships
  // em077_00_tail plus the Rath line's em001_00_option.lmt -- so the piece flies on Rathian's option poses.
  // His tail has NO .dtp row: there is no broken level, only the sever. (states-em077_00.md 4.4)
  em077_00: { piece: 'em077_00_tail', joint: 144, above: 20, landing: ['em077_00u', 905] },
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
  em057_00: { piece: 'em057_00_tail', joint: 144, above: 20, landing: ['em057_00u', 905] },
  em057_04: { piece: 'em057_04_tail', joint: 144, above: 20, landing: ['em057_04u', 905] },
  // URAGAAN: u 900 names JOINT 142 and the sever is GATED on the tail already being at break level >= 1.
  em045_00: { piece: 'em045_00_tail', joint: 142, above: 20, landing: ['em045_00u', 905] },
  // CRYSTALBEARD: his tail sever names JOINT 144 and needs level >= 2. HE HAS A SECOND PIECE THIS TABLE CANNOT
  // CARRY: his BEARD comes off through uEnemyOption SLOT 1 (one of only three monsters in the ROM with a live
  // slot 1) with its own `em045_04_head.mod`. One `piece` per monster, so the tail is wired and the beard is
  // named -- the same gap Barroth's head has. (states-em045_00.md 4, 7)
  em045_04: { piece: 'em045_04_tail', joint: 144, above: 20, landing: ['em045_04u', 905] },
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
