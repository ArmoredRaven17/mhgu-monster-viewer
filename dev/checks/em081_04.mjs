// Boltreaver Astalos's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER,
// because three Effects sessions run at once and every monster used to add its check to the one shared runner.
// The runner serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over
// anything in this module: everything it needs it imports inside itself.
// BOLTREAVER (em081_04): against E:/offline/decode/notes/states-em081_04.md. He is uEm081_00 with e+0xb5f5 = 4 --
// the same class as Astalos, the same .dtp rows, and his COMMON pel IS em081_00c byte for byte, so every ailment
// record this checks is literally Astalos's record fired for a different monster. That sharing is asserted here
// rather than assumed: if his c.pel were ever re-exported as its own file, these would still pass while the
// records silently doubled, so the check reads the pel NAME off the schedule.
//   WHAT MAKES HIM DIFFERENT IS THAT HE SPAWNS CHARGED. The family mechanic is a three-region charge the part pass
// re-reads every frame; Astalos has tiers 0/2 and spawns at 0, Boltreaver has 0/2/4 and spawns at 2. So his break
// ladders are the CHARGED sets (head 7/8, +X wing 18/19, -X wing 24/25, tail 30/31) where Astalos's table carries
// the plain ones -- the same class, the same breaks, different sets, and that is the thing worth checking.
async function pageCheckBoltreaver(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Boltreaver: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em081_04';
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
  // HIS AILMENTS ARE ASTALOS'S RECORDS. em081_04 ships no c.pel of its own -- the ROM's resource descriptor names
  // effect\pel\em\em081_00c for both monsters -- so every c 11xx entry must carry em081_00c, not em081_04c.
  const pelsOf = keys => S.entries.filter(e => e.when === 'event' && keys.includes(e.def.record.key))
    .map(e => e.def.record.pel).filter((v, i, a) => a.indexOf(v) === i).sort();
  check(JSON.stringify(pelsOf([1101, 1102, 1103, 1104, 1105, 1109])) === JSON.stringify(['em081_00c']),
        'every ailment record is ASTALOS\'s em081_00c -- he ships no c.pel of his own', pelsOf([1101, 1102, 1103, 1104, 1105, 1109]));
  check(JSON.stringify(pelsOf([900, 1001, 1005, 1010, 1015])) === JSON.stringify(['em081_04u']),
        'while the breaks and the sever are his OWN em081_04u', pelsOf([900, 1001, 1005, 1010, 1015]));
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (d, n) => (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const listOf = id => MONSTER.lists.find(l => l.id === id);
  // NO FRAME PASSES BETWEEN THE LIST CHANGE AND THE CLIP CHANGE, and PREFER THE _loop HALF of a pair: the harness
  // loops whatever is selected and never advances a _start into its _loop, so dwelling on a short _start restarts
  // the motion and its countdowns. Three ordered lookups, not one find with three disjuncts -- find() walks the
  // OPTIONS and returns the first matching ANY of them, which on a pair is the _start.
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  // TWO CLOCKS. The rage puff counts SCHEDULE frames (schedule.js's own countdown); motion-states' `every` timers
  // count CLIP frames (step(): d = frame - prev.frame). The pose advances one clip frame per TWO schedule steps on
  // this harness, so waiting `period + 2` schedule steps for a period-48 record waits half of it.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 40 * n + 400); };
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
  check(!!user0, 'at rest: the user\'s own parts, whichever charge rung they have selected', user0);

  // THE BREAKS, on his CHARGED ladders. A break motion shows at least level 1, so a two-level ladder reaches its
  // broken set unaided; the head needs two depletions and level 1 shows nothing (em081_04u has no key 1000).
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1005]) && isSet(drawn(), 10),
        'L3 Motion[2] (the BODY/NECK, part 1): set 9 -> 10, u 1005 -- the one ladder with no charged pair', { fired, d: drawn() });
  fired.length = 0;
  await play('3', 'Motion[3]'); await frames(3);
  check(same(fired, [1015]) && isSet(drawn(), 25),
        'L3 Motion[3] (the -X WINGTALON, part 3): sets 24 -> 25, u 1015 on joint 133 -- CHARGED, where Astalos takes 20 -> 21',
        { fired, d: drawn() });
  fired.length = 0;
  await play('3', 'Motion[4]'); await frames(3);
  check(same(fired, [1010]) && isSet(drawn(), 19),
        'L3 Motion[4] (the +X WINGTALON, part 2): sets 18 -> 19, u 1010 on joint 132 -- CHARGED, where Astalos takes 14 -> 15',
        { fired, d: drawn() });
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(fired.length === 0 && isSet(drawn(), 7),
        'L3 Motion[1] (the HEAD) at the default level: set 7 kept and NOTHING fired -- level 1 has no record', { fired, d: drawn() });
  const head = MS.MOTION_STATES[MON]['3|Motion[1]'];
  check(head && same(head.levels, [[7], [7], [8]]) && same(head.fire[2], ['em081_04u', 1001]),
        'and the table gives him THREE head levels on the CHARGED ladder, 7 -> 8 with u 1001 at level 2', head && head.levels);

  // THE TAIL SEVER, on the charged ladder, and he drops his OWN cut tail
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 136 && TO.CUT_TAIL[MON].piece === 'em081_04_tail',
        'his cut tail is his own model on JOINT 136, the same joint and kind 0x8a as Astalos', TO.CUT_TAIL[MON]);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 31),
        'L3 Motion[15]: the tail severed on the CHARGED ladder (30 -> 31), u 900', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'back at rest: the parts are the user\'s again', drawn());

  // RAGE: nothing on the model, as Astalos. What rage DOES do is charge him, through the group's later (1, 0x12).
  puffs.length = 0;
  await play('0', 'Motion[4]'); await steps(95);
  check(S.rage === true && same(drawn(), user0),
        'L0 Motion[4]: rage on, and NOTHING on the model changes with it', { rage: S.rage, d: drawn() });
  check(!MS.RAGE_PARTS[MON], 'and he has no RAGE_PARTS entry', Object.keys(MS.RAGE_PARTS));
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 4 && P.period === 30 && P.pick() === 0, 'the puff reads joint 4 every 30, pick is the base stub\'s 0',
        { joint: P && P.joint, pick: P && P.pick() });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and EVERY request is u 1121 -- 1120 is never asked for',
        puffs.map(p => p.key));
  await play(REST[0], REST[1]); await frames(3);
  const nAfter = puffs.length; await steps(70);
  check(S.rage === false && puffs.length === nAfter, 'another motion, the user calm: rage off, no more puffs', { rage: S.rage });

  // TIRED -- his own clip, Astalos's drool record
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[14] (tired): rage off, drool c 1104 at once', fired);
  // THE DROOL IS ON THE UNIT'S CLOCK, like the puff (schedule.js stepDrool, TIRED_DROOL): 0xa41b8 counts P+0x5c70 down by
  // [unit+0x1c] x 1.0 a frame (0x7206c -> 0x539d5c, s0 = 1.0 at 0xa42d8) -- the unit's frames, not the clip's -- so it is
  // waited for in schedule `steps`, not `clipSteps`. The countdown keeps its leftover across motions: only the reset
  // (0xba0f4) and rage (0xa42a8) zero it, so tiredness drools at once after rage and then every 48, not at every play.
  await steps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);

  // ASLEEP: his eyes shut from the CHARGED eye set 32 (or 2) to set 1
  await play('3', 'Motion[14]'); await frames(4);
  check(isSet(drawn(), 1), 'L3 Motion[14] (lying down): HIS EYES SHUT (set 1, the lid drawn)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(4); await steps(2);
  check(isSet(drawn(), 1) && count(fired, 1102) === 1, 'L0 Motion[19] (the sleep hold): eyes shut and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 CLIP frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS (the shock trap shares its hold) and the STUN, held across both sided chains
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 CLIP frames on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play('3', 'Motion[5]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[5] (the stun hold): c 1103 held, not fired', evReqs(1103));
  await play('3', 'Motion[7]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[7] (the other chain\'s recovery): still the same held handle', evReqs(1103));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  for (const m of ['Motion[17]', 'Motion[12]', 'Motion[20]']){
    await play('3', m); await frames(4);
    check(S.rage === false, 'L3 ' + m + ' (death): the rage shown goes off even with the user enraged', { rage: S.rage });
  }
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
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

export const pageCheck = pageCheckBoltreaver;
