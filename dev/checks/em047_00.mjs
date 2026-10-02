// Royal Ludroth's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the
// runner serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything
// in this module -- everything it needs it imports inside itself.
// ROYAL LUDROTH (em047_00): E:/offline/decode/notes/states-em047_00.md.
// HE HAS NO RAGE ROW ON PURPOSE: his rage entry action plays L0 M2, which is also his combat idle, so a rage row
// would show rage on the idle. The check asserts the absence, so it reads as a decision rather than an omission.
// HIS PUFF RECORDS ARE HIS OWN FILE (em047_00_002), not the shared cm200_007 that every other monster's are.
// HIS SPONGE AND HIS RAGE FRILLS ARE JOINT WORK (a scale tied to tiredness, a rotation tied to rage) and are not
// in this table at all -- JOINT_SCALE is keyed on rage/alive and index.html decides what to pass it.
async function pageCheckRoyalLudroth(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Royal Ludroth: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em047_00';
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
  check(byWhen.event >= 10 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 10 event (2 breaks + the sever + the landing + 6 ailments) and 2 ragePuff', byWhen);
  const puffDefs = S.entries.filter(e => e.when === 'ragePuff').map(e => e.def.efl);
  check(puffDefs.every(f => /em047_00_002/.test(f)),
        'and HIS PUFF IS HIS OWN FILE, em047_00_002 -- not the shared cm200_007 every other monster uses', puffDefs);
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 143, 'his cut tail is on joint 143', TO.CUT_TAIL[MON]);
  check(!Object.values(MS.MOTION_STATES[MON]).some(s => s.rage === true),
        'and he has NO rage row: his rage entry action plays the same clip as his combat idle, so no clip means rage started');
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
  const REST = ['0', 'Motion[1]'];
  const LAND = ['3', 'Motion[11]'];          // the ailments' recovery clip: no table entry
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 2) && isSet(user0, 3) && isSet(user0, 4),
        'at rest: the head frills, the mane and the tail are intact (sets 2, 3, 4)', user0);

  // THE HEAD at level 1, and THE MANE at level 2 -- and L3 M2's other two hats
  check(await pick('4,101', 'Broken'), 'the Head row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1000]) && isSet(drawn(), 7), 'L3 Motion[1]: the head frills go (set 7), u 1000 on joint 2', { fired, d: drawn() });
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(!fired.includes(1006), 'L3 Motion[2] with the Mane whole: his row is at LEVEL 2, so nothing fires', fired);
  check(await pick('6,102', 'Broken'), 'the Mane row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  await play('3', 'Motion[2]'); await frames(2);                 // 2nd play: the shock trap
  await play(LAND[0], LAND[1]); await frames(2);
  await play('3', 'Motion[2]'); await frames(2);                 // 3rd play: the exhaust
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1006]) && isSet(drawn(), 8),
        'and round again at mane LEVEL 2: set 8 (481 + 133 vertices for 177), u 1006 on joint 101', { fired, d: drawn() });

  // THE TAIL SEVER
  check(await pick('8,103', 'Severed'), 'the Tail row set to Severed');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 9), 'L3 Motion[13]: the tail severed (set 9), u 900 on joint 143', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));
  for (const r of [['4,101', 'Intact'], ['6,102', 'Intact'], ['8,103', 'Intact']]) await pick(r[0], r[1]);
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the rows back to Intact: the parts are the user\'s again', drawn());

  // PARALYSIS and the STUN
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[9] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[6]', 'Motion[7]', 'Motion[8]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (a stun chain clip): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // TIRED, ASLEEP, the puff, DEATH
  const rageBox = document.getElementById('monRage');
  puffs.length = 0;
  if (rageBox){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await steps(95);
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30) && puffs.every(p => p.key === 1121),
        'with the Enraged toggle on, the puff: at once, then every 30 steps, always key 1121', { n: puffs.length, gaps });
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }
  fired.length = 0;
  await play('0', 'Motion[9]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[9] (tired, a clip of its own -- and the state his sponge dries out in): drool at once', fired);
  await play('3', 'Motion[10]'); await frames(4);
  check(isSet(drawn(), 5), 'L3 Motion[10] (lying down): his eyes shut (set 5)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[15]'); await frames(4); await steps(2);
  check(isSet(drawn(), 5) && count(fired, 1102) === 1, 'L0 Motion[15] (the sleep hold): eyes shut and the zzz at once', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);
  if (rageBox){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[12]', 'Motion[17]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off -- which is what sweeps his frills back', { rage: S.rage });
    check(isSet(drawn(), 5),
          'and HIS EYES SHUT at death (set 5): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with -1 in the status-11 block. A check that does not assert this passes while showing the wrong thing, which is how it survived so long', drawn());
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

export const pageCheck = pageCheckRoyalLudroth;
