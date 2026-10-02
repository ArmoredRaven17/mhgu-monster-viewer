// The Uragaan family's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE, TWO
// MONSTERS: there is no `uEm045_04` -- getDTI 0xe9cd98 appears exactly once in main.data -- so all 0x480 slots
// hold the same function for both and the override diff is empty in BOTH directions. The function is serialised
// with .toString() and evaluated IN THE PAGE, so it must not close over anything in this module.
// URAGAAN / CRYSTALBEARD (em045_00, em045_04): E:/offline/decode/notes/states-em045_00.md.
// CRYSTALBEARD'S BEARD IS A SEVER, NOT A BREAK, and that is what this check is mostly for. He has no chin .dtp
// row at all; instead `.dtt` part 0 carries a second counter whose `+0x230` returns 1 unconditionally, and
// `0xc2274(e, slot 1, kind 4)` sets `P+0x3b4` BIT 1 -- which the part pass reads where Uragaan's reads a break
// level, driving the same sets 3 -> 4 either way. He fires u 901 where Uragaan fires u 1001, and `em045_04u` has
// no key 1001 at all: both halves are asserted.
// AND THEIR TAILS REACH THE MIDDLE RUNG AT DIFFERENT LEVELS -- Uragaan breaks at 1 and severs from >= 1,
// Crystalbeard breaks at 2 and severs from >= 2 -- so his ladder repeats the intact rung once more.
async function pageCheckUragaan(MON, NAME, U, DEVIANT){
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
  check(DEVIANT ? (keys.includes(901) && !keys.includes(1001) && keys.includes(1031))
                : (keys.includes(1001) && !keys.includes(901) && keys.includes(1030)),
        DEVIANT ? 'u 901 (the BEARD sever) is there, u 1001 is NOT -- em045_04u has no such key -- and his tail ' +
                  'break is u 1031, not u 1030'
                : 'u 1001 (the CHIN break) is there and u 901 is not: only Crystalbeard has a beard to lose', keys);
  const pels = {};
  for (const e of S.entries) if (e.def.record) pels[e.def.record.pel] = (pels[e.def.record.pel] || 0) + 1;
  check(pels['em045_00c'] > 0 && pels[U] > 0 && !pels['em045_04c'],
        'the ailments come from em045_00c -- 374 arc blobs shared, none differing, and there is no em045_04c.pel ' +
        '-- and the breaks from ' + U, pels);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick() === 0 && P.joint === 3 && P.records.every(r => r[0] === U),
        'his puff is the stub shape on JOINT 3 at scale 1.5', { joint: P && P.joint });
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === (DEVIANT ? 144 : 142),
        'his cut tail is on joint ' + (DEVIANT ? 144 : 142), TO.CUT_TAIL[MON]);
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
  // THE TWO CLOCKS: `every:` countdowns run in CLIP frames, the puff's cadence in SCHEDULE frames.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[2]'];         // his combat idle: no table entry
  const LAND = ['3', 'Motion[2]'];         // the neck / foreleg flinch: no table entry, shows nothing
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

  // L3 M1: the chin (or the beard) and the exhaust status
  const m1 = await rounds('3', 'Motion[1]', 2);
  check(m1.some(x => same(x.fired, [DEVIANT ? 901 : 1001]) && isSet(x.d, 4)),
        DEVIANT ? 'L3 Motion[1] shows the BEARD SEVERED: set 3 -> 4 and u 901 on JOINT 4 -- the same sets a chin ' +
                  'break gives Uragaan, driven by P+0x3b4 bit 1 instead of a break level'
                : 'L3 Motion[1] shows the CHIN at LEVEL 2: set 3 -> 4 (group 1 off, the 56-vertex jaw) and u 1001 ' +
                  'on JOINT 4', m1.map(x => x.fired));
  check(m1.some(x => same(x.fired, [1109])), 'and its other play the tune+0x44 status: c 1109 once', m1.map(x => x.fired));

  // L3 M7: the back and the shock trap
  const m7 = await rounds('3', 'Motion[7]', 2);
  check(m7.some(x => same(x.fired, [1010]) && isSet(x.d, 6)),
        'L3 Motion[7] shows the BACK at level 1: set 5 -> 6 (the mineral coat, 199 vertices) and u 1010 on JOINT 0',
        m7.map(x => x.fired));
  check(m7.some(x => same(x.fired, [1105])), 'and the SHOCK TRAP: c 1105 at once', m7.map(x => x.fired));

  // THE TAIL: a break rung and a sever rung on the same three-state ladder
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[20]'); await frames(3);
  check(same(fired, [DEVIANT ? 1031 : 1030]) && isSet(drawn(), 8),
        'L3 Motion[20]: the tail BROKEN -- set 7 -> 8 -- and u ' + (DEVIANT ? '1031 on JOINT 143' : '1030 on JOINT 142'),
        { fired, d: drawn() });
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[19]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 9),
        'L3 Motion[19]: the tail SEVERED -- set 9, the club and its danmen gone for a 52-vertex stump -- and u 900. ' +
        'The sever is GATED on the tail already being at ' + (DEVIANT ? 'level >= 2' : 'level >= 1'), { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));

  // RAGE: nothing at all on the model -- read, not assumed: the class never calls 0x81670 or 0x816b8
  await play(REST[0], REST[1]); await frames(3);
  const before = drawn();
  puffs.length = 0;
  await play('0', 'Motion[11]'); await steps(95);
  check(S.rage === true && same(drawn(), before),
        'L0 Motion[11] ((1, 2), the rage entry -- and also the common recovery clip): rage on and NOT ONE part ' +
        'changes. A scan of the whole class finds no call to 0x81670 or 0x816b8 and no material call at all',
        { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is u 1121', puffs.map(p => p.key));

  // TIRED
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[10]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[10] (the tired idle, a clip of its own -- (0,1) is L0 Motion[2] and (0,0) is L0 Motion[1]): ' +
        'rage off and the drool c 1104 at once', { rage: S.rage, fired });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'and the drool again 48 clip frames on', fired);

  // ASLEEP, PARALYSIS, the STUN
  await play(REST[0], REST[1]); await frames(3);
  await play('3', 'Motion[9]'); await frames(3);
  check(isSet(drawn(), 1), 'L3 Motion[9] (lying down, and also capture): his eyes shut -- set 2 -> 1, a 14-vertex ' +
        'skin lid on and the 12-vertex eyeball off', drawn());
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[10]'); await frames(3); await steps(2);
  check(isSet(drawn(), 1) && count(fired, 1102) === 1, 'L3 Motion[10] (the hold): the lid stays and the zzz at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 clip frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);
  fired.length = 0;
  await play('3', 'Motion[11]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[11] (paralysed, and the trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 clip frames on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[5]', 'Motion[17]', 'Motion[6]', 'Motion[18]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'),
          'L3 ' + clip + ' (a stun chain clip -- the only sided reaction he has -- and also a hind leg\'s depletion ' +
          'chain, which has no .dtp row): c 1103 held', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chains it is stopped', evReqs(1103));

  // DEATH
  await play('3', 'Motion[8]'); await frames(4);
  check(S.rage === false, 'L3 Motion[8] (death): the rage shown goes off -- though nothing was rage-driven', { rage: S.rage });
  check(isSet(drawn(), 1),
        'and HIS EYES SHUT (set 1): his vtable +0x21c returns 0, so 0xbd594(e, -1) writes P+0x5d02 = 1 and ' +
        'P+0x5d00 = -1, and the per-frame pass skips any timer <= -1. This decode also checked Barioth\'s +0x21c ' +
        '-- the base 0x6be7c, which returns 0 too', drawn());
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

export const pageCheck = pageCheckUragaan;
export const args = [['em045_00', 'Uragaan', 'em045_00u', false],
                     ['em045_04', 'Crystalbeard Uragaan', 'em045_04u', true]];
