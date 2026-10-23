// Rajang's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself (`await import('/render/monster.js')`).
// RAJANG (em023_00): what his motions show, against C:/MHGU-RE/offline/decode/notes/states-em023_05.md, which read and
// ROM-ran BOTH variants of uEm023_00 ("not one action differs", 7). Every clip is Furious Rajang's; what is checked
// here is what VARIANT 0 does on them, which is where the two part ways:
//   HIS RAGE SWAPS THE MESH (the part pass's isEnraged arms, 2): mane + hairline 2 + 6 -> 12 + 13, the tail 5 -> 14
//   (11 -> 16 severed). So a rage row lays the enraged sets over a Calm rung, and the tired, sever and death rows lay
//   the calm ones over an Enraged / Armor Mode rung -- with the arms unpumped (set 7), since variant 0 holds the pump
//   only while enraged (4.4).
//   HE HAS NO RAGE PUFF (`e+0xb7d2 = 0` for variant 0, 4.3): asserted as a positive -- rage runs and no puff comes.
//   HE TIRES (tune+0x30 present, 6) and drools; HIS EXHAUST PROCS (tune+0x44 present, 1.1).
//   HIS SEVER SHOWS: u 1020 and the severed tail, and it clears rage (0xbd06c, 3.4).
//   THE SHOCK TRAP HAS NO CLIP OF ITS OWN -- (10, 0x6e) goes straight to paralysis's hold L3 M13 -- so the two take turns.
// THE STATE AXIS OWNS HIS RAGE (part-review `levels.rage` = [false, true, true]), so the rung is set through #monLevel,
// not the hidden Enraged checkbox.
async function pageCheckRajang(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Rajang: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em023_00';
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
  const puffs = [], auras = [];
  const s0 = S.start.bind(S);
  S.start = e => {
    if (e.when === 'ragePuff') puffs.push({ key: e.def.record.key, step: S.frame });
    if (e.when === 'rageStart') auras.push({ key: e.def.record.key, step: S.frame });
    return s0(e);
  };
  const hasEvent = (pel, key) => S.entries.some(e => e.when === 'event' && e.def.record && e.def.record.pel === pel && e.def.record.key === key);
  for (const [pel, key] of [['em023_00c', 1101], ['em023_00c', 1102], ['em023_00c', 1103], ['em023_00c', 1104],
                            ['em023_00c', 1105], ['em023_00c', 1109], ['em023_00u', 1000], ['em023_00u', 1001]])
    check(hasEvent(pel, key), 'the schedule holds the state record ' + pel + ' ' + key);
  // u 1020 was NOT in docs/effects/em023_00.json when this check was written (2026-10-15): --states must export it
  check(hasEvent('em023_00u', 1020), 'the schedule holds the sever record u 1020 (exported by add_effects.py --states)');
  check(!MS.RAGE_PUFF[MON], 'NO RAGE_PUFF entry: vtable +0x1d8 writes e+0xb7d2 = 0 for variant 0', MS.RAGE_PUFF[MON]);
  check(JSON.stringify(MS.TIRED_DROOL[MON]) === JSON.stringify(['em023_00c', 1104]),
        'TIRED_DROOL is c 1104: tune+0x30 is present and e+0xb7d3 is left at 1', MS.TIRED_DROOL[MON]);
  check(!TO.CUT_TAIL[MON], 'NO cut tail: descriptor 0x15961a8 has both option slots -1', TO.CUT_TAIL[MON]);
  const T = MS.MOTION_STATES[MON];
  check(T && !Object.values(T).some(s => s.drops || (s.cycle && s.cycle.some(c => c.drops))), 'and no `drops` anywhere in his table');
  check(T && !T['3|Motion[15]'] && !T['3|Motion[17]'] && !T['3|Motion[23]'],
        'L3 M15 / M17 / M23 are NOT death rows -- the knockdown and the pit ailments share them');

  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (d, n) => !!d && (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const allSets = (d, ns) => ns.every(n => isSet(d, n));
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
  const HEAD = '4,102+5,103', TAIL = '6,7,8,9,10,101';
  // THE STATE RUNG: 0 Calm, 1 Enraged, 2 Armor Mode (part-review em023_00 `levels`)
  const lvSel = document.getElementById('monLevel');
  const rung = async i => {
    if (!lvSel || !lvSel.options[i]) return false;
    lvSel.value = String(i); await lvSel.onchange({ target: lvSel }); await frames(3);
    return (V.state.level | 0) === i;
  };
  // NO FRAME PASSES BETWEEN THE LIST CHANGE AND THE CLIP CHANGE (dev/checks/em023_05.mjs has the long version), and the
  // _loop is preferred over the _start so a short _start does not restart the motion's countdowns.
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  // a COPY of a clip (render/motion-states.js CLIP_VARIANTS): its menu value carries '#B', the clip played does not
  const playCopy = async (list, clip, copy) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip + '_loop#' + copy || x.value === clip + '#' + copy);
    if (!o){ check(false, 'the list has copy ' + copy + ' of ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    const name = o.value.replace(/#.*$/, '');
    return until(() => V.pose.action && V.pose.action.getClip().name === name, 300);
  };
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 20 * n + 200); };
  // THE TWO CLOCKS: `every:` countdowns run in CLIP frames (clipSteps), the puff and the drool in SCHEDULE steps (steps)
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[1]'];           // his plain idle loop: no table entry
  const LAND = ['3', 'Motion[3]'];           // the common recovery clip: no table entry, safe to land on between plays
  V.state.loop = true;
  check(await rung(0), 'the State rung set to Calm', V.state.level);
  await pick(HEAD, 'Intact'); await pick(TAIL, 'Intact');
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(allSets(user0, [2, 6, 5, 7, 3, 4]), 'at rest, Calm: the calm mane (2), no hairline (6), the calm long tail (5), arms 7, horns intact', user0);

  // THE HEAD BREAK, route 1 (L3 M1), cumulative -- his own records at 0.7x
  check(await pick(HEAD, 'One Horn Broken'), 'the Head row set to One Horn Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1000]) && isSet(drawn(), 9), 'L3 Motion[1] at level 1: set 9, u 1000', { fired, d: drawn() });
  check(await pick(HEAD, 'Both Horns Broken'), 'the Head row set to Both Horns Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1001]) && allSets(drawn(), [9, 10]), 'and at level 2: sets 9 AND 10, u 1001', { fired, d: drawn() });

  // L3 M2 IS THREE STATES, in order: the head break (route 2), the tail SEVER, the exhaust. Played from the Enraged
  // rung, so the sever's rage clear and calm mesh show. NOTHING may play L3 M2 before this block.
  check(await rung(1), 'the State rung set to Enraged', V.state.level);
  await play(LAND[0], LAND[1]); await frames(3);
  check(S.rage === true && allSets(drawn(), [12, 13, 14]), 'Enraged at rest: the angry mane (12), the hairline (13), the angry tail (14)', { rage: S.rage, d: drawn() });
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1001]) && allSets(drawn(), [9, 10]) && S.rage === true,
        'L3 Motion[2] play 1, the (10, 0x14) route: the same head break, rage left as it is', { fired, d: drawn(), rage: S.rage });
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  const dSev = drawn();
  check(same(fired, [1020]) && S.rage === false && allSets(dSev, [11, 2, 6, 7]),
        'L3 Motion[2] play 2, the SEVER (10, 0x72): u 1020, rage cleared (0xbd06c), the calm SEVERED tail (11), the calm mane and arms 7',
        { fired, d: dSev, rage: S.rage });
  check(allSets(dSev, [9, 10]), 'and the head break stays through it', dSev);
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1109]) && S.rage === true, 'L3 Motion[2] play 3, the tune+0x44 status: c 1109 once (his tune+0x44 is present)', { fired, rage: S.rage });
  await pick(HEAD, 'Intact');

  // RAGE from the Calm rung: the mesh swaps for the motion, the aura once, and NO PUFF
  check(await rung(0), 'the State rung back to Calm', V.state.level);
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'Calm at rest again: the parts are the user\'s', drawn());
  puffs.length = 0; auras.length = 0;
  await play('0', 'Motion[5]'); await steps(95);
  check(S.rage === true && allSets(drawn(), [12, 13, 14]),
        'L0 Motion[5] (the rage roar, (1, 5)): rage on and the ENRAGED mesh over a Calm rung -- sets 12, 13 and the angry tail 14', { rage: S.rage, d: drawn() });
  check(auras.length === 1 && auras[0].key === 0, 'the aura c 0 (em023_00_009) once on the rising edge', auras);
  check(puffs.length === 0, 'and NO puff in 95 steps of rage: e+0xb7d2 = 0 on variant 0', puffs);
  check(await pick(TAIL, 'Broken'), 'the Tail row set to Broken');
  await play(REST[0], REST[1]); await frames(3);
  await play('0', 'Motion[5]'); await frames(4);
  check(isSet(drawn(), 16), 'L0 Motion[5] with the tail severed: the angry SEVERED tail, set 16', drawn());
  await play(REST[0], REST[1]); await frames(3);
  check(S.rage === false && isSet(drawn(), 11), 'off the roar, Calm: rage off and the calm severed tail (11) -- the user\'s', { rage: S.rage, d: drawn() });
  await pick(TAIL, 'Intact');

  // TIRED from the Armor Mode rung: rage off, the calm mesh, arms unpumped, and the drool
  check(await rung(2), 'the State rung set to Armor Mode', V.state.level);
  await play(REST[0], REST[1]); await frames(3);
  check(S.rage === true && isSet(drawn(), 15), 'Armor Mode at rest: enraged and the pumped arms (15)', { rage: S.rage, d: drawn() });
  fired.length = 0;
  await play('0', 'Motion[17]'); await frames(3); await steps(2);
  check(S.rage === false && allSets(drawn(), [2, 6, 5, 7]),
        'L0 Motion[17] (the tired idle (0, 2)): rage off, the calm mane / tail, and arms 7 (no pump while calm on variant 0)', { rage: S.rage, d: drawn() });
  check(count(fired, 1104) === 1, 'the drool c 1104 at once', fired);
  await steps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);
  check(await rung(0), 'the State rung back to Calm', V.state.level);

  // ASLEEP: the lids close (set 8) and the zzz every 90
  await play('0', 'Motion[23]'); await frames(4);
  check(isSet(drawn(), 8), 'L0 Motion[23] (lying down): the lids close -- set 8', drawn());
  fired.length = 0;
  await play('0', 'Motion[24]'); await frames(4); await steps(2);
  check(isSet(drawn(), 8) && count(fired, 1102) === 1, 'L0 Motion[24] (the sleep hold): lids shut and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 on', fired);
  await play(REST[0], REST[1]); await frames(3);
  check(isSet(drawn(), 1), 'off the sleep chain the lids open again (set 1)', drawn());

  // L3 M13 IS COPIED (CLIP_VARIANTS, Raven 2026-10-15): copy A paralysis, copy B the shock trap's hold
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1 && count(fired, 1105) === 0, 'L3 Motion[13] copy A (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 on', fired);
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await playCopy('3', 'Motion[13]', 'B'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1 && count(fired, 1101) === 0, 'L3 Motion[13] copy B (the shock trap\'s hold, its only clip): c 1105 at once', fired);
  await clipSteps(46);
  check(count(fired, 1105) === 2, 'and again 42 on', fired);
  await play(REST[0], REST[1]); await frames(3);

  // THE STUN: one held handle across the chain, stopped off it
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[11]', 'Motion[7]', 'Motion[8]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain): c 1103 held', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH from Armor Mode with the head broken and the tail severed: rage off, the CALM mesh back, arms 7, lids 8,
  // and the breaks stay
  check(await rung(2), 'the State rung set to Armor Mode', V.state.level);
  await pick(HEAD, 'Both Horns Broken'); await pick(TAIL, 'Broken');
  await play(REST[0], REST[1]); await frames(3);
  for (const clip of ['Motion[19]', 'Motion[18]']){
    await play('3', clip); await frames(4);
    const d = drawn();
    check(S.rage === false && allSets(d, [2, 6, 11, 7, 8, 9, 10]),
          'L3 ' + clip + ' (death): rage off, the calm mane (2 + 6) and calm severed tail (11), arms 7, lids shut (8), both horns still broken',
          { rage: S.rage, d });
  }
  await play('3', 'Motion[15]'); await frames(4);
  check(S.rage === true, 'but L3 Motion[15] (the knockdown, which (11, 1) shares) leaves rage alone', { rage: S.rage });
  await pick(HEAD, 'Intact'); await pick(TAIL, 'Intact');
  await rung(0);
  await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(T)){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');   // a copy's row ('#B') is its clip's
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  // L2 M8'S PLAYS (shells.js pickVariantsFor: the beams (7, 6) / (7, 0xa), then the ball's (7, 5) / (7, 0xc) / (7, 0x3b), then g1
  // s35's direct (7, 0x3e) -- no beam, no shell -- one action a play; index.html takes the play's action from that pick): the word
  // lights bits 15-17 (u 291) on 3 plays in 6, as table 0xded140 has it (6 / 0xa / 0x3e in, 5 / 0xc / 0x3b out). The tired remap
  // (7, 0x43) is not in the rotation (tired, the word lights nothing).
  { const SH = await import('/render/shells.js');
    const picks = SH.pickVariantsFor(MON, '2', 'Motion[8]', { tired: false, rage: false }) || [];
    check(picks.join(' ') === '7:0x06 7:0x0a 7:0x05 7:0x0c 7:0x3b 7:0x3e', 'L2 M8 rotates the six actions', picks);
    const mask = () => S.clip && S.clip.mask != null ? S.clip.mask >>> 0 : null;
    await play('0', 'Motion[1]'); await frames(2);
    // from its _start each time: a _loop replay goes on with the same play (index.html rockInput), so it would not advance the pick
    const ms = []; for (let i = 0; i < 6; i++){ await play('2', 'Motion[8]_start'); await frames(6); ms.push(mask()); }
    const lit = ms.map(w => w != null && (w & 0x38000) === 0x38000);
    check(lit.join(' ') === 'true true false false false true', 'L2 M8 in the page: bits 15-17 on 3 plays in 6 (the beams and (7, 0x3e))', ms.map(w => w == null ? null : '0x' + w.toString(16)));
    await play('0', 'Motion[1]'); await frames(3); }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  // THE ENABLE WORD (psl-mask.js em023; dev/em023-effects-spec.md): 0xded0f4 -- u 291 on L2 M8 only for numbers 6 / 0xa / 0x34 /
  // 0x35 / 0x3e / 0x3f / 0x40, never while tired
  { const PM = await import('/render/psl-mask.js');
    const W = (a, st) => PM.pslMask(MON, '2', 8, a, st || {});
    check(PM.PSL_MASK_MONSTERS.includes(MON) && W([7, 6]) === 0x381ff && W([7, 5]) === 0x1ff && W([7, 6], { tired: true }) === 0x703f &&
          W([7, 0x3e], { rage: true }) === 0x38e3f, 'the word: L2 M8 (7, 6) u 291, (7, 5) none, tired none, (7, 0x3e) enraged u 291',
          [W([7, 6]), W([7, 5]), W([7, 6], { tired: true }), W([7, 0x3e], { rage: true })].map(w => '0x' + w.toString(16))); }
  return out;
}

export const pageCheck = pageCheckRajang;
