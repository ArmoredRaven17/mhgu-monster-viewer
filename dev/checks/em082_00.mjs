// The Mizutsune line's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE, TWO MONSTERS:
// uEm082_00 runs Mizutsune AND Soulseer (the variant byte e+0xb5f5, 0 / 4), and the status-10 / status-11 scripts,
// motion lists 0 / 2 / 3 / 4, the c.pel and the rage stream are the same for both. The function is serialised with
// .toString() and evaluated IN THE PAGE, so it must not close over anything in this module.
// MIZUTSUNE / SOULSEER (em082_00, em082_04): E:/offline/decode/notes/states-em082_00.md, and Soulseer's part pass
// 0x10384dc read for the table (dev/rom-map.md, 2026-10-15).
// WHAT DIFFERS AND IS ASSERTED: Mizutsune's head has TWO rows (level 1 -> u 1000, set 5; level 3 -> u 1002, set 6),
// Soulseer's ONE (level 2 -> u 1001, set 6), and neither u.pel carries the other's keys; Mizutsune's eyes shut into
// set 19 asleep and dead, Soulseer's sets 18 / 19 are EMPTY; Soulseer's fore legs go to their lying ("Claw Down")
// sets 20 / 22 in the sleep hold L0 M15, where his 0x10393d0 returns 0 from frame 0.
// RECORDS THIS NEEDS EXPORTED (add_effects.py --states): Mizutsune u 1002 / 1006 / 1011 / 1025 / 1030, Soulseer
// u 1006 / 1011 / 1025 / 1030 -- until then the break rows fire records the schedule does not hold.
async function pageCheckMizutsune(MON, NAME, U, DEVIANT){
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
  const keys = S.entries.filter(e => e.def.record && e.def.record.pel === U).map(e => e.def.record.key);
  const BREAKS = DEVIANT ? [1001, 1006, 1011, 1025, 1030, 900, 905] : [1000, 1002, 1006, 1011, 1025, 1030, 900, 905];
  check(BREAKS.every(k => keys.includes(k)) && (DEVIANT ? !keys.includes(1000) && !keys.includes(1002) : !keys.includes(1001)),
        DEVIANT ? 'his break, sever and landing records are all there -- ONE head key, u 1001 (.dtp row 0 at level 2); ' +
                  'em082_04u has no 1000 and no 1002'
                : 'his break, sever and landing records are all there -- TWO head keys, u 1000 (level 1) and u 1002 ' +
                  '(level 3); em082_00u has no 1001', { missing: BREAKS.filter(k => !keys.includes(k)) });
  const pels = {};
  for (const e of S.entries) if (e.def.record) pels[e.def.record.pel] = (pels[e.def.record.pel] || 0) + 1;
  check(pels['em082_00c'] > 0 && pels[U] > 0 && !pels['em082_04c'],
        'the ailments come from em082_00c -- there is no em082_04c.pel -- and the breaks from ' + U, pels);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick() === 0 && P.joint === 132 && P.records.every(r => r[0] === U),
        'his puff is the stub shape (vtable +0x2a4 = 0x6bf64) on JOINT 132', { joint: P && P.joint });
  check(MS.TIRED_DROOL[MON] && MS.TIRED_DROOL[MON][0] === 'em082_00c' && MS.TIRED_DROOL[MON][1] === 1104,
        'and he tires: the drool is em082_00c 1104', MS.TIRED_DROOL[MON]);
  // the sever call 0xc2274(e, 0, 0, 0x8e) at 0x1037160 -> joint 142; .dtp option row 0 = (.., 0.8, 20.0)
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 142 && TO.CUT_TAIL[MON].above === 20,
        'his cut tail drops from joint 142 (the kind byte, not u 900\'s 144) and lands 20 S up', TO.CUT_TAIL[MON]);
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  // THE OVERLAY GROUPS (`XfBA1__m01_angry`) are drawn as the part pass draws them -- every alive set, at every state,
  // until the death clip has ended with him not tired (motion-states.js STATE_OVERLAY; Raven, 2026-10-15: "For Mizu's
  // exhausted, simply follow the ROM") -- and the material alone says which state shows (ov / shown below).
  const OV = (MS.STATE_OVERLAY[MON] || {}).groups || [];
  const isSet = (d, n) => !!d && (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const ov = d => !!d && OV.filter(g => MONSTER.partIds.includes(g)).map(g => d[g] === true);
  const ovAll = (d, on) => { const v = ov(d); return !!v && v.length > 0 && v.every(x => x === on); };
  const ovHeadFin = d => !!d && d[20] === true && d[21] === true;          // on in every alive set (note 2.1)
  const shown = () => V.motionStates().mat.shown;
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
  // THE TWO CLOCKS: `every:` countdowns run in CLIP frames, the puff's cadence in SCHEDULE frames.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[2]'];         // the combat idle (0, 1): no table entry
  const LAND = ['3', 'Motion[1]'];         // (10, 7) for parts 1, 2, 3, 4, 6, 7: no table entry, shows nothing
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
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);

  // L3 M2: the head, the shock trap, the exhaust status
  const m2 = await rounds('3', 'Motion[2]', 3);
  check(m2.some(x => same(x.fired, [DEVIANT ? 1001 : 1000]) && isSet(x.d, DEVIANT ? 6 : 5)),
        DEVIANT ? 'L3 Motion[2] shows the HEAD at LEVEL 2, its one row: set 5 -> 6 (group 2 off, 13 on) and u 1001 on JOINT 130'
                : 'L3 Motion[2] shows the HEAD at LEVEL 1: set 4 -> 5 (group 1 off, 11 and 12 on) and u 1000 on JOINT 130',
        m2.map(x => x.fired));
  check(m2.every(x => ovHeadFin(x.d)) && shown() === 'calm',
        'at the Normal rung the break rows draw the overlay as their alive sets do (groups 20 / 21 on) and the material ' +
        'shows calm', { ov: m2.map(x => ov(x.d)), shown: shown() });
  check(m2.some(x => same(x.fired, [1105])), 'and the SHOCK TRAP\'s own play clip: c 1105 at once', m2.map(x => x.fired));
  check(m2.some(x => same(x.fired, [1109])), 'and (10, 0x1b), the tune+0x44 status: c 1109 once', m2.map(x => x.fired));
  if (!DEVIANT){
    check(await pick('1,2,11,12,13,20,22,101,102', 'Broken'), 'the Head row set to Broken');
    const m2b = await rounds('3', 'Motion[2]', 3);
    check(m2b.some(x => same(x.fired, [1002]) && isSet(x.d, 6)),
          'and at the user\'s Broken: the SECOND head row, LEVEL 3 -- set 5 -> 6 (2 off, 12 off, 13 on) and u 1002',
          m2b.map(x => x.fired));
    await pick('1,2,11,12,13,20,22,101,102', 'Intact');
  }

  // L3 M3: the -X chain -- the -X fore leg at level 2, the fin and the tail at level 1
  const m3 = await rounds('3', 'Motion[3]', 3);
  check(m3.some(x => same(x.fired, [1006]) && isSet(x.d, 10)),
        'L3 Motion[3] ((10, 0x14) with part 1): the -X FORE LEG at level 2 -- set 9 -> 10 -- and u 1006 on JOINT 13',
        m3.map(x => x.fired));
  check(m3.some(x => same(x.fired, [1030]) && isSet(x.d, 14)),
        'the DORSAL FIN at level 1 -- set 13 -> 14 -- and u 1030 on JOINT 16', m3.map(x => x.fired));
  check(m3.some(x => same(x.fired, [1025]) && isSet(x.d, 16)),
        'the TAIL at level 1 (a part-5 depletion, (10, 7) by direction) -- set 15 -> 16 -- and u 1025 on JOINT 144',
        m3.map(x => x.fired));

  // L3 M6: the +X chain, and the stun's
  const m6 = await rounds('3', 'Motion[6]', 4, 4);
  check(m6.some(x => same(x.fired, [1011]) && isSet(x.d, 8)),
        'L3 Motion[6] ((10, 0x14) with part 2): the +X FORE LEG at level 2 -- set 7 -> 8 -- and u 1011 on JOINT 8',
        m6.map(x => x.fired));
  check(m6.some(x => same(x.fired, [1030])) && m6.some(x => same(x.fired, [1025])),
        'and the fin and the tail from the other side', m6.map(x => x.fired));
  for (const clip of ['Motion[7]', 'Motion[8]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'),
          'L3 ' + clip + ' (the stun chain -- NOT sided for him: N = 9 is mode 0): c 1103 held', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // THE TAIL SEVER
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 17),
        'L3 Motion[13] ((10, 0x72) with part 5): the tail SEVERED -- set 17 -- and u 900 on JOINT 144', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));

  // RAGE: no set changes -- the look is angry_Change on XfBA1__m01_angry
  await play(REST[0], REST[1]); await frames(3);
  const before = drawn();
  // LOOPED, not played once. The effect runtime's clock IS the animation (live.js frameUnsafe: `advance` is 0 while
  // a play-once clip sits clamped on its last frame), so a 25-frame roar played once steps the schedule ~25 times
  // and then never again -- one puff, and `steps` times out. Looped, each wrap is the rage entry again (restartRage:
  // setRage off and on), which leaves the puff's countdown alone (schedule.js stepPuff keeps P.left), so the
  // cadence runs on across the wraps.
  puffs.length = 0;
  await play('2', 'Motion[14]'); await steps(95);
  check(S.rage === true && same(drawn(), before) && ovHeadFin(drawn()) && shown() === 'enraged',
        'L2 Motion[14] ((1, 0x10) / (1, 0x12), the first clip of a rage roar) at the Normal rung: rage on, the material ' +
        'shows ENRAGED (angry_Change, red) on the overlay already drawn -- NOT ONE part changes',
        { rage: S.rage, ovBefore: ov(before), ovNow: ov(drawn()), shown: shown() });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is u 1121, never 1120', puffs.map(p => p.key));
  await play('2', 'Motion[17]'); await frames(4);
  check(S.rage === true, 'L2 Motion[17] ((1, 0x11) / (1, 0x13)): rage on', { rage: S.rage });

  // TIRED
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[9]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[9] (the tired idle (0, 2), a clip of its own): rage off and the drool c 1104 at once', { rage: S.rage, fired });
  check(shown() === 'tired' && ovHeadFin(drawn()),
        'and at the Normal rung the material shows EXHAUSTED (tired_Change, blue) with the overlay drawn for it',
        { shown: shown(), ov: ov(drawn()) });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'and the drool again 48 clip frames on', fired);

  // ASLEEP and PARALYSIS
  await play(REST[0], REST[1]); await frames(3);
  if (!DEVIANT){
    await play('3', 'Motion[10]'); await frames(3);
    check(isSet(drawn(), 19), 'L3 Motion[10] (lying down, and capture): his eyes shut -- set 18 -> 19, the lid on', drawn());
  }
  fired.length = 0;
  await play('0', 'Motion[15]'); await frames(3); await steps(2);
  check(count(fired, 1102) === 1, 'L0 Motion[15] (the sleep hold): the zzz at once', fired);
  // (NOT `!isSet(drawn(), 19)`: his set 19 is EMPTY, and isSet of an empty set is vacuously true -- assert the
  // emptiness itself.)
  if (DEVIANT) check(isSet(drawn(), 20) && isSet(drawn(), 22) && !(MONSTER.groups[19] || []).length && !(MONSTER.groups[18] || []).length,
        'and his fore legs LIE DOWN -- sets 20 / 22, the "Claw Down" forms -- because 0x10393d0 returns 0 on L0 M15; ' +
        'no lid: his sets 18 / 19 are empty', drawn());
  else check(isSet(drawn(), 19), 'and the lid stays', drawn());
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 clip frames on', fired);
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[9] (paralysed, and the trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 clip frames on', fired);

  // DEATH
  for (const clip of ['Motion[12]', 'Motion[17]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off, so angry_End runs', { rage: S.rage });
    check(shown() === 'calm' && ovHeadFin(drawn()), 'and the material is calm (angry_End), the overlay KEPT while the death clip plays',
          { shown: shown(), ov: ov(drawn()) });
    if (!DEVIANT) check(isSet(drawn(), 19),
          'and HIS EYES SHUT (set 19): his vtable +0x21c is the base 0x6be7c, so 0xbd594(e, -1) raises P+0x5d02 at death',
          drawn());
  }
  await play(REST[0], REST[1]); await frames(3);

  // THE STATE RUNG AND THE ROWS TOGETHER: a rage roar at Exhausted shows rage (never both, 0xbcd20), a tired idle at
  // Enraged shows exhaustion, and each rung on the combat idle shows its own
  const lvSel = document.getElementById('monLevel');
  const rung = async n => { lvSel.value = String(n); lvSel.onchange({ target: lvSel }); await frames(4); };
  for (const [n, want] of [[0, 'calm'], [1, 'enraged'], [2, 'tired']]){
    await rung(n); await play(REST[0], REST[1]); await frames(4);
    check(shown() === want && ovHeadFin(drawn()),
          'the ' + ['Normal', 'Enraged', 'Exhausted'][n] + ' rung on the combat idle: ' + want, { shown: shown(), ov: ov(drawn()) });
  }
  await play('2', 'Motion[14]'); await frames(4);
  check(shown() === 'enraged' && ovHeadFin(drawn()), 'L2 Motion[14] at the Exhausted rung: ENRAGED', { shown: shown(), ov: ov(drawn()) });
  await rung(1);
  await play('0', 'Motion[9]'); await frames(4);
  check(shown() === 'tired' && ovHeadFin(drawn()), 'L0 Motion[9] at the Enraged rung: EXHAUSTED', { shown: shown(), ov: ov(drawn()) });
  // THE DEATH CLIP PLAYED ONCE TO ITS END: the part pass's dead sets drop the overlay -- unless he is tired (ALIVE =
  // tired | !(dying && the clip has ended), note 2)
  V.state.loop = false;
  for (const [n, want] of [[1, false], [2, true]]){
    await rung(n); await play(REST[0], REST[1]); await frames(3);
    await play('3', 'Motion[12]');
    const early = drawn();
    const done = await until(() => V.pose.action && V.pose.action.time >= V.pose.action.getClip().duration - 1e-3, 900);
    await frames(3);
    check(done && ovHeadFin(early) && (want ? ovHeadFin(drawn()) : ovAll(drawn(), false)),
          'L3 Motion[12] played once at the ' + ['Normal', 'Enraged', 'Exhausted'][n] + ' rung: the overlay drawn while it ' +
          'plays, ' + (want ? 'KEPT at its end (tired)' : 'dropped at its end (dead sets)'), { done, early: ov(early), end: ov(drawn()) });
  }
  V.state.loop = true;
  await rung(0); await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');   // a copy's row ('#B') is its clip's
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  // THE ENABLE WORD (psl-mask.js em082; dev/em082-effects-spec.md): 0x1038cac, action-keyed
  { const PM = await import('/render/psl-mask.js');
    const W = (l, n, a, st) => PM.pslMask(MON, String(l), n, a, st || {});
    check(PM.PSL_MASK_MONSTERS.includes(MON) && W(0, 12, [1, 4]) === 0x1c01ff && W(0, 12, [1, 8]) === 0x381ff && W(2, 1, [7, 7]) === 0x70001ff &&
          W(2, 1, [7, 0x23]) === 0x380001ff && W(2, 69, [7, 0x7b]) === 0x381ff && W(2, 10, null) === 0x70001ff && W(3, 3, [10, 7]) === 0x1c01ff &&
          W(0, 15, [1, 0x16]) === 0xe001ff, 'the word: L0 M12 / L2 M1 / L2 M69 by action, L2 M10 24-26, L3 M3 18-20 under status 10, L0 M15 under (1, 0x16)');
    if (DEVIANT){
      check(W(2, 10, null, { soulFlame: true }) === 0x380001ff, 'Soulseer: the SET_A clips 27-29 with the soul flame lit (P+0x1bb bit 1)');
      const evr = k => S.entries.filter(e => e.when === 'event' && e.def.record.key === k).map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
      const sel = async (list, v) => { if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
        const o = [...clipSel.options].find(x => x.value === v); if (!o){ check(false, 'the Clip menu offers ' + list + '|' + v); return false; }
        clipSel.value = v; await clipSel.onchange(); await frames(4); await steps(2); return true; };
      fired.length = 0; if (await sel('9', 'Motion[6]#B')) check(fired.includes(320), 'Soulseer L9 M6 B ((7, 0x6e)): u 320 at the action start', fired);
      fired.length = 0; if (await sel('9', 'Motion[6]#D')) check(fired.includes(321), 'Soulseer L9 M6 D ((7, 0x77 / 0x79)): u 321', fired);
      await play('0', 'Motion[1]'); await frames(3);
      // u 310 held, then LEFT EARLY (the case that drew a stopped request unmoved before schedule.js deferred held-event stops to
      // the next step -- dev/em082-effects-spec.md 6) and then held its full run
      if (await sel('9', 'Motion[5]_loop')) check(evr(310).includes('r'), 'Soulseer L9 M5 ((7, 0x6a / 0x6b) phase 1): u 310 held', evr(310));
      await play('9', 'Motion[2]'); await frames(6);
      check(!evr(310).includes('r') && !fx.failed, 'left after a few frames: u 310 stopped, the runtime still running', { u310: evr(310), failed: fx.failed });
      if (await sel('9', 'Motion[5]_loop')) await frames(70);
      await play('0', 'Motion[1]'); await frames(3);
      check(!evr(310).includes('r'), 'and after a full hold, stopped off it', evr(310));
    } }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckMizutsune;
export const args = [['em082_00', 'Mizutsune', 'em082_00u', false],
                     ['em082_04', 'Soulseer Mizutsune', 'em082_04u', true]];
