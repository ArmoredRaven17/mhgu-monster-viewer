// Velocidrome's page check, loaded by dev/motion-states-check.mjs from dev/checks/. One file per monster, because
// three Effects sessions run at once. The runner serialises `pageCheck` with .toString() and evaluates it IN THE
// PAGE, so it must not close over anything in this module -- everything it needs it imports inside itself.
//
// HE IS THE WHOLE -DROME FAMILY'S CLASS (states-em014_00.md): uEm015_00 / uEm016_00 / uEm034_00 do not exist as
// class strings, and uEm014_00's three em-number switches touch no state visual -- so when Gendrome, Iodrome and
// Giadrome are wired, this check is the template and only their numbers change.
// Two things here no earlier monster has: HIS BREAK SHOWS NOTHING UNTIL LEVEL 3 (durability 90 over three
// depletions, the .dtp row at level 3), and HIS RAGE CHANGES NOTHING ON THE MODEL AT ALL -- the part pass never
// reads isEnraged -- so the shared puff is the whole of it and death has nothing to revert.
async function pageCheckVelocidrome(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Velocidrome: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em014_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'the effect runtime is up');
  const fx = rt(), S = fx.schedule;
  const fired = [];
  const f0 = fx.fire.bind(fx); fx.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  const puffs = [];
  const s0 = S.start.bind(S);
  S.start = e => { if (e.when === 'ragePuff') puffs.push({ key: e.def.record.key, step: S.frame }); return s0(e); };
  const byWhen = {};
  for (const e of S.entries) byWhen[e.when] = (byWhen[e.when] || 0) + 1;
  check(byWhen.event >= 7 && byWhen.ragePuff === 2, 'the schedule holds his state records: 7 event and 2 ragePuff', byWhen);
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
  // Two things this has to get right, both of which produced wrong PASSES and wrong FAILS before:
  //   NO FRAME MAY PASS between the list change and the clip change -- the clip select keeps its index across a
  //   list change, so a frame there plays whatever that index names in the new list.
  //   PREFER _loop OVER _start for a split motion. The harness loops whatever clip is selected and does NOT
  //   advance a _start into its _loop, so looping a short _start restarts the motion -- and its countdowns --
  //   every few frames: Motion[16]_start is 12 frames against a 120-frame _loop, and c 1101 fired six times in
  //   the 65 steps that should have shown two. The _loop segment is also the correct one to dwell in: it sets
  //   loopSeg, which motionStates.step treats as the motion CONTINUING rather than starting over, and its frame 0
  //   still opens the spec because both halves reduce to the same base name.
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    // THREE ORDERED LOOKUPS, not one find with three disjuncts: find() walks the OPTIONS and returns the first
    // that matches any of them, so with a _start/_loop pair it returns whichever appears first in the list --
    // which is the _start, the very clip this is trying to avoid.
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 20 * n + 200); };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[1]'];
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 2) && isSet(user0, 1), 'at rest: the head intact (set 2) and the eyes open (set 1)', user0);

  // THE HEAD BREAK, and the point of it: LEVELS 1 AND 2 SHOW NOTHING. His durability is 90 over three depletions
  // and the .dtp row is at level 3, so only the third changes the model or fires anything.
  check(await pick('2,102', 'Intact'), 'the Head row left Intact');
  await play('3', 'Motion[14]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(3);
  check(same(fired, []) && isSet(drawn(), 2), 'L3 Motion[15] with the head intact: nothing shown, nothing fired', { fired, d: drawn() });
  check(await pick('2,102', 'Broken'), 'the Head row set to Broken');
  await play('3', 'Motion[14]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(3);
  check(same(fired, [1002]) && isSet(drawn(), 4), 'L3 Motion[15] at level 3: set 2 -> 4 (group 102 out, 2 in), u 1002', { fired, d: drawn() });
  await pick('2,102', 'Intact');
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the row back to Intact: the parts are the user\'s again', drawn());

  // RAGE: nothing on the model, and the puff is all of it -- always u 1121, because +0x2a4 is the base stub
  puffs.length = 0;
  await play('0', 'Motion[9]'); await steps(95);
  check(S.rage === true && same(drawn(), user0), 'L0 Motion[9]: rage on, and NOTHING on the model changes with it', { rage: S.rage, d: drawn() });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'every puff is u 1121: key 1120 is never asked for', puffs.map(p => p.key));
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 2 && P.pick() === 0, 'the puff reads joint 2 and its pick is the base stub\'s 0', { joint: P && P.joint, pick: P && P.pick() });
  await play(REST[0], REST[1]); await frames(3);
  const nAfter = puffs.length; await steps(70);
  check(S.rage === false && puffs.length === nAfter, 'another motion, the user calm: rage off, no more puffs', { rage: S.rage });

  // TIRED
  fired.length = 0;
  await play('0', 'Motion[33]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[33] (tired): rage off, drool c 1104 at once', fired);
  await steps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);

  // ASLEEP: his eyes are a real mesh swap, set 1 -> set 3
  await play('3', 'Motion[17]'); await frames(4);
  check(isSet(drawn(), 3), 'L3 Motion[17] (lying down): HIS EYES SHUT (set 3)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(4); await steps(2);
  check(isSet(drawn(), 3) && count(fired, 1102) === 1, 'L0 Motion[19] (the sleep hold): eyes shut and the zzz c 1102 at once', fired);
  await steps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS (the shock trap shares its hold) and the STUN, which is ONE clip -- his .dtb direction mode is 0
  fired.length = 0;
  await play('3', 'Motion[16]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[16] (paralysed): c 1101 at once', fired);
  await steps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play('3', 'Motion[20]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[20] (the stun, one clip, no sided split): c 1103 held, not fired', evReqs(1103));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off it the stun is stopped', evReqs(1103));

  // DEATH: all four direction chains converge here, and HIS EYES STAY OPEN -- death does not raise P+0x5d02, and
  // there is no rage pair to revert because there never was one
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  await play('3', 'Motion[18]'); await frames(4);
  check(S.rage === false && isSet(drawn(), 1), 'L3 Motion[18] (death): rage off even with the user enraged, and HIS EYES STAY OPEN', drawn());
  await play('3', 'Motion[19]'); await frames(4);
  check(S.rage === false && isSet(drawn(), 1), 'L3 Motion[19] (the collapse): the same', drawn());
  await play('3', 'Motion[24]'); await frames(4);
  check(S.rage === false && isSet(drawn(), 1), 'L3 Motion[24] (death in the pit): the same', drawn());
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

export const pageCheck = pageCheckVelocidrome;
