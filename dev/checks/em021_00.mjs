// Congalala's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER, because
// three Effects sessions run at once. The runner serialises `pageCheck` with .toString() and evaluates it IN THE
// PAGE, so it must not close over anything in this module.
// CONGALALA (em021_00): against E:/offline/decode/notes/states-em021_00.md. Three things are his alone and this
// check is built around them.
// HIS RAGE MOVES NO MESH AT ALL -- it is a material animation on one nose material and nothing else, so the rage
// row carries no sets and the whole of it lives in ROM_STAGE_CLIPS. The absence of sets is a finding, and a later
// reader must not be able to mistake it for an omission, so it is asserted from both ends: no sets in the table,
// and a real ROM_STAGE_CLIPS entry that does carry the change.
// HIS THREE BREAKS SHARE THEIR CLIPS WITH THE STUN -- L3 M10 and M11 are the two stun chain HEADS as well as the
// two arm breaks, so the held handle starts on the SECOND clip of each chain and the heads carry levels instead.
// AND THE ITEM AT HIS TAIL TIP IS NOT A MOTION STATE: a stage-keyed weighted random the viewer has no stage to
// seed, so it is written down in the table's comment and nothing here drives it. Asserted as an absence.
async function pageCheckCongalala(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Congalala: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em021_00';
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
  // EIGHT event records: u 1001 / 1011 / 1016 (the three breaks) and c 1109 / 1103 / 1104 / 1102 / 1101. NOT c 1105
  // -- the shock trap shares the paralysis hold, so the table never names it and it is not exported. And NOT the
  // pitfall's c 1700 / 1701 / 1702, which are real records his class remaps through vtable +0x1cc and which the
  // viewer has no pitfall state to ask for.
  // [2026-10-17: the trap IS wired now -- CLIP_VARIANTS em021_00 L3 M6 copy B (TRAP_B) -- and the shared blast / notice / water
  // records are exported, so the count is no longer 8: the named ones, the trap, no pitfall id]
  const evKeys = S.entries.filter(e => e.when === 'event').map(e => e.def.record.key);
  check([1001, 1011, 1016, 1109, 1103, 1104, 1102, 1101, 1105].every(k => evKeys.includes(k)) && byWhen.ragePuff === 2,
        'the schedule holds his state records: the three breaks, the ailments, the shock trap c 1105, and 2 ragePuff', byWhen);
  check(!S.entries.some(e => [1700, 1701, 1702].includes(e.def.record.key)),
        'and none of the pitfall ids c 1700..1702 is in the schedule under any name',
        S.entries.map(e => e.def.record.key));
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
  // TWO CLOCKS: the puff counts SCHEDULE frames, motion-states' `every` timers count CLIP frames, and the pose
  // advances one clip frame per two schedule steps on this harness.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 40 * n + 400); };
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[19]'];
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 3) && isSet(user0, 5) && isSet(user0, 7),
        'at rest: head, +X arm and -X arm all intact (sets 3, 5, 7)', user0);

  // THE HEAD, and its clip CYCLES two ways: L3 Motion[2] is the head break, EVERY odd-level depletion on parts
  // 1..6 (which show nothing at all), and the tune+0x44 exhaust status.
  const head = MS.MOTION_STATES[MON]['3|Motion[2]'];
  check(head && Array.isArray(head.cycle) && head.cycle.length === 2 &&
        same(head.cycle[0].levels, [[3], [3], [4]]) && same(head.cycle[0].fire[2], ['em021_00u', 1001]) &&
        same(head.cycle[1].start, [['em021_00c', 1109]]),
        'L3 Motion[2] CYCLES: the head break (set 4, u 1001 at level 2) and the exhaust status c 1109',
        head && head.cycle && head.cycle.length);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3); await steps(2);
  check(fired.length === 0 && isSet(drawn(), 3),
        'the first play is the head at its default level: set 3 kept, NOTHING fired -- level 1 shows nothing',
        { fired, d: drawn() });

  // THE TWO ARMS, on the two clips that are ALSO the two stun chain heads.
  const armX = MS.MOTION_STATES[MON]['3|Motion[10]'], armN = MS.MOTION_STATES[MON]['3|Motion[11]'];
  check(armX && same(armX.levels, [[5], [5], [6]]) && same(armX.fire[2], ['em021_00u', 1011]) &&
        armX.fire[0] === null && armX.fire[1] === null,
        'L3 Motion[10] (the +X arm): set 6 and u 1011 on JOINT 8, at level 2 only', armX && armX.levels);
  check(armN && same(armN.levels, [[7], [7], [8]]) && same(armN.fire[2], ['em021_00u', 1016]) &&
        armN.fire[0] === null && armN.fire[1] === null,
        'L3 Motion[11] (the -X arm): set 8 and u 1016 on JOINT 12, at level 2 only', armN && armN.levels);
  check(!armX.hold && !armN.hold,
        'and NEITHER chain head carries the stun handle -- the break is what the ROM applies on those two clips');

  // THE STUN, sided, FOUR clips across two chains and ONE held handle.
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const m of ['Motion[4]', 'Motion[5]', 'Motion[17]', 'Motion[18]']){
    await play('3', m); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + m + ' (a stun hold or recovery): c 1103 held', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off both chains it is stopped', evReqs(1103));
  check(MS.MOTION_STATES[MON]['3|Motion[4]'].hold && MS.MOTION_STATES[MON]['3|Motion[18]'].hold,
        'both chains hold the SAME record, so direction 2 and everything else show the same thing');

  // RAGE: no mesh, no sets -- a MATERIAL animation, and the check says so from both ends.
  puffs.length = 0;
  await play('0', 'Motion[20]'); await steps(95);
  check(S.rage === true && same(drawn(), user0),
        'L0 Motion[20]: rage on, and NOTHING on the mesh changes', { rage: S.rage, d: drawn() });
  check(!MS.MOTION_STATES[MON]['0|Motion[20]'].sets && !MS.RAGE_PARTS[MON],
        'the rage row carries NO sets and he has no RAGE_PARTS entry -- the absence is the finding',
        MS.MOTION_STATES[MON]['0|Motion[20]']);
  const SC = M.ROM_STAGE_CLIPS[MON];
  check(SC && same(SC.mats, ['XfB_N__E_m01_nose']) && same(SC.clips, ['angry_Change', 'angry_Loop', 'angry_End']) &&
        SC.under === 'angry_Loop',
        'and ROM_STAGE_CLIPS carries the whole of it: the nose material through angry_Change/Loop/End', SC);
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every request is u 1121', puffs.map(p => p.key));
  await play(REST[0], REST[1]); await frames(3);
  const nAfter = puffs.length; await steps(70);
  check(S.rage === false && puffs.length === nAfter, 'another motion, the user calm: rage off, no more puffs', { rage: S.rage });

  // TIRED -- his own clip, not the combat idle.
  fired.length = 0;
  await play('0', 'Motion[40]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[40] (tired, his own 5.85 s clip): drool c 1104 at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 CLIP frames on', fired);

  // ASLEEP -- set 2 -> set 1, all three clips of the chain.
  await play('0', 'Motion[17]'); await frames(4);
  check(isSet(drawn(), 1), 'L0 Motion[17] (lying down): the eyes close (set 1)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[15]'); await frames(4); await steps(2);
  check(isSet(drawn(), 1) && count(fired, 1102) === 1, 'L0 Motion[15] (the sleep hold): eyes closed and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'and again 90 CLIP frames on', fired);
  check(puffs.length === 0, 'the puff is PAUSED in the sleep hold', puffs.length);
  await play('0', 'Motion[16]'); await frames(4);
  check(isSet(drawn(), 1), 'L0 Motion[16] (getting up): the eyes are still closed through it', drawn());

  // PARALYSIS, which is also where the shock trap is shown.
  fired.length = 0;
  await play('3', 'Motion[6]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[6] (paralysed, and the shock trap hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 CLIP frames on', fired);

  // DEATH -- two chains plus the (11, 4) route, and the breaks stay because the part pass re-applies them.
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  for (const m of ['Motion[9]', 'Motion[12]', 'Motion[7]', 'Motion[8]']){
    await play('3', m); await frames(4);
    check(S.rage === false, 'L3 ' + m + ' (death): the rage shown goes off even with the user enraged', { rage: S.rage });
  }
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  await play(REST[0], REST[1]); await frames(3);

  // THE ITEM AND THE GAS TYPE: both are real ROM state and NEITHER is a motion state. Asserted as absences so the
  // next reader does not go looking for a row that was deliberately not written.
  check(!Object.keys(MS.MOTION_STATES[MON]).some(k => {
          const e = MS.MOTION_STATES[MON][k];
          return (e.sets || []).some(n => n >= 11) || (e.levels || []).some(l => (l || []).some(n => n >= 11));
        }),
        'NO row drives the tail-tip item: its six meshes are a stage-keyed weighted random the viewer cannot seed');
  check(!TO.CUT_TAIL[MON], 'and he has no cut tail entry -- his tail does not sever', Object.keys(TO.CUT_TAIL));

  // THE ENABLE WORD (psl-mask.js em021_00; dev/em021_00-effects-spec.md): uEm021_00 vt+0x13c = 0xdd7cf4, read whole and run
  // 44800 times against the ROM. The gas picks ONE of four different records, the item / eating number one of c 150..153.
  const PM = await import('/render/psl-mask.js');
  check(PM.PSL_MASK_MONSTERS.includes(MON) && PM.CLIP_ACTIONS[MON], 'he is listed: his clip effects follow the enable word');
  const Wd = (list, slot, action, st) => PM.pslMask(MON, String(list), slot, action, st || {});
  const WORDS = [
    [2, 16, [7, 0x34], { gas: 1 }, 0x181ff, 'L2 M16 gas 1: bits 15-16 (u 200)'], [2, 16, [7, 0x34], { gas: 2 }, 0x1801ff, 'gas 2: 19-20 (u 202)'],
    [2, 16, [7, 0x34], { gas: 3 }, 0x601ff, 'gas 3: 17-18 (u 201)'], [2, 16, [7, 0x34], { gas: 4 }, 0x6001ff, 'gas 4: 21-22 (u 203)'],
    [2, 16, [7, 0x34], { gas: 0 }, 0x1ff, 'no gas: none'],
    [0, 43, [1, 0x42], { gas: PM.em021Gas([1, 0x42], 0) }, 0x1801ff, 'L0 M43 (1, 0x42): its start sets gas 2 -> u 262'],
    [0, 25, [1, 0x35], { item: 0 }, 0x181ff, 'L0 M25 (1, 0x35), nothing at the tail: by the number, c 150'],
    [0, 25, [1, 0x0b], { item: 0 }, 0x1801ff, '(1, 0x0b): c 152'], [0, 25, [1, 0x0b], { item: 3 }, 0x6001ff, 'item 3 at the tail: c 153'],
    [0, 25, [1, 0x0b], { item: 1 }, 0x1ff, 'the bone (item 1): none'],
    [0, 28, [1, 9], {}, 0x180001ff, 'L0 M28 (1, 9): c 120'], [0, 28, [7, 0x37], {}, 0x1ff, '(7, 0x37): none'],
    [2, 2, [7, 1], {}, 0x60001ff, 'L2 M2 (7, 1): u 281'], [2, 2, [7, 0], {}, 0x18001ff, '(7, 0): u 280 (its b23 form)'],
    [3, 15, [11, 7], {}, 0x180001ff, 'L3 M15 the pit death: c 3001'], [3, 15, [10, 0x63], { asleep: true }, 0x600001ff, 'the pit sleep: c 50'],
    [3, 15, [10, 0x65], {}, 0x1ff, 'the pit paralysis: none'],
  ];
  for (const [l, s, a, st, want, label] of WORDS){ const w = Wd(l, s, a, st); check(w === want, 'the word: ' + label, '0x' + (w >>> 0).toString(16)); }
  check(PM.em021Item(new Map([[13, true], [17, true]])) === 5 && PM.em021Item(new Map([[11, true]])) === 0,
        'the Item row as ctl[0]: the stalk with mushroom 17 is item 5, the empty tail item 0');
  const mask = () => S.clip && S.clip.mask != null ? S.clip.mask >>> 0 : null;
  await play(REST[0], REST[1]); await frames(3);
  // the breath reads the Gas Type control (CLASS_CONTROLS em021_00, ctl[1]; approved 2026-10-19 -- was a per-play cycle)
  const g16 = [], gsel = document.getElementById('monClassCtl');
  check(!document.getElementById('monClassCtlRow').hidden && [...gsel.options].map(o => +o.value).join() === '0,1,2,3,4',
        'the Gas Type row is shown with None and Gas 1..4', [...gsel.options].map(o => o.value));
  for (const g of [1, 2, 3, 4, 0]){
    gsel.value = String(g); gsel.onchange({ target: gsel }); await frames(2);
    await play(REST[0], REST[1]); await frames(2); await play('2', 'Motion[16]'); await frames(6); g16.push(mask());
  }
  check(same(g16, [0x181ff, 0x1801ff, 0x601ff, 0x6001ff, 0x1ff]), 'played: L2 M16 under Gas Type 1..4 shows each gas, None none',
        g16.map(w => w == null ? null : '0x' + w.toString(16)));
  await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');   // a copy's row ('#B') is its clip's
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckCongalala;
