// The Yian Garuga family's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE, TWO
// MONSTERS: there is no `uEm018_04` -- getDTI 0xdb0e88 appears exactly once in main.data, so all 0x480 slots hold
// the same function for both and the override diff is empty in BOTH directions -- so Deadeye runs the same table
// through the same factory, and the runner's `args` export is the mechanism for exactly that. The function is
// serialised with .toString() and evaluated IN THE PAGE, so it must not close over anything in this module.
// YIAN GARUGA / DEADEYE (em018_00, em018_04): E:/offline/decode/notes/states-em018_00.md.
// EVERY BREAK TAKES THE SAME ROUTE and the PART alone picks the clip: `+0x22c` and `+0x23c` are both base stubs,
// so (10, 0x14) and (10, 0xe) are unreachable and every depletion goes to (10, 7). That is why every break row
// keeps `at: 1` -- and why these checks set the Parts rows before asserting a break, rather than expecting the
// clip to show it unasked.
// `em018_00c` IS DEADEYE'S COMMON PEL TOO -- byte-identical, and there is no `em018_04c.pel` in either arc -- so
// both halves are asserted here: a wiring reaching for `em018_04c` would find nothing.
async function pageCheckGaruga(MON, NAME, U, EVENTS, TAILBREAK){
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
  check(byWhen.event === EVENTS && byWhen.ragePuff === 2,
        'the schedule holds his state records: ' + EVENTS + ' event and 2 ragePuff', byWhen);
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(!keys.includes(1100) && !keys.includes(1107),
        'and NO c 1100 and NO c 1107: poison and the second paint request find nothing, because those records are ' +
        'ABSENT FROM THE FILE -- a fact about em018_00c, not a gap in the wiring', keys.filter(k => k > 1090 && k < 1110));
  check(keys.includes(1036) === !!TAILBREAK,
        TAILBREAK ? 'and u 1036 IS there: his sixth .dtp row makes the tail breakable at level 2'
                  : 'and NO u 1036: Garuga has no part-7 .dtp row, so his tail is severed or whole, never broken', keys);
  const pels = {};
  for (const e of S.entries) if (e.def.record) pels[e.def.record.pel] = (pels[e.def.record.pel] || 0) + 1;
  check(pels['em018_00c'] > 0 && pels[U] > 0 && !pels['em018_04c'],
        'they come from em018_00c for the ailments -- byte-identical in both arcs, and there is no em018_04c.pel ' +
        'anywhere -- and from ' + U + ' for the breaks and the puff', pels);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick() === 0 && P.joint === 4 && P.records.every(r => r[0] === U),
        'his puff is the stub shape: pick() === 0, which schedule.js inverts into records[1] = u 1121, on joint 4',
        { pick: P && P.pick(), joint: P && P.joint });
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 143, 'his cut tail is on joint 143', TO.CUT_TAIL[MON]);
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
  const LAND = ['3', 'Motion[16]'];        // the common recovery clip -- (10, 0x2a) / (10, 0x2b) / (10, 0x70) -- no table entry
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
  check(user0 && isSet(user0, 3), 'at rest: his head is whole (set 3)', user0);

  // THE HEAD's two rungs on one clip. The route is (10, 7) on ANY depletion, so the level shown is the user's.
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(fired.length === 0 && isSet(drawn(), 3),
        'L3 Motion[1] with the head whole: the first depletion fires nothing and the head stays at set 3 -- his ' +
        'row is at LEVEL 2 and both reaction routes are the base stubs, so this clip plays for any depletion',
        { fired, d: drawn() });

  // THE BODY and the exhaust status share L3 M2 (and on Deadeye the tail break as well)
  const m2 = await rounds('3', 'Motion[2]', TAILBREAK ? 3 : 2);
  check(m2.some(x => same(x.fired, [1109])), 'L3 Motion[2] shows the tune+0x44 status: c 1109 once at frame 0',
        m2.map(x => x.fired));
  if (TAILBREAK)
    check(m2.some(x => same(x.fired, [1036])),
          'and another of its plays is the TAIL BREAK: u 1036 on JOINT 143 -- his sixth .dtp row, which Garuga ' +
          'does not have', m2.map(x => x.fired));

  // THE WINGS, both on L3 M103
  const wings = await rounds('3', 'Motion[103]', 2);
  check(wings.every(x => x.fired.length === 0),
        'L3 Motion[103] with both wings whole: neither play fires -- both rows are at LEVEL 2 and this clip plays ' +
        'for any depletion of either wing', wings.map(x => x.fired));

  // THE TAIL SEVER
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 13),
        'L3 Motion[15]: the tail severed -- set 13 -- and u 900 on JOINT 143', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));

  // RAGE: nothing on the model at all
  await play(REST[0], REST[1]); await frames(3);
  const before = drawn();
  puffs.length = 0;
  await play('0', 'Motion[101]'); await steps(95);
  check(S.rage === true && same(drawn(), before),
        'L0 Motion[101] ((1, 0x0c), the rage entry): rage on and NOT ONE part changes -- the part pass never calls ' +
        '0x81670 and neither .mrl holds a single clip name', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is u 1121', puffs.map(p => p.key));

  // TIRED: his own idle clip, with the 90-degree drool
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[14] (the tired idle, a clip of its own -- his combat idle is L0 Motion[2]): rage off and the ' +
        'drool c 1104 at once', { rage: S.rage, fired });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'and the drool again 48 clip frames on', fired);

  // ASLEEP
  await play(REST[0], REST[1]); await frames(3);
  await play('3', 'Motion[14]'); await frames(3);
  check(isSet(drawn(), 2), 'L3 Motion[14] (lying down, and also capture): his eyes shut -- set 1 -> 2, the lid drawn ' +
        'and the eye hidden', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(3); await steps(2);
  check(isSet(drawn(), 2) && count(fired, 1102) === 1, 'L0 Motion[19] (the hold): the lid stays and the zzz at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 clip frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS, the SHOCK TRAP and the STUN
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed, and the shock trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 clip frames on', fired);
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1, 'L3 Motion[9] (the shock trap\'s first half): c 1105 at once', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[4]', 'Motion[6]', 'Motion[8]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'),
          'L3 ' + clip + ' (the stun chain -- and the dir-2 chain L3 M3/M5/M7 is DEAD CODE, his .dtb +0x70 table ' +
          'being zero at all 16 indices): c 1103 held', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH: nothing reverts, because nothing was rage-driven, and the lid is NOT drawn
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[17]', 'Motion[20]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off', { rage: S.rage });
    check(isSet(drawn(), 2), 'and HIS EYES SHUT: ' + 'the lid IS drawn -- `0xbd594` sets `P+0x5d02` with the timer at `P+0x5d00` and `0x75c1c` calls it with -1 in the status-11 block, which states-em042_00.md 8 missed by finding only the sleep writer', drawn());
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

export const pageCheck = pageCheckGaruga;
export const args = [['em018_00', 'Yian Garuga', 'em018_00u', 13, false],
                     ['em018_04', 'Deadeye Yian Garuga', 'em018_04u', 14, true]];
