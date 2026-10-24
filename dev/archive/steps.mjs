// Per-step timing of a monster switch (the instrumented index.html copy's window.__TM marks)
async function steps(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel');
  for (const MON of ['em088_00', 'em077_00', 'em001_00', 'em088_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    window.__TM = [];
    const t0 = performance.now();
    window.__TM.push(['onchange', t0]);
    monSel.value = MON; await monSel.onchange();
    window.__TM.push(['onchange done', performance.now()]);
    const marks = window.__TM.map(([l, t], i, a) => l + ' +' + Math.round(t - (i ? a[i - 1][1] : t0)));
    out.push([false, MON, marks.join(' | ')]);
  }
  return out;
}
export const pageCheck = steps;
