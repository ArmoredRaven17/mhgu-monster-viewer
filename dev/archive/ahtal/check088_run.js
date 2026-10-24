// Ahtal-Ka's page check, loaded by dev/motion-states-check.mjs from dev/checks/. The function is serialised with
// .toString() and evaluated IN THE PAGE, so it must not close over anything in this module.
// AHTAL-KA (em088_00): C:/MHGU-RE/offline/decode/notes/states-em088_00.md (uEm088_00, vtable 0x1804328; status-10
// dispatcher 0x10bf668, death 0x10bfc4c, part pass 0x10b7288).
// WHAT IS ASSERTED:
//   TWO CLIPS ARE COPIED (CLIP_VARIANTS; Raven, 2026-10-15: "replicate a shared animation and use one of the shared
//   effects for each animation"): L3 M16 A = the sleep hold's zzz c 1102, B = the stun's held c 1103; L3 M9 A = the
//   exhaust's c 1109 once, B = the (10, 7) reaction of the FACE (set 1 -> 2, u 1001) and the HEAD (set 3 -> 4, u 1010).
//   L3 M2 is the TAIL (5 -> 6, u 1006) and the CLAWS, one part with two rows: level 2 = set 10 beside 7 (u 1016),
//   level 3 = sets 8 + 10 (u 1017), shown at level 3 once the Left Claw row is Broken.
//   NO RAGE PUFF (e+0xb7d2 = 0 at 0x10b32b0): the roar L0 M4 shows rage and no puff comes. HE TIRES: L0 M13 + c 1104.
//   NO LID, NO TRAP, NO SEVER: no eye set in his .mpm, no c 1105, no CUT_TAIL.
// RECORDS THIS NEEDS EXPORTED (add_effects.py em088_00 --states): u 1006 / 1010 / 1016 / 1017 -- until then the break
// rows fire records the schedule does not hold, and the checks naming them fail.
// AND HIS RECORDER PASS: the category survey's soak refuses 29 of his 49 bound motions (dev/carapaceons-neopterons-
// effects-survey.md), L3 M2 / M19 / M23 among them, and the first refusal stops every effect of the monster -- so the
// `fx.failed` check and the records after it fail until --record / --check clears 0x44158 -> 0x441cc, 0xaf859c and
// 0x9bbb4c mode 3. That is the effects lane's, not this table's.
async function pageCheckAhtalKa(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Ahtal-Ka: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em088_00', U = 'em088_00u', C = 'em088_00c';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'the effect runtime is up');
  const fx = rt(), S = fx.schedule;
  const fired = [];
  const f0 = fx.schedule.fire.bind(fx.schedule); fx.schedule.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  const puffs = [];
  const s0 = S.start.bind(S);
  S.start = e => { if (e.when === 'ragePuff') puffs.push({ key: e.def.record.key, step: S.frame }); return s0(e); };
  const hasEvent = (pel, key) => S.entries.some(e => e.when === 'event' && e.def.record && e.def.record.pel === pel && e.def.record.key === key);
  for (const [pel, key] of [[C, 1101], [C, 1102], [C, 1103], [C, 1104], [C, 1109], [U, 1001]])
    check(hasEvent(pel, key), 'the schedule holds the state record ' + pel + ' ' + key);
  for (const key of [1006, 1010, 1016, 1017])
    check(hasEvent(U, key), 'the schedule holds the break record u ' + key + ' (exported by add_effects.py --states)');
  check(!MS.RAGE_PUFF[MON], 'NO RAGE_PUFF entry: vt+0x1d8 writes e+0xb7d2 = 0 (0x10b32b0)', MS.RAGE_PUFF[MON]);
  check(JSON.stringify(MS.TIRED_DROOL[MON]) === JSON.stringify([C, 1104]),
        'TIRED_DROOL is c 1104: P+0x1a8 bits 0 + 6, tired timer 3000, e+0xb7d3 untouched', MS.TIRED_DROOL[MON]);
  check(!TO.CUT_TAIL[MON], 'NO cut tail: no dtt second counter, no 0xc2274 in his code', TO.CUT_TAIL[MON]);
  const T = MS.MOTION_STATES[MON];
  check(T && !JSON.stringify(T).includes('1105') && !JSON.stringify(T).includes('"sets"'),
        'no shock-trap row (no c 1105; (10, 0x6e) falls to the idle chooser) and no lid set anywhere');
  check(JSON.stringify(MS.CLIP_VARIANTS[MON]) === JSON.stringify({ '3|Motion[16]': ['A', 'B'], '3|Motion[9]': ['A', 'B'] }),
        'CLIP_VARIANTS copies L3 M16 and L3 M9', MS.CLIP_VARIANTS[MON]);

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
  // THE TWO CLOCKS: `every:` countdowns run in CLIP frames, the drool in SCHEDULE steps
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[2]'];         // the combat idle (0, 1): no table entry
  // L0 M1 (the plain idle, no table entry) -- NOT L3 M1, the (10, 7) clip of parts 4 / 5 / 6: the survey's soak refuses
  // L3 M1 (0x44158 -> 0x441cc), and a refusal stops every effect of the monster until reload
  const LAND = ['0', 'Motion[1]'];
  const rounds = async (n, go, settle = 3) => {
    const seen = [];
    for (let i = 0; i < n; i++){
      await play(LAND[0], LAND[1]); await frames(2);
      fired.length = 0;
      await go(); await frames(settle);
      seen.push({ fired: fired.slice(), d: drawn() });
    }
    return seen;
  };
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const FACE = '2,3', HEAD = '10,11', TAIL = '8,9', LCLAW = '4,5', RCLAW = '6,7';
  V.state.loop = true;

  // THE CARRIED OBJECT (render/monster.js HELD_PROP; psl-mask.js em088_00 / em088CarryAt; dev/em088_00-effects-spec.md
  // 1.1, dev/em088-shells-props-spec.md 1b). Raven, 2026-10-15: "Yes, build the Carrying control and u 120 / u 130".
  const PM = await import('/render/psl-mask.js');
  const SK = await import('/render/skeleton.js');
  const carryRow = document.getElementById('monCarryRow'), carrySel = document.getElementById('monCarry');
  check(carryRow && !carryRow.hidden && same([...carrySel.options].map(o => [o.value, o.textContent]),
        [['4', 'Nothing'], ['0', 'Pole'], ['1', 'Wheel'], ['2', 'Frame']]) && carrySel.value === '4' && V.state.carry === 4,
        'the Carrying control: Nothing (4, the ctor value 0x10b2e3c) / Pole (0) / Wheel (1) / Frame (2), Nothing by default',
        carrySel && [...carrySel.options].map(o => o.value + ' ' + o.textContent));
  const setCarry = async v => { carrySel.value = String(v); await carrySel.onchange({ target: carrySel }); await frames(4); };
  const heldNow = () => V.world.children.find(o => o.userData && o.userData.heldProp) || null;
  const j130 = SK.gidBonesOf(V.mounted.main).find(b => b.gid === 130);
  const onJoint = p => { const a = new V.world.position.constructor().setFromMatrixPosition(p.matrixWorld);
                         const b = new V.world.position.constructor().setFromMatrixPosition(j130.node.matrixWorld);
                         return a.distanceTo(b) < 1e-3; };
  const mask = () => S.clip && S.clip.mask != null ? S.clip.mask >>> 0 : null;
  const CARRY = { 0: ['em087_00_rubble_01', 0x1c0000], 1: ['em087_00_rubble_02', 0xe00000], 2: ['em087_00_rubble_03', 0x38000] };
  for (const v of [0, 1, 2]){
    await setCarry(v);
    await play('2', 'Motion[4]'); await frames(6);
    const p = heldNow();
    check(p && p.visible && p.name === 'held-' + CARRY[v][0] && onJoint(p) && !V.mounted[CARRY[v][0]],
          'Carrying ' + v + ': ' + CARRY[v][0] + ' drawn on JOINT 130 (uEm088_Rubble, 0x10af348 -> 0x457c8), outside `mounted` (trap 54)',
          p && { name: p.name, visible: p.visible });
    check(mask() === (0x1ff | CARRY[v][1]), 'and the enable word on L2 M4 ORs object ' + v + '\'s group (table 0x16a37f4)',
          mask() != null ? '0x' + mask().toString(16) : null);
  }
  await setCarry(0);
  await play('3', 'Motion[14]'); await frames(6);
  check(heldNow() && !heldNow().visible && (mask() & 0xff8000) === 0,
        'Pole on L3 M14 (paralysis, (10, 0x1f)): the start drops it (0x10b4e98 -> 0x10b5f44) -- hidden, no carry bits',
        mask() != null ? '0x' + mask().toString(16) : null);
  await play('3', 'Motion[2]'); await frames(6);
  check(heldNow() && heldNow().visible && (mask() & 0xff8000) === 0x1c0000,
        'Pole on L3 M2 (the break reaction (10, 7)): kept -- shown, bits 18-20', mask() != null ? '0x' + mask().toString(16) : null);
  await play('3', 'Motion[19]'); await frames(6);
  check(heldNow() && !heldNow().visible, 'Pole on L3 M19 (death, (11, *)): dropped -- hidden');
  await play('2', 'Motion[4]'); await frames(6);
  check(heldNow() && heldNow().visible, 'and back on L2 M4 the choice shows again');
  await setCarry(4);
  await play('2', 'Motion[4]'); await frames(6);
  check(!heldNow() && mask() === 0x1ff, 'Nothing: no piece, no carry bits (0x1ff calm)', mask() != null ? '0x' + mask().toString(16) : null);
  const W = (motion, action, carry) => PM.pslMask(MON, String(motion >> 8), motion & 0xff, action, { carry: PM.em088CarryAt(action, carry) });
  check(W(0x21e, [1, 0x1c], 1) === 0x8e001ff && W(0x21e, [1, 0x25], 2) === 0x100381ff && W(0x305, [10, 0xaf], 0) === 0x70001ff &&
        W(0x211, [2, 0x0f], 0) === 0x1c01ff && W(0x211, [7, 0x10], 0) === 0x1ff,
        'the words: L2 M30 (1, 0x1c) object 1 0x8e001ff, (1, 0x25) object 2 0x100381ff, L3 M5 (10, 0xaf) 0x70001ff (dropped), ' +
        'L2 M17 (2, 0xf) keeps the object, the throw (7, 0x10) drops it');

  // u 120 / u 130 (vt+0x208 0x10b7644; render/motion-states.js CLASS_HOLD_OFF): u 120 held from the start (`always`), u 130
  // while enraged (`rage`), both stopped gracefully (`stop: request`) on L2 M28 and on death. RECORD THEM FIRST: until
  // --record / lift, u 130 refuses 0x9bbb4c (node transform mode 3) and stops the runtime the moment rage comes on.
  const cls = key => S.entries.find(e => e.def.record && e.def.record.pel === U && e.def.record.key === key && e.def.record.index != null
                                         && (e.when === 'always' || e.when === 'rage'));
  const liveOf = key => { const e = cls(key); return e ? e.requests.filter(q => !q.stopped).length : -1; };
  check(cls(120) && cls(120).when === 'always' && cls(120).def.stop === 'request' && cls(130) && cls(130).when === 'rage' && cls(130).def.stop === 'request',
        'u 120 is exported `always` and u 130 `rage`, both `stop: request` (em088_00_012, UNIQUE)');
  await play(REST[0], REST[1]); await frames(6);
  check(liveOf(120) === 1 && liveOf(130) === 0, 'calm, at rest: u 120 held, u 130 not', [liveOf(120), liveOf(130)]);
  await play('2', 'Motion[28]'); await frames(6);
  check(liveOf(120) === 0, 'L2 M28: u 120 stopped (0x10b76a8)', liveOf(120));
  await play(REST[0], REST[1]); await frames(6);
  check(liveOf(120) === 1, 'off L2 M28: u 120 requested again', liveOf(120));

  for (const r of [FACE, HEAD, TAIL, LCLAW, RCLAW]) await pick(r, 'Intact');
  await play(REST[0], REST[1]); await frames(3);
  check(allSets(drawn(), [1, 3, 5, 7, 9]), 'at rest, every part intact: sets 1 / 3 / 5 / 7 / 9', drawn());

  // L3 M9 COPY A: the exhaust status alone
  const m9a = await rounds(2, () => play('3', 'Motion[9]'));
  check(m9a.every(x => same(x.fired, [1109]) && allSets(x.d, [1, 3])),
        'L3 Motion[9] copy A ((10, 0x1b), INFERRED exhaust): c 1109 once at frame 0 on every play, no part changes', m9a.map(x => x.fired));
  // L3 M9 COPY B: the Face and the Head, each play the next
  const m9b = await rounds(2, () => playCopy('3', 'Motion[9]', 'B'));
  check(m9b.some(x => same(x.fired, [1001]) && isSet(x.d, 2) && isSet(x.d, 3)),
        'L3 Motion[9] copy B: the FACE at level 2 -- set 1 -> 2 -- and u 1001 on JOINT 1', m9b.map(x => x.fired));
  check(m9b.some(x => same(x.fired, [1010]) && isSet(x.d, 4) && isSet(x.d, 1)),
        'and the HEAD at level 1 -- set 3 -> 4 -- and u 1010 on JOINT 1', m9b.map(x => x.fired));
  check(m9b.every(x => !x.fired.includes(1109)), 'copy B never fires the exhaust\'s c 1109', m9b.map(x => x.fired));

  // L3 M2: the tail and the claws
  const m2 = await rounds(2, () => play('3', 'Motion[2]'));
  check(m2.some(x => same(x.fired, [1006]) && isSet(x.d, 6)),
        'L3 Motion[2] ((10, 7) part 1): the TAIL at level 2 -- set 5 -> 6 -- and u 1006 on JOINT 144', m2.map(x => x.fired));
  check(m2.some(x => same(x.fired, [1016]) && allSets(x.d, [7, 10])),
        '(10, 7) part 3: the CLAWS at level 2 -- set 9 -> 10, set 7 kept -- and u 1016 on JOINT 3', m2.map(x => x.fired));
  check(await pick(LCLAW, 'Broken'), 'the Left Claw row set to Broken');
  const m2b = await rounds(2, () => play('3', 'Motion[2]'));
  check(m2b.some(x => same(x.fired, [1017]) && allSets(x.d, [8, 10])),
        'and at the user\'s Left Claw Broken: the claws at LEVEL 3 -- sets 8 + 10 -- and u 1017', m2b.map(x => x.fired));
  await pick(LCLAW, 'Intact');
  await play(REST[0], REST[1]); await frames(3);
  check(allSets(drawn(), [1, 3, 5, 7, 9]), 'off the break clips the user\'s intact parts come back', drawn());

  // RAGE: L0 M4, no mesh change, no puff
  const before = drawn();
  puffs.length = 0;
  await play('0', 'Motion[4]'); await steps(70);
  check(S.rage === true && same(drawn(), before), 'L0 Motion[4] ((1, 1), the rage roar): rage on, NOT ONE part changes',
        { rage: S.rage, d: drawn() });
  check(puffs.length === 0, 'and NO puff in 70 steps: his class switched the shared puff off', puffs);

  // TIRED
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[13]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[13] (the tired idle (0, 2)): rage off and the drool c 1104 at once', { rage: S.rage, fired });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'and the drool again 48 on', fired);

  // L3 M16 COPY A: asleep
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('3', 'Motion[16]'); await frames(3); await steps(2);
  check(count(fired, 1102) === 1 && count(fired, 1103) === 0, 'L3 Motion[16] copy A (the sleep hold): the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'and again 90 clip frames on', fired);
  // PARALYSIS
  fired.length = 0;
  await play('3', 'Motion[14]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[14] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 clip frames on', fired);
  await play(REST[0], REST[1]); await frames(6);

  // THE STUN: L3 M23 -> L3 M16 copy B -> L3 M17, one held c 1103, stopped off the chain
  for (const [clip, copy] of [['Motion[23]', ''], ['Motion[16]', 'B'], ['Motion[17]', '']]){
    if (copy) await playCopy('3', clip, copy); else await play('3', clip);
    await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + (copy ? ' copy ' + copy : '') + ' (the stun, not sided): c 1103 held', evReqs(1103));
  }
  fired.length = 0;
  await playCopy('3', 'Motion[16]', 'B'); await frames(3); await steps(2);
  check(count(fired, 1102) === 0, 'copy B never fires the sleep\'s c 1102', fired);
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH
  await play('3', 'Motion[19]'); await frames(4);
  check(S.rage === false && allSets(drawn(), [1, 3, 5, 7, 9]),
        'L3 Motion[19] (death, every status-11 number): rage off, the parts as the user has them, no lid', { rage: S.rage, d: drawn() });
  await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(T)){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

const __r = await pageCheckAhtalKa(); return __r.map(([ok,l,d]) => (ok ? 'PASS ' : 'FAIL ') + l + (ok ? '' : '  -- ' + d));
