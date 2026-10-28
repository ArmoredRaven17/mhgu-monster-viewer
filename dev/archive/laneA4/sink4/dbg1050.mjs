// laneA4/sink4/dbg1050.mjs (lane A4, 2026-10-26): Elderfrost's trunk level as motion-states.js trunkSnow083 sees it, before and after the
// Parts row is set to Partial Ice (the drawn map: mounted.main.userData.partsDrawn; the table: monsters.json groups)
async function dbg(){
  const V = window.__view, MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'); if (![...monSel.options].some(o => o.value === 'em083_04')) monSel.add(new Option('em083_04', 'em083_04'));
  monSel.value = 'em083_04'; await monSel.onchange(); await frames(20);
  const M = await import('/render/monster.js'); await V.effects(false); await V.effects(true);
  for (let i = 0; i < 900 && !(M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em083_04'); i++) await frames(1);
  await frames(20);
  const req = () => { const rt = M.effectRuntimeInstance(); return rt.schedule.entries.filter(x => x.def.record && [1050, 1051].includes(x.def.record.key)).map(x => x.def.record.key + ':' + x.when + ':' + x.requests.length + '/' + x.def.when).join(' ') + ' clip ' + V.state.list + '|' + (V.pose.action && V.pose.action.getClip().name); };
  const mons = await (await fetch('/monsters.json')).json();
  const L = Array.isArray(mons) ? mons : (mons.monsters || Object.values(mons));
  const e = L.find(x => x && x.id === 'em083_04'); const table = e.groups;
  const dr = () => V.mounted.main.userData.partsDrawn;
  const show = tag => { const d = dr(); return tag + ': level ' + MS.trunkSnow083('em083_04', table, d) + ' drawn ' + JSON.stringify([3, 4, 41, 54, 64, 74, 75, 76].map(p => d && d.get(p))); };
  const out = [show('default'), 'req0 ' + req()];
  const f = [...document.querySelectorAll('[data-row]')].find(x => x.dataset.row === '3,4,41,54,64,74,75,76');
  const s = f && f.querySelector('select');
  out.push('options ' + (s ? [...s.options].map(o => o.value + '=' + o.textContent.trim()).join(' / ') : 'NO ROW'));
  if (s){ s.value = s.options[1].value; s.dispatchEvent(new Event('change')); await frames(10); out.push(show('after ' + s.options[1].textContent.trim())); out.push('req ' + req()); }
  return [[true, 'DBG1050', JSON.stringify(out)]];
}
export const pageCheck = dbg;
export const args = [[]];
