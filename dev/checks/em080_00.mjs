// Glavenus's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself (`await import('/render/monster.js')`).
// GLAVENUS (em080_00): what his motions show, against E:/offline/decode/notes/states-em080_00.md.
// HIS RAGE IS A MATERIAL, NOT A MESH: the part pass never reads isEnraged and the glow geometry is drawn the whole
// fight, so the rage row carries no sets and the puff is what the table shows.
// TWO OF HIS MOTIONS ARE WORN BY SEVERAL STATES (`cycle`): L3 M9 is the head break AND the exhaust status, and
// L3 M2 is a foreleg break, the TAIL depletion and the shock trap's first clip. Each play shows the next, so the
// play ORDER is part of what is checked here.
// THE TAIL DEPLETION FIRES ITS RECORD WITHOUT TOUCHING THE SETS, on purpose: cold the ROM draws set 21 and hot
// set 24, and a `levels` ladder cannot be indexed by the break level AND the heat -- so the user's own tail choice
// (Heated or not) stays on screen. That is asserted below rather than left to be noticed.
async function pageCheckGlavenus(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Glavenus: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em080_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'the effect runtime is up');
  const fx = rt(), S = fx.schedule;
  const fired = [];
  const f0 = fx.fire.bind(fx); fx.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  const puffs = [];
  const s0 = S.start.bind(S);
  S.start = e => { if (e.when === 'ragePuff') puffs.push({ key: e.def.record.key, step: S.frame }); return s0(e); };
  const byWhen = {};
  for (const e of S.entries) byWhen[e.when] = (byWhen[e.when] || 0) + 1;
  check(byWhen.event >= 13 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 13 event (5 breaks + the sever + the cut-tail landing + 6 ailments) and 2 ragePuff', byWhen);
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (d, n) => (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const listOf = id => MONSTER.lists.find(l => l.id === id);
  const pick = async (row, text) => {
    const f = document.querySelector('[data-row="' + row + '"]');
    const sel = f && f.querySelector('select');
    const o = sel && [...sel.options].find(x => x.textContent.trim() === text);
    if (!o) return false;
    sel.value = o.value; sel.dispatchEvent(new Event('change'));
    await frames(2);
    return true;
  };
  // NO FRAME PASSES BETWEEN THE LIST CHANGE AND THE CLIP CHANGE, and THREE ORDERED LOOKUPS rather than one `find`
  // with three disjuncts (`find` walks the options, and '_start' precedes '_loop').
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 20 * n + 200); };
  // THE TWO CLOCKS. `every:` countdowns are stepped by motion-states.step in CLIP frames, while the rage
  // puff's cadence is counted by schedule.js in SCHEDULE frames -- and this harness advances one clip frame
  // per two schedule steps, so waiting out a period with `steps` waits half of one. `acc` accumulates across
  // a _loop wrap: at the wrap the frame drops, so the frames since the last sample are the new frame itself.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // A CYCLE'S PHASE IS NOT OURS TO ASSUME. `motionStates.plays` counts every frame 0 a motion has ever had on
  // this runtime instance, so which spec a cycle shows when a check arrives depends on what ran before it.
  // `rounds` plays a motion n times, landing on a clip with no table entry between plays, and returns what
  // each play fired and drew -- so the assertions below say WHAT the cycle contains, which is its promise,
  // rather than the order it happens to be in.
  const rounds = async (list, clip, n, settle = 3) => {
    const seen = [];
    for (let i = 0; i < n; i++){
      await play(LAND[0], LAND[1]); await frames(2);
      fired.length = 0;
      await play(list, clip); await frames(settle);
      seen.push({ fired: fired.slice(), d: drawn() });
    }
    return seen;
  };
  const REST = ['0', 'Motion[1]'];
  const LAND = ['3', 'Motion[10]'];          // his recovery clip: no table entry, safe to land on
  const HEAD = '1,2,11,12,21,22,31', ARMS = '3,13,23,33', BACK = '4,14,24,34,104';
  const TAIL = '5,6,15,16,17,40,45,46,47,55,56,57,107';
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  // his intact head, hip and foreleg meshes, by GROUP rather than by set: his alive sets carry the always-drawn glow
  // groups as well, and the viewer's part-review rage rows decide those, so a whole-set compare is not his rest state
  check(user0 && user0[1] === true && user0[2] === true && user0[3] === true && user0[4] === true,
        'at rest: the intact head (groups 1, 2), neck/arms (3) and back (4) meshes are drawn', user0);

  // THE HEAD, two levels on one motion -- and L3 M9's SECOND play is the exhaust status, not the head again
  check(await pick(HEAD, 'Cracked'), 'the Head row set to Cracked');
  const headL1 = await rounds('3', 'Motion[9]', 2);
  check(headL1.some(r => r.fired.includes(1000) && isSet(r.d, 10)),
        'one play of L3 Motion[9] is the head at level 1: set 10, u 1000', headL1.map(r => r.fired));
  check(headL1.some(r => r.fired.includes(1109)),
        'and the other is the EXHAUST status: c 1109 -- the two share the clip', headL1.map(r => r.fired));
  check(await pick(HEAD, 'Broken'), 'the Head row set to Broken');
  const headL2 = await rounds('3', 'Motion[9]', 2);
  check(headL2.some(r => r.fired.includes(1001) && isSet(r.d, 11)),
        'and with the row on Broken, its head play is level 2: set 11, u 1001', headL2.map(r => r.fired));

  // THE HIP / TAIL BASE
  check(await pick(BACK, 'Broken'), 'the Back row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1005]) && isSet(drawn(), 19), 'L3 Motion[1]: the hip breaks (set 19), u 1005 on joint 140', { fired, d: drawn() });

  // L3 M2's THREE HATS, in order: the foreleg break, the tail depletion (record only), the shock trap
  check(await pick(ARMS, 'Broken'), 'the Neck/Arms row set to Broken');
  const tailRest = (await rounds('3', 'Motion[10]', 1))[0].d;     // what the tail draws with no table row applied
  const three = await rounds('3', 'Motion[2]', 3);
  check(three.some(r => r.fired.includes(1015) && isSet(r.d, 15)),
        'one play of L3 Motion[2] breaks the foreleg (set 15), u 1015', three.map(r => r.fired));
  const tailPlay = three.find(r => r.fired.includes(1030));
  check(tailPlay && [5, 6, 15, 16, 17, 40, 45, 46, 47, 55, 56, 57, 107].every(g => tailPlay.d[g] === tailRest[g]),
        'another is the TAIL depletion: u 1030 fires and every tail group is LEFT ALONE, because cold and hot draw ' +
        'different sets and the user owns that choice', three.map(r => r.fired));
  check(three.some(r => r.fired.includes(1105)), 'and the third is the SHOCK TRAP: c 1105', three.map(r => r.fired));

  // THE TAIL SEVER, and HE DROPS IT -- his own option motion list, on joint 145
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 145 && TO.CUT_TAIL[MON].piece === 'em080_00_tail',
        'his cut tail is em080_00_tail on joint 145 (sever kind 0x91, his own option .lmt)', TO.CUT_TAIL[MON]);
  check(await pick(TAIL, 'Severed'), 'the Tail row set to Severed');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 22), 'L3 Motion[15]: the tail severed (set 22), u 900 on joint 145', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted, so `drops` has something to fly', Object.keys(V.mounted));
  for (const r of [[HEAD, 'Intact'], [ARMS, 'Intact'], [BACK, 'Intact'], [TAIL, 'Intact']]) await pick(r[0], r[1]);
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the rows back to Intact: the parts are the user\'s again', drawn());

  // PARALYSIS and the STUN
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[3]', 'Motion[5]', 'Motion[7]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain, the same for every part and direction): c 1103 held', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // RAGE: nothing on the mesh, and the puff is always 1121 -- which matters here, because his two puff records
  // are NOT identical (1120 sits at (0, -20, 20) and 1121 at (0, -60, 70))
  puffs.length = 0;
  await play('0', 'Motion[5]'); await steps(95);
  check(S.rage === true && same(drawn(), user0), 'L0 Motion[5] (the rage entry): rage on, and no mesh change', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121),
        'and every puff is KEY 1121, not 1120 -- his two differ, so the pick being the right way round is visible', puffs.map(p => p.key));

  // TIRED
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[8]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[8] (tired): rage off, drool c 1104 at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);

  // ASLEEP
  await play('3', 'Motion[14]'); await frames(4);
  check(isSet(drawn(), 2), 'L3 Motion[14] (lying down): his eyes shut (set 2)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[25]'); await frames(4); await steps(2);
  check(isSet(drawn(), 2) && count(fired, 1102) === 1, 'L3 Motion[25] (the sleep hold): eyes shut and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // DEATH
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[18]', 'Motion[34]', 'Motion[21]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off, which is what takes the glow layer', { rage: S.rage });
  }
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1];
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckGlavenus;
