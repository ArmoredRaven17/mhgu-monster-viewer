// Barroth's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself.
// BARROTH (em044_00): E:/offline/decode/notes/states-em044_00.md.
// HIS MUD COMES OFF ON EVERY DEPLETION, not on a break: `vtable +0x24c` runs at the head of the shared break
// routine, so a hit that breaks nothing still strips that part's mud and fires its record. THE FORELEGS ARE BOTH
// AT ONCE -- his one break row and the foreleg mud-shed are the same event, two records in one frame on the same
// joint -- and L4 M3 / L4 M7 put ALL SIX mud groups back. Those are the rows this check exists for.
// HE HAS TWO SEVERS: the tail (wired, it drops) and his HEAD BREAKING OFF (wired as a set and a record; the piece
// has nowhere to fly, because CUT_TAIL carries one piece per monster).
async function pageCheckBarroth(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Barroth: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em044_00';
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
  check(byWhen.event >= 17 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 17 event (6 mud + the break + both severs + the landing + the burrow + 6 ailments) and 2 ragePuff', byWhen);
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 142, 'his cut tail is on joint 142', TO.CUT_TAIL[MON]);
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
  // A CYCLE'S PHASE IS NOT OURS TO ASSUME. `motionStates.plays` counts every frame 0 a motion has ever had on
  // this runtime instance, so which spec a cycle shows when a check arrives depends on what ran before it.
  // `rounds` plays a motion n times, landing on a clip with no table entry between plays, and returns what
  // each play fired and drew -- so the assertions below say WHAT the cycle contains, which is its promise,
  // rather than the order it happens to be in.
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
  const REST = ['0', 'Motion[2]'];           // his combat idle: no table entry
  const LAND = ['3', 'Motion[21]'];
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();

  // L3 M2: THE HEAD'S MUD, THE BACK'S MUD, THE FORELEGS -- one state per play
  const mud = await rounds('3', 'Motion[2]', 3);
  check(mud.some(r => r.fired.includes(100) && isSet(r.d, 10)),
        'one play of L3 Motion[2] takes the head\'s mud off (set 10), u 100', mud.map(r => r.fired));
  check(mud.some(r => r.fired.includes(110) && isSet(r.d, 14)),
        'another takes the back\'s (set 14), u 110', mud.map(r => r.fired));
  // THE FORELEGS' PLAY FIRES BOTH RECORDS AT ONCE, and that is what the note reads: L3 M2 as (10, 7) with part
  // 2 makes "two changes at once: set 11 -> set 12 (the foreleg mud, group 5, 138 v, off) and set 5 -> set 6
  // (group 6, 215 v, off; group 7, 116 v, on)", firing "both u 120 (em044_00_006) and u 1010 (cm202_060) --
  // same frame, same place", joint 100 at (0, -250, 0) (states-em044_00.md 0). His forelegs are the ONLY part
  // with a .dtp row and its level is 1 at every rank, so no depletion of them takes the mud off without
  // breaking them: the earlier UNBROKEN form of this assertion described a state the ROM does not have.
  check(mud.some(r => r.fired.includes(120) && r.fired.includes(1010) && isSet(r.d, 12) && isSet(r.d, 6)),
        'and the forelegs\' play: the mud goes (set 12) and the leg breaks (set 6), u 120 and u 1010 together',
        mud.map(r => r.fired));
  check(await pick('5+6,7', 'Broken'), 'the Hands row set to Broken');
  const broken = await rounds('3', 'Motion[2]', 3);
  check(broken.some(r => r.fired.includes(120) && r.fired.includes(1010) && isSet(r.d, 12) && isSet(r.d, 6)),
        'and broken, that same play fires BOTH records in one frame -- u 120 for the mud and u 1010 for the break -- with sets 12 and 6',
        broken.map(r => r.fired));
  await pick('5+6,7', 'Mud');

  // HIS HEAD BREAKS OFF, and the tail is cut
  check(await pick('2+3,4', 'Broken'), 'the Head row set to Broken');
  const headOff = await rounds('3', 'Motion[1]', 2);
  check(headOff.some(r => r.fired.includes(901) && isSet(r.d, 4)),
        'one play of L3 Motion[1] BREAKS HIS HEAD OFF -- set 4, u 901 on joint 3', headOff.map(r => r.fired));
  check(headOff.some(r => r.fired.includes(1109)),
        'and the other is the EXHAUST status: c 1109', headOff.map(r => r.fired));
  check(await pick('11+12,101', 'Severed'), 'the Tail row set to Severed');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[16]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 8), 'L3 Motion[16]: the tail severed (set 8), u 900 on joint 142', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted, so `drops` has something to fly', Object.keys(V.mounted));

  // THE MUD RE-COAT, and the burrow's held record
  await play(LAND[0], LAND[1]); await frames(2);
  await play('4', 'Motion[3]'); await frames(3);
  const dMud = drawn();
  check(isSet(dMud, 9) && isSet(dMud, 13) && isSet(dMud, 15) && isSet(dMud, 17) && isSet(dMud, 19),
        'L4 Motion[3] (wallowing): ALL SIX mud groups come back on at once', dMud);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play('0', 'Motion[6]'); await frames(4); await steps(2);
  check(evReqs(1400).includes('r'), 'L0 Motion[6] (burrowed travel): u 1400 is HELD, not fired', evReqs(1400));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1400).includes('r'), 'and off the burrow it is stopped', evReqs(1400));
  for (const r of [['2+3,4', 'Mud'], ['11+12,101', 'Mud'], ['5+6,7', 'Mud'], ['8', 'Mud']]) await pick(r[0], r[1]);

  // PARALYSIS, the SHOCK TRAP, the STUN
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[15] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  fired.length = 0;
  await play('3', 'Motion[11]'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1, 'L3 Motion[11] (the shock trap): c 1105 at once', fired);
  await play('3', 'Motion[7]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[7] (a stun chain clip): c 1103 held', evReqs(1103));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // RAGE, TIRED, ASLEEP, DEATH
  puffs.length = 0;
  await play('0', 'Motion[11]'); await steps(95);
  check(S.rage === true, 'L0 Motion[11] (the rage entry, also the ailments\' recovery clip): rage on', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30) && puffs.every(p => p.key === 1121),
        'the puff: at once, then every 30 steps, always key 1121', { n: puffs.length, gaps });
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[10]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[10] (tired, a clip of its own): rage off, drool at once', fired);
  await play('3', 'Motion[13]'); await frames(4);
  check(isSet(drawn(), 1), 'L3 Motion[13] (lying down): his eyes shut (set 1)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[14]'); await frames(4); await steps(2);
  check(count(fired, 1102) === 1 && puffs.length === 0, 'L3 Motion[14] (the sleep hold): the zzz at once and the puff paused', fired);
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[12]', 'Motion[20]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off', { rage: S.rage });
    check(isSet(drawn(), 1),
          'and HIS EYES SHUT at death (set 1): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with -1 in the status-11 block. A check that does not assert this passes while showing the wrong thing, which is how it survived so long', drawn());
  }
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

export const pageCheck = pageCheckBarroth;
