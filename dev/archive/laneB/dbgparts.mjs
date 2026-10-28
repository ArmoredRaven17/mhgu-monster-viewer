// laneB/dbgparts.mjs: the Parts rows of a monster (MON env), each option, and whether the parts in PARTS env are drawn
async function dbg(mon, parts){
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const $ = id => document.getElementById(id), monSel = $('monSel');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange(); await frames(30);
  const out = [];
  const M = await import('/render/monster.js');
  for (const f of [...document.querySelectorAll('[data-row]')]){
    const s = f.querySelector('select'); if (!s) continue;
    const v0 = s.value;
    for (const o of [...s.options]){
      s.value = o.value; s.dispatchEvent(new Event('change')); await frames(4);
      const d = V.mounted && V.mounted.main && V.mounted.main.userData.partsDrawn;
      out.push(f.dataset.row + ' = ' + o.textContent.trim() + ' : ' + parts.map(p => p + (d && d.get(p) ? '+' : '-')).join(' '));
    }
    s.value = v0; s.dispatchEvent(new Event('change')); await frames(2);
  }
  return [[true, 'PARTS ' + mon, JSON.stringify(out)]];
}
export const pageCheck = dbg;
export const args = [[process.env.MON, JSON.parse(process.env.PARTS || '[]')]];
