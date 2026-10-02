// The Tetsucabra family's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE, TWO
// MONSTERS: there is no `uEm066_04` -- getDTI 0xf6423c appears exactly once in main.data -- so all 0x480 slots
// hold the same function for both and the override diff is empty in BOTH directions. The function is serialised
// with .toString() and evaluated IN THE PAGE, so it must not close over anything in this module.
// TETSUCABRA / DRILLTUSK (em066_00, em066_04): E:/offline/decode/notes/states-em066_00.md.
// THE HELD BOULDER IS THE EFFECTS HALF OF A SHELL and it is the row this check exists for: `vtable +0x204` raises
// `P+0x1bb` bit 0 and requests id 1001 through a CLASS-PRIVATE key table (`[0x16a06dc] = {-1, 10, 12, 50, 60}`),
// which resolves to u key 10 -- `em066_00_004` on JOINT 131, held in one handle. Drilltusk's `ctl+0x30 = 2` on
// (1, 0x52) takes key 12 instead, a rock 2.3x as wide. The same .efl FILE is also SEQUENCE key 440, but key 10
// itself is in UNIQUE alone in both pels, so it resolves without naming an array -- checked in the pel, not
// assumed from the note.
// HIS `vtable +0x23c` IS THE TAIL'S PARITY ALONE (`posture == 0 && part == 6 && !(breakLevel(6) & 1)`), and the
// tail has no .dtp row, so the (10, 0x14) it earns shows nothing. Every part that does break takes (10, 7) on any
// depletion, which is why every break row keeps `at: 1`.
async function pageCheckTetsucabra(MON, NAME, U, DEVIANT){
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
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(keys.includes(10) && keys.includes(12) === !!DEVIANT,
        DEVIANT ? 'both boulders are in the schedule: u 10 and u 12, his wide rock -- key 12 exists only in ' +
                  'em066_04u, in UNIQUE alone'
                : 'the boulder u 10 is in the schedule and u 12 is not: only Drilltusk has the wide rock',
        keys.filter(k => k < 100));
  const pels = {};
  for (const e of S.entries) if (e.def.record) pels[e.def.record.pel] = (pels[e.def.record.pel] || 0) + 1;
  check(pels['em066_00c'] > 0 && pels[U] > 0 && !pels['em066_04c'],
        'the ailments come from em066_00c -- 388 arc paths shared, none differing, and there is no em066_04c.pel ' +
        '-- and the breaks and the boulder from ' + U, pels);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick() === 0 && P.joint === 4 && P.records.every(r => r[0] === U),
        'his puff is the stub shape on JOINT 4, at (0, 50, 180) and scale (0.4, 0.9, 0.9) -- the first non-uniform ' +
        'puff scale decoded', { joint: P && P.joint });
  check(!TO.CUT_TAIL[MON],
        'and NO cut tail: no dtt second counter, no 0xc2274 in the class, no option model, no capsule mask 0x0001 ' +
        'and -1 in the descriptor\'s word[1] -- four independent reads', TO.CUT_TAIL[MON]);
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
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[1]'];
  const LAND = ['3', 'Motion[16]'];        // the common recovery clip -- (10, 0x2a) / (10, 0x2b) / (10, 0x70)
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

  // L3 M2: the TUSKS' two rungs, the shock trap and the exhaust status
  const m2 = await rounds('3', 'Motion[2]', 3);
  check(m2.some(x => same(x.fired, [1000]) && isSet(x.d, 4)),
        'L3 Motion[2] shows the TUSKS at level 1: set 3 -> 4 and u 1000 on JOINT 132 at (70, 30, 240) -- one tusk',
        m2.map(x => x.fired));
  check(m2.some(x => same(x.fired, [1105])), 'and the SHOCK TRAP: c 1105 at once', m2.map(x => x.fired));
  check(m2.some(x => same(x.fired, [1109])), 'and the tune+0x44 status: c 1109 once', m2.map(x => x.fired));

  // THE BACK and the two hind legs
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1005]) && isSet(drawn(), 11),
        'L3 Motion[1]: the BACK at level 1 -- set 10 -> 11 -- and u 1005 on joint 2. This clip is also the tail\'s ' +
        'odd-level flinch and the held rock\'s own depletion, neither of which shows anything', { fired, d: drawn() });
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[4]'); await frames(3);
  check(same(fired, [1020]) && isSet(drawn(), 7),
        'L3 Motion[4]: the +X HIND LEG at level 1 -- set 6 -> 7 -- and u 1020 on JOINT 16', { fired, d: drawn() });
  const m3 = await rounds('3', 'Motion[3]', 2);
  check(m3.some(x => same(x.fired, [1025]) && isSet(x.d, 9)),
        'L3 Motion[3]: the -X HIND LEG -- set 8 -> 9 -- and u 1025 on JOINT 20. Its other hat is the stun',
        m3.map(x => x.fired));

  // THE DIG, and the boulder
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play(REST[0], REST[1]); await frames(3);
  await play('4', 'Motion[9]'); await frames(4);
  check(isSet(drawn(), 13),
        'L4 Motion[9] (a dig): set 12 -> 13 -- the 124-vertex XfB_N_0__m01_tail overlay stops drawing. The JOINT ' +
        'SCALE half of the same state (joint 203 to 1.6x, joint 202 to 0.3) is NOT wired: JOINT_SCALE\'s `while` ' +
        'has only rage and alive, and this is P+0x1bb bit 1', drawn());
  await play('4', 'Motion[11]'); await frames(4); await steps(2);
  check(isSet(drawn(), 13) && evReqs(10).includes('r'),
        'L4 Motion[11] ((1, 0x53)): he digs AND picks the rock up -- u 10 held on JOINT 131', evReqs(10));
  if (DEVIANT){
    await play('4', 'Motion[18]'); await frames(4); await steps(2);
    check(evReqs(12).includes('r'),
          'L4 Motion[18] ((1, 0x52)): HIS WIDE ROCK -- ctl+0x30 = 2 picks u 12 from the class\'s private key table ' +
          'where Tetsucabra takes 10', evReqs(12));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(10).includes('r'), 'and off the dig clips the rock is dropped', evReqs(10));

  // RAGE: nothing at all -- the class never calls 0x81670 and never reads P+0x518
  const before = drawn();
  puffs.length = 0;
  await play('0', 'Motion[4]'); await steps(95);
  check(S.rage === true && same(drawn(), before),
        'L0 Motion[4] ((1, 0x10), the rage entry): rage on and NOT ONE part changes -- the class never calls ' +
        '0x81670 and never reads P+0x518 anywhere', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is u 1121', puffs.map(p => p.key));

  // TIRED
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[14] (the tired idle, a clip of its own): rage off and the drool c 1104 at once', { rage: S.rage, fired });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'and the drool again 48 clip frames on', fired);

  // ASLEEP, PARALYSIS, the STUN
  await play(REST[0], REST[1]); await frames(3);
  await play('3', 'Motion[14]'); await frames(3);
  check(isSet(drawn(), 1), 'L3 Motion[14] (lying down, and also capture): his eyes shut -- set 2 -> 1, the 32-vertex lid', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(3); await steps(2);
  check(isSet(drawn(), 1) && count(fired, 1102) === 1,
        'L0 Motion[19] (the hold): the lid stays and the zzz at once -- on JOINT 131, the joint the boulder hangs from', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 clip frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed, and the trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 clip frames on', fired);
  for (const clip of ['Motion[5]', 'Motion[7]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain, which is also the -X hind leg\'s): c 1103 held',
          evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH
  await play('3', 'Motion[17]'); await frames(4);
  check(S.rage === false, 'L3 Motion[17] (death): the rage shown goes off', { rage: S.rage });
  check(isSet(drawn(), 1),
        'and HIS EYES SHUT (set 1): 0x75c14 calls 0xbd594(e, -1), writing P+0x5d02 = 1 and P+0x5d00 = -1, and the ' +
        '-1 makes the per-frame driver at 0xae3b4 bail for good', drawn());
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

export const pageCheck = pageCheckTetsucabra;
export const args = [['em066_00', 'Tetsucabra', 'em066_00u', false],
                     ['em066_04', 'Drilltusk Tetsucabra', 'em066_04u', true]];
