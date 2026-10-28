// laneB3/notice-rage.mjs (lane B3, 2026-10-27): the notice marks with the combat byte as an EVENT (render/notice-sense.js, index.html
// stepNotice) -- per monster (NOTICE_IDS env, comma list), three legs on the page, the draw meter on:
//   A  mounted in its own state (Furious Rajang: both rungs enraged, his look): hunter Default -> c 1200 at first sight; Far -> c 1201
//      after the memory (as <archive>/notice/notice-check.mjs, the control leg);
//   B  hunter Default again (c 1200 again), then the viewer's rage switched ON while he is seen (where the page shows an Enraged
//      choice): the byte goes to 1 and NO mark fires while the hunter stays in sight (ROM: 2 -> 1 fires nothing);
//   C  hunter Far for the 1 -> 0 timeout (mem[1]) plus margin: the byte falls to 0 with nothing fired (ROM: 1 -> 0 fires nothing), then
//      Default: c 1200 fires again although still enraged.
// Prints window.__notice per leg and the meter's rows for c 1200 / c 1201 (starts and draws separately).
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
    // calm first: the State dropdown's first option (Normal; Furious Rajang's first rung)
    monSel.value = MON; await monSel.onchange();
    const st = $('monState');
    if (st && !$('monStateRow').hidden && st.options.length){ st.value = st.options[0].value; st.onchange({ target: st }); }
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
    const C = V.controls, cam = V.camera;
    cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
    V.state.loop = true;
    V.effectMeter(true, { every: 5 });
    const S = NS.NOTICE_SENSE[MON], mem0 = S ? S.mem[0] : 2700, mem1 = S ? S.mem[1] : 2700;
    const snap = () => { const n = window.__notice.now(); return n && { cb: n.cb, fired: { ...n.fired } }; };
    const log = { state0: st && !$('monStateRow').hidden ? st.options[st.selectedIndex].textContent : null, rage0: V.state.rage };
    await frames(150);                     log.A1 = snap();               // Default: c 1200
    window.__hunter.set(25000, 0);
    await frames(mem0 + 120);              log.A2 = snap();               // Far: c 1201
    window.__hunter.set(-1, 0);
    await frames(150);                     log.B1 = snap();               // seen again: c 1200 again
    const rageOpt = st && !$('monStateRow').hidden ? [...st.options].find(o => /^(rage|rung:|lv:)/.test(o.value) && o.value !== st.value && !/Exhausted/.test(o.textContent)) : null;
    if (rageOpt){ st.value = rageOpt.value; st.onchange({ target: st }); log.rageSet = rageOpt.textContent; }
    await frames(150);                     log.B2 = snap();               // enraged while seen: cb 1, nothing new
    log.rage1 = V.state.rage;
    window.__hunter.set(25000, 0);
    await frames(mem0 + mem1 + 180); log.C1 = snap();                 // unseen: the memory (mem0) runs out, THEN the 1 -> 0 timeout (mem1) counts: cb 0, nothing new
    window.__hunter.set(-1, 0);
    await frames(150);                     log.C2 = snap();               // seen while enraged: c 1200 again
    const rep = V.effectMeterReport();
    V.effectMeter(false);
    const rows = rep.recs.filter(r => /\|(1200|1201)\|/.test(r.key))
      .map(r => ({ k: r.key, st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, px: r.pixMax, verdict: r.verdict }));
    const c = x => x ? x.fired.c1200 + '/' + x.fired.c1201 + ' cb' + x.cb : '-';
    const ok = log.A1 && log.A1.fired.c1200 === 1 && log.A2.fired.c1201 === 1 && log.B1.fired.c1200 === 2 &&
               rows.filter(r => r.verdict === 'draws').length === 2;
    out.push([!!ok, 'NOTICE-RAGE ' + MON, 'c1200/c1201 fired: A1 ' + c(log.A1) + ' A2 ' + c(log.A2) + ' B1 ' + c(log.B1) + ' B2 ' + c(log.B2) +
              ' C1 ' + c(log.C1) + ' C2 ' + c(log.C2) + ' ' + JSON.stringify({ state0: log.state0, rage0: log.rage0, rageSet: log.rageSet || null, rage1: log.rage1, mem: [mem0, mem1], rows })]);
    window.__hunter.set(-1, 0);
  }
  return out;
}
export const pageCheck = check;
export const args = [[((typeof process !== 'undefined' && process.env.NOTICE_IDS) || 'em023_05').split(',')]];
