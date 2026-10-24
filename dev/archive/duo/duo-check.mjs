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
  // her raw lists play her ALONE; the combined list ('duo') carries every duo animation. `playRaw` picks a raw clip;
  // `play(list, clip)` picks that clip's entry on the combined list (required, else '+ Seltas free')
  const pickOn = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip);
    if (!o){ check(false, 'the list ' + list + ' has ' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    // (a combined entry led by a clip of hers plays that raw clip under its own name)
    const ent = ((V.MON.monsters.find(m => m.id === MON).lists.find(l => l.id === list) || {}).clips || []).find(c => c.clip === clip);
    const want = ent && ent.her ? ent.her.clip : o.value;
    const ok = await until(() => V.pose.action && V.pose.action.getClip().name === want, 300);
    await frames(2);
    return ok;
  };
  const DUO = 'duo';
  const duoList = () => V.MON.monsters.find(m => m.id === MON).lists.find(l => l.id === DUO);
  const duoName = (list, clip) => {
    const L = duoList(), n1 = 'Queen L' + list + ' ' + clip, n2 = n1 + ' + Seltas free';
    return L.clips.some(c => c.clip === n1) ? n1 : L.clips.some(c => c.clip === n2) ? n2 : null;
  };
  const play = async (list, clip) => {
    if (list === DUO || list === 'Special') return pickOn(list, clip);
    const n = duoName(list, clip);
    if (!n){ check(false, 'the combined list has ' + list + '|' + clip); return false; }
    return pickOn(DUO, n);
  };
  const playRaw = pickOn;
  const P = () => V.partner();
  const fr = x => Math.round(x * 60);
  const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
  let r;

  // ---- THE LISTS: her raw lists never mount him; the combined list holds the duo animations, grouped
  {
    const L = duoList();
    const g = L && L.groups;
    check(!!L && L.label === 'Combined (with Seltas)' && g && g.required === 44 && g.joined === 1 && g.leaves === 5 && g.his === 8 && g.free === 95 &&
          L.clips.length === 153 && !V.MON.monsters.find(m => m.id === MON).lists.some(l => l.id === 'Special'),
          'the combined list: 44 required clips of hers, 1 joined, 5 where he leaves her, 8 of his (his drop off her too), 95 of hers with him free -- and the Special list (it held only the duo clip) is gone', g);
    const order = L.clips.map(c => c.group);
    check(order.join(',') === [...Array(44).fill('required'), 'joined', ...Array(5).fill('leaves'), ...Array(8).fill('his'), ...Array(95).fill('free')].join(','),
          'grouped in order: required, joined, leaves, his, free');
    const names = new Set(L.clips.map(c => c.clip));
    const outs = ['Queen L0 Motion[16]_start', 'Queen L4 Motion[29]', 'Queen L4 Motion[68]_loop', 'Queen L3 Motion[18]', 'Queen L0 Motion[21]',
                  'Queen L4 Motion[89]'];
    check(outs.every(n => !names.has(n) && !names.has(n + ' + Seltas free')), 'solo / release / unresolved clips are not on it as hers-with-him', outs);
    const lv = L.clips.filter(c => c.group === 'leaves').map(c => c.clip);
    check(lv.includes('Queen L4 Motion[68]_loop + Seltas leaves') && lv.includes('Queen L3 Motion[18] + Seltas leaves') &&
          lv.every(n => / \+ Seltas leaves$/.test(n)) && !names.has('Queen L0 Motion[16]_start + Seltas leaves'),
          'the release clips (request 7) are on it only as "+ Seltas leaves"', lv);
    check(names.size === L.clips.length, 'one entry per animation (no duplicate names)');
  }
  for (const [list, clip] of [['4', 'Motion[6]'], ['4', 'Motion[83]'], ['4', 'Motion[36]'], ['0', 'Motion[1]_loop'], ['3', 'Motion[24]'], ['4', 'Motion[77]']]){
    await playRaw(list, clip);
    r = await P();
    check(!r.mounted && !document.querySelector('#monGroups .field[data-row="partner:em076_00"]'),
          'raw L' + list + ' ' + clip + ': the Queen alone, no Seltas row', { mounted: r.mounted });
  }
  // EVERY entry of the combined list mounts him and plays its ROM pair
  {
    const M_ = await import('/render/monster.js'), spec = M_.ROM_PARTNER_BODY.em069_00;
    const bad = [];
    for (const c of duoList().clips){
      await pickOn(DUO, c.clip);
      const q = await P();
      let want = null;
      if (c.leaves || c.drop) want = 'unlinked';
      else if (c.her){
        const pr = M_.partnerPairOf(spec, c.her.list, c.her.clip);
        want = pr.seq[0].clip === 'Motion[35]_loop' && !spec.pairs[c.her.list + '|' + c.her.clip] ? 'free' : pr.seq[0].clip;
      } else if (c.his) want = c.his;
      const bare = x => String(x).replace(/_(start|loop)$/, '');
      const ok = q.mounted && ((c.leaves || c.drop) ? (q.released && q.unl && q.unl.kind === (c.drop ? 'drop' : 'leave') && q.local) : want === 'free' ? (q.mode === 'free' && q.local && /^Motion\[3[1-5]\]/.test(q.local.clip))
                             : want ? (q.local && bare(q.local.clip) === bare(want)) : q.mode === 'seq');
      if (!ok) bad.push({ entry: c.clip, want, got: q.local, mode: q.mode, mounted: q.mounted });
    }
    check(bad.length === 0, 'every one of the 153 combined-list entries mounts him and plays its ROM pair (his own logic on the free ones)', bad.slice(0, 6));
  }
  // leaving the list drops him
  await playRaw('4', 'Motion[36]');
  r = await P();
  check(!r.mounted, 'leaving the combined list (raw L4 Motion[36]) drops him', r.mounted);

  // ---- THE DISMOUNTS (render/monster.js ROM_PARTNER_BODY `dismounts`; spec §18): unlinked he is a unit of his own, in world
  // space -- his clip's joint 0 drawn on his unit (the reference track held), the unit moved by his code
  {
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const at = async f => { V.pose.action.paused = true; V.pose.action.time = f / 60; await frames(3); return P(); };
    // the LEAVE (request 7 -> his 1:0x13): M46 b4; at its end the unit jumps by (0, 1392.5, 245) x size along his facing;
    // M47 b0; then vt+0x3e0's (0, 3): L1 M1, the hover
    await pickOn(DUO, 'Queen L4 Motion[68]_loop + Seltas leaves');
    const q0 = await at(0), q20 = await at(20), q30 = await at(30), q31 = await at(31), q60 = await at(60);
    check(q0.mounted && q0.released && q0.unl && q0.unl.kind === 'leave' && dist(q0.frameAt, q0.bodyJointAt) < 0.01 && q0.local.clip === 'Motion[46]',
          'leave: at her frame 0 his unit is where joint 200 is, unlinked, playing M46', { f: q0.frameAt, j: q0.bodyJointAt, local: q0.local });
    check(dist(q20.frameAt, q0.frameAt) < 1e-3 && dist(q20.bodyJointAt, q0.bodyJointAt) > 0.5 && dist(q20.partnerJoint0At, q0.partnerJoint0At) > 1,
          'leave: his unit stays put while her joint 200 moves on -- his root rises on M46\'s own path', { f: [q0.frameAt, q20.frameAt], j: [q0.bodyJointAt, q20.bodyJointAt], root: [q0.partnerJoint0At, q20.partnerJoint0At] });
    const S = q0.frameScale, y = q0.unl.yaw;
    const want = [q0.frameAt[0] + Math.sin(y) * 2.45 * S, q0.frameAt[1] + 13.925 * S, q0.frameAt[2] + Math.cos(y) * 2.45 * S];
    check(dist(q31.frameAt, want) < 0.01 && q31.local.clip === 'Motion[47]',
          'leave: at M46\'s end (frame 31) the unit moves up 1392.5 and forward 245 x his size (0xfc8d44), M47 plays', { got: q31.frameAt, want });
    check(dist(q31.partnerJoint0At, q30.partnerJoint0At) < 0.2, 'leave: his root runs on across the M46 -> M47 seam (the code\'s jump and the clip agree)', { r30: q30.partnerJoint0At, r31: q31.partnerJoint0At });
    check(q60.local && q60.local.clip === 'Motion[1]_loop' && q60.local.list === '1' && dist(q60.frameAt, q31.frameAt) < 1e-3,
          'leave: after M47, his hover L1 M1 (vt+0x3e0 -> (0, 3)) where the jump left him', q60.local);
    check(q0.groupsOn && !q0.groupsOn.includes(8), 'leave: his glow (group 8) off from the unlink (0xfc6468)', q0.groupsOn);
    // the DROP (his 1:0x22): turned 180 degrees at frame 0, falling -10 / frame and -1 / frame^2 to her ground, L3 M11, L3 M29,
    // then vt+0x3dc's (0, 0): L0 M1
    await pickOn(DUO, 'Seltas Motion[77] drop off her (1:0x22)');
    const d0 = await at(0), n = d0.unl.tLand;
    const d5 = await at(5), dL = await at(n), dM = await at(n + 190), dI = await at(n + 315 + 5);
    const fall5 = d0.frameAt[1] - (10 * 5 + 0.5 * 25) * 0.01;
    check(d0.unl.kind === 'drop' && Math.abs(Math.abs(d0.frameYaw - d0.unl.yaw) - Math.PI) < 1e-3 && d0.local.clip === 'Motion[77]_start',
          'drop: at frame 0 he is turned 180 degrees from his facing on her (yaw + 0x8000), playing M77', { yaw: d0.frameYaw, base: d0.unl.yaw });
    check(Math.abs(d5.frameAt[1] - fall5) < 1e-3, 'drop: 5 frames in, the unit has fallen 10 x 5 + 25 / 2 game units (0x7d65c)', { y: d5.frameAt[1], want: fall5 });
    check(n > 0 && Math.abs(dL.frameAt[1] - d0.unl.floor) < 0.1 && dL.local.clip === 'Motion[11]_start' && dL.local.list === '3',
          'drop: on the ground at frame ' + n + ' (her ground, the grid floor), L3 M11 from there', { y: dL.frameAt[1], floor: d0.unl.floor, local: dL.local });
    check(dM.local.clip === 'Motion[29]' && dI.local.clip === 'Motion[1]_loop' && dI.local.list === '0',
          'drop: L3 M11 (start and one loop pass) -> L3 M29 -> L0 M1 (vt+0x3dc, unaware: (0, 0))', { m: dM.local, i: dI.local });
    check(d0.partnerJoint0At[1] - dL.partnerJoint0At[1] > 1.5, 'drop: his root comes down with him', { r0: d0.partnerJoint0At, rL: dL.partnerJoint0At });
    V.pose.action.paused = false;
    // HIS EFFECTS FOLLOW THE UNLINKED PIECES (his own runtime, render/rom/effect-mounts.js partnerEffectRuntime; index.html
    // partnerFxClip): the schedule is keyed on the piece's own list -- L3 M11 on landing, whose PSL bit 0 (cm202_020 key 121,
    // on frames 1..2) starts there -- and his unit is the unlinked frame
    {
      const FX = await import('/render/rom/effect-mounts.js');
      if (!M.effectRuntimeInstance()){ await V.effects(true); }
      await until(() => FX.partnerEffectRuntime() && FX.partnerEffectRuntime().schedule, 600);
      const PR = FX.partnerEffectRuntime(), PS = PR && PR.schedule;
      check(!!PS && PR.monsterId === 'em076_00', 'his effect runtime is up', PR && PR.monsterId);
      if (PS){
        const got = [];
        const st0 = PS.start.bind(PS);
        PS.start = e => { if (e.def && e.def.record) got.push(e.def.record.key); return st0(e); };
        await pickOn(DUO, 'Seltas Motion[77] drop off her (1:0x22)');
        const n0 = (await at(0)).unl.tLand;
        const k1 = (await at(n0 + 1), PS.clip && { key: PS.clip.key, frame: Math.round(PS.clip.frame) });
        V.pose.action.time = Math.max(0, n0 - 2) / 60; got.length = 0; V.pose.action.paused = false; await frames(8); V.pose.action.paused = true;
        check(k1 && k1.key === 'em076_00|3|Motion[11]' && k1.frame === 1 && got.includes(121),
              'drop: on landing his schedule runs L3 M11 at its own frame and starts its PSL record (cm202_020 key 121)', { k1, got });
        await pickOn(DUO, 'Queen L4 Motion[68]_loop + Seltas leaves');
        await at(80);
        const k2 = PS.clip && { key: PS.clip.key, frame: Math.round(PS.clip.frame) };
        const u = (await P()).frameAt, um = PR.unitSource && PR.unitSource();
        const up = um ? [um.elements[12], um.elements[13], um.elements[14]].map(v => +v.toFixed(3)) : null;
        check(k2 && k2.key === 'em076_00|1|Motion[1]', 'leave: in the hover his schedule runs on his list 1 (L1 M1)', k2);
        check(up && Math.hypot(up[0] - u[0], up[1] - u[1], up[2] - u[2]) < 0.01, 'leave: the unit of his effects is his unlinked unit (after the jump), not joint 200', { unit: up, frame: u });
        PS.start = st0;
      }
      V.pose.action.paused = false;
    }
    // a linked entry still follows her joint, as a control for the same readback
    await play('4', 'Motion[36]');
    const c0 = await at(0), c1 = await at(40);
    check(!c0.released && dist(c0.frameAt, c0.bodyJointAt) < 0.01 && dist(c1.frameAt, c1.bodyJointAt) < 0.01 && dist(c1.frameAt, c0.frameAt) > 1e-3,
          'control: on a linked entry (L4 M36 + Seltas free) his root follows joint 200 frame by frame', { f: [c0.frameAt, c1.frameAt], j: [c0.bodyJointAt, c1.bodyJointAt] });
    check(c1.groupsOn && c1.groupsOn.includes(8), 'control: linked, the glow group 8 is on', c1.groupsOn);
    V.pose.action.paused = false;
  }

  // ---- HIS WINGS ON HER (render/monster.js ROM_WINGS): his flight state by his clip and frame -- folded on the ridden
  // clips (Raven's Away), out on the fly-in (1:0x2, M8: part 4), flapping where his answer flies (part 2 / parts 1, 3, 4)
  {
    const J = x => JSON.stringify(x);
    const wingsAt = async f => { V.pose.action.paused = true; V.pose.action.time = f / 60; await frames(3); const q = await P();
                                 return { w: q.wingParts, drawn: (q.drawnParts || []).filter(p => p >= 1 && p <= 4) }; };
    await play('4', 'Motion[6]');
    const r6 = await wingsAt(30);
    check(r6.w === null && J(r6.drawn) === '[]', 'ridden (her L4 M6, his M6: folded): no wing card -- Away', r6);
    await play('4', 'Motion[8]');
    const r8 = [await wingsAt(0), await wingsAt(40)];
    check(r8.every(x => J(x.drawn) === '[4]'), 'his fly-in / landing on her (her L4 M8, his 1:0x2 M8: out): part 4', r8);
    await pickOn(DUO, 'Seltas Motion[34]');
    const r34 = []; for (let f = 0; f < 4; f++) r34.push((await wingsAt(f)).drawn);
    check(J(r34) === J([[2], [2], [1, 3, 4], [1, 3, 4]]), 'his flying attack on her (Seltas Motion[34], 7:0x3a): flapping, part 2 / parts 1, 3, 4 every 2 frames', r34);
    await pickOn(DUO, 'Queen L4 Motion[68]_loop + Seltas leaves');
    const rl = []; for (let f = 0; f < 4; f++) rl.push((await wingsAt(f)).drawn);
    check(J(rl) === J([[2], [2], [1, 3, 4], [1, 3, 4]]), 'his leaving (1:0x13, M46): flapping from the unlink frame', rl);
    await pickOn(DUO, 'Seltas Motion[31]');
    const r31 = await wingsAt(60);
    check(r31.w === null && J(r31.drawn) === '[]', 'his riding attack M31 (7:0x32: folded): no card', r31);
    V.pose.action.paused = false;
  }

  // ---- HER RECORDS ON THE COMBINED LIST: every consumer keyed on list|clip reads a combined entry as the clip of hers it
  // plays (index.html seqMotionNow / partnerMotionNow). Each case is played raw and as its combined entry, and what the
  // schedule, the PSL word, the state table and her parts show is compared, at fixed frames and over a run from frame 0
  {
    const MS_ = await import('/render/motion-states.js');
    if (!M.effectRuntimeInstance()){ await V.effects(true); await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule, 300); }
    const RT = M.effectRuntimeInstance(), SS = RT && RT.schedule;
    check(!!SS && RT.monsterId === MON, 'her effect runtime is up for the routing cases', RT && RT.monsterId);
    if (SS){
      const started = [];
      const st0 = SS.start.bind(SS);
      SS.start = e => { started.push(e.def && e.def.record ? e.def.record.pel + ':' + e.def.record.key : String(e.when)); return st0(e); };
      const herParts = () => { const d = V.mounted.main.userData.partsDrawn; return d ? JSON.stringify([...d].sort((a, b) => a[0] - b[0])) : null; };
      const snap = async f => {
        V.pose.action.paused = true; V.pose.action.time = f / 60; await frames(3);
        const ms = V.motionStates(), c = SS.clip || {};
        return { key: c.key, frame: Math.round(c.frame || 0), motion: c.motion ? Object.keys(c.motion).length + ':' + (c.motion.frames || '') : null,
                 mask: c.mask, msKey: ms.cur && ms.cur.key, sets: ms.cur && JSON.stringify(ms.cur.sets), rage: ms.cur && ms.cur.rage,
                 parts: herParts() };
      };
      const run = async n => {
        V.pose.action.paused = true; V.pose.action.time = 0; await frames(2);
        started.length = 0; V.pose.action.paused = false; await frames(n); V.pose.action.paused = true;
        return [...new Set(started)].sort();
      };
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const L = duoList();
      const cases = [];
      // an L4 clip of hers that requests an effect from its PSL (a required entry), and her state-table rows (free entries)
      const fxReq = L.clips.find(c => c.group === 'required' && M.clipEffectsFor(MON, c.her.clip.replace(/_(start|loop)$/, ''), c.her.list));
      if (fxReq){
        const b = M.clipEffectsFor(MON, fxReq.her.clip.replace(/_(start|loop)$/, ''), fxReq.her.list).bits[0].on[0][0];
        cases.push({ c: fxReq, at: [0, b + 2], n: b + 12, why: 'a PSL effect bit from frame ' + b });
      }
      for (const c of L.clips.filter(c => (c.group === 'free' || c.group === 'leaves') &&
                                         (row => row && !row.cycle && !row.levels)((MS_.MOTION_STATES[MON] || {})[c.her.list + '|' + c.her.clip.replace(/_(start|loop)$/, '')])).slice(0, 4))
        cases.push({ c, at: [0, 30], n: 100, why: 'MOTION_STATES ' + c.her.list + '|' + c.her.clip });
      check(cases.length >= 3 && !!fxReq, 'routing cases: an effect clip and her state rows on the combined list', cases.map(x => x.c.clip));
      for (const k of cases){
        await playRaw('4', 'Motion[36]');
        await playRaw(k.c.her.list, k.c.her.clip);
        const raw = []; for (const f of k.at) raw.push(await snap(f));
        const rawRun = await run(k.n);
        await playRaw('4', 'Motion[36]');                 // a clip between, so both plays start fresh
        await pickOn(DUO, k.c.clip);
        const duo = []; for (const f of k.at) duo.push(await snap(f));
        const duoRun = await run(k.n);
        const q = await P();
        check(same(raw, duo) && same(rawRun, duoRun) && raw[0].key === MON + '|' + k.c.her.list + '|' + k.c.her.clip.replace(/_(start|loop)$/, ''),
              k.c.clip + ' fires as raw L' + k.c.her.list + ' ' + k.c.her.clip + ' (' + k.why + '): schedule key, frame, PSL word, state row, parts and the records started',
              { raw, duo, rawRun, duoRun, routed: q.routed });
      }
      // a rage row: L0 M5 ({ rage: true }) shows rage on the combined entry as on the raw clip
      const rg = L.clips.find(c => c.her && c.her.list === '0' && /^Motion\[5\]/.test(c.her.clip));
      if (rg){
        await playRaw('4', 'Motion[36]'); await playRaw('0', rg.her.clip); const a = await snap(20);
        await playRaw('4', 'Motion[36]'); await pickOn(DUO, rg.clip); const b = await snap(20);
        check(a.rage === true && b.rage === true && a.msKey === b.msKey, 'her rage row (L0 M5): rage shown on ' + rg.clip + ' as on the raw clip', { raw: a, duo: b });
      } else check(false, 'L0 M5 is on the combined list');
      // the joined entry, per piece: inside her M77 the schedule is on L4 M77 at M77's own frame
      {
        const J = L.clips.find(c => c.group === 'joined');
        await pickOn(DUO, J.clip);
        const pre = J.pieces.slice(0, 2).reduce((n, p) => n + Math.round(p.dur * 60), 0);
        const a = await snap(pre + 20), b = await snap(pre + Math.round(J.pieces[2].dur * 60) + 10);
        const q = await P();
        check(a.key === MON + '|4|Motion[77]' && Math.abs(a.frame - 20) <= 1 && b.key === MON + '|4|Motion[78]',
              'the joined S. Motion[76]-[79] fires per piece: L4 M77 at its own frame 20, then L4 M78', { a, b, routed: q.routed });
      }
      // his entry: her side is her L0 M1 loop, and her records are that clip's
      {
        await pickOn(DUO, 'Seltas Motion[31]');
        const a = await snap(40);
        check(a.key === MON + '|0|Motion[1]', 'his entry Seltas Motion[31]: her schedule runs on her L0 M1 (the clip under him)', a);
      }
      SS.start = st0;
      V.pose.action.paused = false;
    }
    // HIS SIDE: the clips he plays on the combined list are his list 4's; MOTION_STATES.em076_00 has no list-4 row, so no
    // state record of his applies there; his PSL bits (L4 M31..M34) need his own effect runtime, which is not up (the one
    // runtime is hers)
    {
      const his = MS_.MOTION_STATES.em076_00 || {};
      check(!Object.keys(his).some(k => /^4\|/.test(k)), 'his state table has no list-4 row: nothing of his to route on the combined list', Object.keys(his));
      check(!RT || RT.monsterId === MON, 'the effect runtime is hers: his PSL bits (L4 M31..M34) do not fire', RT && RT.monsterId);
    }
    // NOTHING ELSE KEYED ON THE LIST BREAKS ON 'duo': the hit-zone panel holds and gives back a combined entry, the saved view
    // records it, and the hit-zone mode reads the clip of hers
    {
      const name = 'Queen L4 Motion[6]';
      await pickOn(DUO, name);
      check(V.state.list === DUO && V.state.clip === name, 'the view state a save writes (currentSet copies state) holds the combined list and entry', { list: V.state.list, clip: V.state.clip });
      // OPEN: a view file naming a combined entry goes through loadSet / applySet like any other
      await playRaw('4', 'Motion[36]');
      { const inp = document.getElementById('importFile'), dt = new DataTransfer();
        dt.items.add(new File([JSON.stringify({ id: MON, list: DUO, clip: name })], 'duo-view.json', { type: 'application/json' }));
        inp.files = dt.files; inp.dispatchEvent(new Event('change')); }
      await until(async () => V.state.list === DUO && V.state.clip === name && (q => q.mounted && q.local && q.local.clip === 'Motion[6]')(await P()), 1200); await frames(4);
      r = await P();
      check(V.state.list === DUO && V.state.clip === name && r.mounted && r.local && r.local.clip === 'Motion[6]',
            'a view file opened on the combined entry plays it, him mounted on his pair', { list: V.state.list, clip: V.state.clip, local: r.local });
      const hz = document.getElementById('hitZonesPanel');
      hz.dataset.open = 'true'; hz.dispatchEvent(new Event('panelopen'));
      await until(() => V.state.list !== DUO, 300); await frames(4);
      const inside = { list: V.state.list, clip: V.state.clip };
      hz.dataset.open = 'false'; hz.dispatchEvent(new Event('panelclose'));
      await until(async () => V.state.list === DUO && V.state.clip === name && (await P()).mounted, 400); await frames(4);
      r = await P();
      check(inside.list !== DUO && V.state.list === DUO && V.state.clip === name && r.mounted && r.local && r.local.clip === 'Motion[6]',
            'the Hit Zones panel holds her idle and gives the combined entry back, him mounted on his pair', { inside, list: V.state.list, clip: V.state.clip, local: r.local });
    }
  }

  // ---- HER M79 KILLS HIM (2026-10-22, spec §21; Raven: "Seltas dies, but then is dropped back onto the queen's body"): her
  // 1:0x24 arms record 0x23 (kind 0xa, sphere r200 on joint 200, past the partner exclusion); his frozen 1:0x21 holds the
  // reaction lock until her M79 frame 80; then HP 0 and his death (11, 8): unlinked, L4 M77 falling to her ground, L4 M78 lying
  {
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const at = async f => { V.pose.action.paused = true; V.pose.action.time = f / 60; await frames(3); return P(); };
    for (const [entry, k] of [['Queen L4 Motion[79]', 80], ['S. Motion[76]-[79]', 492]]){
      await pickOn(DUO, entry);
      const a = await at(k - 1), b = await at(k), c = await at(k + 20);
      const n = b.unl && b.unl.tLand, L = await at(n + 5);
      check(!a.dead && dist(a.frameAt, a.bodyJointAt) < 0.01 && a.local.clip === 'Motion[79]_loop' && a.local.frame === 6 && a.groupsOn.includes(8),
            entry + ': to her M79 frame 79 he is linked and frozen (M79 @ 6, glow on)', { a });
      check(b.dead && b.local.clip === 'Motion[77]_start' && !b.groupsOn.includes(8) && dist(b.frameAt, b.bodyJointAt) < 0.05,
            entry + ': at her M79 frame 80 he dies -- his death (11, 8) starts with L4 M77, unlinked where joint 200 is, glow off', { b });
      check(c.frameAt[1] < b.frameAt[1] - 0.5 && dist(c.frameAt, c.bodyJointAt) > 0.5,
            entry + ': he falls in world space and her joint 200 no longer carries him (not put back on her body)', { b: b.frameAt, c: c.frameAt, j: c.bodyJointAt });
      check(L.local.clip === 'Motion[78]_start' && Math.abs(L.frameAt[1] - L.unl.floor) < 0.05,
            entry + ': on her ground he lies dead (L4 M78)', { L: L.local, y: L.frameAt[1], floor: L.unl.floor });
    }
    V.pose.action.paused = false;
  }

  // ---- THE STATIC AUDIT (2026-10-18; Raven: "Seltas in the grab animations is still static in some instances"): his clip must
  // ADVANCE through every entry except where the ROM holds him -- the M78 / M79 freeze (1:0x21's speed 0, both layers,
  // emulated: duo/emu_freeze.py) and his one-frame pose M3 (her L4 M3 loop / M25: a 0-frame motion)
  {
    const ROMHOLD = new Set(['Queen L4 Motion[78]_loop', 'Queen L4 Motion[79]', 'Queen L4 Motion[3]_loop', 'Queen L4 Motion[25]']);
    const bad = [];
    for (const c of duoList().clips){
      if (ROMHOLD.has(c.clip)) continue;
      await pickOn(DUO, c.clip);
      V.pose.action.paused = true;
      const F = Math.max(2, Math.round(V.pose.action.getClip().duration * 60));
      const seen = [];
      for (const k of [0.15, 0.4, 0.65, 0.9]){
        const f = Math.floor(k * F);
        V.pose.action.time = f / 60; await frames(1);
        const q1 = await P();
        V.pose.action.time = (f + 1) / 60; await frames(1);
        const q2 = await P();
        seen.push(!!(q1.local && q2.local && (q1.local.clip !== q2.local.clip || q1.local.frame !== q2.local.frame)));
        if (!seen[seen.length - 1] && !(c.clip === 'S. Motion[76]-[79]' && f >= 252) && !(c.clip === 'Seltas Motion[33] with her 7:0x4e' && f >= 353)) bad.push({ entry: c.clip, f, a: q1.local, b: q2.local });
      }
      V.pose.action.paused = false;
    }
    check(bad.length === 0, 'every combined entry: his clip advances at 15 / 40 / 65 / 90 % of it, except the ROM\'s holds (M78 / M79 freeze, the joined grab from M78, the one-frame M3, and his M33 held at its end while she does 7:0x4f -- 7:0x3f phase 5, 0xfd5b2c)', bad.slice(0, 8));
    // his own entries go on to the ride at their action's end (0xfc9518 / 0xfd46e8 / 0xfd480c / 0xfd4908; M34 via 3:0x3d's M5)
    const ends = {};
    for (const [n, len] of [['Seltas Motion[43]', 187], ['Seltas Motion[31]', 261], ['Seltas Motion[32]', 227], ['Seltas Motion[33]', 173], ['Seltas Motion[34]', 173]]){
      await pickOn(DUO, n);
      V.pose.action.paused = true;
      V.pose.action.time = (len + 12) / 60; await frames(1); const a = await P();
      V.pose.action.time = (len + 30) / 60; await frames(1); const b = await P();
      ends[n] = [a.local, b.local];
      V.pose.action.paused = false;
    }
    check(Object.values(ends).every(([a, b]) => a && b && a.clip === 'Motion[35]_loop' && b.clip === 'Motion[35]_loop' && b.frame > a.frame),
          'his own entries: after his clip, the ride M35 plays on (advancing), not his last frame held', ends);
    // the holds the ROM keeps: M3 is a one-frame motion; the freeze holds M79 at 6 through her M78 and M79
    const S4 = V.MON.monsters.find(m => m.id === 'em076_00').lists.find(l => l.id === '4');
    const m3 = S4.clips.find(x => x.clip === 'Motion[3]_loop');
    check(m3 && Math.round(m3.dur * 60) === 0, 'ROM hold: his M3 (her L4 M3 loop / M25) is a one-frame motion', m3 && m3.dur);
  }

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
  // her both clips on the combined list: he is on her, following his own logic (no frozen clip)
  for (const [list, clip] of [['4', 'Motion[46]'], ['4', 'Motion[47]'], ['4', 'Motion[55]_loop'], ['4', 'Motion[90]'], ['0', 'Motion[10]']]){
    await play(list, clip);
    r = await P();
    check(r.mounted && r.class === 'both' && r.mode === 'free', 'combined L' + list + ' ' + clip + ' + Seltas free: mounted, his own logic', { mounted: r.mounted, class: r.class, mode: r.mode });
  }
  // ...a combined-list entry picked while a list change is still in flight still mounts him
  { listSel.value = '0'; const p1 = listSel.onchange(); listSel.value = DUO; const p2 = listSel.onchange();
    clipSel.value = 'Queen L4 Motion[83]'; const p3 = clipSel.onchange(); await Promise.all([p1, p2, p3]);
    await until(async () => { const q = await P(); return q.mounted && q.bodyClip === 'Queen L4 Motion[83]'; }, 300);
    r = await P();
    check(r.mounted && r.bodyClip === 'Queen L4 Motion[83]' && r.local && r.local.clip === 'Motion[45]_loop', 'a combined entry picked during a list change in flight mounts him', { mounted: r.mounted, clip: r.bodyClip, local: r.local }); }
  // the tail grab: his M79 loop under her M77, then the ROM freeze (his 1:0x21 sets his motion speed to 0, 0xb07b4)
  await pairAt('4', 'Motion[77]', (b, l) => l.clip === 'Motion[79]_loop' && near(l.frame, b % 60), 'her L4 Motion[77] -> his Motion[79] loop from 0 at the game period 60 (length 61 - 1, loop 0) (1:0x20)');
  await pairAt('4', 'Motion[78]_loop', (b, l) => l.clip === 'Motion[79]_loop' && l.frame === 6, 'her L4 Motion[78] -> his Motion[79] pose HELD at 186 mod 60 = 6 (1:0x21, speed 0) -- the ROM\'s freeze');

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
    check(r.mode === 'free' && JSON.stringify(got.slice(0, 12)) === JSON.stringify(want.slice(0, 12).map(x => x.clip + ':' + x.frames)),
          'under her L4 Motion[41] (no request) his sequence is the one his table draws: ride 180, draw, pick, ride 180, ...', { got: got.slice(0, 8) });
    const at = async f => { V.pose.action.time = f / 60; const q = await P(); return q.local ? q.local.clip + '@' + q.local.frame : null; };
    const a179 = await at(179);
    const first = want.find((x, i) => i > 0 && x.kind === 'attack');
    const firstAt = want.slice(0, want.indexOf(first)).reduce((n, x) => n + x.frames, 0);
    const a1 = await at(250), a2 = await at(60), a3 = await at(250);
    check(a179 === 'Motion[35]_loop@179' && a1 === a3 && (want[1].kind === 'attack') === !a1.startsWith('Motion[35]'),
          'his ride runs to frame 180 (0xfc7dec), then his draw takes over; a scrub back and forth gives the same choice', { a179, a1, a2, a3, second: want[1].clip });
    if (first && firstAt + 60 < 403){
      V.pose.action.time = (firstAt + 50) / 60;
      const q = await P();
      check(q.local && q.local.clip === first.clip && q.clawStage === M.clawStageAt('em076_00', first.clip, q.local.frame) && q.clawStage > 0,
            'his first riding attack (' + first.clip + ') grows his claws on its own schedule', { local: q.local, stage: q.clawStage, set: q.clawSet });
    }
    V.pose.action.paused = false; }

  // ---- HIS OWN LIST on her Animation list (the Nakarkos model): his clip on him, her side on her
  const sl = [...listSel.options].find(o => o.value === DUO);
  check(!!sl, 'her Animation list offers the combined list (duo, "Combined (with Seltas)")', [...listSel.options].map(o => o.value));
  if (sl){
    await V.partner(false);
    await play(DUO, 'Seltas Motion[31]');
    r = await P();
    check(r.mounted && r.local && r.local.clip === 'Motion[31]' && r.herSide && r.herSide.body[0] === '0|Motion[1]_loop',
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
    await V.partner(true);
  }

  // ---- ENABLED wherever the ROM has him: on a fresh load, a list change and the joined clip, the row shows Combined
  await V.partner(false);
  const other = [...monSel.options].find(o => o.value !== MON && o.value.startsWith('em0'));
  if (other){ monSel.value = other.value; await monSel.onchange(); await frames(5); monSel.value = MON; await monSel.onchange(); await frames(5); }
  await play('0', 'Motion[1]_loop');
  await play('4', 'Motion[16]');
  r = await P();
  check(r.mounted, 'after a reload of her and a list change to the combined Queen L4 Motion[16]: mounted', { mounted: r.mounted });

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
                                                ['Motion[79]', 0, 79, 1.3, 'Motion[79]_loop']]){   // (to frame 79: at 80 he dies and falls, spec §21)
      await play('4', clip);
      V.pose.action.paused = true;
      const seen = [];
      for (let f = f0; f <= f1; f += 6) seen.push(await gap(f));
      const mx = Math.max(...seen.map(x => x.d));
      check(seen.every(x => x.local && x.local.clip === his) && mx <= bound,
            'GRAB her L4 ' + clip + ': his root within ' + bound + ' of her pincers over frames ' + f0 + '..' + f1 + ' (max ' + mx + '), his ' + his, seen.map(x => x.d));
      V.pose.action.paused = false;
    }
    // the freeze: the held pose is his M79 frame 4 exactly, in every frame of her M78
    await play('4', 'Motion[78]_loop'); V.pose.action.paused = true;
    const hs = [];
    for (const f of [0, 40, 80, 120, 158]){ V.pose.action.time = f / 60; const q = await P(); hs.push(q.local && q.local.frame); }
    check(hs.every(x => x === 6), 'her M78: his pose stays on his M79 frame 6 at every frame (his 1:0x21, speed 0)', hs);
    V.pose.action.paused = false;
  }

  // ---- HER COMBINED ATTACK 7:0x4e / 0x4f with his 7:0x3f, phase by phase (0xfd58ac; shells spec 2b): M33 0..60, then three
  // spit sets of M33 from 40 (two spits a crossing, the third one), each but the last followed by M33 100..120; his flag at f105
  // of the last set, 285 frames in; her L0 M65 loops to there, then her L4 M42 from 90
  {
    await play(DUO, 'Seltas Motion[33] with her 7:0x4e');
    V.pose.action.paused = true;
    const at = async f => { V.pose.action.time = f / 60; await frames(2); const q = await P(); return q.local && q.local.clip + '@' + q.local.frame; };
    const want = { 0: 'Motion[33]@0', 59: 'Motion[33]@59', 60: 'Motion[33]@40', 119: 'Motion[33]@99', 120: 'Motion[33]@100', 139: 'Motion[33]@119',
                   140: 'Motion[33]@40', 220: 'Motion[33]@40', 284: 'Motion[33]@104', 286: 'Motion[33]@106' };
    const got = {};
    for (const f of Object.keys(want)) got[f] = await at(+f);
    r = await P();
    check(r.mounted && r.herSide && JSON.stringify(r.herSide.body) === JSON.stringify(['0|Motion[65]', '4|Motion[42]@90']) &&
          Object.keys(want).every(f => got[f] === want[f]) && r.herSide.frames >= 285,
          'his 7:0x3f: M33 0..60, from 40 at 60, 100..120, from 40 at 140 and 220, the flag frame 105 at 285; her M65 then M42 from 90', { got, her: r.herSide });
    // his spits, on HIS runtime: 15 (2 + 2 + 2, 2 + 2 + 2, 1 + 1 + 1) at the crossings 68 / 88 / 96 of each set; her three after the flag
    const FX = await import('/render/rom/effect-mounts.js');
    const PR = FX.partnerEffectRuntime(), BR = M.effectRuntimeInstance();
    if (PR && PR.schedule && BR && BR.schedule){
      V.pose.action.time = 0; await frames(2);
      const seen = new Map(), mine = [];
      const scan = () => {
        for (const R of [PR, BR]){
          const st = R.schedule.shells && R.schedule.shells.state;
          for (const x of (st ? st.shells : [])){
            const k = R.monsterId + ':' + x.id;
            if (seen.has(k) || x.creator != null) continue;
            seen.set(k, 1);
            mine.push({ who: R === PR ? 'his' : 'her', t: Math.round(V.pose.action.time * 60), shell: x.shell, mode: x.modeIndex });
          }
        }
      };
      for (const R of [PR, BR]){ const st = R.schedule.shells && R.schedule.shells.state; for (const x of (st ? st.shells : [])) seen.set(R.monsterId + ':' + x.id, 1); }
      V.pose.action.paused = false;
      for (let i = 0; i < 340 && V.pose.action.time * 60 < 330; i++){ await frames(1); scan(); }
      V.pose.action.paused = true;
      const his = mine.filter(x => x.who === 'his' && x.shell === 'shell00'), hers = mine.filter(x => x.who === 'her' && x.shell === 'shell00');
      const T = [88, 88, 108, 108, 116, 116, 168, 168, 188, 188, 196, 196, 248, 268, 276];
      check(his.length === 15 && his.every((x, i) => Math.abs(x.t - T[i]) <= 2 && x.mode === 3),
            'his 7:0x3f: 15 spits, two at each crossing 68 / 88 / 96 of the first two sets and one in the third (his entry frames ' + T.join(' ') + ')', his);
      check(hers.length === 3 && [295, 305, 315].every((t, i) => Math.abs(hers[i].t - t) <= 2),
            'her 7:0x4f (L4 M42 from 90 after his flag at 285): her three spits at 295 / 305 / 315', hers);
    } else check(false, 'both effect runtimes are up for the 7:0x3f spits', { his: !!PR, her: !!BR });
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
  listSel.value = DUO; await listSel.onchange();
  const so = [...clipSel.options].find(x => x.value === 'S. Motion[76]-[79]');
  if (so){ clipSel.value = so.value; await clipSel.onchange(); await until(() => V.pose.action && V.pose.action.getClip().name === so.value, 300); await frames(3); }
  r = await P();
  const lay = (r.layout || []).map(x => x.clip + ':' + x.mode + '@' + x.from + '+' + x.frames + (x.mode === 'hold' ? '=' + x.start : ''));
  check(so && r.mounted, 'S. Motion[76]-[79] is on the combined list, and mounts him', { found: !!so, mounted: r.mounted });
  check(r.mounted && r.class === 'combined' && r.mode === 'seq' && lay.length === 9 &&
        lay[0] === 'Motion[35]_loop:wrap@0+26' && lay[1] === 'Motion[35]_loop:wrap@26+40' && lay[2] === 'Motion[79]_loop:wrap@66+187' &&
        lay[3] === 'Motion[79]_loop:hold@253+159=6' && lay[4] === 'Motion[79]_loop:hold@412+80=6' && lay[5].startsWith('Motion[77]_start:play@492') &&
        lay.some(x => x.startsWith('Motion[78]_start:play')),
        'S. Motion[76]-[79]: his ride through her M76, his M79 loop through M77, frozen (frame 6) through M78 and M79 to frame 80, then his death: M77 falling, M78 lying', lay);
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
