// Kirin's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself.
// KIRIN (em011_00): E:/offline/decode/notes/states-em011_00.md.
// HIS TABLE IS SHORT BECAUSE HIS STATES ARE ABSENT, and each absence is read rather than assumed, so the check
// asserts them: NO rage puff (his class writes e+0xb7d2 = 0 and his u.pel has neither 1120 nor 1121), NO tired
// state (tune+0x30 NULL, no (0, 2) case, no c 1104), NO paralysis record (no c 1101), no shock trap, no pitfall,
// no exhaust, no sever and no cut tail. What he does have is one break -- the horn, at LEVEL 2 -- and a lightning
// aura, driven since 2026-10-18 by motion-states.js CLASS_TIMERS (asserted below).
async function pageCheckKirin(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Kirin: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em011_00';
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
  check(byWhen.event >= 3 && !byWhen.ragePuff,
        'the schedule holds 3 event records (the horn break, the zzz and the stun) and NO ragePuff at all', byWhen);
  check(!MS.RAGE_PUFF[MON], 'and no RAGE_PUFF entry: his class writes e+0xb7d2 = 0, and his u.pel has neither 1120 nor 1121');
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(!keys.includes(1104), 'no drool record (c 1104): he can never be tired');
  check(!keys.includes(1101), 'no paralysis record (c 1101): the shared code asks every 60 f and his c.pel has none');
  check(!keys.includes(1105) && !keys.includes(1109),
        'no shock-trap record and no exhaust record: neither state has a case in his status-10 table');
  check(!keys.includes(900) && !TO.CUT_TAIL[MON], 'no sever record and no cut tail');
  const T = MS.MOTION_STATES[MON];
  check(!Object.values(T).some(s => s.tired), 'his table carries no tired row');
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
  const LAND = ['3', 'Motion[2]'];
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 1), 'at rest: the horn is on (set 1)', user0);

  // THE HORN, at LEVEL 2: the first depletion shows and fires nothing
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(fired.length === 0 && isSet(drawn(), 1),
        'L3 Motion[1] with the Horn Intact: level 1 shows nothing and fires nothing -- his row\'s threshold is 2', { fired, d: drawn() });
  check(await pick('2,102,103', 'Broken'), 'the Horn row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1001]) && isSet(drawn(), 4),
        'and broken: set 4 (the horn away, the stub in), u 1001 on joint 2 at 0.2x', { fired, d: drawn() });
  await pick('2,102,103', 'Intact');
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the Horn row back to Intact: the parts are the user\'s again', drawn());

  // RAGE: nothing on the model, and NO puff -- the check is that none arrives over a long wait
  puffs.length = 0;
  await play('4', 'Motion[7]'); await steps(120);
  check(S.rage === true && same(drawn(), user0), 'L4 Motion[7] ((1, 6), his group-6 arm\'s one action): rage on, nothing on the model', { rage: S.rage });
  check(puffs.length === 0, 'and NO puff arrives in 120 steps, where every other monster would have had four', puffs.length);

  // ASLEEP: eyes shut into set 2, and the hold has the zzz -- there is no puff to pause
  await play('3', 'Motion[5]'); await frames(4);
  check(isSet(drawn(), 2), 'L3 Motion[5] (lying down): his eyes shut (set 2)', drawn());
  fired.length = 0;
  await play('3', 'Motion[7]'); await frames(4); await steps(2);
  check(isSet(drawn(), 2) && count(fired, 1102) === 1, 'L3 Motion[7] (the sleep hold): eyes shut and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);

  // THE STUN: held across the chain, stopped off it
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[3]', 'Motion[4]', 'Motion[6]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH: his one death clip for every number but 1, and the fall for (11, 1)
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play('4', 'Motion[6]'); await frames(4);
  check(S.rage === false, 'L4 Motion[6] (death -- every status-11 number but 1, capture included): the rage shown goes off', { rage: S.rage });
  await play('3', 'Motion[10]'); await frames(4);
  check(S.rage === false, 'L3 Motion[10] (death from the fall, (11, 1)): the same', { rage: S.rage });
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(T)){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');   // a copy's row ('#B') is its clip's
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  // THE LIGHTNING AURA (motion-states.js CLASS_TIMERS; vtable +0x208 0xd6df64, dev/em011_00-effects-spec.md 3): calm u 0 every 40,
  // enraged u 61 every 32 (horn intact) and u 60 every 45, none in the roar (1, 6), u 0 none on the down / sleep clips
  { const rb = document.getElementById('monRage');
    const setRage = async on => { if (rb && rb.checked !== on){ rb.checked = on; await rb.onchange({ target: rb }); await frames(3); } };
    await setRage(false); await play(REST[0], REST[1]); await frames(3);
    fired.length = 0; await clipSteps(85);
    check(count(fired, 0) >= 2 && !fired.includes(60) && !fired.includes(61), 'calm: u 0 every 40 frames, no enraged aura', fired);
    await setRage(true); await play(REST[0], REST[1]); await frames(3);
    fired.length = 0; await clipSteps(100);
    check(count(fired, 61) >= 3 && count(fired, 60) >= 2 && !fired.includes(0), 'enraged: u 61 every 32 and u 60 every 45, u 0 off', fired);
    listSel.value = '4'; await listSel.onchange();
    const roar = [...clipSel.options].find(x => x.value === 'Motion[7]');
    fired.length = 0;
    if (roar){ clipSel.value = roar.value; await clipSel.onchange(); await frames(3); await clipSteps(60); }
    check(!!roar && !fired.includes(60) && !fired.includes(61) && !fired.includes(0), 'the rage roar L4 M7 A ((1, 6)): no aura at all', fired);
    check(await pick('2,102,103', 'Broken'), 'the Horn row set to Broken');
    await play(REST[0], REST[1]); await frames(3);
    fired.length = 0; await clipSteps(100);
    check(!fired.includes(61) && count(fired, 60) >= 2, 'the horn broken: u 61 is gone for good, u 60 runs on', fired);
    await pick('2,102,103', 'Intact');
    await setRage(false); await play('3', 'Motion[7]'); await frames(3);
    fired.length = 0; await clipSteps(85);
    check(!fired.includes(0), 'calm on the sleep hold L3 M7: u 0 is held off', fired);
    await play(REST[0], REST[1]); await frames(3); }
  // THE ENABLE WORD (psl-mask.js em011_00): 0xd73a18 -- L4 M7 by action, L2 M4 unless (7, 2)
  { const PM = await import('/render/psl-mask.js');
    const W = (l, n, a) => PM.pslMask(MON, String(l), n, a, {});
    check(PM.PSL_MASK_MONSTERS.includes(MON) && W(4, 7, [7, 5]) === 0x2381ff && W(4, 7, [1, 6]) === 0x3c01ff && W(4, 7, [1, 7]) === 0x1ff &&
          W(2, 4, [7, 3]) === 0x70001ff && W(2, 4, [7, 2]) === 0x1ff,
          'the word: L4 M7 (7, x) bits 15-17 + 21 / the roar (1, 6) 18-21 / (1, 7) base; L2 M4 24-26 unless (7, 2)'); }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckKirin;
