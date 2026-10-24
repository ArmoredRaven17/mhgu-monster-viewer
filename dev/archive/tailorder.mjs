// Glavenus / Hellblade: the Tail State rungs in order -- each rung's name, the heat parts it draws (40 / 45 / 47), the tail clip
async function tailOrder(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel'), sel = document.getElementById('monLevel');
  for (const MON of ['em080_00', 'em080_04']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main);
    await frames(8);
    const tailF = [...document.querySelectorAll('#monGroups .field')].find(x => /Tail$/.test((x.querySelector('label') || {}).textContent || ''));
    const res = { opens: sel.selectedOptions[0].textContent, tail: [...tailF.querySelector('select').options].map(o => o.textContent),
                  under: (document.getElementById('monLevelRow').previousElementSibling || {}).dataset.row, rungs: [] };
    for (const o of [...sel.options]){
      sel.value = o.value; sel.onchange({ target: sel }); await frames(5);
      const dr = V.mounted.main.userData.partsDrawn;
      res.rungs.push(o.textContent + ': heat parts ' + [40, 45, 47].filter(p => dr && dr.get(p) === true).join('/') + ', clip ' + M.levelClipFor(MON, V.state.level, dr));
    }
    out.push([false, MON, JSON.stringify(res)]);
  }
  return out;
}
export const pageCheck = tailOrder;
