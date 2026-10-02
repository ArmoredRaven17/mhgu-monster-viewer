// Astalos's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER, because
// three Effects sessions run at once and every monster used to add its check to the one shared runner -- which
// collides, and made that file grow without bound. The runner serialises `pageCheck` with .toString() and
// evaluates it IN THE PAGE, so it must not close over anything in this module: everything it needs it imports
// inside itself (`await import('/render/monster.js')`).
// ASTALOS (em081_00): what his motions show, against E:/offline/decode/notes/states-em081_00.md. Three firsts.
// HIS RAGE CHANGES NOTHING ON HIS MODEL -- the part pass never reads isEnraged, the eye applier never reads it,
// and uEm081_00's ten material-clip call sites are all in Boltreaver's arm of the e+0xb5f5 fork -- so the puff is
// the whole of what rage shows, and this check asserts that the drawn parts are IDENTICAL across the rage
// boundary rather than asserting some pair swapped. HIS PUFF IS A SINGLE KEY: +0x2a4 is the base stub, so every
// request is u 1121 and 1120 is never asked for, which is checkable because the two records are byte-identical
// and only the key distinguishes them. AND HIS FIRST GENERATOR TYPE 15 (cParticleGeneratorPolygonStrip) runs
// here: em081_00_003's u 202 enables only its type-15 row, so if that class regressed, L2 Motion[13] / [20] /
// [47] stop and every other effect of his stops with them (live.js fail()).
async function pageCheckAstalos(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Astalos: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em081_00';
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
  check(byWhen.event === 20 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 20 event and 2 ragePuff', byWhen);
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (d, n) => (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const listOf = id => MONSTER.lists.find(l => l.id === id);
  // NO FRAME PASSES BETWEEN THE LIST CHANGE AND THE CLIP CHANGE. The clip select keeps its index across a list
  // change, so letting a frame run first plays whatever clip that index names in the new list.
  //   AND PREFER THE _loop HALF OF A PAIR. The harness loops whatever clip is SELECTED and never advances a
  // _start into its _loop, so dwelling on a short _start restarts the motion -- and its countdowns -- every few
  // frames. Astalos's L3 Motion[13] is the one that matters here: it is the paralysis hold, it is a _start/_loop
  // pair, and "c 1101 again 60 steps on" counts fires. The _loop is also the RIGHT segment to dwell in, not just
  // a workaround: it sets loopSeg, which motionStates.step treats as the motion CONTINUING rather than starting
  // over, so the countdowns advance as the ROM's do, and its frame 0 still opens the spec because both halves
  // reduce to the same base name.
  //   THREE ORDERED LOOKUPS, not one find with three disjuncts: find() walks the OPTIONS and returns the first
  // that matches ANY disjunct, so on a pair it returns whichever comes first in the list -- the _start, the very
  // clip this is avoiding. Reordering the disjuncts changes nothing. (Session A found this on Velocidrome, whose
  // 12-frame _start against a 120-frame _loop fired c 1101 six times where two were due.)
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  // TWO CLOCKS, AND THEY RUN AT DIFFERENT RATES. The rage puff counts SCHEDULE frames (schedule.js's own
  // countdown), but motion-states' `every` timers count CLIP frames -- step() advances them by
  // `frame - prev.frame`, the motion's own frame. On this harness the pose advances one clip frame per TWO
  // schedule steps (measured: 50 steps moved the tired idle 4 -> 29, 96 moved the sleep hold 5 -> 53, 66 moved
  // the paralysis hold 4 -> 37), so waiting `period + 2` schedule steps for a period-48 record waits barely half
  // of it and the second fire never comes. `steps` is for the puff; `clipSteps` is for everything with `every`.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 40 * n + 400); };
  // accumulated across the _loop's wrap: at the wrap the frame drops, so the frames since the last sample are the
  // new frame itself rather than a negative
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[1]'];
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 3) && isSet(user0, 9) && isSet(user0, 14) && isSet(user0, 20) && isSet(user0, 26) && isSet(user0, 2),
        'at rest: crest, back, both wingtalons and the tail intact (sets 3, 9, 14, 20, 26) and the eyes open (set 2)', user0);

  // THE BREAKS THAT NEED NO ROW. A break motion shows at least level 1 (motion-states step(): Math.max(spec.at || 1,
  // userLevel(...))), so a two-level ladder reaches its broken set on its own. Three of his four do.
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1005]) && isSet(drawn(), 10),
        'L3 Motion[2] (the BACK, part 1): set 9 -> 10, u 1005', { fired, d: drawn() });
  // PART FIRST, THEN DIRECTION. The status-10 dispatcher sends part 3 to the M3 chain and part 2 to the M4 chain
  // by default, and lets the hit direction swap them (0x17ed2c8 -> M3/M5/M7, 0x17ed2a0 -> M4/M6/M8). The table
  // carries that default, so -X is Motion[3] and +X is Motion[4] -- not the other way round.
  fired.length = 0;
  await play('3', 'Motion[3]'); await frames(3);
  check(same(fired, [1015]) && isSet(drawn(), 21),
        'L3 Motion[3] (the -X WINGTALON, part 3): set 20 -> 21, u 1015 on joint 133', { fired, d: drawn() });
  fired.length = 0;
  await play('3', 'Motion[4]'); await frames(3);
  check(same(fired, [1010]) && isSet(drawn(), 15),
        'L3 Motion[4] (the +X WINGTALON, part 2): set 14 -> 15, u 1010 on joint 132', { fired, d: drawn() });

  // THE CREST NEEDS TWO DEPLETIONS and level 1 shows NOTHING -- em081_00u has no key 1000 -- so at the default
  // level this motion must change no set and fire no record. That is the assertion; the level-2 half is asserted
  // off the table below, because reaching it means driving the parts row and the row is the UI session's.
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(fired.length === 0 && isSet(drawn(), 3),
        'L3 Motion[1] (the CREST) at the default level: set 3 kept and NOTHING fired -- level 1 has no record', { fired, d: drawn() });
  // THE ROW IS A CYCLE NOW: its second arm is the charged crest's discharge (u 300, gated to level 2 -- motion-states.js
  // em081_00's charge note), so the break is the FIRST arm. Read as the bare row it threw on `.levels` and stopped the
  // whole motion-states run before any later monster's page check (found 2026-09-30).
  const row = MS.MOTION_STATES[MON]['3|Motion[1]'], crest = row && (row.cycle ? row.cycle[0] : row);
  check(crest && crest.levels && crest.levels.length === 3 && same(crest.levels, [[3], [3], [4]]) &&
        crest.fire[0] === null && crest.fire[1] === null && same(crest.fire[2], ['em081_00u', 1001]),
        'and the table gives him THREE crest levels, with set 4 and u 1001 only at level 2', crest && crest.levels);

  // THE TAIL SEVER, and HE DROPS IT
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 136,
        'his cut tail is on JOINT 136 -- his sever hook passes kind 0x8a, and u 900 names that joint', TO.CUT_TAIL[MON]);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 27),
        'L3 Motion[15]: the tail severed (set 26 -> 27), u 900', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted, so `drops` has something to fly', Object.keys(V.mounted));

  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'back at rest: the parts are the user\'s again', drawn());

  // RAGE: nothing on the model at all, and the puff is the whole of what it shows
  puffs.length = 0;
  await play('0', 'Motion[4]'); await steps(95);
  check(S.rage === true && same(drawn(), user0),
        'L0 Motion[4]: rage on, and NOTHING on the model changes with it -- no RAGE_PARTS row, no material clip', { rage: S.rage, d: drawn() });
  check(!MS.RAGE_PARTS[MON], 'and he has no RAGE_PARTS entry at all', Object.keys(MS.RAGE_PARTS));
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  // THE PICK IS A STUB, so it is ALWAYS key 1121. 0x6bf64 returns 0 and schedule.js inverts (records[pick() === 1 ? 0 : 1]).
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 4 && P.period === 30 && P.pick() === 0,
        'the puff reads joint 4 every 30, and its pick is the base stub\'s 0', { joint: P && P.joint, pick: P && P.pick() });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121),
        'and EVERY request is u 1121 -- key 1120 is never asked for', puffs.map(p => p.key));
  await play(REST[0], REST[1]); await frames(3);
  const nAfter = puffs.length; await steps(70);
  check(S.rage === false && puffs.length === nAfter, 'another motion, the user calm: rage off, no more puffs', { rage: S.rage });

  // TIRED -- his tired idle is its OWN clip, unlike Barioth's
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[14] (tired): rage off, drool c 1104 at once', fired);
  // THE DROOL IS ON THE UNIT'S CLOCK, like the puff (schedule.js stepDrool, TIRED_DROOL): 0xa41b8 counts P+0x5c70 down by
  // [unit+0x1c] x 1.0 a frame (0x7206c -> 0x539d5c, s0 = 1.0 at 0xa42d8) -- the unit's frames, not the clip's -- so it is
  // waited for in schedule `steps`, not `clipSteps`. The countdown keeps its leftover across motions: only the reset
  // (0xba0f4) and rage (0xa42a8) zero it, so tiredness drools at once after rage and then every 48, not at every play.
  await steps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);

  // ASLEEP: his eyes DO shut
  await play('3', 'Motion[14]'); await frames(4);
  check(isSet(drawn(), 1), 'L3 Motion[14] (lying down): HIS EYES SHUT (set 2 -> set 1, the lid drawn)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(4); await steps(2);
  check(isSet(drawn(), 1) && count(fired, 1102) === 1, 'L0 Motion[19] (the sleep hold): eyes shut and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 CLIP frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS (the shock trap shares its hold) and the STUN, which is held rather than fired
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 CLIP frames on', fired);
  const evReqs2 = key => S.entries.filter(e => e.when === 'event' && e.def.record.pel === 'em081_00u' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play('3', 'Motion[5]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[5] (the stun hold): c 1103 held, not fired', evReqs(1103));
  // the same held handle across the whole chain -- both its hold and its recovery clip
  await play('3', 'Motion[7]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[7] (the recovery of the same chain): still held', evReqs(1103));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  await play('3', 'Motion[17]'); await frames(4);
  check(S.rage === false, 'L3 Motion[17] (death): the rage shown goes off even with the user enraged', { rage: S.rage });
  await play('3', 'Motion[12]'); await frames(4);
  check(S.rage === false, 'L3 Motion[12] (death at the end of the fall): the same', { rage: S.rage });
  await play('3', 'Motion[20]'); await frames(4);
  check(S.rage === false, 'L3 Motion[20] (death, (11, 7) / (11, 0x12)): the same', { rage: S.rage });
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  await play(REST[0], REST[1]); await frames(3);

  // HIS GENERATOR TYPE 15. These three motions are the only ones in the game so far whose effect is a
  // cParticleGeneratorPolygonStrip, and u 202's row masks enable ONLY that row -- so before the class was
  // translated the factory built no generator at all and 0x9bb320 refused, stopping every effect he has.
  for (const m of ['Motion[13]', 'Motion[20]', 'Motion[47]']){
    fired.length = 0;
    const played = await play('2', m);
    await frames(4); await steps(3);
    check(played && !fx.failed, 'L2 ' + m + ' (the type-15 PolygonStrip effect) runs without refusing', fx.failed || 'ok');
  }
  await play(REST[0], REST[1]); await frames(3);

  // THE TAIL CHARGING ARC. His charge effects are class requests, not clip bindings, so nothing in CLIP_EFFECTS
  // reaches them and the tail attacks showed nothing at all until these were wired. u 202 is the UNIQUE record --
  // em081_00_000 row mask 0x80 -- and the pel holds a DIFFERENT record under the same key in SEQUENCE
  // (em081_00_003), so this also checks the runtime picked the right one: schedule.fire matches on `when`, and
  // only the UNIQUE one is an event.
  const evOf = key => S.entries.filter(e => e.when === 'event' && e.def.record.pel === 'em081_00u' && e.def.record.key === key);
  check(evOf(202).length === 1 && /em081_00_000/.test(evOf(202)[0].def.efl),
        'u 202 is in the schedule ONCE, as the UNIQUE em081_00_000 record and not the SEQUENCE em081_00_003 one',
        evOf(202).map(e => e.def.efl));
  for (const m of ['Motion[3]', 'Motion[4]', 'Motion[23]', 'Motion[24]']){
    await play('2', m); await frames(4); await steps(2);
    check(evReqs2(202).includes('r'), 'L2 ' + m + ' (a tail-charging attack): the arc u 202 is held', evReqs2(202));
  }
  await play('4', 'Motion[62]'); await frames(4); await steps(2);
  check(evReqs2(202).includes('r'), 'L4 Motion[62] (the last tail-charging attack): the arc u 202 is held', evReqs2(202));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs2(202).includes('r'), 'and off those attacks it is stopped, as the ROM stops it at the next action start',
        evReqs2(202));

  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1];
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckAstalos;
