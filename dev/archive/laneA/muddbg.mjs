// laneA/muddbg.mjs (effects lane A, 2026-10-25): Barroth -- the mud byte (motion-states.js shellMudInput) under every Parts row option,
// and under pairs of options, to find a state with the back bare and the head muddy (u 340's bits 15-16 on L2 M12 / M13).
async function dbg(){
  const V = window.__view, MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'); if (![...monSel.options].some(o => o.value === 'em044_00')) monSel.add(new Option('em044_00', 'em044_00')); monSel.value = 'em044_00'; await monSel.onchange(); await frames(60);
  const mud = () => MS.shellMudInput('em044_00', V.mounted.main && V.mounted.main.userData.partsDrawn);
  const rows = [...document.querySelectorAll('[data-row]')].filter(f => { const s = f.querySelector('select'); return s && s.options.length > 1; });
  const log = [['default', mud()]];
  for (const f of rows){
    const s = f.querySelector('select'), v0 = s.value;
    for (const o of [...s.options]){ s.value = o.value; s.dispatchEvent(new Event('change')); await frames(6); log.push([f.dataset.row + ' ' + (f.textContent || '').trim().slice(0, 24), o.textContent.trim(), mud()]); }
    s.value = v0; s.dispatchEvent(new Event('change')); await frames(4);
  }
  return [[true, 'MUD', JSON.stringify(log)]];
}
export const pageCheck = dbg; export const args = [[]];
