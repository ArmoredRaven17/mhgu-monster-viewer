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
    await until(() => log[L].some(x => x.key === 10) && log[L].some(x => x.key === 130), 900);
    const k10 = log[L].find(x => x.key === 10), k130 = log[L].find(x => x.key === 130);
    check(k10 && Math.abs(k10.frame - 114) <= 2, 'u 10 (bit 0, on 114) starts on the left runtime at the arm\'s frame 114', k10);
    check(k130 && Math.abs(k130.frame - 105) <= 2, 'u 130 (bit 1, on 105) at 105', k130);
    await frames(60);
    check(!log[L].some(x => x.key === 201), 'u 201 (bit 18) does not start: the arm word leaves it off under (7, 0x9a)', log[L]);
    check(!log.body.some(x => armKeys.has(x.efl + '|' + x.key) && (x.key === 10 || x.key === 130)), 'nor do they start on the body\'s runtime',
          log.body);
  }
  const live = k => side(k) ? side(k).schedule.entries.filter(e => e.when === 'clip' && e.requests.some(q => !q.stopped)).map(e => e.def.record.key) : null;
  // L2 M5: u 200 on, u 201 off; a step back while u 200 runs takes it off, on the same runtime
  {
    await play('l_2', 'Motion[5]'); clear();
    await until(() => log[L].some(x => x.key === 200), 600);
    await frames(40);
    check(log[L].some(x => x.key === 200), 'l_2 Motion[5]: u 200 (bit 15) starts on the left runtime', log[L]);
    check(!log[L].some(x => x.key === 201), 'and u 201 (bit 18) does not, under (7, 0x9b)', log[L]);
    const rt0 = side(L), before = live(L);
    document.getElementById('animFirst').onclick();
    await frames(2);
    check(before.includes(200) && side(L) === rt0 && live(L).length === 0, 'a step back clears the arm\'s clip requests (u 200), on the same runtime',
          [before, live(L), side(L) === rt0]);
  }
  // A STEP BACK WITH u 135 RUNNING, on the body (em084_00_007) and both arms (em084_00_050) -- u 135 holds through every idle: the
  // release walks the particle destructor's free-list arm 0xa55ea8 -> 0xa55f20, recorded 2026-10-19 (efx add_em084_00_c135_rel60 /
  // c135l_rel60 / c130l_rel8 / c130l_rel45). The click does not throw, every runtime stays the same object (none dropped), the
  // clip's requests are cleared, and u 135 runs again as the clip plays on
  {
    await play('l_2', 'Motion[1]'); await frames(2);
    await play('0', 'Motion[2]');
    await until(() => (live(L) || []).includes(135), 300);
    await frames(40);
    const rts0 = [body(), side(L), side(R)], before = [live(L), live(R)];
    const bLive = () => body().schedule.entries.filter(e => e.when === 'clip' && e.requests.some(q => !q.stopped)).map(e => e.def.record.key);
    const b0 = bLive();
    let err = null;
    try { document.getElementById('animFirst').onclick(); } catch (e){ err = String(e && e.message || e); }
    await frames(2);
    check(before[0].includes(135) && b0.includes(135) && err === null, 'L0 Motion[2] (u 135 running on the body and both arms): the step back does not throw', [before, b0, err]);
    check([body(), side(L), side(R)].every((x, i) => x === rts0[i] && !x.failed), 'no runtime refused or was dropped', [body().failed, side(L) && side(L).failed]);
    check(live(L).length === 0 && live(R).length === 0 && bLive().length === 0, 'the clip requests are cleared on all three', [live(L), live(R), bLive()]);
    await clipSel.onchange();
    check(await until(() => (live(L) || []).includes(135) && bLive().includes(135), 600), 'and u 135 runs again on the body and the left arm', [live(L), bLive()]);
  }
  // c 800 x3 (dev/em084-class-effects.md 3; index.html stepC800): on L3 M65 (its _loop clip) three requests of c 800, once, each
  // through its own control block -- the point P+0x40.. + the turned tune vec i x size, +0x14 0x40000000 / +0x40 the scale vec 4,
  // +0x1c 3, +8 3 -- held across the loop, stopped (0x329c40(h, 0)) at the next play; none on L3 M66 alone (the latch is the play's)
  {
    const B = body(), E = B.schedule.entries.find(e => e.when === 'event' && e.def.record && e.def.record.pel === 'em084_00c' && e.def.record.key === 800);
    check(!!E, 'c 800 is in the schedule as an event record (em084_00_200)', E && E.def.efl);
    // (index.html C800.on: on since em084_00_200 was recorded, 2026-10-19)
    if (E && V.c800 && V.c800()){
      await play('3', 'Motion[66]'); await frames(30);
      check(E.requests.length === 0, 'L3 Motion[66] alone: no c 800', E.requests.length);
      await play('3', 'Motion[65]_loop');
      await frames(5);
      const m = B.host.m, f = Math.fround;
      const reqs = E.requests.slice();
      check(reqs.length === 3 && reqs.every(q => !q.stopped), 'L3 Motion[65]: three c 800 requests, running', reqs.length);
      // the points, from the unit and the facing the page holds now, by the ROM's arithmetic written out again here
      const P = V.unitGamePos ? V.unitGamePos() : null;
      if (P && reqs.length === 3){
        const D = V.mounted.main.getWorldDirection(V.camera.position.clone());
        const w = Math.trunc(f(f(0.5) + f(f(Math.atan2(D.x, D.z)) * f(10430.3779296875)))) & 0xffff;
        const a = f(f(w) * f(9.58738019107841e-05)), sn = f(Math.sin(a)), cs = f(Math.cos(a)), size = f(V.world.scale.x || 1);
        const want = [[430, 250, 1350], [420, 280, 1200], [410, 310, 1050]].map(([x, y, z]) =>
          [f(f(P[0]) + f(f(f(x * cs) + f(z * sn)) * size)), f(f(P[1]) + f(y * size)), f(f(P[2]) + f(f(f(z * cs) - f(x * sn)) * size))]);
        const got = reqs.map(q => [m.f32(q.requester + 0xc0), m.f32(q.requester + 0xc4), m.f32(q.requester + 0xc8)]);
        check(got.every((g, i) => g.every((v, k) => Math.abs(v - want[i][k]) < 1e-3)), 'each at P+0x40 + its turned tune vec x size (+0xc0..)', { got, want });
        check(reqs.every(q => (m.u32(q.requester + 0x14) & 0x40000000) && (m.u32(q.requester + 0x1c) & 3) === 3 && m.u32(q.requester + 8) === 3 &&
                              Math.abs(m.f32(q.requester + 0x40) - 1.8) < 1e-6 && Math.abs(m.f32(q.requester + 0x44) - 2.3) < 1e-6),
              'its block: +0x14 |= 0x40000000, +0x40.. (1.8, 2.3, 1.8), +0x1c |= 3, +8 = 3');
      } else check(false, 'the page gives unitGamePos to the check');
      await frames(200);
      check(E.requests.length === 3 && E.requests.every(q => !q.stopped) && !B.failed, 'held across the loop, no more requested, no refusal',
            [E.requests.length, B.failed]);
      await play('3', 'Motion[66]'); await frames(2);
      check(reqs.every(q => q.stopped) && E.requests.filter(q => !q.stopped).length === 0, 'the next play stops all three');
    }
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
