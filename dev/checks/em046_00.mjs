// Lagiacrus's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the
// runner serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything
// in this module -- everything it needs it imports inside itself.
// LAGIACRUS (em046_00): E:/offline/decode/notes/states-em046_00.md (0, 3, 4, 5, 6.2).
// HIS BREAKS SIT AT THE ROM'S LEVELS: head and neck/chest at 2, back spines at 3, forelegs at 1 -- so a break clip
// with the part whole shows nothing and fires nothing (no key 1000 / 1005 / 1015 / 1016 in em046_00u).
// HIS PUFF IS HIS OWN FILE (em046_00_019, joint 103) and his 1120 / 1121 DIFFER (1.2x / 0.8x): the pick must ask 1121.
// THE CHARGE IS NOT HERE: u 30 has no CHARGE_EFFECTS entry (his Charged is the boolean axis, the table keys on
// `level`), and the check asserts the absence so it reads as a decision.
// u 1006 / 1017 / 1020 ARE NAMED BY THE ROWS BUT NOT YET EXPORTED: the request is checked, and their export is checked
// separately, so a missing --states export fails on its own line.
async function pageCheckLagiacrus(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Lagiacrus: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em046_00';
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
  const has = (pel, key, when = 'event') => S.entries.some(e => e.when === when && e.def.record && e.def.record.pel === pel && e.def.record.key === key);
  const want = [['em046_00c', 1101], ['em046_00c', 1102], ['em046_00c', 1103], ['em046_00c', 1104], ['em046_00c', 1105],
                ['em046_00c', 1109], ['em046_00u', 900], ['em046_00u', 905], ['em046_00u', 1001]];
  const missing = want.filter(([p, k]) => !has(p, k)).map(([p, k]) => p + ' ' + k);
  check(!missing.length && S.entries.filter(e => e.when === 'ragePuff').length === 2,
        'the schedule holds his exported state records (6 ailments, the head break, the sever, the landing) and 2 ragePuff', missing);
  const unexported = [1006, 1017, 1020].filter(k => !has('em046_00u', k));
  check(!unexported.length, 'the break records u 1006 / 1017 / 1020 are exported (add_effects.py --states)', unexported);
  const puffDefs = S.entries.filter(e => e.when === 'ragePuff').map(e => e.def.efl);
  check(puffDefs.every(f => /em046_00_019/.test(f)),
        'and HIS PUFF IS HIS OWN FILE, em046_00_019 -- not the shared cm200_007', puffDefs);
  check(MS.RAGE_PUFF[MON] && MS.RAGE_PUFF[MON].joint === 103 && MS.RAGE_PUFF[MON].pick() === 0,
        'RAGE_PUFF: joint 103, the base stub pick (0 -> u 1121, the 0.8x record)', MS.RAGE_PUFF[MON] && MS.RAGE_PUFF[MON].joint);
  check(MS.TIRED_DROOL[MON] && MS.TIRED_DROOL[MON][1] === 1104, 'TIRED_DROOL: c 1104', MS.TIRED_DROOL[MON]);
  // [was: "NO CHARGE_EFFECTS entry: u 30 waits on Charged reaching `level` and on its export" -- both done 2026-10-17: index.html's
  // chargeRungOf() passes Charged as rung 1, u 30 exported (dev/em046_00-effects-spec.md 3)]
  check(MS.CHARGE_EFFECTS[MON] && MS.CHARGE_EFFECTS[MON][1], 'the CHARGE_EFFECTS entry: u 30 at the charged rung');
  // the drop joint is the sever call's kind byte 0x91 = 145 (0xea0284 / 0xea0290); his .dtp has no option rows
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 145 && TO.CUT_TAIL[MON].above === 20,
        'his cut tail drops from joint 145 and lands 20 S up', TO.CUT_TAIL[MON]);
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
  // THE TWO CLOCKS (see em047_00.mjs): `every:` countdowns run in CLIP frames, the puff in SCHEDULE frames.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[1]'];
  const LAND = ['3', 'Motion[11]'];          // the ailments' recovery clip: no table entry
  const between = async () => { await play(LAND[0], LAND[1]); await frames(2); };
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 1) && isSet(user0, 3) && isSet(user0, 4) && isSet(user0, 5) && isSet(user0, 14),
        'at rest: head, neck/chest, forelegs and tail intact (sets 1, 3, 4, 5) and the eyes open (set 14)', user0);

  // L3 M2: THE HEAD at LEVEL 2, then the shock trap, then the exhaust
  await between(); fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(!fired.includes(1001) && isSet(drawn(), 1), 'L3 Motion[2] with the Head whole: his row is at LEVEL 2, so nothing fires', fired);
  await between(); fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1, 'the 2nd play is the SHOCK TRAP: c 1105 at once', fired);
  await between(); fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1109]), 'the 3rd play is the EXHAUST status: c 1109 once at frame 0', fired);
  check(await pick('1,2', 'Broken'), 'the Head row set to Broken');
  await between(); fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1001]) && isSet(drawn(), 10), 'and round again at head LEVEL 2: set 10 (243 vertices for 124), u 1001 on joint 2', { fired, d: drawn() });

  // L3 M1: THE NECK/CHEST at LEVEL 2, then THE BACK SPINES at LEVEL 3
  check(await pick('5,6', 'Broken'), 'the Chest row set to Broken');
  check(await pick('7,8,9,10,11', 'Broken'), 'the Shocker row set to Broken');
  // L3 M1 IS ALSO HIS LIST 3's FIRST CLIP, and a list change plays the list's first clip (index.html; the same note at
  // Rathian's check in dev/motion-states-check.mjs) -- so the first between() above, entering list 3 from list 0,
  // already played L3 M1 once and advanced its cycle, and MotionStates.plays is never reset. Which arm a given play
  // shows therefore depends on how the page got here; the check takes TWO consecutive plays and asserts each arm
  // shows exactly once, whatever the phase. (The table's order -- neck/chest, then spines -- is a convention: the ROM
  // picks by part, and the viewer has no part.)
  const m1 = [];
  for (let i = 0; i < 2; i++){
    await between(); fired.length = 0;
    await play('3', 'Motion[1]'); await frames(3);
    m1.push({ fired: [...fired], set11: isSet(drawn(), 11), set9: isSet(drawn(), 9) });
  }
  check(m1.filter(p => same(p.fired, [1006]) && p.set11).length === 1,
        'L3 Motion[1], one of two consecutive plays: the neck/chest broken (set 11), u 1006 requested', m1);
  check(m1.filter(p => same(p.fired, [1017]) && p.set9).length === 1,
        'and the other: the back spines at LEVEL 3 (set 9 -- plate AND thornray bank), u 1017 requested', m1);

  // THE FORELEGS at LEVEL 1 over the whole chain, then the DIRECTION-1 STUN on the same three clips
  check(await pick('12,13', 'Broken'), 'the Claws row set to Broken');
  await between(); fired.length = 0;
  await play('3', 'Motion[3]'); await frames(3);
  check(same(fired, [1020]) && isSet(drawn(), 12), 'L3 Motion[3]: the forelegs broken (set 12), u 1020 on joint 13', { fired, d: drawn() });
  for (const clip of ['Motion[4]', 'Motion[5]']){
    fired.length = 0;
    await play('3', clip); await frames(3);
    check(!fired.length && isSet(drawn(), 12), 'L3 ' + clip + ': the chain keeps the broken forelegs and fires nothing', { fired, d: drawn() });
  }
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[3]', 'Motion[4]', 'Motion[5]', 'Motion[6]', 'Motion[7]', 'Motion[8]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (a stun chain clip): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // THE TAIL SEVER
  check(await pick('14,101', 'Severed'), 'the Tail row set to Severed');
  await between(); fired.length = 0;
  await play('3', 'Motion[13]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 6), 'L3 Motion[13]: the tail severed (set 6), u 900 on joint 145', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));
  for (const r of [['1,2', 'Intact'], ['5,6', 'Intact'], ['7,8,9,10,11', 'Intact'], ['12,13', 'Intact'], ['14,101', 'Intact']]) await pick(r[0], r[1]);
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the rows back to Intact: the parts are the user\'s again', drawn());

  // PARALYSIS
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[9] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);

  // RAGE, the puff, TIRED, ASLEEP, DEATH
  await play('0', 'Motion[3]'); await frames(4);
  check(S.rage === true, 'L0 Motion[3] (the roar, (1, 0)): rage shown', { rage: S.rage });
  await play(REST[0], REST[1]); await frames(3);
  const rageBox = document.getElementById('monRage');
  puffs.length = 0;
  if (rageBox){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await steps(95);
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30) && puffs.every(p => p.key === 1121),
        'with the Enraged toggle on, the puff: at once, then every 30 steps, always key 1121 (the 0.8x one)', { n: puffs.length, gaps });
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }
  fired.length = 0;
  await play('0', 'Motion[19]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[19] (tired, a clip of his own): drool at once', fired);
  await play('3', 'Motion[10]'); await frames(4);
  check(isSet(drawn(), 15), 'L3 Motion[10] (lying down): his eyes shut (set 15, the 18-vertex lid)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[16]'); await frames(4); await steps(2);
  check(isSet(drawn(), 15) && count(fired, 1102) === 1, 'L0 Motion[16] (the sleep hold): eyes shut and the zzz at once', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);
  if (rageBox){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[12]', 'Motion[17]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off', { rage: S.rage });
    check(isSet(drawn(), 15),
          'and HIS EYES SHUT at death (set 15): 0xbd594 raises P+0x5d02 in the status-11 block (the header of motion-states.js; note 6.3\'s "eyes stay open" is the withdrawn negative)', drawn());
  }
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');   // a copy's row ('#B') is its clip's
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  // THE ENABLE WORD (psl-mask.js em046_00; dev/em046_00-effects-spec.md): 0xea9a0c -- L0 M5 / L2 M6 21-23 (24-26 in posture
  // 4), L2 M3 / M7..M9 15-17 only charged; and the Charged toggle is his charge rung for u 30 (CHARGE_EFFECTS)
  { const PM = await import('/render/psl-mask.js');
    const W = (l, n, st) => PM.pslMask(MON, String(l), n, null, st || {});
    check(PM.PSL_MASK_MONSTERS.includes(MON) && W(2, 6) === 0xe001ff && W(2, 6, { posture: 4 }) === 0x70001ff && W(0, 5) === 0xe001ff &&
          W(2, 3) === 0x1ff && W(2, 3, { charged: true }) === 0x381ff && W(2, 8, { charged: true }) === 0x381ff && W(2, 10, { charged: true }) === 0x1ff,
          'the word: L2 M6 by posture, L2 M3 / M8 15-17 only charged');
    check(MS.CHARGE_EFFECTS[MON] && MS.CHARGE_EFFECTS[MON][1] && MS.CHARGE_EFFECTS[MON][1].hold[0][1] === 30, 'u 30 held at the charged rung (0xea9228)');
    const ev30 = () => S.entries.filter(e => e.when === 'event' && e.def.record.key === 30).map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
    const cb = document.getElementById('monCharge');
    if (cb){ cb.checked = true; await cb.onchange({ target: cb }); await frames(6); }
    const on = ev30();
    if (cb){ cb.checked = false; await cb.onchange({ target: cb }); await frames(6); }
    const off = ev30();
    check(cb && on.includes('r') && !off.includes('r'), 'Charged on: u 30 held; off: stopped', { on, off }); }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckLagiacrus;
