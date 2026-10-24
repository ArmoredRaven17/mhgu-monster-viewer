const V = window.__view;
const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const out = {};
for (const [mon, row, label, piece] of [['em044_00', '2+3,4', 'Broken', 'em044_00_head'], ['em044_00', '11+12,101', 'Severed', 'em044_00_tail'],
                                         ['em045_04', '1,2,102', 'Broken', 'em045_04_head'], ['em045_04', '4,5,6,7,8,9,101', 'Severed', 'em045_04_tail']]){
  if (monSel.value !== mon){ if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon)); monSel.value = mon; await monSel.onchange(); await wait(1500); }
  const field = document.querySelector('[data-row="' + row + '"]');
  const sel = field && field.querySelector('select');
  if (!sel){ out[mon + ' ' + row] = 'no row select'; continue; }
  const before = !!(V.mounted[piece] && V.mounted[piece].visible);
  const opt = [...sel.options].find(o => o.textContent.trim() === label);
  const prev = sel.value;
  sel.value = opt.value; sel.dispatchEvent(new Event('change')); await wait(400);
  const after = !!(V.mounted[piece] && V.mounted[piece].visible);
  sel.value = prev; sel.dispatchEvent(new Event('change')); await wait(400);
  const back = !!(V.mounted[piece] && V.mounted[piece].visible);
  out[mon + ' ' + row] = { mounted: !!V.mounted[piece], before, after, back };
}
return out;
