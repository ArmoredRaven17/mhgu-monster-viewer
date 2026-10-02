// Alatreon's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself.
// ALATREON (em050_00): E:/offline/decode/notes/states-em050_00.md.
// HE IS THE ONE MONSTER WHOSE PUFF PICK IS `() => 1`, and this check exists partly to defend that: his puff is not
// the shared 0xa41b8 one (his class writes e+0xb7d2 = 0 and runs its own), his two records are two DIFFERENT effect
// files rather than the usual identical pair, and his RED record -- what forms 0 and 1 ask for -- is records[0],
// which schedule.js only selects when pick() === 1. A "fix" to () => 0 would silently show the blue puff.
// HIS BREAK ROUTING IS BY PARITY: odd levels play L3 M1, even ones the L3 M12 chain -- so his first horn breaks on
// one clip and his second (and every other part) on the other.
// AND HE HAS NO TIRED STATE, NO SHOCK TRAP, NO PITFALL and NO exhaust status at all; the absences are asserted.
async function pageCheckAlatreon(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Alatreon: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em050_00';
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
  check(byWhen.event >= 11 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 11 event (6 breaks + the sever + the landing + 3 ailments) and 2 ragePuff', byWhen);
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(!keys.includes(1104) && !keys.includes(1105) && !keys.includes(1109),
        'and NO drool, NO shock-trap and NO exhaust record: he has no tired state and those numbers have no handler', keys);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick() === 1,
        'HIS PICK IS () => 1, which selects his RED record -- his puff is his class\'s own, not the shared one whose id is inverted',
        { pick: P && P.pick() });
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 144, 'his cut tail is on joint 144', TO.CUT_TAIL[MON]);
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
  const LAND = ['3', 'Motion[10]'];          // the ailments' recovery clip: no table entry
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();

  // THE FIRST HORN on the ODD route, then the EVEN route's five breaks in turn
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1000]) && isSet(drawn(), 11), 'L3 Motion[1] (the odd route): one horn breaks -- set 11, u 1000', { fired, d: drawn() });
  const EVEN = [[1001, 13, 'both horns'], [1021, 16, 'the -X wing'], [1016, 17, 'the +X wing'],
                [1031, 14, 'the -X front leg'], [1026, 15, 'the +X front leg']];
  for (const [key, set, what] of EVEN){
    await play(LAND[0], LAND[1]); await frames(2);
    fired.length = 0;
    await play('3', 'Motion[12]'); await frames(3);
    check(same(fired, [key]) && isSet(drawn(), set),
          'L3 Motion[12] shows ' + what + ': set ' + set + ', u ' + key, { fired, d: drawn() });
  }

  // THE TAIL SEVER
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 10), 'L3 Motion[13]: the tail severed (set 10), u 900 on joint 144', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));

  // RAGE and the puff -- every puff must be his RED record, 1120
  await play(REST[0], REST[1]); await frames(3);
  puffs.length = 0;
  await play('0', 'Motion[14]'); await steps(95);
  check(S.rage === true, 'L0 Motion[14] (the rage entry): rage on', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1120),
        'and every puff is KEY 1120, his RED record -- the one forms 0 and 1 ask for', puffs.map(p => p.key));

  // ASLEEP -- one clip for the fall and the hold -- and PARALYSIS and the STUN
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[11]'); await frames(4); await steps(2);
  check(isSet(drawn(), 9) && count(fired, 1102) === 1,
        'L3 Motion[11] (asleep -- one clip for both halves): his eyes shut (set 9) and the zzz at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[9] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[6]', 'Motion[7]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH: one clip for every status-11 number but 1, and the air death ends on it too
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play('3', 'Motion[8]'); await frames(4);
  check(S.rage === false, 'L3 Motion[8] (death -- he has no status-11 table, so it is every number but 1): the rage shown goes off', { rage: S.rage });
  check(isSet(drawn(), 9),
        'and HIS EYES SHUT at death (set 9): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with -1 in the status-11 block. A check that does not assert this passes while showing the wrong thing, which is how it survived so long', drawn());
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

export const pageCheck = pageCheckAlatreon;
