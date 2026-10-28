// actmot/mountcheck.mjs (action-motion census lane, 2026-10-27): the page mounts headless; Hyper Off still answers null; holding a
// Hyper pair loads docs/action-motions.json and hyperMotionAt's census branch then answers from it (Rathian below G, pair 1,3:
// L1 M16 -- (4, 1) x1.3 and seven unmodified actions -> 'ambiguous', factor 1; Rathalos pair 1,3: L4 M41 -> 'census').
//   node dev/archive/actmot/rcd.mjs dev/archive/actmot/mountcheck.mjs
async function check(){
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  await frames(30);
  const V = window.__view, out = [];
  out.push([!!(V && V.renderer), 'MOUNT', String(V.state.id)]);
  out.push(['__hyperMotion' in window ? window.__hyperMotion === null : true, 'HYPER OFF = null', String(window.__hyperMotion)]);
  const t = await (await fetch('/action-motions.json')).json();
  out.push([!!(t.em001_00 && t.em001_00.motions['1|Motion[16]'] && t.em001_00.motions['1|Motion[16]'].includes('4:0x01')), 'TABLE',
            Object.keys(t).length + ' keys; em001_00 L1 M16 <- ' + JSON.stringify(t.em001_00.motions['1|Motion[16]'])]);
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip'), sel = $('monHyper');
  for (const [MON, pair, L, clip, want] of [['em001_00', '1,3', '1', 'Motion[16]', 'ambiguous'], ['em002_00', '1,3', '4', 'Motion[41]', 'census']]){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    V.state.questRank = 3; await frames(60);            // (the per-frame Hyper row resets state.hyper on a monster change)
    await until(() => [...sel.options].some(o => o.value === pair), 600);
    sel.value = pair; sel.dispatchEvent(new Event('change')); await frames(2);
    if (listSel.value !== L){ listSel.value = L; await listSel.onchange(); await frames(2); }
    if (![...clipSel.options].some(o => o.value === clip)){ out.push([false, MON + ' ' + clip, 'clip not offered']); continue; }
    clipSel.value = clip; await clipSel.onchange();
    let hm = null;
    if (want === 'census') await until(() => { hm = window.__hyperMotion; return hm && hm.how === 'census'; }, 600);
    else { await frames(120); hm = window.__hyperMotion; }              // ambiguous, no hook: hyperMotionAt answers null (factor 1)
    const ok = want === 'census' ? !!(hm && hm.how === 'census' && hm.factor !== 1)
                                 : (hm === null || hm.factor === 1) && (!V.pose.action || V.pose.action.timeScale === 1);
    out.push([ok, `${MON} ${pair} L${L} ${clip} -> ${want}`, JSON.stringify(hm) + ' ts ' + (V.pose.action && V.pose.action.timeScale)]);
    sel.value = ''; sel.dispatchEvent(new Event('change')); await frames(2);
  }
  return out;
}
export const pageCheck = check;
export const args = [[]];
