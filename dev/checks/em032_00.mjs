// The Tigrex family's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE, TWO MONSTERS:
// there is no `uEm032_04` -- getDTI 0xe345f4 appears exactly once in main.data -- so all 0x480 slots hold the same
// function for both and the override diff is empty in BOTH directions. The function is serialised with
// .toString() and evaluated IN THE PAGE, so it must not close over anything in this module.
// TIGREX / GRIMCLAW (em032_00, em032_04): E:/offline/decode/notes/states-em032_00.md.
// HIS `vtable +0x23c` IS THE FIRST HYBRID: Savage's PARITY for the hind legs (parts 5 and 7 -- and 0 is even, so
// it fires from the first depletion and alternates) and Gammoth's "breakLevel EQUALS the threshold" for the
// forelegs, BUT ONLY ON VARIANT 4. So Tigrex's own breaks all take (10, 7) on any depletion and keep `at: 1`,
// while Grimclaw's forelegs sit on the (10, 0x14) chains with `at: 3`. Both halves are asserted below.
// RAGE ADDS A MESH AND SWAPS AN EYE ON TIGREX and SWAPS THE BODY AND NOTHING ELSE ON GRIMCLAW, both held for as
// long as isEnraged rather than for a clip -- so they are RAGE_PARTS, and the checks read them off the toggle.
async function pageCheckTigrex(MON, NAME, U, DEVIANT){
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
  const byWhen = {};
  for (const e of S.entries) byWhen[e.when] = (byWhen[e.when] || 0) + 1;
  check(byWhen.event === 11 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 11 event and 2 ragePuff', byWhen);
  const pels = {};
  for (const e of S.entries) if (e.def.record) pels[e.def.record.pel] = (pels[e.def.record.pel] || 0) + 1;
  check(pels['em032_00c'] > 0 && pels[U] > 0 && !pels['em032_04c'],
        'they come from em032_00c for the ailments -- byte-identical in both arcs, and there is no em032_04c.pel ' +
        '-- and from ' + U + ' for the breaks and the puff', pels);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick() === 0 && P.joint === 4 && P.records.every(r => r[0] === U),
        'his puff is the stub shape on joint 4, at the family\'s non-uniform (0.7, 1.3, 1.3)', { joint: P && P.joint });
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 143, 'his cut tail is on joint 143', TO.CUT_TAIL[MON]);
  const RP = MS.RAGE_PARTS[MON];
  check(DEVIANT ? (RP && RP.calm.join() === '0' && RP.enraged.join() === '1')
                : (RP && RP.calm.join() === '0,2' && RP.enraged.join() === '1,3'),
        DEVIANT ? 'his RAGE_PARTS is the body alone (0 -> 1): his .mpm sets 2 and 3 are the SAME list, so rage ' +
                  'changes nothing about his eyes'
                : 'his RAGE_PARTS is the body AND the eye (0, 2 -> 1, 3): rage ADDS group 4 rather than swapping, ' +
                  'and his vtable +0x1c8 is live, picking the eye mesh from P+0x5cfc & 1', RP);
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
  // THE TWO CLOCKS: `every:` countdowns are stepped in CLIP frames by motion-states.step, the puff's cadence in
  // SCHEDULE frames by schedule.js, and this harness runs one clip frame per two schedule steps.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[25]'];        // his combat idle: no table entry
  const LAND = ['3', 'Motion[3]'];         // the common recovery clip -- (10, 0x2a) / (10, 0x2b) / (10, 0x70)
  // A CYCLE'S PHASE IS NOT ASSUMABLE: take N plays from a clean landing and assert the SET of what they show.
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

  // L3 M2 -- five hats on Tigrex, three on Grimclaw
  const m2 = await rounds('3', 'Motion[2]', DEVIANT ? 3 : 5);
  check(m2.some(x => same(x.fired, [1105])), 'L3 Motion[2] carries the SHOCK TRAP: c 1105 at once', m2.map(x => x.fired));
  check(m2.some(x => same(x.fired, [1109])), 'and the tune+0x44 status: c 1109 once at frame 0', m2.map(x => x.fired));
  if (!DEVIANT){
    check(m2.some(x => same(x.fired, [1020]) && isSet(x.d, 8)),
          'and the +X FORELEG at level 1: set 7 -> 8, u 1020 on JOINT 62 -- (10, 7) on ANY depletion, because his ' +
          'own +0x23c returns 0 for parts 0..3', m2.map(x => x.fired));
    check(m2.some(x => same(x.fired, [1030]) && isSet(x.d, 10)),
          'and the -X FORELEG: set 9 -> 10, u 1030 on JOINT 72', m2.map(x => x.fired));
  } else {
    // GRIMCLAW'S FORELEGS ARE ON THE (10, 0x14) CHAINS, reached only as the level lands on 3
    const r10 = await rounds('3', 'Motion[10]', 2);
    check(r10.some(x => same(x.fired, [1022]) && isSet(x.d, 8)),
          'L3 Motion[10] (the (10, 0x14) chain): the +X FORELEG at LEVEL 3 -- set 7 -> 8 and u 1022 on JOINT 40, ' +
          'shown unasked because his +0x23c sends part 4 there only as the break lands', r10.map(x => x.fired));
    const r7 = await rounds('3', 'Motion[7]', 2);
    check(r7.some(x => same(x.fired, [1032]) && isSet(x.d, 11)),
          'L3 Motion[7]: the -X FORELEG at LEVEL 3 -- sets 9/10 -> 11 (the rage pair 28 / 38 both off) and u 1032 ' +
          'on JOINT 50', r7.map(x => x.fired));
  }

  // THE TAIL SEVER
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[4]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), DEVIANT ? 13 : 12),
        'L3 Motion[4]: the tail severed -- set ' + (DEVIANT ? 13 : 12) + ' (the stump on, the tail off) and u 900 ' +
        'on JOINT 143. Neither monster\'s tail has a .dtp row, so there is no broken level', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));

  // RAGE, on both of its clips, and what RAGE_PARTS puts on the model
  await play(REST[0], REST[1]); await frames(3);
  puffs.length = 0;
  await play('0', 'Motion[27]'); await steps(95);
  check(S.rage === true, 'L0 Motion[27] ((7, 6), the first half of the rage entry): rage on', { rage: S.rage });
  check(isSet(drawn(), 1),
        DEVIANT ? 'and the BODY SWAPS: set 0 -> 1, group 20 (1147 v) off for groups 30 and 31 (1745 v together)'
                : 'and the ANGRY MESH IS ADDED: set 0 -> 1 turns group 4 on, 214 vertices of XfBA_A0__m01_angry -- ' +
                  'added, not swapped', drawn());
  check(DEVIANT ? true : isSet(drawn(), 3),
        DEVIANT ? 'and his EYES DO NOT CHANGE (sets 2 and 3 are the same list)'
                : 'and the EYE SWAPS: set 2 -> 3, his live vtable +0x1c8 reading P+0x5cfc & 1', drawn());
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  await play('2', 'Motion[6]'); await frames(4);
  check(S.rage === true, 'L2 Motion[6] ((1, 5), the second half): rage on there too', { rage: S.rage });

  // TIRED
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[30]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[30] (the tired idle, a clip of its own -- his combat idle is L0 Motion[25]): rage off and the ' +
        'drool c 1104 at once', { rage: S.rage, fired });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'and the drool again 48 clip frames on', fired);

  // ASLEEP
  await play(REST[0], REST[1]); await frames(3);
  await play('0', 'Motion[22]'); await frames(3);
  check(isSet(drawn(), 4), 'L0 Motion[22] (lying down, and also capture): his eyes shut -- set 4, the 16-vertex lid', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[20]'); await frames(3); await steps(2);
  check(isSet(drawn(), 4) && count(fired, 1102) === 1, 'L0 Motion[20] (the hold): the lid stays and the zzz at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 clip frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS and the STUN
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed, and the shock trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 clip frames on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[11]', 'Motion[12]', 'Motion[8]', 'Motion[9]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'),
          'L3 ' + clip + ' (a stun chain clip, and also a hind leg\'s parity chain -- neither hind leg has a .dtp ' +
          'row): c 1103 held', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chains it is stopped', evReqs(1103));

  // DEATH
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play('3', 'Motion[6]'); await frames(4);
  check(S.rage === false, 'L3 Motion[6] (death, and the end of both death chains): the rage shown goes off, so the ' +
        'rage pair reverts the same frame', { rage: S.rage });
  check(isSet(drawn(), 4),
        'and HIS EYES SHUT (set 4): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with ' +
        '-1 in the status-11 block', drawn());
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

export const pageCheck = pageCheckTigrex;
export const args = [['em032_00', 'Tigrex', 'em032_00u', false],
                     ['em032_04', 'Grimclaw Tigrex', 'em032_04u', true]];
