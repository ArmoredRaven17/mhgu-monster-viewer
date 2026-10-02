// The Lagombi family's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE, TWO
// MONSTERS: there is no `uEm061_04` -- one registration, one vtable, and all 320 slots diffed against base uEnemy
// in both directions -- so Snowbaron runs the same table through the same factory, and the runner's `args` export
// is the mechanism for exactly this (the Rathian check uses it for six monsters). The function must not close
// over anything in this module: it is serialised with .toString() and evaluated IN THE PAGE.
// LAGOMBI / SNOWBARON LAGOMBI (em061_00, em061_04): E:/offline/decode/notes/states-em061_00.md.
// HE HAS EXACTLY ONE BREAK -- the head, level 1 in both files at every rank -- and BOTH REACTION ROUTES ARE DEAD:
// `vtable +0x23c` and `+0x22c` are the base stubs, so (10, 0x14) and (10, 0xe) are unreachable and every
// depletion of every part goes to (10, 7). That is why his break row keeps `at: 1`: the clip plays for ANY
// depletion, the first of which really does show nothing.
// HIS AILMENT RECORDS COME FROM `em061_00c` FOR BOTH MONSTERS -- there is no `em061_04c.pel` in the extract at
// all -- and that is asserted, because a wiring that reached for one would find nothing.
async function pageCheckLagombi(MON, NAME, U){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, NAME + ': ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'the effect runtime is up');
  const fx = rt(), S = fx.schedule;
  const fired = [];
  // the schedule's fire (live.js fire() passes through to it): the tired drool fires there directly (schedule.js stepDrool)
  const f0 = fx.schedule.fire.bind(fx.schedule); fx.schedule.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  const puffs = [];
  const s0 = S.start.bind(S);
  S.start = e => { if (e.when === 'ragePuff') puffs.push({ key: e.def.record.key, step: S.frame }); return s0(e); };
  const byWhen = {};
  for (const e of S.entries) byWhen[e.when] = (byWhen[e.when] || 0) + 1;
  check(byWhen.event === 6 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 6 event (the one break + 5 ailment records) and 2 ragePuff', byWhen);
  const pels = {};
  for (const e of S.entries) if (e.def.record) pels[e.def.record.pel] = (pels[e.def.record.pel] || 0) + 1;
  check(pels['em061_00c'] > 0 && pels[U] > 0 && !pels['em061_04c'],
        'and they come from em061_00c for the ailments -- shared by both monsters, there is no em061_04c.pel -- ' +
        'and from ' + U + ' for the break and the puff', pels);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick() === 0 && P.joint === 4 && P.records.every(r => r[0] === U),
        'his puff is the stub shape: pick() === 0, which schedule.js inverts into records[1] = u 1121, on joint 4',
        { pick: P && P.pick(), joint: P && P.joint });
  check(!TO.CUT_TAIL[MON], 'and NO cut tail: no .dtt second counter, no 0xc2274 in the class, and the option ' +
        'descriptor holds -1 in both slots', TO.CUT_TAIL[MON]);
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (d, n) => (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const listOf = id => MONSTER.lists.find(l => l.id === id);
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
  const REST = ['0', 'Motion[1]'];
  const LAND = ['3', 'Motion[17]'];        // the common recovery clip -- (10, 0x2a) / (10, 0x2b) / (10, 0x70) -- no table entry
  // A CYCLE'S PHASE IS NOT ASSUMABLE: `motionStates.plays` counts every frame 0 that motion has ever had on this
  // runtime instance, so the first play this check sees need not be the first spec. Take N consecutive plays from a
  // clean landing each time and assert the SET of what they show.
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
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 1), 'at rest: his head is whole (set 1)', user0);

  // L3 M1 AND L3 M61 EACH CARRY THE HEAD BREAK AND THE EXHAUST STATUS, so each play shows the next
  for (const clip of ['Motion[1]', 'Motion[61]']){
    const r = await rounds('3', clip, 2);
    const hd = r.find(x => same(x.fired, [1000]));
    check(hd && isSet(hd.d, 2),
          'L3 ' + clip + ' shows the HEAD break: set 1 -> 2 (group 2 off, 3 on) and u 1000 on joint 3', r.map(x => x.fired));
    check(r.some(x => same(x.fired, [1109])),
          'and its other play the tune+0x44 status: c 1109 once at frame 0', r.map(x => x.fired));
  }

  // RAGE: nothing on the model at all, on either entry clip
  await play(REST[0], REST[1]); await frames(3);
  const before = drawn();
  puffs.length = 0;
  await play('0', 'Motion[3]'); await steps(95);
  check(S.rage === true && same(drawn(), before),
        'L0 Motion[3] ((1, 0x0a), the rage entry): rage on and NOT ONE part changes -- the part pass never reads ' +
        'isEnraged and the model has no material animation at all', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is u 1121', puffs.map(p => p.key));
  await play(REST[0], REST[1]); await frames(3);
  await play('0', 'Motion[52]'); await frames(4);
  check(S.rage === true, 'L0 Motion[52] (the second half of the same entry, and the whole of it when sel0): rage on there too',
        { rage: S.rage });

  // TIRED: a clip chain of its own, both halves carrying the drool
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[15]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[15] (the tired idle loop -- his combat idle is L0 Motion[1]): rage off and the drool c 1104 at once',
        { rage: S.rage, fired });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'and the drool again 48 clip frames on', fired);

  // ASLEEP: the lid closes on the fall and stays on the hold
  await play(REST[0], REST[1]); await frames(3);
  await play('3', 'Motion[14]'); await frames(3);
  check(isSet(drawn(), 3), 'L3 Motion[14] (lying down, and also capture): his eyes shut -- set 4 -> 3', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(3); await steps(2);
  check(isSet(drawn(), 3) && count(fired, 1102) === 1, 'L0 Motion[19] (the hold): the lid stays and the zzz at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 clip frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS and the STUN
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed, and the shock trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 clip frames on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[55]', 'Motion[56]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'),
          'L3 ' + clip + ' (the stun, and it is NOT sided -- his .dtb +0x70 table is zero at every index): c 1103 held',
          evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the clip it is stopped', evReqs(1103));

  // DEATH: the head-break set stays and HIS EYES CLOSE (the flagged conflict -- see the table's comment)
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play('3', 'Motion[18]'); await frames(4);
  check(S.rage === false, 'L3 Motion[18] (death): the rage shown goes off', { rage: S.rage });
  check(isSet(drawn(), 3),
        'and HIS EYES SHUT at death (set 3): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with -1 in the status-11 block. A check that does not assert this passes while showing the wrong thing, which is how it survived so long', drawn());
  check(isSet(drawn(), 3),
        'and HIS EYES CLOSE -- 0x75be0 raises P+0x5d02 with timer -1 at every status-11 setAction unless ' +
        'vtable +0x21c & 2, and his +0x21c returns 1. This contradicts Barioth\'s note and is wired as the ' +
        'Lagombi decode read it, with the conflict recorded in the table', drawn());
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

export const pageCheck = pageCheckLagombi;
export const args = [['em061_00', 'Lagombi', 'em061_00u'], ['em061_04', 'Snowbaron Lagombi', 'em061_04u']];
