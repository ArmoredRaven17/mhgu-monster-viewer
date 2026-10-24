// Hellblade on a fresh mount: the Tail row's pick, the tail material's clip, and the heat byte his word reads
async function hellblade(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel');
  const MON = 'em080_04';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await until(() => V.state.id === MON && V.mounted.main);
  await frames(10);
  const rows = [...document.querySelectorAll('#monGroups select, #monGroups [data-row]')].map(el => (el.closest('[data-row]') || el).textContent.trim().slice(0, 40) + ' = ' + (el.value || ''));
  const tailSel = [...document.querySelectorAll('#monGroups select')].find(s => [...s.options].some(o => /Blasted/.test(o.textContent)));
  const clips = V.mounted.main.userData.motionClips || null;
  const all = [...document.querySelectorAll('#monGroups select')].map(sel => ({ id: sel.id, row: (sel.closest('[data-row]') || {}).dataset ? sel.closest('[data-row]').dataset.row : null, value: sel.value, picked: sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].textContent, options: [...sel.options].map(o => o.textContent) }));
  out.push([false, 'selects', JSON.stringify(all)]);
  out.push([false, 'Hellblade on mount', JSON.stringify({ tail: tailSel ? tailSel.options[tailSel.selectedIndex].textContent : null,
    clips: V.motionStates().cur ? V.motionStates().cur.clips : null })]);
  return out;
}
export const pageCheck = hellblade;
