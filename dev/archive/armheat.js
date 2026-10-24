const V = window.__view;
const monSel = document.getElementById('monSel');
if (![...monSel.options].some(o => o.value === 'em084_00')) monSel.add(new Option('em084_00', 'em084_00'));
monSel.value = 'em084_00'; await monSel.onchange();
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const t0 = performance.now();
while (!(V.mounted.em084_00_left && V.mounted.em084_00_right) && performance.now() - t0 < 20000) await wait(250);
await wait(800);
const errs = []; window.addEventListener('error', e => errs.push(String(e.message)));
document.getElementById('hitZonesPanel').dataset.open = 'true';
const heat = document.getElementById('monHeat');
heat.value = 'cut'; heat.dispatchEvent(new Event('change'));
await wait(2500);
const colourStats = name => {
  const seen = new Map(); let meshes = 0, noColor = 0;
  V.mounted[name].traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh) || o.userData.prim === undefined) return;
    meshes++;
    const c = o.geometry.getAttribute('color');
    if (!c){ noColor++; return; }
    for (let i = 0; i < c.count; i += 7){ const k = [c.getX(i), c.getY(i), c.getZ(i)].map(v => v.toFixed(2)).join(','); seen.set(k, (seen.get(k) || 0) + 1); }
  });
  return { meshes, noColor, distinct: seen.size, top: [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4) };
};
const rows = [...document.querySelectorAll('#monZoneWrap table')].map(t => ({ pane: t.dataset.pane,
  rows: [...t.querySelectorAll('tbody tr')].map(tr => [...tr.cells].map(c => c.textContent).join('|')).filter(r => /Tentacle/.test(r)) }));
return { heat: heat.value, left: colourStats('em084_00_left'), right: colourStats('em084_00_right'), main: colourStats('main'), rows, errs };
