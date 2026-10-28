// notice-check.mjs (effects lane, 2026-10-25): the notice marks on the page, per monster (NOTICE_IDS env, comma list). For each:
// the hunter at Default / Front -> c 1200 must start as he is first seen; then Far (25000) -> c 1201 after the memory (the dtbase's
// reload, render/notice-sense.js) runs out. Prints the driver's counts (window.__notice), the eye it used, and the draw meter's rows
// for the two records (starts and draws separately). Run through rcd3.mjs on slot 2.
async function check(ids){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), NS = await import('/render/notice-sense.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  for (const MON of ids){
    const monSel = $('monSel');
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    window.__hunter.set(-1, 0);
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
    const C = V.controls, cam = V.camera;
    cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
    V.state.loop = true;
    V.effectMeter(true, { every: 5 });
    await frames(150);
    const a = window.__notice.now();
    const S = NS.NOTICE_SENSE[MON], mem = S ? S.mem[0] : 2700;
    window.__hunter.set(25000, 0);
    await frames(mem + 120);
    const b = window.__notice.now();
    const rep = V.effectMeterReport();
    V.effectMeter(false);
    const rows = rep.recs.filter(r => /\|(1200|1201)\|/.test(r.key))
      .map(r => ({ k: r.key, st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, px: r.pixMax, verdict: r.verdict }));
    const y16 = M.effectRuntimeInstance().schedule.ownerYaw16();
    const ok = a && b && a.fired.c1200 === 1 && b.fired.c1201 === 1 && rows.filter(r => r.verdict === 'draws').length === 2;
    out.push([!!ok, 'NOTICE ' + MON, JSON.stringify({ seen: a && { cb: a.cb, fired: a.fired, eye: a.last && { A: a.last.A.map(Math.round), yaw: a.last.yaw, pitch: a.last.pitch, unitYaw: y16, dist: Math.round(a.last.dist) } },
                                                   away: b && { cb: b.cb, fired: b.fired }, rows })]);
    window.__hunter.set(-1, 0);
  }
  return out;
}
export const pageCheck = check;
export const args = [[((typeof process !== 'undefined' && process.env.NOTICE_IDS) || 'em001_00').split(',')]];
