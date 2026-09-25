// Cephadrome's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself.
// CEPHADROME (em017_00): E:/offline/decode/notes/states-em017_00.md.
// THREE BREAKS AND NO SEVER: his tail BREAKS (set 3 -> 6, u 1035) and is never cut -- five independent proofs in
// the note -- so the absence of a sever record and of a CUT_TAIL entry is asserted here.
// HE HAS NO EYE SETS AT ALL (0x71398 is never called, all three fields stay -1), so sleep shuts nothing; that too
// is asserted, because a missing set is otherwise indistinguishable from a forgotten row.
async function pageCheckCephadrome(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Cephadrome: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em017_00';
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
  check(byWhen.event >= 9 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 9 event (3 breaks + 6 ailments) and 2 ragePuff', byWhen);
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(!keys.includes(900) && !TO.CUT_TAIL[MON],
        'and NO sever: no u 900 and no cut tail -- his tail BREAKS (u 1035) and is never cut', TO.CUT_TAIL[MON]);
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
  const LAND = ['3', 'Motion[16]'];          // his common recovery clip: no table entry
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 1) && isSet(user0, 2) && isSet(user0, 3),
        'at rest: the head, the dorsal fin and the tail intact (sets 1, 2, 3)', user0);

  // L3 M2 CARRIES TWO BREAKS AND THE EXHAUST, in that order
  check(await pick('2,102', 'Broken'), 'the Fin row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1000]) && isSet(drawn(), 5), 'L3 Motion[2], 1st play: the dorsal fin -- set 5, u 1000 on joint 131', { fired, d: drawn() });
  check(await pick('4,104', 'Broken'), 'the Tail row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1035]) && isSet(drawn(), 6), 'its 2nd play is the TAIL BREAK: set 6, u 1035 on joint 143', { fired, d: drawn() });
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3); await clipSteps(80);
  check(count(fired, 1109) === 1, 'and its 3rd play is the EXHAUST status: c 1109 once at frame 0', fired);

  // THE HEAD, on its own clip
  check(await pick('3,5', 'Broken'), 'the Head row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1030]) && isSet(drawn(), 7), 'L3 Motion[1]: the head -- set 7, u 1030 on joint 4', { fired, d: drawn() });
  for (const r of [['2,102', 'Intact'], ['4,104', 'Intact'], ['3,5', 'Intact']]) await pick(r[0], r[1]);
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the rows back to Intact: the parts are the user\'s again', drawn());

  // PARALYSIS and the SHOCK TRAP
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1, 'L3 Motion[9] (the shock trap): c 1105 at once', fired);
  await clipSteps(47);
  check(count(fired, 1105) === 2, 'and again 42 steps on', fired);

  // THE STUN, both chains
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[4]', 'Motion[6]', 'Motion[8]', 'Motion[3]', 'Motion[5]', 'Motion[7]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (a stun chain clip): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chains it is stopped', evReqs(1103));

  // RAGE: nothing on the model, and the puff
  puffs.length = 0;
  await play('4', 'Motion[5]'); await steps(95);
  check(S.rage === true && same(drawn(), user0), 'L4 Motion[5] (the posture-2 rage entry): rage on, nothing on the model', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30) && puffs.every(p => p.key === 1121),
        'the puff: at once, then every 30 steps, always key 1121', { n: puffs.length, gaps, keys: puffs.map(p => p.key) });

  // TIRED and ASLEEP -- and his sleep shows NOTHING on the model, because he has no eye sets
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[14] (tired, a clip of its own): rage off, drool c 1104 at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);
  await play('3', 'Motion[14]'); await frames(4);
  check(same(drawn(), user0), 'L3 Motion[14] (lying down): NOTHING changes -- he has no eye sets at all', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(4); await steps(2);
  check(count(fired, 1102) === 1 && same(drawn(), user0), 'L0 Motion[19] (the sleep hold): the zzz c 1102 at once, and still no mesh change', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // DEATH
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[21]', 'Motion[20]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off even with the user enraged', { rage: S.rage });
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

export const pageCheck = pageCheckCephadrome;
