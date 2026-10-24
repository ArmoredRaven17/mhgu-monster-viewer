export const args = [];
export async function pageCheck(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const MON = 'em046_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await frames(10);
  listSel.value = '4'; await listSel.onchange();
  await frames(5);
  out.push([false, 'list 4 options', JSON.stringify([...clipSel.options].map(o => o.value))]);
  out.push([false, 'lists', JSON.stringify([...listSel.options].map(o => o.value))]);
  return out;
}
