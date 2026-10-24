// iteration copy of the duo block of dev/checks/em069_00.mjs (pageCheck serialised into the page)
async function pageCheckSeltasDuo(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Seltas duo: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (await test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em069_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  V.state.loop = true;
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip);
    if (!o){ check(false, 'the list has ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    const ok = await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
    await frames(2);
    return ok;
  };
  const P = () => V.partner();
  const fr = x => Math.round(x * 60);
  const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;

  // ---- THE CLASSES: combined clips mount him with the row Off, solo / release clips never, both follows the row
  await V.partner(false);
  await play('4', 'Motion[6]');
  let r = await P();
  check(r.mounted && r.class === 'combined' && r.rowDisabled === true,
        'L4 Motion[6] (her (4,0), issued only linked): he is mounted with the row Off, and the row is locked', { mounted: r.mounted, class: r.class, row: r.rowDisabled });
  await play('4', 'Motion[36]');
  r = await P();
  check(!r.mounted && r.class === 'both' && r.rowDisabled === false, 'L4 Motion[36] (both): with the row Off he is not mounted, the row is free', r);
  await V.partner(true);
  r = await P();
  check(r.mounted && r.mode === 'free' && r.local && r.local.clip === 'Motion[35]_loop', 'L4 Motion[36] with the row On: mounted, free -- his ride (1:0, L4 Motion[35]) starts his own loop', { mounted: r.mounted, mode: r.mode, local: r.local });
  for (const [list, clip, cls] of [['0', 'Motion[16]_start', 'solo'], ['4', 'Motion[29]', 'solo'], ['4', 'Motion[68]_loop', 'release'],
                                   ['3', 'Motion[18]', 'release'], ['3', 'Motion[35]_loop', 'release']]){
    await play(list, clip);
    r = await P();
    check(!r.mounted && r.class === cls && r.rowDisabled === true, 'L' + list + ' ' + clip + ' (' + cls + '): not mounted although the row is On', { mounted: r.mounted, class: r.class });
  }
  await play('4', 'Motion[36]');
  r = await P();
  check(r.mounted, 'and back on a both clip the row\'s On brings him back', r.mounted);

  // ---- THE PAIRS: his clip and his frame against hers, read at live frames (one clock: his time is set from hers)
  const pairAt = async (list, clip, expect, label, n = 4) => {
    await play(list, clip);
    const seen = [];
    for (let i = 0; i < n; i++){
      await frames(7);
      const q = await P();
      seen.push({ body: fr(q.bodyTime), local: q.local, t: q.clipTime });
    }
    check(seen.every(x => x.local && expect(x.body, x.local)), label, seen);
    return seen;
  };
  await pairAt('4', 'Motion[6]', (b, l) => l.clip === 'Motion[6]' && near(l.frame, b), 'her L4 Motion[6] -> his Motion[6] frame for frame (3:0x38)');
  await pairAt('4', 'Motion[17]', (b, l) => l.clip === 'Motion[6]' && near(l.frame, Math.min(137 + b, 194)), 'her L4 Motion[17] -> his Motion[6] from frame 137 (his one clip under her two)');
  await pairAt('4', 'Motion[24]', (b, l) => l.clip === 'Motion[7]' && near(l.frame, 49 + b), 'her L4 Motion[24] -> his Motion[7] from frame 49');
  await pairAt('4', 'Motion[10]', (b, l) => l.clip === 'Motion[5]_loop', 'her L4 Motion[10] -> his Motion[5] loop (3:0x3c / 3:0x42)');
  await pairAt('4', 'Motion[83]', (b, l) => l.clip === 'Motion[45]_loop', 'her L4 Motion[83] (two-layer attack) -> his Motion[45] loop (7:0x3b, request 0xe)');
  await pairAt('4', 'Motion[73]', (b, l) => l.clip === 'Motion[73]' && near(l.frame, b), 'her L4 Motion[73] -> his Motion[73] (3:0x40)');
  await pairAt('3', 'Motion[24]', (b, l) => l.clip === 'Motion[48]' && near(l.frame, Math.min(181 + b, 238)), 'her L3 Motion[24] -> his Motion[48] from 181 (3:0x36, request 0xd)');
  // RE-READ: her M46 / M47 (7:0x0b / 0x0c), her M55..M62 moves and the other actions her LINKED streams never issue are
  // solo -- he is not on her there (no more frozen ride on her hunter grab)
  for (const [list, clip] of [['4', 'Motion[46]'], ['4', 'Motion[47]'], ['4', 'Motion[55]_loop'], ['4', 'Motion[90]'], ['0', 'Motion[10]']]){
    await play(list, clip);
    r = await P();
    check(!r.mounted && r.class === 'solo' && r.rowDisabled === true, 'L' + list + ' ' + clip + ' (issued only by her unlinked streams): solo, not mounted', { mounted: r.mounted, class: r.class });
  }
  // the tail grab: his M79 loop under her M77, then the ROM freeze (his 1:0x21 sets his motion speed to 0, 0xb07b4)
  await pairAt('4', 'Motion[77]', (b, l) => l.clip === 'Motion[79]_loop' && near(l.frame, b % 61), 'her L4 Motion[77] -> his Motion[79] loop from 0 (1:0x20)');
  await pairAt('4', 'Motion[78]_loop', (b, l) => l.clip === 'Motion[79]_loop' && l.frame === 4, 'her L4 Motion[78] -> his Motion[79] pose HELD at 187 % 61 = 4 (1:0x21, speed 0) -- the ROM\'s freeze');

  // ---- HE MOVES where the ROM moves him: the largest change of any bone's rotation over his clip, sampled at her frames
  const bones = () => { const q = []; V.mounted.em076_00.traverse(o => { if (o.isBone) q.push(o.quaternion.clone()); }); return q; };
  const moveOver = async frames => {
    const snaps = [];
    for (const f of frames){ V.pose.action.time = f / 60; await P(); snaps.push(bones()); }
    let m = 0;
    for (let i = 1; i < snaps.length; i++) for (let j = 0; j < snaps[0].length; j++)
      m = Math.max(m, 2 * Math.acos(Math.min(1, Math.abs(snaps[0][j].dot(snaps[i][j])))));
    return +m.toFixed(3);
  };
  const moving = {};
  for (const [list, clip] of [['4', 'Motion[6]'], ['4', 'Motion[16]'], ['4', 'Motion[73]'], ['4', 'Motion[83]'], ['4', 'Motion[28]'],
                               ['4', 'Motion[77]'], ['4', 'Motion[9]'], ['4', 'Motion[14]'], ['4', 'Motion[4]']]){
    await play(list, clip);
    const was0 = V.pose.action.paused; V.pose.action.paused = true;
    const d = Math.max(1, Math.round(V.pose.action.getClip().duration * 60) - 2);
    moving[list + '|' + clip] = await moveOver([0, Math.round(d / 4), Math.round(d / 2), Math.round(3 * d / 4), d]);
    V.pose.action.paused = was0;
  }
  check(Object.values(moving).every(v => v >= 0.2), 'under every one of her clips that asks for an answer he MOVES (max bone turn >= 0.2 rad)', moving);
  // ---- HIS OWN LOGIC under a clip of hers that asks nothing (render/monster.js ROM_PARTNER_BODY `free`): the ride to
  // its frame 180, then his table's draw (20 M31, 70 M32, 10 the ride), the game's xorshift128 seeded by her clip
  { await play('4', 'Motion[41]');
    V.pose.action.paused = true;
    r = await P();
    const spec = M.ROM_PARTNER_BODY.em069_00, S4 = V.MON.monsters.find(m => m.id === 'em076_00').lists.find(l => l.id === '4');
    const want = M.freeTimeline(spec.free, M.seedOf('4|Motion[41]'), 3600, n => Math.round(S4.clips.find(x => x.clip === n).dur * 60));
    const got = (r.layout || []).map(x => x.clip + ':' + x.frames);
    check(false && JSON.stringify(got.slice(0, 12)) === JSON.stringify(want.slice(0, 12).map(x => x.clip + ':' + x.frames)),
          'under her L4 Motion[41] (no request) his sequence is the one his table draws: ride 180, draw, pick, ride 180, ...', { got: got.slice(0, 8) });
    const at = async f => { V.pose.action.time = f / 60; const q = await P(); return q.local ? q.local.clip + '@' + q.local.frame : null; };
    const a179 = await at(179);
    const first = want.find((x, i) => i > 0 && x.kind === 'attack');
    const firstAt = want.slice(0, want.indexOf(first)).reduce((n, x) => n + x.frames, 0);
    const a1 = await at(250), a2 = await at(60), a3 = await at(250);
    check(false && a1 === a3 && (want[1].kind === 'attack') === !a1.startsWith('Motion[35]'),
          'his ride runs to frame 180 (0xfc7dec), then his draw takes over; a scrub back and forth gives the same choice', { a179, a1, a2, a3, second: want[1].clip });
    if (first && firstAt + 60 < 403){
      V.pose.action.time = (firstAt + 50) / 60;
      const q = await P();
      check(q.local && q.local.clip === first.clip && q.clawStage === M.clawStageAt('em076_00', first.clip, q.local.frame) && q.clawStage > 0,
            'his first riding attack (' + first.clip + ') grows his claws on its own schedule', { local: q.local, stage: q.clawStage, set: q.clawSet });
    }
    V.pose.action.paused = false; }

  // ---- HIS OWN LIST on her Animation list (the Nakarkos model): his clip on him, her side on her
  const sl = [...listSel.options].find(o => o.value === 'S_4');
  check(!!sl, 'her Animation list offers his combined clips (list S_4, "Seltas (combined)")', [...listSel.options].map(o => o.value));
  if (sl){
    await V.partner(false);
    await play('S_4', 'Seltas Motion[31]');
    r = await P();
    check(r.mounted && r.rowValue === '1' && r.clip === 'Motion[31]' && r.herSide && r.herSide.body[0] === '0|Motion[1]_loop',
          'Seltas Motion[31] (his riding attack 7:0x32): mounted with the row Off, the row shows Combined, she idles (L0 M1)', { mounted: r.mounted, row: r.rowValue, clip: r.clip, her: r.herSide });
    V.pose.action.paused = true;
    V.pose.action.time = 50 / 60; r = await P();
    const at50 = { stage: r.clawStage, set: r.clawSet, big: r.drawnParts.includes(103), small: r.drawnParts.includes(10) };
    V.pose.action.time = 10 / 60; r = await P();
    const at10 = { stage: r.clawStage, set: r.clawSet, big: r.drawnParts.includes(103) };
    check(at50.stage === 12 && at50.set === 11 && at50.big && !at50.small && at10.stage === 0 && !at10.big,
          'his claws on M31: retracted at frame 10, the massive claw (part 103) at frame 50 -- stage 12 (grown from 30)', { at10, at50 });
    const att = await moveOver([0, 60, 120, 180, 240]);
    check(att >= 0.2, 'and he moves through it', att);
    V.pose.action.paused = false;
    await play('S_4', 'Seltas Motion[6]');
    r = await P();
    check(r.mounted && r.clip === 'Motion[6]' && JSON.stringify(r.herSide.body) === JSON.stringify(['4|Motion[6]', '4|Motion[17]']) && r.herSide.frames >= 194,
          'Seltas Motion[6]: she plays her M6 then M17 (the asking action (4,0)) under his one clip', r.herSide);
    await V.partner(true);
  }

  // ---- ENABLED wherever the ROM has him: on a fresh load, a list change and the joined clip, the row shows Combined
  await V.partner(false);
  const other = [...monSel.options].find(o => o.value !== MON && o.value.startsWith('em0'));
  if (other){ monSel.value = other.value; await monSel.onchange(); await frames(5); monSel.value = MON; await monSel.onchange(); await frames(5); }
  await play('0', 'Motion[1]_loop');
  await play('4', 'Motion[16]');
  r = await P();
  check(r.mounted && r.rowValue === '1' && r.rowDisabled, 'after a reload of her and a list change to L4 Motion[16]: mounted, the row reads Combined (locked)', { mounted: r.mounted, row: r.rowValue });

  // ---- THE GRABS: his root stays in her tail pincers (midpoint of joints 160 / 161) through every frame she holds him
  {
    const SK = await import('/render/skeleton.js');
    const gb = (root, gid) => { const b = SK.gidBonesOf(root).find(x => x.gid === gid); return b && b.node; };
    const wp = n => { n.updateWorldMatrix(true, false); return new (V.scene.position.constructor)().setFromMatrixPosition(n.matrixWorld); };
    const gap = async f => {
      V.pose.action.time = f / 60; await frames(2); const q = await P();
      const m = V.mounted.main, pc = wp(gb(m, 160)).add(wp(gb(m, 161))).multiplyScalar(0.5);
      return { d: +pc.distanceTo(wp(gb(V.mounted.em076_00, 0))).toFixed(2), local: q.local };
    };
    await V.partner(true);
    // [her clip, from, to (frames), bound, his clip]: M27 loop he hovers in reach; M28 carried to frame 220 then set down;
    // M77 / M78 the whole clip; M79 to frame 128, then back on her back
    for (const [clip, f0, f1, bound, his] of [['Motion[27]_loop', 0, 68, 2.2, 'Motion[27]_loop'], ['Motion[28]', 0, 220, 2.1, 'Motion[28]'],
                                                ['Motion[77]', 0, 185, 1.8, 'Motion[79]_loop'], ['Motion[78]_loop', 0, 157, 1.4, 'Motion[79]_loop'],
                                                ['Motion[79]', 0, 128, 1.3, 'Motion[79]_loop']]){
      await play('4', clip);
      V.pose.action.paused = true;
      const seen = [];
      for (let f = f0; f <= f1; f += 6) seen.push(await gap(f));
      const mx = Math.max(...seen.map(x => x.d));
      check(false,
            'GRAB her L4 ' + clip + ': his root within ' + bound + ' of her pincers over frames ' + f0 + '..' + f1 + ' (max ' + mx + '), his ' + his, seen.map(x => x.d));
      V.pose.action.paused = false;
    }
    // the freeze: the held pose is his M79 frame 4 exactly, in every frame of her M78
    await play('4', 'Motion[78]_loop'); V.pose.action.paused = true;
    const hs = [];
    for (const f of [0, 40, 80, 120, 158]){ V.pose.action.time = f / 60; const q = await P(); hs.push(q.local && q.local.frame); }
    check(hs.every(x => x === 4), 'her M78: his pose stays on his M79 frame 4 at every frame (his 1:0x21, speed 0)', hs);
    V.pose.action.paused = false;
  }

  // ---- HER COMBINED ATTACK 7:0x4e / 0x4f with his 7:0x3f, from his list: her M65 to his frame 105, then her M42 from 90
  {
    await play('S_4', 'Seltas Motion[33] with her 7:0x4e');
    V.pose.action.paused = true;
    const at = async f => { V.pose.action.time = f / 60; const q = await P(); return q.local && q.local.clip + '@' + q.local.frame; };
    const pts = { 0: await at(0), 104: await at(104), 106: await at(106), 146: await at(146) };
    r = await P();
    check(r.mounted && r.herSide && JSON.stringify(r.herSide.body) === JSON.stringify(['0|Motion[65]', '4|Motion[42]@90']) &&
          pts[0] === 'Motion[33]@0' && pts[104] === 'Motion[33]@104' && pts[106].startsWith('Motion[35]_loop@') && pts[146] === 'Motion[33]@101',
          'her 7:0x4e / 0x4f with his 7:0x3f: his M33 to 105 (she switches to M42 from 90), his M35 for 40, his M33 from 100', { pts, her: r.herSide });
    V.pose.action.paused = false;
  }

  // ---- SYNC across a loop wrap and a scrub: her M72_loop (35 frames) with his M71 loop from 9
  await play('4', 'Motion[72]_loop');
  const wrapSeen = [];
  let lastB = -1, wrapped = false;
  for (let i = 0; i < 40 && !(wrapped && wrapSeen.length > 6); i++){
    await frames(3);
    const q = await P();
    const b = fr(q.bodyTime);
    if (b < lastB) wrapped = true;
    lastB = b;
    wrapSeen.push({ b, his: q.local && q.local.frame, ok: q.local && q.local.clip === 'Motion[71]_loop' && near(q.local.frame, (9 + b) % 10, 1) });
  }
  check(wrapped && wrapSeen.every(x => x.ok), 'her M72 loop wraps and his M71 loop stays on (9 + her frame) % 10 across it', wrapSeen);
  await play('4', 'Motion[6]');
  V.pose.action.time = 100 / 60;
  r = await P();
  check(r.local && r.local.clip === 'Motion[6]' && near(r.local.frame, 100, 1), 'a scrub to her frame 100 puts him on his frame 100', r.local);
  const was = V.pose.action.paused; V.pose.action.paused = true;
  const a1 = await P(); await frames(5); const a2 = await P();
  check(a1.clipTime === a2.clipTime, 'paused: his time does not move on its own', [a1.clipTime, a2.clipTime]);
  V.pose.action.paused = was;

  // ---- HIS FORM: claw stage 0 (part 10), the glow (part 9) drawn, the wings Away
  r = await P();
  check(r.clawStage === 0 && r.clawSet === 4 && r.drawnParts.includes(10) && !r.drawnParts.includes(103),
        'his claws: stage 0 -> set 4, part 10 (retracted) -- no answer of his grows them (0xfc4808 zeroes the stage each action)', { stage: r.clawStage, set: r.clawSet, parts: r.drawnParts });
  check(r.drawnParts.includes(9) && ![1, 2, 3, 4].some(p => r.drawnParts.includes(p)), 'the combined glow, part 9, drawn; wings Away (parts 1..4 off)', r.drawnParts);
  const st = [0, 29, 30, 34, 38, 42, 100, 134, 140, 146, 150].map(f => [f, M.clawStageAt('em076_00', 'Motion[31]', f)]);
  check(JSON.stringify(st.map(x => x[1])) === JSON.stringify([0, 0, 0, 4, 8, 12, 12, 12, 6, 0, 0]),
        'the claw stage on his Motion[31] (7:0x32): grows from 30 at 1 a frame to 12, shrinks from 134', st);
  check(M.clawSetOf([4, 9, 10, 11], 0) === 4 && M.clawSetOf([4, 9, 10, 11], 4) === 9 && M.clawSetOf([4, 9, 10, 11], 8) === 9 &&
        M.clawSetOf([4, 9, 10, 11], 9) === 10 && M.clawSetOf([4, 9, 10, 11], 12) === 11, 'the stage -> set rule: <4 set 4, <=8 set 9, <12 set 10, else 11 (0xfc63d8)');

  // ---- THE JOINED ANIMATION: S. Motion[76]-[79] -- combined, his pieces laid out on her frames, the blends in
  listSel.value = 'Special'; await listSel.onchange();
  const so = [...clipSel.options].find(x => x.value === 'S. Motion[76]-[79]');
  if (so){ clipSel.value = so.value; await clipSel.onchange(); await until(() => V.pose.action && V.pose.action.getClip().name === so.value, 300); await frames(3); }
  r = await P();
  const lay = (r.layout || []).map(x => x.clip + ':' + x.mode + '@' + x.from + '+' + x.frames + (x.mode === 'hold' ? '=' + x.start : ''));
  check(so && r.rowValue === '1', 'S. Motion[76]-[79] is on her Special list (not list 4) and the row reads Combined', { found: !!so, row: r.rowValue });
  check(r.mounted && r.class === 'combined' && r.mode === 'seq' && lay.length === 5 &&
        lay[0] === 'Motion[35]_loop:wrap@0+26' && lay[1] === 'Motion[35]_loop:wrap@26+40' && lay[2] === 'Motion[79]_loop:wrap@66+187' &&
        lay[3] === 'Motion[79]_loop:hold@253+159=4' && lay[4] === 'Motion[79]_loop:hold@412+197=4',
        'S. Motion[76]-[79]: combined; his ride through her M76, his M79 loop through M77, the frozen pose (frame 4) through M78 and M79', lay);
  V.pose.action.time = 0;
  // THE BLEND (composeClip `blend`): the cut into a piece eases from the pose it left -- continuous at the cut, the
  // piece's own pose `blend` frames on
  const S = V.MON.monsters.find(m => m.id === 'em076_00'), L4 = S.lists.find(l => l.id === '4');
  const c35 = await M.clipFor(L4, 'Motion[35]_loop', S.glb), c79 = await M.clipFor(L4, 'Motion[79]_loop', S.glb);
  const hard = await M.composeClip('t-hard', [{ clip: c35, frames: 10, mode: 'wrap', start: 0 }, { clip: c79, frames: 10, mode: 'wrap', start: 0 }], S.glb);
  const soft = await M.composeClip('t-soft', [{ clip: c35, frames: 10, mode: 'wrap', start: 0 }, { clip: c79, frames: 10, mode: 'wrap', start: 0, blend: 4 }], S.glb);
  let cont = 0, jump = 0, settled = 0, n = 0;
  for (const tr of soft.tracks){
    const h = hard.tracks.find(x => x.name === tr.name), k = tr.getValueSize();
    if (!h) continue;
    const at = (t, f) => Array.from(t.values.slice(f * k, f * k + k));
    const d = (x, y) => Math.max(...x.map((v, i) => Math.abs(v - y[i])));
    n++;
    if (d(at(tr, 10), at(tr, 9)) < 1e-5) cont++;
    if (d(at(h, 10), at(h, 9)) > 1e-3) jump++;
    if (d(at(tr, 14), at(h, 14)) < 1e-5) settled++;
  }
  check(n > 0 && cont === n && jump > 0 && settled === n,
        'a blend of 4: at the cut every track holds the pose it left (a hard cut jumps on ' + jump + '), 4 frames on it is the piece\'s own', { tracks: n, cont, jump, settled });
  return out;
}
export const pageCheck = pageCheckSeltasDuo;
