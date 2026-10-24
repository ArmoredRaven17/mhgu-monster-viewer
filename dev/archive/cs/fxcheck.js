const V = window.__view;
const q = new URLSearchParams(location.search);
const RUN = 'colour-space-' + (q.get('csrun') || 'x');
const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const out = {};
if (![...monSel.options].some(o => o.value === 'em001_00')) monSel.add(new Option('em001_00', 'em001_00'));
monSel.value = 'em001_00'; await monSel.onchange(); await wait(2500);
try { await V.effects(false); } catch (e) {}
V.frameAll();
async function snap(name, settle = 1500){
  await wait(settle);
  V.state.matAnim = false;
  try { const r = await V.shot(RUN, name, 0); out[name] = r.saved; } finally { V.state.matAnim = true; }
}
await snap('fx_off');
document.querySelector('#fxRow .btn[data-fx="photo"]').click(); await snap('fx_photo', 600);
document.querySelector('#fxRow .btn[data-fx="off"]').click(); await snap('fx_off2', 600);
out.errors = (window.__errors || []).slice(-5);
return out;
