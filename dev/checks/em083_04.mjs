// Elderfrost Gammoth's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER:
// the runner serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over
// anything in this module -- everything it needs it imports inside itself.
// ELDERFROST GAMMOTH (em083_04): E:/offline/decode/notes/states-em083_04.md, the DIFF against Gammoth.
// HE IS THE SAME CLASS AND THE SAME DATA with the snow moved: hers is on four legs and the tail, his is on TWO
// legs and the TRUNK. So this check asserts the three things that move with it -- the trunk break coming through
// snow slot 5 rather than the part pass, the two legs that CANNOT break (no .dtp row, no u 1020, no u 1025), and
// his own u 1051 for the trunk where Gammoth's 1051 is a leg -- and the snow-on motions, which only he has.
async function pageCheckElderfrost(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Elderfrost: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em083_04';
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
  check(byWhen.event >= 14 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 14 event (5 breaks + 3 snow knock-offs + 6 ailments) and 2 ragePuff', byWhen);
  check(!S.entries.some(e => e.def.record && [1020, 1025].includes(e.def.record.key)),
        'and NO u 1020 / u 1025: his other two legs have no .dtp row, so they cannot break at all');
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
  const REST = ['0', 'Motion[1]'];
  const LAND = ['3', 'Motion[11]'];
  const HEAD = '52,53,62,63,102,103', TRUNK = '3,4,41,54,64,74,75,76';
  const FL = '20,30,32,55,65,70', FR = '21,31,33,56,66,71';
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 1), 'at rest: his head is intact (set 1)', user0);

  // L3 M2: THE HEAD, THE TRUNK, THE EXHAUST. His head records are byte-identical to Gammoth's; his TRUNK break is
  // the snow machine's level 4 (set 7), not the part pass, which skips the trunk branch for variant 4.
  check(await pick(HEAD, 'Cracked'), 'the Head row set to Cracked');
  check(await pick(TRUNK, 'Broken'), 'the Trunk row set to Broken');
  const m2 = await rounds('3', 'Motion[2]', 3);
  const hd = m2.find(x => same(x.fired, [1001]));
  check(hd && isSet(hd.d, 2), 'L3 Motion[2] shows the head at LEVEL 2: set 2, u 1001', m2.map(x => x.fired));
  const tr = m2.find(x => same(x.fired, [1006]));
  check(tr && isSet(tr.d, 7), 'another play is the TRUNK, through snow slot 5 at level 4: SET 7, u 1006 on joint 157',
        m2.map(x => x.fired));
  check(m2.some(x => same(x.fired, [1109])), 'and another the EXHAUST status: c 1109 once', m2.map(x => x.fired));
  await pick(HEAD, 'Intact'); await pick(TRUNK, 'Ice');

  // THE TWO LEGS THAT DO BREAK
  check(await pick(FL, 'Broken'), 'the Front Left Leg row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[6]'); await frames(3);
  check(same(fired, [1010]) && isSet(drawn(), 12), 'L3 Motion[6]: the +X leg -- set 12, the snowless broken foot, u 1010', { fired, d: drawn() });
  check(await pick(FR, 'Broken'), 'the Front Right Leg row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[3]'); await frames(3);
  check(same(fired, [1015]) && isSet(drawn(), 17), 'L3 Motion[3]: the -X leg -- set 17, u 1015', { fired, d: drawn() });
  await pick(FL, 'Full Ice'); await pick(FR, 'Full Ice');

  // L3 M1: THE KNOCK-OFF for his three snow limbs, then the shock trap. His 1051 is the TRUNK's.
  const KNOCK = [[10, 1041, 'the +X leg'], [15, 1046, 'the -X leg'], [6, 1051, 'the TRUNK (his own u 1051, on joint 157)']];
  for (const [set, key, what] of KNOCK){
    await play(LAND[0], LAND[1]); await frames(2);
    fired.length = 0;
    await play('3', 'Motion[1]'); await frames(3);
    check(same(fired, [key]) && isSet(drawn(), set),
          'L3 Motion[1] knocks the snow off ' + what + ': set ' + set + ', u ' + key, { fired, d: drawn() });
  }
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1, 'and its 4th play is the SHOCK TRAP: c 1105 at once', fired);

  // SNOW PUT BACK ON -- the rows only he has
  await play(LAND[0], LAND[1]); await frames(2);
  await play('0', 'Motion[32]'); await frames(3);
  const dOn = drawn();
  check(isSet(dOn, 11) && isSet(dOn, 16) && isSet(dOn, 32),
        'L0 Motion[32] ((1, 7)): everything bare goes back to the regrowth rung -- sets 11, 16 AND the trunk\'s 32', dOn);
  await play(LAND[0], LAND[1]); await frames(2);
  await play('0', 'Motion[29]'); await frames(3);
  check(isSet(drawn(), 11), 'L0 Motion[29], 1st play: the +X leg alone goes back (set 11)', drawn());
  for (const r of [FL, FR]) await pick(r, 'Full Ice');
  await pick(TRUNK, 'Ice');
  await play(REST[0], REST[1]); await frames(3);

  // PARALYSIS, the STUN, RAGE, TIRED, ASLEEP and DEATH: the same code and the same records as Gammoth's
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[9] (paralysed): c 1101 at once -- out of GAMMOTH\'s c.pel, which is the only one', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play('3', 'Motion[7]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[7] (the stun chain): c 1103 held, not fired', evReqs(1103));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));
  puffs.length = 0;
  await play('0', 'Motion[3]'); await steps(95);
  check(S.rage === true && same(drawn(), user0), 'L0 Motion[3] (the roar, his group-6 arm\'s only action): rage on, nothing on the model', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30) && puffs.every(p => p.key === 1121),
        'the puff: at once, then every 30 steps, always key 1121', { n: puffs.length, gaps, keys: puffs.map(p => p.key) });
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[15]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[15] (tired): rage off, drool c 1104 at once', fired);
  await play('3', 'Motion[10]'); await frames(4);
  check(isSet(drawn(), 5), 'L3 Motion[10] (lying down): his eyes shut (set 5)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[20]'); await frames(4); await steps(2);
  check(count(fired, 1102) === 1 && puffs.length === 0, 'L0 Motion[20] (the sleep hold): the zzz at once and the puff paused', fired);
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[12]', 'Motion[16]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off', { rage: S.rage });
    check(isSet(drawn(), 5),
          'and HIS EYES SHUT at death (set 5): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with -1 in the status-11 block. A check that does not assert this passes while showing the wrong thing, which is how it survived so long', drawn());
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

export const pageCheck = pageCheckElderfrost;
