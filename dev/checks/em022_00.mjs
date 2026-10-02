// Blangonga's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself.
// BLANGONGA (em022_00): E:/offline/decode/notes/states-em022_00.md.
// NOTHING ON HIS MODEL FOLLOWS RAGE -- his class never calls isEnraged or isTired anywhere -- so the check asserts
// that the rage entry changes no part at all, and that the puff is the whole of what rage shows.
// HIS TAIL BREAK IS NOT A SEVER: set 4 -> 5 turns the tail tip OFF with nothing in its place, and he has no sever
// record and no cut-tail model. Both halves are asserted, because "the tail vanished" otherwise reads like a bug.
async function pageCheckBlangonga(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Blangonga: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em022_00';
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
  check(byWhen.event >= 7 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 7 event (2 breaks + 6 ailments) and 2 ragePuff', byWhen);
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(!keys.includes(900) && !TO.CUT_TAIL[MON],
        'and NO sever: no u 900 and no cut tail -- his tail BREAKS and the tip simply goes', TO.CUT_TAIL[MON]);
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
  const REST = ['0', 'Motion[2]'];
  const LAND = ['0', 'Motion[30]'];          // the ailments' recovery clip: no table entry
  const FANGS = '1,2,101';                   // part-review's "Teeth" row: Intact 1,101 / Broken 2
  const TAIL = '3,103';                      // "Tail": Intact 3,103 / Broken none -- the tip simply goes
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 6) && isSet(user0, 4), 'at rest: the fangs and the tail tip are on (sets 6, 4)', user0);

  // THE FANGS, at LEVEL 2 only -- and L3 M2's second play is the exhaust status
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(fired.length === 0 || fired.includes(1001) || fired.includes(1109),
        'L3 Motion[2] with the fangs whole: the row carries `at: 2`, because `vtable +0x23c` sends part 0 to ' +
        '(10, 0x14) ONLY while its level equals the threshold -- so this clip is the break landing, not a flinch',
        fired);
  check(await pick(FANGS, 'Broken'), 'the Teeth row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3); await clipSteps(80);
  check(count(fired, 1109) === 1 || count(fired, 1001) === 1,
        'and its plays alternate between the FANG break (u 1001, set 7) and the EXHAUST status (c 1109 once)',
        fired);

  // THE TAIL BREAK: the tip goes, and nothing replaces it
  check(await pick(TAIL, 'Broken'), 'the Tail row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1020]) && isSet(drawn(), 5),
        'L3 Motion[1]: the TAIL TIP GOES (set 5 turns groups 3 and 103 both off, with no stump), u 1020 on joint 143',
        { fired, d: drawn() });

  // RAGE: no part changes at all, and the puff is the whole of it
  await play(REST[0], REST[1]); await frames(3);
  const before = drawn();
  puffs.length = 0;
  await play('0', 'Motion[32]'); await steps(95);
  check(S.rage === true && same(drawn(), before),
        'L0 Motion[32] (the rage entry): rage on, and NOT ONE part changes -- his class never calls isEnraged', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30) && puffs.every(p => p.key === 1121),
        'the puff: at once, then every 30 steps, always key 1121', { n: puffs.length, gaps });

  // TIRED, ASLEEP
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[35]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[35] (tired, a clip of its own): rage off, drool at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);
  await play('3', 'Motion[18]'); await frames(4);
  check(isSet(drawn(), 3), 'L3 Motion[18] (lying down): his eyes shut (set 3)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[19]'); await frames(4); await steps(2);
  check(isSet(drawn(), 3) && count(fired, 1102) === 1, 'L3 Motion[19] (the sleep hold): eyes shut and the zzz at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS (which is also the shock trap's clip) and the STUN
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[9] (paralysed -- and the shock trap\'s hold too): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[3]', 'Motion[5]', 'Motion[6]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (a stun chain clip): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[12]', 'Motion[13]', 'Motion[16]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off even with the user enraged', { rage: S.rage });
    check(isSet(drawn(), 3),
          'and HIS EYES SHUT at death (set 3): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with -1 in the status-11 block. A check that does not assert this passes while showing the wrong thing, which is how it survived so long', drawn());
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

export const pageCheck = pageCheckBlangonga;
