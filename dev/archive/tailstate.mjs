// Glavenus / Hellblade: where Tail State sits in the Parts panel, its options and pick, the tail clip, and the control's
// return home on another monster
async function tailState(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel');
  const order = () => {
    const g = document.getElementById('monGroups');
    const lv = document.getElementById('monLevelRow');
    const prev = lv.previousElementSibling;
    return { inGroups: lv.parentNode === g, after: prev ? (prev.dataset.row || prev.id || prev.tagName) : null,
             label: document.getElementById('monLevelLab').textContent, hidden: lv.hidden,
             options: [...document.getElementById('monLevel').options].map(o => o.textContent), picked: (document.getElementById('monLevel').selectedOptions[0] || {}).textContent };
  };
  const tailRow = () => { const f = [...document.querySelectorAll('#monGroups .field')].find(x => /Tail$/.test((x.querySelector('label') || {}).textContent || ''));
                          const s = f && f.querySelector('select'); return s ? { options: [...s.options].map(o => o.textContent), picked: s.selectedOptions[0].textContent } : null; };
  for (const MON of ['em080_00', 'em080_04', 'em081_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main);
    await frames(10);
    const res = { order: order(), tail: tailRow(), level: V.state.level, clip: M.levelClipFor(MON, V.state.level, V.mounted.main.userData.partsDrawn) };
    if (MON === 'em080_04'){
      const sel = document.getElementById('monLevel');
      sel.value = '0'; sel.onchange({ target: sel }); await frames(5);
      res.heatedClip = M.levelClipFor(MON, V.state.level, V.mounted.main.userData.partsDrawn);
      res.afterHeated = order();
      sel.value = '1'; sel.onchange({ target: sel }); await frames(5);
      res.blastedClip = M.levelClipFor(MON, V.state.level, V.mounted.main.userData.partsDrawn);
    }
    out.push([false, MON, JSON.stringify(res)]);
  }
  return out;
}
export const pageCheck = tailState;
