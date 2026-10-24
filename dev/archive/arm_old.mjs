// Nakarkos's page check, loaded by dev/motion-states-check.mjs from dev/checks/ (one file per monster; `pageCheck` is
// serialised and run IN THE PAGE, so it closes over nothing here).
// NAKARKOS'S TENTACLES ON THEIR OWN EFFECT RUNTIMES (board PHASE 3, 2026-10-19; dev/em084_00-effects-spec.md "Tentacle PSL").
// In the game each arm is a unit of its own class (uEmOstgaloaArm, vtable 0x17f6498): its PSL walker reads ITS motion and
// frame on its own lists (em084_00_l_N / r_N), its enable word is its class's (0x107f0e4, psl-mask.js armMask084 -- emulated
// bit for bit, <scratchpad>/zg/jscheckarm.py), its records come from its own pels and hang from its joints. The viewer gives
// each attached arm a runtime of its own (render/rom/effect-mounts.js attachSideEffects; index.html driveArmEffects) on
// docs/effects/em084_00_left.json / _right.json and CLIP_EFFECTS['em084_00_left' / '_right'].
//   1. both runtimes come up on the arms' own mounted models, their unit the frame each arm hangs on;
//   2. the left arm's own list l_2: Motion[1] starts u 10 (bit 0) and u 130 (bit 1) on the LEFT runtime, at the arm's frames,
//      and not u 201 (bit 18 -- the arm word leaves it off with its play's body action (7, 0x9a)); Motion[5] starts u 200 (bit
//      15) and not u 201 (bit 18, off under (7, 0x9b)); the clip key is the arm's list and the mask the arm word;
//   3. nothing of the arm's starts on the body's runtime;
//   4. a step back clears the arm's clip requests; effects off drops both runtimes, on makes them again; another monster
//      drops them.
async function pageCheckNakarkosArms(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Nakarkos arms: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const PM = await import('/render/psl-mask.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em084_00', L = 'em084_00_left', R = 'em084_00_right';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const pickMon = async id => { if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id)); monSel.value = id; await monSel.onchange(); };
  await pickMon(MON);
  check(V.state.id === MON && V.mounted.main && V.mounted[L] && V.mounted[R], 'mounted, with both tentacles', Object.keys(V.mounted));
  await V.effects(false); await V.effects(true);
  const side = k => V.sideEffectRuntimeObj ? V.sideEffectRuntimeObj(k) : null;
  const body = () => M.effectRuntimeInstance();
  const up = () => [L, R].every(k => side(k) && side(k).schedule && side(k).monsterId === k && side(k).root === V.mounted[k]);
  check(await until(() => body() && body().schedule && up(), 900), 'both arm runtimes are up, each on its own mounted model',
        [L, R].map(k => side(k) && [side(k).monsterId, side(k).root === V.mounted[k]]));
  if (!up()) return out;
  check([L, R].every(k => { const u = side(k).unitSource && side(k).unitSource(); return u && u.elements && u.elements.length === 16; }),
        'each runtime\'s unit is the frame its arm hangs on (a matrix)');
  // every clip start, per runtime: (efl, key, the walker's frame)
  const log = { body: [], [L]: [], [R]: [] };
  const hook = (rt, k) => { const S = rt.schedule, f0 = S.startClip.bind(S);
    S.startClip = (efl, key) => { log[k].push({ efl, key, frame: S.clip ? Math.round(S.clip.frame) : null, clip: S.clip && S.clip.key }); return f0(efl, key); }; };
  hook(body(), 'body'); hook(side(L), L); hook(side(R), R);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_start');
    if (!o){ check(false, 'list ' + list + ' has ' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  const clear = () => { for (const k in log) log[k].length = 0; };
  V.state.loop = false;
  const armKeys = new Set();
  for (const k of [L, R]) for (const m of Object.values((M.CLIP_EFFECTS || {})[k] || {})) for (const b of m.bits) armKeys.add(b.efl + '|' + b.key);
  // L2 M1 on the left arm
  {
    await play('l_2', 'Motion[1]'); clear();
    const S = side(L).schedule;
    check(await until(() => S.clip && S.clip.key === L + '|l_2|Motion[1]', 120), 'the left runtime walks the arm\'s own clip, l_2 Motion[1]', S.clip && S.clip.key);
    const want = PM.armMask084('l_2', 1, 'l', PM.armPlay084('l_2', 1, 0), { rage: false, tired: false });
    check(S.clip && S.clip.mask === want, 'its mask is the arm word 0x107f0e4 (armMask084)', [S.clip && S.clip.mask, want]);
    // (u 130 is on 105..140: the step back is taken while it runs)
    const live = () => side(L).schedule.entries.filter(e => e.when === 'clip' && e.requests.some(q => !q.stopped)).length;
    await until(() => log[L].some(x => x.key === 10) && log[L].some(x => x.key === 130), 900);
    await frames(240);
    const before = live();
    const k10 = log[L].find(x => x.key === 10), k130 = log[L].find(x => x.key === 130);
    check(k10 && Math.abs(k10.frame - 114) <= 2, 'u 10 (bit 0, on 114) starts on the left runtime at the arm\'s frame 114', k10);
    check(k130 && Math.abs(k130.frame - 105) <= 2, 'u 130 (bit 1, on 105) at 105', k130);
    check(!log[L].some(x => x.key === 201), 'u 201 (bit 18) does not start: the arm word leaves it off under (7, 0x9a)', log[L]);
    check(!log.body.some(x => armKeys.has(x.efl + '|' + x.key) && (x.key === 10 || x.key === 130)), 'nor do they start on the body\'s runtime',
          log.body);
    // a step back takes the arm's clip requests off
    document.getElementById('animFirst').onclick();
    await frames(2);
    check(before > 0 && live() === 0, 'a step back clears the arm\'s clip requests', [before, live()]);
  }
  // L2 M5: u 200 on, u 201 off
  {
    await play('l_2', 'Motion[5]'); clear();
    await until(() => log[L].some(x => x.key === 200), 600);
    await frames(120);
    check(log[L].some(x => x.key === 200), 'l_2 Motion[5]: u 200 (bit 15) starts on the left runtime', log[L]);
    check(!log[L].some(x => x.key === 201), 'and u 201 (bit 18) does not, under (7, 0x9b)', log[L]);
  }
  // off drops both; on makes them again; another monster drops them
  await V.effects(false); await frames(3);
  check(!side(L) && !side(R), 'effects off: both arm runtimes are gone');
  await V.effects(true);
  check(await until(up, 900), 'effects on: made again');
  await pickMon('em021_00'); await frames(5);
  check(!side(L) && !side(R), 'another monster: both arm runtimes are gone');
  return out;
}
export const pageCheck = pageCheckNakarkosArms;
