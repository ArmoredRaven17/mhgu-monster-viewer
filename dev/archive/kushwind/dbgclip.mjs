// kushwind/dbgclip.mjs: a monster's lists and clip options after mounting (why a shot found no action)
async function dbgClip(mon){
  const V = window.__view, $ = id => document.getElementById(id);
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const monSel = $('monSel'); if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange(); await frames(10);
  return [[true, mon, JSON.stringify({ id: V.state.id, list: V.state.list, lists: [...$('monList').options].map(o => o.value), clips: [...$('monClip').options].slice(0, 12).map(o => o.value), action: !!V.pose.action })]];
}
export const pageCheck = dbgClip;
export const args = [['em058_00']];
