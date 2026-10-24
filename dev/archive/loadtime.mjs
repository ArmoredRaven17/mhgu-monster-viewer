// LOAD TIMES: the page's own navigation timing, then per monster: the switch (monSel.onchange resolved), the model on
// screen, and the effect runtime up. Every number is ms, wall clock, in the headless page.
async function loadProbe(){
  const out = [];
  const nav = performance.getEntriesByType('navigation')[0];
  const res = performance.getEntriesByType('resource');
  const js = res.filter(r => /\.js(\?|$)/.test(r.name));
  const big = js.slice().sort((a, b) => b.duration - a.duration).slice(0, 6).map(r => r.name.replace(/^.*\/docs\//, '').replace(/^https?:\/\/[^/]+\//, '') + ' ' + Math.round(r.duration));
  out.push([false, 'page', JSON.stringify({ domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd),
    resources: res.length, jsCount: js.length, jsKB: Math.round(js.reduce((s, r) => s + (r.transferSize || r.encodedBodySize || 0), 0) / 1024), slowestJs: big })]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel');
  for (const MON of ['em001_00', 'em077_00', 'em088_00', 'em007_00', 'em001_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    const t0 = performance.now();
    monSel.value = MON; await monSel.onchange();
    const t1 = performance.now();
    await until(() => V.state.id === MON && V.mounted.main);
    const t2 = performance.now();
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON && M.effectRuntimeInstance().schedule);
    const t3 = performance.now();
    await frames(30);
    const t4 = performance.now();
    out.push([false, MON, JSON.stringify({ switch: Math.round(t1 - t0), model: Math.round(t2 - t0), effects: Math.round(t3 - t2), thirtyFrames: Math.round(t4 - t3) })]);
  }
  return out;
}
export const pageCheck = loadProbe;
